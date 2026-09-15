#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import https from 'node:https';
import process from 'node:process';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath, URL } from 'node:url';
import { assertVideoIsPeopleFree } from './video-human-safety.mjs';

const execFileAsync = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const PUBLIC = path.join(ROOT, 'public');
const BLOG = path.join(PUBLIC, 'blog');
const PROGRESS_FILE = path.join(HERE, '.notebooklm-video-progress.json');
const FACTS_FILE = path.join(ROOT, 'data', 'brand', 'product-facts.json');
const SITE_URL = 'https://youraicoach.life';
const WORK_DIR = path.join(os.tmpdir(), 'izem-notebooklm-video');
const NOTEBOOKLM_BIN = process.env.NOTEBOOKLM_BIN || 'notebooklm';
const VIDEO_FORMAT = process.env.NOTEBOOKLM_VIDEO_FORMAT || 'brief';
const VIDEO_STYLE = process.env.NOTEBOOKLM_VIDEO_STYLE || 'classic';

function loadEnv() {
  const file = path.join(ROOT, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = line.split('=');
    if (!key) continue;
    process.env[key.trim()] ??= rest.join('=').trim().replace(/^"|"$/g, '');
  }
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback;
    throw error;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function stripHtml(value = '') {
  return String(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getTagText(html, tag) {
  return stripHtml(html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))?.[1] || '');
}

function getMeta(html, name) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const key = tag.match(/\bname\s*=\s*(["'])(.*?)\1/i)?.[2];
    if (String(key || '').toLowerCase() !== name.toLowerCase()) continue;
    return tag.match(/\bcontent\s*=\s*(["'])(.*?)\1/i)?.[2]?.trim() || '';
  }
  return '';
}

function readPost(slug) {
  if (!/^[a-z0-9][a-z0-9-]{1,119}$/.test(slug || '')) throw new Error('NOTEBOOKLM_POST_SLUG must be a safe blog slug.');
  const file = path.join(BLOG, `${slug}.html`);
  if (!fs.existsSync(file)) throw new Error(`Blog post not found: ${file}`);
  const html = fs.readFileSync(file, 'utf8');
  return {
    slug,
    file,
    html,
    title: getTagText(html, 'h1') || getTagText(html, 'title') || slug,
    description: getMeta(html, 'description'),
    url: `${SITE_URL}/blog/${slug}`,
  };
}

function productFacts() {
  const facts = readJson(FACTS_FILE, null);
  if (!facts?.verifiedFacts?.length) throw new Error(`Canonical product facts are missing or invalid: ${FACTS_FILE}`);
  return facts;
}

function safeArticleText(html) {
  return String(html)
    .replace(/<!-- (?:NOTEBOOKLM|IZEM)_VIDEO_START -->[\s\S]*?<!-- (?:NOTEBOOKLM|IZEM)_VIDEO_END -->/gi, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<\/(h1|h2|h3|p|li|tr|section|article|div)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function buildSource(post, facts) {
  return `# ${post.title}\n\nCanonical article: ${post.url}\nMeta description: ${post.description}\n\n## Verified IZEM product facts\n${facts.verifiedFacts.map((fact) => `- ${fact}`).join('\n')}\n\n## Hard factual rules\n- ${facts.contentRules.pricing}\n- ${facts.contentRules.medical}\n- ${facts.contentRules.competitors}\n- ${facts.contentRules.experience}\n\n## Article source\n${safeArticleText(post.html)}\n`;
}

function buildVideoPrompt(post, facts) {
  const visualForbidden = facts.visualPolicy.forbidden.join(', ');
  const visualPreferred = facts.visualPolicy.preferred.join(', ');
  return `Create a polished NotebookLM Video Overview for the article "${post.title}".\n\nPRIMARY RULE: this video must explain THIS article, not repeat a generic IZEM advertisement. Use only the product capabilities that are directly relevant to the article's search intent. If a feature is unrelated, leave it out.\n\nEditorial style:\n- Premium, practical, precise, and human.\n- Open with the exact problem or decision the article solves.\n- Give useful steps, comparisons, or a decision framework drawn from the article.\n- Mention IZEM naturally only where it genuinely helps answer the topic.\n- Be fair about limitations and when a qualified human professional is the better choice.\n- No fake studies, fake testing, fake testimonials, invented statistics, guaranteed outcomes, medical claims, or unverified pricing.\n- End with a concise CTA to read the full article at ${post.url}.\n\nABSOLUTE VISUAL POLICY — ZERO HUMANS:\n- Do not show or depict any human at all, including ${visualForbidden}.\n- This applies to photographs, illustrations, cartoons, icons, silhouettes, UI avatars, stock imagery, and background figures.\n- Use only people-free visuals such as ${visualPreferred}.\n- If a concept would normally use a person, represent it with objects, text, diagrams, or abstract shapes instead.\n- Keep all app UI people-free.\n\nVisual direction:\n- High-end dark fitness-tech editorial design.\n- Clean hierarchy, strong typography, restrained motion, useful diagrams, object close-ups, and topic-specific comparisons.\n- Avoid generic transformation imagery and cluttered dashboards.\n- Include one concrete "what to do next" or decision-summary slide near the end.`;
}

function parseJsonOutput(output) {
  const text = String(output || '').trim();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
    throw new Error(`NotebookLM command did not return JSON: ${text.slice(0, 400)}`);
  }
}

async function runNotebookLM(args, timeout = 45 * 60 * 1000) {
  console.log(`$ ${NOTEBOOKLM_BIN} ${args.join(' ')}`);
  const result = await execFileAsync(NOTEBOOKLM_BIN, args, {
    cwd: ROOT,
    env: process.env,
    timeout,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.stderr?.trim()) process.stderr.write(result.stderr);
  return result.stdout || '';
}

async function runNotebookLMJson(args, timeout) {
  return parseJsonOutput(await runNotebookLM(args, timeout));
}

function notebookId(result) {
  const id = result?.active_notebook_id || result?.notebook_id || result?.id || result?.notebook?.id || result?.data?.active_notebook_id || result?.data?.notebook_id || result?.data?.notebook?.id;
  if (!id) throw new Error(`NotebookLM create output contained no notebook id: ${JSON.stringify(result).slice(0, 700)}`);
  return id;
}

async function createNotebookVideo(post, facts) {
  fs.mkdirSync(WORK_DIR, { recursive: true });
  const sourceFile = path.join(WORK_DIR, `${post.slug}-source.md`);
  const promptFile = path.join(WORK_DIR, `${post.slug}-video-prompt.txt`);
  const outputFile = path.join(WORK_DIR, `${post.slug}.mp4`);
  fs.writeFileSync(sourceFile, buildSource(post, facts), 'utf8');
  fs.writeFileSync(promptFile, buildVideoPrompt(post, facts), 'utf8');
  fs.rmSync(outputFile, { force: true });

  await runNotebookLMJson(['auth', 'check', '--test', '--json'], 2 * 60 * 1000);
  const created = await runNotebookLMJson(['create', `IZEM Video - ${post.title}`.slice(0, 120), '--use', '--json'], 3 * 60 * 1000);
  const id = notebookId(created);
  console.log(`Created NotebookLM project: ${id}`);

  await runNotebookLMJson([
    'source', 'add', sourceFile, '-n', id, '--title', `${post.title} - canonical article`, '--timeout', '240', '--json',
  ], 6 * 60 * 1000);

  await runNotebookLMJson([
    'generate', 'video', '-n', id, '--format', VIDEO_FORMAT, '--style', VIDEO_STYLE,
    '--prompt-file', promptFile, '--wait', '--timeout', process.env.NOTEBOOKLM_VIDEO_TIMEOUT || '1800', '--json',
  ], 45 * 60 * 1000);

  await runNotebookLMJson(['download', 'video', outputFile, '-n', id, '--latest', '--force', '--json'], 10 * 60 * 1000);
  if (!fs.existsSync(outputFile) || fs.statSync(outputFile).size < 10000) throw new Error(`NotebookLM video download is missing or suspiciously small: ${outputFile}`);
  return { notebookId: id, outputFile };
}

function youtubeCredentials() {
  const clientId = process.env.YOUTUBE_CLIENT_ID_2 || process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET_2 || process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN_2 || process.env.YOUTUBE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) throw new Error('Missing YouTube OAuth credentials.');
  return { clientId, clientSecret, refreshToken };
}

function request({ hostname, path: requestPath, method = 'GET', headers = {}, body = '' }) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path: requestPath, method, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode || 0, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getAccessToken() {
  const { clientId, clientSecret, refreshToken } = youtubeCredentials();
  const body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }).toString();
  const response = await request({
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    body,
  });
  const parsed = JSON.parse(response.body || '{}');
  if (response.status !== 200 || !parsed.access_token) throw new Error(`YouTube token request failed (${response.status}): ${response.body.slice(0, 600)}`);
  return parsed.access_token;
}

async function youtubeJson(accessToken, requestPath) {
  const response = await request({ hostname: 'www.googleapis.com', path: requestPath, headers: { Authorization: `Bearer ${accessToken}` } });
  if (response.status !== 200) throw new Error(`YouTube API failed (${response.status}) for ${requestPath}: ${response.body.slice(0, 700)}`);
  return JSON.parse(response.body || '{}');
}

async function findExistingVideo(accessToken, post) {
  const channels = await youtubeJson(accessToken, '/youtube/v3/channels?part=contentDetails&mine=true');
  const uploads = channels?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) return null;
  const playlist = await youtubeJson(accessToken, `/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${encodeURIComponent(uploads)}`);
  const ids = (playlist.items || []).map((item) => item?.contentDetails?.videoId).filter(Boolean);
  if (!ids.length) return null;
  const videos = await youtubeJson(accessToken, `/youtube/v3/videos?part=snippet,status&id=${encodeURIComponent(ids.join(','))}`);
  const match = (videos.items || []).find((video) => {
    const description = String(video?.snippet?.description || '');
    return description.includes(post.url) || description.includes(`Canonical article: ${post.url}`);
  });
  return match?.id ? `https://youtube.com/watch?v=${match.id}` : null;
}

function buildYouTubeDescription(post) {
  return `Video guide for: ${post.title}\n\nCanonical article: ${post.url}\nRead the full article:\n${post.url}\n\nTry IZEM:\n${SITE_URL}\n\nThis video is generated from the canonical IZEM article and follows the site's people-free visual policy.\n\n#IZEM #AIFitness #FitnessApp`;
}

function buildYouTubeSnippet(post) {
  return {
    title: `${post.title} | IZEM`.slice(0, 100),
    description: buildYouTubeDescription(post).slice(0, 5000),
    tags: ['IZEM', 'AI fitness app', 'fitness app', 'workout accountability'],
    categoryId: '26',
    defaultLanguage: 'en',
  };
}

async function uploadVideo(filePath, post, accessToken) {
  const fileSize = fs.statSync(filePath).size;
  const metadata = JSON.stringify({
    snippet: buildYouTubeSnippet(post),
    status: { privacyStatus: process.env.YOUTUBE_PRIVACY_STATUS || 'public', selfDeclaredMadeForKids: false },
  });
  const init = await request({
    hostname: 'www.googleapis.com',
    path: '/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Upload-Content-Type': 'video/mp4',
      'X-Upload-Content-Length': fileSize,
      'Content-Length': Buffer.byteLength(metadata),
    },
    body: metadata,
  });
  if (init.status !== 200 || !init.headers.location) throw new Error(`YouTube resumable upload init failed (${init.status}): ${init.body.slice(0, 600)}`);

  return new Promise((resolve, reject) => {
    const url = new URL(init.headers.location);
    const stream = fs.createReadStream(filePath);
    const req = https.request({
      hostname: url.hostname,
      path: `${url.pathname}${url.search}`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'video/mp4', 'Content-Length': fileSize },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const parsed = JSON.parse(data || '{}');
          if (!parsed.id) return reject(new Error(`YouTube upload returned no video id: ${data.slice(0, 600)}`));
          resolve(`https://youtube.com/watch?v=${parsed.id}`);
        } else reject(new Error(`YouTube upload failed (${res.statusCode}): ${data.slice(0, 800)}`));
      });
    });
    stream.on('error', reject);
    req.on('error', reject);
    stream.pipe(req);
  });
}

