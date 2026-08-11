#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const SITE_ORIGIN = 'https://youraicoach.life';
const DEFAULT_MAX_SOURCES = 2;
const DESIRED_COLD_START_BACKLINKS = 2;
const MAX_COLD_START_BLOCKS_PER_SOURCE = 4;

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'best', 'by', 'can', 'complete',
  'for', 'from', 'guide', 'how', 'in', 'into', 'is', 'it', 'of', 'on', 'or',
  'that', 'the', 'this', 'to', 'what', 'when', 'which', 'with', 'your', 'izem',
  '2026', '2027', 'app', 'apps',
]);

const BUSINESS_TERMS = new Map([
  ['accountability', 8],
  ['consistency', 8],
  ['call', 7],
  ['voice', 7],
  ['coach', 6],
  ['fitness', 6],
  ['workout', 6],
  ['trainer', 5],
  ['personalized', 5],
  ['adaptive', 5],
  ['calculator', 5],
  ['gym', 4],
  ['meal', 4],
  ['nutrition', 4],
  ['progress', 4],
  ['scan', 3],
  ['protein', 3],
]);

const EXCLUDED_TITLE_PATTERNS = [
  /\bprivacy\b/i,
  /\bterms\b/i,
  /\brefund\b/i,
  /\bcookie\b/i,
  /\bcontact\b/i,
  /\babout\b/i,
  /\beditorial policy\b/i,
  /\bhas moved\b/i,
  /\bpage not found\b/i,
];

function parseArgs(argv) {
  const args = { dryRun: false, maxSources: DEFAULT_MAX_SOURCES, publicDir: PUBLIC_DIR };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === '--dry-run') args.dryRun = true;
    else if (item === '--public-dir') args.publicDir = path.resolve(argv[++index]);
    else if (item.startsWith('--public-dir=')) args.publicDir = path.resolve(item.slice(13));
    else if (item === '--max-sources') args.maxSources = Number(argv[++index]);
    else if (item.startsWith('--max-sources=')) args.maxSources = Number(item.slice(14));
  }
  if (!Number.isInteger(args.maxSources) || args.maxSources < 1 || args.maxSources > 3) {
    throw new Error('--max-sources must be an integer from 1 to 3');
  }
  return args;
}

function setOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${String(value).replace(/\r?\n/g, ' ')}\n`);
}

function normalizeWord(value) {
  const word = String(value).toLowerCase();
  const aliases = new Map([
    ['workouts', 'workout'],
    ['working', 'workout'],
    ['coaching', 'coach'],
    ['coaches', 'coach'],
    ['trainers', 'trainer'],
    ['training', 'trainer'],
    ['calls', 'call'],
    ['calling', 'call'],
    ['meals', 'meal'],
    ['plans', 'plan'],
    ['planning', 'plan'],
    ['personalisation', 'personalized'],
    ['personalization', 'personalized'],
    ['personalised', 'personalized'],
    ['adaptive', 'adaptive'],
  ]);
  if (aliases.has(word)) return aliases.get(word);
  if (word.endsWith('ies') && word.length > 5) return `${word.slice(0, -3)}y`;
  if (word.endsWith('s') && word.length > 5) return word.slice(0, -1);
  return word;
}

function tokens(value = '') {
  return new Set(
    String(value)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map(normalizeWord)
      .filter((word) => word.length >= 3 && !STOPWORDS.has(word)),
  );
}

function overlapScore(left, right) {
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const value of left) if (right.has(value)) intersection += 1;
  const union = new Set([...left, ...right]).size || 1;
  return intersection / union;
}

function businessScore(page) {
  let score = 0;
  for (const token of page.tokens) score += BUSINESS_TERMS.get(token) || 0;
  if (/calculator|tool|quiz|assessment/i.test(page.canonical)) score += 10;
  if (/fitness-app-that-calls-you|izem-ai-fitness-coach|workout-consistency/i.test(page.canonical)) score += 12;
  if (/\/blog\//.test(page.canonical)) score += 2;
  return score;
}

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 12);
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function compactText(value = '', max = 180) {
  const text = String(value).replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const clipped = text.slice(0, max - 1).replace(/\s+\S*$/, '').trim();
  return `${clipped || text.slice(0, max - 1)}…`;
}

function normalizeUrl(value) {
  try {
    const url = new URL(value, SITE_ORIGIN);
    if (url.origin !== SITE_ORIGIN) return '';
    url.hash = '';
    url.search = '';
    let pathname = decodeURIComponent(url.pathname).replace(/\/{2,}/g, '/');
    if (pathname !== '/') pathname = pathname.replace(/\/$/, '');
    url.pathname = pathname;
    return url.toString().replace(/\/$/, pathname === '/' ? '/' : '');
  } catch {
    return '';
  }
}

function expectedCanonical(file, publicDir) {
  const relative = path.relative(publicDir, file).split(path.sep).join('/');
  if (relative === 'index.html') return `${SITE_ORIGIN}/`;
  if (relative.endsWith('/index.html')) return normalizeUrl(`${SITE_ORIGIN}/${relative.slice(0, -'/index.html'.length)}`);
  if (relative.endsWith('.html')) return normalizeUrl(`${SITE_ORIGIN}/${relative.slice(0, -'.html'.length)}`);
  return '';
}

async function collectHtmlFiles(directory) {
  const entries = await fsp.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtmlFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files.sort();
}

function metaContent($, selector) {
  return String($(selector).first().attr('content') || '').trim();
}

function isNoindex($) {
  return $('meta[name="robots"], meta[name="googlebot"]').toArray().some((element) =>
    /(?:^|,)\s*noindex(?:\s|,|$)/i.test(String($(element).attr('content') || '')),
  );
}

function routeLanguageIsEnglish($, relative) {
  const lang = String($('html').attr('lang') || 'en').toLowerCase();
  if (lang && !lang.startsWith('en')) return false;
  return !/(^|\/)(es|fr|de|pt|ar|tr|hi|id|ja|ko)(\/|$)/i.test(relative);
}

function countColdStartBlocks(html) {
  return (String(html).match(/SEO_ALWAYS_IMPROVE_LINK:[a-f0-9]{12}/g) || []).length / 2;
}

function parsePage(file, html, publicDir) {
  const $ = load(html);
  const relative = path.relative(publicDir, file).split(path.sep).join('/');
  if (!routeLanguageIsEnglish($, relative) || isNoindex($)) return null;
  if (/LEGACY_SEO_QUARANTINE|data-legacy-editorial-review/i.test(html)) return null;
  if ($('meta[http-equiv="refresh" i]').length) return null;

  const canonical = normalizeUrl($('link[rel~="canonical" i]').first().attr('href') || '');
  const expected = expectedCanonical(file, publicDir);
  if (!canonical || !expected || canonical !== expected) return null;

  const title = String($('title').first().text() || '').replace(/\s+/g, ' ').trim();
  const h1 = String($('h1').first().text() || '').replace(/\s+/g, ' ').trim();
  if (!title || EXCLUDED_TITLE_PATTERNS.some((pattern) => pattern.test(`${title} ${h1}`))) return null;

  const clone = $.root().clone();
  clone.find('script, style, noscript, nav, footer, header, svg').remove();
  const text = clone.text().replace(/\s+/g, ' ').trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const description = metaContent($, 'meta[name="description"]');
  const links = new Set();
  $('a[href]').each((_index, element) => {
    const normalized = normalizeUrl($(element).attr('href') || '');
    if (normalized) links.add(normalized);
  });
  const topicTokens = tokens(`${title} ${h1} ${description} ${text.slice(0, 1800)}`);

  return {
    file,
    relative,
    html,
    canonical,
    title: h1 || title.replace(/\s*[|–—-]\s*IZEM\s*$/i, '').trim(),
    description,
    wordCount,
    links,
    tokens: topicTokens,
    coldStartBlocks: countColdStartBlocks(html),
    inbound: 0,
    coldInbound: 0,
  };
}

export async function buildPageInventory(publicDir = PUBLIC_DIR) {
  const files = await collectHtmlFiles(publicDir);
  const pages = [];
  for (const file of files) {
    const html = await fsp.readFile(file, 'utf8');
    const page = parsePage(file, html, publicDir);
    if (page) pages.push(page);
  }
  const byUrl = new Map(pages.map((page) => [page.canonical, page]));
  const markerCounts = new Map();
  for (const page of pages) {
    for (const linked of page.links) {
      const target = byUrl.get(linked);
      if (target && target.canonical !== page.canonical) target.inbound += 1;
    }
    for (const match of page.html.matchAll(/SEO_ALWAYS_IMPROVE_LINK:([a-f0-9]{12})/g)) {
      markerCounts.set(match[1], (markerCounts.get(match[1]) || 0) + 0.5);
    }
  }
  for (const page of pages) page.coldInbound = Math.floor(markerCounts.get(hash(page.canonical)) || 0);
  return pages;
}

function sourceScore(source, target) {
  const similarity = overlapScore(source.tokens, target.tokens);
  const directTopicBonus = [...target.tokens].some((token) => source.tokens.has(token) && BUSINESS_TERMS.has(token)) ? 8 : 0;
  return similarity * 100 + Math.min(source.inbound, 12) * 1.5 + businessScore(source) * 0.35 + directTopicBonus;
}

function targetScore(page) {
  return (
    businessScore(page) * 5 +
    Math.min(page.wordCount, 2200) / 80 +
    Math.max(0, 10 - Math.min(page.inbound, 10)) * 4 +
    Math.max(0, DESIRED_COLD_START_BACKLINKS - page.coldInbound) * 12
  );
}

export function chooseInternalLinkAction(pages, maxSources = DEFAULT_MAX_SOURCES) {
  const candidates = [];
  for (const target of pages) {
    if (target.wordCount < 450) continue;
    if (target.coldInbound >= DESIRED_COLD_START_BACKLINKS) continue;
    if (businessScore(target) < 9) continue;

    const marker = hash(target.canonical);
    const sources = pages
      .filter((source) => source.canonical !== target.canonical)
      .filter((source) => source.wordCount >= 450)
      .filter((source) => source.coldStartBlocks < MAX_COLD_START_BLOCKS_PER_SOURCE)
      .filter((source) => !source.links.has(target.canonical))
      .filter((source) => !source.html.includes(`SEO_ALWAYS_IMPROVE_LINK:${marker}`))
      .map((source) => ({ source, score: sourceScore(source, target) }))
      .filter((entry) => entry.score >= 8)
      .sort((left, right) => right.score - left.score || left.source.canonical.localeCompare(right.source.canonical))
      .slice(0, maxSources);

    if (!sources.length) continue;
    candidates.push({
      type: 'internal-links',
      target,
      sources: sources.map((entry) => entry.source),
      marker,
      score: targetScore(target) + sources.reduce((sum, entry) => sum + entry.score, 0) / sources.length,
      reason: `${target.title} has ${target.inbound} discovered inbound internal link(s) and ${target.coldInbound}/${DESIRED_COLD_START_BACKLINKS} cold-start reinforcement link(s).`,
    });
  }
  return candidates.sort((left, right) => right.score - left.score || left.target.canonical.localeCompare(right.target.canonical))[0] || null;
}

function linkSection(action) {
  const href = new URL(action.target.canonical).pathname || '/';
  const description = compactText(action.target.description || `Read the practical IZEM guide to ${action.target.title.toLowerCase()}.`, 190);
  return `\n<!-- SEO_ALWAYS_IMPROVE_LINK:${action.marker} -->\n<section class="izem-related-resource" data-seo-growth-link="${action.marker}">\n  <h2>Related resource</h2>\n  <p><a href="${escapeHtml(href)}"><strong>${escapeHtml(action.target.title)}</strong></a>${description ? ` — ${escapeHtml(description)}` : ''}</p>\n</section>\n<!-- /SEO_ALWAYS_IMPROVE_LINK:${action.marker} -->\n`;
}

function injectBeforeClosingContainer(html, section) {
  for (const closingTag of ['article', 'main', 'body']) {
    const pattern = new RegExp(`</${closingTag}>`, 'i');
    if (pattern.test(html)) return html.replace(pattern, `${section}</${closingTag}>`);
  }
  throw new Error('Cannot inject internal link: no closing article, main, or body tag exists');
}

export async function applyInternalLinkAction(action, { dryRun = false } = {}) {
  if (!action || action.type !== 'internal-links') throw new Error('A valid internal-link action is required');
  const section = linkSection(action);
  const changedFiles = [];
  for (const source of action.sources) {
    const current = await fsp.readFile(source.file, 'utf8');
    if (current.includes(`SEO_ALWAYS_IMPROVE_LINK:${action.marker}`)) continue;
    const updated = injectBeforeClosingContainer(current, section);
    if (!updated.includes(`href="${new URL(action.target.canonical).pathname}"`)) {
      throw new Error(`Injected link validation failed for ${source.relative}`);
    }
    if (!dryRun) await fsp.writeFile(source.file, updated, 'utf8');
    changedFiles.push(source.file);
  }
  return changedFiles;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  for (const [name, value] of Object.entries({
    changed: 'false',
    action: 'none',
    target_hash: '',
    target_url: '',
    source_url: '',
    source_urls: '',
    marker: '',
    files: '',
  })) setOutput(name, value);

  const pages = await buildPageInventory(args.publicDir);
  const action = chooseInternalLinkAction(pages, args.maxSources);
  if (!action) {
    console.log(`Cold-start SEO audit completed across ${pages.length} eligible English indexable pages; no safe internal-link action remained.`);
    return;
  }

  const changedFiles = await applyInternalLinkAction(action, { dryRun: args.dryRun });
  const sourceUrls = action.sources.map((source) => source.canonical);
  const relativeFiles = changedFiles.map((file) => path.relative(ROOT, file).split(path.sep).join('/'));
  setOutput('changed', args.dryRun ? 'false' : String(changedFiles.length > 0));
  setOutput('action', 'internal-links');
  setOutput('target_hash', action.marker);
  setOutput('target_url', action.target.canonical);
  setOutput('source_url', sourceUrls[0] || '');
  setOutput('source_urls', sourceUrls.join(','));
  setOutput('marker', `SEO_ALWAYS_IMPROVE_LINK:${action.marker}`);
  setOutput('files', relativeFiles.join(','));

  console.log(`${args.dryRun ? 'Dry-run selected' : 'Applied'} cold-start internal-link action ${action.marker}.`);
  console.log(`Target: ${action.target.canonical}`);
  console.log(`Sources changed: ${relativeFiles.join(', ') || 'none'}`);
  console.log(`Reason: ${action.reason}`);
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((error) => {
    console.error(`Cold-start SEO growth failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
