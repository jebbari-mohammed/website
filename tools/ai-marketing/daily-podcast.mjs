/**
 * NotebookLM Daily Podcast Generator
 * 
 * Workflow:
 * 1. Reads today's blog post from .daily-progress.json
 * 2. Adds it as a source to your NotebookLM notebook
 * 3. Triggers Audio Overview generation (2-host podcast)
 * 4. Downloads the .m4a audio file
 * 5. Creates an MP4 video with branded thumbnail using FFmpeg
 * 6. Uploads to YouTube with SEO-optimized description
 * 
 * Required env vars:
 *   YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN
 * 
 * Runs LOCALLY on your Mac (not GitHub Actions) since it needs
 * the NotebookLM Chrome profile saved at:
 *   ~/Library/Application Support/notebooklm-mcp/chrome_profile/
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath, URL } from 'url';
import { execSync } from 'child_process';

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
  });
}

const PROGRESS_FILE = path.join(__dirname, '.daily-progress.json');
const PUBLIC_DIR = path.resolve(__dirname, '../../public');
const PODCAST_DIR = path.join(PUBLIC_DIR, 'podcasts');
const NOTEBOOK_URL = 'https://notebooklm.google.com/notebook/5a953e96-18aa-4ec1-bd59-98a1611c4ddb';
const NOTEBOOK_ID = 'your-ai-coach-daily-blog';
const SITE_URL = 'https://youraicoach.life';

if (!fs.existsSync(PODCAST_DIR)) fs.mkdirSync(PODCAST_DIR, { recursive: true });

// ========================
// MCP CLIENT
// ========================
class NotebookLMMCP {
  constructor() {
    this.process = null;
    this.buffer = '';
    this.pending = new Map();
    this.msgId = 1;
    this.ready = false;
  }

  start() {
    return new Promise((resolve, reject) => {
      this.process = spawn('npx', ['notebooklm-mcp@latest'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.process.stdout.on('data', (data) => {
        this.buffer += data.toString();
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop();
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line);
            if (msg.id && this.pending.has(msg.id)) {
              const { resolve, reject } = this.pending.get(msg.id);
              this.pending.delete(msg.id);
              if (msg.error) reject(new Error(msg.error.message));
              else resolve(msg.result);
            }
          } catch (e) {}
        }
      });

      this.process.stderr.on('data', () => {});

      // Initialize
      setTimeout(async () => {
        try {
          await this.send('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'daily-podcast', version: '1.0' },
          });
          this.ready = true;
          resolve();
        } catch (e) { reject(e); }
      }, 3500);
    });
  }

  send(method, params) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.pending.set(id, { resolve, reject });
      this.process.stdin.write(
        JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n'
      );
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`Timeout: ${method}`));
        }
      }, 600000); // 10 min timeout for audio generation
    });
  }

  async callTool(name, args) {
    const result = await this.send('tools/call', { name, arguments: args });
    const text = result?.content?.[0]?.text;
    if (text) {
      try { return JSON.parse(text); }
      catch { return { data: { message: text } }; }
    }
    return result;
  }

  stop() {
    if (this.process) this.process.kill();
  }
}

// ========================
// YOUTUBE UPLOAD
// ========================
async function getYouTubeAccessToken() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null; // YouTube not configured yet
  }

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
• How Your AI Coach personalizes workouts automatically
• Real results from users using AI-guided training
• Practical tips you can implement today

📱 DOWNLOAD YOUR AI COACH FREE:
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

// ========================
// YOUTUBE UPLOAD
// ========================
async function uploadToYouTube(filePath, post, accessToken) {
  const fileSize = fs.statSync(filePath).size;
  const mimeType = filePath.endsWith('.mp4') ? 'video/mp4' : 'audio/mp4';
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
      categoryId: '26', // How-to & Style — closest to fitness
      defaultLanguage: 'en',
    },
    status: {
      privacyStatus: 'public',
      selfDeclaredMadeForKids: false,
    },
  };

  // Step 1: Initiate resumable upload
  const uploadUrl = await new Promise((resolve, reject) => {
    const metaBody = JSON.stringify(metadata);
    const req = https.request({
      hostname: 'www.googleapis.com',
      path: `/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`,
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

  // Step 2: Stream the file
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
  console.log('\n🎙️ NotebookLM Daily Podcast Generator\n');

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

  const audioOut = path.join(PODCAST_DIR, `${post.slug}.m4a`);
  const videoOut = path.join(PODCAST_DIR, `${post.slug}.mp4`);

  if (fs.existsSync(audioOut)) {
    console.log(`✅ Audio already exists for "${post.title}" — skipping generation`);
  } else {
    console.log(`📝 Generating podcast for: "${post.title}"`);

    // Start MCP
    const mcp = new NotebookLMMCP();
    await mcp.start();
    console.log('✅ NotebookLM MCP connected');

    try {
      // Add blog post as source
      const blogUrl = `${SITE_URL}/blog/${post.slug}`;
      console.log(`📎 Adding source: ${blogUrl}`);

      const addResult = await mcp.callTool('add_source', {
        notebook_id: NOTEBOOK_ID,
        notebook_url: NOTEBOOK_URL,
        type: 'url',
        content: blogUrl,
      });
      console.log('✅ Source added:', addResult?.data?.message || 'OK');

      // Generate audio overview
      console.log('🎙️ Generating Audio Overview (this takes 3-8 minutes)...');
      const audioResult = await mcp.callTool('generate_audio', {
        notebook_id: NOTEBOOK_ID,
        notebook_url: NOTEBOOK_URL,
        custom_prompt: `Create an engaging 2-host podcast about: ${post.title}. 
The hosts should discuss practical fitness applications, cite specific data points, 
mention "Your AI Coach" app naturally as the solution, and end with actionable tips.
Make it feel like a real fitness podcast episode, not a product ad.`,
        timeout_ms: 480000,
      });
      console.log('✅ Audio generated:', audioResult?.data?.message || 'OK');

      // Download audio
      console.log(`⬇️ Downloading audio to ${audioOut}...`);
      const dlResult = await mcp.callTool('download_audio', {
        notebook_id: NOTEBOOK_ID,
        notebook_url: NOTEBOOK_URL,
        destination_dir: PODCAST_DIR,
      });
      console.log('✅ Downloaded:', dlResult?.data?.file || audioOut);

      // Rename to slug if needed
      const latestM4a = fs.readdirSync(PODCAST_DIR)
        .filter(f => f.endsWith('.m4a') && f !== `${post.slug}.m4a`)
        .map(f => ({ f, t: fs.statSync(path.join(PODCAST_DIR, f)).mtimeMs }))
        .sort((a, b) => b.t - a.t)[0]?.f;
      if (latestM4a && !fs.existsSync(audioOut)) {
        fs.renameSync(path.join(PODCAST_DIR, latestM4a), audioOut);
      }

    } finally {
      mcp.stop();
    }
  }

  // Convert to MP4 with branded thumbnail if FFmpeg available
  if (!fs.existsSync(videoOut) && fs.existsSync(audioOut)) {
    try {
      execSync('which ffmpeg', { stdio: 'ignore' });
      const thumbPath = path.join(PUBLIC_DIR, 'og', `${post.slug}.svg`);
      const thumbPng = path.join(PODCAST_DIR, `${post.slug}-thumb.png`);

      // Convert SVG thumb to PNG if possible, otherwise use a color
      let videoInput = '-f lavfi -i color=c=0x060B1D:size=1280x720:rate=1';
      if (fs.existsSync(thumbPath)) {
        try {
          execSync(`rsvg-convert -w 1280 -h 720 "${thumbPath}" -o "${thumbPng}"`, { stdio: 'ignore' });
          if (fs.existsSync(thumbPng)) videoInput = `-loop 1 -i "${thumbPng}"`;
        } catch {}
      }

      console.log('🎬 Creating MP4 video...');
      execSync(
        `ffmpeg -y ${videoInput} -i "${audioOut}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${videoOut}"`,
        { stdio: 'ignore' }
      );
      console.log(`✅ Video created: ${videoOut}`);
    } catch (e) {
      console.log('⚠️ FFmpeg not found — skipping video. Install with: brew install ffmpeg');
      console.log('   Audio file saved at:', audioOut);
    }
  }

  // Upload to YouTube
  const videoFile = fs.existsSync(videoOut) ? videoOut : audioOut;
  const accessToken = await getYouTubeAccessToken();

  if (!accessToken) {
    console.log('\n📺 YouTube upload skipped — credentials not configured');
  } else if (!fs.existsSync(videoFile)) {
    console.log('\n⚠️  No video/audio file found to upload');
  } else {
    console.log('\n📺 Uploading to YouTube...');
    try {
      const youtubeUrl = await uploadToYouTube(videoFile, post, accessToken);
      console.log(`✅ Live on YouTube: ${youtubeUrl}`);
    } catch (err) {
      console.error('⚠️  YouTube upload failed:', err.message);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Post: ${post.title}`);
  if (fs.existsSync(videoFile)) console.log(`   File: ${videoFile}`);
  console.log(`   Blog: ${SITE_URL}/blog/${post.slug}`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
