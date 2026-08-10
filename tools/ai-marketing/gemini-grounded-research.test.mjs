import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractInteractionText,
  interactionUsedGoogleSearch,
  safeGroundingFailure,
} from './gemini-grounded-research.mjs';

test('extracts SDK output_text when present', () => {
  assert.equal(extractInteractionText({ output_text: '  Grounded answer  ' }), 'Grounded answer');
});

test('extracts text from model_output steps', () => {
  const interaction = {
    steps: [
      { type: 'google_search', query: 'example' },
      { type: 'model_output', content: [{ type: 'text', text: 'First' }, { type: 'text', text: 'Second' }] },
    ],
  };
  assert.equal(extractInteractionText(interaction), 'First\nSecond');
});

test('requires explicit evidence that Google Search was used', () => {
  assert.equal(interactionUsedGoogleSearch({ usage: { grounding_tool_count: [{ type: 'google_search', count: 1 }] } }), true);
  assert.equal(interactionUsedGoogleSearch({ steps: [{ type: 'google_search_result', results: [] }] }), true);
  assert.equal(interactionUsedGoogleSearch({ steps: [{ type: 'model_output', content: [{ type: 'text', text: 'answer' }] }] }), false);
});

test('grounding error diagnostics redact API keys and project identifiers', () => {
  const value = safeGroundingFailure(new Error('API key AIzaabcdefghijklmnopqrstuvwxyz123456 and projects/my-secret-project failed'));
  assert.doesNotMatch(value, /AIza/);
  assert.doesNotMatch(value, /my-secret-project/);
});
