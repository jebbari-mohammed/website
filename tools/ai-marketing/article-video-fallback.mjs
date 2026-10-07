import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const SLUG = /^[a-z0-9][a-z0-9-]{1,119}$/;
const ORIGIN = 'https://youraicoach.life';
const MAX_TTS_ATTEMPTS = 2;
const RETRY_DELAY = 6 * 60 * 60 * 1000;
const MODEL = 'gemini-3.8-flash-lite-tts';
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const digest = value => createHash('sha256').update(value).digest('hex');

export function canonicalBody(post) {
  if (!SLUG.test(post?.slug || '') || post.url !== `${ORIGIN}/blog/${post.slug}` || !post.title) throw new Error('Invalid article identity.');
  const html = String(post.html || '');
  const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];
  if (canonical !== post.url || !html.includes('data-owner-visual-policy="objects-only-v1"')) throw new Error('Article canonical or visual-policy contract missing.');
  const cleaned = html.replace(/<!-- (?:NOTEBOOKLM|IZEM)_VIDEO_START -->[\s\S]*?<!-- (?:NOTEBOOKLM|IZEM)_VIDEO_END -->/gi, '');
  const body = cleaned.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] || cleaned.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  if (!body) throw new Error('Article body missing.');
  return body.replace(/<(script|style|nav|footer|form)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/\s+/g, ' ').trim();
}

export function sourceDigest(post) { return digest(`${post.url}\n${post.title}\n${canonicalBody(post)}`); }

// This is a durable spending checkpoint, NOT a completion record. Only a single
// public metadata file is committed; an unsuccessful push aborts before spending.
export function persistCheckpoint(root, file, state, env = process.env, run = execFileSync) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(`${file}.tmp`, `${JSON.stringify(state, null, 2)}\n`);
  fs.renameSync(`${file}.tmp`, file);
  if (env.GITHUB_ACTIONS !== 'true') return;
  if (env.GITHUB_REPOSITORY !== 'jebbari-mohammed/website' || env.GITHUB_REF !== 'refs/heads/main') throw new Error('Video checkpoint requires the authorized main workflow.');
  const relative = path.relative(root, file).split(path.sep).join('/');
  if (!/^data\/marketing-employee\/video-attempts\/[a-z0-9-]+\.json$/.test(relative)) throw new Error('Invalid video checkpoint path.');
  const options = { cwd: root, env, encoding: 'utf8', timeout: 60000, stdio: ['ignore', 'pipe', 'pipe'] };
  try {
    run('git', ['add', '--force', '--', relative], options);
    run('git', ['-c', 'user.name=IZEM Video Publisher', '-c', 'user.email=editorial@youraicoach.life', 'commit', '--only', '-m', `video: checkpoint bounded attempt for ${state.slug}`, '--', relative], options);
    run('git', ['push', 'origin', 'HEAD:main'], options);
  } catch { throw new Error('Video attempt checkpoint could not be persisted; no new provider request is allowed.'); }
}

function stateFor(root, post) {
  const sourceSha256 = sourceDigest(post);
  const file = path.join(root, 'data/marketing-employee/video-attempts', `${post.slug}.json`);
  let state;
  try { state = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw new Error('Invalid persisted video attempt state.'); }
  if (state && (state.version !== 1 || state.slug !== post.slug || !Number.isInteger(state.nativeAttempts) || !Number.isInteger(state.ttsAttempts) || state.nativeAttempts < 0 || state.nativeAttempts > 1 || state.ttsAttempts < 0 || state.ttsAttempts > MAX_TTS_ATTEMPTS)) throw new Error('Invalid persisted video attempt limits.');
  // An editorial update is not permission to reset the spending ceiling.
  if (state && state.sourceSha256 !== sourceSha256) throw new Error('Article changed since its video attempt; reconcile the approved narration before retrying.');
  state ||= { version: 1, slug: post.slug, sourceSha256, nativeAttempts: 0, ttsAttempts: 0 };
  return { file, state };
}

export function claimNativeAttempt(root, post, { env = process.env, now = Date.now(), persist = persistCheckpoint } = {}) {
  const { file, state } = stateFor(root, post);
  if (state.nativeAttempts >= 1) throw new Error('Native generation was already attempted; use the bounded narration fallback.');
  state.nativeAttempts = 1;
  state.nativeStartedAt = new Date(now).toISOString();
  persist(root, file, state, env);
}

export function narrationPlan(post, manifest, defaultSlides) {
  const sourceSha256 = sourceDigest(post);
  let slides;
  if (manifest) {
    const blob = createHash('sha1').update(`blob ${Buffer.byteLength(post.html)}\0${post.html}`).digest('hex');
    if (manifest.version !== 1 || manifest.slug !== post.slug || (manifest.sourceSha256 ? manifest.sourceSha256 !== sourceSha256 : manifest.sourceBlobSha !== blob) || manifest.canonicalUrl !== post.url) throw new Error('Narration manifest does not match the approved article.');
    slides = manifest.slides;
  } else {
    // Exact existing paragraphs, never an LLM rewrite. The public description and
    // spoken opening label this as selected passages, not a complete reading.
    slides = defaultSlides.map((s, i) => ({ ...s, narration: i === 0 ? `${post.title}. Selected passages from the IZEM guide. ${s.body}` : `${s.heading}. ${s.body}` }));
  }
  if (!Array.isArray(slides) || slides.length < 3 || slides.length > 10) throw new Error('A bounded article storyboard is required.');
  slides = slides.map(s => {
    if (!s || typeof s.heading !== 'string' || typeof s.body !== 'string' || typeof s.narration !== 'string' || s.heading.length > 180 || s.body.length > 2000 || s.narration.length > 2500 || /<[^>]*>|[\u0000-\u0008\u000b\u000c]/.test(`${s.heading}${s.body}${s.narration}`)) throw new Error('Invalid storyboard text.');
    return { heading: s.heading, body: s.body, narration: s.narration, label: 'ARTICLE VIDEO GUIDE' };
  });
  const text = slides.map(s => s.narration.trim()).join('\n\n');
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 100 || words > 1200 || text.length > 10000) throw new Error('Narration must contain 100–1200 words and at most 10,000 characters.');
  return { slides, text, words, sourceSha256, narrationSha256: digest(text) };
}

