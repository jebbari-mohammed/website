import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyFailure, summarizeCommandFailure, runWithSafeFailure } from './notebooklm-recovery-diagnostic.mjs';

for (const message of [
  'Command failed: notebooklm artifact retry example --wait --timeout 1800 --json',
  'Command failed: notebooklm generate video -n example --timeout 1800 --json',
  'Command failed: notebooklm create "quota capacity not found" --json',
]) {
  test('argv is not provider failure evidence: ' + message, () => {
    assert.equal(classifyFailure({message}), 'UNCLASSIFIED_PROVIDER_ERROR');
  });
}
for (const [payload, category] of [
  ['No video artifacts found; token=do-not-log', 'NO_VIDEO_AVAILABLE'],
  ['No completed video available', 'NO_VIDEO_AVAILABLE'],
  ['Artifact not found', 'NO_VIDEO_AVAILABLE'],
  ['Video generation failed', 'GENERATION_FAILED'],
  ['QUOTA_EXCEEDED secret=do-not-log', 'PROVIDER_LIMIT'],
  ['No such option: --foo secret=do-not-log', 'CLI_ARGUMENT_ERROR'],
  ['login required; cookie=do-not-log', 'AUTHENTICATION_REQUIRED'],
  ['Request timed out', 'TIMEOUT'],
]) {
  test('classifies actual output as ' + category, () => {
    assert.equal(classifyFailure({stdout:payload, message:'Command failed: notebooklm artifact retry --timeout 1800'}), category);
  });
}
test('unknown stdout stays unknown instead of matching the command line', () => {
  assert.equal(classifyFailure({stdout:'Unexpected error', message:'Command failed: notebooklm artifact retry --timeout 1800'}), 'UNCLASSIFIED_PROVIDER_ERROR');
});
test('retains only allowlisted typed provider codes and safe subprocess metadata', () => {
  const result = summarizeCommandFailure({
    stdout: JSON.stringify({error:true, code:'GENERATION_FAILED', message:'private content; secret=do-not-log'}),
    stderr:'Authorization: do-not-log', code:1, signal:'SIGTERM',
  }, ['generate','video','private-title','--secret','do-not-log']);
  assert.deepEqual(result, {operation:'generate video',category:'GENERATION_FAILED',providerCode:'GENERATION_FAILED',exitCode:1,signal:'SIGTERM',hasStdout:true,hasStderr:true});
  assert.ok(!JSON.stringify(result).includes('do-not-log'));
});
test('nested errors are read without exposing arbitrary codes or signals', () => {
  assert.equal(summarizeCommandFailure({stdout:'{"error":{"code":"RESOURCE_EXHAUSTED"}}'}).category, 'PROVIDER_LIMIT');
  const result = summarizeCommandFailure({stdout:'{"error":true,"code":"private-do-not-log","message":"opaque"}', code:'do-not-log', signal:'do-not-log'},['do-not-log']);
  assert.equal(result.providerCode, null); assert.equal(result.signal, null); assert.equal(result.exitCode, null);
  assert.ok(!JSON.stringify(result).includes('do-not-log'));
});
test('a rejected promise logs stdout-derived diagnostics without raw cause', async () => {
  let attempts=0;
  await assert.rejects(runWithSafeFailure('notebooklm',['artifact','retry'],{timeout:120000},async()=>{
    attempts++; throw {stdout:'{"error":true,"code":"NOT_RETRYABLE","message":"do-not-log"}',stderr:'do-not-log',code:1};
  }), error=>{
    assert.equal(error.name,'NotebookLMCommandError');
    assert.match(error.message,/NOT_RETRYABLE/); assert.match(error.message,/artifact retry/);
    assert.ok(!error.stack.includes('do-not-log')); assert.equal(error.cause,undefined); return true;
  });
  assert.equal(attempts,1);
});
test('a real child-process failure retains safe JSON diagnostics', async () => {
  await assert.rejects(runWithSafeFailure(process.execPath,['-e','console.log(JSON.stringify({error:true,code:"GENERATION_FAILED",message:"do-not-log"}));process.exit(1)'],{timeout:5000}), error=>{
    assert.match(error.message,/GENERATION_FAILED/); assert.match(error.message,/"exitCode":1/); assert.ok(!error.stack.includes('do-not-log')); return true;
  });
});
test('success output and timeout options are preserved without retries', async () => {
  const options={timeout:12345}; const expected={stdout:'{"success":true}',stderr:''}; let calls=0;
  const result=await runWithSafeFailure('notebooklm',['source','list'],options,async(command,args,received)=>{
    calls++; assert.equal(command,'notebooklm'); assert.deepEqual(args,['source','list']); assert.equal(received,options); return expected;
  });
  assert.equal(result,expected); assert.equal(calls,1);
});
