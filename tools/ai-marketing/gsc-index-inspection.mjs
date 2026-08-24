#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { discoverCredentialSource, parseServiceAccountCredential } from './gsc-fetch-private.mjs';
import { buildInspectionPriority } from './gsc-index-priority.mjs';

const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const SITE = process.env.GSC_SITE_URL || 'https://youraicoach.life/';
const SITE_ORIGIN = new URL(SITE).origin;
const OUTPUT = path.resolve(process.env.GSC_INDEX_OUTPUT || 'tools/ai-marketing/search-console-reports/index-inspection-latest.json');
const PRIVATE_GSC_REPORT = path.resolve(process.env.GSC_OUTPUT || 'tools/ai-marketing/search-console-reports/latest-28d.json');
const MAX_INSPECTION_URLS = 25;
const DEFAULT_URLS = [
  'https://youraicoach.life/',
  'https://youraicoach.life/ai-fitness-coach',
  'https://youraicoach.life/izem-ai-fitness-coach/',
  'https://youraicoach.life/best-ai-fitness-app',
  'https://youraicoach.life/workout-consistency-calculator',
  'https://youraicoach.life/blog/accountability-apps-for-working-out',
  'https://youraicoach.life/blog/best-accountability-app-for-gym',
  'https://youraicoach.life/blog/gym-machines-vs-free-weights',
  'https://youraicoach.life/blog/strength-training-after-40-guide',
  'https://youraicoach.life/blog/weekly-fitness-check-in-template',
  'https://youraicoach.life/blog/workout-accountability-agreement-template',
  'https://youraicoach.life/blog/workout-accountability-calendar',
  'https://youraicoach.life/blog/weekly-nutrition-check-in-template',
  'https://youraicoach.life/blog/ai-personal-trainer-that-actually-works',
  'https://youraicoach.life/blog/best-app-to-track-progressive-overload-automatically',
  'https://youraicoach.life/blog/best-workout-app-with-meal-planning-included',
  'https://youraicoach.life/blog/ai-workout-generator-beginners',
  'https://youraicoach.life/blog/workout-accountability-checklist',
  'https://youraicoach.life/blog/progressive-overload-tracker-template',
  'https://youraicoach.life/blog/personal-trainer-cost-calculator',
  'https://youraicoach.life/blog/fitness-app-crowded-gyms-adapts-workout',
  'https://youraicoach.life/blog/cant-add-weight-progressive-overload',
];

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function safe(value = '') {
  return String(value)
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[redacted-api-key]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/[A-Za-z0-9_-]{160,}/g, '[redacted-token]')
    .replace(/\s+/g, ' ')
    .slice(0, 420);
}

function setOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return Promise.resolve();
  return fs.appendFile(process.env.GITHUB_OUTPUT, `${name}=${String(value).replace(/\r?\n/g, ' ')}\n`);
}

async function loadPrivateSearchAnalyticsReport() {
  try {
    return JSON.parse(await fs.readFile(PRIVATE_GSC_REPORT, 'utf8'));
  } catch (error) {
    console.log(`Index inspection priority: private Search Analytics report unavailable; using fixed priorities only (${safe(error instanceof Error ? error.message : String(error))}).`);
    return null;
  }
}

async function inspectionUrls() {
  const raw = String(process.env.GSC_INSPECTION_URLS || '').trim();
  if (raw) {
    const values = raw.split(',').map((value) => value.trim()).filter(Boolean);
    const urls = [...new Set(values.map((value) => new URL(value, SITE).href))];
    if (urls.length === 0) throw new Error('No URLs configured for index inspection');
    if (urls.length > MAX_INSPECTION_URLS) throw new Error(`Index inspection is intentionally capped at ${MAX_INSPECTION_URLS} URLs per run`);
    for (const value of urls) {
      const url = new URL(value);
      if (url.origin !== SITE_ORIGIN) throw new Error(`Inspection URL is outside the Search Console property: ${url.origin}`);
    }
    return urls;
  }

  const report = await loadPrivateSearchAnalyticsReport();
  const priority = buildInspectionPriority({
    site: SITE,
    defaults: DEFAULT_URLS,
    report,
    maxUrls: MAX_INSPECTION_URLS,
  });
  if (priority.urls.length === 0) throw new Error('No URLs configured for index inspection');
  console.log(`Index inspection priority: ${priority.urls.length} URL(s), including ${priority.searchAnalyticsAdded} additional GSC-visible landing page(s) from ${priority.searchAnalyticsCandidates} candidate(s).`);
  return priority.urls;
}

