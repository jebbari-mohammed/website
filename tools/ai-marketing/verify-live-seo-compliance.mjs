#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://youraicoach.life';
const CITY_DIR = path.resolve('public/best-ai-fitness-app');
const RELEASED_REHABILITATIONS = [
  '/blog/ai-personal-trainer-that-actually-works',
];
const VIDEO_IDS = [
  'FeHyZads8i8',
  'QzpRjWt99is',
  'yVFrQaTO1wg',
  'xDL0aZdQK_8',
  'SZkx-HdPeT8',
  'pUpWxzftXFY',
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cityPaths() {
  const files = fs.readdirSync(CITY_DIR)
    .filter((file) => file.endsWith('.html') && file !== 'index.html')
    .sort();
  if (files.length !== 20) throw new Error(`Expected 20 city relocation pages, found ${files.length}`);
  return files.map((file) => `/best-ai-fitness-app/${file.replace(/\.html$/, '')}`);
}

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    cache: 'no-store',
    headers: {
      'user-agent': 'IZEM-Live-SEO-Compliance/1.0',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
    },
    signal: AbortSignal.timeout(30000),
  });
  return { status: response.status, text: await response.text() };
}

function metaContent(html, name) {
  return [...String(html).matchAll(/<meta\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => (tag.match(/\bname\s*=\s*(["'])(.*?)\1/i)?.[2] || '').toLowerCase() === name.toLowerCase())
    .map((tag) => tag.match(/\bcontent\s*=\s*(["'])(.*?)\1/i)?.[2] || '');
}

function hasNoindex(html) {
  return [...metaContent(html, 'robots'), ...metaContent(html, 'googlebot')]
    .some((value) => /(?:^|,)\s*noindex(?:\s|,|$)/i.test(value));
}

function canonical(html) {
  const tag = [...String(html).matchAll(/<link\b[^>]*>/gi)]
    .map((match) => match[0])
    .find((value) => (value.match(/\brel\s*=\s*(["'])(.*?)\1/i)?.[2] || '').toLowerCase().split(/\s+/).includes('canonical'));
  return tag?.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2] || '';
}

async function siteChecks() {
  const checks = [];
  const homepage = await fetchText(`${SITE}/`);
  checks.push({ label: 'homepage', ok: homepage.status === 200 && /<html/i.test(homepage.text), detail: `HTTP ${homepage.status}` });

  const version = await fetchText(`${SITE}/seo-system-version.json`);
  let marker;
  try { marker = JSON.parse(version.text); } catch {}
  checks.push({
    label: 'SEO system marker',
    ok: version.status === 200 && Number(marker?.version || 0) >= 2 && /gsc-expert-plan-grounded-two-pass-editor/.test(String(marker?.pipeline || '')),
    detail: `HTTP ${version.status}, version=${marker?.version || 'invalid'}`,
  });

  const sitemap = await fetchText(`${SITE}/sitemap.xml`);
  const news = await fetchText(`${SITE}/news-sitemap.xml`);
  checks.push({ label: 'sitemap', ok: sitemap.status === 200 && /<urlset/i.test(sitemap.text), detail: `HTTP ${sitemap.status}` });
  checks.push({ label: 'news sitemap', ok: news.status === 200 && /<urlset/i.test(news.text), detail: `HTTP ${news.status}` });

  for (const pathname of cityPaths()) {
    const page = await fetchText(`${SITE}${pathname}`);
    const ok = page.status === 200 &&
      hasNoindex(page.text) &&
      canonical(page.text) === `${SITE}/best-ai-fitness-app` &&
      page.text.includes('data-legacy-editorial-review="true"') &&
      page.text.includes('LEGACY_SEO_QUARANTINE:city-doorway-template') &&
      page.text.includes('retired its old city-template pages') &&
      !sitemap.text.includes(`${SITE}${pathname}`) &&
      !news.text.includes(`${SITE}${pathname}`);
    checks.push({
      label: pathname,
      ok,
      detail: `HTTP ${page.status}, noindex=${hasNoindex(page.text)}, canonical=${canonical(page.text)}, discovery-excluded=${!sitemap.text.includes(`${SITE}${pathname}`) && !news.text.includes(`${SITE}${pathname}`)}`,
    });
  }

  for (const pathname of RELEASED_REHABILITATIONS) {
    const page = await fetchText(`${SITE}${pathname}`);
    const expectedCanonical = `${SITE}${pathname}`;
    const quarantineCleared =
      !page.text.includes('data-legacy-editorial-review="true"') &&
      !page.text.includes('LEGACY_SEO_QUARANTINE:');
    const sitemapIncluded = sitemap.text.includes(expectedCanonical);
    const ok = page.status === 200 &&
      !hasNoindex(page.text) &&
      canonical(page.text) === expectedCanonical &&
      quarantineCleared &&
      sitemapIncluded;
    checks.push({
      label: `${pathname} rehabilitation`,
      ok,
      detail: `HTTP ${page.status}, indexable=${!hasNoindex(page.text)}, canonical=${canonical(page.text)}, quarantine-cleared=${quarantineCleared}, sitemap-included=${sitemapIncluded}`,
    });
  }

  return checks;
}

async function videoChecks() {
  const checks = [];
  for (const id of VIDEO_IDS) {
    const url = new URL('https://www.youtube.com/oembed');
    url.searchParams.set('url', `https://www.youtube.com/watch?v=${id}`);
    url.searchParams.set('format', 'json');
    let status = 0;
    try {
      const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
      status = response.status;
    } catch {}
    checks.push({ label: `YouTube ${id}`, ok: status !== 200, detail: `oEmbed HTTP ${status || 'fetch-error'}` });
  }
  return checks;
}

async function main() {
  let last = [];
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    try {
      last = [...await siteChecks(), ...await videoChecks()];
      const failures = last.filter((check) => !check.ok);
      console.log(`Live SEO compliance attempt ${attempt}/20: ${last.length - failures.length}/${last.length} checks passed.`);
      for (const check of last) console.log(`- ${check.ok ? 'PASS' : 'FAIL'} ${check.label}: ${check.detail}`);
      if (!failures.length) {
        if (process.env.GITHUB_STEP_SUMMARY) {
          fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Live SEO compliance\n- Homepage and SEO marker: passed\n- City relocation pages: 20/20 passed\n- Released legacy rehabilitation: passed\n- Normal and News sitemaps: passed\n- Misleading YouTube reviews unavailable: ${VIDEO_IDS.length}/${VIDEO_IDS.length}\n`);
        }
        console.log('Live SEO compliance passed completely.');
        return;
      }
    } catch (error) {
      console.warn(`Live compliance attempt ${attempt} failed transiently: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (attempt < 20) await sleep(15000);
  }
  throw new Error(`Live SEO compliance did not fully pass: ${last.filter((check) => !check.ok).map((check) => `${check.label} (${check.detail})`).join('; ')}`);
}

main().catch((error) => {
  console.error(`Live SEO compliance failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
