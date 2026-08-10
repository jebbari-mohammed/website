#!/usr/bin/env node

import crypto from 'node:crypto';
import process from 'node:process';
import {
  discoverCredentialSource,
  parseServiceAccountCredential,
} from './gsc-fetch-private.mjs';

const SITE = 'https://youraicoach.life/';
const SCOPE = 'https://www.googleapis.com/auth/siteverification.verify_only';

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
    .slice(0, 360);
}

function serviceAccount() {
  const source = discoverCredentialSource(process.env);
  if (!source) throw new Error('No service-account credential is configured');
  return parseServiceAccountCredential(process.env[source], source);
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
  if (!response.ok || !payload.access_token) throw new Error(`OAuth failed: ${safe(payload.error_description || payload.error || response.status)}`);
  return payload.access_token;
}

async function probe(token, key) {
  const url = new URL('https://www.googleapis.com/siteVerification/v1/token');
  if (key) url.searchParams.set('key', key);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      verificationMethod: 'FILE',
      site: { identifier: SITE, type: 'SITE' },
    }),
    signal: AbortSignal.timeout(30000),
  });
  const payload = await response.json().catch(() => ({}));
  return {
    ok: response.ok && payload.method === 'FILE' && /^google[A-Za-z0-9_-]+\.html$/.test(String(payload.token || '')),
    status: response.status,
    reason: safe(payload?.error?.message || payload?.error_description || payload?.error || ''),
  };
}

async function main() {
  const credentials = serviceAccount();
  const token = await accessToken(credentials);
  const candidates = [
    { slot: 0, key: '' },
    { slot: 1, key: process.env.GEMINI_API_KEY },
    { slot: 2, key: process.env.GEMINI_API_KEY_2 },
    { slot: 3, key: process.env.GEMINI_API_KEY_3 },
  ].filter((item, index) => index === 0 || item.key);

  for (const candidate of candidates) {
    const result = await probe(token, candidate.key);
    console.log(`Site Verification quota probe slot ${candidate.slot}: HTTP ${result.status}${result.ok ? ', usable' : `, ${result.reason || 'not usable'}`}.`);
    if (result.ok) {
      if (process.env.GITHUB_OUTPUT) {
        const { appendFileSync } = await import('node:fs');
        appendFileSync(process.env.GITHUB_OUTPUT, `quota_key_slot=${candidate.slot}\nquota_usable=true\n`);
      }
      console.log(`Site Verification can use quota slot ${candidate.slot}.`);
      return;
    }
  }

  if (process.env.GITHUB_OUTPUT) {
    const { appendFileSync } = await import('node:fs');
    appendFileSync(process.env.GITHUB_OUTPUT, 'quota_key_slot=\nquota_usable=false\n');
  }
  throw new Error('No existing API quota project can call the Site Verification API');
}

main().catch((error) => {
  console.error(`Site Verification quota probe failed: ${safe(error instanceof Error ? error.message : String(error))}`);
  process.exitCode = 1;
});
