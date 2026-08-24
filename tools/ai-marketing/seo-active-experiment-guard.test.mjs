import test from 'node:test';
import assert from 'node:assert/strict';
import { findActiveLockViolations, validateConfig } from './seo-active-experiment-guard.mjs';

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
