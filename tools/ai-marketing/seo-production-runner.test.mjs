import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRunOutput } from './seo-production-runner.mjs';

test('allows a no-action expert decision without requiring grounding', () => {
  const result = evaluateRunOutput('No eligible automatic CREATE/REFRESH action cleared freshness, confidence, value, cooldown, and idempotency gates.\n', 0);
  assert.equal(result.ok, true);
  assert.equal(result.actionSelected, false);
});

test('allows an action only when live grounding completed', () => {
  const result = evaluateRunOutput('Selected REFRESH query-hash=abc; expected-value=88/100; confidence=high.\nSERP research phase: grounded.\nDry-run passed.\n', 0);
  assert.deepEqual(result, {
    ok: true,
    reason: 'evidence-backed action completed with live grounding',
    actionSelected: true,
    grounded: true,
  });
});

test('fails closed when the publisher used an ungrounded fallback', () => {
  const result = evaluateRunOutput('Selected CREATE query-hash=abc; expected-value=82/100; confidence=high.\nSERP research phase: conservative fallback.\n', 0);
  assert.equal(result.ok, false);
  assert.equal(result.grounded, false);
});

test('propagates publisher failures', () => {
  const result = evaluateRunOutput('Selected REFRESH query-hash=abc\n', 1);
  assert.equal(result.ok, false);
  assert.match(result.reason, /status 1/);
});
