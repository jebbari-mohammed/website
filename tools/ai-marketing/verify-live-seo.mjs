#!/usr/bin/env node

import process from 'node:process';

function parseArgs(argv) {
  const args = { url: '', marker: '', attempts: 16, delayMs: 15000 };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === '--url') args.url = argv[++index];
    else if (item.startsWith('--url=')) args.url = item.slice(6);
    else if (item === '--marker') args.marker = argv[++index];
    else if (item.startsWith('--marker=')) args.marker = item.slice(9);
    else if (item === '--attempts') args.attempts = Number(argv[++index]);
    else if (item.startsWith('--attempts=')) args.attempts = Number(item.slice(11));
  }
  if (!args.url || !args.marker) throw new Error('--url and --marker are required');
  const url = new URL(args.url);
  if (!['youraicoach.life', 'www.youraicoach.life'].includes(url.hostname)) throw new Error('live verifier only permits youraicoach.life');
  return args;
}

async function inspect(url, marker) {
  const response = await fetch(url, { redirect: 'follow', cache: 'no-store', signal: AbortSignal.timeout(30000) });
  const html = await response.text();
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '';
  const canonical = html.match(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/i)?.[1] || '';
  const hasExperiment = html.includes(marker);
  const pageNotFound = /page not found|404 -|<title>404/i.test(html);
  return { status: response.status, title, canonical, hasExperiment, pageNotFound };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let latest;
  for (let attempt = 1; attempt <= args.attempts; attempt += 1) {
    try {
      latest = await inspect(args.url, args.marker);
      console.log(`Live verification attempt ${attempt}/${args.attempts}: HTTP ${latest.status}, marker=${latest.hasExperiment ? 'present' : 'pending'}.`);
      if (latest.status === 200 && latest.hasExperiment && latest.title && !latest.pageNotFound) {
        console.log(`Live SEO verification passed: ${args.url}`);
        return;
      }
    } catch {
      console.log(`Live verification attempt ${attempt}/${args.attempts}: transient fetch failure.`);
    }
    if (attempt < args.attempts) await new Promise((resolve) => setTimeout(resolve, args.delayMs));
  }
  throw new Error(`live page did not expose the expected marker; last status=${latest?.status || 'unknown'}`);
}

main().catch((error) => {
  console.error(`Live SEO verification failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
