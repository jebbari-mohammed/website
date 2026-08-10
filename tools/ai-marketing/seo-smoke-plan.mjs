#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { resolvePublicFile, queryHash } from './seo-publisher-core.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const REPORT = path.join(ROOT, 'tools/ai-marketing/search-console-reports/latest-28d.json');
const OUTPUT = process.env.SEO_SMOKE_PLAN || '/tmp/izem-seo-smoke-plan.json';

function main() {
  const report = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
  const queryIndex = (report.dimensions || []).indexOf('query');
  const pageIndex = (report.dimensions || []).indexOf('page');
  if (queryIndex < 0 || pageIndex < 0) throw new Error('GSC smoke report requires query,page dimensions');
  const candidates = (report.rows || [])
    .map((row) => ({
      query: String(row.keys?.[queryIndex] || '').trim().toLowerCase(),
      page: String(row.keys?.[pageIndex] || '').trim(),
      clicks: Number(row.clicks || 0),
      impressions: Number(row.impressions || 0),
      ctr: Number(row.ctr || 0),
      position: Number(row.position || 0),
    }))
    .filter((row) => row.query && row.page && row.impressions > 0 && resolvePublicFile(row.page, PUBLIC_DIR))
    .sort((a, b) => b.impressions - a.impressions);
  const row = candidates[0];
  if (!row) throw new Error('No GSC query+page row maps to a current public HTML file');
  const now = new Date().toISOString();
  const plan = {
    id: `${now.replace(/[:.]/g, '-')}-credentialed-smoke-plan`,
    createdAt: now,
    siteUrl: 'https://youraicoach.life',
    source: { gscReport: 'private-smoke', startDate: report.startDate, endDate: report.endDate, dimensions: report.dimensions },
    summary: { gscRows: report.rows.length, uniqueQueries: 1, inventoryPages: 1 },
    opportunities: [{
      action: 'refresh',
      query: row.query,
      score: 90,
      reason: 'credentialed end-to-end smoke validation only',
      currentPages: [row.page],
      targetPage: row.page,
      metrics: { clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position },
      diagnostics: { expectedCtrHeuristic: 0.035, pageQuerySimilarity: 0.5 },
      decision: { expectedValue: 90, confidence: 'high', risk: 0 },
      cluster: { id: 'smoke', queryHash: queryHash(row.query), siblings: [], size: 1 },
      brief: {
        intent: 'informational',
        relatedQueries: [],
        internalLinks: [],
        contentAngle: 'Validate the complete private GSC to grounded editorial to deterministic renderer path without publishing.',
      },
    }],
  };
  fs.writeFileSync(OUTPUT, `${JSON.stringify(plan, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  console.log(`Credentialed smoke plan ready: query-hash=${queryHash(row.query)}, mapped-page=yes.`);
}

try {
  main();
} catch (error) {
  console.error(`Credentialed smoke-plan creation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
