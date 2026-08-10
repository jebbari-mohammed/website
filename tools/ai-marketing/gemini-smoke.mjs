#!/usr/bin/env node

import process from 'node:process';
import { GoogleGenAI } from '@google/genai';

function keys() {
  return [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2, process.env.GEMINI_API_KEY_3].filter(Boolean);
}

function models() {
  return [...new Set([
    process.env.SEO_GEMINI_MODEL,
    process.env.GEMINI_MODEL,
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
  ].filter(Boolean))];
}

async function main() {
  if (!keys().length) throw new Error('No Gemini API key is configured');
  let lastError;
  for (const model of models()) {
    for (const apiKey of keys()) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model,
          contents: 'Return JSON only with exactly these fields: {"ok":true,"purpose":"seo-production-smoke"}.',
          config: { responseMimeType: 'application/json', maxOutputTokens: 128 },
        });
        const parsed = JSON.parse(String(response.text || '').trim());
        if (parsed.ok !== true || parsed.purpose !== 'seo-production-smoke') throw new Error('unexpected structured response');
        console.log(`Gemini production smoke passed with ${model}.`);
        return;
      } catch (error) {
        lastError = error;
      }
    }
  }
  throw new Error(`All configured Gemini model/key combinations failed (${lastError?.message || 'unknown error'})`);
}

main().catch((error) => {
  console.error(`Gemini production smoke failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
