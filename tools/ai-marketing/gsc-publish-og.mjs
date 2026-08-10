#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildOGImageForPost, patchOGImageTag } from './generate-og-images.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const RECORD_PATH = path.join(ROOT, 'data/marketing-employee/seo-growth/last-publish.json');
const OG_DIR = path.join(ROOT, 'public/og');

function main() {
  if (!fs.existsSync(RECORD_PATH)) {
    console.log('No GSC publish record found; OG generation skipped.');
    return;
  }

  const record = JSON.parse(fs.readFileSync(RECORD_PATH, 'utf8'));
  if (record.action !== 'create' || !record.slug || !record.file) {
    console.log('Latest GSC action is not CREATE; OG generation skipped.');
    return;
  }

  const pagePath = path.join(ROOT, record.file);
  if (!fs.existsSync(pagePath)) throw new Error(`Published page not found: ${record.file}`);

  fs.mkdirSync(OG_DIR, { recursive: true });
  const svgPath = path.join(OG_DIR, `${record.slug}.svg`);
  const svg = buildOGImageForPost({ title: record.title || record.query || 'IZEM Fitness Guide' });
  fs.writeFileSync(svgPath, svg, 'utf8');

  const html = fs.readFileSync(pagePath, 'utf8');
  fs.writeFileSync(pagePath, patchOGImageTag(html, record.slug), 'utf8');

  console.log(`Generated OG image: public/og/${record.slug}.svg`);
}

try {
  main();
} catch (error) {
  console.error(`GSC OG generation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
