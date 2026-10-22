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
  isDocumentedOwnerDesignRevision,
  documentedOwnerDesignOverrideFiles,
  REVIEWED_OWNER_DESIGN_REVISION,
  REVIEWED_OWNER_MEDIA_REVISION,
  REVIEWED_OWNER_DEMO_TRIM_REVISION,
  REVIEWED_OWNER_MOBILE_PERFORMANCE_REVISION,
  REVIEWED_OWNER_OPENING_RENDERS_REVISION,
  REVIEWED_SVG_RENDERING_CORRECTION,
  documentedSvgRenderingOverrideFiles,
  documentedArchiveDiscoveryOverrideFiles,
  documentedTrxPaletteOverrideFiles,
  REVIEWED_GOOGLE_PLAY_AVAILABILITY_CORRECTION,
  documentedGooglePlayAvailabilityOverrideFiles,
  validateConfig,
} from './seo-active-experiment-guard.mjs';

function googlePlayAvailabilityFixture() {
  const pinned = REVIEWED_GOOGLE_PLAY_AVAILABILITY_CORRECTION;
  const contents = Object.fromEntries(pinned.files.map(({ file }) => [file, {
    base: `Existing review status in ${file}.\n`, head: `Verified Google Play availability in ${file}.\n`,
  }]));
  const digest = value => createHash('sha256').update(value, 'utf8').digest('hex');
  const review = { ...pinned, files: pinned.files.map(({ file }) => ({ file,
    baseSha256: digest(contents[file].base), headSha256: digest(contents[file].head) })) };
  const prior = { id: 'prior-reviewed-correction', file: review.files[0]?.file, date: '2026-10-20' };
  const lock = { id: 'availability-home', url: '/', files: review.files.map(entry => entry.file),
    launchedAt: '2026-10-12', lockUntil: '2026-11-02', preferredReviewAt: '2026-11-09',
    reason: 'Protect the existing homepage experiment.', corrections: [prior] };
  const duplicate = { ...structuredClone(lock), id: 'availability-overlap', files: [review.files[0]?.file] };
  const base = { version: 1, locks: [lock, duplicate] };
  const head = structuredClone(base);
  for (const record of head.locks) record.corrections.push(...review.files.filter(entry => record.files.includes(entry.file))
    .map(entry => ({ id: review.id, kind: review.kind, date: review.date, reviewNote: review.reviewNote, ...entry })));
  const changed = ['config/seo-active-experiments.json', review.reviewNote, ...review.files.map(entry => entry.file)];
  const read = (ref, file) => file === 'config/seo-active-experiments.json' ? JSON.stringify(head) :
    file === review.reviewNote ? JSON.stringify(review) : contents[file]?.[ref] ?? null;
  const now = new Date('2026-10-22T18:00:00Z');
  const check = (reader = read, files = changed, reviewed = review, original = base, at = now) =>
    documentedGooglePlayAvailabilityOverrideFiles('base', 'head', files, original, head, at, reader, reviewed);
  return { review, contents, base, head, changed, read, check, now };
}

test('Google Play factual correction accepts only the reviewed transitions with every protecting annotation', () => {
  const f = googlePlayAvailabilityFixture();
  assert.deepEqual([...f.check()], f.review.files.map(entry => entry.file));
  assert.deepEqual(findActiveLockViolations(f.changed, f.head, f.now, { ignoreFiles: f.check() }), []);
  assert.equal(f.head.locks[0].corrections[0].id, 'prior-reviewed-correction');
});

test('Google Play correction rejects any changed byte in either side of the reviewed release', () => {
  for (const mutate of [
    f => { f.contents[f.review.files[0].file].head += '\n'; },
    f => { f.contents[f.review.files[0].file].base += '\n'; },
    f => { f.contents[f.review.files[0].file].head = f.contents[f.review.files[0].file].head.replace('\n', '\r\n'); },
    f => { f.contents[f.review.files.at(-1).file].head += 'Unrelated content'; },
  ]) {
    const f = googlePlayAvailabilityFixture(); mutate(f);
    assert.equal(f.check().size, 0);
  }
});

test('Google Play correction requires committed documentation, configuration and every reviewed file', () => {
  const f = googlePlayAvailabilityFixture();
  for (const missing of f.changed) assert.equal(f.check(f.read, f.changed.filter(file => file !== missing)).size, 0);
  assert.equal(f.check((ref, file) => file === f.review.reviewNote ? 'A factual correction.' : f.read(ref, file)).size, 0);
  assert.equal(f.check((ref, file) => file === f.review.reviewNote ? null : f.read(ref, file)).size, 0);
  const committed = JSON.stringify(f.head);
  f.head.locks[0].corrections.pop();
  assert.equal(f.check((ref, file) => file === 'config/seo-active-experiments.json' ? committed : f.read(ref, file)).size, 0);
});

