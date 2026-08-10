#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const BLOG_DIR = path.join(PUBLIC_DIR, 'blog');
const SEO_DIR = path.join(ROOT, 'data/marketing-employee/seo-growth');
const PLAN_PATH = path.join(SEO_DIR, 'latest.json');
const STATE_PATH = path.join(SEO_DIR, 'publish-state.json');
const LAST_PUBLISH_PATH = path.join(SEO_DIR, 'last-publish.json');
const SITE_ORIGIN = 'https://youraicoach.life';
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

const PRODUCT_FACTS = [
  'IZEM is an AI fitness coach built around personalized workout planning, practical meal planning, progress review, adaptation, and accountability.',
  'IZEM can use proactive two-way voice calls for accountability before workouts and for day review.',
  'IZEM can adapt training around schedule, equipment, training level, goals, recovery, consistency, and plan changes.',
  'IZEM can support food, body-progress, and gym-equipment scanning. These are product features, not medical diagnosis tools.',
  'IZEM should be described as coaching software, not as a doctor, dietitian, physiotherapist, or guaranteed replacement for qualified professionals.',
];

const FORBIDDEN_PATTERNS = [
  /\bguarantee(?:d|s)?\b/i,
  /\bscientifically proven\b/i,
  /\bclinically proven\b/i,
  /\bresearch proves\b/i,
  /\bstudies prove\b/i,
  /\bdiagnos(?:e|es|ed|ing)\b/i,
  /\bcure(?:s|d|ing)?\b/i,
  /\bzero risk\b/i,
  /\b100% accurate\b/i,
  /\bthe best app in the world\b/i,
];

