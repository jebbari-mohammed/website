/**
 * YouTube OAuth Setup — One-time helper to get your refresh token.
 * 
 * Steps:
 * 1. Go to console.cloud.google.com → Credentials → Create OAuth 2.0 Client
 * 2. Application type: Desktop app
 * 3. Download the JSON → copy client_id and client_secret below
 * 4. Run: node tools/ai-marketing/youtube-auth.mjs
 * 5. Click the link, authorize, paste the code
 * 6. Copy the refresh_token to your .env file
 */

import https from 'https';
import http from 'http';
import { URL, fileURLToPath } from 'url';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Automatically load .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && !k.startsWith('#') && k.trim()) {
      process.env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
    }
  });
}

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET first:');
  console.error('   export YOUTUBE_CLIENT_ID="your-client-id"');
  console.error('   export YOUTUBE_CLIENT_SECRET="your-client-secret"');
  process.exit(1);
}

const REDIRECT_URI = 'http://localhost:8765';
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube',
].join(' ');

// Build auth URL
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  }).toString();

console.log('\n🎬 YouTube OAuth Setup\n');
console.log('1. Open this URL in your browser:\n');
console.log(`   ${authUrl}\n`);
console.log('2. Click "Allow" to grant YouTube upload permissions');
console.log('3. You will be redirected to localhost — the code will be captured automatically\n');

// Start local server to capture the code
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:8765');
  const code = url.searchParams.get('code');

  if (!code) {
    res.end('No code found. Try again.');
    return;
  }

  res.end('<h1 style="font-family:sans-serif;color:green">✅ Auth code captured! Check your terminal.</h1>');
  server.close();

  console.log('✅ Auth code received — exchanging for tokens...\n');

  // Exchange code for tokens
  const tokenData = await exchangeCode(code);
  
  if (tokenData.refresh_token) {
    console.log('🎉 SUCCESS!\n');
    console.log('Add these to your .env file or GitHub Secrets:\n');
    console.log(`YOUTUBE_CLIENT_ID="${CLIENT_ID}"`);
    console.log(`YOUTUBE_CLIENT_SECRET="${CLIENT_SECRET}"`);
    console.log(`YOUTUBE_REFRESH_TOKEN="${tokenData.refresh_token}"`);
    console.log('\n✅ You can now run daily-podcast.mjs and it will auto-upload to YouTube!');
  } else {
    console.error('❌ No refresh token received:', JSON.stringify(tokenData, null, 2));
  }
  process.exit(0);
});

server.listen(8765, () => {
  console.log('⏳ Waiting for authorization... (server listening on localhost:8765)\n');
  // Try to open browser automatically
  try {
    execSync(`open "${authUrl}"`, { stdio: 'ignore' });
    console.log('🌐 Browser opened automatically\n');
  } catch {}
});

async function exchangeCode(code) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }).toString();

    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error(data)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