test('Google Play correction rejects missing, modified or replayed annotations in any overlapping lock', () => {
  for (const mutate of [
    f => { f.head.locks[1].corrections.pop(); },
    f => { f.head.locks[0].corrections[1].headSha256 = '0'.repeat(64); },
    f => { f.head.locks[0].corrections[1].file = 'public/unrelated.html'; },
    f => { f.base.locks[0].corrections.push(structuredClone(f.head.locks[0].corrections[1])); },
    f => { f.head.locks[0].corrections.shift(); },
    f => { f.head.locks[0].corrections[0].id = 'Changed prior history'; },
  ]) {
    const f = googlePlayAvailabilityFixture(); mutate(f);
    assert.equal(f.check().size, 0);
  }
});

test('Google Play correction cannot remove, shorten, retarget or otherwise mutate a protecting lock', () => {
  for (const mutate of [
    f => { f.head.locks.pop(); },
    f => { f.head.locks[0].lockUntil = '2026-10-21'; },
    f => { f.head.locks[0].files.pop(); },
    f => { f.head.locks[0].url = '/another-page/'; },
    f => { f.head.locks[0].preferredReviewAt = '2026-11-10'; },
    f => { f.head.locks[0].reason = 'A different experiment.'; },
    f => { f.head.locks[0].ownerDirectedRevisions = []; },
  ]) {
    const f = googlePlayAvailabilityFixture(); mutate(f);
    assert.equal(f.check().size, 0);
  }
});

test('Google Play correction manifest cannot authorize a different identity or file set', () => {
  const f = googlePlayAvailabilityFixture();
  for (const replacement of [
    { id: 'generic-approval' }, { kind: 'owner-directed-presentation-revision' }, { date: '2026-10-21' },
    { reviewNote: 'docs/another-note.md' }, { files: [] }, { files: f.review.files.slice(1) },
    { files: f.review.files.map((entry, index) => index === 0 ? { ...entry, file: 'public/unrelated.html' } : entry) },
    { files: f.review.files.map((entry, index) => index === 0 ? { ...entry, headSha256: entry.baseSha256 } : entry) },
  ]) assert.equal(f.check(f.read, f.changed, { ...f.review, ...replacement }).size, 0);
  assert.equal(f.check(f.read, f.changed, f.review, null).size, 0);
  assert.equal(f.check(f.read, f.changed, f.review, f.base, new Date('2026-10-21T23:59:59Z')).size, 0);
  assert.equal(f.check(f.read, f.changed, f.review, f.base, new Date('invalid')).size, 0);
});

test('Google Play release default rejects fixture hashes and leaves an unrelated protected edit blocked', () => {
  const f = googlePlayAvailabilityFixture();
  assert.equal(documentedGooglePlayAvailabilityOverrideFiles('base', 'head', f.changed, f.base, f.head,
    f.now, f.read).size, 0);
  const unrelated = 'src/components/Unrelated.tsx';
  f.base.locks[0].files.push(unrelated);
  f.head.locks[0].files.push(unrelated);
  const changed = [...f.changed, unrelated];
  const ignored = f.check(f.read, changed);
  assert.equal(ignored.has(unrelated), false);
  const violations = findActiveLockViolations(changed, f.head, f.now, { ignoreFiles: ignored });
  assert.equal(violations.length, 1);
  assert.deepEqual(violations[0].files, [unrelated]);
});

function svgRenderingFixture() {
  const review = REVIEWED_SVG_RENDERING_CORRECTION;
  const base = { version: 1, locks: [{ id: 'rest-images', url: '/blog/how-long-to-rest-between-sets',
    files: review.files.map(f => f.file), launchedAt: '2026-10-16', lockUntil: '2026-11-06',
    preferredReviewAt: '2026-11-13', reason: 'Protect the launch.' }] };
  const head = structuredClone(base);
  head.locks[0].corrections = review.files.map(entry => ({ id: review.id, kind: review.kind,
    date: review.date, reviewNote: review.reviewNote, ...entry }));
  const changed = ['config/seo-active-experiments.json', review.reviewNote, ...review.files.map(f => f.file)];
  const contents = Object.fromEntries(review.files.map(entry => {
    const updated = fs.readFileSync(new URL(`../../${entry.file}`, import.meta.url), 'utf8');
    return [entry.file, { base: updated.replaceAll('&amp;', '&'), head: updated }];
  }));
  const read = (ref, file) => file === 'config/seo-active-experiments.json' ? JSON.stringify(head) :
    file === review.reviewNote ? JSON.stringify(review) : contents[file]?.[ref] ?? null;
  const check = (reader = read, files = changed) => documentedSvgRenderingOverrideFiles('base', 'head', files,
    base, head, new Date('2026-10-17T12:00:00Z'), reader);
  return { review, base, head, changed, contents, read, check };
}

test('accepts only the reviewed malformed-to-valid SVG file transitions', () => {
  const f = svgRenderingFixture();
  assert.deepEqual([...f.check()], f.review.files.map(entry => entry.file));
});

