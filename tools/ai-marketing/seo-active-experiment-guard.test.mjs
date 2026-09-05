import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findActiveLockMutationViolations,
  findActiveLockViolations,
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
