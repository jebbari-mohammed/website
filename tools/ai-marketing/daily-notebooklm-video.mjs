/**
 * Daily NotebookLM video workflow.
 *
 * Creates a fresh NotebookLM project for one website post, generates a
 * NotebookLM Video Overview, uploads the MP4 to YouTube, then embeds the
 * YouTube video back into the website.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import https from 'https';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath, URL } from 'url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');
const BLOG_DIR = path.join(PUBLIC_DIR, 'blog');
const DAILY_PROGRESS_FILE = path.join(__dirname, '.daily-progress.json');
const VIDEO_PROGRESS_FILE = path.join(__dirname, '.notebooklm-video-progress.json');
const YOUTUBE_PAGE = path.join(PUBLIC_DIR, 'youtube', 'index.html');
const SITE_URL = 'https://youraicoach.life';
const WORK_DIR = path.join(os.tmpdir(), 'izem-notebooklm-video');

const NOTEBOOKLM_BIN = process.env.NOTEBOOKLM_BIN || 'notebooklm';
const VIDEO_FORMAT = process.env.NOTEBOOKLM_VIDEO_FORMAT || 'brief';
const VIDEO_STYLE = process.env.NOTEBOOKLM_VIDEO_STYLE || 'classic';

function loadEnv() {
  const envPath = path.join(REPO_ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const [key, ...valueParts] = line.split('=');
    if (!key || key.trim().startsWith('#')) continue;
    process.env[key.trim()] = valueParts.join('=').trim().replace(/^"|"$/g, '');
  }
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<\/(h1|h2|h3|p|li|tr|section|article|div)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getTagContent(html, tag) {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? htmlToText(match[1]) : '';
}

function getMetaContent(html, name) {
  const match = html.match(new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["']`, 'i'));
  return match ? match[1].trim() : '';
}

function readPostFromSlug(slug, fallback = {}) {
  const file = path.join(BLOG_DIR, `${slug}.html`);
  if (!fs.existsSync(file)) return null;
  const html = fs.readFileSync(file, 'utf8');
  const title = getTagContent(html, 'h1') || fallback.title || getTagContent(html, 'title') || slug;
  const description = getMetaContent(html, 'description') || fallback.description || '';
  return {
    slug,
    title,
    description,
    file,
    url: `${SITE_URL}/blog/${slug}`,
    html,
  };
}

function getBlogIndexCandidates() {
  const indexFile = path.join(BLOG_DIR, 'index.html');
  if (!fs.existsSync(indexFile)) return [];
  const html = fs.readFileSync(indexFile, 'utf8');
  const seen = new Set();
  const candidates = [];
  for (const match of html.matchAll(/href=["']\/blog\/([^"'/#?]+)["'][^>]*>([\s\S]*?)<\/a>/g)) {
    const slug = match[1];
    if (slug === 'index' || seen.has(slug)) continue;
    seen.add(slug);
    candidates.push({
      slug,
      title: htmlToText(match[2]) || slug,
    });
  }
  return candidates;
}

function selectTargetPost(progress) {
  if (process.env.NOTEBOOKLM_POST_SLUG) {
    const forced = readPostFromSlug(process.env.NOTEBOOKLM_POST_SLUG);
    if (!forced) throw new Error(`NOTEBOOKLM_POST_SLUG not found: ${process.env.NOTEBOOKLM_POST_SLUG}`);
    return forced;
  }

  const completed = new Set((progress.completed || []).map(item => item.slug));
  const dailyProgress = readJson(DAILY_PROGRESS_FILE, { generated: [] });
  const generated = [...(dailyProgress.generated || [])].reverse();
  for (const item of generated) {
    if (completed.has(item.slug)) continue;
    const post = readPostFromSlug(item.slug, item);
    if (post) return post;
  }

  for (const item of getBlogIndexCandidates()) {
    if (completed.has(item.slug)) continue;
    const post = readPostFromSlug(item.slug, item);
    if (post) return post;
  }

  return null;
}

function parseJsonFromOutput(output) {
  const trimmed = output.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed);
  } catch {}

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }
  throw new Error(`Command did not return JSON: ${trimmed.slice(0, 500)}`);
}

async function runNotebookLM(args, options = {}) {
  const printable = [NOTEBOOKLM_BIN, ...args].join(' ');
  console.log(`$ ${printable}`);
  const result = await execFileAsync(NOTEBOOKLM_BIN, args, {
    cwd: REPO_ROOT,
    env: process.env,
    timeout: options.timeout || 45 * 60 * 1000,
    maxBuffer: 30 * 1024 * 1024,
  });
  if (result.stderr?.trim()) process.stderr.write(result.stderr);
  return result.stdout || '';
}

async function runNotebookLMJson(args, options = {}) {
  const output = await runNotebookLM(args, options);
  return parseJsonFromOutput(output);
}

function extractNotebookId(createResult) {
  const candidates = [
    createResult.active_notebook_id,
    createResult.notebook_id,
    createResult.id,
    createResult.notebook?.id,
    createResult.data?.active_notebook_id,
    createResult.data?.notebook_id,
    createResult.data?.notebook?.id,
  ].filter(Boolean);
  if (!candidates.length) {
    throw new Error(`Could not find notebook id in create output: ${JSON.stringify(createResult).slice(0, 800)}`);
  }
  return candidates[0];
}

function buildSourceMarkdown(post) {
  const articleText = htmlToText(post.html);
  return `# ${post.title}

Canonical URL: ${post.url}
Meta description: ${post.description}

## Brand facts for the video
- Brand: IZEM.
- IZEM is a premium AI personal trainer and accountability coach.
- Core promise: the AI coach calls you, reviews your day, and adapts your workout and meal plan every week.
- Differentiators: proactive AI calls, day reviews, personalized workouts, practical meal plans, food scanning, body progress scanning, gym equipment scanning, weekly adaptation, and coach memory/context.
- Pricing anchor: around $24.99/month, with annual plan positioned as best value.
- Safe positioning: general fitness and nutrition guidance only. Do not claim medical care, diagnosis, guaranteed results, fake studies, or fake user outcomes.
- Voice: write and speak like a human coach/founder who has talked to real users. Use plain language, contractions, concrete examples, and short sentences. Avoid SEO filler, corporate phrasing, and robotic transitions.
- Instruction style: tell the viewer exactly what to do next. Give specific steps such as choosing a goal, setting training days, answering the coach call, scanning food or equipment, doing the first workout, reviewing the day, and letting IZEM adapt the week.

## Website article source
${articleText}
`;
}

function buildVideoPrompt(post) {
  return `Create a polished NotebookLM Video Overview for the article "${post.title}".

Audience: people comparing AI personal trainers, fitness apps, and workout accountability tools.

Style:
- Premium, practical, and direct.
- Founder/product-expert tone, not a cheap app ad.
- Always write and speak like a real human, not a search-engine article, corporate narrator, or AI assistant.
- Use natural phrasing, contractions, simple words, and concrete situations from a normal week.
- Do not use vague advice like "stay consistent" unless you immediately explain exactly how to do it.
- Explain why the topic matters in everyday fitness decisions.
- Mention IZEM naturally as the AI personal trainer that can call, review the day, remember context, scan food/body/equipment, and adapt workouts and meals weekly.
- Include one honest limitation: human professionals are still important for injuries, medical concerns, hands-on form correction, or elite sport-specific coaching.
- No fake research, fake results, "only app in the world" claims, or medical claims.
- Tell the viewer exactly what to do next. Include a clear sequence: pick one goal, set realistic training days, take the first IZEM call, scan the food or equipment that matters today, do the first workout, review the day, and let the weekly plan adapt.
- End with a human, specific CTA to read the full article at ${post.url}, try IZEM at ${SITE_URL}, and do the first setup step today.

Visual direction:
- Clean fitness-tech explainer.
- Show clear section titles, comparison moments, and simple diagrams.
- Include one "what to do today" checklist near the end.
- Avoid cluttered dashboards and exaggerated transformation imagery.`;
}

async function createNotebookVideo(post) {
  fs.mkdirSync(WORK_DIR, { recursive: true });

  const baseName = slugify(post.slug || post.title);
  const sourceFile = path.join(WORK_DIR, `${baseName}-source.md`);
  const promptFile = path.join(WORK_DIR, `${baseName}-video-prompt.txt`);
  const outputFile = path.join(WORK_DIR, `${baseName}.mp4`);

  fs.writeFileSync(sourceFile, buildSourceMarkdown(post));
  fs.writeFileSync(promptFile, buildVideoPrompt(post));
  if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);

  await runNotebookLMJson(['auth', 'check', '--test', '--json'], { timeout: 2 * 60 * 1000 });

  const notebookTitle = `IZEM Video - ${post.title}`.slice(0, 120);
  const createResult = await runNotebookLMJson(['create', notebookTitle, '--use', '--json'], { timeout: 3 * 60 * 1000 });
  const notebookId = extractNotebookId(createResult);
  console.log(`Created NotebookLM project: ${notebookId}`);

  await runNotebookLMJson([
    'source',
    'add',
    sourceFile,
    '-n',
    notebookId,
    '--title',
    `${post.title} - website source`,
    '--timeout',
    '240',
    '--json',
  ], { timeout: 6 * 60 * 1000 });

  await runNotebookLMJson([
    'generate',
    'video',
    '-n',
    notebookId,
    '--format',
    VIDEO_FORMAT,
    '--style',
    VIDEO_STYLE,
    '--prompt-file',
    promptFile,
    '--wait',
    '--timeout',
    process.env.NOTEBOOKLM_VIDEO_TIMEOUT || '1800',
    '--json',
  ], { timeout: 45 * 60 * 1000 });

  await runNotebookLMJson([
    'download',
    'video',
    outputFile,
    '-n',
    notebookId,
    '--latest',
    '--force',
    '--json',
  ], { timeout: 10 * 60 * 1000 });

  if (!fs.existsSync(outputFile)) throw new Error(`NotebookLM video was not downloaded: ${outputFile}`);
  return { notebookId, outputFile };
}

async function getYouTubeAccessToken() {
  const clientId = process.env.YOUTUBE_CLIENT_ID_2 || process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET_2 || process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN_2 || process.env.YOUTUBE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing YouTube OAuth secrets. Set YOUTUBE_CLIENT_ID(_2), YOUTUBE_CLIENT_SECRET(_2), and YOUTUBE_REFRESH_TOKEN(_2).');
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
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const parsed = JSON.parse(data || '{}');
        if (parsed.access_token) resolve(parsed.access_token);
        else reject(new Error(`YouTube token request failed: ${data}`));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function buildYouTubeDescription(post) {
  return `NotebookLM video overview for: ${post.title}

Read the full article:
${post.url}

Try IZEM:
${SITE_URL}

IZEM is a premium AI personal trainer that can call you, review your day, build adaptive workouts and meal plans, scan food, scan body progress, scan gym equipment, and update your plan every week.

What this video covers:
- The practical fitness problem behind the article
- How AI coaching can reduce decision fatigue
- Where IZEM's calls, scans, meals, and weekly adaptation fit
- Where human professionals are still the better choice

Download IZEM:
iOS: https://apps.apple.com/app/your-ai-coach
Android: https://play.google.com/store/apps/details?id=com.ai.gym.coach

#IZEM #AIFitness #AIPersonalTrainer #FitnessApp #WorkoutAccountability #NotebookLM`;
}

async function uploadToYouTube(filePath, post, accessToken) {
  const fileSize = fs.statSync(filePath).size;
  const metadata = {
    snippet: {
      title: `${post.title} | IZEM AI Fitness Coach`.slice(0, 100),
      description: buildYouTubeDescription(post).slice(0, 5000),
      tags: [
        'IZEM',
        'AI fitness app',
        'AI personal trainer',
        'fitness app',
        'workout accountability',
        'AI coach',
        'NotebookLM',
      ],
      categoryId: '26',
      defaultLanguage: 'en',
    },
    status: {
      privacyStatus: process.env.YOUTUBE_PRIVACY_STATUS || 'public',
      selfDeclaredMadeForKids: false,
    },
  };

  const uploadUrl = await new Promise((resolve, reject) => {
    const body = JSON.stringify(metadata);
    const req = https.request({
      hostname: 'www.googleapis.com',
      path: '/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': 'video/mp4',
        'X-Upload-Content-Length': fileSize,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      if (res.statusCode === 200) {
        resolve(res.headers.location);
        return;
      }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => reject(new Error(`YouTube upload init failed ${res.statusCode}: ${data}`)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  return new Promise((resolve, reject) => {
    const url = new URL(uploadUrl);
    const stream = fs.createReadStream(filePath);
    let uploaded = 0;

    const req = https.request({
      hostname: url.hostname,
      path: `${url.pathname}${url.search}`,
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'video/mp4',
        'Content-Length': fileSize,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const parsed = JSON.parse(data || '{}');
          resolve(`https://youtube.com/watch?v=${parsed.id}`);
        } else {
          reject(new Error(`YouTube upload failed ${res.statusCode}: ${data}`));
        }
      });
    });

    stream.on('data', chunk => {
      uploaded += chunk.length;
      process.stdout.write(`\rUploading: ${Math.round((uploaded / fileSize) * 100)}%`);
    });
    stream.on('end', () => process.stdout.write('\n'));
    stream.on('error', reject);
    req.on('error', reject);
    stream.pipe(req);
  });
}

function extractYouTubeId(url) {
  const parsed = new URL(url);
  if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1);
  return parsed.searchParams.get('v') || '';
}

function buildEmbedBlock(post, youtubeUrl, notebookId) {
  const videoId = extractYouTubeId(youtubeUrl);
  if (!videoId) throw new Error(`Could not extract YouTube video id from ${youtubeUrl}`);
  const title = escapeHtml(post.title);
  const escapedNotebookId = escapeHtml(notebookId);
  return `<!-- NOTEBOOKLM_VIDEO_START -->
<section class="notebooklm-video" style="margin:32px 0;padding:24px;border:1px solid rgba(55,199,201,.25);border-radius:8px;background:rgba(55,199,201,.08)">
  <h2 style="margin-top:0">Watch the NotebookLM video overview</h2>
  <div style="position:relative;aspect-ratio:16/9;background:#02070D;border-radius:8px;overflow:hidden">
    <iframe src="https://www.youtube.com/embed/${videoId}" title="${title} video overview" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>
  </div>
  <p style="margin:14px 0 0;color:#AEBBCC">This video was generated from the article with a fresh NotebookLM project and published on the IZEM YouTube channel.</p>
  <p style="margin:8px 0 0;color:#7C8A9B;font-size:.9rem">NotebookLM project: ${escapedNotebookId}</p>
</section>
<!-- NOTEBOOKLM_VIDEO_END -->`;
}

function embedVideoInPost(post, youtubeUrl, notebookId) {
  const block = buildEmbedBlock(post, youtubeUrl, notebookId);
  let html = fs.readFileSync(post.file, 'utf8');

  if (html.includes('<!-- NOTEBOOKLM_VIDEO_START -->')) {
    html = html.replace(/<!-- NOTEBOOKLM_VIDEO_START -->[\s\S]*?<!-- NOTEBOOKLM_VIDEO_END -->/, block);
  } else if (/<article[^>]*>/i.test(html)) {
    html = html.replace(/<article[^>]*>/i, match => `${match}\n${block}`);
  } else if (/<main[^>]*>/i.test(html)) {
    html = html.replace(/<main[^>]*>/i, match => `${match}\n${block}`);
  } else if (/<h1[^>]*>[\s\S]*?<\/h1>/i.test(html)) {
    html = html.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, match => `${match}\n${block}`);
  } else {
    html = html.replace(/<body[^>]*>/i, match => `${match}\n${block}`);
  }

  fs.writeFileSync(post.file, html);
}

function buildYoutubeCard(post, youtubeUrl) {
  const videoId = extractYouTubeId(youtubeUrl);
  const title = escapeHtml(post.title);
  return `<a data-video-id="${videoId}" href="${youtubeUrl}" target="_blank" rel="noopener" style="display:block;background:rgba(12,18,50,0.72);border:1px solid rgba(255,255,255,0.09);border-radius:12px;overflow:hidden;text-decoration:none">
  <img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="${title}" style="display:block;width:100%;aspect-ratio:16/9;object-fit:cover">
  <span style="display:block;padding:14px 16px;color:#F8FAFC;font-weight:700">${title}</span>
  <span style="display:block;padding:0 16px 16px;color:#94A3B8;font-size:.9rem">Generated with a fresh NotebookLM project from the website article.</span>
</a>`;
}

function updateYoutubePage(post, youtubeUrl) {
  if (!fs.existsSync(YOUTUBE_PAGE)) return;
  const card = buildYoutubeCard(post, youtubeUrl);
  let html = fs.readFileSync(YOUTUBE_PAGE, 'utf8');
  const markerStart = '<!-- NOTEBOOKLM_VIDEO_FEED_START -->';
  const markerEnd = '<!-- NOTEBOOKLM_VIDEO_FEED_END -->';
  const videoId = extractYouTubeId(youtubeUrl);

  if (!html.includes(markerStart)) {
    const section = `${markerStart}
    <section style="margin:24px 0 44px">
        <h2>Latest NotebookLM Videos</h2>
        <div class="notebooklm-video-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px">
            ${card}
        </div>
    </section>
    ${markerEnd}`;
    html = html.replace('<h2>What We Cover</h2>', `${section}\n\n    <h2>What We Cover</h2>`);
  } else {
    html = html.replace(new RegExp(`${markerStart}[\\s\\S]*?${markerEnd}`), match => {
      const existingCards = [...match.matchAll(/<a data-video-id="([^"]+)"[\s\S]*?<\/a>/g)]
        .filter(existing => existing[1] !== videoId)
        .map(existing => existing[0]);
      const cards = [card, ...existingCards].slice(0, 6).join('\n');
      return `${markerStart}
    <section style="margin:24px 0 44px">
        <h2>Latest NotebookLM Videos</h2>
        <div class="notebooklm-video-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px">
            ${cards}
        </div>
    </section>
    ${markerEnd}`;
    });
  }

  fs.writeFileSync(YOUTUBE_PAGE, html);
}

async function main() {
  loadEnv();
  fs.mkdirSync(WORK_DIR, { recursive: true });

  if (!process.env.NOTEBOOKLM_AUTH_JSON && process.env.CI) {
    throw new Error('Missing NOTEBOOKLM_AUTH_JSON. Add a GitHub secret containing NotebookLM storage_state.json.');
  }

  const progress = readJson(VIDEO_PROGRESS_FILE, { completed: [] });
  const post = selectTargetPost(progress);
  if (!post) {
    console.log('No unprocessed blog post found for NotebookLM video generation.');
    return;
  }

  console.log(`Target post: ${post.title}`);
  console.log(`URL: ${post.url}`);

  const { notebookId, outputFile } = await createNotebookVideo(post);
  const accessToken = await getYouTubeAccessToken();
  const youtubeUrl = await uploadToYouTube(outputFile, post, accessToken);

  embedVideoInPost(post, youtubeUrl, notebookId);
  updateYoutubePage(post, youtubeUrl);

  progress.completed = [
    ...(progress.completed || []).filter(item => item.slug !== post.slug),
    {
      slug: post.slug,
      title: post.title,
      url: post.url,
      youtube: youtubeUrl,
      notebook_id: notebookId,
      date: new Date().toISOString(),
    },
  ];
  progress.lastRun = new Date().toISOString();
  writeJson(VIDEO_PROGRESS_FILE, progress);

  console.log('NotebookLM video workflow complete.');
  console.log(`YouTube: ${youtubeUrl}`);
  console.log(`Embedded in: ${post.file}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
