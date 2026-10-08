import { readFileSync } from 'node:fs';
import { onRequest } from 'firebase-functions/v2/https';
import { createAgentHandler } from './handler.mjs';

const read = name => readFileSync(new URL(`./bundle/${name}`, import.meta.url), 'utf8');
const handler = createAgentHandler({
  html: read('index.html'),
  markdown: read('index.md'),
  notFoundHtml: read('404.html'),
  headers: JSON.parse(read('headers.json')),
});

// This isolated codebase only serves public, build-time content. It has no app
// API, database client, user data, secrets, model calls, or outbound requests.
export const agentPages = onRequest({
  region: 'us-central1',
  invoker: 'public',
  memory: '256MiB',
  minInstances: 0,
  maxInstances: 3,
  concurrency: 80,
  timeoutSeconds: 15,
}, handler);
