import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const source = fs.readFileSync(new URL('./daily-notebooklm-video-v2.mjs', import.meta.url), 'utf8');
function section(start, end) {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first, `Missing tested function boundary: ${start}`);
  return source.slice(first, last);
}
const embedSource = section('function embedIntoPost(', '\nfunction record(');
const mainSource = section('async function main() {', '\nmain().catch(');
for (const html of [
  '<body><main><article>Text</article></main></body>',
  '<body><article>Text</article></body>',
  '<body><main>Text</main></body>',
  '<body><h1>Title</h1>Text</body>',
  '<body>Text without heading</body>',
  '<body><!-- IZEM_VIDEO_START -->Old card<!-- IZEM_VIDEO_END -->Text</body>',
]) {
  test(`embeds the validated card in ${html}`, () => {
    let written = '';
    vm.runInNewContext(`${embedSource}\nembedIntoPost(post, url);`, {
      fs: { readFileSync: () => html, writeFileSync: (_file, value) => { written = value; } },
      embedBlock: () => 'VALIDATED_CARD', post: { file: 'article.html' }, url: 'test-url',
    });
    assert.ok(written.includes('VALIDATED_CARD'));
    assert.ok(written.includes('Text'));
    assert.ok(!written.includes('Old card'));
  });
}
function harness(overrides = {}) {
  const calls = [];
  let issued = 0;
  const context = {
    loadEnv() {}, readPost: () => ({ slug: 'test-article' }), productFacts: () => ({}),
    ROOT: '/repo',
    process: { env: { NOTEBOOKLM_AUTH_JSON: 'test-fixture-only' } },
    console: { log() {}, warn() {} },
    accessToken: async () => `token-${++issued}`,
    findValidatedExistingVideo: async () => null,
    recoverRequestedNarration: async () => null,
    recoverRequestedNotebookVideo: async () => null,
    generateNotebookVideo: async () => { calls.push('generate'); return { outputFile: 'video.mp4', notebookId: 'test-notebook' }; },
    rebuildObjectOnlyVideo: async () => { calls.push('rebuild'); return { outputFile: 'rebuilt.mp4', renderMethod: 'notebooklm-narration-object-typography-v1' }; },
    assertVideoIsPeopleFree: async () => { calls.push('safety'); },
    uploadVideo: async (_file, _post, token) => { calls.push(`upload:${token}`); return 'https://youtube.com/watch?v=Abc123_-xyz'; },
    verifyPublishedVideo: async () => { calls.push('verify'); return { privacyStatus: 'public' }; },
    embedIntoPost: () => calls.push('embed'),
    record: () => calls.push('record'),
    ...overrides,
  };
  return { calls, run: () => vm.runInNewContext(`${mainSource}\nmain();`, context) };
}
test('refreshes the token after safety and verifies before embedding or recording', async () => {
  const { calls, run } = harness(); await run();
  assert.deepEqual(calls, ['generate', 'safety', 'upload:token-2', 'verify', 'embed', 'record']);
});
test('failed publication verification never embeds or records success', async () => {
  const { calls, run } = harness({ verifyPublishedVideo: async () => { throw new Error('not public'); } });
  await assert.rejects(run(), /not public/);
  assert.ok(!calls.includes('embed')); assert.ok(!calls.includes('record'));
});
test('a repaired render rejected by the classifier never uploads', async () => {
  let checked = 0;
  const { calls, run } = harness({ assertVideoIsPeopleFree: async () => {
    checked += 1; const error = new Error('human depiction'); error.name = 'VideoPolicyError'; throw error;
  } });
  await assert.rejects(run(), /human depiction/);
  assert.equal(checked, 2); assert.equal(calls.filter((value) => value === 'generate').length, 1);
  assert.ok(calls.includes('rebuild'));
  assert.ok(!calls.some((value) => value.startsWith('upload:')));
});
test('only the rebuilt and independently validated output can be uploaded', async () => {
  const checked = []; let uploaded = '';
  const { calls, run } = harness({
    assertVideoIsPeopleFree: async (file) => {
      checked.push(file);
      if (file === 'video.mp4') { const error = new Error('unsafe original'); error.name = 'VideoPolicyError'; throw error; }
    },
    uploadVideo: async (file) => { uploaded = file; return 'https://youtube.com/watch?v=Abc123_-xyz'; },
  });
  await run(); assert.deepEqual(checked, ['video.mp4', 'rebuilt.mp4']); assert.equal(uploaded, 'rebuilt.mp4');
  assert.ok(calls.includes('verify'));
});
test('an explicitly recovered narration is rebuilt before its only safety check', async () => {
  const checked = [];
  const { calls, run } = harness({
    recoverRequestedNotebookVideo: async () => ({ outputFile: 'recovered.mp4', notebookId: 'known-notebook' }),
    assertVideoIsPeopleFree: async (file) => { checked.push(file); },
  });
  await run(); assert.deepEqual(checked, ['rebuilt.mp4']); assert.ok(!calls.includes('generate'));
  assert.ok(calls.indexOf('rebuild') < calls.indexOf('upload:token-2'));
});
test('audio-only narration enters the same rebuild, safety and public verification path', async () => {
  const checked = []; let rebuiltInput = '';
  const { calls, run } = harness({
    recoverRequestedNarration: async (root, post) => {
      assert.equal(root, '/repo'); assert.equal(post.slug, 'test-article');
      return { outputFile: 'canonical.m4a', notebookId: 'known-notebook' };
    },
    recoverRequestedNotebookVideo: async () => { throw new Error('should not request another video'); },
    rebuildObjectOnlyVideo: async (file) => { rebuiltInput = file; return { outputFile: 'rebuilt.mp4' }; },
    assertVideoIsPeopleFree: async (file) => { checked.push(file); },
  });
  await run(); assert.equal(rebuiltInput, 'canonical.m4a'); assert.deepEqual(checked, ['rebuilt.mp4']);
  assert.ok(!calls.includes('generate'));
  assert.deepEqual(calls, ['upload:token-2', 'verify', 'embed', 'record']);
});
test('failed narration cannot fall through to more generation or publication', async () => {
  const { calls, run } = harness({ recoverRequestedNarration: async () => { throw new Error('narration failed'); } });
  await assert.rejects(run(), /narration failed/); assert.deepEqual(calls, []);
});
test('classifier infrastructure errors fail closed rather than upload or regenerate blindly', async () => {
  const { calls, run } = harness({ assertVideoIsPeopleFree: async () => { throw new Error('classifier unavailable'); } });
  await assert.rejects(run(), /classifier unavailable/);
  assert.equal(calls.filter((value) => value === 'generate').length, 1);
  assert.ok(!calls.includes('rebuild')); assert.ok(!calls.some((value) => value.startsWith('upload:')));
});
test('existing matching uploads are verified without generating or uploading a duplicate', async () => {
  const { calls, run } = harness({ findValidatedExistingVideo: async () => 'https://youtube.com/watch?v=Abc123_-xyz' });
  await run(); assert.deepEqual(calls, ['verify', 'embed', 'record']);
});
const recoverySource = section('async function recoverRequestedNotebookVideo(', '\nasync function main()');
for (const selected of [
  { verified: false },
  { verified: true, notebook: { id: 'wrong', title: 'IZEM Video - Test' } },
  { verified: true, notebook: { id: 'e22a2847-546c-4f5f-9f43-8992df47fb2c', title: 'Another private notebook' } },
]) {
  test('rejects unverified or mismatched recovery identity', async () => {
    const commands = [];
    const result = vm.runInNewContext(`${recoverySource}\nrecoverRequestedNotebookVideo(post);`, {
      path, ROOT: '/repo', WORK_DIR: '/scratch', post: { slug: 'test', title: 'Test' },
      readJson: () => ({ slug: 'test', recoverNotebookId: 'e22a2847-546c-4f5f-9f43-8992df47fb2c' }),
      runNotebookLMJson: async (args) => { commands.push(args[0]); return selected; },
    });
    await assert.rejects(result, /identity/); assert.ok(!commands.includes('download'));
  });
}