function youtubeId(url) {
  const parsed = new URL(url);
  if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1);
  return parsed.searchParams.get('v') || '';
}

function buildEmbed(post, url) {
  const id = youtubeId(url);
  if (!id) throw new Error(`Could not parse YouTube id from ${url}`);
  const title = escapeHtml(post.title);
  return `<!-- IZEM_VIDEO_START -->\n<section class="izem-video" style="margin:32px 0;padding:24px;border:1px solid rgba(55,199,201,.25);border-radius:8px;background:rgba(55,199,201,.08)">\n  <h2 style="margin-top:0">Watch the video guide</h2>\n  <a data-izem-video-card="true" data-video-id="${id}" href="/youtube/${id}/" aria-label="Watch ${title}" style="display:block;width:100%;aspect-ratio:16/9;position:relative;overflow:hidden;border-radius:8px;background:#02070D;text-decoration:none">\n    <img src="${SITE_URL}/youtube/thumbnails/${id}.svg" alt="${title}" width="480" height="360" loading="lazy" style="display:block;width:100%;height:100%;object-fit:cover">\n    <span aria-hidden="true" style="position:absolute;inset:0;display:grid;place-items:center"><span style="display:grid;place-items:center;width:68px;height:48px;border-radius:12px;background:#FF0000;color:#fff;font:700 24px/1 system-ui">▶</span></span>\n  </a>\n  <p style="margin:14px 0 0;color:#AEBBCC">A short IZEM video guide for the decisions in this article.</p>\n</section>\n<!-- IZEM_VIDEO_END -->`;
}

