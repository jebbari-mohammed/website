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

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function loadPosts() {
  if (!fs.existsSync(BLOG_DIR)) {
    console.log('⚠️ Blog directory does not exist yet');
    return [];
  }

  const files = fs.readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.html') && f !== 'index.html' && f !== 'feed.xml')
    .map(f => {
      const filePath = path.join(BLOG_DIR, f);
      const html = fs.readFileSync(filePath, 'utf-8');
      
      const titleMatch = html.match(/<title>([^|]+)\|/);
      const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
      const dateMatch = html.match(/"datePublished":\s*"([^"]+)"/);
      const robotsMatch = html.match(/<meta name="robots" content="([^"]+)"/i);
      const slug = f.replace('.html', '');

      if (robotsMatch && robotsMatch[1].toLowerCase().includes('noindex')) {
        return null;
      }
      
      return {
        slug,
        title: titleMatch ? titleMatch[1].trim() : slug,
        description: descMatch ? descMatch[1] : '',
        date: dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0],
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.date.localeCompare(a.date)); // newest first

  return files;
}

function buildIndex(posts) {
  const cards = posts.map(p => `
    <div class="card">
        <h2><a href="/blog/${p.slug}">${p.title}</a></h2>
        <p>${p.description}</p>
        <p class="meta">${p.date}</p>
    </div>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog — IZEM | Fitness, AI & Coaching Insights</title>
    <meta name="description" content="Expert articles on AI fitness coaching, workout optimization, nutrition planning, and how AI is transforming personal training.">
    <link rel="canonical" href="https://youraicoach.life/blog/">
    <meta name="robots" content="index, follow">
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;background:#060B1D;color:#F8FAFC;line-height:1.7}.nav{background:rgba(6,11,29,0.95);border-bottom:1px solid rgba(255,255,255,0.08);padding:16px 24px;position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}.ni{max-width:900px;margin:0 auto;display:flex;justify-content:space-between;align-items:center}.nb{font-weight:800;font-size:1.1rem;color:#F8FAFC;text-decoration:none}.c{max-width:900px;margin:0 auto;padding:60px 24px}h1{font-size:2.5rem;font-weight:800;margin-bottom:8px}p.sub{color:#94A3B8;font-size:1.1rem;margin-bottom:48px}a{color:#00D4FF;text-decoration:none}.card{background:rgba(12,18,50,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px;margin-bottom:20px;transition:all .3s}.card:hover{border-color:rgba(0,212,255,0.3);transform:translateY(-2px)}.card h2{font-size:1.3rem;font-weight:700;margin-bottom:8px}.card h2 a{color:#F8FAFC}.card h2 a:hover{color:#00D4FF}.card p{color:#94A3B8;font-size:.95rem;margin:0}.card .meta{font-size:.8rem;color:#475569;margin-top:12px}.cta-box{margin-top:48px;padding:24px;background:rgba(0,212,255,0.05);border:1px solid rgba(0,212,255,0.15);border-radius:16px;text-align:center}.cta{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#00D4FF,#7C5CFC);color:white;padding:12px 24px;border-radius:12px;font-weight:700;margin:4px}</style>
</head>
<body>
<nav class="nav"><div class="ni"><a href="/" class="nb">⚡ IZEM</a><a href="/" style="color:#94A3B8;font-size:.9rem">← Home</a></div></nav>
<div class="c">
    <h1>Blog</h1>
    <p class="sub">Expert insights on AI fitness coaching, workout science, and nutrition</p>
    ${cards || '<p style="color:#64748B;text-align:center;padding:40px">Coming soon!</p>'}
    <div class="cta-box">
        <p style="color:#CBD5E1;margin-bottom:12px"><strong>Want AI-powered fitness coaching?</strong></p>
        <a href="https://apps.apple.com/app/your-ai-coach" class="cta">🍎 App Store</a>
        <a href="https://play.google.com/store/apps/details?id=com.ai.gym.coach" class="cta">▶ Google Play</a>
    </div>
</div>
</body>
</html>`;
}

async function main() {
  console.log('🔍 Scanning blog posts...');
  const posts = loadPosts();
  console.log(`  Found ${posts.length} posts`);

  console.log('🏗️ Rebuilding index...');
  const html = buildIndex(posts);
  
  fs.writeFileSync(INDEX_PATH, html);
  console.log(`✅ Blog index rebuilt with ${posts.length} posts`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
