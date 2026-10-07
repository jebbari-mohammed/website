import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { classifyFailure, summarizeListing, inspectRequestedRecovery, summarizeArtifactPoll, summarizeUsage, summarizeCommandFailure, runWithSafeFailure } from './notebooklm-recovery-diagnostic.mjs';

test('error logs expose only a fixed category, never the response', () => {
  assert.equal(classifyFailure({ stdout: 'QUOTA_EXCEEDED secret=do-not-log' }), 'PROVIDER_LIMIT');
  assert.equal(classifyFailure({ stderr: 'No such option: --foo secret=do-not-log' }), 'CLI_ARGUMENT_ERROR');
  assert.equal(classifyFailure({ stdout: 'No video artifacts found; token=do-not-log' }), 'NO_VIDEO_AVAILABLE');
  assert.equal(classifyFailure({ message: 'login required; cookie=do-not-log' }), 'AUTHENTICATION_REQUIRED');
  assert.equal(classifyFailure({ stdout: 'arbitrary secret=do-not-log' }), 'UNCLASSIFIED_PROVIDER_ERROR');
});

test('listing summaries discard titles, content, URLs and unrecognized status text', () => {
  const out = summarizeListing({ artifacts: [{status:'completed', title:'secret',url:'https://private'}, {status:'private-sensitive-state'}, {status:3}] }, 'artifacts');
  assert.deepEqual(out, {count:3, states:{completed:1,unknown:1,code_3:1}});
  assert.deepEqual(summarizeListing({},'sources'), {shape:'unrecognized'});
});

test('diagnosis only reads the requested notebook; no generation, upload or state changes', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'izem-diag-'));
  try {
    fs.mkdirSync(path.join(root,'data/marketing-employee'),{recursive:true});
    const file = path.join(root,'data/marketing-employee/video-repair-request.json');
    const contents = JSON.stringify({slug:'best-workout-split',recoverNotebookId:'16bc39aa-13a5-491a-a6ee-753c2c82ae54'});
    fs.writeFileSync(file,contents);
    const calls=[], lines=[];
    const run=async (cmd,args) => { calls.push(args); return {stdout:JSON.stringify(args[0]==='source'?{sources:[{status:'ready',title:'do-not-log'}]}:{artifacts:[]})}; };
    await inspectRequestedRecovery(root,{NOTEBOOKLM_POST_SLUG:'other'},run,line=>lines.push(line));
    assert.equal(calls.length,0);
    await inspectRequestedRecovery(root,{NOTEBOOKLM_POST_SLUG:'best-workout-split'},run,line=>lines.push(line));
    assert.equal(calls.length,2);
    assert.ok(calls.every(args=>args[1]==='list' && args.includes('16bc39aa-13a5-491a-a6ee-753c2c82ae54')));
    assert.equal(lines.join('').includes('do-not-log'),false);
    assert.equal(fs.readFileSync(file,'utf8'),contents);
    const fail=async()=>{throw {stdout:'no videos found token=do-not-log'}};
    await inspectRequestedRecovery(root,{NOTEBOOKLM_POST_SLUG:'best-workout-split'},fail,line=>lines.push(line));
    assert.equal(lines.join('').includes('do-not-log'),false);
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});

const notebook = '16bc39aa-13a5-491a-a6ee-753c2c82ae54';
const artifactId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'izem-poll-diag-'));
  const file = path.join(root, 'data/marketing-employee/video-repair-request.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const contents = JSON.stringify({ slug: 'best-workout-split', recoverNotebookId: notebook, retryFailedArtifactOnce: true, retryWorkflowRunId: '123', retryWorkflowRunAttempt: '4' });
  fs.writeFileSync(file, contents);
  return { root, file, contents };
}

test('poll envelope error_code is recognized without exposing provider text', () => {
  const out = summarizeArtifactPoll({ task_id: artifactId, status: 'failed', error_code: 'RESOURCE_EXHAUSTED', error: 'secret=do-not-log', url: 'https://private', metadata: { cookie: 'do-not-log' } }, artifactId);
  assert.deepEqual(out, { status: 'failed', category: 'PROVIDER_LIMIT', providerCode: 'RESOURCE_EXHAUSTED', hasError: true, hasDownloadUrl: true });
  assert.ok(!JSON.stringify(out).includes('do-not-log'));
  assert.equal(summarizeCommandFailure({ stdout: JSON.stringify({ error_code: 'RPC_ERROR' }), code: 1 }, ['artifact', 'poll']).providerCode, 'RPC_ERROR');
});

test('poll identity is checked and unrelated fields cannot supply a failure cause', () => {
  assert.deepEqual(summarizeArtifactPoll({ task_id: notebook }, artifactId), { shape: 'identity_mismatch' });
  assert.deepEqual(summarizeArtifactPoll({}, undefined), { shape: 'identity_mismatch' });
  const out = summarizeArtifactPoll({ task_id: artifactId, status: 'failed', error: null, url: 'https://private/QUOTA_EXCEEDED', metadata: { error: 'RATE_LIMITED' }, title: 'login required' }, artifactId);
  assert.equal(out.category, 'UNCLASSIFIED_PROVIDER_ERROR');
  assert.equal(out.providerCode, null);
  assert.equal(out.hasError, false);
  assert.equal(summarizeArtifactPoll({ task_id: artifactId, status: 'completed', error: null }, artifactId).category, null);
});

