import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExpertPlan, clusterOpportunities, scoreOpportunity } from './seo-expert-plan.mjs';

const config = {
  coreTopics: ['AI fitness coaching', 'workout accountability', 'adaptive workout planning'],
  highValuePatterns: ['accountability', 'fitness.*call', 'ai.*trainer'],
};

function item(overrides = {}) {
  return {
    action: 'create',
    query: 'workout accountability app for busy people',
    score: 80,
    reason: 'missing intent',
    currentPages: [],
    targetPage: '',
    metrics: { clicks: 2, impressions: 60, ctr: 0.03, position: 24 },
    diagnostics: { pageQuerySimilarity: 0.05 },
    brief: { intent: 'commercial', relatedQueries: [], internalLinks: [] },
    ...overrides,
  };
}

test('scoring rewards evidence and business intent while accounting for risk', () => {
  const strong = scoreOpportunity(item(), config);
  const weak = scoreOpportunity(item({ metrics: { clicks: 0, impressions: 8, ctr: 0, position: 44 }, score: 45 }), config);
  assert.ok(strong.expectedValue > weak.expectedValue);
  assert.notEqual(strong.confidence, 'low');
});

test('clusters close variants but not distinct intents', () => {
  const clusters = clusterOpportunities([
    item(),
    item({ query: 'accountability apps for working out' }),
    item({ query: 'high protein breakfast ideas', brief: { intent: 'informational' } }),
  ], 0.2);
  assert.equal(clusters.length, 2);
});

test('refresh wins over overlapping create and duplicate create is suppressed', () => {
  const base = {
    id: 'base',
    opportunities: [
      item({ action: 'create', query: 'workout accountability app for busy people' }),
      item({ action: 'refresh', query: 'accountability app for working out', targetPage: 'https://youraicoach.life/blog/accountability-apps-for-working-out', metrics: { clicks: 4, impressions: 90, ctr: 0.04, position: 8 }, score: 88 }),
    ],
  };
  const plan = buildExpertPlan(base, config, 0.2);
  assert.equal(plan.opportunities.filter((entry) => entry.action === 'refresh').length, 1);
  assert.equal(plan.opportunities.filter((entry) => entry.action === 'create').length, 0);
  assert.equal(plan.decisionSummary.suppressedDuplicates, 1);
});

test('low-confidence automatic creation is withheld', () => {
  const base = { id: 'base', opportunities: [item({ score: 50, metrics: { clicks: 0, impressions: 8, ctr: 0, position: 40 } })] };
  const plan = buildExpertPlan(base, config);
  assert.equal(plan.opportunities[0].action, 'monitor');
});
