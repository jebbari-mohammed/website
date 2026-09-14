#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');

const BLOCKED_VISUAL_PATHS = [
  '/images/hero-premium.png',
];

const BLOCKED_REMOTE_IMAGE_PATTERNS = [
  /https?:\/\/i\.ytimg\.com\//gi,
  /https?:\/\/img\.youtube\.com\//gi,
];

const TEXT_EXTENSIONS = new Set(['.html', '.xml', '.json', '.svg']);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(full);
  }
  return files;
}

const publicFiles = walk(PUBLIC_DIR);
const violations = [];
for (const file of publicFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const blocked of BLOCKED_VISUAL_PATHS) {
    if (!content.includes(blocked)) continue;
    violations.push({ file: path.relative(ROOT, file).split(path.sep).join('/'), blocked });
  }
  for (const pattern of BLOCKED_REMOTE_IMAGE_PATTERNS) {
    pattern.lastIndex = 0;
    if (!pattern.test(content)) continue;
    violations.push({ file: path.relative(ROOT, file).split(path.sep).join('/'), blocked: pattern.source });
  }
}

if (violations.length) {
  console.error(`Owner image policy check failed: ${violations.length} blocked or unverified visual reference(s) found.`);
  for (const violation of violations) console.error(`- ${violation.file}: ${violation.blocked}`);
  console.error('Use a visually verified people-free asset, or a clearly fully/modestly covered human visual explicitly accepted by the owner.');
  process.exitCode = 1;
} else {
  console.log(`Owner image policy check passed: ${publicFiles.length} public text asset(s) scanned; no blocked or unverified thumbnail sources referenced.`);
}
