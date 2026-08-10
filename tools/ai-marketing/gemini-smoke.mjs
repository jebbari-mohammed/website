#!/usr/bin/env node

import process from 'node:process';
import { GoogleGenAI } from '@google/genai';

function keys() {
  return [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2, process.env.GEMINI_API_KEY_3].filter(Boolean);
}

function models() {
  const configured = (process.env.SEO_GEMINI_MODELS || '').split(',').map((item) => item.trim()).filter(Boolean);
  return [...new Set([
    ...configured,
    process.env.SEO_GEMINI_MODEL,
    process.env.GEMINI_MODEL,
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.1-pro-preview',
    'gemini-3.5-flash-lite',
  ].filter(Boolean))];
}

function safeFailure(error) {
  const status = error?.status || error?.code || error?.response?.status || '';
  const raw = error instanceof Error ? error.message : String(error || 'unknown error');
  const message = raw
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[redacted-api-key]')
    .replace(/projects\/[^/\s]+/g, 'projects/[redacted]')
    .replace(/\s+/g, ' ')
    .slice(0, 220);
  return `${status ? `status=${status}; ` : ''}${message}`;
}

function setOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  const { appendFileSync } = require('node:fs');
  appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${String(value).replace(/\r?\n/g, ' ')}\n`);
}

async function main() {
  const apiKeys = keys();
  if (!apiKeys.length) throw new Error('No Gemini API key is configured');
  const failures = [];

  for (const model of models()) {
    const modelFailures = [];
    for (let index = 0; index < apiKeys.length; index += 1) {
      try {
        const ai = new GoogleGenAI({ apiKey: apiKeys[index] });
        const response = await ai.models.generateContent({
          model,
          contents: 'Return JSON only with exactly these fields: {"ok":true,"purpose":"seo-production-smoke"}.',
          config: {
            responseMimeType: 'application/json',
            maxOutputTokens: 256,
            thinkingConfig: { thinkingLevel: 'MEDIUM' },
          },
        });
        const parsed = JSON.parse(String(response.text || '').trim());
        if (parsed.ok !== true || parsed.purpose !== 'seo-production-smoke') throw new Error('unexpected structured response');
        console.log(`Gemini production smoke passed with ${model} using key slot ${index + 1}.`);
        if (process.env.GITHUB_OUTPUT) {
          const { appendFileSync } = await import('node:fs');
          appendFileSync(process.env.GITHUB_OUTPUT, `selected_model=${model}\nselected_key_slot=${index + 1}\n`);
        }
        return;
      } catch (error) {
        modelFailures.push(`key-slot-${index + 1}: ${safeFailure(error)}`);
      }
    }
    const diagnostic = `${model}: ${modelFailures.join(' | ')}`;
    failures.push(diagnostic);
    console.warn(`Gemini model diagnostic — ${diagnostic}`);
  }

  throw new Error(`All configured Gemini model/key combinations failed. ${failures.join(' || ')}`);
}

main().catch((error) => {
  console.error(`Gemini production smoke failed: ${safeFailure(error)}`);
  process.exitCode = 1;
});
