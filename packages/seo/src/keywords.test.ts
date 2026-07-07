import test from 'node:test';
import assert from 'node:assert/strict';
import { clusterKeywords, createKeywordRoadmap, generateKeywordIdeas } from './keywords.js';

test('keyword ideas label difficulty as heuristic', () => {
  const ideas = generateKeywordIdeas('ai fitness coach');
  assert.ok(ideas.length > 5);
  assert.equal(ideas[0].difficulty.basis, 'heuristic');
});

test('clusters keywords and assigns cluster ids', () => {
  const ideas = generateKeywordIdeas('ai fitness coach');
  const clusters = clusterKeywords(ideas);
  assert.ok(clusters.length > 0);
  assert.ok(clusters.every((cluster) => cluster.keywords.every((keyword) => keyword.clusterId === cluster.id)));
});

test('roadmap creates up to 30 calendar items', () => {
  const roadmap = createKeywordRoadmap('workout accountability');
  assert.ok(roadmap.calendar.length > 0);
  assert.ok(roadmap.calendar.length <= 30);
});