function embedIntoPost(post, url) {
  const block = buildEmbed(post, url);
  let html = fs.readFileSync(post.file, 'utf8');
  if (/<!-- (?:NOTEBOOKLM|IZEM)_VIDEO_START -->/i.test(html)) {
    html = html.replace(/<!-- (?:NOTEBOOKLM|IZEM)_VIDEO_START -->[\s\S]*?<!-- (?:NOTEBOOKLM|IZEM)_VIDEO_END -->/i, block);
  } else if (/<main\b[^>]*>\s*<article\b[^>]*>/i.test(html)) {
    html = html.replace(/<main\b[^>]*>\s*<article\b[^>]*>/i, (match) => `${match}\n${block}`);
  } else if (/<article\b[^>]*>/i.test(html)) {
    html = html.replace(/<article\b[^>]*>/i, (match) => `${match}\n${block}`);
  } else if (/<main\b[^>]*>/i.test(html)) {
    html = html.replace(/<main\b[^>]*>/i, (match) => `${match}\n${block}`);
  } else if (/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(html)) {
    html = html.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/i, (match) => `${match}\n${block}`);
  } else {
    html = html.replace(/<body\b[^>]*>/i, (match) => `${match}\n${block}`);
  }
  fs.writeFileSync(post.file, html, 'utf8');
}