test('an SVG content change beyond entity escaping stays blocked', () => {
  const f = svgRenderingFixture(), file = f.review.files[0].file;
  f.contents[file].head += '<!-- unrelated -->';
  assert.equal(f.check().has(file), false);
  assert.ok(findActiveLockViolations(f.changed, f.head, new Date('2026-10-17'), { ignoreFiles: f.check() }).length);
});

test('SVG repair needs the committed review note, config, and exact hashes', () => {
  for (const missing of ['config/seo-active-experiments.json', REVIEWED_SVG_RENDERING_CORRECTION.reviewNote]) {
    const f = svgRenderingFixture();
    assert.equal(f.check(f.read, f.changed.filter(file => file !== missing)).size, 0);
  }
  const f = svgRenderingFixture();
  assert.equal(f.check((ref, file) => file === f.review.reviewNote ? 'rendering correction' : f.read(ref, file)).size, 0);
  const file = f.review.files[0].file;
  f.head.locks[0].corrections[0].headSha256 = '0'.repeat(64);
  assert.equal(f.check().has(file), false);
});

test('uncommitted annotations cannot approve an SVG repair', () => {
  const f = svgRenderingFixture(), committed = JSON.stringify(f.head);
  f.head.locks[0].corrections.pop();
  assert.equal(f.check((ref, file) => file === 'config/seo-active-experiments.json' ? committed : f.read(ref, file)).size, 0);
});

test('SVG repair cannot remove, shorten, or retarget a lock or replay an old approval', () => {
  for (const mutate of [f => f.head.locks.pop(), f => { f.head.locks[0].lockUntil = '2026-10-16'; },
    f => { f.head.locks[0].files.pop(); }, f => { f.base.locks[0].corrections = structuredClone(f.head.locks[0].corrections); }]) {
    const f = svgRenderingFixture(); mutate(f); assert.equal(f.check().size, 0);
  }
});

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

test('the root homepage document can be locked and remains protected during its evaluation window', () => {
  const homepageConfig = { version: 1, locks: [{ ...config.locks[0], files: ['index.html'] }] };
  assert.equal(validateConfig(homepageConfig), homepageConfig);
  const violations = findActiveLockViolations(['index.html'], homepageConfig,
    new Date(`${homepageConfig.locks[0].launchedAt}T12:00:00Z`));
  assert.equal(violations.length, 1);
  assert.deepEqual(violations[0].files, ['index.html']);
});

