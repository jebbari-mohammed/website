import test from 'node:test';
import assert from 'node:assert/strict';
import { parseModelJson } from './model-json.mjs';

test('parses a direct JSON object', () => {
  assert.deepEqual(parseModelJson('{"title":"Useful guide","ok":true}'), {
    title: 'Useful guide',
    ok: true,
  });
});

test('parses fenced JSON', () => {
  assert.deepEqual(parseModelJson('```json\n{"answer":"yes"}\n```'), { answer: 'yes' });
});

test('extracts the first balanced object without being confused by braces in strings', () => {
  const value = 'Here is the result:\n{"html":"<p>Use {braces} safely</p>","nested":{"count":2}}\nDone.';
  assert.deepEqual(parseModelJson(value), {
    html: '<p>Use {braces} safely</p>',
    nested: { count: 2 },
  });
});

test('rejects truncated and non-object output', () => {
  assert.throws(() => parseModelJson('{"title":"cut off"'), /valid JSON object/);
  assert.throws(() => parseModelJson('[1,2,3]'), /valid JSON object/);
});
