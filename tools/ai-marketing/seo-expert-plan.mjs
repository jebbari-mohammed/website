#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { similarity } from './seo-growth-engine.mjs';
import { queryHash } from './seo-publisher-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const DEFAULT_INPUT = path.join(ROOT, 'data/marketing-employee/seo-growth/latest.json');
const DEFAULT_OUTPUT = path.join(ROOT, 'data/marketing-employee/seo-growth/expert-latest.json');
const DEFAULT_CONFIG = path.join(ROOT, 'config/seo-growth.config.json');

function parseArgs(argv) {
  const args = { input: DEFAULT_INPUT, output: DEFAULT_OUTPUT, config: DEFAULT_CONFIG, minSimilarity: 0.42 };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === '--input') args.input = path.resolve(argv[++index]);
    else if (item.startsWith('--input=')) args.input = path.resolve(item.slice(8));
    else if (item === '--output') args.output = path.resolve(argv[++index]);
    else if (item.startsWith('--output=')) args.output = path.resolve(item.slice(9));
    else if (item === '--config') args.config = path.resolve(argv[++index]);
    else if (item.startsWith('--config=')) args.config = path.resolve(item.slice(9));
    else if (item === '--min-similarity') args.minSimilarity = Number(argv[++index]);
    else if (item.startsWith('--min-similarity=')) args.minSimilarity = Number(item.slice(17));
  }
  if (!Number.isFinite(args.minSimilarity) || args.minSimilarity <= 0 || args.minSimilarity > 1) throw new Error('Invalid --min-similarity');
  return args;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function intentValue(intent) {
  if (intent === 'transactional') return 100;
  if (intent === 'commercial') return 92;
  if (intent === 'informational') return 68;
  return 45;
}

function confidence(metrics = {}) {
  const impressions = Number(metrics.impressions || 0);
  const clicks = Number(metrics.clicks || 0);
  if (clicks >= 5 || impressions >= 100) return { label: 'high', score: 100 };
  if (clicks >= 2 || impressions >= 35) return { label: 'medium-high', score: 82 };
  if (impressions >= 15) return { label: 'medium', score: 65 };
  return { label: 'low', score: 38 };
}

function businessFit(query, config, intent) {
  const patternHit = (config.highValuePatterns || []).some((pattern) => new RegExp(pattern, 'i').test(query));
  const coreTokens = new Set((config.coreTopics || []).join(' ').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const queryTokens = String(query).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const overlap = queryTokens.length ? queryTokens.filter((token) => coreTokens.has(token)).length / queryTokens.length : 0;
  return clamp((patternHit ? 70 : 35) + overlap * 25 + intentValue(intent) * 0.05);
}

function riskScore(item) {
  let risk = item.action === 'create' ? 54 : item.action === 'refresh' ? 24 : item.action === 'merge' ? 72 : 15;
  if ((item.currentPages || []).length > 1) risk += 12;
  if ((item.diagnostics?.pageQuerySimilarity || 0) < 0.08 && item.action === 'create') risk -= 8;
  if ((item.metrics?.impressions || 0) < 15) risk += 10;
  return clamp(risk);
}

export function scoreOpportunity(item, config = {}) {
  const intent = item.brief?.intent || 'informational';
  const evidence = confidence(item.metrics);
  const business = businessFit(item.query, config, intent);
  const linkPotential = item.action === 'create'
    ? (/calculator|template|checklist|score|cost|comparison|vs|guide/i.test(item.query) ? 80 : 54)
    : 48;
  const implementation = item.action === 'refresh' ? 88 : item.action === 'create' ? 64 : item.action === 'merge' ? 38 : 92;
  const risk = riskScore(item);
  const expectedValue = Math.round(clamp(
    Number(item.score || 0) * 0.34 +
    evidence.score * 0.18 +
    business * 0.20 +
    intentValue(intent) * 0.10 +
    linkPotential * 0.08 +
    implementation * 0.10 -
    risk * 0.12,
  ));
  return {
    expectedValue,
    confidence: evidence.label,
    evidenceScore: evidence.score,
    businessFit: Math.round(business),
    intentValue: intentValue(intent),
    linkPotential,
    implementationEase: implementation,
    risk,
  };
}

function expertTokens(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/working\s+out/g, 'workout')
    .replace(/workouts/g, 'workout')
    .replace(/applications?/g, 'app')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 2 && !['the', 'for', 'with', 'and', 'app', 'apps', 'people', 'busy'].includes(token));
}

export function expertSimilarity(left = '', right = '') {
  const base = similarity(left, right);
  const a = new Set(expertTokens(left));
  const b = new Set(expertTokens(right));
  if (!a.size || !b.size) return base;
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size || 1;
  return Math.max(base, intersection / union);
}

export function clusterOpportunities(opportunities, minSimilarity = 0.42) {
  const clusters = [];
  for (const item of opportunities) {
    let best = null;
    let bestScore = 0;
    for (const cluster of clusters) {
      const score = Math.max(...cluster.items.map((member) => expertSimilarity(item.query, member.query)));
      if (score >= minSimilarity && score > bestScore) {
        best = cluster;
        bestScore = score;
      }
    }
    if (best) {
      best.items.push(item);
    } else {
      clusters.push({ id: `cluster-${clusters.length + 1}`, items: [item] });
    }
  }
  return clusters;
}

