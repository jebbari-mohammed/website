import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { synchronizeHomepageFaq } from './sync-homepage-faq.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Run again with AGENT_METADATA_ROOT=dist to validate the final deployment artifacts.
const artifactRoot = process.env.AGENT_METADATA_ROOT
  ? path.resolve(projectRoot, process.env.AGENT_METADATA_ROOT)
  : null;
const publicRoot = artifactRoot || path.join(projectRoot, 'public');
const homepage = fs.readFileSync(path.join(artifactRoot || projectRoot, 'index.html'), 'utf8');
const $ = load(homepage);
const llms = fs.readFileSync(path.join(publicRoot, 'llms.txt'), 'utf8');
const origin = 'https://youraicoach.life';
const faq = JSON.parse(fs.readFileSync(path.join(projectRoot, 'src/content/homepage-faq.json'), 'utf8'));

function schemaNodes() {
  return $('script[type="application/ld+json"]').toArray()
    .map(element => JSON.parse($(element).text()))
    .flatMap(document => document['@graph'] || (Array.isArray(document) ? document : [document]));
}

function property(name) {
  const element = $(`head meta[property="${name}"]`);
  assert.equal(element.length, 1, `Expected exactly one ${name} metadata element`);
  return element.attr('content');
}

function parseLlmsFileLists(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim());
  assert.match(lines.shift(), /^# [^#].+$/, 'llms.txt must start with a project H1');
  assert.match(lines.shift(), /^> \S/, 'The project summary must be a blockquote');

  const sections = new Map();
  let section;
  for (const line of lines) {
    if (line.startsWith('## ')) {
      section = line.slice(3);
      assert.ok(!sections.has(section), `Duplicate section: ${section}`);
      sections.set(section, []);
      continue;
    }
    if (!section) {
      assert.doesNotMatch(line, /^\s{0,3}#{1,6}(?:\s|$)/, 'Freeform introductory content cannot contain headings');
      continue;
    }
    const match = line.match(/^[-+*] \[([^\]]+)\]\((https:\/\/[^\s)]+)\)(?:: (.+))?$/);
    assert.ok(match, `H2 sections must contain Markdown link lists: ${line}`);
    sections.get(section).push({ name: match[1], url: new URL(match[2]), notes: match[3] || '' });
  }
  assert.ok(sections.size > 0, 'The discovery guide must link to resources');
  for (const [name, entries] of sections) {
    assert.ok(entries.length > 0, `Empty discovery section: ${name}`);
  }
  return sections;
}

