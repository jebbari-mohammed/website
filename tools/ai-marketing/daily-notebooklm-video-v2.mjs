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
import {
  VIDEO_SCHEMA_VERSION, VIDEO_POLICY, articleSourceDigest, productFactsDigest, videoFileDigest,
  assertVideoRecord, assertYoutubeVideoMatches, provenanceFromEnvironment,
  videoDescriptionEvidence, writeVideoProvenanceArtifact, renderVideoCard,
} from './video-provenance.mjs';
import { verifyVideoRecordProof } from './video-github-proof.mjs';

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


function readPost(slug) {
  if (!/^[a-z0-9][a-z0-9-]{1,119}$/.test(slug || '')) throw new Error('NOTEBOOKLM_POST_SLUG must be a safe blog slug.');
  const file = path.join(BLOG, `${slug}.html`);
  if (!fs.existsSync(file)) throw new Error(`Blog post not found: ${file}`);
  const html = fs.readFileSync(file, 'utf8');
  const title = plain(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || slug);
  const description = (html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] || '').trim();
  return { slug, file, html, title, description, url: `${SITE_URL}/blog/${slug}` };
}

function productFacts(bytes) {
  const facts = JSON.parse(bytes.toString('utf8'));
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
  let result;
  try {
    result = await execFileAsync(NOTEBOOKLM_BIN, args, { cwd: ROOT, env: process.env, timeout, maxBuffer: 32 * 1024 * 1024 });
  } catch (error) {
    const output = `${error?.stderr || ''} ${error?.stdout || ''} ${error?.message || ''}`;
    if (/HTTP\s*(?:401|403)|authentication (?:expired|invalid)|not logged in/i.test(output)) {
      throw new Error('NotebookLM authentication was rejected (HTTP 401/403). Owner re-authentication and an authorized NOTEBOOKLM_AUTH_JSON refresh are required. Stopped before further steps; verify remote state before retrying a failed write.');
    }
    throw error;
  }
  if (result.stderr?.trim()) process.stderr.write(result.stderr);
  return result.stdout || '';
}

async function runNotebookLMJson(args, timeout) {
  const result = parseJsonOutput(await runNotebookLM(args, timeout));
  if (result?.error || result?.status === 'error' || result?.success === false) {
    throw new Error(`NotebookLM ${args[0]} returned a failure response. Stop before further work; inspect the authenticated CLI diagnostics.`);
  }
  return result;
}

export function assertNotebookAuthCheck(result) {
  if (result?.status !== 'ok' || result?.checks?.token_fetch !== true) {
    throw new Error('NotebookLM live authentication check did not pass. Owner re-authentication and an authorized NOTEBOOKLM_AUTH_JSON refresh are required before generation.');
  }
  return true;
}

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

  assertNotebookAuthCheck(await runNotebookLMJson(['auth', 'check', '--test', '--json'], 2 * 60 * 1000));
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

export async function findValidatedExistingVideo(token, post, factsBytes, options = {}) {
  const progress = options.progress || readJson(PROGRESS_FILE, { completed: [] });
  const candidates = (progress.completed || []).filter((item) => item.slug === post.slug);
  // Never discover/relabel a legacy upload from a mutable title or description.
  // Only the exact source-bound record plus its authenticated workflow artifact
  // may authorize reuse, followed by a live authenticated YouTube read.
  for (const record of candidates) {
    try {
      assertVideoRecord(record, { slug: post.slug, articleHtml: post.html, productFactsBytes: factsBytes });
    } catch {
      continue;
    }
    await (options.verifyProof || verifyVideoRecordProof)(record);
    const videos = await (options.youtubeJson || youtubeJson)(token,
      `/youtube/v3/videos?part=snippet,status&id=${encodeURIComponent(record.youtube_id)}`);
    const video = (videos.items || []).find((item) => item.id === record.youtube_id);
    assertYoutubeVideoMatches(record, video);
    return record;
  }
  return null;
}

function youtubeDescription(post, evidence) {
  return `Video guide for: ${post.title}\n\nCanonical article: ${post.url}\nRead the full article:\n${post.url}\n\nTry IZEM:\n${SITE_URL}\n\n${videoDescriptionEvidence(evidence)}\nThis upload passed automated people-free checks of 14 frames sampled across its full duration before publication; sampling does not inspect every frame.\n\n#IZEM #AIFitness #FitnessApp`;
}

function youtubeSnippet(post, evidence) {
  return { title: `${post.title} | IZEM`.slice(0, 100), description: youtubeDescription(post, evidence).slice(0, 5000), tags: ['IZEM', 'AI fitness app', 'fitness app', 'workout accountability'], categoryId: '26', defaultLanguage: 'en' };
}

