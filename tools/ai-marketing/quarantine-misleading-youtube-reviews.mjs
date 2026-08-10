#!/usr/bin/env node

import process from 'node:process';

const KNOWN_TARGETS = new Map([
  ['FeHyZads8i8', 'IZEM Review 2026 — Is This AI Fitness App Worth It?'],
  ['QzpRjWt99is', 'I Tested IZEM for 30 Days — Here Is My Honest Review'],
  ['yVFrQaTO1wg', 'IZEM vs Fitbod — Which AI Fitness App Is Better in 2026?'],
  ['xDL0aZdQK_8', 'Top 5 AI Fitness Apps Compared — IZEM vs The Competition'],
  ['SZkx-HdPeT8', 'Best App to Replace a Personal Trainer in 2026 — Save 300 Dollars a Month'],
  ['pUpWxzftXFY', 'IZEM vs Future Fitness — Can AI Replace a 150 Dollar Coach?'],
]);

const TITLE_RISK_PATTERNS = [
  /\bI Tested IZEM\b/i,
  /\bResults Shocked Me\b/i,
  /\bSave 300 Dollars\b/i,
  /\bCan AI Replace a 150 Dollar Coach\b/i,
  /^IZEM Review 2026\b/i,
  /^Top 5 AI Fitness Apps Compared\b/i,
  /^IZEM vs Fitbod\b/i,
  /\bHonest Review\b/i,
  /\bAI Personal Trainer Apps Ranked\b/i,
  /\bThe Only Fitness App That Calls You\b/i,
  /\bHow AI Voice Coaching Changed My Fitness Journey\b/i,
];

function credentialSets() {
  return [
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
  ].filter((entry) => entry.clientId && entry.clientSecret && entry.refreshToken);
}

function safeMessage(value = '') {
  return String(value)
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[redacted-api-key]')
    .replace(/ya29\.[A-Za-z0-9._-]+/g, '[redacted-access-token]')
    .replace(/[A-Za-z0-9_-]{120,}/g, '[redacted-token]')
    .replace(/\s+/g, ' ')
    .slice(0, 320);
}

async function accessToken(credentials) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: credentials.refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
    signal: AbortSignal.timeout(30000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(`YouTube OAuth failed for ${credentials.label}: ${safeMessage(payload.error_description || payload.error || response.status)}`);
  }
  return payload.access_token;
}