function publicPathExists(url) {
  const pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') return fs.existsSync(path.join(artifactRoot || projectRoot, 'index.html'));
  // index.md is generated from the rendered homepage; built mode requires the actual file.
  if (!artifactRoot && pathname === '/index.md') return true;
  const base = path.join(publicRoot, pathname);
  return [base, `${base}.html`, path.join(base, 'index.html')]
    .some(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}

test('llms.txt follows the published H1, summary, freeform, H2 file-list structure', () => {
  assert.match(llms, /^# IZEM\. Your AI Personal Trainer\n/);
  parseLlmsFileLists(llms);
});

test('when-to-use guidance maps concrete jobs to accessible, first-party resources', () => {
  const sections = parseLlmsFileLists(llms);
  const useCases = sections.get('When to use IZEM');
  assert.ok(useCases?.length >= 5, 'Provide specific use cases, not only a product slogan');
  const byPath = new Map(useCases.map(entry => [entry.url.pathname, entry.notes]));
  assert.match(byPath.get('/features/ai-voice-calls'), /accountability.*eligibility.*app/i);
  assert.match(byPath.get('/features/ai-workout-generator'), /equipment.*schedule.*feedback/i);
  assert.match(byPath.get('/features/ai-meal-planner'), /meal planning.*estimates.*allergy/i);
  assert.match(byPath.get('/workout-plan-generator/'), /browser tool.*user's choices/i);
  assert.match(byPath.get('/support.html'), /support/i);

  for (const entries of sections.values()) {
    for (const entry of entries) {
      assert.equal(entry.url.origin, origin, `Unexpected discovery origin: ${entry.url}`);
      assert.ok(publicPathExists(entry.url), `Missing public resource: ${entry.url.pathname}`);
      assert.ok(entry.notes.length > 20, `Explain the purpose of ${entry.url.pathname}`);
    }
  }
});

test('agent access guidance accurately scopes public reads and app actions', () => {
  assert.match(llms, /GET https:\/\/youraicoach\.life\/llms\.txt/);
  assert.match(llms, /homepage with `GET https:\/\/youraicoach\.life\/` and `Accept: text\/markdown`/);
  assert.match(llms, /HTML for `Accept: text\/html`/);
  assert.match(llms, /Other linked pages.*ordinary HTTP GET requests as HTML/);
  assert.match(llms, /Public website reads do not require an account or API key/);
  assert.match(llms, /does not publish a public app API or MCP endpoint/);
  assert.match(llms, /Website requests cannot start coach calls, change a member's plan, access health data or buy a membership/);
  assert.match(llms, /nonexistent URL returns HTTP 404/);
  assert.ok([...parseLlmsFileLists(llms).values()].flat().some(entry => entry.url.pathname === '/index.md'));
});

test('agent guidance preserves material product limits and avoids an unverified exact price', () => {
  assert.match(llms, /adult-only AI personal trainer/);
  assert.match(llms, /storefront.*current availability, price, currency, renewal period/i);
  assert.doesNotMatch(llms, /[$€£]\s*\d|\b(?:USD|EUR|GBP|MAD)\s*\d/);
  assert.match(llms, /7-day free trial only when the storefront confirms/);
  assert.match(llms, /eligible trial includes up to 15 voice minutes total/);
  assert.match(llms, /once and capped at three connected minutes/);
  assert.match(llms, /up to 300 live voice-coaching minutes per usage cycle/);
  assert.match(llms, /Individual calls are capped at 15 minutes/);
  assert.match(llms, /Voice calls.*do not receive Apple Health context/);
  assert.match(llms, /Apple Health access is read-only/);
  assert.match(llms, /does not diagnose or treat medical conditions/);
});

test('homepage retains its identity, canonical, language and Open Graph type', () => {
  assert.equal($('html').attr('lang'), 'en');
  assert.equal($('head title').text(), 'IZEM. Your AI Personal Trainer');
  assert.equal($('head link[rel="canonical"]').length, 1);
  assert.equal($('head link[rel="canonical"]').attr('href'), `${origin}/`);
  assert.equal(property('og:type'), 'website');
  assert.equal(property('og:url'), `${origin}/`);
});

test('homepage social image is a real local PNG with accurate MIME, dimensions and alt text', () => {
  const url = new URL(property('og:image'));
  assert.equal(url.origin, origin);
  assert.equal(url.pathname, '/images/izem-app-logo-512.png');
  const png = fs.readFileSync(path.join(publicRoot, url.pathname));
  assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  assert.equal(png.toString('ascii', 12, 16), 'IHDR');
  assert.equal(property('og:image:type'), 'image/png');
  assert.equal(Number(property('og:image:width')), png.readUInt32BE(16));
  assert.equal(Number(property('og:image:height')), png.readUInt32BE(20));
  assert.match(property('og:image:alt'), /IZEM.*lightning bolt/i);
  assert.equal($('head meta[name="twitter:image"]').attr('content'), url.href);
  assert.equal($('head meta[name="twitter:image:alt"]').attr('content'), property('og:image:alt'));
});

test('Organization JSON-LD contact and locality match the published footer', () => {
  const nodes = schemaNodes();
  const organizations = nodes.filter(node => node['@type'] === 'Organization' && node.name === 'IZEM');
  assert.equal(organizations.length, 1, 'Use one complete homepage Organization entity');
  const organization = organizations[0];
  assert.equal(organization['@context'], 'https://schema.org');
  assert.equal(organization.url, origin);
  assert.deepEqual(organization.contactPoint, {
    '@type': 'ContactPoint',
    email: 'support@youraicoach.life',
    contactType: 'customer support',
  });
  assert.deepEqual(organization.address, {
    '@type': 'PostalAddress',
    addressLocality: 'Casablanca',
    addressCountry: 'MA',
  });
  const footer = artifactRoot
    ? $('footer').text()
    : load(fs.readFileSync(path.join(projectRoot, 'src/components/Footer.tsx'), 'utf8'))('footer').text();
  assert.match(footer, /Location:\s*Casablanca, Morocco/);
  assert.ok(footer.includes(organization.contactPoint.email), 'Schema support contact must remain publicly visible');
});

test('homepage application, service, website and publisher share resolvable entity identities', () => {
  const nodes = schemaNodes();
  const byId = new Map(nodes.map(node => [node['@id'], node]));
  assert.equal(byId.size, nodes.length, 'Every homepage entity needs a unique stable @id');
  const app = byId.get(`${origin}/#app`);
  assert.deepEqual(app['@type'], ['SoftwareApplication', 'MobileApplication']);
  assert.equal(app.name, 'IZEM. Your AI Personal Trainer');
  assert.equal(app.operatingSystem, 'iOS, Android');
  assert.equal(app.author['@id'], `${origin}/#organization`);
  assert.equal(app.publisher['@id'], `${origin}/#organization`);
  for (const field of ['offers', 'aggregateRating', 'review', 'downloadUrl', 'installUrl']) {
    assert.equal(app[field], undefined, `Do not invent ${field} for the app awaiting review`);
  }
  const service = byId.get(`${origin}/#coaching-service`);
  assert.equal(service['@type'], 'Service');
  assert.equal(service.provider['@id'], app.publisher['@id']);
  const page = byId.get(`${origin}/#webpage`);
  assert.equal(page.mainEntity['@id'], app['@id']);
  assert.equal(page.isPartOf['@id'], `${origin}/#website`);
  assert.equal(page.hasPart['@id'], `${origin}/#faq`);
  const sitemap = load(fs.readFileSync(path.join(publicRoot, 'sitemap.xml'), 'utf8'), { xmlMode: true });
  const homepageEntry = sitemap('url').filter((_index, element) => sitemap(element).find('loc').text() === `${origin}/`);
  assert.equal(homepageEntry.find('lastmod').text(), page.dateModified, 'Homepage sitemap date must reflect its published modification date');

  function checkReferences(value) {
    if (!value || typeof value !== 'object') return;
    if (value['@id'] && Object.keys(value).length === 1) {
      assert.ok(byId.has(value['@id']), `Unresolved entity reference: ${value['@id']}`);
    }
    for (const child of Object.values(value)) checkReferences(child);
  }
  nodes.forEach(checkReferences);
});

test('the shared homepage FAQ matches visible answers and their JSON-LD exactly', () => {
  if (!artifactRoot) assert.equal(synchronizeHomepageFaq(homepage), homepage, 'Run the FAQ sync before publication');
  const faqSchemas = schemaNodes().filter(node => node['@type'] === 'FAQPage');
  assert.equal(faqSchemas.length, 1);
  assert.equal($('#faq').length, 1);
  assert.equal($('#faq-heading').text().trim(), faq.heading);
  assert.equal($('#faq [data-izem-faq-item]').length, faq.items.length);
  assert.equal(new Set(faq.items.map(item => item.id)).size, faq.items.length);
  assert.equal(faqSchemas[0].mainEntity.length, faq.items.length);

  faq.items.forEach((item, index) => {
    const visible = $(`#faq [data-izem-faq-item="${item.id}"]`);
    assert.equal(visible.length, 1);
    assert.equal(visible.find('h3').text().trim(), item.question);
    assert.equal(visible.find('h3').attr('id'), `faq-${item.id}`);
    assert.equal(visible.find('[data-izem-faq-answer]').text().trim(), item.answer);
    assert.equal(visible.find('a').attr('href'), item.href);
    assert.ok(publicPathExists(new URL(item.href, origin)), `FAQ link must resolve: ${item.href}`);
    assert.equal(visible.find('button, [hidden], [aria-hidden="true"]').length, 0);
    assert.equal(visible.parents('[hidden], [aria-hidden="true"]').length, 0);
    const question = faqSchemas[0].mainEntity[index];
    assert.equal(question.name, item.question);
    assert.equal(question['@id'], `${origin}/#faq-${item.id}`);
    assert.equal(question.acceptedAnswer.text, item.answer);
  });
});

test('every homepage FAQ question and answer survives Markdown generation', { skip: !artifactRoot }, () => {
  const markdown = fs.readFileSync(path.join(publicRoot, 'index.md'), 'utf8');
  for (const item of faq.items) {
    assert.ok(markdown.includes(item.question), `Markdown is missing question: ${item.id}`);
    assert.ok(markdown.includes(item.answer), `Markdown is missing answer: ${item.id}`);
  }
});

test('search crawlers have explicit public access without removing existing training preferences', () => {
  const robots = fs.readFileSync(path.join(publicRoot, 'robots.txt'), 'utf8');
  for (const bot of ['OAI-SearchBot', 'PerplexityBot', 'Googlebot', 'GPTBot', 'Google-Extended']) {
    assert.match(robots, new RegExp(`User-agent: ${bot}\\s+Allow: /(?:\\r?\\n|$)`));
  }
});

test('the canonical product overview uses the same app identity and current availability', () => {
  const overview = load(fs.readFileSync(path.join(publicRoot, 'izem-ai-fitness-coach/index.html'), 'utf8'));
  const graph = JSON.parse(overview('script[type="application/ld+json"]').first().text())['@graph'];
  const app = graph.find(node => node['@id'] === `${origin}/#app`);
  assert.equal(app.name, 'IZEM. Your AI Personal Trainer');
  assert.deepEqual(app['@type'], ['SoftwareApplication', 'MobileApplication']);
  assert.match(overview('body').text(), /The IZEM app is awaiting store review\./);
  assert.doesNotMatch(overview('body').text(), /\$24\.99/);
});
