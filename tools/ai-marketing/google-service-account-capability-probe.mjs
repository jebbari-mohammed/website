#!/usr/bin/env node

import crypto from 'node:crypto';
import process from 'node:process';

const SECRET_NAMES = [
  'GOOGLE_SERVICE_ACCOUNT_JSON',
  'GOOGLE_CLOUD_JSON',
  'GCP_SA_KEY',
  'GOOGLE_APPLICATION_CREDENTIALS_JSON',
  'GCP_SERVICE_ACCOUNT_JSON',
  'GOOGLE_CREDENTIALS',
  'GCP_CREDENTIALS',
  'GOOGLE_CLOUD_CREDENTIALS',
  'SERVICE_ACCOUNT_JSON',
  'GCLOUD_SERVICE_KEY',
  'GOOGLE_CLOUD_KEY',
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'FIREBASE_SERVICE_ACCOUNT',
  'FIREBASE_ADMIN_SDK_JSON',
  'FIREBASE_ADMIN_CREDENTIALS',
];
const SERVICE = 'siteverification.googleapis.com';
const SITE = 'https://youraicoach.life/';
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
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[redacted-api-key]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/projects\/[A-Za-z0-9._-]+/g, 'projects/[redacted]')
    .replace(/[A-Za-z0-9_-]{150,}/g, '[redacted-token]')
    .replace(/\s+/g, ' ')
    .slice(0, 420);
}

function accounts() {
  const found = [];
  for (const name of SECRET_NAMES) {
    const raw = String(process.env[name] || '').trim();
    if (!raw) continue;
    try {
      const value = JSON.parse(raw);
      if (value.type !== 'service_account' || !value.client_email || !value.private_key || !value.project_id) {
        console.log(`${name}: present but not service-account JSON; skipped.`);
        continue;
      }
      found.push({
        name,
        value: {
          ...value,
          private_key: String(value.private_key).replace(/\\n/g, '\n').replace(/\r\n/g, '\n'),
        },
      });
    } catch {
      console.log(`${name}: present but invalid JSON; skipped.`);
    }
  }
  return found;
}

async function accessToken(credentials) {
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = credentials.token_uri || 'https://oauth2.googleapis.com/token';
  const header = base64url(JSON.stringify({
    alg: 'RS256',
    typ: 'JWT',
    ...(credentials.private_key_id ? { kid: credentials.private_key_id } : {}),
  }));
  const claim = base64url(JSON.stringify({
    iss: credentials.client_email,
    scope: SCOPES.join(' '),
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
    throw new Error(`OAuth HTTP ${response.status}: ${safe(payload.error_description || payload.error || '')}`);
  }
  return payload.access_token;
}

async function jsonRequest(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(30000),
  });
  const payload = response.status === 204 ? {} : await response.json().catch(() => ({}));
  return {
    ok: response.ok,
    status: response.status,
    payload,
    reason: safe(payload?.error?.message || payload?.error_description || payload?.error || ''),
  };
}

async function siteToken(token) {
  return jsonRequest('https://www.googleapis.com/siteVerification/v1/token', token, {
    method: 'POST',
    body: JSON.stringify({
      verificationMethod: 'FILE',
      site: { identifier: SITE, type: 'SITE' },
    }),
  });
}

async function inspectAccount(account) {
  let token;
  try {
    token = await accessToken(account.value);
  } catch (error) {
    console.log(`${account.name}: ${safe(error.message)}.`);
    return { capable: false };
  }
  console.log(`${account.name}: OAuth works.`);

  const encoded = encodeURIComponent('sc-domain:youraicoach.life');
  const property = await jsonRequest(`https://www.googleapis.com/webmasters/v3/sites/${encoded}`, token);
  console.log(`${account.name}: domain-property HTTP ${property.status}${property.ok ? ` (${safe(property.payload.permissionLevel || 'permission unknown')})` : ` (${property.reason})`}.`);
  if (property.ok && ['siteOwner', 'siteFullUser'].includes(property.payload.permissionLevel)) {
    return { capable: true, mode: 'existing-domain-access', account: account.name };
  }

  let verification = await siteToken(token);
  if (verification.ok) {
    console.log(`${account.name}: Site Verification token API already available.`);
    return { capable: true, mode: 'siteverification-enabled', account: account.name };
  }
  console.log(`${account.name}: Site Verification token HTTP ${verification.status} (${verification.reason}).`);

  const project = encodeURIComponent(String(account.value.project_id));
  const serviceUrl = `https://serviceusage.googleapis.com/v1/projects/${project}/services/${SERVICE}`;
  const service = await jsonRequest(serviceUrl, token);
  console.log(`${account.name}: Service Usage inspect HTTP ${service.status}${service.ok ? ` (${safe(service.payload.state || 'state unknown')})` : ` (${service.reason})`}.`);
  if (!service.ok) return { capable: false };

  if (service.payload.state !== 'ENABLED') {
    const enable = await jsonRequest(`${serviceUrl}:enable`, token, { method: 'POST', body: '{}' });
    console.log(`${account.name}: Service Usage enable HTTP ${enable.status}${enable.ok ? '' : ` (${enable.reason})`}.`);
    if (!enable.ok) return { capable: false };
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }

  verification = await siteToken(token);
  console.log(`${account.name}: post-enable Site Verification HTTP ${verification.status}${verification.ok ? ', usable' : ` (${verification.reason})`}.`);
  if (verification.ok) return { capable: true, mode: 'api-enabled', account: account.name };
  return { capable: false };
}

async function main() {
  const candidates = accounts();
  console.log(`Discovered ${candidates.length} structurally valid service-account credential(s).`);
  if (!candidates.length) throw new Error('No structurally valid Google service-account secrets were found');

  for (const account of candidates) {
    const result = await inspectAccount(account);
    if (result.capable) {
      if (process.env.GITHUB_OUTPUT) {
        const { appendFileSync } = await import('node:fs');
        appendFileSync(process.env.GITHUB_OUTPUT, `capable=true\ncredential_name=${result.account}\nmode=${result.mode}\n`);
      }
      console.log(`Capable Google credential found: ${result.account} (${result.mode}).`);
      return;
    }
  }

  if (process.env.GITHUB_OUTPUT) {
    const { appendFileSync } = await import('node:fs');
    appendFileSync(process.env.GITHUB_OUTPUT, 'capable=false\ncredential_name=\nmode=\n');
  }
  throw new Error('Every existing service-account credential lacks Search Console access and Site Verification API enablement authority');
}

main().catch((error) => {
  console.error(`Google service-account capability probe failed: ${safe(error instanceof Error ? error.message : String(error))}`);
  process.exitCode = 1;
});
