import test from 'node:test';
import assert from 'node:assert/strict';
import { buildArchiveSection, buildRSSFeed, extractPublishedDate } from './rebuild-blog-index.mjs';

test('extracts a source-backed JSON-LD publication date without changing it', () => {
  assert.equal(extractPublishedDate(`
    <script type="application/ld+json">
      {"@type":"Article","datePublished":"2026-07-25T08:33:53-07:00"}
    </script>
  `), '2026-07-25');
});

test('falls back to article:published_time when JSON-LD datePublished is absent', () => {
  assert.equal(extractPublishedDate(`
    <meta content="2026-08-17T14:27:49+01:00" property="article:published_time">
  `), '2026-08-17');
});

test('does not invent a publication date for an undated article', () => {
  assert.equal(extractPublishedDate('<html><head><title>Undated guide</title></head></html>'), null);
});

test('archive and RSS omit per-post dates when the source has no publication date', () => {
  const posts = [{
    slug: 'undated-guide',
    title: 'Undated guide',
    description: 'A guide without source-backed publication metadata.',
    date: null,
    noindex: false,
  }];

  const archive = buildArchiveSection(posts);
  assert.match(archive, /<a href="\/blog\/undated-guide">Undated guide<\/a>/);
  assert.doesNotMatch(archive, /<span>\d{4}-\d{2}-\d{2}<\/span>/);

  const feed = buildRSSFeed(posts, new Date('2026-08-18T08:00:00Z'));
  assert.match(feed, /<lastBuildDate>Tue, 18 Aug 2026 08:00:00 GMT<\/lastBuildDate>/);
  assert.doesNotMatch(feed, /<pubDate>/);
});

test('dated posts keep their real publication date in the archive and RSS', () => {
  const posts = [{
    slug: 'dated-guide',
    title: 'Dated guide',
    description: 'A dated guide.',
    date: '2026-08-12',
    noindex: false,
  }];

  assert.match(buildArchiveSection(posts), /<span>2026-08-12<\/span>/);
  assert.match(buildRSSFeed(posts, new Date('2026-08-18T08:00:00Z')), /<pubDate>Wed, 12 Aug 2026 00:00:00 GMT<\/pubDate>/);
});