function recordProgress(post, youtubeUrl, notebook) {
  const progress = readJson(PROGRESS_FILE, { completed: [] });
  progress.completed = [
    ...(progress.completed || []).filter((item) => item.slug !== post.slug),
    { slug: post.slug, title: post.title, url: post.url, youtube: youtubeUrl, notebook_id: notebook || null, date: new Date().toISOString() },
  ];
  progress.lastRun = new Date().toISOString();
  writeJson(PROGRESS_FILE, progress);
}

async function main() {
  loadEnv();
  const slug = process.env.NOTEBOOKLM_POST_SLUG || '';
  const post = readPost(slug);
  const facts = productFacts();
  const accessToken = await getAccessToken();

  const existing = await findExistingVideo(accessToken, post);
  if (existing) {
    console.log(`Reusing existing YouTube video for ${post.slug}: ${existing}`);
    embedIntoPost(post, existing);
    recordProgress(post, existing, null);
    return;
  }

  if (!process.env.NOTEBOOKLM_AUTH_JSON && process.env.CI) {
    throw new Error('Missing NOTEBOOKLM_AUTH_JSON. Failing closed before NotebookLM generation.');
  }

  const generated = await createNotebookVideo(post, facts);
  await assertVideoIsPeopleFree(generated.outputFile);
  const youtubeUrl = await uploadVideo(generated.outputFile, post, accessToken);
  embedIntoPost(post, youtubeUrl);
  recordProgress(post, youtubeUrl, generated.notebookId);
  console.log(`NotebookLM video workflow complete: ${youtubeUrl}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
