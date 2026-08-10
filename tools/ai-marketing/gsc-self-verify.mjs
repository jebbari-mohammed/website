#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  discoverCredentialSource,
  parseServiceAccountCredential,
} from './gsc-fetch-private.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PUBLIC = path.join(ROOT, 'public');
const SITE = process.env.GSC_URL_PREFIX || 'https://youraicoach.life/';
const SERVICE = 'siteverification.googleapis.com';
const SCOPES = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/siteverification',
  'https://www.googleapis.com/auth/webmasters',
];

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function safe(value = '') {
  return String(value)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/projects\/[A-Za-z0-9._-]+/g, 'projects/[redacted]')
    .replace(/[A-Za-z0-9_-]{160,}/g, '[redacted-token]')
    .replace(/\s+/g, ' ')
    .slice(0, 520);
}

function credentials() {
  const source = discoverCredentialSource(process.env);
  if (!source) throw new Error('No configured Google service-account secret was found');
  return { source, value: parseServiceAccountCredential(process.env[source], source) };
}

async function tokenFor(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = serviceAccount.token_uri || 'https://oauth2.googleapis.com/token';
  const header = base64url(JSON.stringify({
    alg: 'RS256',
    typ: 'JWT',
    ...(serviceAccount.private_key_id ? { kid: serviceAccount.private_key_id } : {}),
  }));
  const claim = base64url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: SCOPES.join(' '),
    aud: tokenUri,
    iat: now - 60,
    exp: now + 3540,
  }));
  const unsigned = `${header}.${claim}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), crypto.createPrivateKey(serviceAccount.private_key));
  const assertion = `${unsigned}.${base64url(signature)}`;
  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
    signal: AbortSignal.timeout(30000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(`Google OAuth failed: ${safe(payload.error_description || payload.error || response.status)}`);
  }
  return payload.access_token;
}

async function googleJson(url, accessToken, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(45000),
  });
  const payload = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Google API ${new URL(url).pathname} failed with HTTP ${response.status}: ${safe(payload?.error?.message || payload?.error_description || payload?.error || '')}`);
  }
  return payload;
}

