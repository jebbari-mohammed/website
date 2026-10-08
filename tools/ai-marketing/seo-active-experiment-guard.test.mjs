import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import {
  findActiveLockMutationViolations,
  findActiveLockViolations,
  isOwnerImagePolicyThumbnailReplacement,
  isDocumentedVideoSafetyCorrection,
  isDocumentedCalculatorSafetyCorrection,
  documentedCalculatorSafetyOverrideFiles,
  REVIEWED_CALCULATOR_SAFETY_CORRECTION,
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

const calculatorCorrection = REVIEWED_CALCULATOR_SAFETY_CORRECTION;
const calculatorBase = fs.readFileSync(new URL('../fixtures/security/macro-calculator-before-2026-10-08.html', import.meta.url), 'utf8');
const calculatorHead = fs.readFileSync(new URL('../fixtures/security/macro-calculator-after-2026-10-08.html', import.meta.url), 'utf8');
const calculatorReview = fs.readFileSync(new URL(`../../${calculatorCorrection.reviewNote}`, import.meta.url), 'utf8');
const calculatorFiles = [calculatorCorrection.file, calculatorCorrection.reviewNote, 'config/seo-active-experiments.json'];
function calculatorOptions(overrides = {}) {
  return { correction: calculatorCorrection, reviewNote: calculatorReview, changedFiles: calculatorFiles, now: new Date('2026-10-08T12:00:00Z'), ...overrides };
}

test('calculator safety exception accepts only the exact reviewed complete-file digest transition', () => {
  assert.equal(isDocumentedCalculatorSafetyCorrection(calculatorBase, calculatorHead, calculatorOptions()), true);
  for (const [content, digest] of [[calculatorBase, calculatorCorrection.baseSha256], [calculatorHead, calculatorCorrection.headSha256]]) {
    assert.equal(createHash('sha256').update(content).digest('hex'), digest);
  }
});

test('calculator exception rejects additional content edits and byte normalization', () => {
  for (const altered of [calculatorHead.replace('<title>', '<title>New editorial title '), calculatorHead + '\n', calculatorHead.trimEnd(), calculatorHead.replace('min="1"', 'min="0"')]) {
    assert.equal(isDocumentedCalculatorSafetyCorrection(calculatorBase, altered, calculatorOptions()), false);
  }
  assert.equal(isDocumentedCalculatorSafetyCorrection(calculatorBase.trimEnd(), calculatorHead, calculatorOptions()), false);
  assert.equal(isDocumentedCalculatorSafetyCorrection(calculatorHead, calculatorHead, calculatorOptions()), false);
});

test('config cannot self-authorize another file, hash, correction ID, kind, date or review note', () => {
  for (const replacement of [
    { file: 'public/protein-calculator/index.html' }, { id: 'broad-validation-edit' }, { kind: 'input-validation' },
    { date: '2026-10-09' }, { reviewNote: 'docs/seo-experiments/unreviewed.md' },
    { baseSha256: '0'.repeat(64) }, { headSha256: '1'.repeat(64) },
  ]) {
    assert.equal(isDocumentedCalculatorSafetyCorrection(calculatorBase, calculatorHead, calculatorOptions({ correction: { ...calculatorCorrection, ...replacement } })), false);
  }
});

test('calculator exception requires contemporaneous configuration/documentation and rejects replay or future use', () => {
  for (const options of [
    calculatorOptions({ changedFiles: [calculatorCorrection.file] }),
    calculatorOptions({ changedFiles: [calculatorCorrection.file, calculatorCorrection.reviewNote] }),
    calculatorOptions({ reviewNote: '' }),
    calculatorOptions({ reviewNote: calculatorReview.replace(calculatorCorrection.headSha256, '') }),
    calculatorOptions({ baseCorrections: [calculatorCorrection] }),
    calculatorOptions({ now: new Date('2026-10-07T23:59:59Z') }),
    calculatorOptions({ now: 'invalid-date' }),
  ]) assert.equal(isDocumentedCalculatorSafetyCorrection(calculatorBase, calculatorHead, options), false);
});

function calculatorLock(id = 'calculator-test') {
  return { id, url: '/protein-calculator/', files: [calculatorCorrection.file, 'public/protein-calculator/index.html'], launchedAt: '2026-09-29', lockUntil: '2026-10-20', preferredReviewAt: '2026-10-27' };
}
function calculatorRef(ref, file) {
  if (file === calculatorCorrection.file) return ref === 'base' ? calculatorBase : calculatorHead;
  if (file === calculatorCorrection.reviewNote && ref === 'head') return calculatorReview;
  throw new Error(`Unexpected public fixture path ${file}`);
}

test('calculator governance exempts only the reviewed file while other protected targets remain locked', () => {
  const lock = calculatorLock();
  const base = { version: 1, locks: [lock] };
  const head = { version: 1, locks: [{ ...lock, corrections: [calculatorCorrection] }] };
  const files = [...calculatorFiles, 'public/protein-calculator/index.html'];
  const now = new Date('2026-10-08T12:00:00Z');
  const ignored = documentedCalculatorSafetyOverrideFiles('base', 'head', files, base, head, now, calculatorRef);
  assert.deepEqual([...ignored], [calculatorCorrection.file]);
  assert.deepEqual(findActiveLockMutationViolations(base, head, now), []);
  const violations = findActiveLockViolations(files, head, now, { ignoreFiles: ignored });
  assert.equal(violations.length, 1);
  assert.deepEqual(violations[0].files, ['public/protein-calculator/index.html']);
  assert.equal(findActiveLockMutationViolations(base, { ...head, locks: [{ ...head.locks[0], lockUntil: '2026-10-08' }] }, now)[0].type, 'shortened');
});

test('calculator correction must be present in every protecting lock and cannot use an untrusted note path', () => {
  const locks = [calculatorLock('one'), calculatorLock('two')];
  const base = { version: 1, locks };
  const head = { version: 1, locks: [{ ...locks[0], corrections: [calculatorCorrection] }, locks[1]] };
  const now = new Date('2026-10-08T12:00:00Z');
  assert.equal(documentedCalculatorSafetyOverrideFiles('base', 'head', calculatorFiles, base, head, now, calculatorRef).size, 0);
  const badHead = { version: 1, locks: locks.map(lock => ({ ...lock, corrections: [{ ...calculatorCorrection, reviewNote: 'private/untrusted' }] })) };
  assert.equal(documentedCalculatorSafetyOverrideFiles('base', 'head', calculatorFiles, base, badHead, now, () => { throw new Error('Must not read an untrusted path'); }).size, 0);
  assert.equal(documentedCalculatorSafetyOverrideFiles('base', 'head', calculatorFiles, null, head, now, calculatorRef).size, 0);
});

test('reviewed calculator transition preserves every editorial, metadata and markup byte outside logic/input bounds', () => {
  const stripLogicAndNumericBounds = html => html.replace(/<script>[^]*?<\/script>/g, '').replace(/ min="1" max="100000"/g, '');
  assert.equal(stripLogicAndNumericBounds(calculatorBase), stripLogicAndNumericBounds(calculatorHead));
});
