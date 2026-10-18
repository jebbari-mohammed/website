import { createHash } from 'node:crypto';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import Negotiator from 'negotiator';

const HTML = 'text/html; charset=utf-8';
const MARKDOWN = 'text/markdown; charset=utf-8';
export const NOT_FOUND_MARKDOWN = '# Page not found\n\nThe requested page does not exist on the IZEM website.\n\nFind available information in [the agent guide](https://youraicoach.life/llms.txt) or [the sitemap](https://youraicoach.life/sitemap.xml).\n';
const NOT_ACCEPTABLE = 'This resource is available as text/html or text/markdown. Request one of those media types.\n';
const ENCODING_NOT_ACCEPTABLE = 'This resource is available with br, gzip, or identity content encoding.\n';

// Negotiator implements RFC 9110 media-range specificity before q weighting.
// Equal preferences follow the client's order; wildcards default to HTML.
export function representation(accept) {
  return new Negotiator({ headers: { accept } }).mediaType([HTML, MARKDOWN]);
}

export function appendVary(existing, field) {
  const fields = String(existing || '').split(',').map(value => value.trim()).filter(Boolean);
  if (!fields.includes('*') && !fields.some(value => value.toLowerCase() === field.toLowerCase())) fields.push(field);
  return fields.join(', ');
}

function entityTag(body) {
  return `"${createHash('sha256').update(body).digest('hex')}"`;
}

function encodedVariants(body) {
  const identity = Buffer.from(body);
  // The public homepage changes only at build time. Compress once when the
  // handler starts so requests do not repeat this work or block the event loop.
  const bodies = {
    br: brotliCompressSync(identity, { params: { [constants.BROTLI_PARAM_QUALITY]: 5 } }),
    gzip: gzipSync(identity),
    identity,
  };
  return Object.fromEntries(Object.entries(bodies).map(([encoding, bytes]) => [encoding, { body: bytes, etag: entityTag(bytes) }]));
}

export function createAgentHandler({ html, markdown, notFoundHtml, headers = {} }) {
  if (![html, markdown, notFoundHtml].every(value => typeof value === 'string' && value.trim())) {
    throw new Error('The agent handler requires built HTML, Markdown, and the existing HTML 404 page.');
  }
  const variants = {
    [HTML]: encodedVariants(html),
    [MARKDOWN]: encodedVariants(markdown),
  };

  return function agentHandler(req, res) {
    for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
    res.setHeader('Vary', appendVary(appendVary(res.getHeader('Vary'), 'Accept'), 'Accept-Encoding'));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Link', '<https://youraicoach.life/llms.txt>; rel="describedby"');
    const method = req.method || 'GET';
    const send = (status, type, body) => {
      res.statusCode = status;
      res.setHeader('Content-Type', type);
      res.setHeader('Content-Length', Buffer.byteLength(body));
      res.end(method === 'HEAD' ? undefined : body);
    };

    if (method !== 'GET' && method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      res.setHeader('Cache-Control', 'no-store');
      return send(405, 'text/plain; charset=utf-8', 'Use GET or HEAD to read this public website.\n');
    }

    const path = (req.url || '/').split('?')[0];
    if (path === '/index' || path === '/index.html') {
      const query = (req.url || '').includes('?') ? (req.url || '').slice(req.url.indexOf('?')) : '';
      res.setHeader('Location', `/${query}`);
      res.setHeader('Cache-Control', 'public, max-age=60, must-revalidate');
      return send(301, 'text/plain; charset=utf-8', 'The IZEM homepage is at /.\n');
    }

    const type = representation(req.headers.accept);
    if (!type) {
      res.setHeader('Cache-Control', 'no-store');
      return send(406, 'text/plain; charset=utf-8', NOT_ACCEPTABLE);
    }

    if (path !== '/') {
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Robots-Tag', 'noindex');
      return send(404, type, type === MARKDOWN ? NOT_FOUND_MARKDOWN : notFoundHtml);
    }

    const encodings = ['br', 'gzip', 'identity'];
    const encoding = new Negotiator(req).encoding(encodings, { preferred: encodings });
    if (!encoding) {
      res.setHeader('Cache-Control', 'no-store');
      return send(406, 'text/plain; charset=utf-8', ENCODING_NOT_ACCEPTABLE);
    }
    const selected = variants[type][encoding];
    res.setHeader('Cache-Control', 'public, max-age=60, must-revalidate');
    if (encoding !== 'identity') res.setHeader('Content-Encoding', encoding);
    res.setHeader('ETag', selected.etag);
    res.setHeader('Link', '<https://youraicoach.life/index.md>; rel="alternate"; type="text/markdown", <https://youraicoach.life/llms.txt>; rel="describedby"');
    const validators = String(req.headers['if-none-match'] || '').split(',').map(value => value.trim().replace(/^W\//, ''));
    if (validators.includes('*') || validators.includes(selected.etag)) {
      res.statusCode = 304;
      return res.end();
    }
    return send(200, type, selected.body);
  };
}
