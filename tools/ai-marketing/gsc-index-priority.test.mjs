import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildInspectionPriority, searchAnalyticsLandingPages } from './gsc-index-priority.mjs';

const SITE = 'https://youraicoach.life/';
const HERE = path.dirname(fileURLToPath(import.meta.url));

function report(rows) {
  return {
    dimensions: ['query', 'page'],
    rows,
  };
}

test('aggregates landing pages by impressions without exposing query strings', () => {
  const secretOne = 'SECRET_QUERY_ALPHA';
  const secretTwo = 'SECRET_QUERY_BETA';
  const result = searchAnalyticsLandingPages(report([
    { keys: [secretOne, 'https://youraicoach.life/blog/a'], impressions: 7 },
    { keys: [secretTwo, 'https://youraicoach.life/blog/a'], impressions: 5 },
    { keys: ['SECRET_QUERY_GAMMA', 'https://youraicoach.life/blog/b'], impressions: 4 },
    { keys: ['SECRET_QUERY_EXTERNAL', 'https://example.com/not-ours'], impressions: 100 },
  ]), SITE);

  assert.deepEqual(result, [
    { url: 'https://youraicoach.life/blog/a', impressions: 12 },
    { url: 'https://youraicoach.life/blog/b', impressions: 4 },
  ]);
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes(secretOne), false);
  assert.equal(serialized.includes(secretTwo), false);
});

test('preserves fixed priorities before adding GSC-visible landing pages', () => {
  const result = buildInspectionPriority({
    site: SITE,
    defaults: ['/', '/blog/fixed'],
    report: report([
      { keys: ['q1', 'https://youraicoach.life/blog/new-high'], impressions: 20 },
      { keys: ['q2', 'https://youraicoach.life/blog/fixed'], impressions: 30 },
      { keys: ['q3', 'https://youraicoach.life/blog/new-low'], impressions: 2 },
    ]),
    maxUrls: 25,
  });

  assert.deepEqual(result.urls, [
    'https://youraicoach.life/',
    'https://youraicoach.life/blog/fixed',
    'https://youraicoach.life/blog/new-high',
    'https://youraicoach.life/blog/new-low',
  ]);
  assert.equal(result.searchAnalyticsAdded, 2);
});

test('keeps the hard cap and never displaces fixed priorities with dynamic pages', () => {
  const result = buildInspectionPriority({
    site: SITE,
    defaults: ['/fixed-a', '/fixed-b'],
    report: report([
      { keys: ['q1', 'https://youraicoach.life/dynamic-a'], impressions: 100 },
      { keys: ['q2', 'https://youraicoach.life/dynamic-b'], impressions: 90 },
      { keys: ['q3', 'https://youraicoach.life/dynamic-c'], impressions: 80 },
    ]),
    maxUrls: 3,
  });

  assert.deepEqual(result.urls, [
    'https://youraicoach.life/fixed-a',
    'https://youraicoach.life/fixed-b',
    'https://youraicoach.life/dynamic-a',
  ]);
  assert.equal(result.searchAnalyticsAdded, 1);
});

test('fails closed when a fixed priority is outside the Search Console property', () => {
  assert.throws(() => buildInspectionPriority({
    site: SITE,
    defaults: ['/', 'https://example.com/wrong-property'],
    report: null,
    maxUrls: 25,
  }), /outside the Search Console property/);
});

test('fails closed when fixed priorities alone exceed the cap', () => {
  assert.throws(() => buildInspectionPriority({
    site: SITE,
    defaults: ['/one', '/two', '/three'],
    report: null,
    maxUrls: 2,
  }), /exceed the 2-URL cap/);
});

test('returns no dynamic candidates when the Search Analytics report lacks the page dimension', () => {
  const result = searchAnalyticsLandingPages({ dimensions: ['query'], rows: [{ keys: ['x'], impressions: 4 }] }, SITE);
  assert.deepEqual(result, []);
});

test('fixed URL Inspection config targets the canonical workout consistency URL', () => {
  const source = fs.readFileSync(path.join(HERE, 'gsc-index-inspection.mjs'), 'utf8');
  assert.match(source, /'https:\/\/youraicoach\.life\/workout-consistency-calculator\/'/);
  assert.doesNotMatch(source, /'https:\/\/youraicoach\.life\/workout-consistency-calculator'(?:,|\s)/);
});

test('URL Inspection uses conservative bounded concurrency with transient retries', () => {
  const source = fs.readFileSync(path.join(HERE, 'gsc-index-inspection.mjs'), 'utf8');
  assert.match(source, /const INSPECTION_CONCURRENCY = 3;/);
  assert.match(source, /const MAX_INSPECTION_ATTEMPTS = 3;/);
  assert.match(source, /status === 429 \|\| status >= 500/);
  assert.match(source, /Promise\.all\(Array\.from\(\{ length: concurrency \}, \(\) => worker\(\)\)\)/);
  assert.doesNotMatch(source, /results\.push\(await inspectUrl\(accessToken, url\)\)/);
});
