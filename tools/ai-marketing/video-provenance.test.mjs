import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  articleSource, articleSourceDigest, productFactsDigest, sha256, sampleTimestamps,
  assertVideoRecord, assertPeopleFreeEvidence, assertYoutubeVideoMatches,
  canonicalVideoRecord, provenanceFromEnvironment, videoDescriptionEvidence,
  videoProvenanceArtifactName, writeVideoProvenanceArtifact, renderVideoCard,
} from './video-provenance.mjs';
import { assertNotebookAuthCheck, findValidatedExistingVideo } from './daily-notebooklm-video-v2.mjs';

const articleHtml = '<html><head><title>Test</title></head><body><article>\n<h1>Test</h1><p>Bound source.</p></article></body></html>';
const productFactsBytes = Buffer.from('{"verifiedFacts":["Fixture only"]}\n');
const post = { slug: 'fixture-article', html: articleHtml, url: 'https://youraicoach.life/blog/fixture-article' };
const env = {
  GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: 'fixture/website', GITHUB_REF: 'refs/heads/main',
  GITHUB_WORKFLOW_REF: 'fixture/website/.github/workflows/daily-video-tts.yml@refs/heads/main',
  GITHUB_SHA: 'a'.repeat(40), GITHUB_RUN_ID: '12345', GITHUB_RUN_ATTEMPT: '1',
};
function fixture() {
  return {
    schema_version: 2, slug: post.slug, title: 'Test fixture only', url: post.url,
    youtube: 'https://youtube.com/watch?v=abcdefghijk', youtube_id: 'abcdefghijk', notebook_id: 'fixture-notebook',
    visual_policy: 'objects-only-v1', people_free_validated: true,
    article_sha256: articleSourceDigest(articleHtml), product_facts_sha256: productFactsDigest(productFactsBytes),
    video_sha256: sha256('test fixture bytes, not a video'), video_bytes: 10001,
    people_free_validation: {
      safe: true, containsHuman: false, reason: 'Test fixture only', unsafeFrameHints: [],
      model: 'fixture-classifier', sample_count: 14, duration_seconds: 60,
      sample_timestamps_seconds: sampleTimestamps(60), checked_at: '2026-10-01T00:00:00.000Z',
      method: 'uniform-full-duration-frames-v1',
    },
    upload: { channel_id: `UC${'x'.repeat(22)}`, uploaded_at: '2026-10-01T00:01:00.000Z' },
    provenance: provenanceFromEnvironment(env), date: '2026-10-01T00:01:00.000Z',
  };
}
function youtube(record = fixture()) {
  return { id: record.youtube_id,
    snippet: { channelId: record.upload.channel_id, description: `Canonical article: ${record.url}\n${videoDescriptionEvidence(record)}` },
    status: { privacyStatus: 'public', uploadStatus: 'processed' } };
}

test('source digest is stable after generated-card insertion/replacement; real edits change it', () => {
  const card = '<!-- IZEM_VIDEO_START --><section>Video fixture</section><!-- IZEM_VIDEO_END -->';
  const withCard = articleHtml.replace('<article>', `<article>\n${card}`);
  assert.equal(articleSource(withCard), articleHtml);
  assert.equal(articleSourceDigest(withCard), articleSourceDigest(articleHtml));
  assert.equal(articleSourceDigest(withCard.replace('Video fixture', 'Replaced card')), articleSourceDigest(articleHtml));
  assert.notEqual(articleSourceDigest(articleHtml.replace('Bound source', 'Changed source')), articleSourceDigest(articleHtml));
  assert.notEqual(articleSourceDigest(articleHtml.replace('<title>Test', '<title>Changed')), articleSourceDigest(articleHtml));
  assert.notEqual(productFactsDigest(productFactsBytes), productFactsDigest(Buffer.from('{}')));
});

