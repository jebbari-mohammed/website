import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import { load } from 'cheerio';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://youraicoach.life';
const MISSING_PATH = '/__izem-agent-readiness-missing-page';
const REQUIRED_MACHINE_FILES = [
  '/robots.txt', '/sitemap.xml', '/video-sitemap.xml', '/news-sitemap.xml',
  '/blog/feed.xml', '/site.webmanifest',
  '/.well-known/apple-app-site-association', '/.well-known/assetlinks.json',
];

function header(response, name) {
  return response.headers.get(name) || '';
}

function mediaType(response) {
  return header(response, 'Content-Type').split(';')[0].trim().toLowerCase();
}

function varyAccept(response) {
  assert.ok(header(response, 'Vary').split(',').some(value => value.trim().toLowerCase() === 'accept'), 'Vary must include the exact Accept field');
}

function markdownCharset(response) {
  assert.match(header(response, 'Content-Type'), /(?:^|;)\s*charset\s*=\s*(?:"utf-8"|utf-8)\s*(?:;|$)/i, 'Markdown Content-Type must declare charset=utf-8');
}

function statusIs(response, expected) {
  assert.equal(response.status, expected, `Expected final HTTP ${expected}, received ${response.status}`);
}

function noHtml(body) {
  assert.doesNotMatch(body, /<!doctype\s+html\b|<\/?(?:html|head|body|main|div|section|p|h[1-6])(?:\s|>)/i, 'Expected machine-readable content, received HTML markup');
}

export function validateMarkdownResponse(response, { status = 200, requireVary = true } = {}) {
  statusIs(response, status);
  assert.equal(mediaType(response), 'text/markdown', 'Content-Type must be text/markdown');
  markdownCharset(response);
  if (requireVary) varyAccept(response);
  assert.ok(response.body.trim(), 'Markdown response must contain a nonempty body');
  noHtml(response.body);
  if (status === 404) {
    const explanation = response.body.replace(/^\s*#{1,6}\s+.*$/gm, '').replace(/\[[^\]]*\]\([^)]*\)/g, '').trim();
    assert.ok(explanation.length >= 20, 'Markdown 404 must explain the missing page in at least 20 characters, excluding headings and links');
    const links = [...response.body.matchAll(/\[[^\]]+\]\(([^\s)]+)\)/g)];
    assert.ok(links.some(([, value]) => {
      try { return /^\/(?:llms\.txt|sitemap[^/]*\.xml|docs(?:\/|$))/.test(new URL(value, ORIGIN).pathname); }
      catch { return false; }
    }), 'Markdown 404 must include a recovery link to llms.txt, a sitemap or docs');
  }
}

export function validateHtmlResponse(response, { status = 200, requireVary = true } = {}) {
  statusIs(response, status);
  assert.equal(mediaType(response), 'text/html', 'Content-Type must be text/html');
  if (requireVary) varyAccept(response);
  assert.match(response.body, /<html(?:\s|>)/i, 'HTML response must contain an HTML document');
  const $ = load(response.body);
  assert.ok($('body').text().trim().length > 20, 'HTML response must contain visible page content');
}

export function validateHeadResponse(response, { status = 200, type, expectedLength, requireVary = true } = {}) {
  statusIs(response, status);
  assert.equal(mediaType(response), type, 'HEAD must retain the selected representation Content-Type');
  if (type === 'text/markdown') markdownCharset(response);
  if (requireVary) varyAccept(response);
  assert.equal(response.body, '', 'HEAD must not send a response body');
  assert.equal(response.bytes?.byteLength || 0, 0, 'HEAD must not send payload bytes');
  if (expectedLength !== undefined && !header(response, 'Content-Encoding') && header(response, 'Content-Length')) {
    assert.equal(Number(header(response, 'Content-Length')), expectedLength, 'HEAD Content-Length must describe the corresponding GET representation');
  }
}

export function validateUnsupportedResponse(response) {
  statusIs(response, 406);
  varyAccept(response);
  assert.equal(mediaType(response), 'text/plain');
  assert.match(response.body, /text\/html.*text\/markdown/i, '406 should explain the supported representations');
}