function pickClusterWinner(cluster) {
  const priorities = { merge: 4, refresh: 3, create: 2, monitor: 1 };
  return [...cluster.items].sort((a, b) => {
    const actionDifference = (priorities[b.action] || 0) - (priorities[a.action] || 0);
    if (actionDifference) return actionDifference;
    return (b.decision?.expectedValue || 0) - (a.decision?.expectedValue || 0);
  })[0];
}

export function buildExpertPlan(basePlan, config = {}, minSimilarity = 0.42) {
  if (!basePlan || basePlan.status === 'needs-gsc-data') {
    return {
      ...basePlan,
      expertVersion: 2,
      status: 'needs-gsc-data',
      opportunities: [],
      decisionSummary: { actionable: 0, suppressedDuplicates: 0, lowConfidence: 0 },
    };
  }

  const scored = (basePlan.opportunities || []).map((item) => ({ ...item, decision: scoreOpportunity(item, config) }));
  const clusters = clusterOpportunities(scored, minSimilarity);
  const final = [];
  let suppressedDuplicates = 0;

  for (const cluster of clusters) {
    const winner = pickClusterWinner(cluster);
    const siblingQueries = cluster.items.filter((item) => item !== winner).map((item) => item.query);
    const winnerWithCluster = {
      ...winner,
      cluster: {
        id: cluster.id,
        queryHash: queryHash(winner.query),
        siblings: siblingQueries,
        size: cluster.items.length,
      },
    };

    const minValue = winner.action === 'create' ? 62 : winner.action === 'refresh' ? 52 : winner.action === 'merge' ? 48 : 999;
    const isActionable = winner.decision.expectedValue >= minValue && winner.decision.confidence !== 'low';
    final.push(isActionable ? winnerWithCluster : {
      ...winnerWithCluster,
      action: 'monitor',
      reason: `${winner.reason || ''}; expert gate withheld publication because expected value/confidence did not clear the threshold`,
    });

    for (const sibling of cluster.items.filter((item) => item !== winner)) {
      suppressedDuplicates += 1;
      final.push({
        ...sibling,
        action: 'monitor',
        score: Math.min(sibling.score || 0, winner.score || 0),
        reason: `${sibling.reason || ''}; grouped with query hash ${queryHash(winner.query)} to avoid overlapping intent`,
        suppressedBy: queryHash(winner.query),
        cluster: { id: cluster.id, queryHash: queryHash(sibling.query), siblings: [], size: cluster.items.length },
      });
    }
  }

  final.sort((a, b) => {
    const actionable = (item) => ['refresh', 'create', 'merge'].includes(item.action) ? 1 : 0;
    const actionDiff = actionable(b) - actionable(a);
    if (actionDiff) return actionDiff;
    return (b.decision?.expectedValue || 0) - (a.decision?.expectedValue || 0);
  });

  return {
    ...basePlan,
    id: `${new Date().toISOString().replace(/[:.]/g, '-')}-expert-seo-plan`,
    expertVersion: 2,
    createdAt: new Date().toISOString(),
    opportunities: final,
    decisionSummary: {
      actionable: final.filter((item) => ['refresh', 'create', 'merge'].includes(item.action)).length,
      refresh: final.filter((item) => item.action === 'refresh').length,
      create: final.filter((item) => item.action === 'create').length,
      merge: final.filter((item) => item.action === 'merge').length,
      suppressedDuplicates,
      lowConfidence: final.filter((item) => item.decision?.confidence === 'low').length,
    },
    expertPrinciples: [
      'Choose the highest expected-value action, not the easiest content output.',
      'Do not publish a sibling query when one URL can satisfy the shared intent.',
      'Require at least medium first-party evidence before automatic publication.',
      'Prefer refreshes over new URLs when an existing page is already gaining visibility.',
      'Treat merge recommendations as advisory until backlinks and unique content are reviewed.',
    ],
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [basePlan, config] = await Promise.all([
    fs.readFile(args.input, 'utf8').then(JSON.parse),
    fs.readFile(args.config, 'utf8').then(JSON.parse),
  ]);
  const expert = buildExpertPlan(basePlan, config, args.minSimilarity);
  await fs.mkdir(path.dirname(args.output), { recursive: true });
  await fs.writeFile(args.output, `${JSON.stringify(expert, null, 2)}\n`, 'utf8');
  const top = expert.opportunities.find((item) => ['refresh', 'create', 'merge'].includes(item.action));
  console.log(`Expert plan ready: ${expert.decisionSummary.actionable} actionable, ${expert.decisionSummary.suppressedDuplicates} overlapping variants suppressed.`);
  if (top) console.log(`Top action: ${top.action.toUpperCase()} query-hash=${queryHash(top.query)} value=${top.decision.expectedValue}/100 confidence=${top.decision.confidence}`);
  else console.log('No automatic SEO publication cleared the evidence and value gates.');
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((error) => {
    console.error(`Expert SEO planning failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
