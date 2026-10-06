import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { assertVideoRecord, canonicalVideoRecord, videoProvenanceArtifactName, VIDEO_WORKFLOW_PATH } from './video-provenance.mjs';
const execute = promisify(execFile);

export function assertTrustedVideoRun(run, record, repository) {
  assertVideoRecord(record, { repository });
  const p = record.provenance;
  if (String(run?.id) !== p.run_id || String(run?.run_attempt) !== p.run_attempt
    || run?.repository?.full_name !== repository || run?.head_repository?.full_name !== repository
    || run?.path !== VIDEO_WORKFLOW_PATH || run?.head_branch !== 'main'
    || run?.head_sha !== p.source_commit || !['push', 'workflow_dispatch'].includes(run?.event)
    || !['in_progress', 'completed'].includes(run?.status)
    || (run.status === 'completed' && run.conclusion !== 'success')) {
    throw new Error('HOLD: video provenance is not from the trusted repository/main video workflow run.');
  }
}

export async function verifyVideoRecordProof(record, { repository = process.env.GITHUB_REPOSITORY, executeCommand = execute } = {}) {
  assertVideoRecord(record, { repository });
  if (!repository || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error('HOLD: trusted repository identity is required.');
  const runId = record.provenance.run_id;
  const options = { encoding: 'utf8', maxBuffer: 1024 * 1024, timeout: 90000 };
  const { stdout } = await executeCommand('gh', ['api', `repos/${repository}/actions/runs/${runId}/attempts/${record.provenance.run_attempt}`], options);
  let run;
  try { run = JSON.parse(stdout); } catch { throw new Error('HOLD: invalid GitHub workflow run response.'); }
  assertTrustedVideoRun(run, record, repository);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'izem-proof-'));
  try {
    await executeCommand('gh', ['run', 'download', runId, '--repo', repository, '--name', videoProvenanceArtifactName(record), '--dir', directory], options);
    const file = path.join(directory, 'record.json');
    if (!fs.existsSync(file) || fs.lstatSync(file).isSymbolicLink() || fs.statSync(file).size > 128000) throw new Error('HOLD: validated upload artifact is missing or invalid.');
    const proof = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (canonicalVideoRecord(proof) !== canonicalVideoRecord(record)) throw new Error('HOLD: repository video record differs from the trusted workflow artifact.');
    return true;
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
}