async function uploadVideo(filePath, post, token, evidence) {
  if (videoFileDigest(filePath) !== evidence.video_sha256) throw new Error('Video bytes changed after validation; upload blocked.');
  const fileSize = fs.statSync(filePath).size;
  const metadata = JSON.stringify({ snippet: youtubeSnippet(post, evidence), status: { privacyStatus: process.env.YOUTUBE_PRIVACY_STATUS || 'public', selfDeclaredMadeForKids: false } });
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


function embedIntoPost(post, youtubeUrl) {
  const block = renderVideoCard(post, youtubeId(youtubeUrl));
  let html = fs.readFileSync(post.file, 'utf8');
  if (/<!-- (?:NOTEBOOKLM|IZEM)_VIDEO_START -->/i.test(html)) html = html.replace(/<!-- (?:NOTEBOOKLM|IZEM)_VIDEO_START -->[\s\S]*?<!-- (?:NOTEBOOKLM|IZEM)_VIDEO_END -->/i, block);
  else if (/<main\b[^>]*>\s*<article\b[^>]*>/i.test(html)) html = html.replace(/<main\b[^>]*>\s*<article\b[^>]*>/i, (match) => `${match}\n${block}`);
  else if (/<article\b[^>]*>/i.test(html)) html = html.replace(/<article\b[^>]*>/i, (match) => `${match}\n${block}`);
  else if (/<main\b[^>]*>/i.test(html)) html = html.replace(/<main\b[^>]*>/i, (match) => `${match}\n${block}`);
  else if (/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(html)) html = html.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/i, (match) => `${match}\n${block}`);
  else html = html.replace(/<body\b[^>]*>/i, (match) => `${match}\n${block}`);
  fs.writeFileSync(post.file, html, 'utf8');
}

function recordValidatedUpload(record) {
  assertVideoRecord(record);
  const progress = readJson(PROGRESS_FILE, { completed: [] });
  progress.completed = [...(progress.completed || []).filter((item) => item.slug !== record.slug), record];
  progress.lastRun = record.date;
  writeJson(PROGRESS_FILE, progress);
}

export async function main() {
  loadEnv();
  const post = readPost(process.env.NOTEBOOKLM_POST_SLUG || '');
  const factsBytes = fs.readFileSync(FACTS_FILE);
  const facts = productFacts(factsBytes);
  const provenance = provenanceFromEnvironment();
  const token = await accessToken();

  const reusable = await findValidatedExistingVideo(token, post, factsBytes);
  if (reusable) {
    console.log(`Reusing authenticated source-bound people-free YouTube video for ${post.slug}: ${reusable.youtube}`);
    embedIntoPost(post, reusable.youtube);
    // Preserve the actual original verdict, upload time, notebook and proof.
    // No new upload or safety decision occurred, so do not mint a new record.
    return;
  }

  if (!process.env.NOTEBOOKLM_AUTH_JSON && process.env.CI) throw new Error('Missing NOTEBOOKLM_AUTH_JSON. Failing closed before NotebookLM generation.');
  const channels = await youtubeJson(token, '/youtube/v3/channels?part=id&mine=true');
  const channelId = channels?.items?.[0]?.id;
  if (!/^UC[A-Za-z0-9_-]{22}$/.test(channelId || '')) throw new Error('Could not verify the authenticated YouTube upload channel.');
  const generated = await generateNotebookVideo(post, facts);
  const validation = await assertVideoIsPeopleFree(generated.outputFile);
  const { video_sha256, ...people_free_validation } = validation;
  const evidence = {
    article_sha256: articleSourceDigest(post.html),
    product_facts_sha256: productFactsDigest(factsBytes),
    video_sha256,
  };
  if (articleSourceDigest(fs.readFileSync(post.file, 'utf8')) !== evidence.article_sha256
      || productFactsDigest(fs.readFileSync(FACTS_FILE)) !== evidence.product_facts_sha256) {
    throw new Error('Article or product facts changed during generation; upload blocked.');
  }
  const youtubeUrl = await uploadVideo(generated.outputFile, post, token, evidence);
  if (videoFileDigest(generated.outputFile) !== video_sha256) throw new Error('Video bytes changed during upload; do not release this upload.');
  const uploadedAt = new Date().toISOString();
  const record = {
    schema_version: VIDEO_SCHEMA_VERSION,
    slug: post.slug, title: post.title, url: post.url,
    youtube: youtubeUrl, youtube_id: youtubeId(youtubeUrl), notebook_id: generated.notebookId,
    visual_policy: VIDEO_POLICY,
    people_free_validated: people_free_validation.safe === true && people_free_validation.containsHuman === false,
    ...evidence,
    video_bytes: fs.statSync(generated.outputFile).size,
    people_free_validation,
    upload: { channel_id: channelId, uploaded_at: uploadedAt },
    provenance,
    date: uploadedAt,
  };
  assertVideoRecord(record, { articleHtml: post.html, productFactsBytes: factsBytes });
  const published = await youtubeJson(token, `/youtube/v3/videos?part=snippet,status&id=${encodeURIComponent(record.youtube_id)}`);
  assertYoutubeVideoMatches(record, (published.items || []).find((item) => item.id === record.youtube_id));
  writeVideoProvenanceArtifact(record);
  recordValidatedUpload(record);
  embedIntoPost(post, youtubeUrl);
  console.log(`NotebookLM video workflow complete: ${youtubeUrl}`);
}

// Preserve the established compatibility entry point while allowing pure tests.
if (process.argv[1] && ['daily-notebooklm-video.mjs', 'daily-notebooklm-video-v2.mjs'].some((name) => path.resolve(process.argv[1]) === path.join(HERE, name))) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exit(1);
  });
}
