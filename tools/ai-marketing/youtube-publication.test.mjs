import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyYouTubePublication } from './youtube-publication.mjs';

const options = {
  videoId: 'Abc123_-xyz', title: 'Test article | IZEM', canonicalUrl: 'https://youraicoach.life/blog/test-article',
  validationStamp: 'IZEM_VISUAL_POLICY=objects-only-v1;VALIDATED=true', attempts: 2,
  wait: async () => {},
};
function video() {
  return {
    id: options.videoId,
    snippet: { title: options.title, description: `Canonical article: ${options.canonicalUrl}\n${options.validationStamp}`, channelId: 'test-channel', publishedAt: '2026-10-06T00:00:00Z' },
    status: { privacyStatus: 'public', uploadStatus: 'processed', embeddable: true },
    processingDetails: { processingStatus: 'succeeded' },
  };
}
test('accepts only matching processed public publication', async () => {
  const result = await verifyYouTubePublication({ ...options, readVideo: async () => video() });
  assert.equal(result.videoId, options.videoId);
  assert.equal(result.privacyStatus, 'public');
  assert.equal(result.uploadStatus, 'processed');
});
for (const privacyStatus of ['private', 'unlisted', undefined]) {
  test(`rejects ${privacyStatus || 'unknown'} visibility`, async () => {
    const value = video(); value.status.privacyStatus = privacyStatus;
    await assert.rejects(verifyYouTubePublication({ ...options, readVideo: async () => value }), /publication is blocked/);
  });
}
for (const field of ['id', 'title', 'canonical', 'stamp']) {
  test(`rejects wrong ${field}`, async () => {
    const value = video();
    if (field === 'id') value.id = 'wrong-id';
    if (field === 'title') value.snippet.title = 'Companion video';
    if (field === 'canonical') value.snippet.description = `Canonical article: ${options.canonicalUrl}-other\n${options.validationStamp}`;
    if (field === 'stamp') value.snippet.description = `Canonical article: ${options.canonicalUrl}`;
    await assert.rejects(verifyYouTubePublication({ ...options, readVideo: async () => value }), /identity|canonical/);
  });
}
test('polls uploaded video until processed without uploading anything', async () => {
  let calls = 0; let waits = 0;
  const result = await verifyYouTubePublication({ ...options, wait: async () => { waits += 1; }, readVideo: async () => {
    calls += 1; const value = video();
    if (calls === 1) { value.status.uploadStatus = 'uploaded'; value.processingDetails.processingStatus = 'processing'; }
    return value;
  } });
  assert.equal(result.uploadStatus, 'processed'); assert.equal(calls, 2); assert.equal(waits, 1);
});
test('missing video never counts as publication', async () => {
  await assert.rejects(verifyYouTubePublication({ ...options, readVideo: async () => null }), /did not finish/);
});
test('failed processing never counts as publication', async () => {
  const value = video(); value.processingDetails.processingStatus = 'failed';
  await assert.rejects(verifyYouTubePublication({ ...options, readVideo: async () => value }), /failed processing/);
});
test('non-embeddable video blocks the website release', async () => {
  const value = video(); value.status.embeddable = false;
  await assert.rejects(verifyYouTubePublication({ ...options, readVideo: async () => value }), /not embeddable/);
});