test('unbalanced, mismatched and duplicate generated blocks fail closed', () => {
  for (const malformed of [
    '<!-- IZEM_VIDEO_START -->', '<!-- IZEM_VIDEO_END -->',
    '<!-- IZEM_VIDEO_START --><!-- NOTEBOOKLM_VIDEO_END -->',
    '<!-- IZEM_VIDEO_START --><!-- IZEM_VIDEO_START --><!-- IZEM_VIDEO_END -->',
    '<!-- IZEM_VIDEO_START --><!-- IZEM_VIDEO_END --><!-- IZEM_VIDEO_START --><!-- IZEM_VIDEO_END -->',
  ]) assert.throws(() => articleSourceDigest(articleHtml + malformed), /Malformed/);
});

test('video ledger is bound to exact source, facts, identity, and actual classifier evidence', () => {
  const record = fixture();
  assert.equal(assertVideoRecord(record, { ...post, articleHtml, productFactsBytes, videoId: record.youtube_id, repository: 'fixture/website' }), true);
  for (const change of [
    { articleHtml: `${articleHtml}changed` }, { productFactsBytes: Buffer.from('{}') },
    { videoId: 'otherid0000' }, { repository: 'elsewhere/website' },
  ]) assert.throws(() => assertVideoRecord(record, change), /does not match/);
  for (const key of ['schema_version', 'video_sha256', 'article_sha256', 'product_facts_sha256', 'video_bytes', 'people_free_validation', 'upload', 'provenance', 'notebook_id']) {
    const broken = structuredClone(record); delete broken[key];
    assert.throws(() => assertVideoRecord(broken), undefined, key);
  }
  assert.throws(() => assertVideoRecord({ ...record, people_free_validated: false }));
});

test('safe-looking verdict, missing model, partial samples, missing endpoints and suspicious hints are rejected', () => {
  const safe = fixture().people_free_validation;
  for (const changed of [
    { safe: 'true' }, { containsHuman: true }, { unsafeFrameHints: ['possible hand'] },
    { model: '' }, { checked_at: '' }, { sample_count: 13 }, { duration_seconds: NaN },
    { sample_timestamps_seconds: safe.sample_timestamps_seconds.slice(1) },
    { sample_timestamps_seconds: safe.sample_timestamps_seconds.map((timestamp) => timestamp + 1) },
  ]) assert.throws(() => assertPeopleFreeEvidence({ ...safe, ...changed }));
  assert.equal(assertPeopleFreeEvidence(safe), true);
});

test('authenticated YouTube response must match channel, video and all digest lines', () => {
  const record = fixture();
  assert.equal(assertYoutubeVideoMatches(record, youtube(record)), true);
  for (const mutate of [
    (video) => { video.id = 'different00'; },
    (video) => { video.snippet.channelId = `UC${'y'.repeat(22)}`; },
    (video) => { video.status.privacyStatus = 'private'; },
    (video) => { video.status.uploadStatus = 'rejected'; },
    (video) => { video.snippet.description = video.snippet.description.replace(record.video_sha256, 'f'.repeat(64)); },
    (video) => { video.snippet.description = `Canonical article: ${record.url}\nIZEM_VISUAL_POLICY=objects-only-v1;VALIDATED=true`; },
  ]) { const video = youtube(record); mutate(video); assert.throws(() => assertYoutubeVideoMatches(record, video)); }
});

test('environment metadata must identify exact main video workflow, never local/PR execution', () => {
  for (const override of [
    { GITHUB_ACTIONS: 'false' }, { GITHUB_REF: 'refs/pull/1/merge' },
    { GITHUB_WORKFLOW_REF: 'fixture/website/.github/workflows/other.yml@refs/heads/main' },
    { GITHUB_RUN_ID: '' }, { GITHUB_SHA: 'main' },
  ]) assert.throws(() => provenanceFromEnvironment({ ...env, ...override }));
});

