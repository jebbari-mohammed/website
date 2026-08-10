import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  countMetaTags,
  hasMarker,
  injectMarkedSection,
  normalizeSiteUrl,
  queryHash,
  resolvePublicFile,
  sanitizeGeneratedHtml,
  setSocialImage,
  syncArticleMetadata,
  validateGeneratedContent,
} from './seo-publisher-core.mjs';

test('query hash is stable and does not reveal the query', () => {
  assert.equal(queryHash('Fitness App That Calls You'), queryHash('fitness app that calls you'));
  assert.equal(queryHash('fitness app that calls you').length, 12);
});

test('normalizes www and maps extensionless and .html URLs', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-core-'));
  fs.mkdirSync(path.join(dir, 'blog'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'blog', 'guide.html'), '<html></html>');
  fs.writeFileSync(path.join(dir, 'about.html'), '<html></html>');
  assert.equal(normalizeSiteUrl('https://www.youraicoach.life/blog/guide/'), 'https://youraicoach.life/blog/guide');
  assert.equal(resolvePublicFile('https://youraicoach.life/blog/guide', dir), path.join(dir, 'blog', 'guide.html'));
  assert.equal(resolvePublicFile('https://youraicoach.life/about.html', dir), path.join(dir, 'about.html'));
  assert.equal(resolvePublicFile('https://evil.example/about', dir), '');
});

test('sanitizer removes executable and external-link markup while preserving useful tags', () => {
  const input = '<script>alert(1)</script><h2 style="x">Guide</h2><p onclick="x">Read <a href="https://evil.example">this</a>.</p><iframe src=x></iframe>';
  const output = sanitizeGeneratedHtml(input);
  assert.equal(output, '<h2>Guide</h2><p>Read this.</p>');
});

test('metadata synchronization updates all visible snippet mirrors', () => {
  const html = `<!doctype html><html><head><title>Old</title><meta name="description" content="Old desc"><meta property="og:title" content="Old"><meta property="og:description" content="Old desc"><meta name="twitter:title" content="Old"><meta name="twitter:description" content="Old desc"><script type="application/ld+json">{"@type":"Article","headline":"Old","description":"Old desc","datePublished":"2026-01-01","dateModified":"2026-01-01"}</script></head><body></body></html>`;
  const output = syncArticleMetadata(html, { title: 'A Better SEO Title for the Existing Page', description: 'A much better description that remains accurate and long enough for the test to represent a real search snippet safely.', dateModified: '2026-08-10' });
  assert.match(output, /<title>A Better SEO Title/);
  assert.match(output, /property="og:title" content="A Better SEO Title/);
  assert.match(output, /name="twitter:description" content="A much better description/);
  assert.match(output, /"headline":"A Better SEO Title/);
  assert.match(output, /"dateModified":"2026-08-10"/);
});

test('social image setter leaves exactly one tag of each type', () => {
  const html = '<html><head><meta property="og:image" content="old"><meta property="og:image" content="old2"><meta name="twitter:image" content="old"></head><body></body></html>';
  const output = setSocialImage(html, 'https://youraicoach.life/og/new.png');
  assert.equal(countMetaTags(output, 'property', 'og:image'), 1);
  assert.equal(countMetaTags(output, 'name', 'twitter:image'), 1);
  assert.match(output, /new\.png/);
});

test('refresh marker is idempotent', () => {
  const marker = 'abc123';
  const once = injectMarkedSection('<html><body><main><p>Old</p></main></body></html>', marker, '<section><h2>New</h2></section>');
  const twice = injectMarkedSection(once, marker, '<section><h2>Newer</h2></section>');
  assert.equal((twice.match(/SEO_GROWTH_REFRESH_START/g) || []).length, 1);
  assert.equal(hasMarker(twice, marker), true);
  assert.match(twice, /Newer/);
  assert.doesNotMatch(twice, />New</);
});

test('quality gate accepts a structured, non-repetitive refresh', () => {
  const paragraphs = Array.from({ length: 24 }, (_, index) => `<p>Step ${index + 1} explains a different practical decision that helps the reader adapt a realistic training plan around their schedule and available equipment.</p>`).join('');
  const result = validateGeneratedContent({
    action: 'refresh',
    query: 'workout accountability app',
    directAnswer: 'Choose the accountability mechanism that reaches the moment when you normally skip, then define one fallback action before the week begins.',
    bodyHtml: `<h2>A practical decision framework</h2>${paragraphs}`,
    title: 'Workout Accountability App: A Practical Decision Guide',
    metaDescription: 'Choose a workout accountability app by matching calls, fallbacks, reviews, and plan adaptation to the exact point where your routine usually breaks.',
  });
  assert.ok(result.words >= 280);
});
