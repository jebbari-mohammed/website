import test from 'node:test';
import assert from 'node:assert/strict';
import { createLlmClient } from './llm.js';

// Save original fetch
const originalFetch = globalThis.fetch;

test('LLM Client: fallback behavior with multiple keys', async (t) => {
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  process.env.MARKETING_LLM_PROVIDER = 'openai';
  process.env.OPENAI_API_KEY = 'invalid_key_1, valid_key_2';

  let callCount = 0;
  const requestedKeys: string[] = [];

  globalThis.fetch = async (_url, init) => {
    callCount++;
    const authHeader = (init?.headers as Record<string, string>)?.Authorization || '';
    const key = authHeader.replace('Bearer ', '');
    requestedKeys.push(key);

    if (key === 'invalid_key_1') {
      return new Response('Unauthorized', { status: 401 });
    }

    return new Response(JSON.stringify({
      choices: [{ message: { content: 'Success response from key 2' } }]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const client = createLlmClient();
  const response = await client.generate([{ role: 'user', content: 'hello' }]);

  assert.equal(response, 'Success response from key 2');
  assert.equal(callCount, 2);
  assert.deepEqual(requestedKeys, ['invalid_key_1', 'valid_key_2']);
});

test('LLM Client: throws when all keys fail', async (t) => {
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  process.env.MARKETING_LLM_PROVIDER = 'openai';
  process.env.OPENAI_API_KEY = 'invalid_key_1, invalid_key_2';

  let callCount = 0;

  globalThis.fetch = async () => {
    callCount++;
    return new Response('Unauthorized', { status: 401 });
  };

  const client = createLlmClient();
  await assert.rejects(async () => {
    await client.generate([{ role: 'user', content: 'hello' }]);
  }, /LLM request failed with status 401/);

  assert.equal(callCount, 2);
});