function readJson(file, fallback = undefined) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT' && fallback !== undefined) return fallback;
    throw error;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function setOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${String(value).replace(/\r?\n/g, ' ')}\n`);
}

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 84);
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHtml(value = '') {
  return String(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeGeneratedHtml(value = '') {
  return String(value)
    .replace(/<\/?(?:html|head|body|script|style|iframe|form|input|button|meta|link|object|embed)[^>]*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(["']).*?\1/gi, '')
    .replace(/\sstyle\s*=\s*(["']).*?\1/gi, '')
    .replace(/href\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, 'href="#"')
    .replace(/<a\b([^>]*?)href\s*=\s*(["'])(https?:\/\/[^"']+)\2([^>]*)>/gi, (match, before, quote, href, after) => {
      try {
        const url = new URL(href);
        if (url.origin === SITE_ORIGIN) return `<a${before}href=${quote}${url.pathname}${quote}${after}>`;
      } catch {}
      return `<span>`;
    })
    .replace(/<\/a>/gi, '</a>');
}

function parseModelJson(text) {
  const cleaned = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first >= 0 && last > first) return JSON.parse(cleaned.slice(first, last + 1));
    throw error;
  }
}

function daysBetween(iso, now = new Date()) {
  if (!iso) return Number.POSITIVE_INFINITY;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return Number.POSITIVE_INFINITY;
  return (now.getTime() - then.getTime()) / 86400000;
}

function actionKey(item) {
  return `${item.action || ''}|${item.query || ''}|${item.targetPage || ''}`;
}

function isWithinCooldown(item, state) {
  const prior = state.actions?.[actionKey(item)];
  const cooldownDays = item.action === 'refresh' ? 14 : 60;
  return prior && daysBetween(prior.at) < cooldownDays;
}

function createPathForQuery(query) {
  return path.join(BLOG_DIR, `${slugify(query)}.html`);
}

function selectOpportunity(plan, state) {
  const candidates = (plan.opportunities || []).filter((item) => item.action === 'refresh' || item.action === 'create');
  for (const item of candidates) {
    if (isWithinCooldown(item, state)) continue;
    if (item.action === 'create' && fs.existsSync(createPathForQuery(item.query))) continue;
    if (item.action === 'refresh' && !resolveTargetFile(item.targetPage)) continue;
    return item;
  }
  return null;
}

function resolveTargetFile(urlValue) {
  if (!urlValue) return '';
  let pathname;
  try {
    const url = new URL(urlValue, SITE_ORIGIN);
    if (url.origin !== SITE_ORIGIN) return '';
    pathname = decodeURIComponent(url.pathname).replace(/\/$/, '');
  } catch {
    return '';
  }

  if (!pathname) pathname = '/';
  const relative = pathname.replace(/^\//, '');
  const candidates = pathname === '/'
    ? [path.join(PUBLIC_DIR, 'index.html')]
    : [
        path.join(PUBLIC_DIR, `${relative}.html`),
        path.join(PUBLIC_DIR, relative, 'index.html'),
      ];
  return candidates.find((file) => fs.existsSync(file)) || '';
}

function compactOpportunity(item) {
  return {
    action: item.action,
    query: item.query,
    score: item.score,
    reason: item.reason,
    targetPage: item.targetPage,
    currentPages: item.currentPages,
    metrics: item.metrics,
    diagnostics: item.diagnostics,
    brief: item.brief,
  };
}

function internalLinksHtml(brief = {}) {
  const links = (brief.internalLinks || [])
    .filter((item) => item?.url)
    .slice(0, 5)
    .map((item) => {
      let href = item.url;
      try {
        const url = new URL(item.url, SITE_ORIGIN);
        href = url.origin === SITE_ORIGIN ? url.pathname : '';
      } catch {}
      if (!href || !href.startsWith('/')) return '';
      return `<li><a href="${escapeHtml(href)}">${escapeHtml(item.title || href)}</a></li>`;
    })
    .filter(Boolean);
  if (!links.length) return '';
  return `<h2>Useful IZEM guides for the next step</h2><ul>${links.join('')}</ul>`;
}

function validateGeneratedContent({ action, query, directAnswer = '', bodyHtml = '', title = '', metaDescription = '' }) {
  const text = stripHtml(`${directAnswer} ${bodyHtml}`);
  const words = text.split(/\s+/).filter(Boolean).length;
  const minWords = action === 'create' ? 900 : 300;
  const issues = [];

  if (words < minWords) issues.push(`generated content is too thin (${words} words; minimum ${minWords})`);
  if (!/<h2\b/i.test(bodyHtml)) issues.push('generated body has no H2 sections');
  if (title.length < 25 || title.length > 75) issues.push(`title length ${title.length} is outside 25-75 characters`);
  if (metaDescription.length < 90 || metaDescription.length > 175) issues.push(`meta description length ${metaDescription.length} is outside 90-175 characters`);

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) issues.push(`blocked claim pattern: ${pattern}`);
  }

  const exactMatches = text.toLowerCase().split(String(query).toLowerCase()).length - 1;
  if (exactMatches > 12) issues.push(`exact target query repeated ${exactMatches} times`);

  if (/<script\b|<iframe\b|javascript:/i.test(bodyHtml)) issues.push('unsafe HTML detected');

  if (issues.length) {
    throw new Error(`Quality gate rejected ${action} for “${query}”: ${issues.join('; ')}`);
  }
  return { words };
}

async function generateWithFallback(prompt) {
  const keys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2, process.env.GEMINI_API_KEY_3].filter(Boolean);
  if (!keys.length) throw new Error('No Gemini API key configured.');
  let lastError;

  for (const key of keys) {
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({
        model: DEFAULT_MODEL,
        systemInstruction: {
          parts: [{ text: 'You are a careful senior SEO editor for a fitness coaching product. Optimize for people first. Never fabricate evidence, statistics, testimonials, rankings, medical outcomes, competitor features, or competitor prices. Return valid JSON only.' }],
        },
      });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      });
      return parseModelJson(result.response.text());
    } catch (error) {
      lastError = error;
      console.warn(`Gemini key failed for ${DEFAULT_MODEL}: ${error.message}`);
    }
  }
  throw new Error(`All Gemini keys failed. Last error: ${lastError?.message || 'unknown'}`);
}

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function buildCreatePage(item, generated, slug) {
  const today = new Date().toISOString().slice(0, 10);
  const url = `${SITE_ORIGIN}/blog/${slug}`;
  const bodyHtml = sanitizeGeneratedHtml(generated.articleHtml || '');
  const directAnswer = stripHtml(generated.directAnswer || '');
  const faq = Array.isArray(generated.faq)
    ? generated.faq.filter((entry) => entry?.question && entry?.answer).slice(0, 5)
    : [];
  const title = stripHtml(generated.title || item.query);
  const metaDescription = stripHtml(generated.metaDescription || '');
  const validation = validateGeneratedContent({ action: 'create', query: item.query, directAnswer, bodyHtml, title, metaDescription });

  const articleSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: title,
        description: metaDescription,
        author: { '@type': 'Person', name: 'Mohammed Jebbari', url: `${SITE_ORIGIN}/about` },
        publisher: { '@type': 'Organization', name: 'IZEM', url: SITE_ORIGIN },
        datePublished: today,
        dateModified: today,
        mainEntityOfPage: url,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_ORIGIN}/blog/` },
          { '@type': 'ListItem', position: 3, name: title, item: url },
        ],
      },
      ...(faq.length ? [{
        '@type': 'FAQPage',
        mainEntity: faq.map((entry) => ({
          '@type': 'Question',
          name: stripHtml(entry.question),
          acceptedAnswer: { '@type': 'Answer', text: stripHtml(entry.answer) },
        })),
      }] : []),
    ],
  };

  const faqHtml = faq.length
    ? `<section class="faq"><h2>FAQ</h2>${faq.map((entry) => `<h3>${escapeHtml(stripHtml(entry.question))}</h3><p>${escapeHtml(stripHtml(entry.answer))}</p>`).join('')}</section>`
    : '';

  const related = internalLinksHtml(item.brief);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}">
  <link rel="canonical" href="${url}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="IZEM">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(metaDescription)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${SITE_ORIGIN}/images/izem-app-logo-512.png">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">${jsonLd(articleSchema)}</script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}body{background:#081019;color:#EAF0F7;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.72}a{color:#42C7C3;text-decoration:none}a:hover{text-decoration:underline}.nav{background:rgba(8,16,25,.95);border-bottom:1px solid rgba(255,255,255,.09);padding:16px 24px;position:sticky;top:0;z-index:20}.nav-in{max-width:960px;margin:auto;display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap}.brand{font-weight:900;color:#F8FAFC}.hero{background:linear-gradient(135deg,#081019,#152235 60%,#17352F);border-bottom:1px solid rgba(255,255,255,.09)}.hero-in{max-width:960px;margin:auto;padding:64px 24px}.eyebrow{color:#9CE8DC;font-size:.78rem;font-weight:850;text-transform:uppercase;letter-spacing:.08em;margin-bottom:16px}h1{font-size:clamp(2.15rem,5vw,4rem);line-height:1.05;letter-spacing:-.03em;max-width:900px}main{max-width:860px;margin:auto;padding:48px 24px 88px}.answer,.disclosure,.cta{border:1px solid rgba(255,255,255,.11);border-radius:10px;padding:22px;margin-bottom:26px}.answer{background:rgba(66,199,195,.09);border-color:rgba(66,199,195,.3)}.disclosure{background:rgba(255,255,255,.035);color:#AEBBCC;font-size:.94rem}h2{font-size:clamp(1.5rem,3vw,2.15rem);margin:44px 0 15px;color:#F8FAFC}h3{font-size:1.18rem;margin:26px 0 10px;color:#F8FAFC}p{color:#D1DBE7;margin-bottom:18px;font-size:1.03rem}ul,ol{padding-left:24px;margin:14px 0 24px}li{margin-bottom:9px;color:#D1DBE7}table{width:100%;border-collapse:collapse;margin:20px 0 28px;display:block;overflow-x:auto}th,td{padding:12px;border:1px solid rgba(255,255,255,.1);text-align:left}.cta{margin-top:42px;text-align:center;background:rgba(66,199,195,.07)}.button{display:inline-flex;background:#42C7C3;color:#041515;font-weight:900;padding:12px 18px;border-radius:8px;margin-top:8px}.meta{color:#7C8A9B;margin-top:12px}.faq{margin-top:38px}@media(max-width:700px){.hero-in{padding-top:48px}main{padding-top:36px}}
  </style>
