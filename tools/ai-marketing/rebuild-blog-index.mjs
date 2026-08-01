#!/usr/bin/env node
/**
 * Rebuild Blog Index — Scans all post HTML files and regenerates index.html
 * Runs automatically via GitHub Action whenever public/blog/ changes.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../../public');
const BLOG_DIR = path.join(PUBLIC_DIR, 'blog');
const INDEX_PATH = path.join(BLOG_DIR, 'index.html');
const FEED_PATH = path.join(BLOG_DIR, 'feed.xml');

function cleanTitle(title, slug) {
  return (title || slug)
    .replace(/\s*\|\s*IZEM\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim() || slug;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXml(value) {
  return String(value || '')
    .replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);)/gi, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function readPostMetadata(file) {
  const filePath = path.join(BLOG_DIR, file);
  const html = fs.readFileSync(filePath, 'utf-8');
  const robotsMatch = html.match(/<meta name="robots" content="([^"]+)"/i);
  const noindex = Boolean(robotsMatch && robotsMatch[1].toLowerCase().includes('noindex'));

  const slug = file.replace('.html', '');
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const descMatch = html.match(/<meta name="description" content="([^"]+)"/i);
  const dateMatch = html.match(/"datePublished":\s*"([^"]+)"/);

  return {
    slug,
    title: cleanTitle(titleMatch ? titleMatch[1] : slug, slug),
    description: descMatch ? descMatch[1] : '',
    date: dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0],
    noindex,
  };
}

function loadPosts() {
  if (!fs.existsSync(BLOG_DIR)) {
    console.log('⚠️ Blog directory does not exist yet');
    return [];
  }

  const files = fs.readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.html') && f !== 'index.html' && f !== 'feed.xml')
    .map(readPostMetadata)
    .filter(post => !post.noindex)
    .sort((a, b) => b.date.localeCompare(a.date)); // newest first

  return files;
}

function buildArchiveSection(posts) {
  const cards = posts.map(post => {
    return `            <a href="/blog/${post.slug}">${escapeHtml(post.title)} <span>${escapeHtml(post.date)}</span></a>`;
  }).join('\n');

  return `<!-- BLOG_ARCHIVE_START -->
    <section>
        <h2>All blog posts</h2>
        <p class="cluster-intro">Browse IZEM's indexable guides on AI coaching, practical workouts, nutrition, scans, and fitness accountability.</p>
        <div class="older">
${cards}
        </div>
    </section>
<!-- BLOG_ARCHIVE_END -->`;
}

function buildFallbackIndex(posts) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>IZEM Blog Archive</title><meta name="robots" content="index, follow"></head>
<body>${buildArchiveSection(posts)}</body>
</html>`;
}

function updateBlogIndex(posts) {
  const archive = buildArchiveSection(posts);

  if (!fs.existsSync(INDEX_PATH)) {
    fs.writeFileSync(INDEX_PATH, buildFallbackIndex(posts));
    return;
  }

  const html = fs.readFileSync(INDEX_PATH, 'utf-8');
  const markerPattern = /<!-- BLOG_ARCHIVE_START -->[\s\S]*?<!-- BLOG_ARCHIVE_END -->/;

  if (markerPattern.test(html)) {
    fs.writeFileSync(INDEX_PATH, html.replace(markerPattern, archive));
    return;
  }

  if (html.includes('</main>')) {
    fs.writeFileSync(INDEX_PATH, html.replace('</main>', `${archive}\n</main>`));
    return;
  }

  fs.writeFileSync(INDEX_PATH, buildFallbackIndex(posts));
}

function buildRSSFeed(posts) {
  const items = posts.map(p => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>https://youraicoach.life/blog/${p.slug}</link>
      <guid>https://youraicoach.life/blog/${p.slug}</guid>
      <description>${escapeXml(p.description)}</description>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    </item>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>IZEM Blog</title>
    <link>https://youraicoach.life/blog</link>
    <description>Expert insights on AI fitness coaching, workout science, and nutrition</description>
    <language>en</language>
    <atom:link href="https://youraicoach.life/blog/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`;
}

async function main() {
  console.log('🔍 Scanning blog posts...');
  const posts = loadPosts();
  console.log(`  Found ${posts.length} posts`);

  console.log('🏗️ Rebuilding index...');
  updateBlogIndex(posts);
  console.log(`✅ Blog archive refreshed with ${posts.length} posts`);

  console.log('🏗️ Rebuilding RSS feed...');
  fs.writeFileSync(FEED_PATH, buildRSSFeed(posts));
  console.log(`✅ RSS feed rebuilt with ${posts.length} posts`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