export function audioFromResponse(value) {
  if (value?.status && !['completed', 'succeeded'].includes(value.status)) throw new Error('Speech generation did not complete.');
  const blocks = (value?.steps || []).filter(s => s.type === 'model_output').flatMap(s => s.content || []).filter(s => s.type === 'audio');
  if (blocks.length !== 1) throw new Error('Expected exactly one generated audio block.');
  const part = blocks[0];
  if (!['audio/wav', 'audio/x-wav'].includes(part.mime_type) || typeof part.data !== 'string' || part.data.length > 80 * 1024 * 1024 || !/^[A-Za-z0-9+/]+={0,2}$/.test(part.data)) throw new Error('Speech response is not bounded WAV audio.');
  const audio = Buffer.from(part.data, 'base64');
  if (audio.length < 10000 || audio.toString('ascii', 0, 4) !== 'RIFF' || audio.toString('ascii', 8, 12) !== 'WAVE') throw new Error('Speech WAV header or size is invalid.');
  return audio;
}

export async function requestSpeech(text, { env = process.env, fetchImpl = fetch } = {}) {
  const key = env.ARTICLE_TTS_API_KEY || env.GEMINI_API_KEY_2 || env.GEMINI_API_KEY;
  if (!key) throw new Error('A configured Gemini API key is required for narrated video recovery.');
  let response;
  try {
    response = await fetchImpl(ENDPOINT, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(240000), headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify({ model: MODEL, input: [{ type: 'user_input', content: [{ type: 'text', text, annotations: [{ type: 'speech_metadata', style: 'Calm, clear US English educational narration. Moderate pace.' }] }] }], response_format: { type: 'audio', mime_type: 'audio/wav' }, generation_config: { speech_config: [{ voice: 'Puck' }] } }) });
  } catch { throw new Error('Speech provider request failed or timed out; no immediate retry.'); }
  if (!response.ok) throw new Error(`Speech provider returned HTTP ${response.status}; no key rotation or immediate retry.`);
  const size = Number(response.headers?.get('content-length') || 0);
  if (size > 80 * 1024 * 1024) throw new Error('Speech response exceeds the size limit.');
  let data;
  try { data = await response.json(); } catch { throw new Error('Speech provider returned invalid JSON.'); }
  return audioFromResponse(data);
}

export async function generateNarrationFallback(root, post, { env = process.env, now = Date.now(), persist = persistCheckpoint, speech = requestSpeech, render, storyboard, probe = execFileSync } = {}) {
  if (!render || !storyboard) {
    const module = await import('./object-only-video.mjs');
    render ||= module.rebuildObjectOnlyVideo;
    storyboard ||= module.storyboardFromArticle;
  }
  const manifestFile = path.join(root, 'data/marketing-employee/narrations', `${post.slug}.json`);
  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw new Error('Narration manifest could not be read.'); }
  const plan = narrationPlan(post, manifest, manifest ? null : storyboard(post));
  const { file, state } = stateFor(root, post);
  if (state.ttsAttempts >= MAX_TTS_ATTEMPTS) throw new Error('Narration attempt budget exhausted; publication remains blocked.');
  const previous = state.ttsStartedAt ? Date.parse(state.ttsStartedAt) : null;
  if (previous !== null && (!Number.isFinite(previous) || now - previous < RETRY_DELAY)) throw new Error('Narration retry is cooling down; no new speech request.');
  state.ttsAttempts += 1;
  state.ttsStartedAt = new Date(now).toISOString();
  state.narrationSha256 = plan.narrationSha256;
  persist(root, file, state, env); // Before any billable request, including crashes.
  const audio = await speech(plan.text, { env });
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'izem-article-speech-'));
  const inputFile = path.join(work, 'narration.wav');
  try {
    fs.writeFileSync(inputFile, audio);
    let metadata;
    try { metadata = JSON.parse(probe('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', inputFile], { encoding: 'utf8', timeout: 60000 })); }
    catch { throw new Error('Generated narration did not pass media inspection.'); }
    const duration = Number(metadata.format?.duration);
    if (!metadata.streams?.some(s => s.codec_type === 'audio') || !Number.isFinite(duration) || duration < plan.words / 5 || duration > plan.words / 1.2 + 20 || duration > 1200) throw new Error('Narration duration or audio stream is inconsistent with its script.');
    const result = await render(inputFile, post, { slides: plan.slides, narrationSource: 'gemini-tts-canonical-script', durationWeights: plan.slides.map(s => s.narration.split(/\s+/).length) });
    return { ...result, renderMethod: 'gemini-tts-canonical-object-v1', narrationSha256: plan.narrationSha256, sourceSha256: plan.sourceSha256, notebookId: null };
  } finally { fs.rmSync(work, { recursive: true, force: true }); }
}