test('root homepage lock support does not allow other root files or nonexact homepage paths', () => {
  for (const file of ['package.json', 'index.htm', './index.html', '/index.html', '../index.html']) {
    assert.throws(() => validateConfig({ version: 1, locks: [{ ...config.locks[0], files: [file] }] }),
      /unsupported path/);
  }
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

const ownerReview = REVIEWED_OWNER_DESIGN_REVISION;
const ownerFixtureBytes = Object.fromEntries(ownerReview.files.map(({ file }) => [file, {
  base: `Complete original UTF-8 presentation: ${file}\n`,
  head: `Complete reviewed UTF-8 presentation: ${file}\n`,
}]));
const ownerDigest = content => createHash('sha256').update(content, 'utf8').digest('hex');
const ownerFixtureReview = { ...ownerReview, files: ownerReview.files.map(({ file }) => ({
  file, baseSha256: ownerDigest(ownerFixtureBytes[file].base), headSha256: ownerDigest(ownerFixtureBytes[file].head),
})) };
const ownerFiles = [...ownerReview.files.map(entry => entry.file), ownerReview.reviewNote, 'config/seo-active-experiments.json'];
const ownerNow = new Date('2026-10-12T12:00:00Z');
const ownerNote = [ownerFixtureReview.id, ownerFixtureReview.kind, ownerFixtureReview.date,
  ...ownerFixtureReview.files.flatMap(entry => [entry.file, entry.baseSha256, entry.headSha256])].join('\n');
function ownerRecord(file = ownerFixtureReview.files[0].file) {
  const entry = ownerFixtureReview.files.find(item => item.file === file);
  return { id: ownerFixtureReview.id, kind: ownerFixtureReview.kind, date: ownerFixtureReview.date,
    ...entry, reviewNote: ownerFixtureReview.reviewNote };
}
function ownerOptions(overrides = {}) {
  return { revision: ownerRecord(), reviewNote: ownerNote, changedFiles: ownerFiles, now: ownerNow, ...overrides };
}
function ownerConfigs() {
  const styleFiles = ownerReview.files.map(entry => entry.file).filter(file => file !== 'src/components/Hero.tsx');
  const locks = [
    { id: 'owner-homepage-presentation-refinement-2026-10-12', url: '/', files: styleFiles,
      launchedAt: '2026-10-12', lockUntil: '2026-11-02', preferredReviewAt: '2026-11-09', reason: 'Original presentation attribution.' },
    { id: 'owner-requested-opening-film-2026-10-12', url: '/', files: ['src/components/Hero.tsx'],
      launchedAt: '2026-10-12', lockUntil: '2026-11-02', preferredReviewAt: '2026-11-09', reason: 'Original film attribution.' },
  ];
  const base = { version: 1, locks };
  const head = { version: 1, locks: locks.map(lock => ({ ...structuredClone(lock),
    ownerDirectedRevisions: lock.files.map(file => ownerRecord(file)) })) };
  return { base, head };
}
function ownerFixtureRef(headConfig, { review = ownerNote, committedConfig = headConfig } = {}) {
  return (ref, file) => {
    if (ref === 'head' && file === 'config/seo-active-experiments.json') return JSON.stringify(committedConfig);
    if (ref === 'head' && file === ownerReview.reviewNote) return review;
    if (ownerFixtureBytes[file]) return ownerFixtureBytes[file][ref];
    throw new Error(`Unapproved fixture path must never be read: ${file}`);
  };
}

test('owner design exception validates an entire reviewed byte transition, not a generic approval flag', () => {
  for (const { file } of ownerFixtureReview.files) {
    const bytes = ownerFixtureBytes[file];
    assert.equal(isDocumentedOwnerDesignRevision(bytes.base, bytes.head,
      ownerOptions({ revision: ownerRecord(file) }), ownerFixtureReview), true);
  }
  const bytes = ownerFixtureBytes[ownerFixtureReview.files[0].file];
  for (const altered of [bytes.head + '\n', bytes.head.trimEnd(), bytes.head.replace('\n', '\r\n'), bytes.head + 'Unreviewed copy']) {
    assert.equal(isDocumentedOwnerDesignRevision(bytes.base, altered, ownerOptions(), ownerFixtureReview), false);
  }
  assert.equal(isDocumentedOwnerDesignRevision(bytes.base, bytes.base, ownerOptions(), ownerFixtureReview), false);
  assert.equal(isDocumentedOwnerDesignRevision(bytes.base + '\n', bytes.head, ownerOptions(), ownerFixtureReview), false);
})

test('owner design metadata cannot approve another file, transition or review record', () => {
  const bytes = ownerFixtureBytes[ownerFixtureReview.files[0].file];
  for (const replacement of [
    { file: 'src/components/OpeningVideo.tsx' }, { id: 'owner-approved-anything' }, { kind: 'rendering-correction' },
    { date: '2026-10-13' }, { reviewNote: 'docs/seo-experiments/unreviewed-design.md' },
    { baseSha256: '0'.repeat(64) }, { headSha256: '1'.repeat(64), approved: true },
  ]) {
    assert.equal(isDocumentedOwnerDesignRevision(bytes.base, bytes.head,
      ownerOptions({ revision: { ...ownerRecord(), ...replacement } }), ownerFixtureReview), false);
  }
})

test('owner revision requires contemporaneous doc/config, reviewed hashes, and rejects replay or premature use', () => {
  const bytes = ownerFixtureBytes[ownerFixtureReview.files[0].file];
  for (const options of [
    ownerOptions({ changedFiles: [ownerRecord().file] }),
    ownerOptions({ changedFiles: [ownerRecord().file, ownerReview.reviewNote] }),
    ownerOptions({ changedFiles: ['config/seo-active-experiments.json', ownerReview.reviewNote] }),
    ownerOptions({ reviewNote: '' }),
    ownerOptions({ reviewNote: ownerNote.replace(ownerRecord().headSha256, '') }),
    ownerOptions({ baseRevisions: [ownerRecord('src/components/Hero.tsx')] }),
    ownerOptions({ now: new Date('2026-10-11T23:59:59Z') }), ownerOptions({ now: 'invalid-date' }),
  ]) assert.equal(isDocumentedOwnerDesignRevision(bytes.base, bytes.head, options, ownerFixtureReview), false);
  const pending = { ...ownerFixtureReview, files: ownerFixtureReview.files.map(entry => ({ ...entry, headSha256: 'PENDING_REVIEWED_OUTPUT' })) };
  assert.equal(isDocumentedOwnerDesignRevision(bytes.base, bytes.head, ownerOptions(), pending), false);
})

test('release path stays fixed to the production manifest and cannot authorize test-fixture hashes', () => {
  const { base, head } = ownerConfigs();
  assert.equal(documentedOwnerDesignOverrideFiles('base', 'head', ownerFiles, base, head, ownerNow, ownerFixtureRef(head)).size, 0);
  for (const entry of ownerReview.files) {
    assert.match(entry.baseSha256, /^[a-f0-9]{64}$/);
    assert.match(entry.headSha256, /^[a-f0-9]{64}$/);
  }
})

test('owner design governance authorizes only exact reviewed files while preserving original lock definitions', () => {
  const { base, head } = ownerConfigs();
  const ignored = documentedOwnerDesignOverrideFiles('base', 'head', ownerFiles, base, head, ownerNow,
    ownerFixtureRef(head), ownerFixtureReview);
  assert.deepEqual([...ignored], ownerFixtureReview.files.map(entry => entry.file));
  assert.deepEqual(findActiveLockMutationViolations(base, head, ownerNow), []);
  assert.deepEqual(findActiveLockViolations(ownerFiles, head, ownerNow, { ignoreFiles: ignored }), []);
})

test('owner design governance requires a committed review note and the actual committed config', () => {
  const { base, head } = ownerConfigs();
  for (const [files, reader] of [
    [ownerFiles.filter(file => file !== ownerReview.reviewNote), ownerFixtureRef(head)],
    [ownerFiles, ownerFixtureRef(head, { review: null })],
    [ownerFiles, ownerFixtureRef(head, { committedConfig: base })],
  ]) assert.equal(documentedOwnerDesignOverrideFiles('base', 'head', files, base, head, ownerNow, reader, ownerFixtureReview).size, 0);
})

test('every active lock covering the same file must acknowledge the exact owner revision', () => {
  const { base, head } = ownerConfigs();
  const file = ownerFixtureReview.files[0].file;
  base.locks.push({ ...structuredClone(base.locks[0]), id: 'second-covering-lock', files: [file] });
  head.locks.push(structuredClone(base.locks.at(-1)));
  const ignored = documentedOwnerDesignOverrideFiles('base', 'head', ownerFiles, base, head, ownerNow,
    ownerFixtureRef(head), ownerFixtureReview);
  assert.equal(ignored.has(file), false);
  assert.ok(findActiveLockViolations(ownerFiles, head, ownerNow, { ignoreFiles: ignored }).some(lock => lock.id === 'second-covering-lock'));
})

test('unapproved protected source files stay blocked even if config appends an owner revision record for them', () => {
  const { base, head } = ownerConfigs();
  const unapproved = 'src/components/OpeningVideo.tsx';
  base.locks[0].files.push(unapproved);
  head.locks[0].files.push(unapproved);
  head.locks[0].ownerDirectedRevisions.push({ ...ownerRecord(), file: unapproved });
  const files = [...ownerFiles, unapproved];
  const ignored = documentedOwnerDesignOverrideFiles('base', 'head', files, base, head, ownerNow,
    ownerFixtureRef(head), ownerFixtureReview);
  assert.equal(ignored.has(unapproved), false);
  assert.deepEqual(findActiveLockViolations(files, head, ownerNow, { ignoreFiles: ignored })[0].files, [unapproved]);
})

test('owner revision cannot weaken or otherwise change original lock fields', () => {
  for (const change of [
    lock => { lock.lockUntil = '2026-10-13'; }, lock => { lock.url = '/another-page'; },
    lock => { lock.files.pop(); }, lock => { lock.launchedAt = '2026-10-11'; },
    lock => { lock.preferredReviewAt = '2026-11-10'; }, lock => { lock.reason = 'Replacement rationale'; },
  ]) {
    const { base, head } = ownerConfigs();
    change(head.locks[0]);
    const ignored = documentedOwnerDesignOverrideFiles('base', 'head', ownerFiles, base, head, ownerNow,
      ownerFixtureRef(head), ownerFixtureReview);
    assert.equal(ignored.has(ownerFixtureReview.files[0].file), false);
    assert.ok(findActiveLockMutationViolations(base, head, ownerNow).length ||
      findActiveLockViolations(ownerFiles, head, ownerNow, { ignoreFiles: ignored }).length);
  }
  const { base, head } = ownerConfigs();
  head.locks.pop();
  assert.equal(documentedOwnerDesignOverrideFiles('base', 'head', ownerFiles, base, head, ownerNow,
    ownerFixtureRef(head), ownerFixtureReview).size, 0);
  assert.equal(findActiveLockMutationViolations(base, head, ownerNow)[0].type, 'removed');
})


function ownerMediaFixture(manifest = REVIEWED_OWNER_MEDIA_REVISION) {
  const contents = Object.fromEntries(manifest.files.map(({ file }) => [file, {
    base: `Original media presentation: ${file}\n`, head: `Reviewed media presentation: ${file}\n`,
  }]));
  const review = { ...manifest, files: manifest.files.map(({ file }) => ({ file,
    baseSha256: ownerDigest(contents[file].base), headSha256: ownerDigest(contents[file].head),
  })) };
  const record = entry => ({ id: review.id, kind: review.kind, date: review.date,
    reviewNote: review.reviewNote, ...entry });
  const prior = { id: ownerReview.id, kind: ownerReview.kind, date: ownerReview.date,
    file: ownerReview.files[0].file, baseSha256: ownerReview.files[0].baseSha256,
    headSha256: ownerReview.files[0].headSha256, reviewNote: ownerReview.reviewNote };
  const base = { version: 1, locks: [{ id: 'existing-media-lock', url: '/',
    files: review.files.map(entry => entry.file), launchedAt: '2026-10-12', lockUntil: '2026-11-02',
    preferredReviewAt: '2026-11-09', reason: 'Preserve the existing presentation experiment.',
    ownerDirectedRevisions: [prior] }] };
  const head = structuredClone(base);
  head.locks[0].ownerDirectedRevisions.push(...review.files.map(record));
  const files = ['config/seo-active-experiments.json', review.reviewNote, ...review.files.map(entry => entry.file)];
  const now = new Date('2026-10-18T12:00:00Z');
  const note = [review.id, review.kind, review.date,
    ...review.files.flatMap(entry => [entry.file, entry.baseSha256, entry.headSha256])].join('\n');
  const read = (ref, file) => file === 'config/seo-active-experiments.json' ? JSON.stringify(head) :
    file === review.reviewNote ? note : contents[file]?.[ref] ?? null;
  const check = (reader = read, changed = files, reviewed = review) => documentedOwnerDesignOverrideFiles(
    'base', 'head', changed, base, head, now, reader, reviewed);
  return { review, contents, base, head, files, now, note, record, read, check };
}

test('replacement opening renders permit only the reviewed source transition and retain the lock', () => {
  const f = ownerMediaFixture(REVIEWED_OWNER_OPENING_RENDERS_REVISION);
  f.now.setUTCDate(19);
  assert.deepEqual([...f.check()], ['src/components/OpeningVideo.tsx']);
  assert.deepEqual(findActiveLockMutationViolations(f.base, f.head, f.now), []);
  const file = f.review.files[0].file;
  f.contents[file].head += '\n';
  assert.equal(f.check().size, 0, 'An additional source change is outside this reviewed replacement');
});

test('replacement render approval cannot replay or shorten the prior observation window', () => {
  for (const mutation of [
    f => { f.base.locks[0].ownerDirectedRevisions.push(f.record(f.review.files[0])); },
    f => { f.head.locks[0].lockUntil = '2026-10-19'; },
    f => { f.head.locks[0].ownerDirectedRevisions.at(-1).headSha256 = '0'.repeat(64); },
  ]) {
    const f = ownerMediaFixture(REVIEWED_OWNER_OPENING_RENDERS_REVISION);
    f.now.setUTCDate(19);
    mutation(f);
    assert.equal(f.check().size, 0);
  }
});

test('the separate owner media revision accepts exact reviewed transitions and retains prior approval records', () => {
  const f = ownerMediaFixture();
  const ignored = f.check();
  assert.deepEqual([...ignored], f.review.files.map(entry => entry.file));
  assert.deepEqual(findActiveLockMutationViolations(f.base, f.head, f.now), []);
  assert.deepEqual(findActiveLockViolations(f.files, f.head, f.now, { ignoreFiles: ignored }), []);
  assert.deepEqual(f.head.locks[0].ownerDirectedRevisions[0], f.base.locks[0].ownerDirectedRevisions[0]);
});

test('owner media manifest cannot inherit another identity, date, note, file set or generic approval', () => {
  const f = ownerMediaFixture(), entry = f.review.files[0], bytes = f.contents[entry.file];
  const options = { revision: f.record(entry), reviewNote: f.note, changedFiles: f.files, now: f.now };
  for (const replacement of [
    { id: 'owner-approved-anything' }, { id: ownerReview.id }, { kind: 'rendering-correction' },
    { date: '2026-10-12' }, { reviewNote: ownerReview.reviewNote },
    { files: f.review.files.slice(1) }, { files: [...f.review.files].reverse() },
    { files: [{ ...entry, file: 'src/components/Hero.tsx' }, ...f.review.files.slice(1)] },
    { files: [null, ...f.review.files.slice(1)] },
  ]) assert.equal(isDocumentedOwnerDesignRevision(bytes.base, bytes.head, options,
    { ...f.review, approved: true, ...replacement }), false);
});

test('owner media transition is byte-exact and cannot use a copied annotation for another file', () => {
  const f = ownerMediaFixture(), file = f.review.files[0].file;
  f.contents[file].head += '\n';
  assert.equal(f.check().has(file), false);
  const unapproved = 'src/components/Hero.tsx';
  f.base.locks[0].files.push(unapproved);
  f.head.locks[0].files.push(unapproved);
  f.head.locks[0].ownerDirectedRevisions.push({ ...f.record(f.review.files[0]), file: unapproved });
  assert.equal(f.check(f.read, [...f.files, unapproved]).has(unapproved), false);
});

test('owner media revision needs its own committed note, config, exact record and elapsed request date', () => {
  for (const missing of ['config/seo-active-experiments.json', REVIEWED_OWNER_MEDIA_REVISION.reviewNote]) {
    const f = ownerMediaFixture();
    assert.equal(f.check(f.read, f.files.filter(file => file !== missing)).size, 0);
  }
  const f = ownerMediaFixture(), entry = f.review.files[0], bytes = f.contents[entry.file];
  for (const override of [
    { reviewNote: f.note.replace(entry.headSha256, '') }, { now: new Date('2026-10-17T23:59:59Z') },
    { now: 'invalid-date' }, { revision: { ...f.record(entry), headSha256: '0'.repeat(64) } },
    { baseRevisions: [f.record(f.review.files[1])] },
  ]) assert.equal(isDocumentedOwnerDesignRevision(bytes.base, bytes.head, {
    revision: f.record(entry), reviewNote: f.note, changedFiles: f.files, now: f.now, ...override,
  }, f.review), false);
  assert.equal(f.check((ref, file) => file === f.review.reviewNote ? null : f.read(ref, file)).size, 0);
  assert.equal(f.check((ref, file) => file === 'config/seo-active-experiments.json'
    ? JSON.stringify(f.base) : f.read(ref, file)).size, 0);
});

test('owner media approval cannot replay, alter prior records or redefine existing locks', () => {
  for (const mutate of [
    f => { f.base.locks[0].ownerDirectedRevisions.push(f.record(f.review.files[0])); },
    f => { f.head.locks[0].ownerDirectedRevisions[0].id = 'rewritten-approval'; },
    f => { f.head.locks[0].ownerDirectedRevisions.shift(); },
    f => { f.head.locks[0].lockUntil = '2026-10-18'; },
    f => { f.head.locks[0].reason = 'Replaced experiment rationale'; },
    f => { f.head.locks[0].preferredReviewAt = '2026-11-10'; },
    f => { f.head.locks[0].files.pop(); },
  ]) {
    const f = ownerMediaFixture(); mutate(f); assert.equal(f.check().size, 0);
  }
  const f = ownerMediaFixture(), file = f.review.files[0].file;
  f.base.locks.push({ ...structuredClone(f.base.locks[0]), id: 'overlapping-media-lock', files: [file] });
  f.head.locks.push(structuredClone(f.base.locks.at(-1)));
  assert.equal(f.check().has(file), false);
});

test('production media manifest stays pinned and the prior owner default still rejects media fixture hashes', () => {
  const f = ownerMediaFixture();
  assert.equal(f.check(f.read, f.files, REVIEWED_OWNER_MEDIA_REVISION).size, 0);
  assert.equal(documentedOwnerDesignOverrideFiles('base', 'head', f.files, f.base, f.head, f.now, f.read).size, 0);
  for (const entry of REVIEWED_OWNER_MEDIA_REVISION.files) {
    assert.match(entry.baseSha256, /^[a-f0-9]{64}$/);
    assert.match(entry.headSha256, /^[a-f0-9]{64}$/);
    assert.notEqual(entry.baseSha256, entry.headSha256);
  }
});

test('demo trim review accepts only the exact showcase transition while preserving earlier records', () => {
  const f = ownerMediaFixture(REVIEWED_OWNER_DEMO_TRIM_REVISION);
  assert.deepEqual([...f.check()], ['src/components/ProductShowcase.tsx']);
  assert.deepEqual(f.head.locks[0].ownerDirectedRevisions[0], f.base.locks[0].ownerDirectedRevisions[0]);
  f.contents['src/components/ProductShowcase.tsx'].head += '\n';
  assert.equal(f.check().size, 0);
});

test('demo trim review cannot approve opening-film changes or redefine an active lock', () => {
  const f = ownerMediaFixture(REVIEWED_OWNER_DEMO_TRIM_REVISION);
  const entry = f.review.files[0], bytes = f.contents[entry.file];
  const options = { revision: { ...f.record(entry), file: 'src/components/OpeningVideo.tsx' },
    reviewNote: f.note, changedFiles: [...f.files, 'src/components/OpeningVideo.tsx'], now: f.now };
  assert.equal(isDocumentedOwnerDesignRevision(bytes.base, bytes.head, options, f.review), false);
  f.head.locks[0].reason = 'A different attribution window';
  assert.equal(f.check().size, 0);
});

test('mobile performance review accepts only its three byte-exact transitions and preserves previous records', () => {
  const f = ownerMediaFixture(REVIEWED_OWNER_MOBILE_PERFORMANCE_REVISION);
  const files = ['src/components/Hero.tsx', 'src/components/Navigation.tsx', 'src/components/ProductShowcase.tsx'];
  assert.deepEqual([...f.check()], files);
  assert.deepEqual(findActiveLockMutationViolations(f.base, f.head, f.now), []);
  assert.deepEqual(f.head.locks[0].ownerDirectedRevisions[0], f.base.locks[0].ownerDirectedRevisions[0]);
  for (const file of files) {
    const read = (ref, requested) => ref === 'head' && requested === file
      ? f.contents[file].head + '\n' : f.read(ref, requested);
    assert.deepEqual([...f.check(read)], files.filter(candidate => candidate !== file));
  }
  assert.equal(f.check(f.read, f.files, REVIEWED_OWNER_MOBILE_PERFORMANCE_REVISION).size, 0);
});

test('mobile performance review cannot approve another identity, file set, missing review or changed lock', () => {
  const f = ownerMediaFixture(REVIEWED_OWNER_MOBILE_PERFORMANCE_REVISION);
  const entry = f.review.files[0], bytes = f.contents[entry.file];
  const options = { revision: f.record(entry), reviewNote: f.note, changedFiles: f.files, now: f.now };
  for (const replacement of [
    { id: REVIEWED_OWNER_DEMO_TRIM_REVISION.id }, { reviewNote: REVIEWED_OWNER_MEDIA_REVISION.reviewNote },
    { files: f.review.files.slice(1) }, { files: [...f.review.files].reverse() },
    { files: [{ ...entry, file: 'src/components/OpeningVideo.tsx' }, ...f.review.files.slice(1)] },
  ]) assert.equal(isDocumentedOwnerDesignRevision(bytes.base, bytes.head, options, { ...f.review, ...replacement }), false);
  assert.equal(f.check(f.read, f.files.filter(file => file !== f.review.reviewNote)).size, 0);
  f.head.locks[0].lockUntil = '2026-10-18';
  assert.equal(f.check().size, 0);
});

test('archive discovery correction preserves protected copy and accepts only its reviewed one-day transition', () => {
  const original = 'protected card<!-- BLOG_ARCHIVE_START -->old<!-- BLOG_ARCHIVE_END -->footer';
  const updated = 'protected card<!-- BLOG_ARCHIVE_START -->new; old<!-- BLOG_ARCHIVE_END -->footer';
  const sha = v => createHash('sha256').update(v).digest('hex');
  const record = { id: 'fixture', kind: 'archive-discovery', date: '2026-10-18', file: 'public/blog/index.html',
    baseSha256: sha(original), headSha256: sha(updated), reviewNote: 'docs/seo-experiments/fixture.md' };
  const base = { version: 1, locks: [{ id: 'archive', url: '/blog/', files: [record.file], launchedAt: '2026-09-27', lockUntil: '2026-10-18', preferredReviewAt: '2026-10-25', reason: 'protected experiment' }] };
  const head = structuredClone(base); head.locks[0].corrections = [record];
  const files = [record.file, record.reviewNote, 'config/seo-active-experiments.json'];
  const reader = (ref, file) => file === record.file ? (ref === 'base' ? original : updated) : file === record.reviewNote ? Object.values(record).join(' ') : JSON.stringify(head);
  const run = (b=base,h=head,at='2026-10-18T14:00:00Z',read=reader) => documentedArchiveDiscoveryOverrideFiles('base','head',files,b,h,new Date(at),read,record);
  assert.deepEqual([...run()], [record.file]);
  for (const at of ['2026-10-17T14:00:00Z','2026-10-19T14:00:00Z']) assert.equal(run(base,head,at).size,0);
  assert.equal(run(head,head).size,0); // No replay.
  for (const change of [s => s.replace('protected card','changed card'), s => s+'extra']) {
    assert.equal(run(base,head,undefined,(ref,f) => f===record.file && ref==='head' ? change(updated) : reader(ref,f)).size,0);
  }
  assert.equal(run(base,head,undefined,(ref,f) => f===record.reviewNote ? '' : reader(ref,f)).size,0);
  const weakened=structuredClone(head);weakened.locks[0].lockUntil='2026-10-17';assert.equal(run(base,weakened).size,0);
});

test('palette rendering exception preserves all article text and rejects replay, other bytes and weakened locks',()=>{
 const before='<style>p{color:#123}</style><article>Approved answer</article>';
 const after='<style>p{color:#fff}</style><article>Approved answer</article>';
 const sha=s=>createHash('sha256').update(s).digest('hex');
 const r={id:'palette',kind:'article-palette-rendering',date:'2026-10-18',file:'public/blog/trx-workout.html',baseSha256:sha(before),headSha256:sha(after),reviewNote:'docs/seo-experiments/palette.md'};
 const base={version:1,locks:[{id:'trx',url:'/blog/trx-workout',files:[r.file],launchedAt:'2026-10-18',lockUntil:'2026-11-08',preferredReviewAt:'2026-11-15',reason:'Preserve answer'}]};
 const head=structuredClone(base);head.locks[0].corrections=[r];
 const files=[r.file,r.reviewNote,'config/seo-active-experiments.json'];
 const reader=(ref,f)=>f===r.file?(ref==='base'?before:after):f===r.reviewNote?Object.values(r).join(' '):JSON.stringify(head);
 const run=(b=base,h=head,read=reader)=>documentedTrxPaletteOverrideFiles('base','head',files,b,h,new Date('2026-10-18T14:00:00Z'),read,r);
 assert.deepEqual([...run()],[r.file]);assert.equal(run(head,head).size,0);
 for (const change of [s=>s.replace('Approved answer','Changed answer'),s=>s+'extra',s=>s.replace('#fff','#eee')]) assert.equal(run(base,head,(ref,f)=>ref==='head'&&f===r.file?change(after):reader(ref,f)).size,0);
 assert.equal(run(base,head,(ref,f)=>f===r.reviewNote?'':reader(ref,f)).size,0);
 const weakened=structuredClone(head);weakened.locks[0].lockUntil='2026-10-18';assert.equal(run(base,weakened).size,0);
});
