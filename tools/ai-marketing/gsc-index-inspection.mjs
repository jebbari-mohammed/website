#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { discoverCredentialSource, parseServiceAccountCredential } from './gsc-fetch-private.mjs';

const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const SITE = process.env.GSC_SITE_URL || 'https://youraicoach.life/';
const SITE_ORIGIN = new URL(SITE).origin;
const OUTPUT = path.resolve(process.env.GSC_INDEX_OUTPUT || 'tools/ai-marketing/search-console-reports/index-inspection-latest.json');
const DEFAULT_URLS = [
  'https://youraicoach.life/',
  'https://youraicoach.life/ai-fitness-coach',
  'https://youraicoach.life/izem-ai-fitness-coach/',
  'https://youraicoach.life/best-ai-fitness-app',
  'https://youraicoach.life/workout-consistency-calculator',
  'https://youraicoach.life/blog/accountability-apps-for-working-out',
  'https://youraicoach.life/blog/gym-machines-vs-free-weights',
  'https://youraicoach.life/blog/strength-training-after-40-guide',
  'https://youraicoach.life/blog/weekly-fitness-check-in-template',
  'https://youraicoach.life/blog/workout-accountability-agreement-template',
  'https://youraicoach.life/blog/ai-personal-trainer-that-actually-works',
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

function inspectionUrls() {
  const raw = String(process.env.GSC_INSPECTION_URLS || '').trim();
  const values = raw ? raw.split(',').map((value) => value.trim()).filter(Boolean) : DEFAULT_URLS;
  const urls = [...new Set(values.map((value) => new URL(value, SITE).href))];
  if (urls.length === 0) throw new Error('No URLs configured for index inspection');
  if (urls.length > 25) throw new Error('Index inspection is intentionally capped at 25 URLs per run');
  for (const value of urls) {
    const url = new URL(value);
    if (url.origin !== SITE_ORIGIN) throw new Error(`Inspection URL is outside the Search Console property: ${url.origin}`);
  }
  return urls;
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
      grant_type: 'urn:ietf:params:oauth-bearer:jwt-bearer',
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
    throw new Error(`URL Inspection API HTTP ${response.status}: ${safe(payload?.error?.message || payload?.error || '')}`);
  }
  const result = payload?.inspectionResult?.indexStatusResult || {};
  return {
    url: inspectionUrl,
    verdict: result.verdict || 'UNKNOWN',
    coverageState: result.coverageState || 'Unknown',
    robotsTxtState: result.robotsTxtState || 'UNKNOWN',
    indexingState: result.indexingState || 'UNKNOWN',
    pageFetchState: result.pageFetchState || 'UNKNOWN',
    lastCrawlTime: result.lastCrawlTime || null,
    crawledAs: result.crawledAs || 'UNKNOWN',
    googleCanonical: result.googleCanonical || null,
    userCanonical: result.userCanonical || null,
    referringUrls: Array.isArray(result.referringUrls) ? result.referringUrls.slice(0, 5) : [],
    sitemap: Array.isArray(result.sitemap) ? result.sitemap.slice(0, 5) : [],
  };
}

function bucket(result) {
  if (result.verdict === 'PASS') return 'indexed';
  if (result.verdict === 'FAIL') return 'notIndexed';
  return 'unknown';
}

function pathname(value) {
  const url = new URL(value);
  return `${url.pathname}${url.search}` || '/';
}

async function main() {
  const source = discoverCredentialSource(process.env);
  if (!source) throw new Error('No Google service-account JSON is configured');
  const credentials = parseServiceAccountCredential(process.env[source], source);
  const accessToken = await getAccessToken(credentials);
  const urls = inspectionUrls();
  const results = [];
  const apiErrors = [];

  for (const url of urls) {
    try {
      results.push(await inspectUrl(accessToken, url));
    } catch (error) {
      apiErrors.push({ url, error: safe(error instanceof Error ? error.message : String(error)) });
    }
  }

  const counts = results.reduce((sum, result) => {
    sum[bucket(result)] += 1;
    return sum;
  }, { indexed: 0, notIndexed: 0, unknown: 0 });

  const report = {
    site: SITE,
    inspectedAt: new Date().toISOString(),
    requested: urls.length,
    inspected: results.length,
    apiErrors,
    counts,
    results,
  };
  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(OUTPUT, `${JSON.stringify(report, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });

  await setOutput('requested_count', urls.length);
  await setOutput('inspected_count', results.length);
  await setOutput('indexed_count', counts.indexed);
  await setOutput('not_indexed_count', counts.notIndexed);
  await setOutput('unknown_count', counts.unknown);
  await setOutput('api_error_count', apiErrors.length);

  console.log(`GSC index inspection: ${counts.indexed}/${results.length} inspected URLs indexed; ${counts.notIndexed} not indexed; ${counts.unknown} unknown; ${apiErrors.length} API error(s).`);
  for (const result of results) {
    console.log(`- ${pathname(result.url)}: verdict=${result.verdict}; coverage=${safe(result.coverageState)}; crawl=${result.lastCrawlTime || 'none'}`);
  }
  for (const item of apiErrors) {
    console.log(`- ${pathname(item.url)}: inspection error=${item.error}`);
  }

  if (apiErrors.length > 0) throw new Error(`URL Inspection API failed for ${apiErrors.length}/${urls.length} configured URL(s)`);
}

main().catch((error) => {
  console.error(`GSC index inspection failed: ${safe(error instanceof Error ? error.message : String(error))}`);
  process.exitCode = 1;
});