function isPublicPath(pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return false; }
  return !decoded.split('/').filter(Boolean).some(segment =>
    (segment.startsWith('.') && segment !== '.well-known') ||
    /^(?:drafts?|_drafts?|private|_private|internal|secrets?|credentials?|node_modules|tmp|reports?)$/i.test(segment),
  );
}

function readableUrl(value, origin = ORIGIN) {
  const url = new URL(value, origin);
  assert.ok(['http:', 'https:'].includes(url.protocol) && !url.username && !url.password, 'Discovery links must use public HTTP(S) URLs');
  assert.ok(isPublicPath(url.pathname), 'Discovery links must not point to blocked private or draft paths');
  return url;
}

export function validateLlms(text, { origin = ORIGIN } = {}) {
  noHtml(text);
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim());
  assert.match(lines.shift() || '', /^# [^#].+$/, 'llms.txt must begin with one project H1');
  assert.match(lines.shift() || '', /^> \S/, 'llms.txt must include a blockquote project summary');
  const sections = new Map();
  let current;
  let fence;
  for (const originalLine of lines) {
    const line = originalLine.trim();
    if (!current && /^(```+|~~~+)/.test(line)) {
      const marker = line.match(/^(```+|~~~+)/)[1];
      fence = fence?.[0] === marker[0] ? null : marker;
      continue;
    }
    if (fence) continue;
    if (line.startsWith('## ')) {
      current = line.slice(3).trim();
      assert.ok(current && !sections.has(current), 'llms.txt sections must have distinct, nonempty headings');
      sections.set(current, []);
    } else if (!current) {
      assert.doesNotMatch(line, /^#{1,6}(?:\s|$)/, 'Freeform llms.txt guidance before the first H2 must not contain headings');
    } else {
      const match = line.match(/^[-+*] \[([^\]]+)\]\((https?:\/\/[^\s)]+)\)(?:: (.+))?$/);
      assert.ok(match, 'Every H2 section in llms.txt must contain only Markdown link lists');
      sections.get(current).push({ name: match[1], url: readableUrl(match[2], origin), notes: match[3] || '' });
    }
  }
  assert.ok(!fence, 'Unclosed code fence in llms.txt introduction');
  assert.ok(sections.size, 'llms.txt must include discovery links');
  for (const entries of sections.values()) assert.ok(entries.length, 'llms.txt file-list sections must not be empty');
  const useCases = [...sections].find(([name]) => /when.to.use/i.test(name))?.[1];
  assert.ok(useCases?.length >= 3 && useCases.every(entry => entry.notes.length >= 20), 'llms.txt must explain concrete when-to-use jobs with linked instructions');
  assert.match(text, /GET https:\/\/youraicoach\.life\//, 'Agent guidance must explain HTTP GET access');
  assert.match(text, /Accept: text\/markdown/, 'Agent guidance must explain homepage Markdown negotiation');
  assert.match(text, /Accept: text\/html/, 'Agent guidance must preserve the HTML access path');
  assert.match(text, /does not publish a public app API or MCP endpoint/, 'Agent guidance must not imply an unavailable app API or MCP endpoint');
  assert.match(text, /Other linked pages.*(?:HTTP GET|HTML)/, 'Markdown negotiation guidance must distinguish other HTML pages');
  const links = [...sections.values()].flat().map(entry => entry.url);
  assert.ok(links.some(url => url.origin === origin && url.pathname === '/index.md'), 'llms.txt must link the explicit Markdown homepage');
  return { links, sections };
}

function jsonLdNodes(value) {
  if (Array.isArray(value)) return value.flatMap(jsonLdNodes);
  if (!value || typeof value !== 'object') return [];
  return [value, ...Object.values(value).flatMap(jsonLdNodes)];
}

