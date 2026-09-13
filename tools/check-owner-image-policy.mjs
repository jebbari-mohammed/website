#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');

// Assets that the owner has explicitly rejected for website/blog publication.
// Keep this fail-closed list permanent so a later refresh cannot silently
// reintroduce a previously removed image.
const BLOCKED_VISUAL_PATHS = [
  '/images/hero-premium.png',
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

const violations = [];
for (const file of walk(PUBLIC_DIR)) {
  const html = fs.readFileSync(file, 'utf8');
  for (const blocked of BLOCKED_VISUAL_PATHS) {
    if (!html.includes(blocked)) continue;
    violations.push({
      file: path.relative(ROOT, file).split(path.sep).join('/'),
      blocked,
    });
  }
}

if (violations.length) {
  console.error(`Owner image policy check failed: ${violations.length} blocked visual reference(s) found.`);
  for (const violation of violations) {
    console.error(`- ${violation.file}: ${violation.blocked}`);
  }
  console.error('Use a visually verified people-free asset, or a clearly fully/modestly covered human visual explicitly accepted by the owner.');
  process.exitCode = 1;
} else {
  console.log(`Owner image policy check passed: ${walk(PUBLIC_DIR).length} public HTML file(s) scanned; no blocked visuals referenced.`);
}
