import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { paths } from './paths.js';

const envPath = path.join(paths.repoRoot, '.env');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

export type RuntimeConfig = {
  openaiApiKey?: string;
  geminiApiKey?: string;
  anthropicApiKey?: string;
  llmProvider: 'openai' | 'gemini' | 'anthropic' | 'local' | 'none';
  postizApiKey?: string;
  postizBaseUrl: string;
};

export function getRuntimeConfig(): RuntimeConfig {
  const openaiApiKey = process.env.OPENAI_API_KEY || undefined;
  const geminiApiKey = process.env.GEMINI_API_KEY || undefined;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY || undefined;
  const requestedProvider = process.env.MARKETING_LLM_PROVIDER as RuntimeConfig['llmProvider'] | undefined;
  const inferredProvider =
    openaiApiKey ? 'openai' : geminiApiKey ? 'gemini' : anthropicApiKey ? 'anthropic' : 'none';

  return {
    openaiApiKey,
    geminiApiKey,
    anthropicApiKey,
    llmProvider: requestedProvider || inferredProvider,
    postizApiKey: process.env.POSTIZ_API_KEY || undefined,
    postizBaseUrl: process.env.POSTIZ_BASE_URL || 'https://api.postiz.com',
  };
}
