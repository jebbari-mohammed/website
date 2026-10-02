import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const VIDEO_SCHEMA_VERSION = 2;
export const VIDEO_POLICY = 'objects-only-v1';
export const VIDEO_SAMPLE_COUNT = 14;
export const VIDEO_SAMPLE_METHOD = 'uniform-full-duration-frames-v1';
export const VIDEO_PRODUCER = 'daily-notebooklm-video-v2';
export const VIDEO_WORKFLOW_PATH = '.github/workflows/daily-video-tts.yml';
export const VIDEO_PROVENANCE_ARTIFACT_DIRECTORY = 'izem-video-provenance';
const SHA256 = /^[a-f0-9]{64}$/;
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const SLUG = /^[a-z0-9][a-z0-9-]{1,119}$/;

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

// The producer inserts exactly one newline before this generated card. Remove
// that newline too so adding/replacing a card cannot invalidate its own source.
// Do not strip any other part of the article, metadata, scripts, or styles.
export function articleSource(html) {
  const value = String(html).replace(/\r\n/g, '\n');
  const markers = [...value.matchAll(/<!--\s*(NOTEBOOKLM|IZEM)_VIDEO_(START|END)\s*-->/gi)];
  if (!markers.length) return value;
  if (markers.length !== 2 || markers[0][2].toUpperCase() !== 'START'
      || markers[1][2].toUpperCase() !== 'END'
      || markers[0][1].toUpperCase() !== markers[1][1].toUpperCase()) {
    throw new Error('Malformed or duplicate generated article video block.');
  }
  const start = markers[0].index;
  const prefixEnd = start > 0 && value[start - 1] === '\n' ? start - 1 : start;
  return value.slice(0, prefixEnd) + value.slice(markers[1].index + markers[1][0].length);
}

export function articleSourceDigest(html) { return sha256(articleSource(html)); }
export function productFactsDigest(bytes) { return sha256(bytes); }
export function videoFileDigest(file) { return sha256(fs.readFileSync(file)); }

export function sampleTimestamps(duration, count = VIDEO_SAMPLE_COUNT) {
  if (!Number.isFinite(duration) || duration < 0.1 || count !== VIDEO_SAMPLE_COUNT) {
    throw new Error('Video duration/sample count cannot establish full-duration frame coverage.');
  }
  const end = duration - 0.05;
  return Array.from({ length: count }, (_, index) => Number((index * end / (count - 1)).toFixed(3)));
}

export function assertPeopleFreeEvidence(evidence) {
  if (evidence?.safe !== true || evidence?.containsHuman !== false
      || !Array.isArray(evidence?.unsafeFrameHints) || evidence.unsafeFrameHints.length
      || typeof evidence.reason !== 'string' || !evidence.reason.trim()
      || typeof evidence.model !== 'string' || !evidence.model.trim()
      || evidence.sample_count !== VIDEO_SAMPLE_COUNT || evidence.method !== VIDEO_SAMPLE_METHOD
      || !Number.isFinite(Date.parse(evidence.checked_at))) {
    throw new Error('Missing or invalid actual people-free classifier evidence.');
  }
  const expected = sampleTimestamps(evidence.duration_seconds, evidence.sample_count);
  if (!Array.isArray(evidence.sample_timestamps_seconds)
      || evidence.sample_timestamps_seconds.length !== expected.length
      || expected.some((timestamp, index) => !Number.isFinite(evidence.sample_timestamps_seconds[index])
        || Math.abs(timestamp - evidence.sample_timestamps_seconds[index]) > 0.001)) {
    throw new Error('People-free evidence does not cover the uniform full-duration sample set.');
  }
  return true;
}

export function provenanceFromEnvironment(env = process.env) {
  if (env.GITHUB_ACTIONS !== 'true' || !/^[^/]+\/[^/]+$/.test(env.GITHUB_REPOSITORY || '')
      || env.GITHUB_REF !== 'refs/heads/main'
      || !/^[a-f0-9]{40}$/.test(env.GITHUB_SHA || '')
      || !/^[1-9]\d*$/.test(env.GITHUB_RUN_ID || '')
      || !/^[1-9]\d*$/.test(env.GITHUB_RUN_ATTEMPT || '')
      || env.GITHUB_WORKFLOW_REF !== `${env.GITHUB_REPOSITORY}/${VIDEO_WORKFLOW_PATH}@refs/heads/main`) {
    throw new Error('Validated video publishing requires the trusted main-branch GitHub video workflow.');
  }
  return {
    producer: VIDEO_PRODUCER,
    repository: env.GITHUB_REPOSITORY,
    workflow_ref: env.GITHUB_WORKFLOW_REF,
    run_id: String(env.GITHUB_RUN_ID),
    run_attempt: String(env.GITHUB_RUN_ATTEMPT),
    source_commit: env.GITHUB_SHA,
  };
}

