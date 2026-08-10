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

export function safeGroundingFailure(error) {
  const status = error?.status || error?.code || error?.response?.status || '';
  const raw = error instanceof Error ? error.message : String(error || 'unknown error');
  const message = raw
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[redacted-api-key]')
    .replace(/projects\/[^/\s]+/g, 'projects/[redacted]')
    .replace(/\s+/g, ' ')
    .slice(0, 260);
  return `${status ? `status=${status}; ` : ''}${message}`;
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

  const failures = [];
  for (const model of models) {
    const modelFailures = [];
    for (let index = 0; index < apiKeys.length; index += 1) {
      try {
        const ai = new GoogleGenAI({ apiKey: apiKeys[index] });
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
        return { text, model, keySlot: index + 1, grounded: true };
      } catch (error) {
        modelFailures.push(`key-slot-${index + 1}: ${safeGroundingFailure(error)}`);
      }
    }
    failures.push(`${model}: ${modelFailures.join(' | ')}`);
  }

  throw new Error(`All Google Search grounding attempts failed. ${failures.join(' || ')}`);
}
