#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const SAFE_VIDEO_THUMBNAIL_DIR = path.join(PUBLIC_DIR, 'youtube', 'thumbnails');

const BLOCKED_VISUAL_REFERENCES = [
  '/images/hero-premium.png',
  'https://i.ytimg.com/',
  'http://i.ytimg.com/',
  'https://img.youtube.com/',
  'http://img.youtube.com/',
];

function walk(dir, predicate) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full, predicate));
    else if (entry.isFile() && predicate(entry.name)) files.push(full);
  }
  return files;
}

const publicTextFiles = walk(PUBLIC_DIR, (name) => /\.(?:html|xml)$/i.test(name));
const violations = [];
for (const file of publicTextFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const blocked of BLOCKED_VISUAL_REFERENCES) {
    if (!content.includes(blocked)) continue;
    violations.push({ file: path.relative(ROOT, file).split(path.sep).join('/'), blocked });
  }
}

const thumbnailFiles = walk(SAFE_VIDEO_THUMBNAIL_DIR, (name) => name.endsWith('.svg'));
for (const file of thumbnailFiles) {
  const svg = fs.readFileSync(file, 'utf8');
  const unsafeSvg = /<(?:image|foreignObject|script)\b/i.test(svg) || /(?:href|xlink:href)\s*=\s*["']\s*(?:https?:|data:)/i.test(svg);
  if (unsafeSvg) {
    violations.push({ file: path.relative(ROOT, file).split(path.sep).join('/'), blocked: 'external/raster/script content inside generated video artwork' });
  }
}

if (violations.length) {
  console.error(`Owner image policy check failed: ${violations.length} unsafe visual reference(s) found.`);
  for (const violation of violations) console.error(`- ${violation.file}: ${violation.blocked}`);
  console.error('Use a visually verified people-free asset, or a clearly fully/modestly covered human visual explicitly accepted by the owner.');
  process.exitCode = 1;
} else {
  console.log(`Owner image policy check passed: ${publicTextFiles.length} public HTML/XML file(s) and ${thumbnailFiles.length} generated people-free video thumbnail(s) checked.`);
}
