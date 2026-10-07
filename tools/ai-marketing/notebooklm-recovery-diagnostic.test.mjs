import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { classifyFailure, summarizeListing, inspectRequestedRecovery } from './notebooklm-recovery-diagnostic.mjs';

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
