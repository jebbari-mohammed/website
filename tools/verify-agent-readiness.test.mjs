import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { deflateSync } from 'node:zlib';
import {
  validateMarkdownResponse,
  validateHtmlResponse,
  validateHeadResponse,
  validateLlms,
  validateHomepageMetadata,
  validateMachineFile,
  validatePngImage,
  discoverMachineFiles,
  verifyAgentReadiness,
} from './verify-agent-readiness.mjs';

const origin = 'https://youraicoach.life';
const imagePath = '/images/izem-app-logo-512.png';
const markdown = '# IZEM. Your AI Personal Trainer\n\nExplore personalized workouts, meal plans and eligible AI coach calls for adults.\n\n[Agent guide](https://youraicoach.life/llms.txt)\n';
const missingMarkdown = '# Page not found\n\nThe requested page does not exist on the IZEM website.\n\nFind available pages in [the agent guide](https://youraicoach.life/llms.txt).\n';
const llms = `# IZEM. Your AI Personal Trainer

> IZEM connects personalized workouts, meal planning, progress review and eligible AI coach calls for adults.

**How agents should access IZEM**

Read this guide with \`GET https://youraicoach.life/llms.txt\`. Public website reads do not require an account or API key. Request the homepage with \`GET https://youraicoach.life/\` and \`Accept: text/markdown\`; use \`Accept: text/html\` for HTML. The explicit Markdown homepage is \`https://youraicoach.life/index.md\`.

The website does not publish a public app API or MCP endpoint. Website requests cannot start coach calls, change a member's plan, access health data or buy a membership. Those actions require the app and the user's account, permissions and eligibility. Other linked pages support ordinary HTTP GET requests as HTML; calculators run in the browser.

## When to use IZEM

- [AI voice calls](https://youraicoach.life/features/ai-voice-calls): Use when an adult wants live AI fitness conversations or workout accountability; check eligibility, permissions and call allowances in the app.
- [Personalized workouts](https://youraicoach.life/features/ai-workout-generator): Use when comparing workout plans adapted to equipment, experience, schedule and feedback.
- [Meal planning](https://youraicoach.life/features/ai-meal-planner): Use when connecting meal planning to workouts and nutrition targets; preserve estimate and allergy limitations.
- [Free workout generator](https://youraicoach.life/workout-plan-generator/): Use when building a starting routine; open the browser tool and enter the user's choices.
- [Fitness calculators](https://youraicoach.life/tools/): Use when a user needs a general starting estimate for calories, protein or training; follow the chosen calculator's inputs.
- [Support](https://youraicoach.life/support.html): Use for account, subscription or product questions; direct the user to the published support options.

## Canonical sources

- [Homepage in Markdown](https://youraicoach.life/index.md): Read the public homepage in Markdown.
- [Website](https://youraicoach.life/): Public product introduction and navigation.
- [Sitemap](https://youraicoach.life/sitemap.xml): Discover public pages.

## Optional

- [Fitness guides](https://youraicoach.life/blog/): Educational articles and planning frameworks.
`;

function snapshot(body, {
  status = 200,
  type = 'text/markdown; charset=utf-8',
  vary = 'Accept-Encoding, Accept',
  url = `${origin}/`,
  headers = {},
  bytes = new TextEncoder().encode(body),
} = {}) {
  const responseHeaders = new Headers(headers);
  if (type !== null) responseHeaders.set('Content-Type', type);
  if (vary !== null) responseHeaders.set('Vary', vary);
  return { status, headers: responseHeaders, body, bytes, url };
}

function organization(overrides = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'IZEM',
    url: origin,
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@youraicoach.life',
      contactType: 'customer support',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Casablanca',
      addressCountry: 'MA',
    },
    ...overrides,
  };
}

function homepage({
  lang = 'en',
  canonical = `${origin}/`,
  image = `${origin}${imagePath}`,
  type = 'website',
  schema = organization(),
} = {}) {
  return `<!doctype html>
<html${lang === null ? '' : ` lang="${lang}"`}><head>
<title>IZEM. Your AI Personal Trainer</title>
${canonical === null ? '' : `<link rel="canonical" href="${canonical}">`}
${type === null ? '' : `<meta property="og:type" content="${type}">`}
<meta property="og:url" content="${origin}/">
<meta property="og:title" content="IZEM. Your AI Personal Trainer">
${image === null ? '' : `<meta property="og:image" content="${image}">`}
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="512">
<meta property="og:image:height" content="512">
<meta property="og:image:alt" content="IZEM app icon: a black lightning bolt on a lime, teal and blue background.">
<meta name="twitter:image" content="${origin}${imagePath}">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
</head><body><main><h1>IZEM. Your AI Personal Trainer</h1>
<p>Explore personalized workouts, meal plans and eligible AI coach calls for adults.</p>
<a href="/llms.txt">Agent guide</a></main>
<footer>Location: Casablanca, Morocco. Contact support@youraicoach.life.</footer></body></html>`;
}

