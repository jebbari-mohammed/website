#!/usr/bin/env node

import process from 'node:process';

const ACCOUNTS = [
  {
    label: 'secondary',
    clientId: process.env.YOUTUBE_CLIENT_ID_2,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET_2,
    refreshToken: process.env.YOUTUBE_REFRESH_TOKEN_2,
  },
  {
    label: 'primary',
    clientId: process.env.YOUTUBE_CLIENT_ID,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
    refreshToken: process.env.YOUTUBE_REFRESH_TOKEN,
  },
].filter((account) => account.clientId && account.clientSecret && account.refreshToken);

function safe(value = '') {
  return String(value)
    .replace(/ya29\.[A-Za-z0-9._-]+/g, '[redacted-access-token]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/[A-Za-z0-9_-]{120,}/g, '[redacted-token]')
    .replace(/\s+/g, ' ')
    .slice(0, 300);
}

async function refresh(account) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: account.clientId,
      client_secret: account.clientSecret,
      refresh_token: account.refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
    signal: AbortSignal.timeout(30000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(`refresh failed: ${safe(payload.error_description || payload.error || response.status)}`);
  }
  return payload.access_token;
}

async function get(url, token) {
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30000),
  });
  const payload = await response.json().catch(() => ({}));
  return {
    ok: response.ok,
    status: response.status,
    reason: safe(payload?.error?.message || payload?.error_description || payload?.error || ''),
    payload,
  };
}

async function tokenScopes(token) {
  const info = await get(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`, token);
  const scope = typeof info.payload?.scope === 'string' ? info.payload.scope.split(/\s+/).filter(Boolean) : [];
  return [...new Set(scope)].sort();
}

function hasScope(scopes, exact, prefix = '') {
  return scopes.includes(exact) || (prefix && scopes.some((scope) => scope.startsWith(prefix)));
}

async function main() {
  if (!ACCOUNTS.length) throw new Error('No existing Google user OAuth credential set is configured');
  const results = [];

  for (const account of ACCOUNTS) {
    try {
      const token = await refresh(account);
      const scopes = await tokenScopes(token);
      const webmasters = await get('https://www.googleapis.com/webmasters/v3/sites', token);
      const verification = await get('https://www.googleapis.com/siteVerification/v1/webResource', token);
      const result = {
        label: account.label,
        scopes,
        hasWebmastersScope: hasScope(scopes, 'https://www.googleapis.com/auth/webmasters') || hasScope(scopes, 'https://www.googleapis.com/auth/webmasters.readonly'),
        hasSiteVerificationScope: hasScope(scopes, 'https://www.googleapis.com/auth/siteverification') || hasScope(scopes, 'https://www.googleapis.com/auth/siteverification.verify_only'),
        hasCloudPlatformScope: hasScope(scopes, 'https://www.googleapis.com/auth/cloud-platform'),
        webmastersStatus: webmasters.status,
        siteVerificationStatus: verification.status,
      };
      results.push(result);
      console.log(`${account.label} OAuth scopes: ${scopes.join(', ') || 'none reported'}`);
      console.log(`${account.label} capability status: webmasters=${webmasters.status}, siteverification=${verification.status}, cloud-platform-scope=${result.hasCloudPlatformScope}.`);
    } catch (error) {
      console.warn(`${account.label} OAuth probe failed: ${safe(error instanceof Error ? error.message : String(error))}`);
    }
  }

  if (!results.length) throw new Error('No Google user OAuth credential could be refreshed');
  const capable = results.find((result) =>
    result.hasWebmastersScope && result.hasSiteVerificationScope && result.webmastersStatus < 400 && result.siteVerificationStatus < 400,
  );
  if (process.env.GITHUB_OUTPUT) {
    const { appendFileSync } = await import('node:fs');
    appendFileSync(process.env.GITHUB_OUTPUT, `owner_capable=${capable ? 'true' : 'false'}\nowner_account=${capable?.label || ''}\n`);
  }
  if (capable) console.log(`Existing ${capable.label} OAuth credentials can manage Search Console and Site Verification.`);
  else console.log('No existing user OAuth credential has both required ownership-management capabilities.');
}

main().catch((error) => {
  console.error(`Google OAuth capability probe failed: ${safe(error instanceof Error ? error.message : String(error))}`);
  process.exitCode = 1;
});
