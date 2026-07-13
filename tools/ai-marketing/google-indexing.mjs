/**
 * Google Sitemap Ping — Notifies Google of sitemap updates.
 * 
 * NOTE: Google's Indexing API only works for JobPosting and BroadcastEvent schema pages.
 * For regular blog posts, the correct approach is:
 *   1. Submit sitemap.xml to Google Search Console (one-time, already done via GSC)
 *   2. Ping Google's sitemap endpoint after each new post (this script)
 *   3. IndexNow (already wired into daily-blog.mjs) for Bing/Yandex
 *   4. Get backlinks — Google discovers pages fastest when other sites link to them
 * 
 * This script pings Google to re-crawl your sitemap after each new post.
 */

import https from 'https';

// ========================
// PING GOOGLE SITEMAP
// ========================
// This is the legitimate, documented way to notify Google of new content.
// Google crawls submitted sitemaps faster when pinged.
// Docs: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap

async function pingSitemap(sitemapUrl) {
  return new Promise((resolve) => {
    const encodedUrl = encodeURIComponent(sitemapUrl);
    const req = https.request({
      hostname: 'www.google.com',
      path: `/ping?sitemap=${encodedUrl}`,
      method: 'GET',
    }, (res) => {
      console.log(`  📡 Google sitemap ping: HTTP ${res.statusCode} for ${sitemapUrl}`);
      res.resume(); // Consume response data to free up memory and close the socket
      resolve(res.statusCode);
    });
    req.on('error', (err) => {
      console.log(`  ⚠️  Sitemap ping failed: ${err.message}`);
      resolve(0);
    });
    req.end();
  });
}

// ========================
// MAIN
// ========================
async function main() {
  console.log('📡 Pinging Google with updated sitemaps...');

  const sitemaps = [
    'https://youraicoach.life/sitemap.xml',
    'https://youraicoach.life/news-sitemap.xml',
  ];

  for (const sitemap of sitemaps) {
    const status = await pingSitemap(sitemap);
    if (status === 404) {
      console.warn(`  ⚠️  Google returned HTTP 404. Google deprecated and deactivated the public sitemap ping endpoint in late 2023.`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('⚠️ Google sitemap pings finished (Warning: Pings are deprecated and may be ignored by Google).');
  console.log('   IMPORTANT: You must manually submit/refresh your sitemap inside Google Search Console (GSC).');
  console.log('   Go to: https://search.google.com/search-console -> Sitemaps');
}

main().catch(err => {
  console.error('⚠️ Sitemap ping error:', err.message);
  // Non-fatal
});