export function validateHomepageMetadata(html, { origin = ORIGIN } = {}) {
  const $ = load(html);
  assert.ok($('html').attr('lang')?.trim(), 'Homepage must declare its language');
  assert.equal($('link[rel="canonical"]').length, 1, 'Homepage must have exactly one canonical link');
  assert.equal($('link[rel="canonical"]').attr('href'), `${origin}/`, 'Homepage canonical must identify the public root URL');
  assert.equal($('meta[property="og:type"]').attr('content'), 'website', 'Homepage must declare og:type=website');
  const imageValue = $('meta[property="og:image"]').attr('content');
  assert.ok(imageValue, 'Homepage must declare og:image');
  const imageUrl = readableUrl(imageValue, origin);
  assert.equal(imageUrl.origin, origin, 'Homepage image must use the verified first-party asset');
  assert.equal($('meta[property="og:image:type"]').attr('content'), 'image/png', 'OG image type must match the approved PNG');
  assert.equal(Number($('meta[property="og:image:width"]').attr('content')), 512);
  assert.equal(Number($('meta[property="og:image:height"]').attr('content')), 512);
  assert.ok($('meta[property="og:image:alt"]').attr('content')?.trim(), 'OG image needs descriptive alt text');
  const documents = $('script[type="application/ld+json"]').toArray().map(element => JSON.parse($(element).text()));
  const organizations = documents.flatMap(jsonLdNodes).filter(node =>
    [node['@type']].flat().includes('Organization') && node.name === 'IZEM' && node.contactPoint && node.address,
  );
  assert.ok(organizations.length, 'Homepage must contain an Organization with contactPoint and PostalAddress');
  const footer = $('footer').text().replace(/\s+/g, ' ').trim();
  assert.ok(footer, 'Homepage must publish its organization details in the rendered footer');
  for (const organization of organizations) {
    const contacts = [organization.contactPoint].flat();
    const contact = contacts.find(value => value?.['@type'] === 'ContactPoint' && value.contactType?.trim() && (value.email || value.telephone));
    assert.ok(contact, 'Organization needs a typed contact with email or phone and contactType');
    const contactVisible = contact.email
      ? footer.includes(contact.email)
      : footer.replace(/\D/g, '').includes(String(contact.telephone).replace(/\D/g, ''));
    assert.ok(contactVisible, 'Organization contact must match the publicly visible footer');
    const address = organization.address;
    assert.equal(address['@type'], 'PostalAddress', 'Organization address must be a PostalAddress');
    assert.ok(address.addressLocality?.trim(), 'Organization must identify its published locality');
    const country = typeof address.addressCountry === 'string' ? address.addressCountry : address.addressCountry?.name;
    assert.ok(country?.trim(), 'Organization must identify its published country');
    const countryName = /^[A-Z]{2}$/i.test(country) ? new Intl.DisplayNames(['en'], { type: 'region' }).of(country.toUpperCase()) : country;
    assert.ok(footer.includes(address.addressLocality) && footer.includes(countryName), 'Organization locality and country must match the publicly visible footer');
    for (const field of ['streetAddress', 'postalCode', 'addressRegion']) {
      if (address[field]) assert.ok(footer.includes(address[field]), `Organization ${field} must have visible supporting evidence`);
    }
  }
  return { imageUrl };
}

