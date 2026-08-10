#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PUBLIC = path.join(ROOT, 'public');
const SITE_ORIGIN = 'https://youraicoach.life';
const REVIEW_BANNER = '<aside data-legacy-editorial-review="true" style="max-width:960px;margin:18px auto;padding:14px 18px;border:1px solid rgba(255,255,255,.12);background:#101B2A;color:#CBD5E1;font:14px/1.6 system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif"><strong style="color:#F8FAFC">Editorial review:</strong> This archived page is excluded from search while IZEM reviews legacy AI-assisted content. Use the linked canonical guide for maintained information.</aside>';

const args = new Set(process.argv.slice(2));
const APPLY = args.has('--apply');
const STRICT = args.has('--strict');
const REPORT_PATH = (() => {
  const index = process.argv.indexOf('--report');
  return index >= 0 && process.argv[index + 1] ? path.resolve(process.argv[index + 1]) : '';
})();

const HIGH_RISK_PATTERNS = [
  ['fake-first-person-testing', /\b(?:I|we) tested\b/i],
  ['fake-first-person-use', /\b(?:I|we) (?:used|tried|ditched|switched from|spent \d+ days|spent \d+ weeks)\b/i],
  ['fabricated-anecdote', /\bLast (?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i],
  ['fabricated-anecdote', /\bmy phone rang\b/i],
  ['fabricated-anecdote', /\bI['’]ve found\b/i],
  ['fabricated-anecdote', /\bfrom my experience\b/i],
  ['unsupported-clinical-language', /\b(?:clinical precision|clinically proven|medical-grade|diagnos(?:e|es|ed|ing)|cure(?:s|d|ing)?)\b/i],
  ['unsupported-superlative', /\b(?:best app on the market|the best app in the world|guaranteed results?|100% accurate)\b/i],
  ['legacy-brand', /\bCallio\b/i],
];

const CLAIM_PATTERNS = [
  ['unsourced-study', /\bAccording to (?:a|one) \d{4} study\b/i],
  ['unsourced-study', /\b(?:research|studies|science) (?:proves?|shows?|suggests?)\b/i],
  ['unsupported-percentage', /\b(?:increase|improve|reduce|boost|more effective|accuracy|adherence)[^.!?]{0,90}\b\d{1,3}(?:\.\d+)?%\b/i],
  ['unsupported-price', /\$\s?\d{2,4}(?:\.\d{1,2})?(?:\s*(?:\/|per)\s*(?:month|session|year))?/i],
  ['unsafe-scan-accuracy', /\b(?:accurate|precise) (?:breakdown|body composition|body fat|calorie|macro)/i],
  ['unsafe-eating-disorder-advice', /\b(?:history of disordered eating|eating disorder)[^.!?]{0,140}\b(?:yes|safe|can use|recommended)\b/i],
];

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2] || '';
}

function tags(html, tagName) {
  return html.match(new RegExp(`<${tagName}\\b[^>]*>`, 'gi')) || [];
}

function robots(html) {
  return tags(html, 'meta')
    .filter((tag) => attribute(tag, 'name').toLowerCase() === 'robots')
    .map((tag) => attribute(tag, 'content').toLowerCase());
}

function isNoindex(html) {
  return robots(html).some((value) => /(?:^|,)\s*noindex(?:\s|,|$)/i.test(value));
}

function canonical(html) {
  return tags(html, 'link')
    .filter((tag) => attribute(tag, 'rel').toLowerCase().split(/\s+/).includes('canonical'))
    .map((tag) => attribute(tag, 'href'))
    .filter(Boolean)[0] || '';
}

function title(html) {
  return html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || '';
}

function visibleText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function expectedUrl(relativePath) {
  const normalized = relativePath.split(path.sep).join('/');
  if (normalized === 'index.html') return `${SITE_ORIGIN}/`;
  if (normalized.endsWith('/index.html')) return `${SITE_ORIGIN}/${normalized.slice(0, -'index.html'.length)}`;
  return `${SITE_ORIGIN}/${normalized.replace(/\.html$/, '')}`;
}

function isCityDoorway(relativePath) {
  const normalized = relativePath.split(path.sep).join('/');
  return /^best-ai-fitness-app\/[^/]+\.html$/i.test(normalized);
}

function selfCanonicalLooksWrong(relativePath, canonicalUrl) {
  if (!canonicalUrl) return true;
  try {
    const actual = new URL(canonicalUrl, SITE_ORIGIN);
    if (actual.origin !== SITE_ORIGIN) return true;
    const expected = new URL(expectedUrl(relativePath));
    const normalize = (value) => value.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
    return normalize(actual) !== normalize(expected);
  } catch {
    return true;
  }
}

function setMeta(html, name, content) {
  const replacement = `<meta name="${name}" content="${content}">`;
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\bname\\s*=\\s*(["'])${name}\\1)[^>]*>`, 'i');
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return html.replace(/<\/head>/i, `  ${replacement}\n</head>`);
}

function setCanonical(html, url) {
  const replacement = `<link rel="canonical" href="${url}">`;
  const pattern = /<link\b(?=[^>]*\brel\s*=\s*(["'])canonical\1)[^>]*>/i;
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return html.replace(/<\/head>/i, `  ${replacement}\n</head>`);
}

function quarantine(html, relativePath, reasons) {
  let next = setMeta(html, 'robots', 'noindex, follow');
  next = setMeta(next, 'googlebot', 'noindex, follow');
  if (isCityDoorway(relativePath)) next = setCanonical(next, `${SITE_ORIGIN}/best-ai-fitness-app`);
  if (!next.includes('data-legacy-editorial-review="true"')) {
    next = next.replace(/<body(\s[^>]*)?>/i, (match) => `${match}\n${REVIEW_BANNER}`);
  }
  const marker = `<!-- LEGACY_SEO_QUARANTINE:${reasons.sort().join(',')} -->`;
  if (!next.includes('LEGACY_SEO_QUARANTINE:')) next = next.replace(/<\/head>/i, `  ${marker}\n</head>`);
  return next;
}

async function collect(directory, relative = '') {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    const rel = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await collect(absolute, rel));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push({ absolute, relative: rel });
  }
  return files;
}

const files = await collect(PUBLIC);
const findings = [];
const canonicalOwners = new Map();
const titleOwners = new Map();
let changed = 0;

for (const file of files) {
  const original = await fs.readFile(file.absolute, 'utf8');
  const text = visibleText(original);
  const pageTitle = title(original);
  const pageCanonical = canonical(original);
  const indexable = !isNoindex(original);
  const reasons = new Set();
  const warnings = new Set();

  if (indexable && isCityDoorway(file.relative)) reasons.add('city-doorway-template');
  for (const [code, pattern] of HIGH_RISK_PATTERNS) {
    if (indexable && pattern.test(text)) reasons.add(code);
  }
  for (const [code, pattern] of CLAIM_PATTERNS) {
    if (indexable && pattern.test(text)) warnings.add(code);
  }
  if (indexable && selfCanonicalLooksWrong(file.relative, pageCanonical)) warnings.add('canonical-path-mismatch');

  if (indexable && pageCanonical) {
    const key = new URL(pageCanonical, SITE_ORIGIN).href;
    const owners = canonicalOwners.get(key) || [];
    owners.push(file.relative);
    canonicalOwners.set(key, owners);
  }
  if (indexable && pageTitle) {
    const key = pageTitle.toLowerCase().replace(/\s+/g, ' ').trim();
    const owners = titleOwners.get(key) || [];
    owners.push(file.relative);
    titleOwners.set(key, owners);
  }

  if (reasons.size || warnings.size) {
    findings.push({
      file: file.relative.split(path.sep).join('/'),
      indexable,
      title: pageTitle,
      canonical: pageCanonical,
      reasons: [...reasons].sort(),
      warnings: [...warnings].sort(),
    });
  }

  if (APPLY && reasons.size) {
    const next = quarantine(original, file.relative, [...reasons]);
    if (next !== original) {
      await fs.writeFile(file.absolute, next, 'utf8');
      changed += 1;
    }
  }
}

for (const [url, owners] of canonicalOwners) {
  if (owners.length < 2) continue;
  findings.push({ file: owners.join(', '), indexable: true, title: '', canonical: url, reasons: [], warnings: ['duplicate-indexable-canonical'] });
}
for (const [value, owners] of titleOwners) {
  if (owners.length < 2) continue;
  findings.push({ file: owners.join(', '), indexable: true, title: value, canonical: '', reasons: [], warnings: ['duplicate-indexable-title'] });
}

findings.sort((a, b) => a.file.localeCompare(b.file));
const highRisk = findings.filter((item) => item.reasons.length && item.indexable);
const report = {
  generatedAt: new Date().toISOString(),
  filesScanned: files.length,
  changed,
  highRiskIndexable: highRisk.length,
  findings,
};

if (REPORT_PATH) {
  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await fs.writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

console.log(`Legacy SEO audit: ${files.length} HTML files, ${highRisk.length} high-risk indexable pages, ${findings.length} total findings, ${changed} files changed.`);
for (const item of highRisk.slice(0, 50)) {
  console.log(`- ${item.file}: ${item.reasons.join(', ')}`);
}

if (STRICT && highRisk.length) {
  console.error('High-risk legacy content remains indexable. Run the reviewed quarantine or rewrite the pages.');
  process.exitCode = 1;
}
