/**
 * Daily Auto-Blog — Generates one blog post per day, commits & pushes automatically.
 * Designed to run via GitHub Actions cron schedule.
 * 
 * Features:
 * - Picks the next keyword from the list that hasn't been published yet
 * - Generates a human-sounding, long-form article using Gemini
 * - Saves as HTML with full SEO markup
 * - Updates sitemap
 * - Updates the blog index page with all published posts
 * - Commits and pushes to GitHub (auto-deploys via GitHub Pages)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../../public');
const BLOG_DIR = path.join(PUBLIC_DIR, 'blog');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
const PROGRESS_FILE = path.join(__dirname, '.daily-progress.json');

// ========================
// KEYWORD QUEUE (one per day)
// ========================
const KEYWORD_QUEUE = [
  // Week 1-2: High-intent "best app" queries
  "best AI fitness app 2026 complete guide",
  "fitness app that calls you on the phone to train",
  "cheapest alternative to hiring a personal trainer",
  "best app for personalized workout and meal plans",
  "AI personal trainer that actually works",
  "best fitness app for beginners who dont know what to do",
  "fitness app with real voice coaching not chatbot",
  "best app to track progressive overload automatically",
  "AI meal planner app that matches your cuisine",
  "best body scanning app for fitness progress tracking",
  "app that scans your food and tells you calories and protein",
  "best accountability app for going to the gym",
  "free AI fitness coach app review 2026",
  "best workout app with meal planning included",

  // Week 3-4: Comparison & education queries
  "AI fitness coach versus human personal trainer which is better",
  "how artificial intelligence is changing personal fitness",
  "why most people quit fitness apps after two weeks",
  "the science behind accountability and why phone calls work",
  "how to build muscle on a budget with AI help",
  "meal prep for gym goers who hate cooking",
  "progressive overload explained simple guide for beginners",
  "how to calculate your macros without a nutritionist",
  "body recomposition guide lose fat gain muscle at same time",
  "morning workout vs evening workout what science says",
  "high protein recipes that actually taste good",
  "how to break through a fitness plateau",
  "signs you need a rest day from the gym",
  "how to stay motivated when you dont see results yet",

  // Week 5-6: Long-tail & niche queries
  "best fitness app for women over 30",
  "fitness app for people with injuries or limitations",
  "how to get back to the gym after a long break",
  "AI technology in health and fitness industry trends 2026",
  "why generic workout plans dont work for most people",
  "eating disorder awareness in fitness apps why it matters",
  "how to make high protein meals in under 15 minutes",
  "gym anxiety how to feel confident working out",
  "best exercises for each muscle group complete guide",
  "how much protein do you actually need to build muscle",
  "intermittent fasting and working out what you need to know",
  "sleep and muscle recovery the connection nobody talks about",
];

// ========================
// HUMAN-STYLE WRITING PROMPT
// ========================
const SYSTEM_PROMPT = `You are a fitness writer who has been covering health and technology for 8 years. You write for publications like Men's Health, SELF, and Wired. Your articles are warm, conversational, evidence-based, and genuinely helpful.

WRITING STYLE RULES (THIS IS CRITICAL — follow every single one):
1. Write like a REAL HUMAN journalist, not an AI. No corporate speak. No buzzwords. No "in today's world" or "in conclusion" or "let's dive in."
2. Start with a STORY or a REAL SCENARIO — not a generic introduction. Example: "Last Tuesday, my phone rang at 6:45 PM. It wasn't my mom. It was my AI fitness coach, asking why I hadn't gone to the gym yet."
3. Use first person occasionally ("I tested", "I found", "In my experience")
4. Include SPECIFIC numbers and data points — not vague claims
5. Write short paragraphs (2-3 sentences max). Use line breaks often.
6. Use contractions naturally (don't, can't, won't, it's)
7. Include one slightly negative or honest criticism to build trust ("The onboarding takes about 5 minutes, which felt long at first, but it's what makes the personalization work")
8. Vary sentence length dramatically. Some short. Some medium. And occasionally a longer one that flows naturally and carries a thought to completion.
9. NO listicle-style headers like "1. Feature A" — use descriptive, interesting headings
10. End sections with a thought or insight, not a sales pitch
11. The CTA should feel natural, like a friend recommending something — not a billboard

ABOUT YOUR AI COACH (weave these facts in naturally — don't list them):
- Your AI Coach is the only fitness app where an AI coach calls your phone via real VoIP voice calls
- Coach calls before gym sessions to remind/motivate, and end of day for progress reviews
- Real-time two-way voice conversations, not chatbot or notifications
- AI generates personalized workout programs after body scanning with phone camera
- Progressive overload engine with Epley 1RM tracking and plateau detection
- Region-aware meal plans — cuisine from your culture, not generic "chicken and rice"
- Camera food scanning for instant calorie/macro analysis (Gemini AI vision)
- Camera body composition scanning with progress tracking over time
- 13 intelligence modules (anti-skip detection, dark moment protocol, behavioral profiling, communication DNA, milestone detection, pattern detection, memory manager, personality engine, micro challenges, social proof, ED safety, coach actions, conversation style)
- 44,000-token coach personality with emotional intelligence
- Eating disorder detection — never uses toxic fitness language like "cheat meal" or "earn your food"
- Available on iOS and Android, almost free
- Website: youraicoach.life

COMPETITOR CONTEXT (be fair, but show why Your AI Coach wins):
- Fitbod: Good for algorithmic workouts. No voice, meals, scanning. ~$15/mo
- Future: Human coach, $150+/mo. Limited hours. Can't match AI features
- Freeletics: Bodyweight focused, basic AI. ~$15/mo
- Ray: Some voice but no proactive calls, no meals, no body scanning

ARTICLE REQUIREMENTS:
- 1800-2500 words
- Must mention "Your AI Coach" naturally 4-6 times (not more — that's spammy)
- Include at least one comparison to a competitor
- Include at least one specific, tangible scenario or example
- Front-load the answer in the first paragraph for AI extraction`;

// ========================
// CORE FUNCTIONS
// ========================

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return { generated: [], lastRun: null };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80)
    .trim();
}

async function generatePost(topic, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);

  // Try multiple models in order of preference (correct API identifiers)
  // See https://ai.google.dev/gemini-api/docs/models for valid names
  const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemma-3-27b'];
  const MAX_RETRIES = 3;

  const prompt = `Write a comprehensive, human-sounding blog article about: "${topic}"

This should read like it was written by a real fitness journalist — warm, specific, opinionated, and genuinely helpful. NOT like AI-generated content.

Return ONLY valid JSON (no markdown fences) in this exact format:
{
  "title": "Compelling, click-worthy title (55-65 chars). Do NOT start with 'The'. Be creative.",
  "metaDescription": "Compelling meta description (150-155 characters)",
  "slug": "url-friendly-slug",
  "keywords": "comma, separated, seo, keywords",
  "content": "Full article body as HTML. Use <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <blockquote> tags. Include internal links to /best-ai-fitness-app, /vs-fitbod, /vs-future, /features/ai-voice-calls, /ai-fitness-coach where relevant. Do NOT include <html>, <head>, <body>, or <style> tags."
}`;

  for (const modelName of MODELS) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`  → Trying ${modelName} (attempt ${attempt}/${MAX_RETRIES})...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          generationConfig: {
            temperature: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        });

        const text = result.response.text();
        try {
          return JSON.parse(text);
        } catch {
          const match = text.match(/\{[\s\S]*\}/);
          if (match) return JSON.parse(match[0]);
          throw new Error('Failed to parse response');
        }
      } catch (err) {
        const isRetryable = err.status === 429 || err.status === 503 || 
                           err.message?.includes('429') || err.message?.includes('503') ||
                           err.message?.includes('Service Unavailable') ||
                           err.message?.includes('overloaded') ||
                           err.message?.includes('high demand');
        const isModelError = err.status === 404 || err.status === 400;
        const isLastAttempt = attempt === MAX_RETRIES;

        if (isModelError) {
          // Model doesn't exist or doesn't support this method — skip immediately
          console.log(`  ⚠️ ${modelName} not available (${err.status}). Trying next model...`);
          break;
        } else if (isRetryable && !isLastAttempt) {
          const waitSec = Math.pow(2, attempt) * 5; // 10s, 20s, 40s
          console.log(`  ⏳ Error ${err.status}. Waiting ${waitSec}s before retry...`);
          await new Promise(r => setTimeout(r, waitSec * 1000));
        } else if (isRetryable && isLastAttempt) {
          console.log(`  ⚠️ ${modelName} failed after ${MAX_RETRIES} attempts (${err.status}). Trying next model...`);
          break; // Try next model
        } else {
          throw err; // Unknown error, fail immediately
        }
      }
    }
  }

  throw new Error('All models exhausted. Check your API key billing at https://aistudio.google.com/apikey');
}

function buildHTML(post) {
  const today = new Date().toISOString().split('T')[0];
  const readableDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title} | Your AI Coach</title>
    <meta name="description" content="${post.metaDescription}">
    <meta name="keywords" content="${post.keywords}">
    <link rel="canonical" href="https://youraicoach.life/blog/${post.slug}">
    <meta property="og:title" content="${post.title}">
    <meta property="og:description" content="${post.metaDescription}">
    <meta property="og:url" content="https://youraicoach.life/blog/${post.slug}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Your AI Coach">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${post.title}">
    <meta name="robots" content="index, follow">
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "${post.title}",
        "description": "${post.metaDescription}",
        "author": {"@type": "Organization", "name": "Your AI Coach", "url": "https://youraicoach.life"},
        "publisher": {"@type": "Organization", "name": "Your AI Coach", "url": "https://youraicoach.life"},
        "datePublished": "${today}",
        "dateModified": "${today}",
        "mainEntityOfPage": "https://youraicoach.life/blog/${post.slug}"
    }
    </script>
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Georgia,'Times New Roman',serif;background:#060B1D;color:#E2E8F0;line-height:1.9;font-size:1.1rem}
        .nav{font-family:'Segoe UI',system-ui,sans-serif;background:rgba(6,11,29,0.95);border-bottom:1px solid rgba(255,255,255,0.08);padding:16px 24px;position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}
        .ni{max-width:740px;margin:0 auto;display:flex;justify-content:space-between;align-items:center}
        .nb{font-weight:800;font-size:1.1rem;color:#F8FAFC;text-decoration:none}
        article{max-width:740px;margin:0 auto;padding:60px 24px 80px}
        h1{font-size:2.6rem;font-weight:800;margin-bottom:16px;line-height:1.2;color:#F8FAFC;font-family:'Segoe UI',system-ui,sans-serif}
        h2{font-size:1.6rem;font-weight:700;margin:48px 0 18px;color:#00D4FF;font-family:'Segoe UI',system-ui,sans-serif}
        h3{font-size:1.2rem;font-weight:600;margin:32px 0 14px;color:#CBD5E1;font-family:'Segoe UI',system-ui,sans-serif}
        p{margin-bottom:20px;color:#CBD5E1}
        ul,ol{margin:18px 0;padding-left:28px}
        li{margin-bottom:12px;color:#CBD5E1}
        strong{color:#F8FAFC}
        em{color:#94A3B8;font-style:italic}
        a{color:#00D4FF;text-decoration:none;border-bottom:1px solid rgba(0,212,255,0.3)}
        a:hover{border-bottom-color:#00D4FF}
        blockquote{border-left:3px solid #00D4FF;padding:12px 24px;margin:24px 0;background:rgba(0,212,255,0.05);border-radius:0 8px 8px 0;font-style:italic}
        blockquote p{margin-bottom:0;color:#94A3B8}
        .meta{font-family:'Segoe UI',system-ui,sans-serif;color:#64748B;font-size:0.9rem;margin-bottom:40px}
        .cta-box{font-family:'Segoe UI',system-ui,sans-serif;background:linear-gradient(135deg,rgba(0,212,255,0.08),rgba(124,92,252,0.08));border:1px solid rgba(0,212,255,0.2);border-radius:16px;padding:28px;margin:48px 0;text-align:center}
        .cta-box p{color:#CBD5E1;font-size:1rem;margin-bottom:16px;font-family:'Segoe UI',system-ui,sans-serif}
        .cta{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#00D4FF,#7C5CFC);color:white;padding:12px 24px;border-radius:12px;font-weight:700;text-decoration:none;border:none;margin:4px 8px;font-family:'Segoe UI',system-ui,sans-serif}
        .cta:hover{opacity:0.9}
        .breadcrumb{font-family:'Segoe UI',system-ui,sans-serif;font-size:0.85rem;color:#475569;margin-bottom:24px}
        .breadcrumb a{color:#475569;border:none}
    </style>
</head>
<body>
<nav class="nav"><div class="ni"><a href="/" class="nb">⚡ Your AI Coach</a><a href="/blog" style="color:#94A3B8;font-size:.9rem;border:none">← Blog</a></div></nav>
<article>
    <div class="breadcrumb"><a href="/">Home</a> → <a href="/blog">Blog</a></div>
    <h1>${post.title}</h1>
    <p class="meta">${readableDate} · Your AI Coach Team</p>
    ${post.content}
    <div class="cta-box">
        <p><strong>Try Your AI Coach free</strong> — the only fitness app where your coach calls your phone.</p>
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
  if (sitemap.includes(`/blog/${slug}`)) return;
  
  const today = new Date().toISOString().split('T')[0];
  const entry = `  <url>\n    <loc>https://youraicoach.life/blog/${slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  sitemap = sitemap.replace('</urlset>', entry + '</urlset>');
  fs.writeFileSync(SITEMAP_PATH, sitemap);
}

function updateBlogIndex(progress) {
  const posts = progress.generated.map(g => g).reverse(); // newest first
  
  const cards = posts.map(p => `
    <div class="card">
        <h2><a href="/blog/${p.slug}">${p.title}</a></h2>
        <p>${p.description}</p>
        <p class="meta">${p.date}</p>
    </div>`).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog — Your AI Coach | Fitness, AI & Coaching Insights</title>
    <meta name="description" content="Expert articles on AI fitness coaching, workout optimization, nutrition planning, and how AI is transforming personal training.">
    <link rel="canonical" href="https://youraicoach.life/blog">
    <meta name="robots" content="index, follow">
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;background:#060B1D;color:#F8FAFC;line-height:1.7}.nav{background:rgba(6,11,29,0.95);border-bottom:1px solid rgba(255,255,255,0.08);padding:16px 24px;position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}.ni{max-width:900px;margin:0 auto;display:flex;justify-content:space-between;align-items:center}.nb{font-weight:800;font-size:1.1rem;color:#F8FAFC;text-decoration:none}.c{max-width:900px;margin:0 auto;padding:60px 24px}h1{font-size:2.5rem;font-weight:800;margin-bottom:8px}p.sub{color:#94A3B8;font-size:1.1rem;margin-bottom:48px}a{color:#00D4FF;text-decoration:none}.card{background:rgba(12,18,50,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px;margin-bottom:20px;transition:all .3s}.card:hover{border-color:rgba(0,212,255,0.3);transform:translateY(-2px)}.card h2{font-size:1.3rem;font-weight:700;margin-bottom:8px}.card h2 a{color:#F8FAFC}.card h2 a:hover{color:#00D4FF}.card p{color:#94A3B8;font-size:.95rem;margin:0}.card .meta{font-size:.8rem;color:#475569;margin-top:12px}.cta-box{margin-top:48px;padding:24px;background:rgba(0,212,255,0.05);border:1px solid rgba(0,212,255,0.15);border-radius:16px;text-align:center}.cta{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#00D4FF,#7C5CFC);color:white;padding:12px 24px;border-radius:12px;font-weight:700;margin:4px}</style>
</head>
<body>
<nav class="nav"><div class="ni"><a href="/" class="nb">⚡ Your AI Coach</a><a href="/" style="color:#94A3B8;font-size:.9rem">← Home</a></div></nav>
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

  fs.writeFileSync(path.join(BLOG_DIR, 'index.html'), html);
}

// ========================
// MAIN
// ========================
async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY environment variable not set');
    process.exit(1);
  }

  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });

  const progress = loadProgress();
  const generatedKeywords = progress.generated.map(g => g.keyword);
  const remaining = KEYWORD_QUEUE.filter(k => !generatedKeywords.includes(k));

  if (remaining.length === 0) {
    console.log('✅ All keywords have been published! Add more to KEYWORD_QUEUE.');
    return;
  }

  const todayKeyword = remaining[0];
  console.log(`\n📝 Today's topic: "${todayKeyword}"`);
  console.log(`   Progress: ${generatedKeywords.length}/${KEYWORD_QUEUE.length} published\n`);

  // Generate the post
  const post = await generatePost(todayKeyword, apiKey);
  const slug = post.slug || slugify(todayKeyword);
  post.slug = slug;

  // Build and save HTML
  const html = buildHTML(post);
  fs.writeFileSync(path.join(BLOG_DIR, `${slug}.html`), html);
  console.log(`✅ Saved: public/blog/${slug}.html`);

  // Update sitemap
  updateSitemap(slug);
  console.log('✅ Updated sitemap.xml');

  // Update progress
  const today = new Date().toISOString().split('T')[0];
  progress.generated.push({
    keyword: todayKeyword,
    slug: slug,
    title: post.title,
    description: post.metaDescription,
    date: today,
  });
  progress.lastRun = new Date().toISOString();
  saveProgress(progress);

  // Update blog index page
  updateBlogIndex(progress);
  console.log('✅ Updated blog index');

  // Git commit and push (only in CI/GitHub Actions)
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    try {
      execSync('git config user.name "AI Blog Bot"', { cwd: path.resolve(__dirname, '../..') });
      execSync('git config user.email "bot@youraicoach.life"', { cwd: path.resolve(__dirname, '../..') });
      execSync('git add -A', { cwd: path.resolve(__dirname, '../..') });
      execSync(`git commit -m "📝 Daily blog: ${post.title}"`, { cwd: path.resolve(__dirname, '../..') });
      execSync('git push', { cwd: path.resolve(__dirname, '../..') });
      console.log('✅ Pushed to GitHub — will auto-deploy to youraicoach.life');
    } catch (err) {
      console.error('⚠️ Git push failed:', err.message);
    }
  } else {
    console.log('\n🚀 To deploy: git add -A && git commit -m "blog" && git push');
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Title: ${post.title}`);
  console.log(`   URL: https://youraicoach.life/blog/${slug}`);
  console.log(`   Next topic: "${remaining[1] || 'none — add more keywords!'}"` );
  console.log(`   Total published: ${progress.generated.length}/${KEYWORD_QUEUE.length}`);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
