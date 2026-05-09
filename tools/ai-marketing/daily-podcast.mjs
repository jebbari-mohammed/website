/**
 * NotebookLM Daily Podcast Generator — Fresh Notebook Edition
 *
 * Every run creates a BRAND NEW NotebookLM notebook so the content
 * is 100% unique every day. No cached audio overviews.
 *
 * Workflow:
 *   1. Read today's blog post from .daily-progress.json
 *   2. Skip if already uploaded today
 *   3. Launch browser with saved MCP auth
 *   4. Create a FRESH notebook (no old sources)
 *   5. Add ONLY today's blog post URL as source
 *   6. Generate audio/video with topic-specific prompt
 *   7. Download the real animated MP4
 *   8. Upload to YouTube
 *   9. Delete the notebook (keep account clean)
 *
 * Required env vars:
 *   YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath, URL } from 'url';
import {
  launchBrowser,
  createFreshNotebook,
  addSource,
  generateFreshVideo,
  downloadVideo,
  deleteNotebook,
} from './notebooklm-fresh.mjs';

// Load .env
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

const PROGRESS_FILE = path.join(__dirname, '.daily-progress.json');
const PUBLIC_DIR = path.resolve(__dirname, '../../public');
const PODCAST_DIR = path.join(PUBLIC_DIR, 'podcasts');
const SITE_URL = 'https://youraicoach.life';

if (!fs.existsSync(PODCAST_DIR)) fs.mkdirSync(PODCAST_DIR, { recursive: true });

// ========================
// YOUTUBE HELPERS
// ========================
async function getYouTubeAccessToken() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString();

    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const parsed = JSON.parse(data);
        parsed.access_token ? resolve(parsed.access_token) : reject(new Error(data));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function buildYouTubeDescription(post) {
  const KEYWORDS = [
    'AI fitness app', 'AI personal trainer', 'AI coach app', 'best fitness app 2026',
    'workout app with AI', 'personalized workout plan', 'AI nutrition coach',
    'fitness app with voice coaching', 'AI gym coach', 'smart fitness app',
  ];

  return `🤖 AI-powered fitness coaching explained — from the blog at ${SITE_URL}/blog/${post.slug}

In this podcast episode, two AI hosts break down everything you need to know about: ${post.title}

⏱️ WHAT WE COVER:
• The science behind AI-powered fitness coaching
• How Callio personalizes workouts automatically
• Real results from users using AI-guided training
• Practical tips you can implement today

📱 DOWNLOAD Callio FREE:
→ iOS: https://apps.apple.com/app/your-ai-coach
→ Android: https://play.google.com/store/apps/details?id=com.ai.gym.coach

📖 READ THE FULL ARTICLE:
${SITE_URL}/blog/${post.slug}

🛠️ FREE FITNESS TOOLS:
→ TDEE Calculator: ${SITE_URL}/tools
→ Fitness Glossary: ${SITE_URL}/glossary
→ 1RM Calculator: ${SITE_URL}/tools#1rm

🔑 KEYWORDS: ${KEYWORDS.join(', ')}

#AIFitness #PersonalTrainer #FitnessApp #WorkoutMotivation #AICoach #FitnessGoals #GymLife #WorkoutPlan #NutritionCoaching #FitnessTech`;
}

async function uploadToYouTube(filePath, post, accessToken) {
  const fileSize = fs.statSync(filePath).size;
  const mimeType = 'video/mp4';
  const title = `${post.title} | AI Fitness Podcast 🎙️`;
  const description = buildYouTubeDescription(post);
  const tags = [
    'AI fitness', 'AI personal trainer', 'fitness podcast', 'AI coach',
    'workout tips', 'nutrition advice', 'fitness app', 'gym motivation',
    'personal trainer', 'weight loss', 'muscle building', 'TDEE', 'macros',
  ];

  const metadata = {
    snippet: {
      title: title.slice(0, 100),
      description: description.slice(0, 5000),
      tags,
      categoryId: '26',
      defaultLanguage: 'en',
    },
    status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
  };

  const uploadUrl = await new Promise((resolve, reject) => {
    const metaBody = JSON.stringify(metadata);
    const req = https.request({
      hostname: 'www.googleapis.com',
      path: '/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': fileSize,
        'Content-Length': Buffer.byteLength(metaBody),
      },
    }, (res) => {
      if (res.statusCode === 200) {
        resolve(res.headers.location);
      } else {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => reject(new Error(`Init failed ${res.statusCode}: ${d}`)));
      }
    });
    req.on('error', reject);
    req.write(metaBody);
    req.end();
  });

  return new Promise((resolve, reject) => {
    const urlObj = new URL(uploadUrl);
    const fileStream = fs.createReadStream(filePath);
    let uploaded = 0;

    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': mimeType,
        'Content-Length': fileSize,
      },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const parsed = JSON.parse(data);
          resolve(`https://youtube.com/watch?v=${parsed.id}`);
        } else {
          reject(new Error(`Upload failed ${res.statusCode}: ${data}`));
        }
      });
    });

    fileStream.on('data', (chunk) => {
      uploaded += chunk.length;
      process.stdout.write(`\r   Uploading: ${Math.round(uploaded / fileSize * 100)}%`);
    });
    fileStream.on('end', () => process.stdout.write('\n'));
    fileStream.on('error', reject);
    req.on('error', reject);
    fileStream.pipe(req);
  });
}

// ========================
// MAIN
// ========================
async function main() {
  console.log('\n🎙️ NotebookLM Daily Podcast Generator (Fresh Notebook Edition)\n');

  // Load today's post
  if (!fs.existsSync(PROGRESS_FILE)) {
    console.log('No blog posts yet. Run daily-blog.mjs first.');
    return;
  }

  const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  const post = progress.generated[progress.generated.length - 1];

  if (!post) {
    console.log('No posts found in progress file.');
    return;
  }

  if (post.youtubePodcastUploaded) {
    console.log(`✅ Podcast already uploaded to YouTube for "${post.title}" — skipping.`);
    return;
  }

  console.log(`📝 Today's post: "${post.title}"`);
  console.log(`   Slug: ${post.slug}`);

  const outputFile = path.join(PODCAST_DIR, `${post.slug}.mp4`);
  const blogUrl = `${SITE_URL}/blog/${post.slug}`;

  const customPrompt = `Create an engaging 2-host podcast episode specifically about: "${post.title}"

The hosts are two enthusiastic fitness enthusiasts — one focused on the science, one focused on practical application.

IMPORTANT RULES:
- This episode MUST be specifically about the topic: "${post.title}"
- Cite specific facts, data points, or advice from the source article
- Mention "Callio" app (youraicoach dot life) naturally 2-3 times as the tool that helps with this
- Sound like REAL independent fitness enthusiasts, NOT a product ad
- Include 1-2 specific actionable tips listeners can try TODAY
- End with a clear summary and next step
- Keep it under 5 minutes, conversational and energetic`;

  let context = null;
  let notebookUrl = null;
  let downloadedFile = null;

  try {
    // Launch browser
    const browser = await launchBrowser(true);
    const page = browser.page;
    context = browser.context;

    // Create fresh notebook
    notebookUrl = await createFreshNotebook(page);

    // Add ONLY today's blog post as source
    await addSource(page, blogUrl);

    // Generate unique video with custom prompt
    await generateFreshVideo(page, customPrompt);

    // Download the real MP4
    downloadedFile = await downloadVideo(page, PODCAST_DIR);

    // Rename to slug if different name
    if (downloadedFile && path.basename(downloadedFile) !== `${post.slug}.mp4`) {
      if (!fs.existsSync(outputFile)) {
        fs.renameSync(downloadedFile, outputFile);
        downloadedFile = outputFile;
      }
    }

    console.log(`✅ Video saved: ${outputFile}`);

    // Delete the notebook (clean up)
    await deleteNotebook(page, notebookUrl);

  } catch (err) {
    console.error(`❌ Generation failed: ${err.message}`);
    throw err;
  } finally {
    if (context) {
      try { await context.close(); } catch {}
    }
  }

  // Upload to YouTube
  const videoFile = fs.existsSync(outputFile) ? outputFile : downloadedFile;
  if (!videoFile || !fs.existsSync(videoFile)) {
    console.log('\n⚠️  No video file found to upload');
    return;
  }

  const accessToken = await getYouTubeAccessToken();
  if (!accessToken) {
    console.log('\n📺 YouTube upload skipped — credentials not configured');
  } else {
    console.log('\n📺 Uploading to YouTube...');
    try {
      const youtubeUrl = await uploadToYouTube(videoFile, post, accessToken);
      console.log(`✅ Live on YouTube: ${youtubeUrl}`);

      // Mark as uploaded — prevents re-upload on next run
      post.youtubePodcastUploaded = true;
      post.youtubePodcastUrl = youtubeUrl;
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    } catch (err) {
      console.error(`⚠️  YouTube upload failed: ${err.message}`);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Post: ${post.title}`);
  console.log(`   File: ${videoFile}`);
  console.log(`   Blog: ${SITE_URL}/blog/${post.slug}`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
