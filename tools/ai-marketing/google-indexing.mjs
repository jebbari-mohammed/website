/**
 * Google Indexing API — Submits URLs directly to Google for instant indexing.
 * Faster than IndexNow for Google specifically.
 * Requires: GOOGLE_INDEXING_SA_JSON secret (service account JSON, base64 encoded)
 * 
 * Setup:
 * 1. Go to Google Search Console → Settings → Users and permissions → Add property owner
 * 2. Go to Google Cloud Console → Create service account
 * 3. Enable "Web Search Indexing API" 
 * 4. Download the JSON key
 * 5. Base64 encode it: cat key.json | base64
 * 6. Add to GitHub Secrets as GOOGLE_INDEXING_SA_JSON
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROGRESS_FILE = path.join(__dirname, '.daily-progress.json');

// ========================
// JWT AUTH FOR GOOGLE API
// ========================
async function getGoogleAccessToken(saJson) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: saJson.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const toSign = `${b64(header)}.${b64(payload)}`;

  // Use Node.js crypto to sign with RS256
  const { createSign } = await import('crypto');
  const sign = createSign('RSA-SHA256');
  sign.update(toSign);
  const signature = sign.sign(saJson.private_key, 'base64url');
  const jwt = `${toSign}.${signature}`;

  // Exchange JWT for access token
  return new Promise((resolve, reject) => {
    const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(data);
        if (parsed.access_token) resolve(parsed.access_token);
        else reject(new Error(`Token error: ${data}`));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ========================
// SUBMIT URL TO GOOGLE
// ========================
async function submitToGoogle(url, accessToken) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ url, type: 'URL_UPDATED' });
    const req = https.request({
      hostname: 'indexing.googleapis.com',
      path: '/v3/urlNotifications:publish',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ========================
// MAIN
// ========================
async function main() {
  const saJsonB64 = process.env.GOOGLE_INDEXING_SA_JSON;
  if (!saJsonB64) {
    console.log('⏭️  GOOGLE_INDEXING_SA_JSON not set — skipping Google Indexing API');
    console.log('   To enable: see setup instructions at top of this file');
    return;
  }

  let saJson;
  try {
    saJson = JSON.parse(Buffer.from(saJsonB64, 'base64').toString('utf-8'));
  } catch {
    console.error('❌ GOOGLE_INDEXING_SA_JSON is not valid base64-encoded JSON');
    return;
  }

  console.log('🔑 Google Indexing API: authenticating...');
  const accessToken = await getGoogleAccessToken(saJson);

  // Read progress to get recent posts
  if (!fs.existsSync(PROGRESS_FILE)) {
    console.log('No blog posts yet.');
    return;
  }

  const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  
  // Submit the last 5 posts + key pages (Google limit is 200/day)
  const recentPosts = progress.generated.slice(-5);
  const urls = [
    'https://youraicoach.life/',
    'https://youraicoach.life/blog',
    'https://youraicoach.life/tools',
    'https://youraicoach.life/glossary',
    ...recentPosts.map(p => `https://youraicoach.life/blog/${p.slug}`),
  ];

  console.log(`📤 Submitting ${urls.length} URLs to Google Indexing API...`);
  let success = 0;
  for (const url of urls) {
    const result = await submitToGoogle(url, accessToken);
    if (result.status === 200) {
      console.log(`  ✅ ${url}`);
      success++;
    } else {
      console.log(`  ⚠️  ${url} → HTTP ${result.status}: ${result.data}`);
    }
    // Small delay to be respectful
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n✅ Google Indexing API: submitted ${success}/${urls.length} URLs`);
}

main().catch(err => {
  console.error('❌ Google Indexing API error:', err.message);
  // Non-fatal — don't exit with error code
});
