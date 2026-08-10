import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGrowthPlan, normalizeGscRows, similarity } from './seo-growth-engine.mjs';

const config = {
  siteUrl: 'https://youraicoach.life',
  brand: 'IZEM',
  coreTopics: ['AI fitness coaching', 'workout accountability', 'adaptive workout plans', 'meal planning'],
  topicTerms: ['fitness workout gym accountability coach coaching trainer training calls voice plan plans meal nutrition consistency reminder recovery equipment'],
  blockedTopicTerms: ['casino crypto gambling loan'],
  highValuePatterns: ['accountability', 'fitness.*call', 'workout.*consisten', 'ai.*trainer'],
  thresholds: {
    minImpressions: 8,
    minCreateImpressions: 12,
    refreshMinPosition: 4,
    refreshMaxPosition: 20,
    createMaxPosition: 45,
    minTopicFit: 0.16,
    cannibalizationMinPageImpressions: 3,
    cannibalizationMinTotalImpressions: 10
  }
};

const inventory = [
  {
    file: 'public/blog/best-accountability-app-for-gym.html',
    url: 'https://youraicoach.life/blog/best-accountability-app-for-gym',
    title: 'Best Accountability App for the Gym',
    h1: 'Best gym accountability app',
    description: 'Workout accountability mechanisms for gym consistency',
    topicalText: 'Best Accountability App for the Gym workout accountability gym consistency',
    wordCount: 2200,
    internalLinks: 12
  },
  {
    file: 'public/index.html',
    url: 'https://youraicoach.life/',
    title: 'IZEM AI Fitness Coach',
    h1: 'AI fitness coach',
    description: 'Workout plans, meal plans and accountability calls',
    topicalText: 'IZEM AI Fitness Coach workout plans meal plans accountability calls',
    wordCount: 1200,
    internalLinks: 30
  }
];

test('similarity groups close keyword variants', () => {
  assert.ok(similarity('workout accountability app', 'best gym workout accountability app') >= 0.4);
});

test('normalizes query+page Search Console rows', () => {
  const rows = normalizeGscRows({
    dimensions: ['query', 'page'],
    rows: [{ keys: ['Workout Accountability App', 'https://youraicoach.life/blog/best-accountability-app-for-gym/'], clicks: 4, impressions: 80, ctr: 0.05, position: 8 }]
  });
  assert.equal(rows[0].query, 'workout accountability app');
  assert.equal(rows[0].page, 'https://youraicoach.life/blog/best-accountability-app-for-gym');
});

test('prioritizes refresh for a relevant page already near page one', () => {
  const plan = buildGrowthPlan({
    rows: [{ query: 'workout accountability app', page: inventory[0].url, clicks: 3, impressions: 120, ctr: 0.025, position: 8 }],
    inventory,
    config
  });
  assert.equal(plan.opportunities[0].action, 'refresh');
  assert.equal(plan.opportunities[0].targetPage, inventory[0].url);
});

test('detects cannibalization and chooses merge instead of another page', () => {
  const rows = [
    { query: 'fitness accountability coach', page: inventory[0].url, clicks: 2, impressions: 40, ctr: 0.05, position: 9 },
    { query: 'fitness accountability coach', page: inventory[1].url, clicks: 1, impressions: 25, ctr: 0.04, position: 13 }
  ];
  const plan = buildGrowthPlan({ rows, inventory, config });
  assert.equal(plan.opportunities[0].action, 'merge');
  assert.equal(plan.opportunities[0].currentPages.length, 2);
});

test('creates a dedicated page only when the ranking page is a weak match', () => {
  const weakInventory = [{
    file: 'public/generic.html',
    url: 'https://youraicoach.life/generic',
    title: 'IZEM Product Overview',
    h1: 'Meet IZEM',
    description: 'General product overview',
    topicalText: 'IZEM product overview general features',
    wordCount: 900,
    internalLinks: 10
  }];
  const plan = buildGrowthPlan({
    rows: [{ query: 'fitness app that calls before workout', page: weakInventory[0].url, clicks: 0, impressions: 35, ctr: 0, position: 27 }],
    inventory: weakInventory,
    config
  });
  assert.equal(plan.opportunities[0].action, 'create');
});