test('proof artifact is canonical, source-bound and cannot silently overwrite an existing proof', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'izem-video-proof-test-'));
  try {
    const record = fixture();
    assert.equal(videoProvenanceArtifactName(record), 'izem-video-provenance-fixture-article-1');
    const file = writeVideoProvenanceArtifact(record, directory);
    assert.equal(fs.readFileSync(file, 'utf8'), `${canonicalVideoRecord(record)}\n`);
    assert.throws(() => writeVideoProvenanceArtifact(record, directory), /EEXIST/);
    assert.equal(canonicalVideoRecord({ b: 2, a: { d: 4, c: 3 } }), canonicalVideoRecord({ a: { c: 3, d: 4 }, b: 2 }));
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('legacy description stamp and bare true flag cannot authorize reuse or fabricate a new record', async () => {
  const legacy = { slug: post.slug, youtube: fixture().youtube, people_free_validated: true };
  let called = false;
  const result = await findValidatedExistingVideo('fixture-token', post, productFactsBytes, {
    progress: { completed: [legacy] }, verifyProof: async () => { called = true; }, youtubeJson: async () => { called = true; },
  });
  assert.equal(result, null); assert.equal(called, false);
  assert.deepEqual(legacy, { slug: post.slug, youtube: fixture().youtube, people_free_validated: true });
});

test('reuse preserves original authenticated evidence and rejects absent or mismatched proof', async () => {
  const record = fixture(); const original = canonicalVideoRecord(record); let verified = false;
  const options = { progress: { completed: [record] },
    verifyProof: async (value) => { assert.equal(value, record); verified = true; return true; },
    youtubeJson: async () => { assert.equal(verified, true); return { items: [youtube(record)] }; } };
  assert.equal(await findValidatedExistingVideo('fixture-token', post, productFactsBytes, options), record);
  assert.equal(canonicalVideoRecord(record), original);
  await assert.rejects(findValidatedExistingVideo('fixture-token', post, productFactsBytes, { ...options,
    verifyProof: async () => { throw new Error('Proof artifact missing/expired'); } }), /missing\/expired/);
  await assert.rejects(findValidatedExistingVideo('fixture-token', post, productFactsBytes, { ...options,
    youtubeJson: async () => ({ items: [] }) }), /does not match/);
  assert.equal(await findValidatedExistingVideo('fixture-token', { ...post, html: articleHtml + 'changed' }, productFactsBytes, options), null);
});

test('NotebookLM JSON success exit is insufficient without explicit successful live auth', () => {
  assert.equal(assertNotebookAuthCheck({ status: 'ok', checks: { token_fetch: true } }), true);
  for (const result of [{}, { status: 'error' }, { status: 'ok', checks: { token_fetch: false } },
    { status: 'ok', checks: { token_fetch: 'true' } }, { status: 'ok', checks: { storage_exists: true } }]) {
    assert.throws(() => assertNotebookAuthCheck(result), /authentication check did not pass/);
  }
});


test('shared renderer preserves the established watch-page/local-SVG card and escapes title markup', () => {
  const card = renderVideoCard({ title: 'A <script> & "title"' }, 'abcdefghijk');
  assert.match(card, /^<!-- IZEM_VIDEO_START -->/);
  assert.match(card, /<!-- IZEM_VIDEO_END -->$/);
  assert.match(card, /data-izem-video-card="true" data-video-id="abcdefghijk" href="\/youtube\/abcdefghijk\/"/);
  assert.match(card, /src="https:\/\/youraicoach.life\/youtube\/thumbnails\/abcdefghijk.svg"/);
  assert.match(card, /aspect-ratio:16\/9/);
  assert.equal(card.includes('<script>'), false);
  assert.equal(card.includes('<iframe'), false);
  assert.match(card, /A &lt;script&gt; &amp; &quot;title&quot;/);
  assert.throws(() => renderVideoCard({ title: 'Test' }, 'bad-id'));
  assert.equal(articleSourceDigest(articleHtml.replace('<article>', `<article>\n${card}`)), articleSourceDigest(articleHtml));
});
