#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PUBLIC = path.join(ROOT, 'public');
const VERSION_FILE = path.join(PUBLIC, 'seo-system-version.json');
const SITE = 'https://youraicoach.life/';
const PROPERTY = SITE;
const SCOPES = [
  'https://www.googleapis.com/auth/siteverification',
  'https://www.googleapis.com/auth/webmasters',
];
const SECRET_NAMES = [
  'GOOGLE_SERVICE_ACCOUNT_JSON',
  'GOOGLE_CLOUD_JSON',
  'GCP_SA_KEY',
  'GOOGLE_APPLICATION_CREDENTIALS_JSON',
];

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function safe(value = '') {
  return String(value)
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[redacted-api-key]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/projects\/[A-Za-z0-9._-]+/g, 'projects/[redacted]')
    .replace(/[A-Za-z0-9_-]{160,}/g, '[redacted-token]')
    .replace(/\s+/g, ' ')
    .slice(0, 480);
}

function setOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  return fs.appendFile(process.env.GITHUB_OUTPUT, `${name}=${String(value).replace(/\r?\n/g, ' ')}\n`);
}

function credentials() {
  const source = SECRET_NAMES.find((name) => String(process.env[name] || '').trim());
  if (!source) throw new Error(`No Google service-account JSON is configured. Checked ${SECRET_NAMES.join(', ')}`);
  let value;
  try {
    value = JSON.parse(process.env[source]);
  } catch {
    throw new Error(`${source} is not valid JSON`);
  }
  if (value.type !== 'service_account' || !value.client_email || !value.private_key || !value.project_id) {
    throw new Error(`${source} is not valid service-account JSON`);
  }
  return {
    source,
    value: {
      ...value,
      private_key: String(value.private_key).replace(/\\n/g, '\n').replace(/\r\n/g, '\n'),
    },
  };
}

async function accessToken(serviceAccount) {
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

async function googleJson(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(45000),
  });
  const payload = response.status === 204 ? {} : await response.json().catch(() => ({}));
  return {
    ok: response.ok,
    status: response.status,
    payload,
    reason: safe(payload?.error?.message || payload?.error_description || payload?.error || ''),
  };
}

function encodedProperty() {
  return encodeURIComponent(PROPERTY);
}

async function propertyStatus(token) {
  return googleJson(`https://www.googleapis.com/webmasters/v3/sites/${encodedProperty()}`, token);
}

function verificationFilename(token) {
  const value = String(token || '').trim();
  if (!/^google[A-Za-z0-9_-]+\.html$/.test(value)) throw new Error('Google returned an unexpected FILE verification token');
  return value;
}

async function requestVerificationFile(token, projectId) {
  const result = await googleJson('https://www.googleapis.com/siteVerification/v1/token', token, {
    method: 'POST',
    body: JSON.stringify({
      verificationMethod: 'FILE',
      site: { identifier: SITE, type: 'SITE' },
    }),
  });
  if (result.ok) {
    return { status: 'file-ready', filename: verificationFilename(result.payload.token) };
  }
  const disabled = result.status === 403 && /not been used|disabled|SERVICE_DISABLED/i.test(result.reason);
  if (disabled) {
    return {
      status: 'api-disabled',
      enableUrl: `https://console.cloud.google.com/apis/library/siteverification.googleapis.com?project=${encodeURIComponent(projectId)}`,
      reason: result.reason,
    };
  }
  throw new Error(`Site Verification token request failed with HTTP ${result.status}: ${result.reason}`);
}

async function prepare() {
  const account = credentials();
  const token = await accessToken(account.value);
  const current = await propertyStatus(token);
  if (current.ok && ['siteOwner', 'siteFullUser'].includes(current.payload.permissionLevel)) {
    await setOutput('status', 'already-verified');
    await setOutput('ready', 'true');
    console.log(`Search Console URL-prefix property already has ${current.payload.permissionLevel} permission.`);
    return;
  }

  const verification = await requestVerificationFile(token, account.value.project_id);
  await setOutput('status', verification.status);
  await setOutput('ready', 'false');
  if (verification.status === 'api-disabled') {
    await setOutput('enable_url', verification.enableUrl);
    console.log('Google Site Verification API is disabled. The bootstrap is pending one owner-authorized API enablement and made no repository changes.');
    return;
  }

  const target = path.join(PUBLIC, verification.filename);
  await fs.writeFile(target, `google-site-verification: ${verification.filename}\n`, 'utf8');
  await setOutput('verification_file', verification.filename);
  console.log(`Prepared Google FILE verification token: ${verification.filename}.`);
}

