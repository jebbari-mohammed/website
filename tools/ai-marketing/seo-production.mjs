#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import {
  SITE_ORIGIN,
  escapeHtml,
  hasMarker,
  injectMarkedSection,
  normalizeSiteUrl,
  queryHash,
  resolvePublicFile,
  setCanonical,
  setSocialImage,
  slugify,
  stripHtml,
  syncArticleMetadata,
  validateGeneratedContent,
} from './seo-publisher-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const BLOG_DIR = path.join(PUBLIC_DIR, 'blog');
const SEO_DIR = path.join(ROOT, 'data/marketing-employee/seo-growth');
const DEFAULT_PLAN = path.join(SEO_DIR, 'expert-latest.json');
const DEFAULT_STATE = path.join(SEO_DIR, 'publish-state-v2.json');
const LAST_PUBLISH = path.join(SEO_DIR, 'last-publish-v2.json');
const EXPERIMENTS = path.join(SEO_DIR, 'experiments-v2.json');

const PRODUCT_FACTS = [
  'IZEM is an AI fitness coach built around personalized workout planning, practical meal planning, progress review, adaptation, and accountability.',
  'IZEM can use proactive two-way voice calls for accountability before workouts and for day review.',
  'IZEM can adapt training around schedule, equipment, training level, goals, recovery, consistency, and plan changes.',
  'IZEM supports product features for food, body-progress, and gym-equipment scanning. These are not medical diagnostic tools.',
  'IZEM is coaching software and should not be represented as a doctor, dietitian, physiotherapist, or guaranteed replacement for a qualified professional.',
];

function parseArgs(argv) {
  const args = {
    plan: process.env.SEO_PLAN_PATH ? path.resolve(process.env.SEO_PLAN_PATH) : DEFAULT_PLAN,
    state: process.env.SEO_STATE_PATH ? path.resolve(process.env.SEO_STATE_PATH) : DEFAULT_STATE,
    dryRun: false,
    noResearch: false,
    force: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === '--plan') args.plan = path.resolve(argv[++index]);
    else if (item.startsWith('--plan=')) args.plan = path.resolve(item.slice(7));
    else if (item === '--state') args.state = path.resolve(argv[++index]);
    else if (item.startsWith('--state=')) args.state = path.resolve(item.slice(8));
    else if (item === '--dry-run') args.dryRun = true;
    else if (item === '--no-research') args.noResearch = true;
    else if (item === '--force') args.force = true;
  }
  return args;
}

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
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
}

function setOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${String(value).replace(/\r?\n/g, ' ')}\n`);
}

function safeError(error, sensitive = []) {
  let message = error instanceof Error ? error.message : String(error);
  for (const value of sensitive.filter(Boolean)) {
    message = message.split(String(value)).join(`[query:${queryHash(value)}]`);
  }
  message = message
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[redacted-api-key]')
    .replace(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g, '[redacted-private-key]');
  return message.slice(0, 1200);
}

function apiKeys() {
  return [...new Set([
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ].filter(Boolean))];
}

function modelCandidates() {
  const configured = (process.env.SEO_GEMINI_MODELS || '').split(',').map((item) => item.trim()).filter(Boolean);
  return [...new Set([
    ...configured,
    process.env.SEO_GEMINI_MODEL,
    process.env.GEMINI_MODEL,
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
  ].filter(Boolean))];
}

function parseModelJson(text) {
  const cleaned = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    return JSON.parse(cleaned);
  } catch {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first >= 0 && last > first) return JSON.parse(cleaned.slice(first, last + 1));
    throw new Error('model did not return valid JSON');
  }
}

async function generateText(prompt, { json = false, search = false, maxOutputTokens = 12000 } = {}) {
  if (!apiKeys().length) throw new Error('No Gemini API key is configured');
  let lastError;
  for (const model of modelCandidates()) {
    for (const apiKey of apiKeys()) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const config = { maxOutputTokens };
        if (json) config.responseMimeType = 'application/json';
        if (search) config.tools = [{ googleSearch: {} }];
        const response = await ai.models.generateContent({ model, contents: prompt, config });
        const text = String(response.text || '').trim();
        if (!text) throw new Error('empty model response');
        return { text, model };
      } catch (error) {
        lastError = error;
      }
    }
  }
  throw new Error(`All configured Gemini model/key combinations failed (${lastError?.message || 'unknown'})`);
}

function dateAgeDays(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY;
  return (Date.now() - date.getTime()) / 86400000;
}

function assertFreshPlan(plan) {
  if (!plan || plan.status === 'needs-gsc-data') throw new Error('No fresh GSC-backed expert plan is available');
  if (!Array.isArray(plan.opportunities)) throw new Error('Expert plan has no opportunity queue');
  if (dateAgeDays(plan.createdAt) > 2) throw new Error('Expert plan is older than 48 hours');
  if (plan.source?.endDate && dateAgeDays(`${plan.source.endDate}T23:59:59Z`) > 5) throw new Error('Search Console source period is stale');
  if (Number(plan.summary?.gscRows || 0) < 1) throw new Error('Expert plan contains zero Search Console rows');
}

function actionStateKey(item) {
  return `${item.action}|${queryHash(item.query)}|${normalizeSiteUrl(item.targetPage || '')}`;
}

function daysSince(iso) {
  return dateAgeDays(iso);
}

function inCooldown(item, state) {
  const prior = state.actions?.[actionStateKey(item)];
  const cooldownDays = item.action === 'refresh' ? 21 : 75;
  return Boolean(prior?.at && daysSince(prior.at) < cooldownDays);
}

function markerFor(item) {
  return queryHash(`${item.action}|${item.query}|${item.targetPage || ''}`);
}

function createFileFor(item) {
  return path.join(BLOG_DIR, `${slugify(item.query)}.html`);
}

function isEligible(item) {
  if (!['refresh', 'create'].includes(item.action)) return false;
  if (item.decision?.confidence === 'low') return false;
  const value = Number(item.decision?.expectedValue ?? item.score ?? 0);
  return value >= (item.action === 'create' ? 62 : 52);
}

function selectOpportunity(plan, state, force = false) {
  for (const item of plan.opportunities || []) {
    if (!isEligible(item)) continue;
    if (!force && inCooldown(item, state)) continue;
    const marker = markerFor(item);
    if (item.action === 'create') {
      if (fs.existsSync(createFileFor(item))) continue;
    } else {
      const target = resolvePublicFile(item.targetPage, PUBLIC_DIR);
      if (!target) continue;
      if (!force && hasMarker(fs.readFileSync(target, 'utf8'), marker)) continue;
    }
    return item;
  }
  return null;
}

function safeInternalLinks(brief = {}, targetUrl = '') {
  const target = normalizeSiteUrl(targetUrl);
  const seen = new Set();
  return (brief.internalLinks || [])
    .map((item) => {
      const url = normalizeSiteUrl(item?.url || '');
      if (!url || url === target || seen.has(url)) return null;
      seen.add(url);
      return { url: new URL(url).pathname, title: stripHtml(item.title || new URL(url).pathname) };
    })
    .filter(Boolean)
    .slice(0, 6);
}

function internalLinksHtml(brief, targetUrl) {
  const links = safeInternalLinks(brief, targetUrl);
  if (!links.length) return '';
  return `<section class="related"><h2>Useful IZEM guides for the next step</h2><ul>${links.map((item) => `<li><a href="${escapeHtml(item.url)}">${escapeHtml(item.title)}</a></li>`).join('')}</ul></section>`;
}

function safeFaq(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => ({ question: stripHtml(entry?.question || ''), answer: stripHtml(entry?.answer || '') }))
    .filter((entry) => entry.question.length >= 12 && entry.question.length <= 180 && entry.answer.length >= 40 && entry.answer.length <= 700)
    .slice(0, 5);
}

async function researchOpportunity(item) {
  const prompt = `Research the live Google search landscape for a fitness/AI coaching query.\n\nQuery: ${item.query}\nIntent: ${item.brief?.intent || 'informational'}\nCurrent target: ${item.targetPage || 'none'}\n\nUse Google Search. Return a concise private editorial brief covering: dominant intent; formats and SERP features; what top results do well; missing or weak angles; what would constitute genuine information gain; freshness/source expectations; and risks of overlap. Do not copy competitor wording. Do not recommend invented statistics, testimonials, medical claims, or unverified competitor prices/features.`;
  try {
    const response = await generateText(prompt, { search: true, maxOutputTokens: 4500 });
    return { text: response.text.slice(0, 12000), model: response.model, grounded: true };
  } catch {
    return { text: 'Live Google Search research was unavailable. Use only the supplied GSC evidence, current page context, product facts, and conservative claims.', model: '', grounded: false };
  }
}

function currentPageExcerpt(targetFile) {
  if (!targetFile) return '';
  const html = fs.readFileSync(targetFile, 'utf8');
  return stripHtml(html).slice(0, 16000);
}

function draftPrompt(item, research, currentExcerpt) {
  const brief = item.brief || {};
  const metrics = item.metrics || {};
  const internalLinks = safeInternalLinks(brief, item.targetPage).map((link) => `${link.title} -> ${link.url}`).join('\n') || 'none';
  const related = [...new Set([...(brief.relatedQueries || []), ...(item.cluster?.siblings || [])])].slice(0, 12).join('; ') || 'none';
  const fields = item.action === 'create'
    ? '{"title":"...","metaDescription":"...","directAnswer":"...","articleHtml":"...","faq":[{"question":"...","answer":"..."}]}'
    : '{"title":"...","metaDescription":"...","directAnswer":"...","sectionHeading":"...","sectionHtml":"..."}';
  const mode = item.action === 'create'
    ? 'Write a complete article body of roughly 1100-1900 useful words. Use at least three H2 sections. Include an original framework, decision tree, worked example, checklist, or comparison methodology. Do not include H1, html, head, body, script, style, forms, images, or links.'
    : 'Write one additive section of roughly 350-750 useful words that fills the most important gap without repeating the current page. Use at least one H2 and practical substructure. Do not rewrite the whole page and do not include links.';

  return `Create a senior-editor SEO ${item.action.toUpperCase()} deliverable for IZEM. Return valid JSON only in this exact shape: ${fields}\n\nPRIVATE GSC EVIDENCE\n- query: ${item.query}\n- clicks: ${metrics.clicks || 0}\n- impressions: ${metrics.impressions || 0}\n- CTR: ${((metrics.ctr || 0) * 100).toFixed(2)}%\n- average position: ${Number(metrics.position || 0).toFixed(1)}\n- intent: ${brief.intent || 'informational'}\n- why now: ${item.reason || ''}\n- expert expected value: ${item.decision?.expectedValue ?? item.score ?? 0}/100\n- evidence confidence: ${item.decision?.confidence || 'unknown'}\n- related same-intent queries: ${related}\n\nLIVE SERP RESEARCH\n${research.text}\n\nCURRENT PAGE EXCERPT\n${currentExcerpt || 'No current page. This is a new intent.'}\n\nVERIFIED PRODUCT FACTS\n- ${PRODUCT_FACTS.join('\n- ')}\n\nSAFE INTERNAL LINK OPTIONS (the renderer injects these; do not write links yourself)\n${internalLinks}\n\nEDITORIAL RULES\n- Answer the query directly in the first useful paragraph.\n- Prioritize information gain over length. Generic filler is a failure.\n- Add a reusable first-party framework, checklist, decision tree, table, or worked example.\n- Keep claims conservative. Never invent studies, statistics, experts, testimonials, rankings, personal testing, medical outcomes, competitor capabilities, or competitor prices.\n- Do not use fake experience such as “I tested.”\n- Do not diagnose or treat injuries, eating disorders, or medical conditions.\n- Do not repeat the exact query unnaturally.\n- The title must be 25-75 characters. The meta description must be 90-175 characters.\n- The direct answer must be 60-500 characters.\n- Use only these body tags: h2, h3, p, ul, ol, li, strong, em, blockquote, code, table, thead, tbody, tr, th, td, br, hr.\n- ${mode}`;
}

function criticPrompt(item, research, draft) {
  return `Act as a skeptical senior SEO editor and fact-risk reviewer. Return a REVISED deliverable in exactly the same JSON shape as the input, not a critique.\n\nTarget action: ${item.action}\nTarget query: ${item.query}\nIntent: ${item.brief?.intent || 'informational'}\n\nSERP research:\n${research.text}\n\nDraft JSON:\n${JSON.stringify(draft)}\n\nRewrite it so that it: directly satisfies intent; adds concrete information gain; avoids generic AI prose; avoids unsupported facts, statistics, medical claims, fake experience, competitor facts/prices, and guarantees; preserves useful current-page material for a refresh; uses only allowed HTML tags and no links; keeps title/meta/direct-answer within required lengths; and does not repeat the exact query unnaturally. Return JSON only.`;
}

async function createDeliverable(item, research, currentExcerpt) {
  const first = await generateText(draftPrompt(item, research, currentExcerpt), { json: true, maxOutputTokens: 16000 });
  const draft = parseModelJson(first.text);
  const second = await generateText(criticPrompt(item, research, draft), { json: true, maxOutputTokens: 16000 });
  const revised = parseModelJson(second.text);
  return { deliverable: revised, model: second.model || first.model };
}

async function repairDeliverable(item, research, deliverable, issues) {
  const prompt = `Repair this SEO deliverable and return the full revised JSON in the same shape.\nAction: ${item.action}\nQuery: ${item.query}\nValidation failures: ${issues.join('; ')}\nSERP context: ${research.text}\nCurrent JSON: ${JSON.stringify(deliverable)}\nDo not explain. Return valid JSON only. Keep all claims conservative and use only the permitted HTML tags.`;
  const response = await generateText(prompt, { json: true, maxOutputTokens: 16000 });
  return { deliverable: parseModelJson(response.text), model: response.model };
}

async function validateWithRepair(item, research, initial, initialModel) {
  let deliverable = initial;
  let model = initialModel;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const bodyHtml = item.action === 'create' ? deliverable.articleHtml : deliverable.sectionHtml;
    try {
      const validation = validateGeneratedContent({
        action: item.action,
        query: item.query,
        directAnswer: stripHtml(deliverable.directAnswer || ''),
        bodyHtml: bodyHtml || '',
        title: stripHtml(deliverable.title || ''),
        metaDescription: stripHtml(deliverable.metaDescription || ''),
      });
      return { deliverable: { ...deliverable, _safeBody: validation.safeBody }, validation, model };
    } catch (error) {
      if (attempt === 2) throw error;
      const repaired = await repairDeliverable(item, research, deliverable, error.issues || [error.message]);
      deliverable = repaired.deliverable;
      model = repaired.model;
    }
  }
  throw new Error('unreachable validation state');
}

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function createPage(item, deliverable, validation, marker) {
  const title = stripHtml(deliverable.title);
  const description = stripHtml(deliverable.metaDescription);
  const directAnswer = stripHtml(deliverable.directAnswer);
  const bodyHtml = deliverable._safeBody;
  const faq = safeFaq(deliverable.faq);
  const today = new Date().toISOString().slice(0, 10);
  const slug = slugify(item.query);
  const url = `${SITE_ORIGIN}/blog/${slug}`;
  const imageUrl = `${SITE_ORIGIN}/og/${slug}.png`;
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: title,
        description,
        author: { '@type': 'Person', name: 'Mohammed Jebbari', url: `${SITE_ORIGIN}/about` },
        publisher: { '@type': 'Organization', name: 'IZEM', url: `${SITE_ORIGIN}/`, logo: { '@type': 'ImageObject', url: `${SITE_ORIGIN}/images/izem-app-logo-512.png` } },
        datePublished: today,
        dateModified: today,
        mainEntityOfPage: url,
        image: imageUrl,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_ORIGIN}/blog/` },
          { '@type': 'ListItem', position: 3, name: title, item: url },
        ],
      },
      ...(faq.length ? [{ '@type': 'FAQPage', mainEntity: faq.map((entry) => ({ '@type': 'Question', name: entry.question, acceptedAnswer: { '@type': 'Answer', text: entry.answer } })) }] : []),
    ],
  };
  const faqHtml = faq.length ? `<section class="faq"><h2>Frequently asked questions</h2>${faq.map((entry) => `<h3>${escapeHtml(entry.question)}</h3><p>${escapeHtml(entry.answer)}</p>`).join('')}</section>` : '';
  const related = internalLinksHtml(item.brief, url);
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${url}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="IZEM">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${url}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <script type="application/ld+json">${jsonLd(schema)}</script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}:root{--bg:#081019;--panel:#101B2A;--text:#EAF0F7;--muted:#AEBBCC;--accent:#42C7C3;--border:rgba(255,255,255,.1)}html{scroll-behavior:smooth}body{background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.72}a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}.nav{background:rgba(8,16,25,.95);border-bottom:1px solid var(--border);padding:16px 24px;position:sticky;top:0;z-index:20}.nav-in{max-width:1000px;margin:auto;display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap}.brand{font-weight:900;color:#F8FAFC}.hero{background:linear-gradient(135deg,#081019,#152235 60%,#17352F);border-bottom:1px solid var(--border)}.hero-in{max-width:1000px;margin:auto;padding:68px 24px}.eyebrow{color:#9CE8DC;font-size:.78rem;font-weight:850;text-transform:uppercase;letter-spacing:.08em;margin-bottom:16px}h1{font-size:clamp(2.15rem,5vw,4rem);line-height:1.05;letter-spacing:-.03em;max-width:900px}.meta{color:#7C8A9B;margin-top:14px}main{max-width:880px;margin:auto;padding:48px 24px 88px}.answer,.disclosure,.cta{border:1px solid var(--border);border-radius:10px;padding:22px;margin-bottom:26px}.answer{background:rgba(66,199,195,.09);border-color:rgba(66,199,195,.3)}.disclosure{background:rgba(255,255,255,.035);color:var(--muted);font-size:.94rem}h2{font-size:clamp(1.5rem,3vw,2.15rem);margin:44px 0 15px;color:#F8FAFC}h3{font-size:1.18rem;margin:26px 0 10px;color:#F8FAFC}p{color:#D1DBE7;margin-bottom:18px;font-size:1.03rem}ul,ol{padding-left:24px;margin:14px 0 24px}li{margin-bottom:9px;color:#D1DBE7}table{width:100%;border-collapse:collapse;margin:20px 0 28px;display:block;overflow-x:auto}th,td{padding:12px;border:1px solid var(--border);text-align:left;vertical-align:top}blockquote{border-left:3px solid var(--accent);padding:14px 18px;background:var(--panel);margin:22px 0;color:#D1DBE7}.related,.faq{margin-top:38px}.cta{margin-top:44px;text-align:center;background:rgba(66,199,195,.07)}.button{display:inline-flex;background:var(--accent);color:#041515;font-weight:900;padding:12px 18px;border-radius:8px;margin-top:8px}@media(max-width:700px){.hero-in{padding-top:48px}main{padding-top:36px}}
  </style>
</head>
<body>
<!-- SEO_EXPERIMENT:${marker} -->
<nav class="nav"><div class="nav-in"><a class="brand" href="/">IZEM</a><div><a href="/izem-ai-fitness-coach/">AI Coach</a> · <a href="/blog/">Blog</a> · <a href="/tools/">Tools</a></div></div></nav>
<header class="hero"><div class="hero-in"><div class="eyebrow">IZEM practical fitness guide</div><h1>${escapeHtml(title)}</h1><p class="meta">Published ${today} · Mohammed Jebbari / IZEM</p></div></header>
<main>
  <div class="answer"><p><strong>Direct answer:</strong> ${escapeHtml(directAnswer)}</p></div>
  <div class="disclosure"><p><strong>Editorial note:</strong> IZEM publishes this guide and may mention its own product. The page uses disclosed AI assistance in the editorial workflow and remains subject to IZEM’s editorial policy. It is general information, not medical advice.</p></div>
  ${bodyHtml}
  ${related}
  ${faqHtml}
  <div class="cta"><p><strong>Want coaching that follows up instead of only tracking?</strong></p><a class="button" href="/izem-ai-fitness-coach/">Explore IZEM AI Fitness Coach</a></div>
</main>
</body>
</html>`;
  html = setSocialImage(html, imageUrl);
  html = setCanonical(html, url);
  return { html, title, description, directAnswer, words: validation.words, url, slug, imageUrl };
}

function metaContent(html, attribute, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`<meta\\b(?=[^>]*\\b${attribute}\\s*=\\s*(["'])${escaped}\\1)[^>]*\\bcontent\\s*=\\s*(["'])(.*?)\\2[^>]*>`, 'i'));
  return match?.[3] || '';
}

function refreshPage(item, deliverable, validation, marker, targetFile) {
  let html = fs.readFileSync(targetFile, 'utf8');
  const currentTitle = stripHtml(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || deliverable.title || item.query);
  const currentDescription = stripHtml(metaContent(html, 'name', 'description') || deliverable.metaDescription || '');
  const generatedTitle = stripHtml(deliverable.title);
  const generatedDescription = stripHtml(deliverable.metaDescription);
  const directAnswer = stripHtml(deliverable.directAnswer);
  const heading = stripHtml(deliverable.sectionHeading || `A practical update for ${item.query}`);
  const section = `<section data-seo-growth-refresh="${marker}"><h2>${escapeHtml(heading)}</h2><p><strong>Updated answer:</strong> ${escapeHtml(directAnswer)}</p>${deliverable._safeBody}${internalLinksHtml(item.brief, item.targetPage)}</section>`;
  html = injectMarkedSection(html, marker, section);
  const expectedCtr = Number(item.diagnostics?.expectedCtrHeuristic || 0);
  const currentCtr = Number(item.metrics?.ctr || 0);
  const snippetUnderperforming = expectedCtr > 0 && currentCtr < expectedCtr * 0.7;
  const today = new Date().toISOString().slice(0, 10);
  html = syncArticleMetadata(html, {
    title: snippetUnderperforming ? generatedTitle : currentTitle,
    description: snippetUnderperforming ? generatedDescription : currentDescription,
    dateModified: today,
  });
  return {
    html,
    title: snippetUnderperforming ? generatedTitle : currentTitle,
    description: snippetUnderperforming ? generatedDescription : currentDescription,
    directAnswer,
    words: validation.words,
    url: normalizeSiteUrl(item.targetPage),
    slug: new URL(normalizeSiteUrl(item.targetPage)).pathname.split('/').filter(Boolean).pop() || 'home',
    snippetUpdated: snippetUnderperforming,
  };
}

function reviewDate(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function recordState(state, item, result, marker, plan) {
  const now = new Date().toISOString();
  state.version = 2;
  state.actions = state.actions || {};
  const hashes = new Set([queryHash(item.query), ...(item.cluster?.siblings || []).map(queryHash)]);
  for (const hash of hashes) {
    const key = `${item.action}|${hash}|${normalizeSiteUrl(item.targetPage || result.url)}`;
    state.actions[key] = { at: now, action: item.action, queryHash: hash, targetPage: normalizeSiteUrl(item.targetPage || result.url), marker };
  }
  state.updatedAt = now;
  const record = {
    at: now,
    action: item.action,
    queryHash: queryHash(item.query),
    marker,
    score: item.score,
    expectedValue: item.decision?.expectedValue ?? item.score,
    confidence: item.decision?.confidence || 'unknown',
    sourcePlan: plan.id,
    sourcePeriod: plan.source || {},
    baseline: item.metrics || {},
    targetPage: normalizeSiteUrl(item.targetPage || result.url),
    url: result.url,
    slug: result.slug,
    title: result.title,
    wordsAdded: result.words,
    snippetUpdated: result.snippetUpdated ?? true,
    reviewNotBefore: reviewDate(item.action === 'refresh' ? 21 : 35),
  };
  return { state, record };
}

function appendExperiment(record) {
  const ledger = readJson(EXPERIMENTS, { version: 2, experiments: [] });
  ledger.experiments = ledger.experiments || [];
  ledger.experiments.push({
    ...record,
    hypothesis: record.action === 'refresh'
      ? 'Improving intent coverage and, when warranted, snippet alignment should increase ranking stability, CTR, and clicks for the existing URL.'
      : 'A dedicated page for a clearly missing intent should earn impressions without cannibalizing an existing canonical page.',
    targetMetrics: record.action === 'refresh' ? ['position', 'CTR', 'clicks'] : ['indexed', 'impressions', 'position', 'clicks'],
    status: 'running',
  });
  ledger.updatedAt = new Date().toISOString();
  writeJson(EXPERIMENTS, ledger);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  for (const [name, value] of Object.entries({ changed: 'false', action: 'none', slug: '', url: '', marker: '', query_hash: '', validated: 'false', grounded: 'false' })) setOutput(name, value);
  const plan = readJson(args.plan, null);
  assertFreshPlan(plan);
  const state = readJson(args.state, { version: 2, actions: {} });
  const item = selectOpportunity(plan, state, args.force);
  if (!item) {
    console.log('No eligible automatic CREATE/REFRESH action cleared freshness, confidence, value, cooldown, and idempotency gates.');
    return;
  }

  const hash = queryHash(item.query);
  const marker = markerFor(item);
  console.log(`Selected ${item.action.toUpperCase()} query-hash=${hash}; expected-value=${item.decision?.expectedValue ?? item.score}/100; confidence=${item.decision?.confidence || 'unknown'}.`);
  let targetFile = '';
  if (item.action === 'refresh') {
    targetFile = resolvePublicFile(item.targetPage, PUBLIC_DIR);
    if (!targetFile) throw new Error('Refresh target could not be mapped to a public HTML file');
  }

  const research = args.noResearch ? { text: 'Live SERP research disabled for this run.', grounded: false, model: '' } : await researchOpportunity(item);
  console.log(`SERP research phase: ${research.grounded ? 'grounded' : 'unavailable'}.`);
  setOutput('grounded', research.grounded ? 'true' : 'false');
  if (!research.grounded) {
    throw new Error('Live Google Search grounding was unavailable; publication is skipped rather than using an ungrounded fallback');
  }
  const drafted = await createDeliverable(item, research, currentPageExcerpt(targetFile));
  const checked = await validateWithRepair(item, research, drafted.deliverable, drafted.model);
  let result;
  if (item.action === 'create') {
    result = createPage(item, checked.deliverable, checked.validation, marker);
    targetFile = path.join(BLOG_DIR, `${result.slug}.html`);
  } else {
    result = refreshPage(item, checked.deliverable, checked.validation, marker, targetFile);
  }

  setOutput('validated', 'true');
  setOutput('action', item.action);
  setOutput('slug', result.slug);
  setOutput('url', result.url);
  setOutput('marker', marker);
  setOutput('query_hash', hash);

  if (args.dryRun) {
    const dryPath = path.join('/tmp', `izem-seo-${marker}.html`);
    fs.writeFileSync(dryPath, result.html, 'utf8');
    console.log(`Dry-run passed: ${item.action.toUpperCase()}, ${result.words} validated words, model=${checked.model}, marker=${marker}. No repository files were changed.`);
    return;
  }

  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
  fs.writeFileSync(targetFile, result.html, 'utf8');
  const stateRecord = recordState(state, item, result, marker, plan);
  writeJson(args.state, stateRecord.state);
  writeJson(LAST_PUBLISH, { ...stateRecord.record, file: path.relative(ROOT, targetFile).split(path.sep).join('/'), model: checked.model, groundedResearch: research.grounded });
  appendExperiment(stateRecord.record);
  setOutput('changed', 'true');
  console.log(`SEO publication prepared: ${item.action.toUpperCase()} ${path.relative(ROOT, targetFile)}; marker=${marker}; ${result.words} validated words.`);
}

main().catch((error) => {
  const plan = readJson(process.env.SEO_PLAN_PATH ? path.resolve(process.env.SEO_PLAN_PATH) : DEFAULT_PLAN, null);
  const sensitive = (plan?.opportunities || []).flatMap((item) => [item.query, ...(item.cluster?.siblings || [])]);
  console.error(`SEO production failed: ${safeError(error, sensitive)}`);
  process.exitCode = 1;
});
