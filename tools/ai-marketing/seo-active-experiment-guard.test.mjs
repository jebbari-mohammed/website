import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findActiveLockMutationViolations,
  findActiveLockViolations,
  isOwnerImagePolicyThumbnailReplacement,
  isDocumentedVideoSafetyCorrection,
  validateConfig,
} from './seo-active-experiment-guard.mjs';

const config = {
  version: 1,
  locks: [
    {
      id: 'reminder-test',
      url: '/blog/workout-reminder-app-that-calls-you',
      files: ['public/blog/workout-reminder-app-that-calls-you.html'],
      launchedAt: '2026-08-24',
      lockUntil: '2026-09-14',
      preferredReviewAt: '2026-09-21',
      reason: 'Protect the active test.',
    },
  ],
};

test('blocks a protected target during its lock window', () => {
  const violations = findActiveLockViolations(
    ['public/blog/workout-reminder-app-that-calls-you.html'],
    config,
    new Date('2026-08-25T12:00:00Z'),
  );
  assert.equal(violations.length, 1);
  assert.equal(violations[0].id, 'reminder-test');
  assert.equal(violations[0].lockUntil, '2026-09-14');
});

test('allows unrelated website changes while a target is locked', () => {
  const violations = findActiveLockViolations(
    ['public/blog/another-page.html', 'public/sitemap.xml'],
    config,
    new Date('2026-08-25T12:00:00Z'),
  );
  assert.deepEqual(violations, []);
});

test('allows the protected target after the lock window expires', () => {
  const violations = findActiveLockViolations(
    ['public/blog/workout-reminder-app-that-calls-you.html'],
    config,
    new Date('2026-09-15T00:00:00Z'),
  );
  assert.deepEqual(violations, []);
});

test('allows a target when its lock is introduced by the same launch change', () => {
  const launchConfig = {
    version: 1,
    locks: [
      ...config.locks,
      {
        id: 'new-voice-test',
        url: '/blog/voice-coaching',
        files: ['public/blog/voice-coaching.html'],
        launchedAt: '2026-08-27',
        lockUntil: '2026-09-17',
        preferredReviewAt: '2026-09-24',
        reason: 'Protect the newly launched test after this change.',
      },
    ],
  };
  const violations = findActiveLockViolations(
    ['public/blog/voice-coaching.html', 'config/seo-active-experiments.json'],
    launchConfig,
    new Date('2026-08-27T12:00:00Z'),
    { enforceLockIds: new Set(['reminder-test']) },
  );
  assert.deepEqual(violations, []);
});

test('still blocks a pre-existing target when the same change introduces another lock', () => {
  const launchConfig = {
    version: 1,
    locks: [
      ...config.locks,
      {
        id: 'new-voice-test',
        url: '/blog/voice-coaching',
        files: ['public/blog/voice-coaching.html'],
        launchedAt: '2026-08-27',
        lockUntil: '2026-09-17',
        preferredReviewAt: '2026-09-24',
        reason: 'Protect the newly launched test after this change.',
      },
    ],
  };
  const violations = findActiveLockViolations(
    [
      'public/blog/workout-reminder-app-that-calls-you.html',
      'public/blog/voice-coaching.html',
      'config/seo-active-experiments.json',
    ],
    launchConfig,
    new Date('2026-08-27T12:00:00Z'),
    { enforceLockIds: new Set(['reminder-test']) },
  );
  assert.equal(violations.length, 1);
  assert.equal(violations[0].id, 'reminder-test');
});

test('blocks removal of a pre-existing active lock', () => {
  const violations = findActiveLockMutationViolations(
    config,
    { version: 1, locks: [] },
    new Date('2026-09-05T12:00:00Z'),
  );
  assert.equal(violations.length, 1);
  assert.equal(violations[0].type, 'removed');
});

test('blocks shortening a pre-existing active lock', () => {
  const headConfig = {
    version: 1,
    locks: [{ ...config.locks[0], lockUntil: '2026-09-05' }],
  };
  const violations = findActiveLockMutationViolations(
    config,
    headConfig,
    new Date('2026-09-05T12:00:00Z'),
  );
  assert.equal(violations.length, 1);
  assert.equal(violations[0].type, 'shortened');
});

