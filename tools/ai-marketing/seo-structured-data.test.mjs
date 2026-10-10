import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { invalidGraphValues } from '../jsonld-graph.mjs';

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

test('accepts object and flat graph forms, root arrays and ordinary property arrays', () => {
  for (const value of [
    { '@graph': { '@type': 'Article' } },
    { '@context': 'https://schema.org', '@graph': [{ '@type': ['Article', 'WebPage'], keywords: ['training', 'rest'] }, { '@type': 'Organization' }] },
    [{ '@type': 'Article' }, { '@graph': [] }],
  ]) assert.deepEqual(invalidGraphValues(value), []);
});

test('rejects the legacy nested article graph without rejecting ordinary arrays', () => {
  const value = { '@graph': [[{ '@type': 'BlogPosting' }, { '@type': 'FAQPage' }]] };
  assert.equal(invalidGraphValues(value).length, 1);
  assert.match(invalidGraphValues(value)[0], /\$\.@graph.*nested arrays/);
  assert.deepEqual(invalidGraphValues({ '@type': 'Article', author: [{ '@type': 'Person' }] }), []);
});

test('rejects null and scalar graph values, including a malformed nested graph', () => {
  for (const member of [null, 'Article', 7, true]) {
    assert.equal(invalidGraphValues({ '@graph': member }).length, 1);
    assert.equal(invalidGraphValues({ '@graph': [{ '@type': 'Article' }, member] }).length, 1);
  }
  assert.match(invalidGraphValues({ '@graph': [{ '@id': '#named', '@graph': [['invalid']] }] })[0], /\$\.@graph\[0\]\.@graph/);
});

test('does not interpret arbitrary JSON inside an @json literal', () => {
  assert.deepEqual(invalidGraphValues({ '@graph': [{ '@type': '@json', '@value': { '@graph': [['ordinary JSON']] } }] }), []);
});

test('the public validator fails malformed graphs and passes the corrected document', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'izem-jsonld-'));
  try {
    const file = path.join(directory, 'article.html');
    const html = graph => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`;
    writeFileSync(file, html([[{ '@type': 'BlogPosting', headline: 'Example' }]]));
    const bad = spawnSync(process.execPath, ['tools/validate-jsonld.mjs', directory], { encoding: 'utf8' });
    assert.equal(bad.status, 1);
    assert.match(bad.stderr, /article\.html:1:.*nested arrays/);
    writeFileSync(file, html([{ '@type': 'BlogPosting', headline: 'Example' }]));
    assert.match(execFileSync(process.execPath, ['tools/validate-jsonld.mjs', directory], { encoding: 'utf8' }), /validation passed/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
