import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { runWithSafeFailure } from './notebooklm-recovery-diagnostic.mjs';

const exec = promisify(execFile);
const UUID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

// An exact workflow run AND attempt authorize a single in-place provider retry.
// Scheduled recovery and later attempts cannot repeatedly consume generation quota.
export async function retryRequestedFailedVideo(root, env = process.env, run = exec, log = console.log) {
  const file = path.join(root, 'data/marketing-employee/video-repair-request.json');
  if (!fs.existsSync(file)) return;
  const request = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (request.slug !== env.NOTEBOOKLM_POST_SLUG || request.retryFailedArtifactOnce !== true) return;
  if (!/^\d+$/.test(String(request.retryWorkflowRunId || '')) ||
      !/^\d+$/.test(String(request.retryWorkflowRunAttempt || ''))) throw new Error('Invalid bounded retry authorization.');
  if (String(request.retryWorkflowRunId) !== env.GITHUB_RUN_ID ||
      String(request.retryWorkflowRunAttempt) !== env.GITHUB_RUN_ATTEMPT) return;
  const notebook = String(request.recoverNotebookId || '');
  if (!UUID.test(notebook) || !/^[a-z0-9][a-z0-9-]{1,119}$/.test(request.slug)) throw new Error('Invalid recovery target.');
  const html = fs.readFileSync(path.join(root, 'public/blog', `${request.slug}.html`), 'utf8');
  const title = (html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (!title || !html.includes(`href="https://youraicoach.life/blog/${request.slug}"`)) throw new Error('Article identity could not be verified.');
  const command = env.NOTEBOOKLM_BIN || 'notebooklm';
  async function json(args, timeout = 120000) {
    let result;
    try { result = await runWithSafeFailure(command, args, { cwd: root, env, timeout, maxBuffer: 4 * 1024 * 1024 }, run); }
    catch (error) { throw new Error(`${error.message} No further retry was attempted.`); }
    try { return JSON.parse(String(result.stdout || '').trim()); }
    catch { throw new Error('NotebookLM bounded retry: INVALID_JSON.'); }
  }
  const selected = await json(['use', notebook, '--json']);
  if (selected.verified !== true || selected.notebook?.id !== notebook ||
      !String(selected.notebook?.title || '').startsWith(`IZEM Video - ${title}`)) throw new Error('Recovery notebook identity does not match the article.');
  const sourceResult = await json(['source', 'list', '-n', notebook, '--json']);
  const sources = Array.isArray(sourceResult) ? sourceResult : sourceResult.sources;
  if (!Array.isArray(sources) || sources.length !== 1 || sources[0]?.status !== 'ready') throw new Error('A single ready canonical source is required before retry.');
  const listArgs = ['artifact', 'list', '-n', notebook, '--type', 'video', '--json'];
  const listed = await json(listArgs);
  const artifacts = Array.isArray(listed) ? listed : listed.artifacts;
  if (!Array.isArray(artifacts) || artifacts.length !== 1) throw new Error('Expected exactly one article video; refusing an ambiguous retry.');
  const artifact = artifacts[0];
  if (!UUID.test(String(artifact.id || ''))) throw new Error('Invalid article video identity.');
  if (artifact.status === 'completed') { log('NotebookLM article video is already completed; no retry requested.'); return; }
  if (artifact.status !== 'failed') throw new Error('Article video is not failed; no generation retry requested.');
  log('Retrying the single failed article video in place once; source and artifact identity verified.');
  await json(['artifact', 'retry', artifact.id, '-n', notebook, '--wait', '--timeout', '1800', '--interval', '10', '--json'], 31 * 60 * 1000);
  const checked = await json(listArgs);
  const final = Array.isArray(checked) ? checked : checked.artifacts;
  if (!Array.isArray(final) || final.length !== 1 || final[0].id !== artifact.id || final[0].status !== 'completed') {
    throw new Error('The bounded article-video retry did not produce the same completed artifact.');
  }
  log('The same article video completed. The existing publisher must still validate visuals and public YouTube processing.');
}