test('blocks removing protected files or retargeting an active lock', () => {
  const baseConfig = {
    version: 1,
    locks: [{
      ...config.locks[0],
      files: [
        'public/blog/workout-reminder-app-that-calls-you.html',
        'src/components/ReminderCTA.tsx',
      ],
    }],
  };
  const headConfig = {
    version: 1,
    locks: [{
      ...config.locks[0],
      url: '/blog/different-page',
      files: ['public/blog/workout-reminder-app-that-calls-you.html'],
    }],
  };
  const violations = findActiveLockMutationViolations(
    baseConfig,
    headConfig,
    new Date('2026-09-05T12:00:00Z'),
  );
  assert.deepEqual(violations.map((item) => item.type).sort(), ['files-removed', 'retargeted']);
});

test('allows strengthening an active lock and adding protected files', () => {
  const headConfig = {
    version: 1,
    locks: [{
      ...config.locks[0],
      lockUntil: '2026-09-20',
      files: [
        ...config.locks[0].files,
        'src/components/ReminderCTA.tsx',
      ],
    }],
  };
  const violations = findActiveLockMutationViolations(
    config,
    headConfig,
    new Date('2026-09-05T12:00:00Z'),
  );
  assert.deepEqual(violations, []);
});

test('allows lock mutations after the original lock window expires', () => {
  const violations = findActiveLockMutationViolations(
    config,
    { version: 1, locks: [] },
    new Date('2026-09-15T00:00:00Z'),
  );
  assert.deepEqual(violations, []);
});

test('fails configuration validation for duplicate lock ids', () => {
  assert.throws(
    () => validateConfig({ version: 1, locks: [config.locks[0], config.locks[0]] }),
    /unique id/,
  );
});

test('fails configuration validation for unsupported protected paths', () => {
  assert.throws(
    () => validateConfig({
      version: 1,
      locks: [{ ...config.locks[0], files: ['data/private.json'] }],
    }),
    /unsupported path/,
  );
});

test('recognizes an exact remote YouTube thumbnail to verified IZEM artwork safety replacement', () => {
  const base = '<img src="https://i.ytimg.com/vi/abc_123/hqdefault.jpg"><meta property="og:image" content="https://img.youtube.com/vi/abc_123/hqdefault.jpg">';
  const head = '<img src="https://youraicoach.life/youtube/thumbnails/abc_123.svg"><meta property="og:image" content="https://youraicoach.life/youtube/thumbnails/abc_123.svg">';
  assert.equal(isOwnerImagePolicyThumbnailReplacement(base, head), true);
});

test('rejects a thumbnail safety override when any protected copy changes too', () => {
  const base = '<h1>Original title</h1><img src="https://i.ytimg.com/vi/abc_123/hqdefault.jpg">';
  const head = '<h1>Changed title</h1><img src="https://youraicoach.life/youtube/thumbnails/abc_123.svg">';
  assert.equal(isOwnerImagePolicyThumbnailReplacement(base, head), false);
});

test('allows only explicitly prevalidated safety files while keeping other locked targets blocked', () => {
  const protectedFile = 'public/blog/workout-reminder-app-that-calls-you.html';
  const ignored = findActiveLockViolations(
    [protectedFile],
    config,
    new Date('2026-08-25T12:00:00Z'),
    { ignoreFiles: new Set([protectedFile]) },
  );
  assert.deepEqual(ignored, []);

  const normal = findActiveLockViolations(
    [protectedFile],
    config,
    new Date('2026-08-25T12:00:00Z'),
  );
  assert.equal(normal.length, 1);
});

