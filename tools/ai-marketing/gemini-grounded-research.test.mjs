import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractGenerateContentText,
  extractInteractionText,
  generateContentUsedGoogleSearch,
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

test('requires explicit evidence that Interactions used Google Search', () => {
  assert.equal(interactionUsedGoogleSearch({ usage: { grounding_tool_count: [{ type: 'google_search', count: 1 }] } }), true);
  assert.equal(interactionUsedGoogleSearch({ steps: [{ type: 'google_search_result', results: [] }] }), true);
  assert.equal(interactionUsedGoogleSearch({ steps: [{ type: 'model_output', content: [{ type: 'text', text: 'answer' }] }] }), false);
});

test('extracts generateContent text and verifies grounding metadata', () => {
  const response = {
    text: 'Grounded 2.5 answer',
    candidates: [{
      groundingMetadata: {
        webSearchQueries: ['current fitness accountability apps'],
        groundingChunks: [{ web: { uri: 'https://example.com', title: 'Example' } }],
      },
    }],
  };
  assert.equal(extractGenerateContentText(response), 'Grounded 2.5 answer');
  assert.equal(generateContentUsedGoogleSearch(response), true);
});

test('rejects generateContent responses without grounding evidence', () => {
  const response = { text: 'Ungrounded answer', candidates: [{ content: { parts: [{ text: 'Ungrounded answer' }] } }] };
  assert.equal(generateContentUsedGoogleSearch(response), false);
});

test('grounding error diagnostics redact API keys and project identifiers', () => {
  const value = safeGroundingFailure(new Error('API key AIzaabcdefghijklmnopqrstuvwxyz123456 and projects/my-secret-project failed'));
  assert.doesNotMatch(value, /AIza/);
  assert.doesNotMatch(value, /my-secret-project/);
});