async function enableSiteVerificationApi(accessToken, serviceAccount) {
  const project = String(serviceAccount.project_id || '').trim();
  if (!/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(project)) {
    throw new Error('Service-account credential has no valid project_id for API enablement');
  }
  const serviceUrl = `https://serviceusage.googleapis.com/v1/projects/${encodeURIComponent(project)}/services/${SERVICE}`;
  let current;
  try {
    current = await googleJson(serviceUrl, accessToken);
  } catch (error) {
    throw new Error(`Cannot inspect Site Verification API state: ${safe(error.message)}`);
  }
  if (current.state === 'ENABLED') {
    console.log('Google Site Verification API is already enabled.');
    return;
  }

  let operation;
  try {
    operation = await googleJson(`${serviceUrl}:enable`, accessToken, { method: 'POST', body: '{}' });
  } catch (error) {
    throw new Error(`Cannot enable Site Verification API with the existing service account: ${safe(error.message)}`);
  }
  const operationName = String(operation?.name || '');
  if (operationName) {
    for (let attempt = 1; attempt <= 24; attempt += 1) {
      const status = await googleJson(`https://serviceusage.googleapis.com/v1/${operationName.replace(/^\//, '')}`, accessToken);
      if (status.done) {
        if (status.error) throw new Error(`Site Verification API enablement failed: ${safe(status.error.message || JSON.stringify(status.error))}`);
        break;
      }
      if (attempt < 24) await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  for (let attempt = 1; attempt <= 24; attempt += 1) {
    const status = await googleJson(serviceUrl, accessToken);
    if (status.state === 'ENABLED') {
      console.log('Google Site Verification API was enabled successfully.');
      return;
    }
    if (attempt < 24) await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error('Site Verification API did not reach ENABLED state');
}

function validateSite() {
  const url = new URL(SITE);
  if (url.protocol !== 'https:' || url.hostname !== 'youraicoach.life' || url.pathname !== '/') {
    throw new Error('GSC URL-prefix verification is restricted to https://youraicoach.life/');
  }
}

function verificationFilename(token) {
  const value = String(token || '').trim();
  if (!/^google[A-Za-z0-9_-]+\.html$/.test(value)) {
    throw new Error('Google returned an unexpected FILE verification token format');
  }
  return value;
}

async function getVerificationToken(accessToken) {
  const payload = await googleJson('https://www.googleapis.com/siteVerification/v1/token', accessToken, {
    method: 'POST',
    body: JSON.stringify({
      verificationMethod: 'FILE',
      site: { identifier: SITE, type: 'SITE' },
    }),
  });
  if (payload.method !== 'FILE') throw new Error(`Google returned verification method ${safe(payload.method || 'unknown')}`);
  return verificationFilename(payload.token);
}

async function findVerificationFiles() {
  const entries = await fs.readdir(PUBLIC, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /^google[A-Za-z0-9_-]+\.html$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

async function prepare(accessToken) {
  const filename = await getVerificationToken(accessToken);
  await fs.writeFile(path.join(PUBLIC, filename), `${filename}\n`, 'utf8');
  console.log(`Prepared Google Site Verification file: ${filename}`);
  if (process.env.GITHUB_OUTPUT) {
    await fs.appendFile(process.env.GITHUB_OUTPUT, `verification_file=${filename}\n`);
  }
  return filename;
}

async function liveFile(filename) {
  const response = await fetch(new URL(filename, SITE), {
    redirect: 'follow',
    cache: 'no-store',
    headers: { 'cache-control': 'no-cache' },
    signal: AbortSignal.timeout(30000),
  });
  const text = await response.text();
  return response.status === 200 && text.trim() === filename;
}

async function waitForLiveFile(filename) {
  for (let attempt = 1; attempt <= 24; attempt += 1) {
    if (await liveFile(filename).catch(() => false)) {
      console.log(`Verification file is live after attempt ${attempt}.`);
      return;
    }
    if (attempt < 24) await new Promise((resolve) => setTimeout(resolve, 15000));
  }
  throw new Error(`Verification file did not become live: ${filename}`);
}

async function verifyOwnership(accessToken) {
  const files = await findVerificationFiles();
  if (!files.length) throw new Error('No Google FILE verification token exists in public/');
  const expected = await getVerificationToken(accessToken);
  if (!files.includes(expected)) {
    throw new Error(`The deployed verification file does not match the current service-account token (${expected})`);
  }
  await waitForLiveFile(expected);

  const resource = await googleJson('https://www.googleapis.com/siteVerification/v1/webResource?verificationMethod=FILE', accessToken, {
    method: 'POST',
    body: JSON.stringify({ site: { identifier: SITE, type: 'SITE' } }),
  });
  if (!resource?.id) throw new Error('Site Verification API did not return a verified resource id');
  console.log('Google Site Verification confirmed direct ownership of the HTTPS URL-prefix property.');

  const encoded = encodeURIComponent(SITE);
  await googleJson(`https://www.googleapis.com/webmasters/v3/sites/${encoded}`, accessToken, { method: 'PUT' });
  const property = await googleJson(`https://www.googleapis.com/webmasters/v3/sites/${encoded}`, accessToken);
  if (!['siteOwner', 'siteFullUser'].includes(property.permissionLevel)) {
    throw new Error(`Search Console permission is ${safe(property.permissionLevel || 'unknown')}, expected owner/full user`);
  }
  console.log(`Search Console property is active with permission ${property.permissionLevel}.`);

  const yesterday = new Date(Date.now() - 86400000);
  const start = new Date(Date.now() - 28 * 86400000);
  const format = (date) => date.toISOString().slice(0, 10);
  const analytics = await googleJson(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encoded}/searchAnalytics/query`, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      startDate: format(start),
      endDate: format(yesterday),
      dimensions: ['query', 'page'],
      rowLimit: 1,
      dataState: 'final',
    }),
  });
  console.log(`Search Console query+page access verified; sample rows returned: ${(analytics.rows || []).length}.`);
}

async function main() {
  validateSite();
  const command = process.argv[2] || 'prepare';
  const { source, value } = credentials();
  const accessToken = await tokenFor(value);
  console.log(`Authenticated Google Site Verification through ${source}.`);
  await enableSiteVerificationApi(accessToken, value);
  if (command === 'prepare') await prepare(accessToken);
  else if (command === 'verify') await verifyOwnership(accessToken);
  else throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(`GSC self-verification failed: ${safe(error instanceof Error ? error.message : String(error))}`);
  process.exitCode = 1;
});