// Cheerio handles traversal; this bounded lexical check prevents its forgiving
// XML mode from silently accepting mismatched tags or duplicate attributes.
function xmlDocument(text) {
  const stack = [];
  let roots = 0;
  let cursor = 0;
  function entities(value) {
    assert.doesNotMatch(value, /&(?!(?:amp|lt|gt|apos|quot|#\d+|#x[0-9a-fA-F]+);)/, 'XML contains an unescaped or unknown entity');
  }
  while (cursor < text.length) {
    const start = text.indexOf('<', cursor);
    const content = text.slice(cursor, start < 0 ? text.length : start);
    entities(content);
    if (!stack.length) assert.ok(!content.trim(), 'XML has text outside its document element');
    if (start < 0) break;
    if (text.startsWith('<!--', start) || text.startsWith('<?', start) || text.startsWith('<![CDATA[', start)) {
      const comment = text.startsWith('<!--', start);
      const cdata = text.startsWith('<![CDATA[', start);
      const ending = comment ? '-->' : cdata ? ']]>' : '?>';
      const offset = comment ? 4 : cdata ? 9 : 2;
      const end = text.indexOf(ending, start + offset);
      assert.ok(end >= 0, 'XML contains an unterminated comment, declaration or CDATA block');
      if (cdata) assert.ok(stack.length, 'XML CDATA must be inside the document element');
      if (comment) assert.ok(!text.slice(start + offset, end).includes('--'), 'XML comments must not contain --');
      cursor = end + ending.length;
      continue;
    }
    assert.ok(!text.startsWith('<!', start), 'Unexpected XML declaration; public discovery files must not use DTDs');
    let end = start + 1;
    let quote;
    for (; end < text.length; end++) {
      const character = text[end];
      if (quote) { if (character === quote) quote = undefined; }
      else if (character === '"' || character === "'") quote = character;
      else if (character === '>') break;
    }
    assert.ok(end < text.length && !quote, 'XML contains an unclosed tag or attribute');
    const tag = text.slice(start + 1, end);
    if (tag.startsWith('/')) {
      assert.match(tag, /^\/[A-Za-z_:][\w:.-]*\s*$/, 'Invalid XML closing tag');
      assert.equal(stack.pop(), tag.slice(1).trim(), 'XML opening and closing tags must match');
    } else {
      const match = tag.match(/^([A-Za-z_:][\w:.-]*)([\s\S]*?)(\/)?$/);
      assert.ok(match, 'Invalid XML opening tag');
      if (!stack.length) roots++;
      let attributes = match[2];
      const names = new Set();
      while (attributes.trim()) {
        const attribute = attributes.match(/^\s+([A-Za-z_:][\w:.-]*)\s*=\s*("[^"<]*"|'[^'<]*')/);
        assert.ok(attribute, 'XML attributes must have quoted values');
        assert.ok(!names.has(attribute[1]), 'XML attribute names must be unique');
        names.add(attribute[1]);
        entities(attribute[2]);
        attributes = attributes.slice(attribute[0].length);
      }
      if (!match[3]) stack.push(match[1]);
    }
    cursor = end + 1;
  }
  assert.equal(stack.length, 0, 'XML contains unclosed elements');
  assert.equal(roots, 1, 'XML must have exactly one document element');
  return load(text, { xml: true });
}

export function validateMachineFile(pathname, response, { origin = ORIGIN } = {}) {
  statusIs(response, 200);
  assert.ok(response.body.trim(), `${pathname} must not be empty`);
  if (pathname === '/llms.txt') {
    // The llms.txt proposal specifies Markdown syntax, without requiring a
    // negotiated response or excluding the conventional .txt media type.
    assert.ok(['text/markdown', 'text/plain'].includes(mediaType(response)), 'llms.txt must be served as Markdown or plain text');
    if (mediaType(response) === 'text/markdown') markdownCharset(response);
    return { ...validateLlms(response.body, { origin }), kind: 'llms' };
  }
  if (pathname.endsWith('.md')) {
    validateMarkdownResponse(response, { requireVary: false });
    return { links: [], kind: 'markdown' };
  }
  noHtml(response.body);
  const links = [];
  if (pathname.endsWith('.xml')) {
    assert.ok(['application/xml', 'text/xml', 'application/rss+xml', 'application/atom+xml'].includes(mediaType(response)), `${pathname} must use an XML Content-Type`);
    const $ = xmlDocument(response.body);
    const root = $.root().children().first();
    const rootName = root[0]?.name;
    if (/sitemap[^/]*\.xml$|(?:video|news)-sitemap\.xml$/.test(pathname)) {
      assert.ok(['urlset', 'sitemapindex'].includes(rootName), 'Sitemap must use urlset or sitemapindex');
      assert.equal(root.attr('xmlns'), 'http://www.sitemaps.org/schemas/sitemap/0.9', 'Sitemap namespace must match the published protocol');
      const entries = root.children(rootName === 'urlset' ? 'url' : 'sitemap');
      entries.each((_index, entry) => {
        const loc = $(entry).children('loc');
        assert.equal(loc.length, 1, 'Each sitemap entry needs exactly one loc');
        const url = readableUrl(loc.text().trim(), origin);
        assert.equal(url.origin, origin, 'Sitemap URLs must belong to the verified site');
        links.push(url);
      });
      return { links, kind: rootName === 'sitemapindex' ? 'sitemap-index' : 'sitemap' };
    }
    if (pathname.endsWith('/feed.xml') || pathname === '/feed.xml') {
      assert.ok(['rss', 'feed'].includes(rootName), 'Feed must be RSS or Atom');
      if (rootName === 'rss') {
        assert.equal(root.attr('version'), '2.0', 'RSS feed must declare version 2.0');
        assert.ok($('channel > title').text().trim() && $('channel > description').text().trim(), 'RSS feed needs channel metadata');
        $('channel > link, item > link').each((_index, element) => links.push(readableUrl($(element).text().trim(), origin)));
      } else {
        assert.equal(root.attr('xmlns'), 'http://www.w3.org/2005/Atom');
        assert.ok(root.children('id').text().trim() && root.children('title').text().trim(), 'Atom feed needs an id and title');
        $('link[href]').each((_index, element) => links.push(readableUrl($(element).attr('href'), origin)));
      }
      return { links, kind: 'feed' };
    }
    return { links, kind: 'xml' };
  }
  if (pathname.endsWith('.json') || pathname.endsWith('.webmanifest') || pathname.endsWith('/apple-app-site-association')) {
    assert.match(mediaType(response), /^application\/(?:[a-z0-9.-]+\+)?json$/, `${pathname} must use a JSON Content-Type`);
    const document = JSON.parse(response.body);
    assert.ok(document && typeof document === 'object', 'Public JSON must contain a document object or array');
    if (pathname.endsWith('.webmanifest')) {
      assert.ok(document.name?.trim() || document.short_name?.trim(), 'Web manifest needs an application name');
      assert.ok(document.start_url, 'Web manifest needs a start_url');
      links.push(readableUrl(document.start_url, origin));
      assert.ok(Array.isArray(document.icons) && document.icons.length, 'Web manifest needs icons');
      for (const icon of document.icons) {
        assert.ok(icon.src && icon.type?.startsWith('image/'), 'Manifest icon needs its source and image type');
        links.push(readableUrl(icon.src, origin));
      }
      return { links, kind: 'manifest' };
    }
    if (pathname.endsWith('/apple-app-site-association')) {
      assert.ok(!response.redirected, 'Apple association endpoint must be available without a redirect');
      assert.ok(Array.isArray(document.applinks?.details) && document.applinks.details.length, 'Apple association file needs applinks details');
      for (const detail of document.applinks.details) {
        const appIds = detail.appIDs || [detail.appID];
        assert.ok(appIds.length && appIds.every(value => /^[A-Z0-9]{10}\.[A-Za-z0-9.-]+$/.test(value || '')), 'Apple association identifiers must contain a team ID and bundle ID');
        assert.ok((Array.isArray(detail.paths) && detail.paths.length) || (Array.isArray(detail.components) && detail.components.length), 'Apple association file needs supported paths or components');
      }
    } else if (pathname.endsWith('/assetlinks.json')) {
      assert.ok(!response.redirected, 'Android association endpoint must be available without a redirect');
      assert.ok(Array.isArray(document) && document.length, 'Android association file must be a nonempty statement list');
      for (const statement of document) {
        assert.ok(statement.relation?.includes('delegate_permission/common.handle_all_urls'), 'Android association needs the URL-handling relation');
        assert.equal(statement.target?.namespace, 'android_app');
        assert.ok(statement.target.package_name?.trim(), 'Android association needs a package name');
        const fingerprints = statement.target.sha256_cert_fingerprints;
        assert.ok(Array.isArray(fingerprints) && fingerprints.length && fingerprints.every(value => /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/i.test(value)), 'Android certificate fingerprints must be SHA-256 hex values');
      }
    }
    return { links, kind: 'json' };
  }
  if (pathname === '/robots.txt') {
    assert.equal(mediaType(response), 'text/plain', 'robots.txt must use text/plain');
    assert.match(response.body, /^User-agent:\s*\S+/im, 'robots.txt must contain a crawler group');
    for (const match of response.body.matchAll(/^Sitemap:\s*(\S+)\s*$/gim)) links.push(readableUrl(match[1], origin));
    assert.ok(links.some(url => url.pathname === '/sitemap.xml'), 'robots.txt must identify the main sitemap');
    return { links, kind: 'robots' };
  }
  if (/\/google[A-Za-z0-9_-]+\.html$/.test(pathname)) {
    assert.ok(['text/html', 'text/plain'].includes(mediaType(response)));
    assert.equal(response.body.trim(), `google-site-verification: ${path.posix.basename(pathname)}`, 'Google verification file must preserve its exact token');
  } else {
    assert.ok(mediaType(response).startsWith('text/') || ['application/yaml', 'application/x-yaml', 'application/csv'].includes(mediaType(response)), `${pathname} must use a readable text Content-Type`);
  }
  return { links, kind: 'text' };
}

export function validatePngImage(response, { width = 512, height = 512 } = {}) {
  statusIs(response, 200);
  assert.equal(mediaType(response), 'image/png', 'Social image must be served as image/png');
  const bytes = Buffer.from(response.bytes);
  assert.ok(bytes.length >= 57, 'PNG file is truncated');
  assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), 'Image body must have a real PNG signature');
  assert.equal(bytes.toString('ascii', 12, 16), 'IHDR');
  assert.equal(bytes.readUInt32BE(8), 13, 'PNG must have a valid IHDR');
  assert.equal(bytes.readUInt32BE(16), width, 'PNG width must match homepage metadata');
  assert.equal(bytes.readUInt32BE(20), height, 'PNG height must match homepage metadata');
  const data = [];
  let ended = false;
  for (let offset = 8; offset < bytes.length;) {
    assert.ok(offset + 12 <= bytes.length, 'PNG chunk header is truncated');
    const length = bytes.readUInt32BE(offset);
    const end = offset + 12 + length;
    assert.ok(end <= bytes.length, 'PNG chunk data is truncated');
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') data.push(bytes.subarray(offset + 8, end - 4));
    if (type === 'IEND') {
      assert.equal(length, 0, 'PNG IEND must be empty');
      assert.equal(end, bytes.length, 'PNG must end at its IEND chunk');
      ended = true;
    }
    offset = end;
  }
  assert.ok(ended && data.length, 'PNG must contain image data and a complete IEND');
  assert.ok(inflateSync(Buffer.concat(data), { maxOutputLength: 32 * 1024 * 1024 }).byteLength, 'PNG must contain decodable image data');
}

export function discoverMachineFiles(directory) {
  const discovered = [];
  if (!fs.existsSync(directory)) return discovered;
  const visit = (relative = '') => {
    for (const entry of fs.readdirSync(path.join(directory, relative), { withFileTypes: true })) {
      const name = path.posix.join(relative, entry.name);
      if (!isPublicPath(`/${name}`)) continue;
      if (entry.isDirectory()) visit(name);
      else if (entry.isFile() && (/\.(?:json|txt|xml|webmanifest|md|ya?ml|csv|tsv)$/i.test(name) || /(?:^|\/)apple-app-site-association$|(?:^|\/)google[A-Za-z0-9_-]+\.html$/.test(name))) discovered.push(`/${name}`);
    }
  };
  visit();
  return discovered.sort();
}

async function limited(items, concurrency, operation) {
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) await operation(items[cursor++]);
  }));
}

