#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_SEARCH_REPORT = path.join(ROOT, 'tools/ai-marketing/search-console-reports/latest-28d.json');
const DEFAULT_INDEX_REPORT = path.join(ROOT, 'tools/ai-marketing/search-console-reports/index-inspection-latest.json');
const MAX_LANDING_PAGES = 25;

function parseArgs(argv) {
  const args = {
    searchReport: DEFAULT_SEARCH_REPORT,
    indexReport: DEFAULT_INDEX_REPORT,
    output: '',
    runUrl: process.env.GITHUB_RUN_ID && process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : '',
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === '--search-report') args.searchReport = path.resolve(argv[++index]);
    else if (item.startsWith('--search-report=')) args.searchReport = path.resolve(item.slice(16));
    else if (item === '--index-report') args.indexReport = path.resolve(argv[++index]);
    else if (item.startsWith('--index-report=')) args.indexReport = path.resolve(item.slice(15));
    else if (item === '--output') args.output = path.resolve(argv[++index]);
    else if (item.startsWith('--output=')) args.output = path.resolve(item.slice(9));
    else if (item === '--run-url') args.runUrl = argv[++index] || '';
    else if (item.startsWith('--run-url=')) args.runUrl = item.slice(10);
  }
  return args;
}

function number(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pct(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function md(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ').trim();
}

function pathOnly(value) {
  try {
    const url = new URL(value);
    return `${url.pathname}${url.search}` || '/';
  } catch {
    return '/';
  }
}

function parseDate(value) {
  const timestamp = Date.parse(String(value || ''));
  return Number.isFinite(timestamp) ? timestamp : null;
}

function attr(tag, name) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, 'i');
  return tag.match(pattern)?.[1] || '';
}

export function extractSourceModifiedDate(html) {
  const candidates = [];
  const metaTags = String(html || '').match(/<meta\b[^>]*>/gi) || [];
  for (const tag of metaTags) {
    if (attr(tag, 'property').toLowerCase() !== 'article:modified_time') continue;
    const value = attr(tag, 'content');
    const timestamp = parseDate(value);
    if (timestamp !== null) candidates.push({ value, timestamp });
  }

  const jsonDate = /"dateModified"\s*:\s*"([^"]+)"/g;
  let match;
  while ((match = jsonDate.exec(String(html || ''))) !== null) {
    const value = match[1];
    const timestamp = parseDate(value);
    if (timestamp !== null) candidates.push({ value, timestamp });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.timestamp - a.timestamp);
  return new Date(candidates[0].timestamp).toISOString();
}

function sourceCandidates(urlValue, root = ROOT) {
  const url = new URL(urlValue);
  const decoded = decodeURIComponent(url.pathname);
  const clean = decoded.replace(/^\/+/, '');
  if (clean.split('/').some((part) => part === '..')) return [];
  if (!clean) return [path.join(root, 'index.html')];
  if (decoded.endsWith('/')) return [path.join(root, 'public', clean, 'index.html')];
  return [
    path.join(root, 'public', `${clean}.html`),
    path.join(root, 'public', clean, 'index.html'),
  ];
}

export async function loadSourceModifiedDates(indexResults, root = ROOT) {
  const byPath = {};
  for (const result of indexResults || []) {
    const key = pathOnly(result.url);
    for (const candidate of sourceCandidates(result.url, root)) {
      try {
        const html = await fs.readFile(candidate, 'utf8');
        const modified = extractSourceModifiedDate(html);
        if (modified) byPath[key] = modified;
        break;
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
      }
    }
  }
  return byPath;
}

export function crawlFreshness(result, sourceModified) {
  const sourceTimestamp = parseDate(sourceModified);
  if (sourceTimestamp === null) return 'Source date unavailable';
  const crawlTimestamp = parseDate(result?.lastCrawlTime);
  if (crawlTimestamp === null) return 'Discovery pending';
  if (crawlTimestamp < sourceTimestamp) return 'Awaiting recrawl';
  return 'Crawl current';
}

function landingPageAggregates(searchReport) {
  const dimensions = Array.isArray(searchReport.dimensions) ? searchReport.dimensions : [];
  const pageIndex = dimensions.indexOf('page');
  if (pageIndex === -1) throw new Error('Search Analytics report must contain a page dimension');

  const pages = new Map();
  for (const row of searchReport.rows) {
    const keys = Array.isArray(row.keys) ? row.keys : [];
    const page = String(keys[pageIndex] || '');
    if (!page) continue;
    const current = pages.get(page) || { page, clicks: 0, impressions: 0, weightedPosition: 0 };
    const impressions = number(row.impressions);
    current.clicks += number(row.clicks);
    current.impressions += impressions;
    current.weightedPosition += number(row.position) * impressions;
    pages.set(page, current);
  }

  return [...pages.values()]
    .map((entry) => ({
      ...entry,
      ctr: entry.impressions > 0 ? entry.clicks / entry.impressions : 0,
      averagePosition: entry.impressions > 0 ? entry.weightedPosition / entry.impressions : null,
    }))
    .sort((a, b) => (
      b.impressions - a.impressions
      || b.clicks - a.clicks
      || (a.averagePosition ?? Number.POSITIVE_INFINITY) - (b.averagePosition ?? Number.POSITIVE_INFINITY)
      || a.page.localeCompare(b.page)
    ));
}

