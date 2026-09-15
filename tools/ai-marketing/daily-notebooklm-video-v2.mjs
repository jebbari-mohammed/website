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
const BLOG = path.join(ROOT, 'public', 'blog');
const FACTS_FILE = path.join(ROOT, 'data', 'brand', 'product-facts.json');
const PROGRESS_FILE = path.join(HERE, '.notebooklm-video-progress.json');
const SITE_URL = 'https://youraicoach.life';
const WORK_DIR = path.join(os.tmpdir(), 'izem-notebooklm-video');
const NOTEBOOKLM_BIN = process.env.NOTEBOOKLM_BIN || 'notebooklm';
const VIDEO_FORMAT = process.env.NOTEBOOKLM_VIDEO_FORMAT || 'brief';
const VIDEO_STYLE = process.env.NOTEBOOKLM_VIDEO_STYLE || 'classic';
const VALIDATION_STAMP = 'IZEM_VISUAL_POLICY=objects-only-v1;VALIDATED=true';

function loadEnv() {
  const file = path.join(ROOT, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = line.split('=');
    if (key) process.env[key.trim()] ??= rest.join('=').trim().replace(/^"|"$/g, '');
  }
}

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { if (error?.code === 'ENOENT') return fallback; throw error; }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function plain(value = '') {
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

function articleText(html = '') {
  return plain(String(html).replace(/<!-- (?:NOTEBOOKLM|IZEM)_VIDEO_START -->[\s\S]*?<!-- (?:NOTEBOOKLM|IZEM)_VIDEO_END -->/gi, ' '));
}

function escapeHtml(value = '') {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function readPost(slug) {
  if (!/^[a-z0-9][a-z0-9-]{1,119}$/.test(slug || '')) throw new Error('NOTEBOOKLM_POST_SLUG must be a safe blog slug.');
  const file = path.join(BLOG, `${slug}.html`);
  if (!fs.existsSync(file)) throw new Error(`Blog post not found: ${file}`);
  const html = fs.readFileSync(file, 'utf8');
  const title = plain(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || slug);
  const description = (html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] || '').trim();
  return { slug, file, html, title, description, url: `${SITE_URL}/blog/${slug}` };
}

function productFacts() {
  const facts = readJson(FACTS_FILE, null);
  if (!facts?.verifiedFacts?.length || facts?.visualPolicy?.humansAllowed !== false) throw new Error(`Canonical product facts are missing/unsafe: ${FACTS_FILE}`);
  return facts;
}

function sourceMarkdown(post, facts) {
  return `# ${post.title}\n\nCanonical article: ${post.url}\nMeta description: ${post.description}\n\n## Verified IZEM product facts\n${facts.verifiedFacts.map((fact) => `- ${fact}`).join('\n')}\n\n## Factual guardrails\n- ${facts.contentRules.pricing}\n- ${facts.contentRules.medical}\n- ${facts.contentRules.competitors}\n- ${facts.contentRules.experience}\n\n## Canonical article source\n${articleText(post.html)}\n`;
}

function videoPrompt(post, facts) {
  return `Create a polished NotebookLM Video Overview for the article "${post.title}".\n\nPRIMARY RULE: explain THIS article. Do not turn it into a generic IZEM advertisement. Use only product capabilities directly relevant to the article's intent.\n\nEditorial rules:\n- Premium, practical, precise, natural language.\n- Open with the exact problem or decision the article solves.\n- Use concrete steps, comparisons, examples, or a decision framework from the article.\n- Mention IZEM only where it genuinely helps answer the topic.\n- Be fair about limitations and when a qualified professional is better.\n- Never invent testing, studies, testimonials, statistics, medical outcomes, guarantees, competitor claims, or pricing.\n- End with a short CTA to read ${post.url}.\n\nABSOLUTE VISUAL POLICY — ZERO HUMANS:\n- Do not show or depict ANY human or human-like person. Forbidden: ${facts.visualPolicy.forbidden.join(', ')}.\n- This includes photos, illustrations, cartoons, stick figures, icons, silhouettes, avatars, UI portraits, stock imagery, background figures, and body-part closeups.\n- Allowed/preferred: ${facts.visualPolicy.preferred.join(', ')}.\n- If an idea normally uses a person, replace the person with objects, typography, a diagram, or an abstract composition.\n- Keep every app screen people-free.\n\nVisual direction:\n- High-end dark fitness-tech editorial design.\n- Strong typography, restrained motion, useful topic-specific diagrams and object close-ups.\n- Avoid generic transformation imagery and clutter.\n- Include one useful decision-summary or next-action slide near the end.`;
}

function parseJsonOutput(output) {
  const value = String(output || '').trim();
  if (!value) return {};
  try { return JSON.parse(value); }
  catch {
    const start = value.indexOf('{');
    const end = value.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(value.slice(start, end + 1));
    throw new Error(`NotebookLM command did not return JSON: ${value.slice(0, 400)}`);
  }
}

async function runNotebookLM(args, timeout = 45 * 60 * 1000) {
  console.log(`$ ${NOTEBOOKLM_BIN} ${args.join(' ')}`);
  const result = await execFileAsync(NOTEBOOKLM_BIN, args, { cwd: ROOT, env: process.env, timeout, maxBuffer: 32 * 1024 * 1024 });
  if (result.stderr?.trim()) process.stderr.write(result.stderr);
  return result.stdout || '';
}

async function runNotebookLMJson(args, timeout) { return parseJsonOutput(await runNotebookLM(args, timeout)); }

function notebookId(result) {
  const id = result?.active_notebook_id || result?.notebook_id || result?.id || result?.notebook?.id || result?.data?.active_notebook_id || result?.data?.notebook_id || result?.data?.notebook?.id;
  if (!id) throw new Error(`NotebookLM create output contained no notebook id: ${JSON.stringify(result).slice(0, 700)}`);
  return id;
}

async function generateNotebookVideo(post, facts) {
  fs.mkdirSync(WORK_DIR, { recursive: true });
  const sourceFile = path.join(WORK_DIR, `${post.slug}-source.md`);
  const promptFile = path.join(WORK_DIR, `${post.slug}-video-prompt.txt`);
  const outputFile = path.join(WORK_DIR, `${post.slug}.mp4`);
  fs.writeFileSync(sourceFile, sourceMarkdown(post, facts), 'utf8');
  fs.writeFileSync(promptFile, videoPrompt(post, facts), 'utf8');
  fs.rmSync(outputFile, { force: true });

  await runNotebookLMJson(['auth', 'check', '--test', '--json'], 2 * 60 * 1000);
  const created = await runNotebookLMJson(['create', `IZEM Video - ${post.title}`.slice(0, 120), '--use', '--json'], 3 * 60 * 1000);
  const notebook = notebookId(created);
  await runNotebookLMJson(['source', 'add', sourceFile, '-n', notebook, '--title', `${post.title} - canonical article`, '--timeout', '240', '--json'], 6 * 60 * 1000);
  await runNotebookLMJson(['generate', 'video', '-n', notebook, '--format', VIDEO_FORMAT, '--style', VIDEO_STYLE, '--prompt-file', promptFile, '--wait', '--timeout', process.env.NOTEBOOKLM_VIDEO_TIMEOUT || '1800', '--json'], 45 * 60 * 1000);
  await runNotebookLMJson(['download', 'video', outputFile, '-n', notebook, '--latest', '--force', '--json'], 10 * 60 * 1000);
  if (!fs.existsSync(outputFile) || fs.statSync(outputFile).size < 10000) throw new Error(`NotebookLM video download is missing or suspiciously small: ${outputFile}`);
  return { notebookId: notebook, outputFile };
}

function credentials() {
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

async function accessToken() {
  const { clientId, clientSecret, refreshToken } = credentials();
  const body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }).toString();
  const response = await request({ hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }, body });
  const parsed = JSON.parse(response.body || '{}');
  if (response.status !== 200 || !parsed.access_token) throw new Error(`YouTube token request failed (${response.status}): ${response.body.slice(0, 600)}`);
  return parsed.access_token;
}

