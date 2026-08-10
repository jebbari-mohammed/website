#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publisher = path.join(__dirname, 'seo-production.mjs');

export function evaluateRunOutput(stdout = '', status = 0) {
  const text = String(stdout || '');
  if (status !== 0) {
    return { ok: false, reason: `publisher exited with status ${status}`, actionSelected: /Selected (?:CREATE|REFRESH)/.test(text), grounded: /SERP research phase: grounded\./.test(text) };
  }

  const noAction = /No eligible automatic CREATE\/REFRESH action/.test(text);
  const actionSelected = /Selected (?:CREATE|REFRESH)/.test(text);
  const grounded = /SERP research phase: grounded\./.test(text);
  const fallback = /SERP research phase: conservative fallback\./.test(text);

  if (noAction) return { ok: true, reason: 'no evidence-backed action selected', actionSelected: false, grounded: false };
  if (!actionSelected) return { ok: false, reason: 'publisher produced no recognized decision state', actionSelected: false, grounded };
  if (!grounded || fallback) return { ok: false, reason: 'live Google Search grounding was unavailable', actionSelected: true, grounded: false };
  return { ok: true, reason: 'evidence-backed action completed with live grounding', actionSelected: true, grounded: true };
}

function main() {
  const child = spawnSync(process.execPath, [publisher, ...process.argv.slice(2)], {
    env: process.env,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });

  if (child.stdout) process.stdout.write(child.stdout);
  if (child.stderr) process.stderr.write(child.stderr);

  const result = evaluateRunOutput(child.stdout, child.status ?? 1);
  if (!result.ok) {
    console.error(`SEO production runner failed closed: ${result.reason}. No website commit should proceed.`);
    process.exitCode = child.status || 1;
    return;
  }

  if (process.env.GITHUB_OUTPUT) {
    const line = `grounded=${result.grounded ? 'true' : 'false'}\n`;
    await import('node:fs').then(({ appendFileSync }) => appendFileSync(process.env.GITHUB_OUTPUT, line));
  }
  console.log(`SEO production runner verified: ${result.reason}.`);
}

main();
