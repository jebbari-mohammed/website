import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

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
    process: { env: { NOTEBOOKLM_AUTH_JSON: 'test-fixture-only' } },
    console: { log() {}, warn() {} },
    accessToken: async () => `token-${++issued}`,
    findValidatedExistingVideo: async () => null,
    generateNotebookVideo: async () => { calls.push('generate'); return { outputFile: 'video.mp4', notebookId: 'test-notebook' }; },
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
test('three unsafe renders never upload', async () => {
  let checked = 0;
  const { calls, run } = harness({ assertVideoIsPeopleFree: async () => {
    checked += 1; const error = new Error('human depiction'); error.name = 'VideoPolicyError'; throw error;
  } });
  await assert.rejects(run(), /human depiction/);
  assert.equal(checked, 3); assert.equal(calls.filter((value) => value === 'generate').length, 3);
  assert.ok(!calls.some((value) => value.startsWith('upload:')));
});
test('classifier infrastructure errors fail closed rather than upload or regenerate blindly', async () => {
  const { calls, run } = harness({ assertVideoIsPeopleFree: async () => { throw new Error('classifier unavailable'); } });
  await assert.rejects(run(), /classifier unavailable/);
  assert.equal(calls.filter((value) => value === 'generate').length, 1);
  assert.ok(!calls.some((value) => value.startsWith('upload:')));
});
test('existing matching uploads are verified without generating or uploading a duplicate', async () => {
  const { calls, run } = harness({ findValidatedExistingVideo: async () => 'https://youtube.com/watch?v=Abc123_-xyz' });
  await run(); assert.deepEqual(calls, ['verify', 'embed', 'record']);
});
