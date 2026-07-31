/**
 * Blog Translation Script — Translates English blog posts into French, Spanish, Arabic.
 * Runs via GitHub Actions, 1 day after daily-blog.mjs publishes the English version.
 * 
 * Safety: Uses proper hreflang, x-default, separate canonicals, and unique translations.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../../public');
const BLOG_DIR = path.join(PUBLIC_DIR, 'blog');
const PROGRESS_FILE = path.join(__dirname, '.daily-progress.json');
const TRANSLATION_FILE = path.join(__dirname, '.translation-progress.json');
let GoogleGenerativeAI;

const LANGUAGES = [
  { code: 'fr', name: 'French', dir: 'ltr', label: 'Français',
    locale: 'France', food: 'quiche, ratatouille, crêpes protéinées', units: 'metric (kg, cm)', culture: 'French gym culture values aesthetics, functional fitness, and outdoor sports. Reference HIIT studios in Paris, CrossFit popularity.' },
  { code: 'es', name: 'Spanish', dir: 'ltr', label: 'Español',
    locale: 'Spain and Latin America', food: 'tortilla española, garbanzos, pollo con arroz integral', units: 'metric (kg, cm)', culture: 'Fitness culture varies — Spain loves padel and functional training, Latin America has huge bodybuilding and calisthenics communities.' },
  { code: 'ar', name: 'Arabic', dir: 'rtl', label: 'العربية',
    locale: 'Morocco, Middle East, North Africa', food: 'couscous, tajine, harira, msemen, dates', units: 'metric (kg, cm)', culture: 'Working out during Ramadan is huge. Reference gym culture in Dubai, Casablanca, Cairo. Mention halal nutrition naturally.' },
  { code: 'pt', name: 'Portuguese', dir: 'ltr', label: 'Português',
    locale: 'Brazil', food: 'açaí, frango com batata doce, pão de queijo, feijão', units: 'metric (kg, cm)', culture: 'Brazil is the #2 fitness market in the world. Reference beach body culture, CrossFit boxes, Bodytech gyms. Brazilians love group fitness and outdoor training.' },
  { code: 'de', name: 'German', dir: 'ltr', label: 'Deutsch',
    locale: 'Germany, Austria, Switzerland', food: 'Quark, Vollkornbrot, Hähnchenbrust, Magerquark mit Beeren', units: 'metric (kg, cm)', culture: 'Germans value efficiency, data, and structured programs. Reference McFit, FitX gyms. Precision and science-based training resonates strongly.' },
  { code: 'hi', name: 'Hindi', dir: 'ltr', label: 'हिन्दी',
    locale: 'India', food: 'paneer, dal, chana, roti, rajma, sprouts', units: 'metric (kg, cm)', culture: 'India has a massive fitness boom — reference Cult.fit, Gold Gym India. Vegetarian protein sources are essential. Cricket fitness crossover is popular.' },
  { code: 'tr', name: 'Turkish', dir: 'ltr', label: 'Türkçe',
    locale: 'Turkey', food: 'mercimek çorbası, yulaf, tavuk göğsü, yoğurt', units: 'metric (kg, cm)', culture: 'Turkish fitness culture is exploding — reference MAC gyms, Istanbul fitness scene. Ramadan training is relevant. Turkish people value community and accountability.' },
  { code: 'id', name: 'Indonesian', dir: 'ltr', label: 'Bahasa Indonesia',
    locale: 'Indonesia', food: 'tempe, tahu, nasi merah, ayam dada, telur rebus', units: 'metric (kg, cm)', culture: 'Indonesia has 270M people and a fast-growing fitness market. Reference Celebrity Fitness, Gold Gym Indonesia. Home workouts are hugely popular due to traffic.' },
  { code: 'ja', name: 'Japanese', dir: 'ltr', label: '日本語',
    locale: 'Japan', food: 'natto, edamame, tofu, grilled fish, brown rice', units: 'metric (kg, cm)', culture: 'Japan has the highest app spend per user globally. Reference Anytime Fitness Japan, RIZAP. Japanese value discipline, consistency, and kaizen (continuous improvement).' },
];

function writeStepSummary(lines) {
  if (!process.env.GITHUB_STEP_SUMMARY) return;
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
}

function loadTranslationProgress() {
  if (fs.existsSync(TRANSLATION_FILE)) {
    return JSON.parse(fs.readFileSync(TRANSLATION_FILE, 'utf-8'));
  }
  return { translated: [] };
}

function saveTranslationProgress(progress) {
  fs.writeFileSync(TRANSLATION_FILE, JSON.stringify(progress, null, 2));
}

function translationPath(slug, langCode) {
  return path.join(BLOG_DIR, langCode, `${slug}.html`);
}

function translationExists(slug, langCode) {
  return fs.existsSync(translationPath(slug, langCode));
}

function missingLanguages(slug) {
  return LANGUAGES.filter(lang => !translationExists(slug, lang.code));
}

function existingLanguageCount(slug) {
  return LANGUAGES.filter(lang => translationExists(slug, lang.code)).length;
}

function completeTranslatedSlugs(posts) {
  return posts
    .map(post => post.slug)
    .filter(slug => missingLanguages(slug).length === 0);
}

function buildHreflangTags(slug) {
  const availableLanguages = LANGUAGES.filter(lang => translationExists(slug, lang.code));
  return [
    `    <link rel="alternate" hreflang="en" href="https://youraicoach.life/blog/${slug}" />`,
    ...availableLanguages.map(lang => `    <link rel="alternate" hreflang="${lang.code}" href="https://youraicoach.life/blog/${lang.code}/${slug}" />`),
    `    <link rel="alternate" hreflang="x-default" href="https://youraicoach.life/blog/${slug}" />`,
  ].join('\n');
}

function buildLanguageLinks(slug) {
  const availableLanguages = LANGUAGES.filter(lang => translationExists(slug, lang.code));
  return [
    `<a href="/blog/${slug}">English</a>`,
    ...availableLanguages.map(lang => `<a href="/blog/${lang.code}/${slug}">${lang.label}</a>`),
  ].join(' | ');
}

function syncLanguageLinks(slug) {
  const hreflangTags = buildHreflangTags(slug);
  const langSwitcher = `<div class="lang-switcher">${buildLanguageLinks(slug)}</div>`;
  const files = [
    path.join(BLOG_DIR, `${slug}.html`),
    ...LANGUAGES
      .map(lang => translationPath(slug, lang.code))
      .filter(file => fs.existsSync(file)),
  ];

  for (const file of files) {
    let html = fs.readFileSync(file, 'utf-8');
    html = html.replace(
      /    <link rel="alternate" hreflang="en" href="https:\/\/youraicoach\.life\/blog\/[^"]+" \/>\n(?:    <link rel="alternate" hreflang="[a-z-]+" href="https:\/\/youraicoach\.life\/blog\/[^"]+" \/>\n)*    <link rel="alternate" hreflang="x-default" href="https:\/\/youraicoach\.life\/blog\/[^"]+" \/>/,
      hreflangTags,
    );
    html = html.replace(/<div class="lang-switcher">[\s\S]*?<\/div>/, langSwitcher);
    fs.writeFileSync(file, html);
  }
}

function syncAllLanguageLinks(posts) {
  for (const post of posts) {
    if (fs.existsSync(path.join(BLOG_DIR, `${post.slug}.html`))) {
      syncLanguageLinks(post.slug);
    }
  }
}

async function translatePost(post, lang, apiKey) {
  if (!GoogleGenerativeAI) {
    ({ GoogleGenerativeAI } = await import('@google/generative-ai'));
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const MODELS = ['gemini-3.1-flash-lite-preview', 'gemini-2.5-flash'];
  
  const prompt = `You are a fitness journalist who was born and raised in ${lang.locale}. You write for the biggest health and fitness publication in your country. You are writing this article in ${lang.name} for a local audience.

DO NOT TRANSLATE. REWRITE this article as if YOU wrote it originally in ${lang.name} for readers in ${lang.locale}.

LOCALIZATION RULES:
1. Write like a NATIVE ${lang.name} speaker — use natural expressions, local slang, and cultural references
2. Replace ALL food examples with local equivalents: use ${lang.food} instead of generic Western foods
3. Use ${lang.units} measurements throughout
4. Reference local fitness culture: ${lang.culture}
5. Keep the same structure (H2, H3, paragraphs, lists, blockquotes, tables) and similar length
6. Keep HTML tags intact. Keep all URLs/links unchanged
7. Keep brand names unchanged: "IZEM", "Fitbod", "Future", "Freeletics"
8. The tone should feel like a local expert talking to a friend — warm, knowledgeable, culturally aware
9. Include at least one local cultural reference that a translator would NEVER include
10. If mentioning meals or recipes, use meals that people in ${lang.locale} actually eat daily

Return ONLY valid JSON:
{
  "title": "Localized title that would grab a ${lang.name}-speaking reader",
  "metaDescription": "Localized meta description (150-155 chars)",
  "content": "Localized HTML content — NOT a translation, a native rewrite"
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
    <title>${translated.title} | IZEM</title>
    <meta name="description" content="${translated.metaDescription}">
    <link rel="canonical" href="https://youraicoach.life/blog/${lang.code}/${slug}" />
${buildHreflangTags(slug)}
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
        "author": {"@type": "Organization", "name": "IZEM", "url": "https://youraicoach.life"},
        "publisher": {"@type": "Organization", "name": "IZEM", "url": "https://youraicoach.life"},
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
        .lang-switcher{font-family:'Segoe UI',system-ui,sans-serif;text-align:center;padding:8px;font-size:0.8rem;color:#64748B;overflow-x:auto;white-space:nowrap}
        .lang-switcher a{color:#94A3B8;border:none;margin:0 4px}
    </style>
</head>
<body>
<div class="lang-switcher">${buildLanguageLinks(slug)}</div>
<nav class="nav"><div class="ni"><a href="/" class="nb">⚡ IZEM</a><a href="/blog/" style="color:#94A3B8;font-size:.9rem;border:none">← Blog</a></div></nav>
<article>
    <h1>${translated.title}</h1>
    <p class="meta">${readableDate} · IZEM Team</p>
    ${translated.content}
    <div class="cta-box">
        <p style="color:#CBD5E1;margin-bottom:16px"><strong>Try IZEM premium</strong></p>
        <a href="/izem-ai-fitness-coach/" class="cta">Explore IZEM</a>
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

function updateTranslationMetadata(blogProgress, translationProgress) {
  syncAllLanguageLinks(blogProgress.generated);

  const existingDates = new Map(translationProgress.translated.map(item => [item.slug, item.date]));
  const allCompleteTranslatedSlugs = completeTranslatedSlugs(blogProgress.generated);
  const today = new Date().toISOString().split('T')[0];
  translationProgress.translated = allCompleteTranslatedSlugs.map(slug => ({
    slug,
    date: existingDates.get(slug) || today,
  }));
  saveTranslationProgress(translationProgress);

  for (const lang of LANGUAGES) {
    const slugsForLanguage = blogProgress.generated
      .map(item => item.slug)
      .filter(slug => translationExists(slug, lang.code));
    updateLanguageSitemap(lang.code, slugsForLanguage);
  }
}

async function main() {
  // Load progress
  if (!fs.existsSync(PROGRESS_FILE)) {
    console.log('No blog posts to translate yet.');
    return;
  }
  const blogProgress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  const translationProgress = loadTranslationProgress();

  updateTranslationMetadata(blogProgress, translationProgress);
  if (process.env.SYNC_TRANSLATION_LINKS_ONLY === 'true') {
    console.log('✅ Synced translation links, progress, and language sitemaps.');
    return;
  }

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

  const postsMissingTranslations = blogProgress.generated.filter(post =>
    missingLanguages(post.slug).length > 0
  );
  
  if (postsMissingTranslations.length === 0) {
    console.log('✅ All posts already translated.');
    writeStepSummary([
      '## Translation summary',
      '',
      'No translation changes were needed.',
      `All ${blogProgress.generated.length} blog post(s) have every language file.`,
    ]);
    return;
  }

  // Translate the newest post that is still missing any language files.
  const post = postsMissingTranslations[postsMissingTranslations.length - 1];
  const languagesToTranslate = missingLanguages(post.slug);
  console.log(`\n🌍 Translating: "${post.title}" (${post.slug})`);
  writeStepSummary([
    '## Translation summary',
    '',
    `Selected post: \`${post.slug}\``,
    `Missing languages: ${languagesToTranslate.map(lang => lang.code.toUpperCase()).join(', ')}`,
  ]);

  // Read the English HTML to extract content
  const englishPath = path.join(BLOG_DIR, `${post.slug}.html`);
  if (!fs.existsSync(englishPath)) {
    console.error(`❌ English file not found: ${englishPath}`);
    process.exit(1);
  }
  const englishHTML = fs.readFileSync(englishPath, 'utf-8');
  
  // Extract content between <article> tags
  const contentMatch = englishHTML.match(/<article>([\s\S]*?)<\/article>/);
  if (!contentMatch) {
    console.error('❌ Could not extract article content');
    process.exit(1);
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

  for (let i = 0; i < languagesToTranslate.length; i++) {
    const lang = languagesToTranslate[i];
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

  if (indexNowUrls.length === 0) {
    console.error('❌ No translations were generated. Failing instead of marking this post translated.');
    writeStepSummary([
      '',
      'No translated files were generated, so the workflow failed before updating translation progress.',
    ]);
    process.exit(1);
  }

  updateTranslationMetadata(blogProgress, translationProgress);
  console.log('✅ Updated language sitemaps');

  // Ping IndexNow (push handled by GitHub Actions)
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
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
  }

  console.log(`\n📊 Translation Summary:`);
  console.log(`   Post: ${post.title}`);
  console.log(`   Languages attempted: ${languagesToTranslate.map(l => l.code.toUpperCase()).join(', ')}`);
  console.log(`   Total translated: ${translationProgress.translated.length}/${blogProgress.generated.length}`);
  writeStepSummary([
    '',
    `Translated slug: \`${post.slug}\``,
    `Languages attempted: ${languagesToTranslate.map(l => l.code.toUpperCase()).join(', ')}`,
    `Generated translated URL count: ${indexNowUrls.length}`,
    `Progress: ${translationProgress.translated.length}/${blogProgress.generated.length}`,
  ]);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