export async function verifyAgentReadiness(baseUrl, {
  fetchImpl = globalThis.fetch,
  publicDirectory = fs.existsSync(path.join(PROJECT_ROOT, 'dist')) ? path.join(PROJECT_ROOT, 'dist') : path.join(PROJECT_ROOT, 'public'),
  allPages = false,
  concurrency = 6,
  onResult,
} = {}) {
  const base = new URL(baseUrl);
  assert.ok(['https:', 'http:'].includes(base.protocol) && !base.username && !base.password, 'Use a public site or local emulator URL without credentials');
  assert.equal(base.pathname, '/', 'Pass the site origin, without a subpath');
  assert.ok(!base.search && !base.hash, 'Pass the site origin without cache-busting query parameters');
  const workers = Math.min(6, Math.max(1, Math.floor(concurrency) || 1));
  const results = [];
  const checkedUrls = new Set();
  const verifiedResources = new Set();
  const machineDocuments = new Map();
  const target = value => {
    const url = readableUrl(String(value), ORIGIN);
    if (url.origin === ORIGIN) return new URL(`${url.pathname}${url.search}`, base.origin);
    return url;
  };
  async function request(value, { accept = 'text/html', method = 'GET' } = {}) {
    const url = target(value);
    checkedUrls.add(url.href);
    const response = await fetchImpl(url.href, {
      method, redirect: 'follow', signal: AbortSignal.timeout(25000),
      headers: { Accept: accept, 'Accept-Encoding': 'identity' },
    });
    const bytes = new Uint8Array(await response.arrayBuffer());
    assert.ok(bytes.byteLength <= 16 * 1024 * 1024, 'Public response exceeds the verifier body limit');
    return { status: response.status, headers: response.headers, body: new TextDecoder().decode(bytes), bytes, url: response.url || url.href, redirected: response.redirected || false };
  }
  async function check(name, operation) {
    let result;
    try { await operation(); result = { name, ok: true }; }
    catch (error) { result = { name, ok: false, error: String(error.message || error).slice(0, 1000) }; }
    results.push(result);
    if (onResult) await onResult(result);
  }
  let firstMarkdown;
  let firstHtml;
  // Do not parallelize, add query parameters or use request cache overrides here:
  // alternating the same URL detects cross-representation CDN cache pollution.
  for (const [index, type] of ['text/markdown', 'text/html', 'text/markdown', 'text/html'].entries()) {
    await check(`Homepage cache negotiation ${index + 1}: ${type}`, async () => {
      const response = await request('/', { accept: type });
      if (type === 'text/markdown') {
        validateMarkdownResponse(response);
        if (firstMarkdown) assert.ok(response.body === firstMarkdown.body, 'Homepage Markdown changed during the alternating cache check');
        else firstMarkdown = response;
      } else {
        validateHtmlResponse(response);
        if (firstHtml) assert.ok(response.body === firstHtml.body, 'Homepage HTML changed during the alternating cache check');
        else firstHtml = response;
      }
    });
  }
  const acceptCases = [
    ['text/markdown;q=0.9, text/html;q=0.2', 'text/markdown'],
    ['text/markdown;q=0.2, text/html;q=0.9', 'text/html'],
    ['text/markdown;q=0, text/html;q=1', 'text/html'],
    ['text/html;q=0, text/markdown;q=1', 'text/markdown'],
    ['text/markdown;q=0, text/*;q=0.8', 'text/html'],
    ['*/*', 'text/html'],
    ['text/html;q=0, text/markdown;q=0, */*;q=0.5', null],
    ['application/json', null],
  ];
  for (const [accept, expected] of acceptCases) {
    await check(`Accept preference: ${accept}`, async () => {
      const response = await request('/', { accept });
      if (!expected) validateUnsupportedResponse(response);
      else if (expected === 'text/markdown') validateMarkdownResponse(response);
      else validateHtmlResponse(response);
    });
  }
  for (const [type, original] of [['text/markdown', firstMarkdown], ['text/html', firstHtml]]) {
    await check(`Homepage HEAD: ${type}`, async () => validateHeadResponse(await request('/', { accept: type, method: 'HEAD' }), { type, expectedLength: original?.bytes.byteLength }));
    await check(`Missing path GET: ${type}`, async () => {
      const missing = await request(MISSING_PATH, { accept: type });
      if (type === 'text/markdown') validateMarkdownResponse(missing, { status: 404 });
      else validateHtmlResponse(missing, { status: 404 });
    });
    await check(`Missing path HEAD: ${type}`, async () => validateHeadResponse(await request(MISSING_PATH, { accept: type, method: 'HEAD' }), { status: 404, type }));
  }
  await check('/index.md matches negotiated homepage Markdown', async () => {
    const response = await request('/index.md', { accept: 'text/markdown' });
    validateMarkdownResponse(response, { requireVary: false });
    assert.ok(firstMarkdown, 'A successful negotiated Markdown response is required for comparison');
    assert.ok(response.body === firstMarkdown.body, '/index.md differs from negotiated homepage Markdown (stale or mismatched deployment)');
    verifiedResources.add(`${ORIGIN}/index.md`);
  });
  let llmsLinks = [];
  await check('/llms.txt format and agent instructions', async () => {
    const response = await request('/llms.txt', { accept: 'text/markdown' });
    const document = validateMachineFile('/llms.txt', response);
    llmsLinks = document.links;
    verifiedResources.add(`${ORIGIN}/llms.txt`);
  });
  let imageUrl;
  await check('Homepage metadata and publicly supported Organization', async () => {
    assert.ok(firstHtml, 'A successful homepage HTML response is required to inspect metadata');
    ({ imageUrl } = validateHomepageMetadata(firstHtml.body));
    verifiedResources.add(`${ORIGIN}/`);
  });
  await check('Homepage og:image is a valid 512 × 512 PNG', async () => {
    assert.ok(imageUrl, 'Homepage must expose valid og:image metadata');
    validatePngImage(await request(imageUrl, { accept: 'image/png' }));
    verifiedResources.add(imageUrl.href);
  });
  const machinePaths = new Set(REQUIRED_MACHINE_FILES);
  await check('Public machine-file inventory', async () => {
    for (const pathname of discoverMachineFiles(publicDirectory)) machinePaths.add(pathname);
  });
  const visitedMachines = new Set(['/llms.txt', '/index.md']);
  // robots.txt and sitemap indexes can discover additional public machine files.
  while ([...machinePaths].some(name => !visitedMachines.has(name))) {
    const pending = [...machinePaths].filter(name => !visitedMachines.has(name));
    await limited(pending, workers, async pathname => {
      visitedMachines.add(pathname);
      await check(`Machine file: ${pathname}`, async () => {
        const response = await request(pathname, { accept: '*/*' });
        const document = validateMachineFile(pathname, response);
        machineDocuments.set(pathname, document);
        verifiedResources.add(`${ORIGIN}${pathname}`);
        if (['robots', 'sitemap-index'].includes(document.kind)) {
          for (const url of document.links) if (url.origin === ORIGIN && url.pathname.endsWith('.xml')) machinePaths.add(url.pathname);
        }
      });
    });
  }
  const followLinks = new Map(llmsLinks.map(url => [url.href, url]));
  for (const document of machineDocuments.values()) {
    if (document.kind === 'manifest') for (const url of document.links) followLinks.set(url.href, url);
  }
  if (allPages) {
    const collect = (pathname, seen = new Set()) => {
      if (seen.has(pathname)) return;
      seen.add(pathname);
      const document = machineDocuments.get(pathname);
      if (document?.kind === 'sitemap') for (const url of document.links) followLinks.set(url.href, url);
      else if (document?.kind === 'sitemap-index') for (const url of document.links) collect(url.pathname, seen);
    };
    collect('/sitemap.xml');
  }
  await limited([...followLinks.values()].filter(url => !verifiedResources.has(url.href)), workers, async url => {
    await check(`Public resource: ${url.href}`, async () => {
      const response = await request(url, { accept: '*/*' });
      if (/\.(?:png|jpe?g|webp|svg|ico)$/.test(url.pathname)) {
        statusIs(response, 200);
        assert.match(mediaType(response), /^image\//, 'Image link must return an image Content-Type');
        assert.ok(response.bytes.byteLength, 'Image link must return image data');
      } else if (machinePaths.has(url.pathname) || /\.(?:md|txt|xml|json|webmanifest)$/.test(url.pathname)) {
        validateMachineFile(url.pathname, response);
      } else validateHtmlResponse(response, { requireVary: url.pathname === '/' });
      verifiedResources.add(url.href);
    });
  });
  return { ok: results.every(result => result.ok), results, checkedUrls: [...checkedUrls].sort() };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('Usage: node tools/verify-agent-readiness.mjs [https://youraicoach.life] [--all-pages]\nChecks real public GET/HEAD responses, content negotiation, metadata, instructions and discovered machine files.');
  } else {
    try {
      assert.ok(args.filter(value => !value.startsWith('--')).length <= 1 && args.every(value => !value.startsWith('--') || value === '--all-pages'), 'Only a site origin and --all-pages are supported');
      const report = await verifyAgentReadiness(args.find(value => !value.startsWith('--')) || ORIGIN, {
        allPages: args.includes('--all-pages'),
        onResult: result => { if (!result.ok) console.error(`FAIL ${result.name}: ${result.error}`); },
      });
      const passed = report.results.filter(result => result.ok).length;
      console.log(`Agent readiness verification: ${passed}/${report.results.length} checks passed across ${report.checkedUrls.length} public URLs${args.includes('--all-pages') ? ' (all main-sitemap pages included)' : ''}.`);
      process.exitCode = report.ok ? 0 : 1;
    } catch (error) {
      console.error(`Agent readiness verification could not run: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
