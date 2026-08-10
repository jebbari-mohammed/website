#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const DEFAULT_SITE = 'sc-domain:youraicoach.life';
const DEFAULT_OUTPUT = path.resolve('tools/ai-marketing/search-console-reports/latest-28d.json');

function parseArgs(argv) {
  const args = {
    site: process.env.GSC_SITE_URL || DEFAULT_SITE,
    days: Number(process.env.GSC_DAYS || 28),
    dimensions: (process.env.GSC_DIMENSIONS || 'query,page').split(',').filter(Boolean),
    rowLimit: Number(process.env.GSC_ROW_LIMIT || 2500),
    output: process.env.GSC_OUTPUT ? path.resolve(process.env.GSC_OUTPUT) : DEFAULT_OUTPUT,
    requireRows: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === '--site') args.site = argv[++index];
    else if (item.startsWith('--site=')) args.site = item.slice(7);
    else if (item === '--days') args.days = Number(argv[++index]);
    else if (item.startsWith('--days=')) args.days = Number(item.slice(7));
    else if (item === '--dimensions') args.dimensions = argv[++index].split(',').filter(Boolean);
    else if (item.startsWith('--dimensions=')) args.dimensions = item.slice(13).split(',').filter(Boolean);
    else if (item === '--row-limit') args.rowLimit = Number(argv[++index]);
    else if (item.startsWith('--row-limit=')) args.rowLimit = Number(item.slice(12));
    else if (item === '--output') args.output = path.resolve(argv[++index]);
    else if (item.startsWith('--output=')) args.output = path.resolve(item.slice(9));
    else if (item === '--require-rows') args.requireRows = true;
  }
  if (!Number.isInteger(args.days) || args.days < 1 || args.days > 90) throw new Error('--days must be 1-90');
  if (!Number.isInteger(args.rowLimit) || args.rowLimit < 1 || args.rowLimit > 25000) throw new Error('--row-limit must be 1-25000');
  if (!args.dimensions.includes('query') || !args.dimensions.includes('page')) throw new Error('Production SEO requires both query and page dimensions');
  return args;
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function loadCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is missing');
  let credentials;
  try {
    credentials = JSON.parse(raw);
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON');
  }
  if (credentials.type !== 'service_account' || !credentials.client_email || !credentials.private_key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not a valid service-account credential');
  }
  return credentials;
}

async function getAccessToken(credentials) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(JSON.stringify({
    iss: credentials.client_email,
    scope: SCOPE,
    aud: credentials.token_uri || 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claim}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${base64url(signer.sign(credentials.private_key))}`;
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth2:grant-type:jwt-bearer',
    assertion,
  });
  const response = await fetch(credentials.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(30000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) throw new Error(`Google OAuth token request failed with HTTP ${response.status}`);
  return payload.access_token;
}

function dateDaysAgo(daysAgo) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

async function fetchSearchConsole(accessToken, args) {
  const body = {
    startDate: dateDaysAgo(args.days),
    endDate: dateDaysAgo(1),
    dimensions: args.dimensions,
    rowLimit: args.rowLimit,
    startRow: 0,
    dataState: 'final',
  };
  const response = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(args.site)}/searchAnalytics/query`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) {
    const category = response.status === 403 ? 'credential lacks Search Console property access' : `HTTP ${response.status}`;
    throw new Error(`Search Console query failed: ${category}`);
  }
  const payload = await response.json();
  return {
    site: args.site,
    startDate: body.startDate,
    endDate: body.endDate,
    dimensions: args.dimensions,
    rowLimit: args.rowLimit,
    fetchedAt: new Date().toISOString(),
    rows: payload.rows || [],
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const credentials = loadCredentials();
  const accessToken = await getAccessToken(credentials);
  const report = await fetchSearchConsole(accessToken, args);
  if (args.requireRows && report.rows.length === 0) throw new Error('Search Console returned zero query+page rows');
  await fs.mkdir(path.dirname(args.output), { recursive: true });
  await fs.writeFile(args.output, `${JSON.stringify(report, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  const totals = report.rows.reduce((sum, row) => ({
    clicks: sum.clicks + Number(row.clicks || 0),
    impressions: sum.impressions + Number(row.impressions || 0),
  }), { clicks: 0, impressions: 0 });
  console.log(`Private GSC pull verified: ${report.rows.length} rows, ${Math.round(totals.clicks)} clicks, ${Math.round(totals.impressions)} impressions.`);
  console.log(`Period: ${report.startDate} to ${report.endDate}. Exact queries were not printed.`);
}

main().catch((error) => {
  console.error(`Private GSC pull failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
