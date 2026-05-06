/**
 * Self-Evolving Content Intelligence Engine
 * 
 * Runs every Sunday at 9:00 AM. Analyzes the past week's video performance,
 * checks Google Trends for rising fitness topics, and uses Gemini to generate
 * next week's review video queue automatically.
 * 
 * THE BOT NEVER RUNS OUT OF TOPICS. It learns what works and makes more of it.
 * 
 * Pipeline:
 * 1. YouTube Data API → pull view counts for all uploaded videos
 * 2. Rank by views → identify winning topics, formats, and keywords
 * 3. Google Trends → find rising fitness search terms
 * 4. Gemini → generate 7 NEW review titles combining winners + trends
 * 5. Write next week's queue to .review-progress.json
 * 
 * Cron: 0 9 * * 0 (every Sunday at 9 AM)
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// Load .env (root + tools directory)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFiles = [
  path.resolve(__dirname, '../../.env'),
  path.join(__dirname, '.env'),
];
envFiles.forEach(envFile => {
  if (fs.existsSync(envFile)) {
    fs.readFileSync(envFile, 'utf-8').split('\n').forEach(line => {
      const [k, ...v] = line.split('=');
      if (k && !k.startsWith('#') && k.trim()) {
        const val = v.join('=').trim().replace(/^"|"$/g, '');
        // Don't overwrite real values with placeholders
        if (val && val !== 'your_gemini_api_key_here' && (!process.env[k.trim()] || process.env[k.trim()] === 'your_gemini_api_key_here')) {
          process.env[k.trim()] = val;
        }
      }
    });
  }
});

const REVIEW_PROGRESS = path.join(__dirname, '.review-progress.json');
const INTELLIGENCE_LOG = path.join(__dirname, '.intelligence-log.json');

// Gemini API key rotation (same as daily-blog.mjs)
const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean);
let geminiKeyIndex = 0;
function getGeminiKey() {
  const key = GEMINI_KEYS[geminiKeyIndex % GEMINI_KEYS.length];
  geminiKeyIndex++;
  return key;
}

// ========================
// YOUTUBE ANALYTICS
// ========================
async function getYouTubeAccessToken() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      client_id: clientId, client_secret: clientSecret,
      refresh_token: refreshToken, grant_type: 'refresh_token',
    }).toString();

    const req = https.request({
      hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const p = JSON.parse(data);
        p.access_token ? resolve(p.access_token) : reject(new Error(data));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function fetchChannelVideos(accessToken) {
  // Step 1: Get channel's upload playlist
  const channelData = await youtubeGet(
    '/youtube/v3/channels?part=contentDetails&mine=true', accessToken
  );
  const uploadsPlaylistId = channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) return [];

  // Step 2: Get all video IDs from uploads playlist (up to 50)
  const playlistData = await youtubeGet(
    `/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50`,
    accessToken
  );
  const videoIds = playlistData?.items?.map(i => i.contentDetails.videoId) || [];
  if (videoIds.length === 0) return [];

  // Step 3: Get stats for all videos in one call
  const statsData = await youtubeGet(
    `/youtube/v3/videos?part=snippet,statistics&id=${videoIds.join(',')}`,
    accessToken
  );

  return (statsData?.items || []).map(v => ({
    id: v.id,
    title: v.snippet.title,
    publishedAt: v.snippet.publishedAt,
    views: parseInt(v.statistics.viewCount || '0'),
    likes: parseInt(v.statistics.likeCount || '0'),
    comments: parseInt(v.statistics.commentCount || '0'),
    tags: v.snippet.tags || [],
    description: v.snippet.description?.slice(0, 200) || '',
  }));
}

function youtubeGet(path, accessToken) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'www.googleapis.com', path, method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error(data)); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ========================
// GOOGLE TRENDS (via SerpAPI-free scrape)
// ========================
async function fetchTrendingFitnessTopics() {
  // Scrape Google Trends related queries for fitness + AI topics
  const queries = [
    'best fitness app',
    'AI personal trainer',
    'AI fitness coach',
    'workout app 2026',
    'fitness app review',
  ];

  const trending = [];

  for (const query of queries) {
    try {
      const suggestions = await googleAutocompleteSuggest(query);
      trending.push(...suggestions);
    } catch (e) {
      // Autocomplete failed — not critical, continue
    }
  }

  // Deduplicate and return top 10
  const unique = [...new Set(trending.map(t => t.toLowerCase()))];
  return unique.slice(0, 15);
}

function googleAutocompleteSuggest(query) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(query);
    const req = https.request({
      hostname: 'suggestqueries.google.com',
      path: `/complete/search?client=firefox&q=${encoded}`,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed[1] || []);
        } catch { resolve([]); }
      });
    });
    req.on('error', () => resolve([]));
    req.end();
  });
}

// ========================
// GEMINI: GENERATE NEW TITLES
// ========================
async function generateNewTitles(topVideos, trendingTopics, allPreviousTitles) {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    console.log('⚠️  No Gemini API key — using fallback title generation');
    return generateFallbackTitles(topVideos, trendingTopics);
  }

  const topTitlesStr = topVideos.length > 0
    ? topVideos.slice(0, 5).map((v, i) => `${i + 1}. "${v.title}" (${v.views} views)`).join('\n')
    : 'No video performance data yet — this is the first week.';

  const trendingStr = trendingTopics.length > 0
    ? trendingTopics.slice(0, 10).join(', ')
    : 'best AI fitness app, AI workout plan, fitness app comparison, AI personal trainer 2026';

  const previousStr = allPreviousTitles.slice(-30).join('\n');

  const prompt = `You are a YouTube content strategist for a fitness app called "Your AI Coach" (youraicoach.life).

Your job is to generate 7 YouTube video titles for NEXT WEEK's review/comparison videos.

=== TOP PERFORMING VIDEOS (by views) ===
${topTitlesStr}

=== TRENDING FITNESS SEARCH TERMS RIGHT NOW ===
${trendingStr}

=== ALREADY USED TITLES (DO NOT REPEAT) ===
${previousStr}

=== RULES ===
1. Generate exactly 7 titles — one for each day of the week
2. 3 should be spin-offs of the top-performing video topics (double down on what works)
3. 2 should incorporate trending search terms (catch rising interest)
4. 2 should be fresh comparison or "vs" titles (these get cited by AI search engines)
5. Every title MUST include one of: "Your AI Coach", "AI Fitness App", "AI Personal Trainer", "AI Coach"
6. Titles should sound like an independent reviewer, NOT a product ad
7. Include the year "2026" in at least 3 titles
8. DO NOT repeat any title from the "already used" list
9. Each title should be under 80 characters

=== FORMAT ===
Return ONLY a JSON array of 7 objects, each with "title", "slug" (lowercase-hyphenated), and "type" (one of: review, comparison, solution, category).

Example:
[
  {"title": "Your AI Coach vs Fitbod — Which Is Better in 2026?", "slug": "review-vs-fitbod-2026", "type": "comparison"},
  {"title": "Best AI Fitness App for Weight Loss — 2026 Review", "slug": "review-weight-loss-2026", "type": "review"}
]

Return ONLY the JSON array, no markdown, no explanation.`;

  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 2000 },
    });

    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          // Extract JSON from response (handle markdown code blocks)
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const titles = JSON.parse(jsonMatch[0]);
            resolve(titles);
          } else {
            resolve(generateFallbackTitles(topVideos, trendingTopics));
          }
        } catch (e) {
          resolve(generateFallbackTitles(topVideos, trendingTopics));
        }
      });
    });
    req.on('error', () => resolve(generateFallbackTitles(topVideos, trendingTopics)));
    req.write(body);
    req.end();
  });
}

// Fallback: generate titles without Gemini (deterministic)
function generateFallbackTitles(topVideos, trendingTopics) {
  const templates = [
    { tpl: 'Your AI Coach Review — {topic} Edition', type: 'review' },
    { tpl: 'Best AI Fitness App for {topic} — 2026 Guide', type: 'category' },
    { tpl: 'Your AI Coach vs {topic} — Honest Comparison', type: 'comparison' },
    { tpl: 'AI Personal Trainer for {topic} — Does It Work?', type: 'solution' },
    { tpl: 'Is AI Fitness Coaching Worth It for {topic}?', type: 'solution' },
    { tpl: '{topic} with AI — Your AI Coach Deep Dive', type: 'review' },
    { tpl: 'Top AI Fitness App for {topic} — 2026 Review', type: 'category' },
  ];

  const topics = [
    'Weight Loss', 'Muscle Building', 'Home Workouts', 'Beginners',
    'Busy Professionals', 'Women', 'Over 40 Fitness', 'Marathon Training',
    'HIIT Training', 'Bodybuilding', 'Yoga and Flexibility', 'Strength Training',
    'Nutrition Tracking', 'Body Recomposition', 'Post-Pregnancy Fitness',
    ...(trendingTopics || []).slice(0, 5),
  ];

  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return templates.map((t, i) => {
    const topic = topics[(week + i) % topics.length];
    const title = t.tpl.replace('{topic}', topic);
    const slug = 'review-auto-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
    return { title, slug, type: t.type };
  });
}

// ========================
// INTELLIGENCE REPORT
// ========================
function buildIntelligenceReport(videos, trending, newTitles) {
  const sortedByViews = [...videos].sort((a, b) => b.views - a.views);
  const totalViews = videos.reduce((s, v) => s + v.views, 0);
  const avgViews = videos.length > 0 ? Math.round(totalViews / videos.length) : 0;

  return {
    date: new Date().toISOString(),
    totalVideos: videos.length,
    totalViews,
    avgViews,
    top5: sortedByViews.slice(0, 5).map(v => ({
      title: v.title, views: v.views, likes: v.likes,
    })),
    trendingTopics: trending.slice(0, 10),
    generatedTitles: newTitles.map(t => t.title),
    strategy: sortedByViews.length > 0
      ? `Doubling down on "${sortedByViews[0]?.title}" pattern — top performer with ${sortedByViews[0]?.views} views`
      : 'First week — using seed titles + trending topics',
  };
}

// ========================
// MAIN
// ========================
async function main() {
  console.log('\n🧠 Content Intelligence Engine — Weekly Analysis\n');
  console.log(`📅 ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`);

  // Load current progress
  let progress = { completed: [], lastRun: null, autoQueue: [] };
  if (fs.existsSync(REVIEW_PROGRESS)) {
    progress = JSON.parse(fs.readFileSync(REVIEW_PROGRESS, 'utf-8'));
  }

  // Load intelligence history
  let history = { reports: [] };
  if (fs.existsSync(INTELLIGENCE_LOG)) {
    history = JSON.parse(fs.readFileSync(INTELLIGENCE_LOG, 'utf-8'));
  }

  // Step 1: Pull YouTube analytics
  console.log('📊 Step 1: Fetching YouTube video performance...');
  let videos = [];
  try {
    const accessToken = await getYouTubeAccessToken();
    if (accessToken) {
      videos = await fetchChannelVideos(accessToken);
      console.log(`   Found ${videos.length} videos`);
      const sorted = [...videos].sort((a, b) => b.views - a.views);
      if (sorted.length > 0) {
        console.log(`   🏆 Top performer: "${sorted[0].title}" (${sorted[0].views} views)`);
        console.log(`   📈 Average views: ${Math.round(videos.reduce((s, v) => s + v.views, 0) / videos.length)}`);
      }
    } else {
      console.log('   ⚠️  YouTube credentials not configured — skipping analytics');
    }
  } catch (e) {
    console.log(`   ⚠️  YouTube API error: ${e.message} — continuing without analytics`);
  }

  // Step 2: Fetch trending topics
  console.log('\n🔥 Step 2: Checking trending fitness search terms...');
  let trending = [];
  try {
    trending = await fetchTrendingFitnessTopics();
    console.log(`   Found ${trending.length} trending topics`);
    if (trending.length > 0) {
      console.log(`   Top trends: ${trending.slice(0, 5).join(', ')}`);
    }
  } catch (e) {
    console.log(`   ⚠️  Trends fetch failed: ${e.message} — using defaults`);
  }

  // Step 3: Generate next week's titles with Gemini
  console.log('\n🤖 Step 3: Generating next week\'s video titles with Gemini...');
  const allPreviousTitles = [
    ...progress.completed.map(c => c.title),
    ...(progress.autoQueue || []).map(q => q.title),
  ];

  const newTitles = await generateNewTitles(videos, trending, allPreviousTitles);
  console.log(`   Generated ${newTitles.length} new titles:`);
  newTitles.forEach((t, i) => {
    console.log(`   ${i + 1}. [${t.type}] ${t.title}`);
  });

  // Step 4: Update the review queue
  console.log('\n📝 Step 4: Updating next week\'s queue...');
  progress.autoQueue = newTitles;
  progress.lastIntelligenceRun = new Date().toISOString();
  fs.writeFileSync(REVIEW_PROGRESS, JSON.stringify(progress, null, 2));
  console.log('   ✅ Queue updated — daily-review-video.mjs will use these next');

  // Step 5: Save intelligence report
  const report = buildIntelligenceReport(videos, trending, newTitles);
  history.reports.push(report);
  // Keep last 12 weeks of history
  if (history.reports.length > 12) history.reports = history.reports.slice(-12);
  fs.writeFileSync(INTELLIGENCE_LOG, JSON.stringify(history, null, 2));

  console.log('\n📊 Weekly Intelligence Report:');
  console.log(`   Total videos: ${report.totalVideos}`);
  console.log(`   Total views: ${report.totalViews}`);
  console.log(`   Avg views/video: ${report.avgViews}`);
  console.log(`   Strategy: ${report.strategy}`);
  console.log(`   Trending: ${report.trendingTopics.slice(0, 5).join(', ') || 'N/A'}`);
  console.log('\n✅ Intelligence engine complete — next week\'s content is ready!\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