async function youtubeJson(token, requestPath) {
  const response = await request({ hostname: 'www.googleapis.com', path: requestPath, headers: { Authorization: `Bearer ${token}` } });
  if (response.status !== 200) throw new Error(`YouTube API failed (${response.status}): ${response.body.slice(0, 700)}`);
  return JSON.parse(response.body || '{}');
}

async function findValidatedExistingVideo(token, post) {
  const channels = await youtubeJson(token, '/youtube/v3/channels?part=contentDetails&mine=true');
  const uploads = channels?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) return null;
  const playlist = await youtubeJson(token, `/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${encodeURIComponent(uploads)}`);
  const ids = (playlist.items || []).map((item) => item?.contentDetails?.videoId).filter(Boolean);
  if (!ids.length) return null;
  const videos = await youtubeJson(token, `/youtube/v3/videos?part=snippet,status&id=${encodeURIComponent(ids.join(','))}`);
  const match = (videos.items || []).find((video) => {
    const description = String(video?.snippet?.description || '');
    return description.includes(`Canonical article: ${post.url}`) && description.includes(VALIDATION_STAMP);
  });
  return match?.id ? `https://youtube.com/watch?v=${match.id}` : null;
}

function youtubeDescription(post) {
  return `Video guide for: ${post.title}\n\nCanonical article: ${post.url}\nRead the full article:\n${post.url}\n\nTry IZEM:\n${SITE_URL}\n\n${VALIDATION_STAMP}\nThis upload passed the automated people-free frame validation before publication.\n\n#IZEM #AIFitness #FitnessApp`;
}

