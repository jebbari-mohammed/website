#!/usr/bin/env node
// Private pre-publication check. Never invoked by a normal build or public CI.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { load } from 'cheerio';

export const SAPLING_ENDPOINT = 'https://api.sapling.ai/api/v1/aidetect';
export const MAX_SCANS = 3;
export const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');

export function finalPageText(html) {
  const $ = load(html, { scriptingEnabled: false });
  if ($('html').attr('lang')?.toLowerCase().split('-')[0] !== 'en') throw new Error('HOLD: this detector workflow supports explicitly English pages only.');
  const structuredText = [];
  $('script[type="application/ld+json"]').each((_, element) => {
    let json;
    try { json = JSON.parse($(element).text()); } catch { throw new Error('HOLD: malformed public structured metadata.'); }
    const collect = (value, key = '') => {
      if (typeof value === 'string' && /^(name|headline|alternativeHeadline|description|caption|articleBody|text|keywords)$/.test(key)) structuredText.push(value);
      else if (Array.isArray(value)) value.forEach((item) => collect(item, key));
      else if (value && typeof value === 'object') Object.entries(value).forEach(([name, item]) => collect(item, name));
    };
    collect(json);
  });
  $('script,style,template').remove();
  const parts = [$('title').text()];
  $('meta').each((_, element) => {
    const name = String($(element).attr('name') || $(element).attr('property') || '').toLowerCase();
    if (/^(description|og:(title|description)|twitter:(title|description))$/.test(name)) parts.push($(element).attr('content') || '');
  });
  parts.push(...structuredText, $('body').text());
  $('[alt],[aria-label],[title]').each((_, element) => {
    for (const attribute of ['alt', 'aria-label', 'title']) if ($(element).attr(attribute)) parts.push($(element).attr(attribute));
  });
  return parts.map((part) => part.replace(/\s+/gu, ' ').trim()).filter(Boolean).join('\n\n');
}

export function validateHumanizerReview(review, textHash) {
  if (review?.text_sha256 !== textHash || review?.completed !== true
    || review?.facts_preserved !== true || review?.unsupported_claims_removed !== true
    || review?.natural_language_pass !== true || review?.second_read !== true
    || typeof review?.reviewer !== 'string' || !review.reviewer.trim()
    || !Number.isFinite(Date.parse(review?.reviewed_at))) {
    throw new Error('HOLD: a complete Humanizer-style review of this exact final text is required.');
  }
}

export function validateSaplingResponse(response, text) {
  if (typeof response?.score !== 'number' || !Number.isFinite(response.score)
    || response.score < 0 || response.score > 0.10) throw new Error('HOLD: Sapling document score must be finite and between 0 and 0.10 inclusive.');
  if (typeof response.text !== 'string' || response.text !== text) throw new Error('HOLD: Sapling did not return the complete exact submitted text.');
  return response.score;
}

export async function runEditorialPreflight({ html, review, apiKey, state, saveState, fetchImpl = fetch, now = new Date() }) {
  const text = finalPageText(html);
  const textHash = digest(text);
  if (text.length < 300 || text.length > 200000) throw new Error('HOLD: complete English page must contain 300–200000 characters; no truncation or chunk averaging.');
  validateHumanizerReview(review, textHash);
  if (!apiKey) throw new Error('HOLD: no authorized Sapling credential is configured.');
  if (!state || !Array.isArray(state.attempts) || typeof saveState !== 'function') throw new Error('HOLD: persistent private scan-attempt state is required.');
  if (state.attempts.length >= MAX_SCANS) throw new Error('HOLD: three scans have already been attempted for this article/run.');
  if (state.attempts.some((attempt) => attempt.text_sha256 === textHash)) throw new Error('HOLD: this unchanged text was already submitted in this run; revise substantively or use the existing private result.');
  state.attempts.push({ text_sha256: textHash, attempted_at: now.toISOString() });
  await saveState(state); // Persist BEFORE network access: timeouts consume an attempt.
  let response;
  try {
    response = await fetchImpl(SAPLING_ENDPOINT, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(90000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: apiKey, text, sent_scores: true }),
    });
  } catch { throw new Error('HOLD: Sapling request failed; no approval was issued.'); }
  if (!response.ok) throw new Error(`HOLD: Sapling returned HTTP ${response.status}; no retry or fallback detector was used.`);
  let result;
  try { result = await response.json(); } catch { throw new Error('HOLD: malformed Sapling response.'); }
  const score = validateSaplingResponse(result, text);
  return {
    schema_version: 1, provider: 'sapling', endpoint: SAPLING_ENDPOINT,
    text_sha256: textHash, source_sha256: digest(html), character_count: text.length,
    checked_at: now.toISOString(), score, sentence_scores: result.sentence_scores ?? null,
    model_version: result.version ?? result.model_version ?? null,
    scope: 'complete-title-body-public-metadata-captions-and-accessible-labels',
    humanizer_review: review,
    // A private evidence record is not a signature or a release authorization.
    release_authorized: false,
  };
}

export function privatePath(file, repositoryRoot) {
  const absolute = path.resolve(file);
  const root = fs.realpathSync(repositoryRoot);
  const parent = fs.realpathSync(path.dirname(absolute));
  const resolved = path.join(parent, path.basename(absolute));
  if (resolved === root || resolved.startsWith(`${root}${path.sep}`)) throw new Error('Keep review, scan state, and detector results outside the public repository.');
  if (fs.existsSync(resolved) && fs.lstatSync(resolved).isSymbolicLink()) throw new Error('Private editorial files must not be symbolic links.');
  return resolved;
}

export function writePrivateJson(file, value) {
  const descriptor = fs.openSync(file, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_TRUNC | fs.constants.O_NOFOLLOW, 0o600);
  try {
    fs.fchmodSync(descriptor, 0o600);
    fs.writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`);
  } finally { fs.closeSync(descriptor); }
}

async function main() {
  const [htmlFile, inputReview, inputState, inputOutput] = process.argv.slice(2);
  if (!htmlFile || !inputReview || !inputState || !inputOutput) throw new Error('Usage: editorial-preflight.mjs PRIVATE_PAGE.html PRIVATE_REVIEW.json PRIVATE_RUN_STATE.json PRIVATE_RESULT.json');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const [privateHtml, reviewFile, stateFile, outputFile] = [htmlFile, inputReview, inputState, inputOutput].map((file) => privatePath(file, root));
  if (new Set([privateHtml, reviewFile, stateFile, outputFile]).size !== 4) throw new Error('Article, review, run state, and result must use separate private files.');
  const lockFile = `${stateFile}.lock`;
  let lock;
  try { lock = fs.openSync(lockFile, 'wx', 0o600); }
  catch { throw new Error('HOLD: another scan owns this article/run state, or its lock needs review after an interrupted scan.'); }
  try {
    const state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : { attempts: [] };
    if (state.article_path && state.article_path !== privateHtml) throw new Error('HOLD: scan state belongs to a different article.');
    state.article_path = privateHtml;
    const result = await runEditorialPreflight({
      html: fs.readFileSync(privateHtml, 'utf8'), review: JSON.parse(fs.readFileSync(reviewFile, 'utf8')),
      state, apiKey: process.env.SAPLING_API_KEY,
      saveState: (value) => writePrivateJson(stateFile, value),
    });
    writePrivateJson(outputFile, result);
    console.log('Private full-text Sapling preflight passed. Release remains held until authentic approval is connected to the release gate.');
  } finally { fs.closeSync(lock); fs.unlinkSync(lockFile); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
