import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateGscEvidence } from './gsc-evidence-gate.mjs';

test('treats a valid new zero-row property as verified no-evidence rather than an error', () => {
  assert.deepEqual(evaluateGscEvidence({
    site: 'https://youraicoach.life/',
    dimensions: ['query', 'page'],
    rows: [],
  }), {
    rowCount: 0,
    evidenceAvailable: false,
    site: 'https://youraicoach.life/',
    startDate: '',
    endDate: '',
  });
});

test('allows evidence-backed production only when private rows exist', () => {
  const result = evaluateGscEvidence({
    dimensions: ['query', 'page'],
    rows: [{ keys: ['private query', 'https://youraicoach.life/example'], impressions: 3 }],
  });
  assert.equal(result.rowCount, 1);
  assert.equal(result.evidenceAvailable, true);
});

test('fails closed for reports without both private dimensions', () => {
  assert.throws(() => evaluateGscEvidence({ dimensions: ['page'], rows: [] }), /query and page/);
  assert.throws(() => evaluateGscEvidence({ dimensions: ['query', 'page'] }), /rows must be an array/);
});
