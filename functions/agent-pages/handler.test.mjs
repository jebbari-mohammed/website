import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { after, before, test } from 'node:test';
import { brotliDecompressSync, gunzipSync } from 'node:zlib';
import { appendVary, createAgentHandler, representation } from './handler.mjs';

const html = '<!doctype html><html lang="en"><body><h1>IZEM. Your AI Personal Trainer</h1><p>Existing homepage.</p></body></html>';
const markdown = '# IZEM. Your AI Personal Trainer\n\nExisting homepage.\n';
const notFoundHtml = '<!doctype html><html lang="en"><body><h1>Page not found</h1><a href="/">Home</a></body></html>';
let server, origin;
before(async () => {
  server = createServer(createAgentHandler({ html, markdown, notFoundHtml, headers: { Vary: 'Accept-Encoding', 'X-Frame-Options': 'DENY' } }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await new Promise(resolve => server.close(resolve)); });

// Unlike fetch, node:http leaves the encoded wire bytes intact. This checks
// Content-Length and actual decompression instead of hiding transport mistakes.
function wireResponse({ headers = {}, method = 'GET' } = {}) {
  return new Promise((resolve, reject) => {
    const req = request(origin, { headers, method }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('error', reject);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.end();
  });
}

function decodedBody(response) {
  const encoding = response.headers['content-encoding'];
  const body = encoding === 'br' ? brotliDecompressSync(response.body)
    : encoding === 'gzip' ? gunzipSync(response.body) : response.body;
  return body.toString('utf8');
}

const preferences = [
  [undefined, 'text/html'], ['*/*', 'text/html'], ['text/*', 'text/html'],
  ['text/markdown', 'text/markdown'], ['text/html', 'text/html'],
  ['Text/Markdown;Q=1', 'text/markdown'], ['text/markdown; charset=utf-8', 'text/markdown'],
  ['text/markdown;q=1,text/html;q=0.5', 'text/markdown'],
  ['text/markdown;q=0.5,text/html;q=1', 'text/html'],
  ['text/markdown;q=0,text/*;q=1', 'text/html'],
  ['text/*;q=1,text/markdown;q=0.5', 'text/html'],
  ['text/html;q=0,text/*;q=1', 'text/markdown'],
  ['text/html, text/markdown', 'text/html'],
  ['text/markdown, text/html', 'text/markdown'],
  ['application/json', undefined], ['text/html;q=0,text/markdown;q=0', undefined],
  ['*/*;q=0', undefined], ['text/markdown;variant=unsupported', undefined],
];
for (const [accept, expected] of preferences) {
  test(`Accept ${accept ?? '(absent)'} negotiates ${expected ?? '406'}`, () => {
    assert.equal(representation(accept)?.split(';')[0], expected);
  });
}

test('Vary appends without dropping existing fields, duplicating Accept, or changing *', () => {
  assert.equal(appendVary('Accept-Encoding, X-Fh-Requested-Host', 'Accept'), 'Accept-Encoding, X-Fh-Requested-Host, Accept');
  assert.equal(appendVary('accept, Accept-Encoding', 'Accept'), 'accept, Accept-Encoding');
  assert.equal(appendVary('*', 'Accept'), '*');
});

test('same URL alternates real HTML and Markdown bodies and representation validators', async () => {
  const etags = new Map();
  for (const accept of ['text/markdown', 'text/html', 'text/markdown', 'text/html']) {
    const response = await fetch(`${origin}/`, { headers: { Accept: accept } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), `${accept}; charset=utf-8`);
    assert.equal(response.headers.get('vary'), 'Accept-Encoding, Accept');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.match(response.headers.get('link'), /rel="describedby"/);
    assert.equal(await response.text(), accept === 'text/html' ? html : markdown);
    if (etags.has(accept)) assert.equal(response.headers.get('etag'), etags.get(accept));
    etags.set(accept, response.headers.get('etag'));
  }
  assert.notEqual(etags.get('text/html'), etags.get('text/markdown'));
  const wrongVariant = await fetch(origin, { headers: { Accept: 'text/html', 'If-None-Match': etags.get('text/markdown') } });
  assert.equal(wrongVariant.status, 200);
  assert.equal(await wrongVariant.text(), html);
  const unchanged = await fetch(origin, { headers: { Accept: 'text/markdown', 'If-None-Match': `W/${etags.get('text/markdown')}` } });
  assert.equal(unchanged.status, 304);
  assert.match(unchanged.headers.get('vary'), /Accept/);
  assert.equal(await unchanged.text(), '');
});

test('missing paths are real negotiated 404s with useful recovery links', async () => {
  for (const accept of ['text/markdown', 'text/html']) {
    const response = await fetch(`${origin}/does-not-exist?secret=never-reflect`, { headers: { Accept: accept } });
    const body = await response.text();
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('content-type'), `${accept}; charset=utf-8`);
    assert.match(response.headers.get('vary'), /Accept/);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-robots-tag'), 'noindex');
    if (accept === 'text/markdown') {
      assert.ok(body.length > 20);
      assert.match(body, /^# Page not found/);
      assert.match(body, /\[[^\]]+\]\(https:\/\/youraicoach\.life\/llms\.txt\)/);
      assert.doesNotMatch(body, /<html|never-reflect/);
    } else assert.equal(body, notFoundHtml);
  }
});

test('HEAD preserves status and representation headers without a response body', async () => {
  for (const route of ['/', '/missing']) {
    const get = await fetch(`${origin}${route}`, { headers: { Accept: 'text/markdown' } });
    const head = await fetch(`${origin}${route}`, { method: 'HEAD', headers: { Accept: 'text/markdown' } });
    assert.equal(head.status, get.status);
    for (const header of ['content-type', 'content-length', 'vary', 'link']) assert.equal(head.headers.get(header), get.headers.get(header));
    assert.equal(await head.text(), '');
  }
});

test('unsupported representations and methods do not fall through to a successful homepage', async () => {
  const unacceptable = await fetch(origin, { headers: { Accept: 'application/pdf' } });
  assert.equal(unacceptable.status, 406);
  assert.match(await unacceptable.text(), /text\/html or text\/markdown/);
  assert.equal(unacceptable.headers.get('cache-control'), 'no-store');
  const post = await fetch(origin, { method: 'POST', headers: { Accept: 'text/markdown' } });
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('allow'), 'GET, HEAD');
});

test('homepage aliases canonicalize without losing query parameters', async () => {
  for (const route of ['/index', '/index.html']) {
    const response = await fetch(`${origin}${route}?utm_source=agent`, { redirect: 'manual' });
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), '/?utm_source=agent');
  }
});