</head>
<body>
<nav class="nav"><div class="nav-in"><a class="brand" href="/">IZEM</a><div><a href="/izem-ai-fitness-coach/">AI Coach</a> · <a href="/blog/">Blog</a> · <a href="/tools/">Tools</a></div></div></nav>
<header class="hero"><div class="hero-in"><div class="eyebrow">IZEM practical fitness guide</div><h1>${escapeHtml(title)}</h1><p class="meta">Published ${today} · Mohammed Jebbari / IZEM</p></div></header>
<main>
  <div class="answer"><p><strong>Direct answer:</strong> ${escapeHtml(directAnswer)}</p></div>
  <div class="disclosure"><p><strong>Editorial note:</strong> IZEM publishes this guide and may mention its own product. This page is informational, uses disclosed AI assistance in the editorial workflow, and does not replace medical or other qualified professional advice.</p></div>
  ${bodyHtml}
  ${related}
  ${faqHtml}
  <div class="cta"><p><strong>Want coaching that follows up instead of only tracking?</strong></p><a class="button" href="/izem-ai-fitness-coach/">Explore IZEM AI Fitness Coach</a></div>
</main>
</body>
</html>`;

  return { html, title, metaDescription, directAnswer, words: validation.words, url };
}

function replaceMetaDescription(html, description) {
  const escaped = escapeHtml(description);
  if (/<meta\s+name=["']description["'][^>]*>/i.test(html)) {
    return html.replace(/<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${escaped}">`);
  }
  return html.replace(/<head(\s[^>]*)?>/i, (match) => `${match}\n  <meta name="description" content="${escaped}">`);
}

