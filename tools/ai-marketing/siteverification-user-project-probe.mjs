#!/usr/bin/env node

import crypto from 'node:crypto';
import process from 'node:process';

const SITE = 'https://youraicoach.life/';
const SCOPES = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/siteverification.verify_only',
];
const CREDENTIAL_NAMES = [
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
    .replace(/[A-Za-z0-9_-]{150,}/g, '[redacted-token]')
    .replace(/\s+/g, ' ')
    .slice(0, 420);
}

function serviceAccount() {
  const source = CREDENTIAL_NAMES.find((name) => String(process.env[name] || '').trim());
  if (!source) throw new Error(`No service-account credential found under ${CREDENTIAL_NAMES.join(', ')}`);
  let parsed;
  try {
    parsed = JSON.parse(process.env[source]);
  } catch {
    throw new Error(`${source} is not valid JSON`);
  }
  if (parsed.type !== 'service_account' || !parsed.client_email || !parsed.private_key) {
    throw new Error(`${source} is not valid service-account JSON`);
  }
  return {
    source,
    value: {
      ...parsed,
      private_key: String(parsed.private_key).replace(/\\n/g, '\n').replace(/\r\n/g, '\n'),
    },
  };
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
      grant_type: 'urn:ietf:params:oauth2:grant-type:jwt-bearer',
      assertion: `${unsigned}.${base64url(signature)}`,
    }).toString(),
    signal: AbortSignal.timeout(30000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(`OAuth failed: ${safe(payload.error_description || payload.error || response.status)}`);
  }
  return payload.access_token;
}

async function lookupProject(token, apiKey, slot) {
  const url = new URL('https://apikeys.googleapis.com/v2/keys:lookupKey');
  url.searchParams.set('keyString', apiKey);
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.log(`API-key project lookup slot ${slot}: HTTP ${response.status}, ${safe(payload?.error?.message || '')}.`);
    return '';
  }
  const match = String(payload.name || '').match(/^projects\/([^/]+)\/locations\/global\/keys\//);
  if (!match) {
    console.log(`API-key project lookup slot ${slot}: response had no project parent.`);
    return '';
  }
  console.log(`API-key project lookup slot ${slot}: project parent discovered.`);
  return match[1];
}

async function probeProject(token, project, label) {
  const response = await fetch('https://www.googleapis.com/siteVerification/v1/token', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'x-goog-user-project': project,
    },
    body: JSON.stringify({
      verificationMethod: 'FILE',
      site: { identifier: SITE, type: 'SITE' },
    }),
    signal: AbortSignal.timeout(30000),
  });
  const payload = await response.json().catch(() => ({}));
  const usable = response.ok && payload.method === 'FILE' && /^google[A-Za-z0-9_-]+\.html$/.test(String(payload.token || ''));
  console.log(`User-project probe ${label}: HTTP ${response.status}${usable ? ', usable' : `, ${safe(payload?.error?.message || payload?.error_description || payload?.error || '')}`}.`);
  return usable;
}

async function main() {
  const account = serviceAccount();
  const token = await accessToken(account.value);
  console.log(`Authenticated service account from ${account.source}.`);
  const candidates = new Map();
  if (account.value.project_id) candidates.set(String(account.value.project_id), 'service-account-project');

  const keys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2, process.env.GEMINI_API_KEY_3];
  for (let index = 0; index < keys.length; index += 1) {
    if (!keys[index]) continue;
    const project = await lookupProject(token, keys[index], index + 1);
    if (project) candidates.set(project, `api-key-slot-${index + 1}`);
  }

  if (!candidates.size) throw new Error('No quota-project candidates could be discovered');
  for (const [project, label] of candidates) {
    if (await probeProject(token, project, label)) {
      if (process.env.GITHUB_OUTPUT) {
        const { appendFileSync } = await import('node:fs');
        appendFileSync(process.env.GITHUB_OUTPUT, `user_project_usable=true\nuser_project_label=${label}\n`);
      }
      console.log(`Site Verification can use x-goog-user-project from ${label}.`);
      return;
    }
  }

  if (process.env.GITHUB_OUTPUT) {
    const { appendFileSync } = await import('node:fs');
    appendFileSync(process.env.GITHUB_OUTPUT, 'user_project_usable=false\nuser_project_label=\n');
  }
  throw new Error('No discovered quota project accepts the service-account principal for Site Verification');
}

main().catch((error) => {
  console.error(`Site Verification user-project probe failed: ${safe(error instanceof Error ? error.message : String(error))}`);
  process.exitCode = 1;
});
