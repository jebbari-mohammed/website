#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const DEFAULT_CONFIG_PATH = path.join(ROOT, 'config/seo-growth.config.json');
const DEFAULT_REPORT_DIR = path.join(ROOT, 'tools/ai-marketing/search-console-reports');
const DEFAULT_OUTPUT_DIR = path.join(ROOT, 'data/marketing-employee/seo-growth');
const DEFAULT_PUBLIC_DIR = path.join(ROOT, 'public');

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'best', 'by', 'can', 'for', 'from', 'how', 'i', 'in', 'is',
  'it', 'me', 'my', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'vs', 'what', 'when', 'which', 'with',
  'you', 'your', 'app', 'apps', '2026',
]);

export function tokenize(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/https?:\/\/[^\s]+/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

export function similarity(left = '', right = '') {
  const a = new Set(tokenize(left));
  const b = new Set(tokenize(right));
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function parseArgs(argv) {
  const args = {
    config: DEFAULT_CONFIG_PATH,
    gsc: '',
    output: DEFAULT_OUTPUT_DIR,
    publicDir: DEFAULT_PUBLIC_DIR,
    top: 30,
    requireGsc: false,
    printTopQuery: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--config') args.config = path.resolve(argv[++i]);
    else if (item.startsWith('--config=')) args.config = path.resolve(item.slice('--config='.length));
    else if (item === '--gsc') args.gsc = path.resolve(argv[++i]);
    else if (item.startsWith('--gsc=')) args.gsc = path.resolve(item.slice('--gsc='.length));
    else if (item === '--output') args.output = path.resolve(argv[++i]);
    else if (item.startsWith('--output=')) args.output = path.resolve(item.slice('--output='.length));
    else if (item === '--public-dir') args.publicDir = path.resolve(argv[++i]);
    else if (item.startsWith('--public-dir=')) args.publicDir = path.resolve(item.slice('--public-dir='.length));
    else if (item === '--top') args.top = Number(argv[++i]);
    else if (item.startsWith('--top=')) args.top = Number(item.slice('--top='.length));
    else if (item === '--require-gsc') args.requireGsc = true;
    else if (item === '--print-top-query') args.printTopQuery = true;
    else if (item === '--help' || item === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  if (!Number.isFinite(args.top) || args.top < 1) throw new Error('--top must be a positive number');
  return args;
}

function printHelp() {
  console.log(`IZEM SEO Growth Engine\n\nUsage:\n  node tools/ai-marketing/seo-growth-engine.mjs\n  node tools/ai-marketing/seo-growth-engine.mjs --gsc tools/ai-marketing/search-console-reports/latest-28d.json\n  node tools/ai-marketing/seo-growth-engine.mjs --require-gsc\n\nWhat it does:\n  1. Inventories existing public HTML pages.\n  2. Reads live Search Console query+page rows.\n  3. Detects near-page-one opportunities, weak CTR, page/query mismatch, and cannibalization.\n  4. Chooses CREATE, REFRESH, MERGE, MONITOR, or SKIP.\n  5. Produces deduplicated content briefs and a prioritized work queue.\n`);
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function loadConfig(file) {
  const config = await readJson(file);
  if (!config.siteUrl || !config.brand) throw new Error(`Invalid SEO growth config: ${file}`);
  return config;
}

async function walkHtml(dir) {
  const output = [];
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return output;
    throw error;
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...await walkHtml(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) output.push(full);
  }
  return output;
}

function attr(tag, name) {
  const pattern = new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i');
  return tag.match(pattern)?.[1] || '';
}

function stripTags(value = '') {
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

function fallbackUrlForFile(file, publicDir, siteUrl) {
  let relative = path.relative(publicDir, file).split(path.sep).join('/');
  if (relative === 'index.html') relative = '';
  else if (relative.endsWith('/index.html')) relative = relative.slice(0, -'index.html'.length);
  else if (relative.endsWith('.html')) relative = relative.slice(0, -'.html'.length);
  const suffix = relative ? `/${relative}` : '/';
  return new URL(suffix, siteUrl).toString();
}

function normalizeUrl(value = '') {
  if (!value) return '';
  try {
    const url = new URL(value);
    url.hash = '';
    url.search = '';
    const pathname = url.pathname === '/' ? '/' : url.pathname.replace(/\/$/, '');
    return `${url.origin}${pathname}`;
  } catch {
    return String(value).replace(/[?#].*$/, '').replace(/\/$/, '');
  }
}

function extractHtmlPage(html, file, publicDir, siteUrl) {
  const title = stripTags(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  const h1 = stripTags(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
  const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
  const descriptionTag = metaTags.find((tag) => attr(tag, 'name').toLowerCase() === 'description');
  const description = descriptionTag ? attr(descriptionTag, 'content') : '';
  const linkTags = html.match(/<link\b[^>]*>/gi) || [];
  const canonicalTag = linkTags.find((tag) => attr(tag, 'rel').toLowerCase().split(/\s+/).includes('canonical'));
  const canonical = normalizeUrl(canonicalTag ? attr(canonicalTag, 'href') : fallbackUrlForFile(file, publicDir, siteUrl));
  const bodyText = stripTags(html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html);
  const links = [...html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({ href: match[1], text: stripTags(match[2]) }))
    .filter((link) => link.href && !link.href.startsWith('#'));

  return {
    file: path.relative(ROOT, file).split(path.sep).join('/'),
    url: canonical,
    title,
    h1,
    description,
    wordCount: bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0,
    internalLinks: links.filter((link) => link.href.startsWith('/') || link.href.includes(new URL(siteUrl).hostname)).length,
    topicalText: `${title} ${h1} ${description} ${canonical}`,
  };
}

export async function buildSiteInventory(publicDir, siteUrl) {
  const files = await walkHtml(publicDir);
  const pages = [];
  for (const file of files) {
    const html = await fs.readFile(file, 'utf8');
    pages.push(extractHtmlPage(html, file, publicDir, siteUrl));
  }
  return pages;
}

async function findLatestGscReport(reportDir = DEFAULT_REPORT_DIR) {
  let files = [];
  try {
    files = (await fs.readdir(reportDir)).filter((file) => file.endsWith('.json'));
  } catch (error) {
    if (error?.code === 'ENOENT') return '';
    throw error;
  }
  const rows = await Promise.all(files.map(async (file) => {
    const full = path.join(reportDir, file);
    const stat = await fs.stat(full);
    return { full, mtimeMs: stat.mtimeMs };
  }));
  return rows.sort((a, b) => b.mtimeMs - a.mtimeMs)[0]?.full || '';
}

export function normalizeGscRows(report) {
  const dimensions = report.dimensions || [];
  const queryIndex = dimensions.indexOf('query');
  const pageIndex = dimensions.indexOf('page');
  if (queryIndex < 0) throw new Error('Search Console report must include the query dimension.');

  return (report.rows || [])
    .map((row) => ({
      query: String(row.keys?.[queryIndex] || '').trim().toLowerCase(),
      page: pageIndex >= 0 ? normalizeUrl(row.keys?.[pageIndex] || '') : '',
      clicks: Number(row.clicks || 0),
      impressions: Number(row.impressions || 0),
      ctr: Number(row.ctr || 0),
      position: Number(row.position || 0),
    }))
    .filter((row) => row.query && row.impressions > 0);
}

function classifyIntent(query) {
  if (/\b(best|top|vs|versus|alternative|review|compare|comparison)\b/i.test(query)) return 'commercial';
  if (/\b(price|pricing|cost|download|trial|subscribe)\b/i.test(query)) return 'transactional';
  if (/\b(izem|youraicoach|your ai coach)\b/i.test(query)) return 'navigational';
  return 'informational';
}

function expectedCtrHeuristic(position) {
  if (position <= 3) return 0.12;
  if (position <= 5) return 0.07;
  if (position <= 10) return 0.035;
  if (position <= 20) return 0.015;
  if (position <= 30) return 0.008;
  return 0.004;
}

function topicFit(query, config) {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return 0;
  const topicTokens = new Set((config.topicTerms || []).flatMap(tokenize));
  const blockedTokens = new Set((config.blockedTopicTerms || []).flatMap(tokenize));
  const overlap = queryTokens.filter((token) => topicTokens.has(token)).length / queryTokens.length;
  const blockedOverlap = queryTokens.filter((token) => blockedTokens.has(token)).length / queryTokens.length;
  const phraseBonus = (config.highValuePatterns || []).some((pattern) => new RegExp(pattern, 'i').test(query)) ? 0.25 : 0;
  return clamp(overlap * 1.8 + phraseBonus - blockedOverlap * 1.5);
}

function pageForUrl(pageUrl, inventory) {
  const normalized = normalizeUrl(pageUrl);
  return inventory.find((page) => normalizeUrl(page.url) === normalized);
}

function rowPageSimilarity(row, inventory) {
  const page = pageForUrl(row.page, inventory);
  if (!page) return 0;
  return similarity(row.query, page.topicalText);
}

function aggregateQueries(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = row.query;
    const current = map.get(key) || { query: key, rows: [], clicks: 0, impressions: 0, weightedPosition: 0 };
    current.rows.push(row);
    current.clicks += row.clicks;
    current.impressions += row.impressions;
    current.weightedPosition += row.position * row.impressions;
    map.set(key, current);
  }

  return [...map.values()].map((item) => ({
    ...item,
    ctr: item.impressions ? item.clicks / item.impressions : 0,
    position: item.impressions ? item.weightedPosition / item.impressions : 0,
    rows: item.rows.sort((a, b) => b.impressions - a.impressions),
  }));
}

export function detectCannibalization(queryGroups, config = {}) {
  const minPageImpressions = config.thresholds?.cannibalizationMinPageImpressions ?? 3;
  const minTotalImpressions = config.thresholds?.cannibalizationMinTotalImpressions ?? 10;
  const output = new Map();

  for (const group of queryGroups) {
    const viable = group.rows.filter((row) => row.page && row.impressions >= minPageImpressions);
    const distinctPages = [...new Set(viable.map((row) => row.page))];
    if (distinctPages.length < 2 || group.impressions < minTotalImpressions) continue;
    output.set(group.query, viable);
  }
  return output;
}

function chooseMergeTarget(rows) {
  return [...rows].sort((a, b) => {
    if (b.clicks !== a.clicks) return b.clicks - a.clicks;
    if (a.position !== b.position) return a.position - b.position;
    return b.impressions - a.impressions;
  })[0];
}

function actionScore({ action, impressions, position, ctr, fit, pageSimilarity }) {
  const impressionScore = clamp(Math.log10(impressions + 1) / 2.4);
  const leverage = position >= 4 && position <= 10 ? 1
    : position > 10 && position <= 20 ? 0.88
      : position > 20 && position <= 40 ? 0.58
        : position < 4 ? 0.32
          : 0.2;
  const expectedCtr = expectedCtrHeuristic(position);
  const ctrGap = expectedCtr > 0 ? clamp((expectedCtr - ctr) / expectedCtr) : 0;
  const mismatch = 1 - pageSimilarity;
  const actionBias = action === 'refresh' ? 1 : action === 'merge' ? 0.94 : action === 'create' ? 0.82 : 0.35;
  return Math.round(100 * clamp(
    impressionScore * 0.27 +
    leverage * 0.25 +
    ctrGap * 0.16 +
    fit * 0.22 +
    mismatch * 0.05 +
    actionBias * 0.05,
  ));
}

function buildReason(action, metrics, extra = '') {
  const bits = [];
  if (action === 'refresh') bits.push(`average position ${metrics.position.toFixed(1)} is close enough to page one to improve before creating another URL`);
  if (action === 'create') bits.push('the ranking URL is a weak topical match, so a dedicated page may satisfy the intent better');
  if (action === 'merge') bits.push('multiple URLs receive impressions for the same query, which can split relevance and internal-link signals');
  if (action === 'monitor') bits.push('the query is relevant, but current leverage is weaker than higher-priority opportunities');
  if (extra) bits.push(extra);
  return bits.join('; ');
}

function relatedQueriesFor(query, queryGroups, limit = 8) {
  return queryGroups
    .filter((group) => group.query !== query)
    .map((group) => ({ query: group.query, similarity: similarity(query, group.query), impressions: group.impressions }))
    .filter((item) => item.similarity >= 0.34)
    .sort((a, b) => (b.similarity - a.similarity) || (b.impressions - a.impressions))
    .slice(0, limit)
    .map((item) => item.query);
}

function internalLinksFor(query, inventory, targetPage, limit = 6) {
  return inventory
    .filter((page) => normalizeUrl(page.url) !== normalizeUrl(targetPage))
    .map((page) => ({
      url: page.url,
      title: page.title || page.h1 || page.url,
      score: similarity(query, page.topicalText),
    }))
    .filter((page) => page.score >= 0.08)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function createBrief(opportunity, queryGroups, inventory, config) {
  const intent = classifyIntent(opportunity.query);
  const relatedQueries = relatedQueriesFor(opportunity.query, queryGroups);
  const targetPage = opportunity.targetPage || opportunity.currentPages?.[0] || '';
  const internalLinks = internalLinksFor(opportunity.query, inventory, targetPage);
  const directAnswer = intent === 'commercial'
    ? `Open with a direct recommendation framework for “${opportunity.query}”, then make the tradeoffs explicit.`
    : `Answer “${opportunity.query}” directly in the first paragraph, then explain the practical steps and tradeoffs.`;

  return {
    action: opportunity.action,
    primaryQuery: opportunity.query,
    intent,
    targetPage,
    currentPages: opportunity.currentPages,
    relatedQueries,
    whyNow: opportunity.reason,
    currentMetrics: opportunity.metrics,
    contentAngle: opportunity.action === 'merge'
      ? 'Consolidate overlapping pages into the strongest canonical answer and redirect or de-index redundant URLs only after reviewing their unique value.'
      : opportunity.action === 'refresh'
        ? 'Improve the existing page instead of publishing a near-duplicate. Strengthen the direct answer, missing subtopics, title/description, examples, internal links, and unique first-party value.'
        : 'Create one strong page for the whole query cluster, not one page per keyword variation.',
    mustDo: [
      directAnswer,
      'Use the related queries as subtopics when they share the same search intent; do not create separate thin pages for each wording variation.',
      'Add at least one genuinely useful first-party element: an IZEM decision framework, checklist, calculator/tool, workflow, product screenshot, or transparent comparison methodology.',
      'Use only verifiable IZEM product facts. Never invent usage statistics, studies, rankings, testimonials, medical outcomes, or competitor capabilities/prices.',
      'For health or behavior claims, prefer primary/official sources and clearly distinguish general information from medical advice.',
      'Add descriptive internal links from relevant existing pages and a clear next step for a reader who wants coaching/accountability.',
    ],
    internalLinks,
    suggestedStructure: [
      'Direct answer / key takeaway',
      'Who this is for and the exact problem it solves',
      'Decision framework or step-by-step method',
      ...(intent === 'commercial' ? ['Transparent comparison table with dated source checks and owner disclosure'] : []),
      'Common failure modes / tradeoffs',
      'How IZEM approaches the problem, without pretending it is best for everyone',
      'Practical checklist or reusable framework',
      'FAQ only for questions that materially help the reader',
    ],
    qualityGates: [
      'No unsupported factual claims.',
      'No duplicate intent with an existing canonical page.',
      'No keyword stuffing or forced exact-match repetition.',
      'No publishing solely because a query has impressions; the page must add substantial user value.',
      'Title and meta description must accurately describe the page and should be rewritten if CTR is weak.',
      'If refreshing, preserve useful existing sections and backlinks rather than replacing the page blindly.',
      `Stay within IZEM's site focus: ${(config.coreTopics || []).join(', ')}.`,
    ],
  };
}

export function buildGrowthPlan({ rows, inventory, config, source = {} }) {
  const thresholds = {
    minImpressions: 8,
    minCreateImpressions: 12,
    refreshMinPosition: 4,
    refreshMaxPosition: 20,
    createMaxPosition: 45,
    minTopicFit: 0.16,
    ...(config.thresholds || {}),
  };
  const queryGroups = aggregateQueries(rows);
  const cannibalization = detectCannibalization(queryGroups, config);
  const opportunities = [];

  for (const group of queryGroups) {
    const fit = topicFit(group.query, config);
    if (fit < thresholds.minTopicFit) {
      opportunities.push({
        action: 'skip',
        query: group.query,
        score: 0,
        reason: 'low product/topic fit for IZEM',
        currentPages: [...new Set(group.rows.map((row) => row.page).filter(Boolean))],
        targetPage: '',
        metrics: { clicks: group.clicks, impressions: group.impressions, ctr: group.ctr, position: group.position },
      });
      continue;
    }

    const cannibalRows = cannibalization.get(group.query);
    if (cannibalRows) {
      const target = chooseMergeTarget(cannibalRows);
      const currentPages = [...new Set(cannibalRows.map((row) => row.page))];
      const bestSimilarity = Math.max(...cannibalRows.map((row) => rowPageSimilarity(row, inventory)), 0);
      const metrics = { clicks: group.clicks, impressions: group.impressions, ctr: group.ctr, position: group.position };
      const action = 'merge';
      opportunities.push({
        action,
        query: group.query,
        score: actionScore({ action, ...metrics, fit, pageSimilarity: bestSimilarity }),
        reason: buildReason(action, metrics, `${currentPages.length} URLs are receiving impressions`),
        currentPages,
        targetPage: target.page,
        metrics,
      });
      continue;
    }

    const primaryRow = group.rows[0];
    const pageSimilarity = primaryRow ? rowPageSimilarity(primaryRow, inventory) : 0;
    const metrics = { clicks: group.clicks, impressions: group.impressions, ctr: group.ctr, position: group.position };
    const expectedCtr = expectedCtrHeuristic(group.position);
    const lowCtr = group.ctr < expectedCtr * 0.55;
    const pageMismatch = !!primaryRow?.page && pageSimilarity < 0.16;
    let action = 'monitor';
    let extra = '';

    if (
      group.impressions >= thresholds.minImpressions &&
      group.position >= thresholds.refreshMinPosition &&
      group.position <= thresholds.refreshMaxPosition
    ) {
      action = 'refresh';
      if (lowCtr) extra = `CTR ${(group.ctr * 100).toFixed(2)}% is weak relative to an internal position-based heuristic; test title/angle before adding a new page`;
    } else if (
      group.impressions >= thresholds.minCreateImpressions &&
      group.position > thresholds.refreshMaxPosition &&
      group.position <= thresholds.createMaxPosition &&
      pageMismatch
    ) {
      action = 'create';
    } else if (
      group.impressions >= thresholds.minImpressions &&
      lowCtr &&
      group.position <= 15
    ) {
      action = 'refresh';
      extra = `CTR ${(group.ctr * 100).toFixed(2)}% suggests the snippet/angle may be underperforming`;
    }

    const currentPages = [...new Set(group.rows.map((row) => row.page).filter(Boolean))];
    opportunities.push({
      action,
      query: group.query,
      score: actionScore({ action, ...metrics, fit, pageSimilarity }),
      reason: buildReason(action, metrics, extra),
      currentPages,
      targetPage: action === 'create' ? '' : (primaryRow?.page || ''),
      metrics,
      diagnostics: {
        topicFit: Number(fit.toFixed(3)),
        pageQuerySimilarity: Number(pageSimilarity.toFixed(3)),
        expectedCtrHeuristic: expectedCtr,
      },
    });
  }

  const ranked = opportunities
    .filter((item) => item.action !== 'skip')
    .sort((a, b) => b.score - a.score || b.metrics.impressions - a.metrics.impressions);

  for (const item of ranked) item.brief = createBrief(item, queryGroups, inventory, config);

  return {
    id: `${new Date().toISOString().replace(/[:.]/g, '-')}-seo-growth-plan`,
    createdAt: new Date().toISOString(),
    siteUrl: config.siteUrl,
    source,
    summary: {
      gscRows: rows.length,
      uniqueQueries: queryGroups.length,
      inventoryPages: inventory.length,
      refresh: ranked.filter((item) => item.action === 'refresh').length,
      create: ranked.filter((item) => item.action === 'create').length,
      merge: ranked.filter((item) => item.action === 'merge').length,
      monitor: ranked.filter((item) => item.action === 'monitor').length,
      skippedLowFit: opportunities.filter((item) => item.action === 'skip').length,
    },
    principles: [
      'Prefer refreshing pages in striking distance over publishing another near-duplicate URL.',
      'Cluster keyword variants by intent before writing.',
      'Use live Search Console evidence as the first source of opportunity.',
      'Treat CTR expectations as internal prioritization heuristics, not universal benchmarks.',
      'Require original first-party value before CREATE is allowed.',
      'Merge only after reviewing backlinks, unique sections, and redirect implications.',
    ],
    opportunities: ranked,
  };
}

function formatPercent(value) {
  return `${(Number(value || 0) * 100).toFixed(2)}%`;
}

export function growthPlanToMarkdown(plan, top = 30) {
  const lines = [
    '# IZEM SEO Growth Plan',
    '',
    `Created: ${plan.createdAt}`,
    `Site: ${plan.siteUrl}`,
    `Search Console source: ${plan.source?.gscReport || 'none'}`,
    '',
    '## Summary',
    '',
    `- GSC rows: ${plan.summary.gscRows}`,
    `- Unique queries: ${plan.summary.uniqueQueries}`,
    `- Existing HTML pages inventoried: ${plan.summary.inventoryPages}`,
    `- Refresh opportunities: ${plan.summary.refresh}`,
    `- Create opportunities: ${plan.summary.create}`,
    `- Merge/cannibalization opportunities: ${plan.summary.merge}`,
    `- Monitor: ${plan.summary.monitor}`,
    '',
    '## Priority queue',
    '',
  ];

  for (const [index, item] of plan.opportunities.slice(0, top).entries()) {
    lines.push(`### ${index + 1}. ${item.action.toUpperCase()} — ${item.query}`);
    lines.push('');
    lines.push(`- Score: ${item.score}/100`);
    lines.push(`- Metrics: ${item.metrics.clicks} clicks, ${item.metrics.impressions} impressions, ${formatPercent(item.metrics.ctr)} CTR, position ${item.metrics.position.toFixed(1)}`);
    if (item.targetPage) lines.push(`- Target page: ${item.targetPage}`);
    if (item.currentPages?.length > 1) lines.push(`- Competing pages: ${item.currentPages.join(', ')}`);
    lines.push(`- Why: ${item.reason}`);
    lines.push(`- Intent: ${item.brief.intent}`);
    if (item.brief.relatedQueries.length) lines.push(`- Same-page query cluster: ${item.brief.relatedQueries.join('; ')}`);
    if (item.brief.internalLinks.length) lines.push(`- Internal-link candidates: ${item.brief.internalLinks.map((link) => link.url).join(', ')}`);
    lines.push('');
  }

  lines.push('## Guardrails');
  lines.push('');
  lines.push('- Do not publish one URL per keyword variation.');
  lines.push('- Do not fabricate studies, rankings, testimonials, medical outcomes, competitor capabilities, or prices.');
  lines.push('- A CREATE recommendation is only a draftable opportunity; it still needs substantial first-party value before publication.');
  lines.push('- REFRESH should preserve useful existing content and backlinks.');
  lines.push('- MERGE should be reviewed before redirects or deletions are applied.');
  lines.push('');
  return `${lines.join('\n')}\n`;
}

async function writePlan(plan, outputDir, top) {
  await fs.mkdir(outputDir, { recursive: true });
  const json = `${JSON.stringify(plan, null, 2)}\n`;
  const markdown = growthPlanToMarkdown(plan, top);
  const jsonPath = path.join(outputDir, `${plan.id}.json`);
  const mdPath = path.join(outputDir, `${plan.id}.md`);
  const latestJson = path.join(outputDir, 'latest.json');
  const latestMd = path.join(outputDir, 'latest.md');
  await Promise.all([
    fs.writeFile(jsonPath, json, 'utf8'),
    fs.writeFile(mdPath, markdown, 'utf8'),
    fs.writeFile(latestJson, json, 'utf8'),
    fs.writeFile(latestMd, markdown, 'utf8'),
  ]);
  return { jsonPath, mdPath, latestJson, latestMd };
}

async function createNoDataPlan(config, inventory, source = {}) {
  return {
    id: `${new Date().toISOString().replace(/[:.]/g, '-')}-seo-growth-plan`,
    createdAt: new Date().toISOString(),
    siteUrl: config.siteUrl,
    source,
    status: 'needs-gsc-data',
    summary: {
      gscRows: 0,
      uniqueQueries: 0,
      inventoryPages: inventory.length,
      refresh: 0,
      create: 0,
      merge: 0,
      monitor: 0,
      skippedLowFit: 0,
    },
    principles: [
      'Do not guess demand when Search Console data is unavailable.',
      'Keep the site inventory current, then rerun after a fresh query+page Search Console export.',
    ],
    opportunities: [],
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = await loadConfig(args.config);
  const inventory = await buildSiteInventory(args.publicDir, config.siteUrl);
  const gscPath = args.gsc || await findLatestGscReport(config.gscReportDir ? path.resolve(ROOT, config.gscReportDir) : DEFAULT_REPORT_DIR);

  if (!gscPath) {
    if (args.requireGsc) throw new Error('No Search Console report found. Run `pnpm gsc -- --dimensions query,page` first.');
    const plan = await createNoDataPlan(config, inventory, { gscReport: '' });
    const paths = await writePlan(plan, args.output, args.top);
    if (args.printTopQuery) return;
    console.log(`SEO plan created without GSC data: ${paths.latestJson}`);
    console.log('No content action was guessed. Add Search Console credentials and rerun.');
    return;
  }

  const report = await readJson(gscPath);
  const rows = normalizeGscRows(report);
  const plan = buildGrowthPlan({
    rows,
    inventory,
    config,
    source: {
      gscReport: path.relative(ROOT, gscPath).split(path.sep).join('/'),
      startDate: report.startDate || '',
      endDate: report.endDate || '',
      dimensions: report.dimensions || [],
    },
  });
  const paths = await writePlan(plan, args.output, args.top);

  if (args.printTopQuery) {
    const top = plan.opportunities.find((item) => ['refresh', 'create', 'merge'].includes(item.action));
    if (top) process.stdout.write(top.query);
    return;
  }

  const top = plan.opportunities[0];
  console.log(`SEO growth plan: ${paths.latestJson}`);
  console.log(`Inventory: ${plan.summary.inventoryPages} pages | GSC: ${plan.summary.gscRows} rows | Queries: ${plan.summary.uniqueQueries}`);
  if (top) console.log(`Top action: ${top.action.toUpperCase()} “${top.query}” (${top.score}/100)`);
  else console.log('No actionable in-scope Search Console opportunities met the current thresholds.');
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((error) => {
    console.error(`SEO growth engine failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
