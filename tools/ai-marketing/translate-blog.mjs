/**
 * Blog Translation Script — Translates English blog posts into French, Spanish, Arabic.
 * Runs via GitHub Actions, 1 day after daily-blog.mjs publishes the English version.
 * 
 * Safety: Uses proper hreflang, x-default, separate canonicals, and unique translations.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../../public');
const BLOG_DIR = path.join(PUBLIC_DIR, 'blog');
const PROGRESS_FILE = path.join(__dirname, '.daily-progress.json');
const TRANSLATION_FILE = path.join(__dirname, '.translation-progress.json');

const LANGUAGES = [
  { code: 'fr', name: 'French', dir: 'ltr', label: 'Français' },
  { code: 'es', name: 'Spanish', dir: 'ltr', label: 'Español' },
  { code: 'ar', name: 'Arabic', dir: 'rtl', label: 'العربية' },
];

function loadTranslationProgress() {
  if (fs.existsSync(TRANSLATION_FILE)) {
    return JSON.parse(fs.readFileSync(TRANSLATION_FILE, 'utf-8'));
  }
  return { translated: [] };
}

function saveTranslationProgress(progress) {
  fs.writeFileSync(TRANSLATION_FILE, JSON.stringify(progress, null, 2));
}

async function translatePost(post, lang, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const MODELS = ['gemini-3.1-flash-lite-preview', 'gemini-2.5-flash'];
  
  const prompt = `Translate this fitness blog article into ${lang.name}. 
DO NOT translate word-for-word. Write it naturally as a native ${lang.name} speaker would write it.
Keep the same structure (H2, H3, paragraphs, lists, blockquotes, tables).
Keep HTML tags intact. Keep all URLs/links unchanged.
Keep brand names unchanged: "Your AI Coach", "Fitbod", "Future", "Freeletics".

Return ONLY valid JSON:
{
  "title": "Translated title",
  "metaDescription": "Translated meta description (150-155 chars)",
  "content": "Translated HTML content"
}

ORIGINAL TITLE: ${post.title}
ORIGINAL META: ${post.metaDescription}
ORIGINAL CONTENT:
${post.content}`;

  for (const modelName of MODELS) {
    try {
      console.log(`  → Translating to ${lang.name} with ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      });
      
      const text = result.response.text();
      return JSON.parse(text);
    } catch (err) {
      const status = err.status || err.httpStatusCode || 'unknown';
      if ([404, 400].includes(Number(status))) {
        console.log(`  ⚠️ ${modelName} not available. Trying next...`);
        continue;
      }
      if ([429, 503].includes(Number(status))) {
        console.log(`  ⏳ ${modelName} rate limited (${status}). Trying next...`);
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Translation to ${lang.name} failed — all models exhausted`);
}

function buildTranslatedHTML(original, translated, lang, slug) {
  const today = new Date().toISOString().split('T')[0];
  const readableDate = new Date().toLocaleDateString(lang.code, { year: 'numeric', month: 'long', day: 'numeric' });
  const dirAttr = lang.dir === 'rtl' ? ' dir="rtl"' : '';
  const rtlStyles = lang.dir === 'rtl' ? 'text-align:right;' : '';

  return `<!DOCTYPE html>
<html lang="${lang.code}"${dirAttr}>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${translated.title} | Your AI Coach</title>
    <meta name="description" content="${translated.metaDescription}">
    <link rel="canonical" href="https://youraicoach.life/blog/${lang.code}/${slug}" />
    <link rel="alternate" hreflang="en" href="https://youraicoach.life/blog/${slug}" />
    <link rel="alternate" hreflang="fr" href="https://youraicoach.life/blog/fr/${slug}" />
    <link rel="alternate" hreflang="es" href="https://youraicoach.life/blog/es/${slug}" />
    <link rel="alternate" hreflang="ar" href="https://youraicoach.life/blog/ar/${slug}" />
    <link rel="alternate" hreflang="x-default" href="https://youraicoach.life/blog/${slug}" />
    <meta property="og:title" content="${translated.title}">
    <meta property="og:url" content="https://youraicoach.life/blog/${lang.code}/${slug}">
    <meta property="og:type" content="article">
    <meta name="robots" content="index, follow">
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "${translated.title}",
        "description": "${translated.metaDescription}",
        "inLanguage": "${lang.code}",
        "author": {"@type": "Organization", "name": "Your AI Coach", "url": "https://youraicoach.life"},
        "publisher": {"@type": "Organization", "name": "Your AI Coach", "url": "https://youraicoach.life"},
        "datePublished": "${today}",
        "dateModified": "${today}",
        "mainEntityOfPage": "https://youraicoach.life/blog/${lang.code}/${slug}"
    }
    </script>
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Georgia,'Times New Roman',serif;background:#060B1D;color:#E2E8F0;line-height:1.9;font-size:1.1rem;${rtlStyles}}
        .nav{font-family:'Segoe UI',system-ui,sans-serif;background:rgba(6,11,29,0.95);border-bottom:1px solid rgba(255,255,255,0.08);padding:16px 24px;position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}
        .ni{max-width:740px;margin:0 auto;display:flex;justify-content:space-between;align-items:center}
        .nb{font-weight:800;font-size:1.1rem;color:#F8FAFC;text-decoration:none}
        article{max-width:740px;margin:0 auto;padding:60px 24px 80px}
        h1{font-size:2.6rem;font-weight:800;margin-bottom:16px;line-height:1.2;color:#F8FAFC;font-family:'Segoe UI',system-ui,sans-serif}
        h2{font-size:1.6rem;font-weight:700;margin:48px 0 18px;color:#00D4FF;font-family:'Segoe UI',system-ui,sans-serif}
        h3{font-size:1.2rem;font-weight:600;margin:32px 0 14px;color:#CBD5E1;font-family:'Segoe UI',system-ui,sans-serif}
        p{margin-bottom:20px;color:#CBD5E1}
        ul,ol{margin:18px 0;padding-${lang.dir === 'rtl' ? 'right' : 'left'}:28px}
        li{margin-bottom:12px;color:#CBD5E1}
        strong{color:#F8FAFC}
        a{color:#00D4FF;text-decoration:none;border-bottom:1px solid rgba(0,212,255,0.3)}
        a:hover{border-bottom-color:#00D4FF}
        blockquote{border-${lang.dir === 'rtl' ? 'right' : 'left'}:3px solid #00D4FF;padding:12px 24px;margin:24px 0;background:rgba(0,212,255,0.05);border-radius:${lang.dir === 'rtl' ? '8px 0 0 8px' : '0 8px 8px 0'};font-style:italic}
        blockquote p{margin-bottom:0;color:#94A3B8}
        table{width:100%;border-collapse:collapse;margin:24px 0;font-family:'Segoe UI',system-ui,sans-serif;font-size:0.95rem}
        th{background:rgba(0,212,255,0.1);color:#00D4FF;padding:12px 16px;text-align:${lang.dir === 'rtl' ? 'right' : 'left'};border-bottom:2px solid rgba(0,212,255,0.2);font-weight:700}
        td{padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.06);color:#CBD5E1}
        .meta{font-family:'Segoe UI',system-ui,sans-serif;color:#64748B;font-size:0.9rem;margin-bottom:40px}
        .cta-box{font-family:'Segoe UI',system-ui,sans-serif;background:linear-gradient(135deg,rgba(0,212,255,0.08),rgba(124,92,252,0.08));border:1px solid rgba(0,212,255,0.2);border-radius:16px;padding:28px;margin:48px 0;text-align:center}
        .cta{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#00D4FF,#7C5CFC);color:white;padding:12px 24px;border-radius:12px;font-weight:700;text-decoration:none;border:none;margin:4px 8px}
        .lang-switcher{font-family:'Segoe UI',system-ui,sans-serif;text-align:center;padding:8px;font-size:0.85rem;color:#64748B}
        .lang-switcher a{color:#94A3B8;border:none;margin:0 6px}
    </style>
</head>
<body>
<div class="lang-switcher">
    <a href="/blog/${slug}">English</a> |
    <a href="/blog/fr/${slug}">Français</a> |
    <a href="/blog/es/${slug}">Español</a> |
    <a href="/blog/ar/${slug}">العربية</a>
</div>
<nav class="nav"><div class="ni"><a href="/" class="nb">⚡ Your AI Coach</a><a href="/blog" style="color:#94A3B8;font-size:.9rem;border:none">← Blog</a></div></nav>
<article>
    <h1>${translated.title}</h1>
    <p class="meta">${readableDate} · Your AI Coach Team</p>
    ${translated.content}
    <div class="cta-box">
        <p style="color:#CBD5E1;margin-bottom:16px"><strong>Try Your AI Coach free</strong></p>
        <a href="https://apps.apple.com/app/your-ai-coach" class="cta">🍎 App Store</a>
        <a href="https://play.google.com/store/apps/details?id=com.ai.gym.coach" class="cta">▶ Google Play</a>
    </div>
</article>
</body>
</html>`;
}

function updateLanguageSitemap(langCode, translatedSlugs) {
  const today = new Date().toISOString().split('T')[0];
  const urls = translatedSlugs.map(slug => `  <url>
    <loc>https://youraicoach.life/blog/${langCode}/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  fs.writeFileSync(path.join(PUBLIC_DIR, `sitemap-${langCode}.xml`), xml);
}

async function main() {
  // Multi-key support: each language can use a different key
  const apiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ].filter(Boolean);

  if (apiKeys.length === 0) {
    console.error('❌ No GEMINI_API_KEY environment variables set');
    process.exit(1);
  }
  console.log(`🔑 ${apiKeys.length} API key(s) available for translations`);

  // Load progress
  if (!fs.existsSync(PROGRESS_FILE)) {
    console.log('No blog posts to translate yet.');
    return;
  }
  const blogProgress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  const translationProgress = loadTranslationProgress();
  const alreadyTranslated = new Set(translationProgress.translated.map(t => t.slug));

  // Find untranslated posts
  const untranslated = blogProgress.generated.filter(p => !alreadyTranslated.has(p.slug));
  
  if (untranslated.length === 0) {
    console.log('✅ All posts already translated.');
    return;
  }

  // Translate the oldest untranslated post (1 per run to stay within quotas)
  const post = untranslated[0];
  console.log(`\n🌍 Translating: "${post.title}" (${post.slug})`);

  // Read the English HTML to extract content
  const englishPath = path.join(BLOG_DIR, `${post.slug}.html`);
  if (!fs.existsSync(englishPath)) {
    console.error(`❌ English file not found: ${englishPath}`);
    return;
  }
  const englishHTML = fs.readFileSync(englishPath, 'utf-8');
  
  // Extract content between <article> tags
  const contentMatch = englishHTML.match(/<article>([\s\S]*?)<\/article>/);
  if (!contentMatch) {
    console.error('❌ Could not extract article content');
    return;
  }
  // Get just the main content (skip h1, meta, cta-box)
  const articleContent = contentMatch[1]
    .replace(/<div class="breadcrumb">[\s\S]*?<\/div>/, '')
    .replace(/<h1>[\s\S]*?<\/h1>/, '')
    .replace(/<p class="meta">[\s\S]*?<\/p>/, '')
    .replace(/<div class="cta-box">[\s\S]*?<\/div>/, '')
    .replace(/<div style="margin:48px[\s\S]*?<\/div>/, '') // Remove related posts
    .trim();

  const postData = {
    title: post.title,
    metaDescription: post.description,
    content: articleContent,
  };

  const indexNowUrls = [];

  for (let i = 0; i < LANGUAGES.length; i++) {
    const lang = LANGUAGES[i];
    // Rotate keys: FR=key1, ES=key2, AR=key3 (cycles if fewer keys)
    const keyForLang = apiKeys[i % apiKeys.length];
    console.log(`  🔑 Using key #${(i % apiKeys.length) + 1} for ${lang.name}`);
    try {
      const translated = await translatePost(postData, lang, keyForLang);
      
      // Create language directory
      const langDir = path.join(BLOG_DIR, lang.code);
      if (!fs.existsSync(langDir)) fs.mkdirSync(langDir, { recursive: true });

      // Build and save translated HTML
      const html = buildTranslatedHTML(postData, translated, lang, post.slug);
      fs.writeFileSync(path.join(langDir, `${post.slug}.html`), html);
      console.log(`  ✅ Saved: blog/${lang.code}/${post.slug}.html`);

      indexNowUrls.push(`https://youraicoach.life/blog/${lang.code}/${post.slug}`);

      // Brief delay between translations to respect rate limits
      await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
      console.error(`  ❌ Failed to translate to ${lang.name}: ${err.message}`);
    }
  }

  // Update translation progress
  translationProgress.translated.push({ slug: post.slug, date: new Date().toISOString().split('T')[0] });
  saveTranslationProgress(translationProgress);

  // Update language sitemaps
  const allTranslatedSlugs = translationProgress.translated.map(t => t.slug);
  for (const lang of LANGUAGES) {
    updateLanguageSitemap(lang.code, allTranslatedSlugs);
  }
  console.log('✅ Updated language sitemaps');

  // Git push in CI
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    try {
      const ROOT = path.resolve(__dirname, '../..');
      execSync('git config user.name "AI Blog Bot"', { cwd: ROOT });
      execSync('git config user.email "bot@youraicoach.life"', { cwd: ROOT });
      execSync('git add -A', { cwd: ROOT });
      execSync(`git commit -m "🌍 Translations: ${post.slug} (fr/es/ar)"`, { cwd: ROOT });
      execSync('git pull --rebase origin main || true', { cwd: ROOT });
      execSync('git push || (sleep 5 && git pull --rebase origin main && git push)', { cwd: ROOT, shell: '/bin/bash' });
      console.log('✅ Pushed translations to GitHub');

      // Ping IndexNow
      if (indexNowUrls.length > 0) {
        try {
          await fetch('https://api.indexnow.org/indexnow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ host: 'youraicoach.life', key: 'a591ef961c787bfb23212d390a9d5a0c', urlList: indexNowUrls }),
          });
          console.log(`✅ IndexNow pinged ${indexNowUrls.length} translated URLs`);
        } catch (e) { console.log('⚠️ IndexNow ping failed'); }
      }
    } catch (err) {
      console.error('⚠️ Git push failed:', err.message);
    }
  }

  console.log(`\n📊 Translation Summary:`);
  console.log(`   Post: ${post.title}`);
  console.log(`   Languages: FR, ES, AR`);
  console.log(`   Total translated: ${translationProgress.translated.length}/${blogProgress.generated.length}`);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