test('homepage negotiates actual encoded bytes without changing either representation', async () => {
  const encodings = [
    [undefined, undefined], ['', undefined], ['identity', undefined],
    ['gzip', 'gzip'], ['br', 'br'], ['gzip, deflate, br', 'br'],
    ['br;q=0.3, gzip;q=1', 'gzip'], ['br;q=0, gzip;q=1', 'gzip'],
    ['gzip;q=0.5, identity;q=1', undefined], ['deflate', undefined],
    ['br;q=0, gzip;q=0', undefined], ['*', 'br'], ['*;q=0, gzip;q=1', 'gzip'],
  ];
  for (const accept of ['text/html', 'text/markdown']) {
    for (const [requestedEncoding, expectedEncoding] of encodings) {
      const headers = { Accept: accept };
      if (requestedEncoding !== undefined) headers['Accept-Encoding'] = requestedEncoding;
      const response = await wireResponse({ headers });
      assert.equal(response.status, 200, `${accept}: ${requestedEncoding}`);
      assert.equal(response.headers['content-encoding'], expectedEncoding, `${accept}: ${requestedEncoding}`);
      assert.equal(Number(response.headers['content-length']), response.body.length);
      assert.equal(response.headers['content-type'], `${accept}; charset=utf-8`);
      assert.equal(response.headers.vary, 'Accept-Encoding, Accept');
      assert.equal(response.headers['cache-control'], 'public, max-age=60, must-revalidate');
      assert.equal(response.headers['x-frame-options'], 'DENY');
      assert.equal(response.headers['x-content-type-options'], 'nosniff');
      assert.equal(decodedBody(response), accept === 'text/html' ? html : markdown);
    }
  }
});