async function youtubeJson(accessTokenValue, pathname, options = {}) {
  const response = await fetch(`https://www.googleapis.com${pathname}`, {
    ...options,
    headers: {
      authorization: `Bearer ${accessTokenValue}`,
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(45000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`YouTube API ${pathname.split('?')[0]} failed with HTTP ${response.status}: ${safeMessage(payload?.error?.message || '')}`);
  }
  return payload;
}

async function channelUploadIds(token) {
  const channel = await youtubeJson(token, '/youtube/v3/channels?part=contentDetails&mine=true');
  const uploads = channel?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error('Authenticated YouTube account has no uploads playlist');

  const ids = [];
  let pageToken = '';
  do {
    const query = new URLSearchParams({
      part: 'contentDetails',
      playlistId: uploads,
      maxResults: '50',
      ...(pageToken ? { pageToken } : {}),
    });
    const page = await youtubeJson(token, `/youtube/v3/playlistItems?${query}`);
    ids.push(...(page.items || []).map((item) => item?.contentDetails?.videoId).filter(Boolean));
    pageToken = page.nextPageToken || '';
  } while (pageToken && ids.length < 500);
  return [...new Set(ids)];
}

async function videoRecords(token, ids) {
  const records = [];
  for (let index = 0; index < ids.length; index += 50) {
    const batch = ids.slice(index, index + 50);
    if (!batch.length) continue;
    const query = new URLSearchParams({ part: 'snippet,status', id: batch.join(','), maxResults: '50' });
    const response = await youtubeJson(token, `/youtube/v3/videos?${query}`);
    records.push(...(response.items || []));
  }
  return records;
}

function shouldQuarantine(video) {
  if (KNOWN_TARGETS.has(video.id)) return true;
  const title = video?.snippet?.title || '';
  return TITLE_RISK_PATTERNS.some((pattern) => pattern.test(title));
}

async function makePrivate(token, video) {
  const status = video.status || {};
  if (status.privacyStatus === 'private') return false;
  const nextStatus = {
    privacyStatus: 'private',
    ...(typeof status.embeddable === 'boolean' ? { embeddable: status.embeddable } : {}),
    ...(typeof status.publicStatsViewable === 'boolean' ? { publicStatsViewable: status.publicStatsViewable } : {}),
    ...(typeof status.selfDeclaredMadeForKids === 'boolean' ? { selfDeclaredMadeForKids: status.selfDeclaredMadeForKids } : {}),
    ...(typeof status.containsSyntheticMedia === 'boolean' ? { containsSyntheticMedia: status.containsSyntheticMedia } : {}),
  };
  await youtubeJson(token, '/youtube/v3/videos?part=status', {
    method: 'PUT',
    body: JSON.stringify({ id: video.id, status: nextStatus }),
  });
  return true;
}

async function publiclyReachable(videoId) {
  const url = new URL('https://www.youtube.com/oembed');
  url.searchParams.set('url', `https://www.youtube.com/watch?v=${videoId}`);
  url.searchParams.set('format', 'json');
  try {
    const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
    return response.ok;
  } catch {
    return true;
  }
}

async function main() {
  const accounts = credentialSets();
  if (!accounts.length) throw new Error('No YouTube OAuth credential set is configured');

  const verifiedPrivate = new Set();
  const changed = [];
  const audited = [];
  const accountErrors = [];

  for (const account of accounts) {
    try {
      const token = await accessToken(account);
      const uploads = await channelUploadIds(token);
      const candidates = [...new Set([...uploads, ...KNOWN_TARGETS.keys()])];
      const records = await videoRecords(token, candidates);
      const targets = records.filter(shouldQuarantine);

      for (const video of targets) {
        const title = video?.snippet?.title || KNOWN_TARGETS.get(video.id) || video.id;
        audited.push({ id: video.id, title, account: account.label });
        try {
          if (await makePrivate(token, video)) changed.push({ id: video.id, title, account: account.label });
        } catch (error) {
          accountErrors.push(`${account.label}/${video.id}: ${safeMessage(error.message)}`);
        }
      }

      const verificationIds = [...new Set(targets.map((video) => video.id))];
      const verified = await videoRecords(token, verificationIds);
      for (const video of verified) {
        if (video?.status?.privacyStatus === 'private') verifiedPrivate.add(video.id);
      }
    } catch (error) {
      accountErrors.push(`${account.label}: ${safeMessage(error.message)}`);
    }
  }

  const stillPublic = [];
  for (const id of KNOWN_TARGETS.keys()) {
    if (verifiedPrivate.has(id)) continue;
    if (await publiclyReachable(id)) stillPublic.push(id);
  }

  console.log(`YouTube review audit: ${audited.length} owner-visible risky videos, ${changed.length} changed to private, ${verifiedPrivate.size} verified private.`);
  for (const item of changed) console.log(`- privatized ${item.id}: ${item.title}`);
  if (accountErrors.length) {
    console.warn(`Non-fatal account/video diagnostics (${accountErrors.length}):`);
    for (const message of accountErrors) console.warn(`- ${message}`);
  }
  if (stillPublic.length) {
    throw new Error(`Known misleading review videos remain publicly reachable: ${stillPublic.join(', ')}`);
  }
  console.log('All known misleading review videos are private or no longer publicly reachable.');
}

main().catch((error) => {
  console.error(`YouTube quarantine failed: ${safeMessage(error instanceof Error ? error.message : String(error))}`);
  process.exitCode = 1;
});