// A complete PNG fixture avoids making a truncated IHDR stand in for a real image.
function pngFixture(width = 512, height = 512) {
  const chunk = (type, data) => {
    const name = Buffer.from(type);
    let crc = 0xffffffff;
    for (const byte of Buffer.concat([name, data])) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
    return Buffer.concat([length, name, data, checksum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.alloc((width * 4 + 1) * height))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

test('Markdown negotiation accepts the correct MIME type and a case-insensitive Vary token', () => {
  assert.doesNotThrow(() => validateMarkdownResponse(snapshot(markdown)));
  assert.doesNotThrow(() => validateMarkdownResponse(snapshot(markdown, {
    type: 'Text/Markdown; Charset=UTF-8', vary: 'Accept-Encoding, aCcEpT',
  })));
  assert.doesNotThrow(() => validateMarkdownResponse(snapshot(markdown, { vary: null }), { requireVary: false }));
});

test('Markdown checks reject missing negotiation headers, empty bodies and disguised HTML', async t => {
  const cases = [
    ['HTML response', { type: 'text/html; charset=utf-8' }],
    ['lookalike MIME type', { type: 'text/markdownish' }],
    ['missing Content-Type', { type: null }],
    ['missing required Markdown charset', { type: 'text/markdown' }],
    ['wrong Markdown charset', { type: 'text/markdown; charset=iso-8859-1' }],
    ['missing Vary', { vary: null }],
    ['Vary contains Accept-Encoding alone', { vary: 'Accept-Encoding' }],
    ['lookalike Vary field', { vary: 'X-Accept, Accept-Encoding' }],
    ['non-success status', { status: 503 }],
  ];
  for (const [name, options] of cases) {
    await t.test(name, () => assert.throws(() => validateMarkdownResponse(snapshot(markdown, options))));
  }
  await t.test('empty Markdown', () => assert.throws(() => validateMarkdownResponse(snapshot(' \n\t'))));
  await t.test('HTML mislabeled as Markdown', () => assert.throws(() => validateMarkdownResponse(snapshot(homepage()))));
});

test('a useful Markdown 404 needs its real status, an explanation and a recovery link', async t => {
  assert.doesNotThrow(() => validateMarkdownResponse(snapshot(missingMarkdown, { status: 404 }), { status: 404 }));
  await t.test('HTTP 200 soft 404', () => {
    assert.throws(() => validateMarkdownResponse(snapshot(missingMarkdown), { status: 404 }));
  });
  await t.test('long URL cannot supply the missing explanation', () => {
    assert.throws(() => validateMarkdownResponse(snapshot('# 404\n\n[Guide](https://youraicoach.life/llms.txt)\n', { status: 404 }), { status: 404 }));
  });
  await t.test('explanation without a link', () => {
    assert.throws(() => validateMarkdownResponse(snapshot('# Page not found\n\nThe requested page does not exist on the IZEM website.\n', { status: 404 }), { status: 404 }));
  });
  await t.test('HTML error under a Markdown header', () => {
    assert.throws(() => validateMarkdownResponse(snapshot('<!doctype html><html><body>Page not found</body></html>', { status: 404 }), { status: 404 }));
  });
});

test('HTML validation requires an HTML document, exact type and the requested status', () => {
  assert.doesNotThrow(() => validateHtmlResponse(snapshot(homepage(), { type: 'text/html; charset=utf-8' })));
  assert.doesNotThrow(() => validateHtmlResponse(snapshot(homepage(), { type: 'text/html', vary: null }), { requireVary: false }));
  assert.throws(() => validateHtmlResponse(snapshot(markdown, { type: 'text/html' })));
  assert.throws(() => validateHtmlResponse(snapshot(homepage(), { type: 'text/htmlish' })));
  assert.throws(() => validateHtmlResponse(snapshot(homepage(), { type: 'text/html', status: 404 })));
  assert.throws(() => validateHtmlResponse(snapshot(homepage(), { type: 'text/html', vary: 'Accept-Encoding' })));
});

test('HEAD validation requires an empty body while preserving representation headers and status', () => {
  const validHead = snapshot('', { headers: { 'Content-Length': String(Buffer.byteLength(markdown)) } });
  assert.doesNotThrow(() => validateHeadResponse(validHead, { type: 'text/markdown', expectedLength: Buffer.byteLength(markdown) }));
  assert.doesNotThrow(() => validateHeadResponse(snapshot('', { status: 404 }), { status: 404, type: 'text/markdown' }));
  assert.throws(() => validateHeadResponse(snapshot(markdown), { type: 'text/markdown' }));
  assert.throws(() => validateHeadResponse(snapshot('', { status: 404 }), { type: 'text/markdown' }));
  assert.throws(() => validateHeadResponse(snapshot('', { type: null }), { type: 'text/markdown' }));
  assert.throws(() => validateHeadResponse(snapshot('', { type: 'text/html' }), { type: 'text/markdown' }));
  assert.throws(() => validateHeadResponse(snapshot('', { type: 'text/markdown' }), { type: 'text/markdown' }));
  assert.throws(() => validateHeadResponse(snapshot('', { type: 'text/markdown; charset=iso-8859-1' }), { type: 'text/markdown' }));
  assert.throws(() => validateHeadResponse(snapshot('', { vary: null }), { type: 'text/markdown' }));
  assert.throws(() => validateHeadResponse(validHead, { type: 'text/markdown', expectedLength: 1 }));
});

test('llms validation exposes usable links and when-to-use sections from a conforming guide', () => {
  const result = validateLlms(llms, { origin });
  assert.ok(result.sections instanceof Map);
  assert.ok(result.sections.has('When to use IZEM'));
  assert.ok(result.links.every(link => link instanceof URL));
  assert.ok(result.links.some(link => link.href === `${origin}/index.md`));
  assert.ok(result.links.some(link => link.href === `${origin}/support.html`));
});

test('llms validation rejects malformed structure and missing task guidance', async t => {
  const cases = [
    ['missing project H1', llms.replace(/^# IZEM[^\n]*\n/, '')],
    ['missing blockquote summary', llms.replace(/^> .*\n/m, '')],
    ['heading in freeform introduction', llms.replace('**How agents should access IZEM**', '### Access')],
    ['unstructured text below an H2', llms.replace('## Canonical sources', '## Canonical sources\n\nThese are links.')],
    ['empty resource section', `${llms}\n## Empty section\n`],
    ['duplicate section', `${llms}\n## Optional\n\n- [About](https://youraicoach.life/about): Publisher details.\n`],
    ['no when-to-use section', llms.replace(/## When to use IZEM[\s\S]*?(?=## Canonical sources)/, '')],
  ];
  for (const [name, text] of cases) {
    await t.test(name, () => assert.throws(() => validateLlms(text, { origin })));
  }
});

test('homepage metadata accepts the published locality without inventing a street address', () => {
  const result = validateHomepageMetadata(homepage(), { origin });
  assert.ok(result.imageUrl instanceof URL);
  assert.equal(result.imageUrl.href, `${origin}${imagePath}`);
  const phoneContact = organization({
    contactPoint: { '@type': 'ContactPoint', telephone: '+212555010000', contactType: 'customer support' },
  });
  const phoneHomepage = homepage({ schema: phoneContact }).replace('Contact support@youraicoach.life.', 'Contact +212555010000.');
  assert.doesNotThrow(() => validateHomepageMetadata(phoneHomepage, { origin }));
});

test('homepage metadata rejects each missing identity signal and incomplete Organization data', async t => {
  const cases = [
    ['missing canonical', { canonical: null }],
    ['wrong canonical', { canonical: `${origin}/another-page/` }],
    ['missing language', { lang: null }],
    ['empty language', { lang: '' }],
    ['missing og:image', { image: null }],
    ['missing og:type', { type: null }],
    ['missing Organization', { schema: { '@context': 'https://schema.org', '@type': 'WebSite', name: 'IZEM' } }],
    ['missing contactPoint', { schema: organization({ contactPoint: null }) }],
    ['missing contact method', { schema: organization({ contactPoint: { '@type': 'ContactPoint', contactType: 'customer support' } }) }],
    ['missing contactType', { schema: organization({ contactPoint: { '@type': 'ContactPoint', email: 'support@youraicoach.life' } }) }],
    ['missing address', { schema: organization({ address: null }) }],
    ['address is not PostalAddress', { schema: organization({ address: { '@type': 'Place', addressLocality: 'Casablanca', addressCountry: 'MA' } }) }],
  ];
  for (const [name, options] of cases) {
    await t.test(name, () => assert.throws(() => validateHomepageMetadata(homepage(options), { origin })));
  }
});

test('Organization details must agree with the visibly published footer', () => {
  assert.throws(() => validateHomepageMetadata(homepage().replace('Contact support@youraicoach.life.', 'Contact help@example.com.'), { origin }));
  assert.throws(() => validateHomepageMetadata(homepage().replace('Location: Casablanca, Morocco.', 'Location: Rabat, Morocco.'), { origin }));
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url></urlset>`;
const robots = `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`;
const manifest = JSON.stringify({
  name: 'IZEM. Your AI Personal Trainer', short_name: 'IZEM', start_url: '/', display: 'standalone',
  icons: [{ src: imagePath, sizes: '512x512', type: 'image/png' }],
});

test('machine-file validation parses sitemap, robots and manifest discovery links', () => {
  const sitemapResult = validateMachineFile('/sitemap.xml', snapshot(sitemap, { type: 'application/xml' }), { origin });
  assert.ok(sitemapResult.links.some(link => link.href === `${origin}/`));
  const robotsResult = validateMachineFile('/robots.txt', snapshot(robots, { type: 'text/plain' }), { origin });
  assert.ok(robotsResult.links.some(link => link.href === `${origin}/sitemap.xml`));
  const manifestResult = validateMachineFile('/site.webmanifest', snapshot(manifest, { type: 'application/manifest+json' }), { origin });
  assert.ok(manifestResult.links.some(link => link.href === `${origin}${imagePath}`));
});

test('machine-file validation rejects HTML fallbacks, malformed formats and unsuccessful responses', () => {
  assert.throws(() => validateMachineFile('/sitemap.xml', snapshot(homepage(), { type: 'text/html' }), { origin }));
  assert.throws(() => validateMachineFile('/sitemap.xml', snapshot(sitemap.replace('</url>', '</missing>'), { type: 'application/xml' }), { origin }));
  assert.throws(() => validateMachineFile('/site.webmanifest', snapshot('{"name":', { type: 'application/manifest+json' }), { origin }));
  assert.throws(() => validateMachineFile('/robots.txt', snapshot(robots, { type: 'text/plain', status: 404 }), { origin }));
});

test('PNG validation verifies image bytes, MIME and declared dimensions', () => {
  const bytes = pngFixture();
  assert.doesNotThrow(() => validatePngImage(snapshot('', { type: 'image/png', bytes })));
  assert.doesNotThrow(() => validatePngImage(snapshot('', { type: 'image/png', bytes: pngFixture(1, 1) }), { width: 1, height: 1 }));
  assert.throws(() => validatePngImage(snapshot('', { type: 'image/png', bytes: pngFixture(1, 1) })));
  assert.throws(() => validatePngImage(snapshot(homepage(), { type: 'image/png' })));
  assert.throws(() => validatePngImage(snapshot('', { type: 'text/html', bytes })));
  assert.throws(() => validatePngImage(snapshot('', { type: 'image/png', bytes: bytes.subarray(0, 16) })));
  assert.throws(() => validatePngImage(snapshot('', { type: 'image/png', bytes: bytes.subarray(0, -12) })));
  assert.throws(() => validatePngImage(snapshot('', { type: 'image/png', bytes, status: 404 })));
});

const requiredMachines = [
  '/robots.txt', '/sitemap.xml', '/video-sitemap.xml', '/news-sitemap.xml',
  '/blog/feed.xml', '/site.webmanifest',
  '/.well-known/apple-app-site-association', '/.well-known/assetlinks.json',
];
const missingPath = '/__izem-agent-readiness-missing-page';
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>IZEM Blog</title><link>${origin}/blog/</link>
<description>Fitness guides from IZEM.</description><language>en</language>
<item><title>A fitness planning guide</title><link>${origin}/blog/fixture-guide</link>
<guid>${origin}/blog/fixture-guide</guid><description>Planning guidance for adults.</description>
<pubDate>Thu, 08 Oct 2026 00:00:00 GMT</pubDate></item></channel></rss>`;

function fixtureFetch(override = () => undefined) {
  const calls = [];
  const machineFiles = new Map([
    ['/robots.txt', { body: robots, type: 'text/plain; charset=utf-8' }],
    ['/sitemap.xml', { body: sitemap, type: 'application/xml' }],
    ['/video-sitemap.xml', { body: sitemap, type: 'application/xml' }],
    ['/news-sitemap.xml', { body: sitemap, type: 'application/xml' }],
    ['/blog/feed.xml', { body: rss, type: 'application/rss+xml' }],
    ['/site.webmanifest', { body: manifest, type: 'application/manifest+json' }],
    ['/.well-known/apple-app-site-association', {
      body: JSON.stringify({ applinks: { apps: [], details: [{ appID: 'ABCDE12345.com.ai.gym.coach', paths: ['/app/*', '/app'] }] } }),
      type: 'application/json',
    }],
    ['/.well-known/assetlinks.json', {
      body: JSON.stringify([{
        relation: ['delegate_permission/common.handle_all_urls'],
        target: { namespace: 'android_app', package_name: 'com.ai.gym.coach', sha256_cert_fingerprints: [Array(32).fill('AA').join(':')] },
      }]),
      type: 'application/json',
    }],
  ]);

  // This fixture supports the verifier's request matrix without calling a server.
  function selectType(accept) {
    const ranges = accept.toLowerCase().split(',').map((entry, index) => {
      const [type, ...parameters] = entry.trim().split(';');
      const q = parameters.map(value => value.trim()).find(value => value.startsWith('q='));
      return { type, q: q === undefined ? 1 : Number(q.slice(2)), index };
    });
    const score = type => ranges.find(range => range.type === type)
      ?? ranges.find(range => range.type === 'text/*')
      ?? ranges.find(range => range.type === '*/*')
      ?? { q: 0, index: Infinity };
    const htmlScore = score('text/html');
    const markdownScore = score('text/markdown');
    if (htmlScore.q <= 0 && markdownScore.q <= 0) return null;
    return markdownScore.q > htmlScore.q || (markdownScore.q === htmlScore.q && markdownScore.index < htmlScore.index)
      ? 'text/markdown' : 'text/html';
  }

  const fetchImpl = async (input, init = {}) => {
    const url = new URL(input instanceof Request ? input.url : input);
    assert.equal(url.origin, origin, 'Fake fetch never contacts a network or another origin');
    const method = (init.method || 'GET').toUpperCase();
    const accept = new Headers(init.headers).get('accept') || '*/*';
    const call = { url, method, accept };
    calls.push(call);
    let response = { status: 200, body: homepage(), type: 'text/html; charset=utf-8', headers: {} };
    if (url.pathname === '/' || url.pathname === missingPath) {
      const type = selectType(accept);
      response.headers.Vary = 'Accept-Encoding, Accept';
      if (type === null) {
        response.status = 406;
        response.type = 'text/plain; charset=utf-8';
        response.body = 'This resource is available as text/html or text/markdown. Request one of those media types.\n';
      } else {
        response.type = `${type}; charset=utf-8`;
        response.status = url.pathname === missingPath ? 404 : 200;
        response.body = type === 'text/markdown'
          ? (response.status === 404 ? missingMarkdown : markdown)
          : (response.status === 404 ? '<!doctype html><html lang="en"><head><title>Page not found</title></head><body><h1>Page not found</h1><a href="/llms.txt">Agent guide</a></body></html>' : homepage());
        response.headers.ETag = type === 'text/markdown' ? '"fixture-markdown"' : '"fixture-html"';
      }
    } else if (url.pathname === '/index.md') response = { ...response, body: markdown, type: 'text/markdown; charset=utf-8' };
    else if (url.pathname === '/llms.txt') response = { ...response, body: llms, type: 'text/plain; charset=utf-8' };
    else if (url.pathname === imagePath) response = { ...response, body: pngFixture(), type: 'image/png' };
    else if (machineFiles.has(url.pathname)) response = { ...response, ...machineFiles.get(url.pathname) };

    response = { ...response, ...await override(call, response) };
    const headers = new Headers(response.headers);
    headers.set('Content-Type', response.type);
    headers.set('Content-Length', String(Buffer.byteLength(response.body)));
    const result = new Response(method === 'HEAD' ? null : response.body, { status: response.status, headers });
    Object.defineProperty(result, 'url', { value: url.href });
    return result;
  };
  return { fetchImpl, calls };
}

function emptyPublicDirectory(t) {
  const directory = mkdtempSync(path.join(tmpdir(), 'izem-readiness-fixture-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('the complete verifier checks negotiated bodies, HEAD, discovery files, image and linked pages without network', async t => {
  const fixture = fixtureFetch();
  const observed = [];
  const result = await verifyAgentReadiness(origin, {
    fetchImpl: fixture.fetchImpl, publicDirectory: emptyPublicDirectory(t), onResult: entry => observed.push(entry),
  });
  assert.equal(result.ok, true, JSON.stringify(result.results.filter(entry => !entry.ok), null, 2));
  assert.ok(result.results.length > 10);
  assert.equal(observed.length, result.results.length);
  assert.deepEqual(fixture.calls.filter(call => call.url.pathname === '/' && call.method === 'GET').slice(0, 4).map(call => call.accept), [
    'text/markdown', 'text/html', 'text/markdown', 'text/html',
  ]);
  for (const pathname of ['/', '/index.md', '/llms.txt', imagePath, '/support.html', ...requiredMachines]) {
    assert.ok(result.checkedUrls.includes(`${origin}${pathname}`), `Expected a checked URL for ${pathname}`);
  }
  for (const pathname of ['/', missingPath]) {
    for (const accept of ['text/markdown', 'text/html']) {
      assert.ok(fixture.calls.some(call => call.url.pathname === pathname && call.method === 'HEAD' && call.accept === accept), `Expected HEAD ${pathname} as ${accept}`);
    }
  }
});

test('the verifier reports a stale explicit Markdown page instead of accepting two different homepages', async t => {
  const fixture = fixtureFetch(({ url }) => url.pathname === '/index.md'
    ? { body: markdown.replace('personalized workouts', 'outdated product capabilities') }
    : undefined);
  const result = await verifyAgentReadiness(origin, { fetchImpl: fixture.fetchImpl, publicDirectory: emptyPublicDirectory(t) });
  assert.equal(result.ok, false);
  assert.ok(result.results.some(entry => !entry.ok && /index\.md/.test(entry.name) && /differs|stale|match|same|identical/i.test(String(entry.error))), JSON.stringify(result.results));
});

test('the verifier records failed Vary and soft-404 responses while continuing the audit', async t => {
  const fixture = fixtureFetch(({ url }, response) => {
    if (url.pathname === '/') return { headers: { ...response.headers, Vary: 'Accept-Encoding' } };
    if (url.pathname === missingPath) return { status: 200 };
  });
  const result = await verifyAgentReadiness(origin, { fetchImpl: fixture.fetchImpl, publicDirectory: emptyPublicDirectory(t) });
  assert.equal(result.ok, false);
  assert.ok(result.results.some(entry => !entry.ok && /Vary/i.test(String(entry.error))));
  assert.ok(result.results.some(entry => !entry.ok && /404/.test(String(entry.error))));
  assert.ok(result.checkedUrls.includes(`${origin}/llms.txt`), 'Header failures must not stop discovery checks');
  assert.ok(result.checkedUrls.includes(`${origin}/site.webmanifest`), 'Header failures must not stop machine-file checks');
});

test('broken discovered endpoints and fetch errors are reported, with remaining endpoints still checked', async t => {
  const fixture = fixtureFetch(({ url }) => {
    if (url.pathname === '/support.html') return { status: 404 };
    if (url.pathname === '/blog/feed.xml') throw new Error('Fixture connection failed for RSS');
  });
  const result = await verifyAgentReadiness(origin, { fetchImpl: fixture.fetchImpl, publicDirectory: emptyPublicDirectory(t) });
  assert.equal(result.ok, false);
  assert.ok(result.results.some(entry => !entry.ok && /support\.html/.test(entry.name)), JSON.stringify(result.results));
  assert.ok(result.results.some(entry => !entry.ok && /Fixture connection failed for RSS/.test(String(entry.error))));
  assert.ok(result.checkedUrls.includes(`${origin}/.well-known/assetlinks.json`));
});

test('machine-file discovery includes public formats and excludes draft, private, hidden and symlinked files', t => {
  const directory = emptyPublicDirectory(t);
  const included = [
    'llms.txt', 'index.md', 'robots.txt', 'sitemap.xml', 'site.webmanifest',
    'data/catalog.json', 'feeds/content.xml', 'data/export.csv', 'config/public.yaml',
    '.well-known/apple-app-site-association', '.well-known/assetlinks.json',
    '.well-known/security.txt', 'googleABC123.html',
  ];
  const excluded = [
    'index.html', 'images/logo.png', '.env', '.git/config', '.hidden.json',
    '.well-known/.hidden.txt', 'draft/page.md', '_drafts/page.md', 'Drafts/page.md',
    'private/data.json', '_private/data.json', '%70rivate/data.json',
    'internal/query.json', 'secrets/key.json', 'credentials/keys.json',
    'node_modules/package/package.json', 'tmp/export.csv', 'reports/audit.json',
  ];
  for (const filename of [...included, ...excluded]) {
    const destination = path.join(directory, filename);
    mkdirSync(path.dirname(destination), { recursive: true });
    writeFileSync(destination, '{}');
  }
  symlinkSync(path.join(directory, 'private/data.json'), path.join(directory, 'linked-secret.json'));
  symlinkSync(path.join(directory, 'private'), path.join(directory, 'linked-directory'));
  assert.deepEqual(discoverMachineFiles(directory), included.map(filename => `/${filename}`).sort());
  assert.deepEqual(discoverMachineFiles(path.join(directory, 'does-not-exist')), []);
});

test('allPages follows main-sitemap indexes and checks pages absent from llms discovery', async t => {
  const directory = emptyPublicDirectory(t);
  const childSitemap = '/sitemap-fixture-pages.xml';
  const sitemapPages = ['/guides/sitemap-only-a', '/guides/sitemap-only-b'];
  const createFixture = () => fixtureFetch(({ url }) => {
    if (url.pathname === '/sitemap.xml') return {
      type: 'application/xml',
      body: `<?xml version="1.0"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${origin}${childSitemap}</loc></sitemap></sitemapindex>`,
    };
    if (url.pathname === childSitemap) return {
      type: 'application/xml',
      body: `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapPages.map(page => `<url><loc>${origin}${page}</loc></url>`).join('')}</urlset>`,
    };
  });
  const defaultFixture = createFixture();
  const defaultReport = await verifyAgentReadiness(origin, { fetchImpl: defaultFixture.fetchImpl, publicDirectory: directory });
  assert.equal(defaultReport.ok, true, JSON.stringify(defaultReport.results.filter(entry => !entry.ok)));
  assert.ok(defaultReport.checkedUrls.includes(`${origin}${childSitemap}`), 'Sitemap indexes always lead to child machine files');
  for (const page of sitemapPages) assert.ok(!defaultReport.checkedUrls.includes(`${origin}${page}`));

  const fullFixture = createFixture();
  const fullReport = await verifyAgentReadiness(origin, { fetchImpl: fullFixture.fetchImpl, publicDirectory: directory, allPages: true });
  assert.equal(fullReport.ok, true, JSON.stringify(fullReport.results.filter(entry => !entry.ok)));
  for (const page of sitemapPages) {
    assert.ok(fullReport.checkedUrls.includes(`${origin}${page}`), `allPages must fetch ${page}`);
    assert.equal(fullFixture.calls.filter(call => call.url.pathname === page).length, 1, 'Each sitemap page needs one fetch');
  }
});

test('audit requests honor bounded concurrency and still complete when given zero workers', async t => {
  const directory = emptyPublicDirectory(t);
  for (const [concurrency, expectedPeak] of [[1, 1], [2, 2], [50, 6], [0, 1]]) {
    await t.test(`concurrency ${concurrency} uses at most ${expectedPeak} concurrent requests`, async () => {
      const fixture = fixtureFetch();
      let active = 0;
      let peak = 0;
      const fetchImpl = async (...args) => {
        active++;
        peak = Math.max(peak, active);
        try {
          // A microtask yields enough for independent workers to overlap without timers.
          await Promise.resolve();
          return await fixture.fetchImpl(...args);
        } finally { active--; }
      };
      const result = await verifyAgentReadiness(origin, { fetchImpl, publicDirectory: directory, concurrency });
      assert.equal(result.ok, true, JSON.stringify(result.results.filter(entry => !entry.ok)));
      assert.equal(peak, expectedPeak);
      assert.equal(active, 0);
      for (const pathname of requiredMachines) assert.ok(result.checkedUrls.includes(`${origin}${pathname}`));
    });
  }
});