function youtubeSnippet(post) {
  return { title: `${post.title} | IZEM`.slice(0, 100), description: youtubeDescription(post).slice(0, 5000), tags: ['IZEM', 'AI fitness app', 'fitness app', 'workout accountability'], categoryId: '26', defaultLanguage: 'en' };
}

async function uploadVideo(filePath, post, token) {
  const fileSize = fs.statSync(filePath).size;
  const metadata = JSON.stringify({ snippet: youtubeSnippet(post), status: { privacyStatus: process.env.YOUTUBE_PRIVACY_STATUS || 'public', selfDeclaredMadeForKids: false } });
  const init = await request({
    hostname: 'www.googleapis.com', path: '/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': fileSize, 'Content-Length': Buffer.byteLength(metadata) }, body: metadata,
  });
  if (init.status !== 200 || !init.headers.location) throw new Error(`YouTube resumable upload init failed (${init.status}): ${init.body.slice(0, 600)}`);

  return new Promise((resolve, reject) => {
    const url = new URL(init.headers.location);
    const stream = fs.createReadStream(filePath);
    const req = https.request({ hostname: url.hostname, path: `${url.pathname}${url.search}`, method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'video/mp4', 'Content-Length': fileSize } }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const parsed = JSON.parse(data || '{}');
          if (!parsed.id) reject(new Error(`YouTube upload returned no video id: ${data.slice(0, 600)}`));
          else resolve(`https://youtube.com/watch?v=${parsed.id}`);
        } else reject(new Error(`YouTube upload failed (${res.statusCode}): ${data.slice(0, 800)}`));
      });
    });
    stream.on('error', reject);
    req.on('error', reject);
    stream.pipe(req);
  });
}

function youtubeId(value) {
  const parsed = new URL(value);
  return parsed.hostname.includes('youtu.be') ? parsed.pathname.slice(1) : (parsed.searchParams.get('v') || '');
}

