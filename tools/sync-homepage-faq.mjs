import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const homepagePath = path.join(projectRoot, 'index.html');
const faq = JSON.parse(fs.readFileSync(path.join(projectRoot, 'src/content/homepage-faq.json'), 'utf8'));
const origin = 'https://youraicoach.life';

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character]));
}

export function faqSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${origin}/#faq`,
    url: `${origin}/#faq`,
    name: faq.heading,
    inLanguage: 'en',
    isPartOf: { '@id': `${origin}/#webpage` },
    about: { '@id': `${origin}/#app` },
    mainEntity: faq.items.map(item => ({
      '@type': 'Question',
      '@id': `${origin}/#faq-${item.id}`,
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function synchronizeHomepageFaq(html) {
  const schema = /<script id="izem-faq-schema" type="application\/ld\+json">[\s\S]*?<\/script>/g;
  const shell = /<!-- IZEM_FAQ_START -->[\s\S]*?<!-- IZEM_FAQ_END -->/g;
  if ([...html.matchAll(schema)].length !== 1 || [...html.matchAll(shell)].length !== 1) {
    throw new Error('Expected exactly one FAQ schema block and one static-shell FAQ marker pair.');
  }

  // JSON in HTML must not be able to close its script element.
  const json = JSON.stringify(faqSchema(), null, 2).replace(/</g, '\\u003c');
  const items = faq.items.map(item => `          <article data-izem-faq-item="${escapeHtml(item.id)}">
            <h3 id="faq-${escapeHtml(item.id)}">${escapeHtml(item.question)}</h3>
            <p data-izem-faq-answer>${escapeHtml(item.answer)}</p>
            <a href="${escapeHtml(item.href)}">${escapeHtml(item.linkLabel)}</a>
          </article>`).join('\n');
  const markup = `<!-- IZEM_FAQ_START -->
        <section id="faq" aria-labelledby="faq-heading">
          <h2 id="faq-heading">${escapeHtml(faq.heading)}</h2>
${items}
        </section>
        <!-- IZEM_FAQ_END -->`;
  return html.replace(schema, () => `<script id="izem-faq-schema" type="application/ld+json">\n${json}\n    </script>`)
    .replace(shell, () => markup);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const original = fs.readFileSync(homepagePath, 'utf8');
  const updated = synchronizeHomepageFaq(original);
  if (process.argv.includes('--check') && updated !== original) {
    console.error('Homepage FAQ is out of sync. Run node tools/sync-homepage-faq.mjs.');
    process.exitCode = 1;
  } else {
    if (updated !== original) fs.writeFileSync(homepagePath, updated);
    console.log('Homepage FAQ: shared copy, static HTML and JSON-LD are synchronized.');
  }
}