async function getAccessToken(credentials) {
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = credentials.token_uri || 'https://oauth2.googleapis.com/token';
  const header = base64url(JSON.stringify({
    alg: 'RS256',
    typ: 'JWT',
    ...(credentials.private_key_id ? { kid: credentials.private_key_id } : {}),
  }));
  const claim = base64url(JSON.stringify({
    iss: credentials.client_email,
    scope: SCOPE,
    aud: tokenUri,
    iat: now - 60,
    exp: now + 3540,
  }));
  const unsigned = `${header}.${claim}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), crypto.createPrivateKey(credentials.private_key));
  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${base64url(signature)}`,
    }).toString(),
    signal: AbortSignal.timeout(30000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(`Google OAuth failed with HTTP ${response.status}: ${safe(payload.error_description || payload.error || '')}`);
  }
  return payload.access_token;
}

async function inspectUrl(accessToken, inspectionUrl) {
  const response = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      inspectionUrl,
      siteUrl: SITE,
      languageCode: 'en-US',
    }),
    signal: AbortSignal.timeout(45000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      url: inspectionUrl,
      status: 'api_error',
      httpStatus: response.status,
      error: safe(payload.error?.message || payload.error || ''),
    };
  }

  const result = payload.inspectionResult?.indexStatusResult || {};
  return {
    url: inspectionUrl,
    status: 'ok',
    verdict: result.verdict || 'VERDICT_UNSPECIFIED',
    coverageState: result.coverageState || '',
    robotsTxtState: result.robotsTxtState || '',
    indexingState: result.indexingState || '',
    pageFetchState: result.pageFetchState || '',
    googleCanonical: result.googleCanonical || '',
    userCanonical: result.userCanonical || '',
    lastCrawlTime: result.lastCrawlTime || '',
    crawledAs: result.crawledAs || '',
  };
}

async function main() {
  const source = discoverCredentialSource();
  if (!source) throw new Error('No Search Console service-account credential is configured');
  const credentials = parseServiceAccountCredential(source.raw, source.label);
  const accessToken = await getAccessToken(credentials);
  const urls = await inspectionUrls();
  const results = [];
  for (const url of urls) results.push(await inspectUrl(accessToken, url));
  const apiErrors = results.filter((result) => result.status === 'api_error');
  const indexed = results.filter((result) => result.status === 'ok' && result.verdict === 'PASS').length;
  const notIndexed = results.filter((result) => result.status === 'ok' && result.verdict === 'FAIL').length;
  const unknown = results.filter((result) => result.status === 'ok' && !['PASS', 'FAIL'].includes(result.verdict)).length;
  const output = {
    site: SITE,
    fetchedAt: new Date().toISOString(),
    requested: urls.length,
    inspected: results.length,
    indexed,
    notIndexed,
    unknown,
    apiErrors: apiErrors.length,
    results,
  };
  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(OUTPUT, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  await Promise.all([
    setOutput('inspected_count', results.length),
    setOutput('indexed_count', indexed),
    setOutput('not_indexed_count', notIndexed),
    setOutput('unknown_count', unknown),
    setOutput('api_error_count', apiErrors.length),
  ]);
  console.log(`URL Inspection checked ${results.length} URL(s): ${indexed} indexed, ${notIndexed} not indexed, ${unknown} neutral/unknown, ${apiErrors.length} API error(s).`);
  for (const item of apiErrors) console.warn(`Inspection API error for ${item.url}: HTTP ${item.httpStatus} ${item.error}`);
  if (apiErrors.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`URL Inspection failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