function embedBlock(post, youtubeUrl) {
  const id = youtubeId(youtubeUrl);
  if (!id) throw new Error(`Could not parse YouTube id from ${youtubeUrl}`);
  const title = escapeHtml(post.title);
  return `<!-- IZEM_VIDEO_START -->\n<section class="izem-video" style="margin:32px 0;padding:24px;border:1px solid rgba(55,199,201,.25);border-radius:8px;background:rgba(55,199,201,.08)">\n  <h2 style="margin-top:0">Watch the video guide</h2>\n  <a data-izem-video-card="true" data-video-id="${id}" href="/youtube/${id}/" aria-label="Watch ${title}" style="display:block;width:100%;aspect-ratio:16/9;position:relative;overflow:hidden;border-radius:8px;background:#02070D;text-decoration:none">\n    <img src="${SITE_URL}/youtube/thumbnails/${id}.svg" alt="${title}" width="480" height="360" loading="lazy" style="display:block;width:100%;height:100%;object-fit:cover">\n    <span aria-hidden="true" style="position:absolute;inset:0;display:grid;place-items:center"><span style="display:grid;place-items:center;width:68px;height:48px;border-radius:12px;background:#FF0000;color:#fff;font:700 24px/1 system-ui">▶</span></span>\n  </a>\n  <p style="margin:14px 0 0;color:#AEBBCC">A short IZEM video guide for the decisions in this article.</p>\n</section>\n<!-- IZEM_VIDEO_END -->`;
}

function embedIntoPost(post, youtubeUrl) {
  const block = embedBlock(post, youtubeUrl);
  let html = fs.readFileSync(post.file, 'utf8');
  if (/<!-- (?:NOTEBOOKLM|IZEM)_VIDEO_START -->/i.test(html)) html = html.replace(/<!-- (?:NOTEBOOKLM|IZEM)_VIDEO_START -->[\s\S]*?<!-- (?:NOTEBOOKLM|IZEM)_VIDEO_END -->/i, block);
  else if (/<main\b[^>]*>\s*<article\b[^>]*>/i.test(html)) html = html.replace(/<main\b[^>]*>\s*<article\b[^>]*>/i, (match) => `${match}\n${block}`);
  else if (/<article\b[^>]*>/i.test(html)) html = html.replace(/<article\b[^>]*>/i, (match) => `${match}\n${block}`);
  else if (/<main\b[^>]*>/i.test(html)) html = html.replace(/<main\b[^>]*>/i, (match) => `${match}\n${block}`);
  else if (/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(html)) html = html.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/i, (match) => `${match}\n${block}`);
  else html = html.replace(/<body\b[^>]*>/i, (match) => `${match}\n${block}`);
  fs.writeFileSync(post.file, html, 'utf8');
}

function record(post, youtubeUrl, notebook) {
  const progress = readJson(PROGRESS_FILE, { completed: [] });
  progress.completed = [
    ...(progress.completed || []).filter((item) => item.slug !== post.slug),
    { slug: post.slug, title: post.title, url: post.url, youtube: youtubeUrl, notebook_id: notebook || null, visual_policy: 'objects-only-v1', people_free_validated: true, date: new Date().toISOString() },
  ];
  progress.lastRun = new Date().toISOString();
  writeJson(PROGRESS_FILE, progress);
}

async function main() {
  loadEnv();
  const post = readPost(process.env.NOTEBOOKLM_POST_SLUG || '');
  const facts = productFacts();
  const token = await accessToken();

  const reusable = await findValidatedExistingVideo(token, post);
  if (reusable) {
    console.log(`Reusing previously validated people-free YouTube video for ${post.slug}: ${reusable}`);
    embedIntoPost(post, reusable);
    record(post, reusable, null);
    return;
  }

  if (!process.env.NOTEBOOKLM_AUTH_JSON && process.env.CI) throw new Error('Missing NOTEBOOKLM_AUTH_JSON. Failing closed before NotebookLM generation.');
  const generated = await generateNotebookVideo(post, facts);
  await assertVideoIsPeopleFree(generated.outputFile);
  const youtubeUrl = await uploadVideo(generated.outputFile, post, token);
  embedIntoPost(post, youtubeUrl);
  record(post, youtubeUrl, generated.notebookId);
  console.log(`NotebookLM video workflow complete: ${youtubeUrl}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