export function buildSafeSnapshot(searchReport, indexReport, options = {}) {
  if (!searchReport || !Array.isArray(searchReport.rows)) throw new Error('Search Analytics report rows are missing');
  const dimensions = Array.isArray(searchReport.dimensions) ? searchReport.dimensions : [];
  if (!dimensions.includes('query') || !dimensions.includes('page')) throw new Error('Search Analytics report must contain query and page dimensions');
  if (!indexReport || !Array.isArray(indexReport.results)) throw new Error('URL Inspection results are missing');

  const totals = searchReport.rows.reduce((sum, row) => {
    const impressions = number(row.impressions);
    sum.clicks += number(row.clicks);
    sum.impressions += impressions;
    sum.weightedPosition += number(row.position) * impressions;
    return sum;
  }, { clicks: 0, impressions: 0, weightedPosition: 0 });
  const ctr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;
  const averagePosition = totals.impressions > 0 ? totals.weightedPosition / totals.impressions : null;
  const pageAggregates = landingPageAggregates(searchReport);
  const displayedPages = pageAggregates.slice(0, MAX_LANDING_PAGES);
  const counts = indexReport.counts || {};
  const runUrl = String(options.runUrl || '');
  const generatedAt = String(options.generatedAt || new Date().toISOString());
  const sourceModifiedByPath = options.sourceModifiedByPath || {};
  const crawlStates = indexReport.results.map((result) => {
    const pagePath = pathOnly(result.url);
    const sourceModified = sourceModifiedByPath[pagePath] || null;
    return { result, pagePath, sourceModified, state: crawlFreshness(result, sourceModified) };
  });
  const crawlStateCounts = crawlStates.reduce((sum, item) => {
    sum[item.state] = (sum[item.state] || 0) + 1;
    return sum;
  }, {});

  const lines = [
    '# Latest Search Console safe snapshot',
    '',
    `Updated: ${md(generatedAt)}`,
    ...(runUrl ? [`Workflow run: ${runUrl}`] : []),
    '',
    '## Search Analytics aggregate',
    '',
    `- Reporting period: ${md(searchReport.startDate || 'unknown')} to ${md(searchReport.endDate || 'unknown')}`,
    `- Private query + landing-page rows: ${searchReport.rows.length}`,
    `- Distinct landing pages: ${pageAggregates.length}`,
    `- Clicks: ${Math.round(totals.clicks)}`,
    `- Impressions: ${Math.round(totals.impressions)}`,
    `- Aggregate CTR: ${pct(ctr)}`,
    `- Impression-weighted average position: ${averagePosition === null ? 'n/a' : averagePosition.toFixed(2)}`,
    '',
    '## Landing-page aggregate (queries removed)',
    '',
    `Top ${displayedPages.length} public landing page${displayedPages.length === 1 ? '' : 's'} by Search Console impressions. Query strings are not included, and no query-to-page pair is exposed.`,
    '',
    '| Landing page | Clicks | Impressions | CTR | Avg. position |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...displayedPages.map((entry) => `| ${md(pathOnly(entry.page))} | ${Math.round(entry.clicks)} | ${Math.round(entry.impressions)} | ${pct(entry.ctr)} | ${entry.averagePosition === null ? 'n/a' : entry.averagePosition.toFixed(2)} |`),
    '',
    '## Priority URL Inspection',
    '',
    `- Requested: ${number(indexReport.requested)}`,
    `- Inspected: ${number(indexReport.inspected)}`,
    `- Indexed: ${number(counts.indexed)}`,
    `- Not indexed: ${number(counts.notIndexed)}`,
    `- Unknown: ${number(counts.unknown)}`,
    `- API errors: ${Array.isArray(indexReport.apiErrors) ? indexReport.apiErrors.length : 0}`,
    `- Awaiting recrawl after a source update: ${number(crawlStateCounts['Awaiting recrawl'])}`,
    `- Discovery pending with no crawl recorded: ${number(crawlStateCounts['Discovery pending'])}`,
    '',
    '| URL | Verdict | Coverage | Source modified | Last crawl | Crawl state |',
    '| --- | --- | --- | --- | --- | --- |',
    ...crawlStates.map(({ result, pagePath, sourceModified, state }) => `| ${md(pagePath)} | ${md(result.verdict || 'UNKNOWN')} | ${md(result.coverageState || 'Unknown')} | ${md(sourceModified || 'unknown')} | ${md(result.lastCrawlTime || 'none')} | ${md(state)} |`),
    '',
    'Crawl state compares source-backed `dateModified` / `article:modified_time` metadata with Google\'s recorded last crawl. “Awaiting recrawl” means Google\'s inspection state predates the current source version; it is not by itself an indexing failure.',
    '',
    '## Privacy boundary',
    '',
    'This issue intentionally contains no Search Console query strings and no query-to-landing-page pairs. It exposes only site-wide aggregates, aggregate metrics for public landing-page URLs, URL-level Google index status, and public source modification dates. Exact query rows stay in the encrypted private evidence channel.',
    '',
  ];
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [searchRaw, indexRaw] = await Promise.all([
    fs.readFile(args.searchReport, 'utf8'),
    fs.readFile(args.indexReport, 'utf8'),
  ]);
  const searchReport = JSON.parse(searchRaw);
  const indexReport = JSON.parse(indexRaw);
  const sourceModifiedByPath = await loadSourceModifiedDates(indexReport.results, ROOT);
  const rendered = buildSafeSnapshot(searchReport, indexReport, { runUrl: args.runUrl, sourceModifiedByPath });
  if (args.output) {
    await fs.mkdir(path.dirname(args.output), { recursive: true });
    await fs.writeFile(args.output, `${rendered}\n`, { encoding: 'utf8', mode: 0o600 });
  } else {
    process.stdout.write(`${rendered}\n`);
  }
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((error) => {
    console.error(`Safe GSC snapshot failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
