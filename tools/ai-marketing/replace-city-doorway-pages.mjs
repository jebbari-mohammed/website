#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('public/best-ai-fitness-app');
const TARGET = 'https://youraicoach.life/best-ai-fitness-app';
const EXPECTED_CITY_PAGES = 21;
const CITY_NAMES = {
  'new-york': 'New York',
  'los-angeles': 'Los Angeles',
  'mexico-city': 'Mexico City',
  'so-paulo': 'São Paulo',
};

function cityName(slug) {
  return CITY_NAMES[slug] || slug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function page(city) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>This Local AI Fitness Guide Has Moved | IZEM</title>
  <meta name="description" content="IZEM consolidated this older city-specific page into one maintained AI fitness app guide with clearer product information and editorial oversight.">
  <meta name="robots" content="noindex, follow">
  <meta name="googlebot" content="noindex, follow">
  <link rel="canonical" href="${TARGET}">
  <meta http-equiv="refresh" content="2; url=/best-ai-fitness-app">
  <!-- LEGACY_SEO_QUARANTINE:city-doorway-template -->
  <style>
    *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#081019;color:#EAF0F7;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:24px}.card{max-width:720px;background:#101B2A;border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:34px;box-shadow:0 20px 60px rgba(0,0,0,.25)}.eyebrow{color:#9CE8DC;font-size:.78rem;font-weight:850;letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px}h1{margin:0 0 16px;font-size:clamp(1.9rem,5vw,3.1rem);line-height:1.08}p{color:#C7D2DF;line-height:1.7;margin:0 0 22px}a{display:inline-flex;background:#42C7C3;color:#041515;text-decoration:none;font-weight:900;padding:13px 18px;border-radius:9px}
  </style>
</head>
<body>
  <main class="card">
    <aside data-legacy-editorial-review="true">
      <div class="eyebrow">Editorial consolidation</div>
      <h1>The ${city} guide has moved</h1>
      <p>IZEM retired its old city-template pages. The product is not meaningfully different by city, so one maintained guide is more useful and less repetitive than separate local pages.</p>
      <a href="/best-ai-fitness-app">Open the maintained Best AI Fitness App guide</a>
    </aside>
  </main>
</body>
</html>
`;
}

const entries = await fs.readdir(ROOT, { withFileTypes: true });
const files = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
  .map((entry) => entry.name)
  .sort();

if (files.length !== EXPECTED_CITY_PAGES) {
  throw new Error(`Expected exactly ${EXPECTED_CITY_PAGES} reviewed city pages, found ${files.length}`);
}

let changed = 0;
for (const file of files) {
  const slug = file.replace(/\.html$/, '');
  const target = path.join(ROOT, file);
  const next = page(cityName(slug));
  const current = await fs.readFile(target, 'utf8');
  if (current !== next) {
    await fs.writeFile(target, next, 'utf8');
    changed += 1;
  }
}

console.log(`City doorway replacement complete: ${files.length} pages checked, ${changed} replaced.`);
