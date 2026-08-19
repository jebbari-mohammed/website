import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSafeSnapshot } from './gsc-safe-snapshot.mjs';

const searchReport = {
  site: 'https://youraicoach.life/',
  startDate: '2026-07-21',
  endDate: '2026-08-18',
  dimensions: ['query', 'page'],
  rows: [
    {
      keys: ['SECRET QUERY MUST NEVER LEAK', 'https://youraicoach.life/blog/progressive-overload-guide'],
      clicks: 1,
      impressions: 4,
      ctr: 0.25,
      position: 12,
    },
    {
      keys: ['ANOTHER PRIVATE QUERY', 'https://youraicoach.life/blog/progressive-overload-guide'],
      clicks: 0,
      impressions: 6,
      ctr: 0,
      position: 28,
    },
    {
      keys: ['THIRD PRIVATE QUERY', 'https://youraicoach.life/blog/accountability-guide'],
      clicks: 0,
      impressions: 2,
      ctr: 0,
      position: 5,
    },
  ],
};

const indexReport = {
  requested: 2,
  inspected: 2,
  apiErrors: [],
  counts: { indexed: 1, notIndexed: 1, unknown: 0 },
  results: [
    {
      url: 'https://youraicoach.life/blog/weekly-fitness-check-in-template',
      verdict: 'PASS',
      coverageState: 'Submitted and indexed',
      lastCrawlTime: '2026-08-18T10:00:00Z',
    },
    {
      url: 'https://youraicoach.life/blog/workout-accountability-checklist',
      verdict: 'FAIL',
      coverageState: 'Discovered - currently not indexed',
      lastCrawlTime: null,
    },
  ],
};

test('renders landing-page aggregates while keeping exact Search Console queries private', () => {
  const rendered = buildSafeSnapshot(searchReport, indexReport, {
    runUrl: 'https://github.com/jebbari-mohammed/website/actions/runs/123',
    generatedAt: '2026-08-19T08:10:00.000Z',
  });

  assert.match(rendered, /Private query \+ landing-page rows: 3/);
  assert.match(rendered, /Distinct landing pages: 2/);
  assert.match(rendered, /Clicks: 1/);
  assert.match(rendered, /Impressions: 12/);
  assert.match(rendered, /Aggregate CTR: 8\.33%/);
  assert.match(rendered, /Impression-weighted average position: 18\.83/);
  assert.match(rendered, /Landing-page aggregate \(queries removed\)/);
  assert.match(rendered, /\| \/blog\/progressive-overload-guide \| 1 \| 10 \| 10\.00% \| 21\.60 \|/);
  assert.match(rendered, /\| \/blog\/accountability-guide \| 0 \| 2 \| 0\.00% \| 5\.00 \|/);
  assert.match(rendered, /weekly-fitness-check-in-template/);
  assert.match(rendered, /Submitted and indexed/);
  assert.doesNotMatch(rendered, /SECRET QUERY MUST NEVER LEAK/);
  assert.doesNotMatch(rendered, /ANOTHER PRIVATE QUERY/);
  assert.doesNotMatch(rendered, /THIRD PRIVATE QUERY/);
});

test('fails closed if private Search Analytics dimensions are incomplete', () => {
  assert.throws(() => buildSafeSnapshot({ ...searchReport, dimensions: ['page'] }, indexReport), /query and page/);
});
