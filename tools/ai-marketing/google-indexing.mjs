#!/usr/bin/env node

/**
 * Google discovery helper for ordinary editorial pages.
 *
 * Google's public sitemap ping endpoint is deprecated and does not accelerate
 * indexing. Ordinary blog pages should instead rely on:
 *   - a valid submitted sitemap,
 *   - accurate lastmod values,
 *   - crawlable internal links,
 *   - Search Console monitoring / URL Inspection where appropriate.
 *
 * This command intentionally performs no fake indexing notification.
 */

import https from 'node:https';

const SITEMAPS = [
  'https://youraicoach.life/sitemap.xml',
  'https://youraicoach.life/news-sitemap.xml',
  'https://youraicoach.life/video-sitemap.xml',
];

function check(url) {
  return new Promise((resolve) => {
    const request = https.get(url, { headers: { 'User-Agent': 'IZEM-SEO-Health/1.0' } }, (response) => {
      response.resume();
      resolve({ url, status: response.statusCode || 0 });
    });
    request.setTimeout(15000, () => request.destroy(new Error('timeout')));
    request.on('error', () => resolve({ url, status: 0 }));
  });
}

async function main() {
  console.log('Google sitemap ping is intentionally disabled because the endpoint is deprecated.');
  console.log('Checking that the public discovery files are reachable instead.');

  let failed = false;
  for (const url of SITEMAPS) {
    const result = await check(url);
    console.log(`${url} -> HTTP ${result.status || 'unreachable'}`);
    if (result.status && (result.status < 200 || result.status >= 400)) failed = true;
  }

  console.log('No Google Indexing API call was made for ordinary blog content.');
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