const safetyCorrection = {
  kind: 'video-visual-safety', date: '2026-10-05',
  file: 'public/blog/how-many-exercises-per-workout.html',
  fromVideoId: 'jIBGvRVpHCk', toVideoId: 'a_jG-ssT1tk',
  reviewNote: 'docs/seo-experiments/2026-10-05-how-many-exercises-per-workout.md',
};
function companionCard(id) {
  return `<h1>Protected article</h1><!-- IZEM_VIDEO_START -->
<section class="izem-video note" aria-labelledby="video-title"><h2 id="video-title">Planning tool companion</h2><a data-izem-video-card="true" data-video-id="${id}" href="/youtube/${id}/" aria-label="Watch companion"><img src="https://youraicoach.life/youtube/thumbnails/${id}.svg" alt="Companion video" width="1200" height="675" loading="lazy" decoding="async"></a><p>Choose a planning tool.</p></section>
<!-- IZEM_VIDEO_END --><p>Protected body.</p>`;
}
function safetyOptions(overrides = {}) {
  return {
    correction: safetyCorrection,
    baseRecords: [{ youtube: 'https://youtube.com/watch?v=a_jG-ssT1tk', visual_policy: 'objects-only-v1', people_free_validated: true }],
    reviewNote: 'Video safety correction: replace jIBGvRVpHCk with a_jG-ssT1tk.',
    changedFiles: [safetyCorrection.reviewNote], now: new Date('2026-10-06T12:00:00Z'),
    ...overrides,
  };
}
const originalCard = companionCard('jIBGvRVpHCk');
const safeCard = companionCard('a_jG-ssT1tk');

test('allows a documented static video correction with pre-existing destination validation', () => {
  assert.equal(isDocumentedVideoSafetyCorrection(originalCard, safeCard, safetyOptions()), true);
});

test('rejects a video correction that also changes protected article text or metadata', () => {
  assert.equal(isDocumentedVideoSafetyCorrection(originalCard, safeCard.replace('Protected article', 'New title'), safetyOptions()), false);
  assert.equal(isDocumentedVideoSafetyCorrection(originalCard, safeCard + '<meta name="robots" content="noindex">', safetyOptions()), false);
});

test('rejects an unvalidated video and missing or unchanged review documentation', () => {
  for (const options of [
    safetyOptions({ baseRecords: [] }),
    safetyOptions({ baseRecords: [{ youtube: 'https://youtube.com/watch?v=a_jG-ssT1tk', people_free_validated: true }] }),
    safetyOptions({ changedFiles: [] }), safetyOptions({ reviewNote: '' }),
  ]) assert.equal(isDocumentedVideoSafetyCorrection(originalCard, safeCard, options), false);
});

test('rejects executable media, event handlers and extra outbound links in a safety card', () => {
  for (const changed of [
    safeCard.replace('</section>', '<iframe src="https://example.com"></iframe></section>'),
    safeCard.replace(' decoding="async"', ' decoding="async" onload="alert(1)"'),
    safeCard.replace('</p>', '<a href="https://example.com">Extra link</a></p>'),
    safeCard.replace(' loading="lazy"', ' srcset="https://example.com/image.png" loading="lazy"'),
  ]) assert.equal(isDocumentedVideoSafetyCorrection(originalCard, changed, safetyOptions()), false);
});

test('rejects missing, duplicated or reversed block markers and mismatched video IDs', () => {
  for (const changed of [
    safeCard.replace('<!-- IZEM_VIDEO_START -->', ''),
    safeCard.replace('<!-- IZEM_VIDEO_START -->', '<!-- IZEM_VIDEO_START --><!-- IZEM_VIDEO_START -->'),
    safeCard.replace('IZEM_VIDEO_START', 'TEMP').replace('IZEM_VIDEO_END', 'IZEM_VIDEO_START').replace('TEMP', 'IZEM_VIDEO_END'),
    safeCard.replace('data-video-id="a_jG-ssT1tk"', 'data-video-id="jIBGvRVpHCk"'),
  ]) assert.equal(isDocumentedVideoSafetyCorrection(originalCard, changed, safetyOptions()), false);
});

test('rejects replayed corrections and future-dated review entries', () => {
  assert.equal(isDocumentedVideoSafetyCorrection(originalCard, safeCard, safetyOptions({ baseCorrections: [safetyCorrection] })), false);
  assert.equal(isDocumentedVideoSafetyCorrection(originalCard, safeCard, safetyOptions({ correction: { ...safetyCorrection, date: '2026-10-07' } })), false);
});
