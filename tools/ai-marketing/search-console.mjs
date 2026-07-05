#!/usr/bin/env node

import crypto from 'crypto';
import fs from 'fs/promises';
import https from 'https';
import os from 'os';
import path from 'path';

const DEFAULT_SITE = 'sc-domain:youraicoach.life';
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const REPORT_DIR = path.resolve('tools/ai-marketing/search-console-reports');

function parseArgs(argv) {
  const args = {
    site: process.env.GSC_SITE_URL || DEFAULT_SITE,
    days: Number(process.env.GSC_DAYS || 28),
    dimensions: (process.env.GSC_DIMENSIONS || 'query,page').split(',').filter(Boolean),
    rowLimit: Number(process.env.GSC_ROW_LIMIT || 250),
    listSites: false,
    output: process.env.GSC_OUTPUT || '',
    startDate: process.env.GSC_START_DATE || '',
    endDate: process.env.GSC_END_DATE || '',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--site') args.site = argv[++i];
    else if (arg === '--days') args.days = Number(argv[++i]);
    else if (arg === '--dimensions') args.dimensions = argv[++i].split(',').filter(Boolean);
    else if (arg === '--row-limit') args.rowLimit = Number(argv[++i]);
    else if (arg === '--output') args.output = argv[++i];
    else if (arg === '--start-date') args.startDate = argv[++i];
    else if (arg === '--end-date') args.endDate = argv[++i];
    else if (arg === '--list-sites') args.listSites = true;
    else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  if (!Number.isFinite(args.days) || args.days < 1) throw new Error('--days must be a positive number');
  if (!Number.isFinite(args.rowLimit) || args.rowLimit < 1) throw new Error('--row-limit must be a positive number');
  return args;
}

function printHelp() {
  console.log(`Pull Google Search Console Search Analytics data.

Credentials, in order:
  GOOGLE_SERVICE_ACCOUNT_JSON      Raw service account JSON
  GOOGLE_APPLICATION_CREDENTIALS   Path to service account or ADC JSON
  gcloud ADC                       ~/.config/gcloud/application_default_credentials.json

Examples:
  npm run gsc -- --list-sites
  npm run gsc -- --days 28 --dimensions query,page
  npm run gsc -- --site https://youraicoach.life/ --days 7 --output latest.json

Environment:
  GSC_SITE_URL, GSC_DAYS, GSC_DIMENSIONS, GSC_ROW_LIMIT, GSC_OUTPUT
  GSC_START_DATE, GSC_END_DATE
`);
}

async function loadCredentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  }

  const candidates = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.join(os.homedir(), '.config/gcloud/application_default_credentials.json'),
  ].filter(Boolean);

  for (const file of candidates) {
    try {
      return JSON.parse(await fs.readFile(file, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw new Error(`Could not read Google credentials at ${file}: ${error.message}`);
    }
  }

  throw new Error('No Google credentials found. Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_JSON.');
}

function requestJson({ method = 'GET', hostname, path: requestPath, headers = {}, body }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const req = https.request({
      method,
      hostname,
      path: requestPath,
      headers: {
        ...headers,
        ...(payload ? {'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload)} : {}),
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let data = {};
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            data = {raw: text};
          }
        }
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
        else reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(data)}`));
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function tokenFromServiceAccount(credentials) {
  const now = Math.floor(Date.now() / 1000);
  const header = {alg: 'RS256', typ: 'JWT'};
  const claim = {
    iss: credentials.client_email,
    scope: SCOPE,
    aud: credentials.token_uri || 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const jwt = `${unsigned}.${base64url(signer.sign(credentials.private_key))}`;

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt,
  }).toString();

  return tokenRequest(body);
}

async function tokenFromAuthorizedUser(credentials) {
  const body = new URLSearchParams({
    client_id: credentials.client_id,
    client_secret: credentials.client_secret,
    refresh_token: credentials.refresh_token,
    grant_type: 'refresh_token',
  }).toString();

  return tokenRequest(body);
}

function tokenRequest(body) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        const data = JSON.parse(text || '{}');
        if (res.statusCode >= 200 && res.statusCode < 300 && data.access_token) resolve(data.access_token);
        else reject(new Error(`Token request failed: HTTP ${res.statusCode}: ${text}`));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function getAccessToken() {
  const credentials = await loadCredentials();
  if (credentials.type === 'service_account') return {accessToken: await tokenFromServiceAccount(credentials), quotaProjectId: credentials.project_id};
  if (credentials.type === 'authorized_user') return {accessToken: await tokenFromAuthorizedUser(credentials), quotaProjectId: credentials.quota_project_id};
  throw new Error(`Unsupported Google credential type: ${credentials.type || 'unknown'}`);
}

function isoDateDaysAgo(daysAgo) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

async function listSites(accessToken) {
  const headers = {Authorization: `Bearer ${accessToken.accessToken || accessToken}`};
  if (accessToken.quotaProjectId) headers['x-goog-user-project'] = accessToken.quotaProjectId;
  return requestJson({
    hostname: 'searchconsole.googleapis.com',
    path: '/webmasters/v3/sites',
    headers,
  });
}

async function querySearchAnalytics(accessToken, args) {
  const headers = {Authorization: `Bearer ${accessToken.accessToken || accessToken}`};
  if (accessToken.quotaProjectId) headers['x-goog-user-project'] = accessToken.quotaProjectId;
  const body = {
    startDate: args.startDate || isoDateDaysAgo(args.days),
    endDate: args.endDate || isoDateDaysAgo(1),
    dimensions: args.dimensions,
    rowLimit: args.rowLimit,
    startRow: 0,
  };

  return requestJson({
    method: 'POST',
    hostname: 'searchconsole.googleapis.com',
    path: `/webmasters/v3/sites/${encodeURIComponent(args.site)}/searchAnalytics/query`,
    headers,
    body,
  });
}

function summarizeRows(rows = [], dimensions = []) {
  const totals = rows.reduce((acc, row) => ({
    clicks: acc.clicks + (row.clicks || 0),
    impressions: acc.impressions + (row.impressions || 0),
  }), {clicks: 0, impressions: 0});

  console.log(`Rows: ${rows.length}`);
  console.log(`Clicks: ${totals.clicks.toFixed(0)}`);
  console.log(`Impressions: ${totals.impressions.toFixed(0)}`);
  console.log('');
  console.log(['clicks', 'impressions', 'ctr', 'position', ...dimensions].join('\t'));

  for (const row of rows.slice(0, 25)) {
    const keys = row.keys || [];
    console.log([
      row.clicks?.toFixed?.(0) ?? 0,
      row.impressions?.toFixed?.(0) ?? 0,
      `${((row.ctr || 0) * 100).toFixed(2)}%`,
      row.position?.toFixed?.(2) ?? '',
      ...keys,
    ].join('\t'));
  }
}

async function writeReport(args, payload) {
  await fs.mkdir(REPORT_DIR, {recursive: true});
  const filename = args.output || `gsc-${new Date().toISOString().slice(0, 10)}-${args.days}d.json`;
  const target = path.isAbsolute(filename) ? filename : path.join(REPORT_DIR, filename);
  await fs.writeFile(target, `${JSON.stringify(payload, null, 2)}\n`);
  return target;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const accessToken = await getAccessToken();

  if (args.listSites) {
    const sites = await listSites(accessToken);
    console.log(JSON.stringify(sites, null, 2));
    return;
  }

  const response = await querySearchAnalytics(accessToken, args);
  const report = {
    site: args.site,
    startDate: args.startDate || isoDateDaysAgo(args.days),
    endDate: args.endDate || isoDateDaysAgo(1),
    dimensions: args.dimensions,
    rowLimit: args.rowLimit,
    rows: response.rows || [],
  };
  summarizeRows(report.rows, args.dimensions);
  const target = await writeReport(args, report);
  console.log(`\nSaved: ${target}`);
}

main().catch((error) => {
  console.error(`Search Console pull failed: ${error.message}`);
  if (error.message.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT') || error.message.includes('insufficient authentication scopes')) {
    console.error('');
    console.error('Your current Google application-default credential is valid, but it was created without the Search Console scope.');
    console.error('Run this once, then retry:');
    console.error(`  gcloud auth application-default login --scopes="${SCOPE},https://www.googleapis.com/auth/cloud-platform"`);
  }
  process.exit(1);
});
