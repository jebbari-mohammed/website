#!/usr/bin/env node

const SITE = 'https://youraicoach.life';
const QUARANTINED = [
  '/blog/ai-personal-trainer-that-actually-works',
  '/best-ai-fitness-app/new-york',
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

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    cache: 'no-store',
    headers: {
      'user-agent': 'IZEM-Live-SEO-Verification/1.0',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
    },
    signal: AbortSignal.timeout(30000),
  });
  return { status: response.status, text: await response.text(), headers: response.headers };
}

function hasNoindex(html) {
  return [...String(html).matchAll(/<meta\b[^>]*>/gi)].some((match) => {
    const tag = match[0];
    const name = tag.match(/\bname\s*=\s*(["'])(.*?)\1/i)?.[2]?.toLowerCase() || '';
    const content = tag.match(/\bcontent\s*=\s*(["'])(.*?)\1/i)?.[2]?.toLowerCase() || '';
    return ['robots', 'googlebot'].includes(name) && /(?:^|,)\s*noindex(?:\s|,|$)/i.test(content);
  });
}

async function verifySiteOnce() {
  const results = [];
  const homepage = await fetchText(`${SITE}/`);
  results.push({ label: 'homepage', ok: homepage.status === 200 && /<html/i.test(homepage.text), detail: `HTTP ${homepage.status}` });

  const version = await fetchText(`${SITE}/seo-system-version.json`);
  let parsedVersion;
  try { parsedVersion = JSON.parse(version.text); } catch {}
  results.push({
    label: 'SEO system marker',
    ok: version.status === 200 && Number(parsedVersion?.version || 0) >= 2 && /gsc-expert-plan-grounded-two-pass-editor/.test(String(parsedVersion?.pipeline || '')),
    detail: `HTTP ${version.status}, version=${parsedVersion?.version || 'invalid'}`,
  });

  const sitemap = await fetchText(`${SITE}/sitemap.xml`);
  const news = await fetchText(`${SITE}/news-sitemap.xml`);
  results.push({ label: 'sitemap', ok: sitemap.status === 200 && /<urlset/i.test(sitemap.text), detail: `HTTP ${sitemap.status}` });
  results.push({ label: 'news sitemap', ok: news.status === 200 && /<urlset/i.test(news.text), detail: `HTTP ${news.status}` });

  for (const pathname of QUARANTINED) {
    const page = await fetchText(`${SITE}${pathname}`);
    const noindex = hasNoindex(page.text);
    const banner = page.text.includes('data-legacy-editorial-review="true"');
    const marker = page.text.includes('LEGACY_SEO_QUARANTINE:');
    const absentNormal = !sitemap.text.includes(`${SITE}${pathname}`);
    const absentNews = !news.text.includes(`${SITE}${pathname}`);
    results.push({
      label: pathname,
      ok: page.status === 200 && noindex && banner && marker && absentNormal && absentNews,
      detail: `HTTP ${page.status}, noindex=${noindex}, banner=${banner}, marker=${marker}, sitemap-excluded=${absentNormal}, news-excluded=${absentNews}`,
    });
  }
  return results;
}

async function verifyVideos() {
  const results = [];
  for (const id of VIDEO_IDS) {
    const url = new URL('https://www.youtube.com/oembed');
    url.searchParams.set('url', `https://www.youtube.com/watch?v=${id}`);
    url.searchParams.set('format', 'json');
    let status = 0;
    try {
      const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
      status = response.status;
    } catch {}
    results.push({ label: `YouTube ${id}`, ok: status !== 200, detail: `oEmbed HTTP ${status || 'fetch-error'}` });
  }
  return results;
}

async function main() {
  let last = [];
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    try {
      last = [...await verifySiteOnce(), ...await verifyVideos()];
      const failures = last.filter((item) => !item.ok);
      console.log(`Live verification attempt ${attempt}/20: ${last.length - failures.length}/${last.length} checks passed.`);
      for (const item of last) console.log(`- ${item.ok ? 'PASS' : 'FAIL'} ${item.label}: ${item.detail}`);
      if (!failures.length) {
        if (process.env.GITHUB_STEP_SUMMARY) {
          const { appendFileSync } = await import('node:fs');
          appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Live SEO cleanup verification\n- Core site and marker: passed\n- Quarantined pages: noindex + transparent banner + audit marker\n- Normal and News sitemaps: excluded quarantined URLs\n- Misleading YouTube reviews: not publicly reachable (${VIDEO_IDS.length}/${VIDEO_IDS.length})\n`);
        }
        console.log('Live SEO cleanup verification passed completely.');
        return;
      }
    } catch (error) {
      console.warn(`Live verification attempt ${attempt} failed transiently: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (attempt < 20) await sleep(15000);
  }
  throw new Error(`Live SEO cleanup did not fully propagate. Remaining failures: ${last.filter((item) => !item.ok).map((item) => `${item.label} (${item.detail})`).join('; ')}`);
}

main().catch((error) => {
  console.error(`Live cleanup verification failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
