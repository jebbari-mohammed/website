#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import process from 'node:process';

const LIMIT = Number(process.env.SEO_WEEKLY_NEW_POST_LIMIT || 3);
const OVERRIDE = /^(1|true|yes)$/i.test(process.env.SEO_PUBLISH_OVERRIDE || '');

function mondayUtc(now = new Date()) {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const mondayIndex = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayIndex);
  return date;
}

function addedBlogFilesSince(since) {
  const output = execFileSync('git', [
    'log',
    `--since=${since.toISOString()}`,
    '--diff-filter=A',
    '--name-only',
    '--format=',
    '--',
    'public/blog/*.html',
  ], { encoding: 'utf8' });

  return [...new Set(
    output
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter((value) => /^public\/blog\/[^/]+\.html$/.test(value) && value !== 'public/blog/index.html'),
  )];
}

function main() {
  if (!Number.isInteger(LIMIT) || LIMIT < 1 || LIMIT > 10) {
    throw new Error(`SEO_WEEKLY_NEW_POST_LIMIT must be an integer from 1 to 10; received ${LIMIT}`);
  }

  const start = mondayUtc();
  const files = addedBlogFilesSince(start);
  const summary = `${files.length}/${LIMIT} new top-level English blog posts since ${start.toISOString()}`;

  if (files.length > LIMIT && !OVERRIDE) {
    console.error(`Weekly SEO publish guard BLOCKED: ${summary}.`);
    console.error('The site is intentionally capped to avoid accidental scaled-content publishing.');
    console.error('If a supervised exception is genuinely required, set SEO_PUBLISH_OVERRIDE=true for that one run.');
    for (const file of files) console.error(`- ${file}`);
    process.exitCode = 1;
    return;
  }

  if (files.length >= LIMIT && !OVERRIDE) {
    console.log(`Weekly SEO publish guard: ${summary}. Weekly creation budget is exhausted; do not add another page.`);
    return;
  }

  console.log(`Weekly SEO publish guard passed: ${summary}.`);
}

main();
