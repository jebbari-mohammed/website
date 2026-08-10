import { GoogleGenAI } from '@google/genai';

export function extractInteractionText(interaction = {}) {
  if (typeof interaction.output_text === 'string' && interaction.output_text.trim()) {
    return interaction.output_text.trim();
  }

  const chunks = [];
  for (const step of interaction.steps || []) {
    if (step?.type !== 'model_output') continue;
    for (const block of step.content || []) {
      if (block?.type === 'text' && typeof block.text === 'string') chunks.push(block.text);
    }
  }
  return chunks.join('\n').trim();
}

export function interactionUsedGoogleSearch(interaction = {}) {
  const usageCounts = interaction.usage?.grounding_tool_count || interaction.usage?.groundingToolCount || [];
  const counted = usageCounts.some((entry) => {
    const type = String(entry?.type || '').toLowerCase();
    return type === 'google_search' && Number(entry?.count || 0) > 0;
  });
  if (counted) return true;

  return (interaction.steps || []).some((step) => {
    const type = String(step?.type || '').toLowerCase();
    if (type.includes('google_search') || type.includes('web_search')) return true;
    try {
      const serialized = JSON.stringify(step).toLowerCase();
      return serialized.includes('google_search_result') || serialized.includes('web_search_queries');
    } catch {
      return false;
    }
  });
}

export function extractGenerateContentText(response = {}) {
  if (typeof response.text === 'string' && response.text.trim()) return response.text.trim();
  const parts = response.candidates?.[0]?.content?.parts || [];
  return parts.map((part) => typeof part?.text === 'string' ? part.text : '').filter(Boolean).join('\n').trim();
}

export function generateContentUsedGoogleSearch(response = {}) {
  return (response.candidates || []).some((candidate) => {
    const metadata = candidate?.groundingMetadata || candidate?.grounding_metadata || {};
    if (Array.isArray(metadata.webSearchQueries) && metadata.webSearchQueries.length) return true;
    if (Array.isArray(metadata.web_search_queries) && metadata.web_search_queries.length) return true;
    if (Array.isArray(metadata.groundingChunks) && metadata.groundingChunks.length) return true;
    if (Array.isArray(metadata.grounding_chunks) && metadata.grounding_chunks.length) return true;
    if (metadata.searchEntryPoint?.renderedContent || metadata.search_entry_point?.rendered_content) return true;
    try {
      const serialized = JSON.stringify(metadata).toLowerCase();
      return serialized.includes('websearchqueries') || serialized.includes('groundingchunks') || serialized.includes('searchentrypoint');
    } catch {
      return false;
    }
  });
}

export function safeGroundingFailure(error) {
  const status = error?.status || error?.code || error?.response?.status || '';
  const raw = error instanceof Error ? error.message : String(error || 'unknown error');
  const message = raw
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[redacted-api-key]')
    .replace(/projects\/[^/\s]+/g, 'projects/[redacted]')
    .replace(/\s+/g, ' ')
    .slice(0, 320);
  return `${status ? `status=${status}; ` : ''}${message}`;
}

function statusCode(error) {
  const value = Number(error?.status || error?.code || error?.response?.status || 0);
  return Number.isFinite(value) ? value : 0;
}

function modelUsesGenerateContent(model = '') {
  return /^gemini-2\.5-/i.test(String(model));
}

async function groundWithInteraction({ ai, model, prompt, maxOutputTokens, thinkingLevel }) {
  const interaction = await ai.interactions.create({
    model,
    input: prompt,
    tools: [{ type: 'google_search' }],
    store: false,
    generation_config: {
      max_output_tokens: maxOutputTokens,
      thinking_level: thinkingLevel,
    },
  });

  if (interaction.status && interaction.status !== 'completed') {
    throw new Error(`interaction status was ${interaction.status}`);
  }
  const text = extractInteractionText(interaction);
  if (!text) throw new Error('grounded interaction returned no text');
  if (!interactionUsedGoogleSearch(interaction)) {
    throw new Error('model returned text but did not prove Google Search tool use');
  }
  return { text, transport: 'interactions' };
}

async function groundWithGenerateContent({ ai, model, prompt, maxOutputTokens }) {
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      maxOutputTokens,
    },
  });
  const text = extractGenerateContentText(response);
  if (!text) throw new Error('grounded generateContent response returned no text');
  if (!generateContentUsedGoogleSearch(response)) {
    throw new Error('model returned text but grounding metadata did not prove Google Search use');
  }
  return { text, transport: 'generateContent' };
}

export async function runGroundedResearch({
  prompt,
  apiKeys,
  models,
  maxOutputTokens = 4500,
  thinkingLevel = 'medium',
}) {
  if (!String(prompt || '').trim()) throw new Error('Grounded research prompt is empty');
  if (!Array.isArray(apiKeys) || !apiKeys.length) throw new Error('No Gemini API key is configured');
  if (!Array.isArray(models) || !models.length) throw new Error('No Gemini model is configured');

  // Gemini 2.5 Search grounding is billed and quota-managed separately from
  // Gemini 3 grounding. Use it only for SERP research while keeping the actual
  // drafting/critic model ladder on the newer Gemini 3 family.
  const researchModels = [...new Set([
    'gemini-2.5-flash',
    ...models.filter(Boolean),
    'gemini-2.5-flash-lite',
  ])];
  const failures = [];
  const interactionDeniedKeys = new Set();
  for (const model of researchModels) {
    const modelFailures = [];
    const legacyTransport = modelUsesGenerateContent(model);
    for (let index = 0; index < apiKeys.length; index += 1) {
      if (!legacyTransport && interactionDeniedKeys.has(index)) {
        modelFailures.push(`key-slot-${index + 1}: skipped after an earlier Interactions authentication failure`);
        continue;
      }
      try {
        const ai = new GoogleGenAI({ apiKey: apiKeys[index] });
        const grounded = legacyTransport
          ? await groundWithGenerateContent({ ai, model, prompt, maxOutputTokens })
          : await groundWithInteraction({ ai, model, prompt, maxOutputTokens, thinkingLevel });
        return {
          text: grounded.text,
          model,
          keySlot: index + 1,
          grounded: true,
          transport: grounded.transport,
        };
      } catch (error) {
        const status = statusCode(error);
        if (!legacyTransport && (status === 401 || status === 403)) interactionDeniedKeys.add(index);
        modelFailures.push(`key-slot-${index + 1}: ${safeGroundingFailure(error)}`);
      }
    }
    failures.push(`${model} (${legacyTransport ? 'generateContent' : 'interactions'}): ${modelFailures.join(' | ')}`);
  }

  throw new Error(`All Google Search grounding attempts failed. ${failures.join(' || ')}`);
}