export function assertVideoRecord(record, expected = {}) {
  if (record?.schema_version !== VIDEO_SCHEMA_VERSION || !SLUG.test(record.slug || '')
      || record.url !== `https://youraicoach.life/blog/${record.slug}`
      || typeof record.title !== 'string' || !record.title.trim()
      || !VIDEO_ID.test(record.youtube_id || '')
      || record.youtube !== `https://youtube.com/watch?v=${record.youtube_id}`
      || typeof record.notebook_id !== 'string' || !record.notebook_id.trim()
      || record.visual_policy !== VIDEO_POLICY || record.people_free_validated !== true
      || !SHA256.test(record.article_sha256 || '') || !SHA256.test(record.product_facts_sha256 || '')
      || !SHA256.test(record.video_sha256 || '') || !Number.isSafeInteger(record.video_bytes) || record.video_bytes < 10000
      || !/^UC[A-Za-z0-9_-]{22}$/.test(record.upload?.channel_id || '')
      || !Number.isFinite(Date.parse(record.upload?.uploaded_at))
      || record.date !== record.upload.uploaded_at) {
    throw new Error('Missing or invalid source-bound validated video upload record. Legacy stamps are not provenance.');
  }
  assertPeopleFreeEvidence(record.people_free_validation);
  if (Date.parse(record.people_free_validation.checked_at) > Date.parse(record.upload.uploaded_at)) {
    throw new Error('Video validation must precede its upload.');
  }
  const provenance = record.provenance;
  if (provenance?.producer !== VIDEO_PRODUCER || !/^[^/]+\/[^/]+$/.test(provenance?.repository || '')
      || provenance.workflow_ref !== `${provenance.repository}/${VIDEO_WORKFLOW_PATH}@refs/heads/main`
      || !/^[1-9]\d*$/.test(provenance.run_id || '') || !/^[1-9]\d*$/.test(provenance.run_attempt || '')
      || !/^[a-f0-9]{40}$/.test(provenance.source_commit || '')) {
    throw new Error('Video record has no trusted-workflow provenance identity.');
  }
  if ((expected.slug !== undefined && record.slug !== expected.slug)
      || (expected.articleHtml !== undefined && record.article_sha256 !== articleSourceDigest(expected.articleHtml))
      || (expected.productFactsBytes !== undefined && record.product_facts_sha256 !== productFactsDigest(expected.productFactsBytes))
      || (expected.videoId !== undefined && record.youtube_id !== expected.videoId)
      || (expected.repository !== undefined && provenance.repository !== expected.repository)) {
    throw new Error('Validated video record does not match the current article, product facts, video, or repository.');
  }
  return true;
}

// Canonicalization is for exact comparison with the independent GitHub artifact,
// not a signature. Consumers MUST verify that artifact's trusted workflow origin.
export function canonicalVideoRecord(value) {
  function sorted(item) {
    if (Array.isArray(item)) return item.map(sorted);
    if (item && typeof item === 'object') return Object.fromEntries(Object.keys(item).sort().map((key) => [key, sorted(item[key])]));
    return item;
  }
  return JSON.stringify(sorted(value));
}

export function videoProvenanceArtifactName(record) {
  assertVideoRecord(record);
  return `izem-video-provenance-${record.slug}-${record.provenance.run_attempt}`;
}

export function writeVideoProvenanceArtifact(record, runnerTemp = process.env.RUNNER_TEMP) {
  assertVideoRecord(record);
  if (!runnerTemp || !path.isAbsolute(runnerTemp)) throw new Error('RUNNER_TEMP is required for the authenticated video artifact handoff.');
  const directory = path.join(runnerTemp, VIDEO_PROVENANCE_ARTIFACT_DIRECTORY);
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, 'record.json');
  fs.writeFileSync(file, `${canonicalVideoRecord(record)}\n`, { encoding: 'utf8', flag: 'wx' });
  return file;
}

export function videoDescriptionEvidence(evidence) {
  for (const key of ['article_sha256', 'product_facts_sha256', 'video_sha256']) {
    if (!SHA256.test(evidence?.[key] || '')) throw new Error(`Missing video description binding: ${key}`);
  }
  return [
    `IZEM_VISUAL_POLICY=${VIDEO_POLICY};VALIDATED=true`,
    `IZEM_ARTICLE_SHA256=${evidence.article_sha256}`,
    `IZEM_PRODUCT_FACTS_SHA256=${evidence.product_facts_sha256}`,
    `IZEM_VIDEO_SHA256=${evidence.video_sha256}`,
  ].join('\n');
}

export function assertYoutubeVideoMatches(record, video) {
  assertVideoRecord(record);
  const lines = String(video?.snippet?.description || '').split(/\r?\n/);
  if (video?.id !== record.youtube_id || video?.snippet?.channelId !== record.upload.channel_id
      || !['public', 'unlisted'].includes(video?.status?.privacyStatus)
      || !['uploaded', 'processed'].includes(video?.status?.uploadStatus)
      || !lines.includes(`Canonical article: ${record.url}`)
      || videoDescriptionEvidence(record).split('\n').some((line) => !lines.includes(line))) {
    throw new Error('Authenticated YouTube upload does not match its validated source-bound ledger record.');
  }
  return true;
}

function escapeHtml(value = '') {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function renderVideoCard(post, id) {
  if (!VIDEO_ID.test(id || '')) throw new Error('A valid YouTube id is required for the generated article card.');
  const title = escapeHtml(post.title);
  return `<!-- IZEM_VIDEO_START -->\n<section class="izem-video" style="margin:32px 0;padding:24px;border:1px solid rgba(55,199,201,.25);border-radius:8px;background:rgba(55,199,201,.08)">\n  <h2 style="margin-top:0">Watch the video guide</h2>\n  <a data-izem-video-card="true" data-video-id="${id}" href="/youtube/${id}/" aria-label="Watch ${title}" style="display:block;width:100%;aspect-ratio:16/9;position:relative;overflow:hidden;border-radius:8px;background:#02070D;text-decoration:none">\n    <img src="https://youraicoach.life/youtube/thumbnails/${id}.svg" alt="${title}" width="480" height="360" loading="lazy" style="display:block;width:100%;height:100%;object-fit:cover">\n    <span aria-hidden="true" style="position:absolute;inset:0;display:grid;place-items:center"><span style="display:grid;place-items:center;width:68px;height:48px;border-radius:12px;background:#FF0000;color:#fff;font:700 24px/1 system-ui">▶</span></span>\n  </a>\n  <p style="margin:14px 0 0;color:#AEBBCC">A short IZEM video guide for the decisions in this article.</p>\n</section>\n<!-- IZEM_VIDEO_END -->`;
}