function applyRefresh(item, generated, targetFile) {
  let html = fs.readFileSync(targetFile, 'utf8');
  const title = stripHtml(generated.title || html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || item.query);
  const metaDescription = stripHtml(generated.metaDescription || '');
  const bodyHtml = sanitizeGeneratedHtml(generated.sectionHtml || '');
  const directAnswer = stripHtml(generated.directAnswer || '');
  const heading = stripHtml(generated.sectionHeading || `A practical update for ${item.query}`);
  const validation = validateGeneratedContent({ action: 'refresh', query: item.query, directAnswer, bodyHtml, title, metaDescription });
  const marker = crypto.createHash('sha1').update(item.query).digest('hex').slice(0, 10);
  const related = internalLinksHtml(item.brief);
  const section = `<!-- SEO_GROWTH_REFRESH_START:${marker} -->
<section data-seo-growth-refresh="${marker}">
  <h2>${escapeHtml(heading)}</h2>
  ${directAnswer ? `<p><strong>Updated answer:</strong> ${escapeHtml(directAnswer)}</p>` : ''}
  ${bodyHtml}
  ${related}
</section>
<!-- SEO_GROWTH_REFRESH_END:${marker} -->`;
  const existing = new RegExp(`<!-- SEO_GROWTH_REFRESH_START:${marker} -->[\\s\\S]*?<!-- SEO_GROWTH_REFRESH_END:${marker} -->`, 'i');

  if (existing.test(html)) {
    html = html.replace(existing, section);
  } else if (/<\/article>/i.test(html)) {
    html = html.replace(/<\/article>/i, `${section}\n</article>`);
  } else if (/<\/main>/i.test(html)) {
    html = html.replace(/<\/main>/i, `${section}\n</main>`);
  } else {
    html = html.replace(/<\/body>/i, `${section}\n</body>`);
  }

  const expectedCtr = Number(item.diagnostics?.expectedCtrHeuristic || 0);
  const currentCtr = Number(item.metrics?.ctr || 0);
  const snippetUnderperforming = expectedCtr > 0 && currentCtr < expectedCtr * 0.7;
  if (snippetUnderperforming) {
    html = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
    html = replaceMetaDescription(html, metaDescription);
  }

  const today = new Date().toISOString().slice(0, 10);
  html = html.replace(/("dateModified"\s*:\s*")[^"]+("\s*)/g, `$1${today}$2`);
  fs.writeFileSync(targetFile, html, 'utf8');
  return {
    title,
    metaDescription,
    directAnswer,
    words: validation.words,
    url: item.targetPage,
    snippetUpdated: snippetUnderperforming,
  };
}

function createPrompt(item, currentPageText = '') {
  const brief = item.brief || {};
  const metrics = item.metrics || {};
  const related = (brief.relatedQueries || []).join('; ') || 'none';
  const internalLinks = (brief.internalLinks || []).map((link) => `${link.title || ''} -> ${link.url || ''}`).join('\n') || 'none';
  const mustDo = (brief.mustDo || []).join('\n- ') || 'none';
  const quality = (brief.qualityGates || []).join('\n- ') || 'none';
  const currentContext = currentPageText
    ? `\nCURRENT PAGE EXCERPT (preserve useful unique content; do not repeat it):\n${currentPageText.slice(0, 9000)}\n`
    : '';

  const modeRules = item.action === 'refresh'
    ? `Return JSON with keys: title, metaDescription, directAnswer, sectionHeading, sectionHtml. sectionHtml must be a NEW additive section that fills the most important missing intent for this query without repeating the current page. Aim for roughly 350-700 genuinely useful words. Do not rewrite the full page.`
    : `Return JSON with keys: title, metaDescription, directAnswer, articleHtml, faq. articleHtml must be a complete substantial article body using h2/h3/p/ul/ol/table tags where useful, roughly 1100-1800 useful words. faq must be an array of 2-5 objects with question and answer. Do not include h1, html, head, body, script, style, meta, forms, or images.`;

  return `Create a ${item.action.toUpperCase()} SEO deliverable for IZEM based on LIVE Google Search Console evidence.

TARGET QUERY: ${item.query}
ACTION: ${item.action}
WHY NOW: ${item.reason || ''}
GSC: ${metrics.clicks || 0} clicks, ${metrics.impressions || 0} impressions, ${((metrics.ctr || 0) * 100).toFixed(2)}% CTR, average position ${(metrics.position || 0).toFixed(1)}
SEARCH INTENT: ${brief.intent || 'informational'}
CONTENT ANGLE: ${brief.contentAngle || ''}
SAME-PAGE RELATED QUERIES: ${related}

PRODUCT FACTS YOU MAY USE:
- ${PRODUCT_FACTS.join('\n- ')}

RELEVANT INTERNAL LINKS:
${internalLinks}

MUST DO:
- ${mustDo}

QUALITY GATES:
- ${quality}
${currentContext}

RULES:
- Answer the query immediately and clearly. Do not begin with generic SEO filler.
- Write for the reader, not for a keyword counter.
- Use related query variants only when they share the same intent.
- Add an original first-party framework, checklist, decision tree, or workflow that is genuinely useful.
- Be transparent that IZEM publishes the page when IZEM is compared or recommended.
- Never invent statistics, studies, experts, testimonials, rankings, medical outcomes, competitor capabilities, or competitor prices.
- Do not make treatment, diagnosis, injury, or eating-disorder claims.
- Avoid fake personal experience and phrases such as “I tested” unless that experience is supplied here (it is not).
- Do not use external links. Use only the supplied IZEM internal URLs when linking.
- Do not repeat the exact target phrase unnaturally.

${modeRules}

Return valid JSON only.`;
}

async function main() {
  setOutput('changed', 'false');
  setOutput('action', 'none');
  setOutput('slug', '');

  const plan = readJson(PLAN_PATH, null);
  if (!plan || plan.status === 'needs-gsc-data' || !Array.isArray(plan.opportunities)) {
    console.log('No fresh GSC-backed plan is available. Publishing is skipped.');
    return;
  }

  const state = readJson(STATE_PATH, { version: 1, actions: {} });
  const item = selectOpportunity(plan, state);
  if (!item) {
    console.log('No eligible CREATE/REFRESH opportunity remains after cooldown and file checks. Publishing is skipped.');
    return;
  }

  console.log(`Selected ${item.action.toUpperCase()} — “${item.query}” (score ${item.score}/100)`);
  let currentPageText = '';
  let targetFile = '';
  if (item.action === 'refresh') {
    targetFile = resolveTargetFile(item.targetPage);
    if (!targetFile) throw new Error(`Could not map refresh target to a public HTML file: ${item.targetPage}`);
    currentPageText = stripHtml(fs.readFileSync(targetFile, 'utf8'));
  }

  const generated = await generateWithFallback(createPrompt(item, currentPageText));
  let result;
  let slug = '';
  if (item.action === 'create') {
    fs.mkdirSync(BLOG_DIR, { recursive: true });
    slug = slugify(item.query);
    const outputFile = path.join(BLOG_DIR, `${slug}.html`);
    if (fs.existsSync(outputFile)) throw new Error(`CREATE would overwrite an existing page: ${outputFile}`);
    result = buildCreatePage(item, generated, slug);
    fs.writeFileSync(outputFile, result.html, 'utf8');
    targetFile = outputFile;
  } else {
    result = applyRefresh(item, generated, targetFile);
    try {
      const targetUrl = new URL(item.targetPage);
      slug = targetUrl.pathname.split('/').filter(Boolean).pop() || '';
    } catch {}
  }

  const now = new Date().toISOString();
  state.actions = state.actions || {};
  state.actions[actionKey(item)] = {
    at: now,
    action: item.action,
    query: item.query,
    targetPage: item.targetPage || result.url,
    file: path.relative(ROOT, targetFile).split(path.sep).join('/'),
    score: item.score,
  };
  state.updatedAt = now;
  writeJson(STATE_PATH, state);

  const publishRecord = {
    at: now,
    action: item.action,
    query: item.query,
    score: item.score,
    sourcePlan: plan.id,
    sourcePeriod: plan.source || {},
    targetPage: item.targetPage || result.url,
    url: result.url,
    file: path.relative(ROOT, targetFile).split(path.sep).join('/'),
    slug,
    title: result.title,
    wordsAdded: result.words,
    snippetUpdated: result.snippetUpdated ?? true,
    opportunity: compactOpportunity(item),
  };
  writeJson(LAST_PUBLISH_PATH, publishRecord);

  setOutput('changed', 'true');
  setOutput('action', item.action);
  setOutput('slug', slug);
  setOutput('url', result.url);
  console.log(`Published ${item.action.toUpperCase()} change: ${publishRecord.file}`);
  console.log(`URL: ${result.url}`);
  console.log(`Words generated: ${result.words}`);
}

main().catch((error) => {
  console.error(`GSC publisher failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
