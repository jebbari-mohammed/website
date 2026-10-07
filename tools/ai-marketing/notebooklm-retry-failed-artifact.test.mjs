import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { retryRequestedFailedVideo } from './notebooklm-retry-failed-artifact.mjs';

const nb = '16bc39aa-13a5-491a-a6ee-753c2c82ae54';
const art = '12345678-1234-1234-1234-123456789abc';
const env = { NOTEBOOKLM_POST_SLUG: 'best-workout-split', GITHUB_RUN_ID: '37555071131', GITHUB_RUN_ATTEMPT: '4' };
async function fixture(fn, override = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'izem-once-'));
  fs.mkdirSync(path.join(root, 'data/marketing-employee'), { recursive: true });
  fs.mkdirSync(path.join(root, 'public/blog'), { recursive: true });
  fs.writeFileSync(path.join(root, 'data/marketing-employee/video-repair-request.json'), JSON.stringify({slug:env.NOTEBOOKLM_POST_SLUG,recoverNotebookId:nb,retryFailedArtifactOnce:true,retryWorkflowRunId:env.GITHUB_RUN_ID,retryWorkflowRunAttempt:env.GITHUB_RUN_ATTEMPT,...override}));
  fs.writeFileSync(path.join(root, 'public/blog/best-workout-split.html'), '<link rel="canonical" href="https://youraicoach.life/blog/best-workout-split"><h1>Best <span>Workout</span> Split</h1>');
  try { await fn(root); } finally { fs.rmSync(root, { recursive: true, force: true }); }
}
function runner({ verified = true, sourceStatus = 'ready', initial = 'failed', terminal = 'completed', retryError = null, extra = false } = {}) {
  const calls = []; let lists = 0;
  const run = async (_cmd, args) => {
    calls.push(args);
    let value;
    if (args[0] === 'use') value = {verified,notebook:{id:nb,title:'IZEM Video - Best Workout Split - attempt 1'}};
    else if (args[0] === 'source') value = {sources:[{status:sourceStatus,title:'private-do-not-log'}]};
    else if (args[1] === 'list') { lists++; value = {artifacts:[{id:art,status:lists === 1 ? initial : terminal},...(extra?[{id:nb,status:'failed'}]:[])]}; }
    else if (args[1] === 'retry') { if (retryError) throw retryError; value = {status:'completed',artifact_id:art}; }
    else throw new Error('Unexpected command');
    return {stdout:JSON.stringify(value)};
  };
  return {run,calls};
}

test('one in-place retry, exact id; never creates notebooks, sources, uploads or records', async () => fixture(async root => {
  const r=runner(), logs=[];
  await retryRequestedFailedVideo(root,env,r.run,s=>logs.push(s));
  const mutations=r.calls.filter(a=>a[1]==='retry');
  assert.equal(mutations.length,1);
  assert.deepEqual(mutations[0],['artifact','retry',art,'-n',nb,'--wait','--timeout','1800','--interval','10','--json']);
  assert.ok(r.calls.every(a=>a[0]==='use'||a[0]==='source'||a[0]==='artifact'));
  assert.ok(!logs.join('').includes('private-do-not-log'));
}));

test('scheduled runs, different attempts and absent opt-in never retry', async () => fixture(async root => {
  for (const variant of [{...env,GITHUB_RUN_ID:'different'},{...env,GITHUB_RUN_ATTEMPT:'5'},{...env,NOTEBOOKLM_POST_SLUG:'other'},{}]) {
    const r=runner(); await retryRequestedFailedVideo(root,variant,r.run,()=>{}); assert.equal(r.calls.length,0);
  }
}));

test('a completed artifact is reused without generation', async () => fixture(async root => {
  const r=runner({initial:'completed'}); await retryRequestedFailedVideo(root,env,r.run,()=>{}); assert.equal(r.calls.some(a=>a[1]==='retry'),false);
}));

for (const config of [{verified:false},{sourceStatus:'processing'},{initial:'in_progress'},{extra:true}]) {
  test(`precondition fails closed ${JSON.stringify(config)}`, async () => fixture(async root => {
    const r=runner(config); await assert.rejects(()=>retryRequestedFailedVideo(root,env,r.run,()=>{})); assert.equal(r.calls.some(a=>a[1]==='retry'),false);
  }));
}

test('provider quota failure is not retried and does not expose payload', async () => fixture(async root => {
  const r=runner({retryError:{stdout:'QUOTA_EXCEEDED secret=do-not-log'}});
  await assert.rejects(()=>retryRequestedFailedVideo(root,env,r.run,()=>{}),e=>e.message.includes('PROVIDER_LIMIT')&&!e.message.includes('do-not-log'));
  assert.equal(r.calls.filter(a=>a[1]==='retry').length,1);
}));

test('a second failed state never counts as completion', async () => fixture(async root => {
  const r=runner({terminal:'failed'}); await assert.rejects(()=>retryRequestedFailedVideo(root,env,r.run,()=>{}),/did not produce/);
  assert.equal(r.calls.filter(a=>a[1]==='retry').length,1);
}));
