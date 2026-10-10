import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSafeSnapshot, crawlFreshness, extractSourceModifiedDate } from './gsc-safe-snapshot.mjs';
import { indexStatusBucket } from './gsc-index-inspection.mjs';

test('excluded inspection verdicts count as not indexed while unspecified results stay unknown', () => {
  for (const coverageState of ['Crawled - currently not indexed', 'Discovered - currently not indexed', "Excluded by 'noindex' tag"]) {
    assert.equal(indexStatusBucket({ verdict: 'NEUTRAL', coverageState }), 'notIndexed');
  }
  assert.equal(indexStatusBucket({ verdict: 'PASS' }), 'indexed');
  assert.equal(indexStatusBucket({ verdict: 'FAIL' }), 'notIndexed');
  for (const verdict of ['VERDICT_UNSPECIFIED', 'PARTIAL', 'UNKNOWN', 'UNRECOGNIZED', undefined]) {
    assert.equal(indexStatusBucket({ verdict }), 'unknown');
  }
  assert.equal(indexStatusBucket(), 'unknown');
});

test('snapshot summaries retain excluded verdicts and reserve unknown for missing index status', () => {
  const results = [
    { url: 'https://youraicoach.life/blog/synthetic-indexed', verdict: 'PASS' },
    { url: 'https://youraicoach.life/blog/synthetic-excluded', verdict: 'NEUTRAL', coverageState: 'Crawled - currently not indexed' },
    { url: 'https://youraicoach.life/blog/synthetic-unknown', verdict: 'VERDICT_UNSPECIFIED' },
  ];
  const counts = results.reduce((sum, result) => { sum[indexStatusBucket(result)] += 1; return sum; }, { indexed: 0, notIndexed: 0, unknown: 0 });
  const rendered = buildSafeSnapshot(searchReport, { requested: 3, inspected: 3, results, counts, apiErrors: [] });
  assert.match(rendered, /- Indexed: 1\n- Not indexed: 1\n- Unknown: 1/);
  assert.match(rendered, /synthetic-excluded \| NEUTRAL \| Crawled - currently not indexed/);
});

test('public snapshot omits landing URL parameters, fragments, credentials and foreign hosts', () => {
  const privateUrl = 'https://youraicoach.life/blog/safe?token=SYNTHETIC_PRIVATE#SYNTHETIC_FRAGMENT';
  const foreign = 'https://foreign.example/SYNTHETIC_FOREIGN';
  const snapshot = buildSafeSnapshot({ ...searchReport, rows: [
    { keys: ['SYNTHETIC_QUERY', privateUrl], impressions: 1 },
    { keys: ['SYNTHETIC_QUERY', foreign], impressions: 1 },
  ] }, { ...indexReport, results: [{ url: privateUrl }, { url: foreign }] });
  assert.match(snapshot, /\/blog\/safe/);
  for (const secret of ['SYNTHETIC_PRIVATE', 'SYNTHETIC_FRAGMENT', 'SYNTHETIC_FOREIGN', 'SYNTHETIC_QUERY', 'foreign.example']) assert.ok(!snapshot.includes(secret));
});

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

test('renders landing-page aggregates and crawl freshness while keeping exact Search Console queries private', () => {
  const rendered = buildSafeSnapshot(searchReport, indexReport, {
    runUrl: 'https://github.com/jebbari-mohammed/website/actions/runs/123',
    generatedAt: '2026-08-19T08:10:00.000Z',
    sourceModifiedByPath: {
      '/blog/weekly-fitness-check-in-template': '2026-08-20T00:00:00.000Z',
      '/blog/workout-accountability-checklist': '2026-08-17T00:00:00.000Z',
    },
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
  assert.match(rendered, /Awaiting recrawl after a source update: 1/);
  assert.match(rendered, /Discovery pending with no crawl recorded: 1/);
  assert.match(rendered, /weekly-fitness-check-in-template.*2026-08-20T00:00:00\.000Z.*2026-08-18T10:00:00Z.*Awaiting recrawl/);
  assert.match(rendered, /workout-accountability-checklist.*2026-08-17T00:00:00\.000Z.*none.*Discovery pending/);
  assert.match(rendered, /not by itself an indexing failure/);
  assert.doesNotMatch(rendered, /SECRET QUERY MUST NEVER LEAK/);
  assert.doesNotMatch(rendered, /ANOTHER PRIVATE QUERY/);
  assert.doesNotMatch(rendered, /THIRD PRIVATE QUERY/);
});

test('extracts the newest source-backed modification date from HTML metadata', () => {
  const html = `
    <meta property="article:modified_time" content="2026-08-18T12:00:00Z">
    <script type="application/ld+json">{"@type":"Article","dateModified":"2026-08-20"}</script>
  `;
  assert.equal(extractSourceModifiedDate(html), '2026-08-20T00:00:00.000Z');
  assert.equal(extractSourceModifiedDate('<html><head></head></html>'), null);
});

test('classifies crawl freshness without treating stale Google state as a current-page failure', () => {
  assert.equal(crawlFreshness({ lastCrawlTime: '2026-08-10T00:00:00Z' }, '2026-08-12'), 'Awaiting recrawl');
  assert.equal(crawlFreshness({ lastCrawlTime: '2026-08-13T00:00:00Z' }, '2026-08-12'), 'Crawl current');
  assert.equal(crawlFreshness({ lastCrawlTime: null }, '2026-08-12'), 'Discovery pending');
  assert.equal(crawlFreshness({ lastCrawlTime: '2026-08-13T00:00:00Z' }, null), 'Source date unavailable');
});

test('fails closed if private Search Analytics dimensions are incomplete', () => {
  assert.throws(() => buildSafeSnapshot({ ...searchReport, dimensions: ['page'] }, indexReport), /query and page/);
});
