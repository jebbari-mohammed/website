function normalizeSameOriginUrl(value, site) {
  const siteUrl = new URL(site);
  const url = new URL(value, siteUrl);
  if (url.origin !== siteUrl.origin) return null;
  url.hash = '';
  return url.href;
}

export function searchAnalyticsLandingPages(report, site) {
  if (!report || !Array.isArray(report.rows)) return [];
  const dimensions = Array.isArray(report.dimensions) ? report.dimensions : [];
  const pageIndex = dimensions.indexOf('page');
  if (pageIndex < 0) return [];

  const impressionsByUrl = new Map();
  for (const row of report.rows) {
    if (!Array.isArray(row?.keys)) continue;
    const rawPage = row.keys[pageIndex];
    if (!rawPage) continue;

    let url;
    try {
      url = normalizeSameOriginUrl(rawPage, site);
    } catch {
      continue;
    }
    if (!url) continue;

    const impressions = Number(row.impressions || 0);
    impressionsByUrl.set(url, (impressionsByUrl.get(url) || 0) + (Number.isFinite(impressions) ? impressions : 0));
  }

  return [...impressionsByUrl.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([url, impressions]) => ({ url, impressions }));
}

export function buildInspectionPriority({ site, defaults = [], report = null, maxUrls = 25 }) {
  if (!Number.isInteger(maxUrls) || maxUrls < 1) throw new Error('maxUrls must be a positive integer');

  const urls = [];
  const seen = new Set();
  for (const value of defaults) {
    let url;
    try {
      url = normalizeSameOriginUrl(value, site);
    } catch (error) {
      throw new Error(`Invalid fixed inspection URL: ${String(value)}`, { cause: error });
    }
    if (!url) throw new Error(`Fixed inspection URL is outside the Search Console property: ${String(value)}`);
    if (seen.has(url)) continue;
    if (urls.length >= maxUrls) throw new Error(`Fixed inspection priorities exceed the ${maxUrls}-URL cap`);
    seen.add(url);
    urls.push(url);
  }

  const landingPages = searchAnalyticsLandingPages(report, site);
  let searchAnalyticsAdded = 0;
  for (const item of landingPages) {
    if (urls.length >= maxUrls) break;
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    urls.push(item.url);
    searchAnalyticsAdded += 1;
  }

  return {
    urls,
    searchAnalyticsAdded,
    searchAnalyticsCandidates: landingPages.length,
  };
}