async function liveVerificationFile(filename) {
  const response = await fetch(new URL(filename, SITE), {
    redirect: 'follow',
    cache: 'no-store',
    headers: { 'cache-control': 'no-cache', pragma: 'no-cache' },
    signal: AbortSignal.timeout(30000),
  });
  const text = await response.text();
  return response.status === 200 && text.trim() === `google-site-verification: ${filename}`;
}

async function waitForFile(filename) {
  for (let attempt = 1; attempt <= 32; attempt += 1) {
    if (await liveVerificationFile(filename).catch(() => false)) {
      console.log(`Verification file is live after attempt ${attempt}.`);
      return;
    }
    if (attempt < 32) await new Promise((resolve) => setTimeout(resolve, 15000));
  }
  throw new Error(`Verification file did not become live: ${filename}`);
}

async function queryAnalytics(token) {
  const end = new Date(Date.now() - 86400000);
  const start = new Date(Date.now() - 28 * 86400000);
  const date = (value) => value.toISOString().slice(0, 10);
  const result = await googleJson(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedProperty()}/searchAnalytics/query`, token, {
    method: 'POST',
    body: JSON.stringify({
      startDate: date(start),
      endDate: date(end),
      dimensions: ['query', 'page'],
      rowLimit: 1,
      dataState: 'final',
    }),
  });
  if (!result.ok) throw new Error(`Search Console analytics probe failed with HTTP ${result.status}: ${result.reason}`);
  return (result.payload.rows || []).length;
}

async function updateVersionMarker() {
  const current = JSON.parse(await fs.readFile(VERSION_FILE, 'utf8'));
  const next = {
    ...current,
    version: Math.max(3, Number(current.version || 0)),
    pipeline: 'verified-url-prefix-gsc-expert-plan-grounded-two-pass-editor',
    searchConsoleProperty: PROPERTY,
    searchConsoleVerified: true,
    updatedAt: new Date().toISOString().slice(0, 10),
  };
  await fs.writeFile(VERSION_FILE, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
}

async function verify(filenameArg) {
  const account = credentials();
  const token = await accessToken(account.value);
  let filename = filenameArg;
  if (!filename) {
    const entries = await fs.readdir(PUBLIC, { withFileTypes: true });
    filename = entries.find((entry) => entry.isFile() && /^google[A-Za-z0-9_-]+\.html$/.test(entry.name))?.name || '';
  }
  if (!filename) throw new Error('No Google FILE verification token exists in public/');
  verificationFilename(filename);
  await waitForFile(filename);

  const insertion = await googleJson('https://www.googleapis.com/siteVerification/v1/webResource?verificationMethod=FILE', token, {
    method: 'POST',
    body: JSON.stringify({ site: { identifier: SITE, type: 'SITE' } }),
  });
  if (!insertion.ok && insertion.status !== 409) {
    throw new Error(`Google Site Verification failed with HTTP ${insertion.status}: ${insertion.reason}`);
  }
  console.log('Google Site Verification accepted the live FILE token.');

  const add = await googleJson(`https://www.googleapis.com/webmasters/v3/sites/${encodedProperty()}`, token, { method: 'PUT' });
  if (!add.ok && add.status !== 204) throw new Error(`Search Console sites.add failed with HTTP ${add.status}: ${add.reason}`);
  const status = await propertyStatus(token);
  if (!status.ok || !['siteOwner', 'siteFullUser'].includes(status.payload.permissionLevel)) {
    throw new Error(`Search Console property permission is ${safe(status.payload.permissionLevel || status.reason || 'unknown')}`);
  }
  const rows = await queryAnalytics(token);
  await updateVersionMarker();
  await setOutput('ready', 'true');
  await setOutput('status', 'verified');
  console.log(`Search Console URL-prefix ownership and query+page API access are verified; sample rows returned: ${rows}.`);
}

async function main() {
  const command = process.argv[2] || 'prepare';
  if (command === 'prepare') await prepare();
  else if (command === 'verify') await verify(process.argv[3] || '');
  else if (command === 'status') {
    const account = credentials();
    const token = await accessToken(account.value);
    const status = await propertyStatus(token);
    const ready = status.ok && ['siteOwner', 'siteFullUser'].includes(status.payload.permissionLevel);
    await setOutput('ready', ready ? 'true' : 'false');
    await setOutput('status', ready ? 'verified' : 'pending');
    console.log(`Search Console URL-prefix status: ${ready ? status.payload.permissionLevel : 'pending'}.`);
  } else throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(`GSC URL-prefix bootstrap failed: ${safe(error instanceof Error ? error.message : String(error))}`);
  process.exitCode = 1;
});