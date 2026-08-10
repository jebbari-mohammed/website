#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const PUBLIC = path.resolve('public');
const SITEMAP = path.join(PUBLIC, 'sitemap.xml');
const NEWS = path.join(PUBLIC, 'news-sitemap.xml');
const CHECK = process.argv.includes('--check');

function xmlUnescape(value = '') {
  return String(value)
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

function blocks(xml) {
  return [...String(xml).matchAll(/<url>([\s\S]*?)<\/url>/gi)].map((match) => match[1]);
}

function tag(block, name) {
  return xmlUnescape(block.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1]?.trim() || '');
}

function normalizeUrl(value = '') {
  try {
    const url = new URL(value);
    url.hash = '';
    return url.href.replace(/\/$/, url.pathname === '/' ? '/' : '');
  } catch {
    return '';
  }
}

const [sitemapXml, currentNews] = await Promise.all([
  fs.readFile(SITEMAP, 'utf8'),
  fs.readFile(NEWS, 'utf8').catch(() => ''),
]);

const indexable = new Set(blocks(sitemapXml).map((block) => normalizeUrl(tag(block, 'loc'))).filter(Boolean));
const retained = [];
const seen = new Set();
for (const block of blocks(currentNews)) {
  const loc = normalizeUrl(tag(block, 'loc'));
  if (!loc || !indexable.has(loc) || seen.has(loc)) continue;
  seen.add(loc);
  retained.push(block.trim());
}

const next = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${retained.map((block) => `  <url>\n${block.split('\n').map((line) => `    ${line.trim()}`).join('\n')}\n  </url>`).join('\n')}${retained.length ? '\n' : ''}</urlset>
`;

if (CHECK) {
  if (currentNews !== next) {
    console.error(`News sitemap is stale: ${blocks(currentNews).length - retained.length} non-indexable or duplicate entr${blocks(currentNews).length - retained.length === 1 ? 'y' : 'ies'} detected.`);
    process.exitCode = 1;
  } else {
    console.log(`News sitemap check passed: ${retained.length} indexable URL(s).`);
  }
} else {
  await fs.writeFile(NEWS, next, 'utf8');
  console.log(`News sitemap synchronized: ${retained.length} indexable URL(s).`);
}