test('encoded homepage HEAD matches GET metadata and sends no body', async () => {
  for (const accept of ['text/html', 'text/markdown']) {
    for (const encoding of ['identity', 'gzip', 'br']) {
      const headers = { Accept: accept, 'Accept-Encoding': encoding };
      const get = await wireResponse({ headers });
      const head = await wireResponse({ headers, method: 'HEAD' });
      assert.equal(head.status, 200);
      for (const header of ['content-type', 'content-encoding', 'content-length', 'etag', 'vary', 'link', 'cache-control']) {
        assert.equal(head.headers[header], get.headers[header], `${accept}, ${encoding}: ${header}`);
      }
      assert.equal(head.body.length, 0);
    }
  }
});

test('strong validators are specific to the representation and content encoding', async () => {
  const etags = new Set();
  for (const accept of ['text/html', 'text/markdown']) {
    for (const encoding of ['identity', 'gzip', 'br']) {
      const headers = { Accept: accept, 'Accept-Encoding': encoding };
      const get = await wireResponse({ headers });
      const etag = get.headers.etag;
      assert.match(etag, /^"[a-f0-9]{64}"$/);
      assert.ok(!etags.has(etag));
      etags.add(etag);
      for (const validator of [etag, `W/${etag}`, '*']) {
        const unchanged = await wireResponse({ headers: { ...headers, 'If-None-Match': validator } });
        assert.equal(unchanged.status, 304);
        assert.equal(unchanged.headers.etag, etag);
        assert.equal(unchanged.headers['content-encoding'], get.headers['content-encoding']);
        assert.equal(unchanged.headers['content-length'], undefined);
        assert.equal(unchanged.headers.vary, get.headers.vary);
        assert.equal(unchanged.body.length, 0);
      }
      for (const otherEncoding of ['identity', 'gzip', 'br'].filter(value => value !== encoding)) {
        const changed = await wireResponse({ headers: { ...headers, 'Accept-Encoding': otherEncoding, 'If-None-Match': etag } });
        assert.equal(changed.status, 200);
        assert.notEqual(changed.headers.etag, etag);
        assert.equal(decodedBody(changed), accept === 'text/html' ? html : markdown);
      }
      const otherRepresentation = accept === 'text/html' ? 'text/markdown' : 'text/html';
      const changed = await wireResponse({ headers: { ...headers, Accept: otherRepresentation, 'If-None-Match': etag } });
      assert.equal(changed.status, 200);
      assert.notEqual(changed.headers.etag, etag);
      assert.equal(decodedBody(changed), otherRepresentation === 'text/html' ? html : markdown);
    }
  }
});

test('an explicitly unacceptable content encoding returns an uncached 406', async () => {
  for (const encoding of ['*;q=0', 'br;q=0, gzip;q=0, identity;q=0', 'deflate, identity;q=0']) {
    const headers = { Accept: 'text/html', 'Accept-Encoding': encoding };
    const response = await wireResponse({ headers });
    assert.equal(response.status, 406);
    assert.equal(response.headers['cache-control'], 'no-store');
    assert.equal(response.headers['content-encoding'], undefined);
    assert.equal(response.headers.etag, undefined);
    assert.match(response.body.toString('utf8'), /br, gzip, or identity/);
    const head = await wireResponse({ headers, method: 'HEAD' });
    assert.equal(head.status, 406);
    assert.equal(head.headers['content-length'], response.headers['content-length']);
    assert.equal(head.body.length, 0);
  }
});

test('Vary includes both negotiation dimensions when no existing fields are configured', async () => {
  const headers = new Map();
  const res = {
    setHeader: (key, value) => headers.set(key, value),
    getHeader: key => headers.get(key),
    end: () => {},
  };
  createAgentHandler({ html, markdown, notFoundHtml })({ method: 'HEAD', url: '/', headers: { accept: 'text/html' } }, res);
  assert.equal(headers.get('Vary'), 'Accept, Accept-Encoding');
});