test('usage summaries preserve unknown versus false and redact all account details', () => {
  const out = summarizeUsage({ status: 'ready', available: true, is_exhausted: false, account: 'do-not-log', windows: [{ resets_at: 'do-not-log' }], actions: [{ code: 3, has_sufficient_quota: false, kind: 'do-not-log' }, { code: 4, has_sufficient_quota: null }, { code: 'secret', has_sufficient_quota: true }] });
  assert.deepEqual(out, { status: 'ready', available: true, exhausted: false, categories: [{ code: 3, sufficient: false }, { code: 4, sufficient: null }] });
  assert.deepEqual(summarizeUsage({ status: 'disabled' }), { status: 'disabled', available: null, exhausted: null, categories: [] });
  assert.ok(!JSON.stringify(out).includes('do-not-log'));
});

test('single failed artifact adds exactly one poll and one usage read, never a retry', async () => {
  const { root, file, contents } = fixture();
  const calls = [], logs = [];
  try {
    const run = async (command, args, options) => {
      calls.push(args);
      assert.equal(options.timeout, 120000);
      const key = args.slice(0, 2).join(' ');
      const data = key === 'source list' ? { sources: [{ status: 'ready' }] }
        : key === 'artifact list' ? { artifacts: [{ id: artifactId, status: 'failed', title: 'do-not-log' }] }
        : key === 'artifact poll' ? { task_id: artifactId, status: 'failed', error: 'Generation failed; do-not-log' }
        : { status: 'ready', available: true, is_exhausted: false };
      return { stdout: JSON.stringify(data), stderr: 'do-not-log' };
    };
    await inspectRequestedRecovery(root, { NOTEBOOKLM_POST_SLUG: 'best-workout-split', GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '4' }, run, line => logs.push(line));
    assert.deepEqual(calls, [ ['source', 'list', '-n', notebook, '--json'], ['artifact', 'list', '-n', notebook, '--type', 'video', '--json'], ['artifact', 'poll', artifactId, '-n', notebook, '--json'], ['usage', '--json'] ]);
    assert.ok(logs.some(line => line.includes('GENERATION_FAILED')));
    assert.ok(!logs.join('').includes('do-not-log'));
    assert.equal(fs.readFileSync(file, 'utf8'), contents);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('completed, ambiguous and malformed listings never trigger additional inspection', async () => {
  for (const artifacts of [[{ id: artifactId, status: 'completed' }], [{ id: artifactId, status: 'failed' }, { id: notebook, status: 'failed' }], [{ id: 'unsafe', status: 'failed' }], null]) {
    const { root } = fixture();
    const calls = [];
    try {
      await inspectRequestedRecovery(root, { NOTEBOOKLM_POST_SLUG: 'best-workout-split' }, async (cmd, args) => { calls.push(args); return { stdout: JSON.stringify(args[0] === 'source' ? { sources: [] } : { artifacts }) }; }, () => {});
      assert.equal(calls.length, 2);
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  }
});

test('optional poll failure and invalid usage JSON remain redacted and bounded', async () => {
  const { root, file, contents } = fixture();
  const calls = [], logs = [];
  try {
    await inspectRequestedRecovery(root, { NOTEBOOKLM_POST_SLUG: 'best-workout-split' }, async (cmd, args) => {
      calls.push(args);
      if (args[1] === 'poll') throw { code: 1, stdout: JSON.stringify({ error_code: 'RPC_ERROR', error: 'do-not-log' }) };
      if (args[0] === 'usage') return { stdout: 'invalid do-not-log' };
      return { stdout: JSON.stringify(args[0] === 'source' ? { sources: [] } : { artifacts: [{ id: artifactId, status: 'failed' }] }) };
    }, line => logs.push(line));
    assert.equal(calls.length, 4);
    assert.ok(logs.some(line => line.includes('PROVIDER_RPC_ERROR')));
    assert.ok(logs.some(line => line.includes('usage: INVALID_JSON')));
    assert.ok(!logs.join('').includes('do-not-log'));
    assert.equal(fs.readFileSync(file, 'utf8'), contents);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('argv cannot become provider evidence and exceptions never retain raw causes', async () => {
  const message = `Command failed: notebooklm artifact retry ${artifactId} --timeout 1800`;
  assert.equal(classifyFailure({ message }), 'UNCLASSIFIED_PROVIDER_ERROR');
  await assert.rejects(runWithSafeFailure('notebooklm', ['artifact', 'poll'], {}, async () => { throw { message, stdout: JSON.stringify({ error_code: 'QUOTA_EXCEEDED', error: 'do-not-log' }) }; }), error => error.name === 'NotebookLMCommandError' && error.message.includes('PROVIDER_LIMIT') && !error.message.includes('do-not-log') && error.cause === undefined);
});
