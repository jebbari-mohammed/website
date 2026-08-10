#!/usr/bin/env node

import fs from 'node:fs';
import process from 'node:process';
import { queryHash } from './seo-publisher-core.mjs';

const OUTPUT = process.env.SEO_GROUNDING_SMOKE_PLAN || '/tmp/izem-seo-grounding-smoke-plan.json';
const QUERY = 'fitness app that calls you';
const TARGET = 'https://youraicoach.life/fitness-app-that-calls-you/';

function main() {
  const now = new Date().toISOString();
  const endDate = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const plan = {
    id: `${now.replace(/[:.]/g, '-')}-grounding-smoke-plan`,
    createdAt: now,
    siteUrl: 'https://youraicoach.life',
    source: {
      gscReport: 'public-non-production-smoke-fixture',
      startDate: endDate,
      endDate,
      dimensions: ['query', 'page'],
    },
    summary: { gscRows: 1, uniqueQueries: 1, inventoryPages: 1 },
    opportunities: [{
      action: 'refresh',
      query: QUERY,
      score: 95,
      reason: 'non-mutating smoke fixture for grounding, editorial passes, repair, sanitizer, and renderer',
      currentPages: [TARGET],
      targetPage: TARGET,
      metrics: { clicks: 1, impressions: 40, ctr: 0.025, position: 9.4 },
      diagnostics: { expectedCtrHeuristic: 0.05, pageQuerySimilarity: 0.9 },
      decision: {
        expectedValue: 95,
        confidence: 'high',
        evidenceScore: 100,
        businessFit: 100,
        intentValue: 90,
        linkPotential: 60,
        implementationEase: 90,
        risk: 5,
      },
      cluster: { id: 'grounding-smoke', queryHash: queryHash(QUERY), siblings: [], size: 1 },
      brief: {
        intent: 'transactional',
        relatedQueries: ['AI fitness coach phone calls', 'workout accountability calls'],
        internalLinks: [
          { title: 'IZEM AI Fitness Coach', url: 'https://youraicoach.life/izem-ai-fitness-coach/' },
          { title: 'Workout consistency calculator', url: 'https://youraicoach.life/workout-consistency-calculator/' },
        ],
        contentAngle: 'A practical decision framework for judging proactive call-based fitness coaching without unsupported product or medical claims.',
        mustDo: ['Answer the intent directly', 'Add a concrete decision framework', 'Preserve the existing page'],
        qualityGates: ['No unsupported claims', 'No fake experience', 'No external links'],
      },
    }],
  };
  fs.writeFileSync(OUTPUT, `${JSON.stringify(plan, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  console.log(`Public grounding smoke plan created: query-hash=${queryHash(QUERY)}.`);
}

try {
  main();
} catch (error) {
  console.error(`Grounding smoke-plan creation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
