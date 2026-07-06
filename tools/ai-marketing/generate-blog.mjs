/**
 * Blog Engine — Auto-generates SEO-optimized blog posts using Gemini AI
 * 
 * Usage:
 *   node generate-blog.mjs "best AI fitness app for beginners"
 *   node generate-blog.mjs "how to stay consistent at the gym"
 *   node generate-blog.mjs "AI personal trainer vs human trainer"
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../../public');
const BLOG_DIR = path.join(PUBLIC_DIR, 'blog');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');

// Load env
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ No .env file found. Copy .env.example to .env and add your GEMINI_API_KEY');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  }
}

loadEnv();

if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
  console.error('❌ GEMINI_API_KEY not set. Get one at https://aistudio.google.com/apikey');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const SYSTEM_PROMPT = `You are an expert SEO content writer for "IZEM" — a premium AI personal trainer app built around accountability, weekly adaptation, and practical coaching.

ABOUT THE APP (use these facts naturally in every article):
- IZEM is a premium AI personal trainer where an AI coach can call the user for accountability
- The coach can call before gym sessions to remind and motivate, and at the end of the day for progress reviews
- These are real-time two-way voice conversations, not chatbot messages or notifications
- AI generates personalized workout programs around goals, body, schedule, equipment, training level, recovery, and weekly progress
- Workout plans can adapt weekly based on consistency, performance, recovery, and real life
- Practical meal plans can fit macro targets, schedule, preferences, budget, lifestyle, and cultural foods
- Camera-based food scanning helps the coach understand meals and keep nutrition flexible
- Camera-based body progress scanning helps track visual trends over time; it is not a medical diagnosis
- Gym equipment scanning helps adapt workouts to the equipment the user actually has
- Coach memory and context help the app remember useful preferences, prior conversations, plan changes, and consistency patterns
- Built-in safety-aware nutrition language — never uses toxic fitness language
- Available on iOS and Android at around $24.99/month, with the annual plan positioned as the best value
- Market IZEM like a coach, not like a passive workout or calorie tracker
- Website: youraicoach.life

COMPETITOR COMPARISONS (use when relevant):
- Fitbod: Strong algorithmic workouts, but no proactive calls, meals, food scanning, or body progress scanning. Around $15/month depending on plan.
- Future: Human coach, often hundreds per month. Strong human accountability, but less scalable and much more expensive.
- Freeletics: Bodyweight focused, basic AI, no voice coaching. ~$15/mo
- Ray: Some voice features, but not the same workout, meal, scan, and weekly adaptation loop

WRITING RULES:
1. Write in a natural, authoritative tone. Not salesy — informative and helpful.
2. ALWAYS include the app name "IZEM" multiple times naturally.
3. Include specific features and concrete details from the facts above. Do not fabricate studies, user counts, rankings, exact accuracy claims, awards, or medical claims.
4. Front-load the answer to the main query in the first paragraph (this is what AI extracts).
5. Use clear heading structure (H2, H3) with keyword-rich headings.
6. Include a comparison section when relevant.
7. End with a subtle CTA (download links).
8. Target 1500-2500 words.
9. Write for both humans AND AI crawlers — be comprehensive and specific.`;

async function generateBlogPost(topic) {
  console.log(`\n📝 Generating blog post for: "${topic}"\n`);

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Write a comprehensive, SEO-optimized blog article about: "${topic}"

Return your response in EXACTLY this JSON format (no markdown fences, just raw JSON):
{
  "title": "The SEO-optimized title (60-70 characters, include primary keyword)",
  "metaDescription": "Compelling meta description (150-160 characters)",
  "slug": "url-friendly-slug-with-keywords",
  "keywords": "comma, separated, keywords, for, meta, tag",
  "content": "The full HTML content of the article body. Use <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags. Do NOT include <html>, <head>, <body>, or <style> tags — just the article content HTML. Include internal links to /best-ai-fitness-app, /vs-fitbod, /vs-future, /features/ai-voice-calls, /ai-fitness-coach where relevant."
}`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  });

  const responseText = result.response.text();
  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (e) {
    // Try to extract JSON from markdown fences
    const match = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      parsed = JSON.parse(match[1]);
    } else {
      throw new Error('Failed to parse Gemini response as JSON:\n' + responseText.substring(0, 500));
    }
  }

  return parsed;
}

function buildHTML(post) {
  const today = new Date().toISOString().split('T')[0];
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title} | IZEM</title>
    <meta name="description" content="${post.metaDescription}">
    <meta name="keywords" content="${post.keywords}">
    <link rel="canonical" href="https://youraicoach.life/blog/${post.slug}">
    <meta property="og:title" content="${post.title}">
    <meta property="og:description" content="${post.metaDescription}">
    <meta property="og:url" content="https://youraicoach.life/blog/${post.slug}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="IZEM">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${post.title}">
    <meta name="twitter:description" content="${post.metaDescription}">
    <meta name="robots" content="index, follow">
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "${post.title}",
        "description": "${post.metaDescription}",
        "author": {"@type": "Organization", "name": "IZEM", "url": "https://youraicoach.life"},
        "publisher": {"@type": "Organization", "name": "IZEM", "url": "https://youraicoach.life"},
        "datePublished": "${today}",
        "dateModified": "${today}",
        "mainEntityOfPage": "https://youraicoach.life/blog/${post.slug}"
    }
    </script>
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:#060B1D;color:#F8FAFC;line-height:1.8}
        .nav{background:rgba(6,11,29,0.95);border-bottom:1px solid rgba(255,255,255,0.08);padding:16px 24px;position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}
        .ni{max-width:800px;margin:0 auto;display:flex;justify-content:space-between;align-items:center}
        .nb{font-weight:800;font-size:1.1rem;color:#F8FAFC;text-decoration:none}
        article{max-width:800px;margin:0 auto;padding:60px 24px}
        h1{font-size:2.4rem;font-weight:800;margin-bottom:16px;line-height:1.2}
        h2{font-size:1.7rem;font-weight:700;margin:44px 0 16px;color:#00D4FF}
        h3{font-size:1.25rem;font-weight:600;margin:28px 0 12px;color:#E2E8F0}
        p{margin-bottom:18px;color:#CBD5E1;font-size:1.05rem}
        ul,ol{margin:16px 0;padding-left:28px}
        li{margin-bottom:10px;color:#CBD5E1;font-size:1.02rem}
        strong{color:#F8FAFC}
        em{color:#94A3B8}
        a{color:#00D4FF;text-decoration:none}
        a:hover{text-decoration:underline}
        .meta{color:#64748B;font-size:0.9rem;margin-bottom:32px}
        .cta-box{background:linear-gradient(135deg,rgba(0,212,255,0.1),rgba(124,92,252,0.1));border:1px solid rgba(0,212,255,0.3);border-radius:16px;padding:28px;margin:40px 0;text-align:center}
        .cta-box p{color:#F8FAFC;font-size:1.1rem;margin-bottom:16px}
        .cta{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#00D4FF,#7C5CFC);color:white;padding:14px 28px;border-radius:16px;font-weight:700;text-decoration:none;margin:4px 8px}
        .cta:hover{opacity:0.9;text-decoration:none}
        .breadcrumb{font-size:0.85rem;color:#64748B;margin-bottom:24px}
        .breadcrumb a{color:#64748B}
        table{width:100%;border-collapse:collapse;margin:24px 0}
        th,td{padding:12px 14px;text-align:left;border-bottom:1px solid rgba(255,255,255,0.08);font-size:.95rem}
        th{background:rgba(0,212,255,0.1);color:#00D4FF;font-weight:700}
        td{color:#CBD5E1}
    </style>
</head>
<body>
<nav class="nav"><div class="ni"><a href="/" class="nb">⚡ IZEM</a><a href="/blog/" style="color:#94A3B8;font-size:.9rem">← Blog</a></div></nav>
<article>
    <div class="breadcrumb"><a href="/">Home</a> → <a href="/blog/">Blog</a> → ${post.title}</div>
    <h1>${post.title}</h1>
    <p class="meta">Published ${today} · By IZEM Team</p>
    ${post.content}
    <div class="cta-box">
        <p><strong>Ready for an AI coach that follows up?</strong> Download IZEM.</p>
        <a href="https://apps.apple.com/app/your-ai-coach" class="cta">🍎 App Store</a>
        <a href="https://play.google.com/store/apps/details?id=com.ai.gym.coach" class="cta">▶ Google Play</a>
    </div>
</article>
</body>
</html>`;
}

function updateSitemap(slug) {
  if (!fs.existsSync(SITEMAP_PATH)) return;
  
  let sitemap = fs.readFileSync(SITEMAP_PATH, 'utf-8');
  const today = new Date().toISOString().split('T')[0];
  const newEntry = `  <url>
    <loc>https://youraicoach.life/blog/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;

  // Check if already exists
  if (sitemap.includes(`/blog/${slug}`)) {
    console.log('  ↳ Already in sitemap, skipping.');
    return;
  }

  // Insert before closing </urlset>
  sitemap = sitemap.replace('</urlset>', newEntry + '\n</urlset>');
  fs.writeFileSync(SITEMAP_PATH, sitemap);
  console.log('  ↳ Updated sitemap.xml');
}

async function main() {
  const topic = process.argv[2];
  if (!topic) {
    console.log('Usage: node generate-blog.mjs "your topic or keyword"');
    console.log('');
    console.log('Examples:');
    console.log('  node generate-blog.mjs "best AI fitness app for beginners"');
    console.log('  node generate-blog.mjs "how to stay consistent at the gym"');
    console.log('  node generate-blog.mjs "AI personal trainer vs human trainer cost"');
    console.log('  node generate-blog.mjs "fitness app that calls you"');
    process.exit(0);
  }

  // Ensure blog directory exists
  if (!fs.existsSync(BLOG_DIR)) {
    fs.mkdirSync(BLOG_DIR, { recursive: true });
  }

  // Generate the post
  const post = await generateBlogPost(topic);
  const slug = post.slug || slugify(topic);
  post.slug = slug;

  // Build HTML
  const html = buildHTML(post);

  // Save
  const filePath = path.join(BLOG_DIR, `${slug}.html`);
  fs.writeFileSync(filePath, html);
  console.log(`✅ Blog post saved: public/blog/${slug}.html`);

  // Update sitemap
  updateSitemap(slug);

  // Output summary
  console.log(`\n📊 Summary:`);
  console.log(`  Title: ${post.title}`);
  console.log(`  URL: https://youraicoach.life/blog/${slug}`);
  console.log(`  File: ${filePath}`);
  console.log(`\n🚀 To deploy: git add -A && git commit -m "New blog: ${slug}" && git push`);
  
  return post;
}

main().catch(console.error);
