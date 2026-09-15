#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const BLOG = path.join(ROOT, 'public', 'blog');
const POLICY = 'objects-only-v1';
const MARKER = '<!-- IZEM_OBJECT_VISUALS_V1 -->';

function parseArgs(argv) {
  let slug = '';
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--slug') slug = argv[++i] || '';
    else if (item.startsWith('--slug=')) slug = item.slice('--slug='.length);
  }
  if (!/^[a-z0-9][a-z0-9-]{1,119}$/.test(slug)) throw new Error('A safe --slug is required');
  return { slug };
}

function text(value = '') {
  return String(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function xml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function html(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shorten(value, max = 64) {
  const clean = text(value);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

function wrap(value, maxChars = 34, maxLines = 3) {
  const words = text(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines - 1) break;
    } else current = candidate;
  }
  if (current && lines.length < maxLines) lines.push(current);
  const consumed = lines.join(' ').split(/\s+/).filter(Boolean).length;
  if (consumed < words.length && lines.length) lines[lines.length - 1] = shorten(lines[lines.length - 1], Math.max(8, maxChars - 1));
  return lines.slice(0, maxLines);
}

function multiline(lines, x, y, size, gap, weight = 700, fill = '#F8FAFC') {
  return `<text x="${x}" y="${y}" font-family="Inter,Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${lines.map((line, index) => `<tspan x="${x}" dy="${index ? gap : 0}">${xml(line)}</tspan>`).join('')}</text>`;
}

function shell(title, description, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-labelledby="title desc">
<title id="title">${xml(title)}</title>
<desc id="desc">${xml(description)}</desc>
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#081019"/><stop offset="0.58" stop-color="#10253A"/><stop offset="1" stop-color="#14352F"/></linearGradient>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000" flood-opacity=".22"/></filter>
</defs>
<rect width="1200" height="675" rx="28" fill="url(#bg)"/>
<circle cx="1080" cy="90" r="150" fill="#42C7C3" opacity=".08"/>
<circle cx="110" cy="610" r="180" fill="#8DFF6A" opacity=".045"/>
${body}
<text x="70" y="625" font-family="Inter,Arial,sans-serif" font-size="20" font-weight="800" fill="#9CE8DC">IZEM practical guide</text>
</svg>`;
}

function heroSvg(title) {
  const titleLines = wrap(title, 30, 3);
  return shell(
    `${title} — planning visual`,
    'Object-only fitness technology illustration with a phone, dumbbell, checklist, and progress chart. No people are shown.',
    `${multiline(titleLines, 70, 105, 44, 54, 850)}
<g filter="url(#shadow)" transform="translate(720 78)">
  <rect x="0" y="0" width="300" height="500" rx="38" fill="#0B1420" stroke="#7DE1D2" stroke-width="4"/>
  <rect x="24" y="58" width="252" height="90" rx="18" fill="#15283A"/>
  <rect x="45" y="82" width="132" height="12" rx="6" fill="#9CE8DC"/>
  <rect x="45" y="109" width="190" height="10" rx="5" fill="#AEBBCC" opacity=".65"/>
  <rect x="24" y="170" width="252" height="128" rx="18" fill="#102A2A"/>
  <polyline points="45,264 90,231 132,240 177,197 229,212 252,185" fill="none" stroke="#8DFF6A" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="90" cy="231" r="7" fill="#8DFF6A"/><circle cx="177" cy="197" r="7" fill="#8DFF6A"/>
  <rect x="24" y="320" width="252" height="132" rx="18" fill="#15283A"/>
  <circle cx="55" cy="354" r="10" fill="#42C7C3"/><path d="M50 354l4 4 8-10" fill="none" stroke="#041515" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="78" y="346" width="150" height="12" rx="6" fill="#D1DBE7" opacity=".85"/>
  <circle cx="55" cy="393" r="10" fill="#42C7C3"/><path d="M50 393l4 4 8-10" fill="none" stroke="#041515" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="78" y="385" width="123" height="12" rx="6" fill="#D1DBE7" opacity=".7"/>
  <circle cx="150" cy="478" r="7" fill="#405569"/>
</g>
<g transform="translate(118 390)" stroke="#F8FAFC" stroke-width="15" stroke-linecap="round">
  <line x1="40" y1="55" x2="215" y2="55"/>
  <line x1="40" y1="28" x2="40" y2="82"/>
  <line x1="65" y1="18" x2="65" y2="92"/>
  <line x1="190" y1="18" x2="190" y2="92"/>
  <line x1="215" y1="28" x2="215" y2="82"/>
</g>
<g transform="translate(385 395)"><rect x="0" y="0" width="245" height="145" rx="20" fill="#101B2A" stroke="#31465A" stroke-width="2"/><text x="24" y="40" font-family="Inter,Arial,sans-serif" font-size="18" font-weight="800" fill="#9CE8DC">PLAN → DO → REVIEW</text><rect x="24" y="64" width="185" height="12" rx="6" fill="#D1DBE7" opacity=".82"/><rect x="24" y="90" width="145" height="12" rx="6" fill="#D1DBE7" opacity=".55"/></g>`
  );
}

function frameworkSvg(title, headings) {
  const cards = headings.slice(0, 3);
  return shell(
    `${title} — decision framework`,
    'Object-only decision framework showing three article steps as cards connected by arrows. No people are shown.',
    `${multiline(['A simple decision framework'], 70, 105, 42, 50, 850)}
${cards.map((heading, index) => {
      const x = 70 + index * 365;
      const lines = wrap(heading, 22, 3);
      return `<g transform="translate(${x} 210)" filter="url(#shadow)">
  <rect width="315" height="260" rx="24" fill="#101B2A" stroke="${index === 1 ? '#42C7C3' : '#31465A'}" stroke-width="3"/>
  <circle cx="48" cy="50" r="24" fill="${index === 1 ? '#42C7C3' : '#173C3A'}"/><text x="48" y="58" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="900" fill="${index === 1 ? '#041515' : '#9CE8DC'}">${index + 1}</text>
  ${multiline(lines, 28, 112, 25, 34, 800)}
  <rect x="28" y="207" width="210" height="11" rx="6" fill="#AEBBCC" opacity=".55"/><rect x="28" y="231" width="155" height="11" rx="6" fill="#AEBBCC" opacity=".35"/>
</g>${index < cards.length - 1 ? `<path d="M${x + 318} 340 H${x + 355}" stroke="#8DFF6A" stroke-width="7" stroke-linecap="round"/><path d="M${x + 345} 328 L${x + 358} 340 L${x + 345} 352" fill="none" stroke="#8DFF6A" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>` : ''}`;
    }).join('')}`
  );
}

function checklistSvg(title, items) {
  const safeItems = items.slice(0, 4).map((item) => shorten(item, 58));
  while (safeItems.length < 4) safeItems.push(['Match the goal', 'Fit the real schedule', 'Use available equipment', 'Review what actually happened'][safeItems.length]);
  return shell(
    `${title} — practical checklist`,
    'Object-only checklist card with four practical evaluation points and simple check marks. No people are shown.',
    `${multiline(['Practical checklist'], 70, 105, 42, 50, 850)}
<g transform="translate(70 175)" filter="url(#shadow)">
  <rect width="1060" height="360" rx="26" fill="#101B2A" stroke="#31465A" stroke-width="3"/>
  ${safeItems.map((item, index) => {
      const y = 64 + index * 76;
      return `<circle cx="55" cy="${y}" r="19" fill="#42C7C3"/><path d="M46 ${y}l7 7 13-17" fill="none" stroke="#041515" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>${multiline(wrap(item, 66, 2), 92, y + 8, 24, 29, 750, '#EAF0F7')}`;
    }).join('')}
</g>`
  );
}

function figure(src, alt, caption, eager = false) {
  return `<figure data-owner-visual-policy="${POLICY}" style="margin:30px 0 34px">
  <img data-owner-visual-policy="${POLICY}" src="${src}" alt="${html(alt)}" width="1200" height="675" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" style="display:block;width:100%;height:auto;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:#081019">
  <figcaption style="margin-top:10px;color:#AEBBCC;font-size:.92rem">${html(caption)}</figcaption>
</figure>`;
}

function insertAfterFirstH2(source, block) {
  const match = /<h2\b[^>]*>[\s\S]*?<\/h2>/i.exec(source);
  if (!match) return `${source}\n${block}`;
  const at = match.index + match[0].length;
  return `${source.slice(0, at)}\n${block}${source.slice(at)}`;
}

function insertAfterSecondH2(source, block) {
  const re = /<h2\b[^>]*>[\s\S]*?<\/h2>/gi;
  re.exec(source);
  const second = re.exec(source);
  if (!second) return insertAfterFirstH2(source, block);
  const at = second.index + second[0].length;
  return `${source.slice(0, at)}\n${block}${source.slice(at)}`;
}

function main() {
  const { slug } = parseArgs(process.argv.slice(2));
  const file = path.join(BLOG, `${slug}.html`);
  if (!fs.existsSync(file)) throw new Error(`Blog post not found: ${file}`);
  let source = fs.readFileSync(file, 'utf8');
  if (source.includes(MARKER)) {
    console.log(`Object-only visuals already present for ${slug}.`);
    return;
  }

  const title = text(source.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || source.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || slug);
  const headings = [...source.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map((match) => text(match[1]))
    .filter((value) => value && !/frequently asked|watch the video|useful izem guides/i.test(value))
    .slice(0, 6);
  const listItems = [...source.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => text(match[1]))
    .filter((value) => value.length >= 12)
    .slice(0, 8);

  const assetDir = path.join(BLOG, 'assets', slug);
  fs.mkdirSync(assetDir, { recursive: true });
  fs.writeFileSync(path.join(assetDir, 'hero.svg'), heroSvg(title), 'utf8');
  fs.writeFileSync(path.join(assetDir, 'framework.svg'), frameworkSvg(title, headings.length >= 3 ? headings : ['Define the goal', 'Choose the smallest useful action', 'Review and adapt']), 'utf8');
  fs.writeFileSync(path.join(assetDir, 'checklist.svg'), checklistSvg(title, listItems), 'utf8');

  const base = `/blog/assets/${slug}`;
  const hero = `${MARKER}\n${figure(`${base}/hero.svg`, `${title}: object-only planning illustration`, 'A people-free visual summary using fitness equipment, a device, a checklist, and a progress chart.', true)}`;
  const framework = figure(`${base}/framework.svg`, `${title}: decision framework diagram`, 'A people-free three-step framework distilled from the guide.');
  const checklist = figure(`${base}/checklist.svg`, `${title}: practical checklist diagram`, 'A people-free checklist for applying the guide to a real decision.');

  const disclosure = /(<div\b[^>]*class=["'][^"']*\bdisclosure\b[^"']*["'][^>]*>[\s\S]*?<\/div>)/i;
  if (disclosure.test(source)) source = source.replace(disclosure, `$1\n${hero}`);
  else {
    const mainOpen = /<main\b[^>]*>/i;
    if (mainOpen.test(source)) source = source.replace(mainOpen, (match) => `${match}\n${hero}`);
    else source = `${hero}\n${source}`;
  }
  source = insertAfterFirstH2(source, framework);
  source = insertAfterSecondH2(source, checklist);

  fs.writeFileSync(file, source, 'utf8');
  console.log(`Generated 3 object-only SVG visuals for ${slug}.`);
}

main();
