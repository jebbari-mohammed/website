import { getRuntimeConfig } from './config.js';
import { withRetry } from './retry.js';

export type LlmMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type LlmClient = {
  provider: string;
  generate(messages: LlmMessage[], options?: { temperature?: number; maxTokens?: number }): Promise<string>;
};

function fallbackText(messages: LlmMessage[]) {
  const user = [...messages].reverse().find((message) => message.role === 'user')?.content || '';
  return `LLM provider is not configured. Deterministic draft based on request:\n\n${user.slice(0, 1200)}`;
}

function getKeys(rawKey: string | undefined): string[] {
  if (!rawKey) return [];
  return rawKey.split(',').map((k) => k.trim()).filter(Boolean);
}

async function postJson(url: string, headers: Record<string, string>, body: unknown) {
  return withRetry(
    async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const text = await response.text();
        const err = new Error(`LLM request failed with status ${response.status}: ${text}`) as Error & { status?: number };
        err.status = response.status;
        throw err;
      }
      return response.json() as Promise<Record<string, unknown>>;
    },
    {
      shouldRetry: (error: unknown) => {
        // Do not retry client auth/validation errors (400, 401, 403, 404)
        if (
          error &&
          typeof error === 'object' &&
          'status' in error &&
          typeof (error as Record<string, unknown>).status === 'number'
        ) {
          const status = (error as Record<string, unknown>).status as number;
          return status >= 500 || status === 429;
        }
        return true;
      },
    }
  );
}

export function createLlmClient(): LlmClient {
  const config = getRuntimeConfig();

  if (config.llmProvider === 'openai' && config.openaiApiKey) {
    const keys = getKeys(config.openaiApiKey);
    return {
      provider: 'openai',
      async generate(messages, options) {
        let lastError: unknown;
        for (let i = 0; i < keys.length; i++) {
          const apiKey = keys[i];
          try {
            const json = await postJson(
              'https://api.openai.com/v1/chat/completions',
              { Authorization: `Bearer ${apiKey}` },
              {
                model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
                messages,
                temperature: options?.temperature ?? 0.4,
                max_tokens: options?.maxTokens ?? 2200,
              }
            );
            const choices = json.choices as Array<{ message?: { content?: string } }> | undefined;
            return choices?.[0]?.message?.content || fallbackText(messages);
          } catch (error) {
            console.warn(`OpenAI API key (index ${i}) failed, trying next key. Error:`, error instanceof Error ? error.message : error);
            lastError = error;
          }
        }
        console.error('All OpenAI API keys failed.');
        if (lastError) throw lastError;
        return fallbackText(messages);
      },
    };
  }

  if (config.llmProvider === 'anthropic' && config.anthropicApiKey) {
    const keys = getKeys(config.anthropicApiKey);
    return {
      provider: 'anthropic',
      async generate(messages, options) {
        const system = messages.find((message) => message.role === 'system')?.content || '';
        const userMessages = messages.filter((message) => message.role !== 'system');
        let lastError: unknown;
        for (let i = 0; i < keys.length; i++) {
          const apiKey = keys[i];
          try {
            const json = await postJson(
              'https://api.anthropic.com/v1/messages',
              {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
              },
              {
                model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest',
                system,
                messages: userMessages,
                temperature: options?.temperature ?? 0.4,
                max_tokens: options?.maxTokens ?? 2200,
              }
            );
            const content = json.content as Array<{ text?: string }> | undefined;
            return content?.map((item) => item.text || '').join('\n').trim() || fallbackText(messages);
          } catch (error) {
            console.warn(`Anthropic API key (index ${i}) failed, trying next key. Error:`, error instanceof Error ? error.message : error);
            lastError = error;
          }
        }
        console.error('All Anthropic API keys failed.');
        if (lastError) throw lastError;
        return fallbackText(messages);
      },
    };
  }

  if (config.llmProvider === 'gemini' && config.geminiApiKey) {
    const keys = getKeys(config.geminiApiKey);
    return {
      provider: 'gemini',
      async generate(messages, options) {
        const prompt = messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join('\n\n');
        const primaryModel = (process.env.GEMINI_MODEL || 'gemini-3.5-flash').toLowerCase();
        
        const models = [primaryModel];
        if (primaryModel !== 'gemini-1.5-flash') models.push('gemini-1.5-flash');
        if (primaryModel !== 'gemini-2.0-flash') models.push('gemini-2.0-flash');
        
        let lastError: unknown;
        for (const model of models) {
          for (let i = 0; i < keys.length; i++) {
            const apiKey = keys[i];
            try {
              const json = await postJson(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {},
                {
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: {
                    temperature: options?.temperature ?? 0.4,
                    maxOutputTokens: options?.maxTokens ?? 2200,
                  },
                }
              );
              const candidates = json.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined;
              return candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n').trim() || fallbackText(messages);
            } catch (error) {
              console.warn(`Gemini model ${model} with API key (index ${i}) failed, trying next key/model. Error:`, error instanceof Error ? error.message : error);
              lastError = error;
            }
          }
        }
        console.error('All Gemini API keys and fallback models failed.');
        if (lastError) throw lastError;
        return fallbackText(messages);
      },
    };
  }

  return {
    provider: 'none',
    async generate(messages) {
      return fallbackText(messages);
    },
  };
}
