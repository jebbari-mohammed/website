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
  const add = (value) => {
    let url;
    try {
      url = normalizeSameOriginUrl(value, site);
    } catch {
      return false;
    }
    if (!url || seen.has(url) || urls.length >= maxUrls) return false;
    seen.add(url);
    urls.push(url);
    return true;
  };

  for (const value of defaults) add(value);
  const landingPages = searchAnalyticsLandingPages(report, site);
  let searchAnalyticsAdded = 0;
  for (const item of landingPages) {
    if (add(item.url)) searchAnalyticsAdded += 1;
  }

  return {
    urls,
    searchAnalyticsAdded,
    searchAnalyticsCandidates: landingPages.length,
  };
}
