import test from 'node:test';
import assert from 'node:assert/strict';
import { syncArticleMetadata } from './seo-publisher-core.mjs';

function schemasFrom(html) {
  return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => JSON.parse(match[1]));
}

test('metadata synchronization updates only page/article schema and preserves nested organizations and FAQ answers', () => {
  const source = `<!doctype html><html><head>
    <title>Old title</title>
    <meta name="description" content="Old description">
    <script type="application/ld+json">{
      "@context":"https://schema.org",
      "@graph":[
        {"@type":"Article","headline":"Old headline","description":"Old article description","datePublished":"2026-01-01","publisher":{"@type":"Organization","name":"IZEM","description":"Organization description must stay"}},
        {"@type":"FAQPage","description":"FAQ container stays","mainEntity":[{"@type":"Question","name":"Question?","acceptedAnswer":{"@type":"Answer","text":"Answer description stays"}}]},
        {"@type":"WebPage","name":"Old page name","description":"Old page description"}
      ]
    }</script>
  </head><body></body></html>`;

  const output = syncArticleMetadata(source, {
    title: 'A Better Page Title for Search Visitors',
    description: 'A clear and accurate page description that is deliberately long enough to represent a realistic search snippet without changing unrelated schema.',
    dateModified: '2026-08-10',
  });
  const graph = schemasFrom(output)[0]['@graph'];
  const article = graph.find((item) => item['@type'] === 'Article');
  const faq = graph.find((item) => item['@type'] === 'FAQPage');
  const page = graph.find((item) => item['@type'] === 'WebPage');

  assert.equal(article.headline, 'A Better Page Title for Search Visitors');
  assert.equal(article.dateModified, '2026-08-10');
  assert.equal(article.publisher.description, 'Organization description must stay');
  assert.equal(faq.description, 'FAQ container stays');
  assert.equal(faq.mainEntity[0].acceptedAnswer.text, 'Answer description stays');
  assert.equal(page.name, 'A Better Page Title for Search Visitors');
  assert.equal(page.dateModified, '2026-08-10');
});

test('malformed JSON-LD is left untouched instead of corrupting the page', () => {
  const malformed = '<html><head><title>Old</title><script type="application/ld+json">{bad json}</script></head><body></body></html>';
  const output = syncArticleMetadata(malformed, {
    title: 'A Valid Replacement Title for the Page',
    description: 'A valid description that updates normal metadata while leaving malformed structured data unchanged for a separate validator to catch.',
    dateModified: '2026-08-10',
  });
  assert.match(output, /\{bad json\}/);
  assert.match(output, /<title>A Valid Replacement Title/);
});
