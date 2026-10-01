#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { assertVideoRecord, renderVideoCard } from './video-provenance.mjs';
import { verifyVideoRecordProof } from './video-github-proof.mjs';

export function inspectArticleRelease({ slug, html, baselineHtml, records, facts, repository }) {
  if (baselineHtml !== null && html === baselineHtml) return { legacyUnchanged: true, errors: [] };
  const errors = [];
  if (!html.includes('data-owner-visual-policy="objects-only-v1"')) errors.push('missing objects-only visual policy');
  const starts = [...html.matchAll(/<!-- IZEM_VIDEO_START -->/g)];
  const ends = [...html.matchAll(/<!-- IZEM_VIDEO_END -->/g)];
  if (starts.length !== 1 || ends.length !== 1 || starts[0].index >= ends[0].index) errors.push('missing, malformed, or duplicated completed video card');
  const block = starts.length === 1 && ends.length === 1 ? html.slice(starts[0].index, ends[0].index) : '';
  const videoIds = [...block.matchAll(/data-video-id=["']([A-Za-z0-9_-]{11})["']/g)].map((match) => match[1]);
  const matching = records.filter((record) => record.slug === slug);
  let record;
  if (videoIds.length !== 1 || matching.length !== 1) errors.push('requires exactly one article-bound validated upload record and video ID');
  else {
    record = matching[0];
    try { assertVideoRecord(record, { slug, articleHtml: html, productFactsBytes: facts, videoId: videoIds[0], repository }); }
    catch (error) { errors.push(error.message); }
    const completeBlock = html.slice(starts[0].index, ends[0].index + '<!-- IZEM_VIDEO_END -->'.length);
    if (errors.length === 0 && completeBlock !== renderVideoCard({ title: record.title }, record.youtube_id)) errors.push('video card differs from the deterministic renderer; hidden prose/media cannot inherit source approval');
    if (!block.includes(`/youtube/${videoIds[0]}/`) || !block.includes(`/youtube/thumbnails/${videoIds[0]}.svg`)) errors.push('video card/watch page/thumbnail identity mismatch');
  }
  return { legacyUnchanged: false, errors, record };
}

export async function checkArticleReleases({ root = process.cwd(), verifyProof = verifyVideoRecordProof } = {}) {
  const policy = JSON.parse(fs.readFileSync(path.join(root, 'config/seo-release-policy.json'), 'utf8'));
  if (!/^[a-f0-9]{40}$/.test(policy.legacyBaselineCommit) || policy.repository !== 'jebbari-mohammed/website'
    || policy.editorialApprovalIntegration !== 'hold-until-authenticated-provider-handoff'
    || policy.saplingMaximumDocumentScore !== 0.10 || policy.saplingMaximumScansPerArticlePerRun !== 3 || policy.humanizerReviewRequired !== true) throw new Error('HOLD: release policy is missing or unsupported.');
  execFileSync('git', ['cat-file', '-e', `${policy.legacyBaselineCommit}^{commit}`], { cwd: root });
  execFileSync('git', ['merge-base', '--is-ancestor', policy.legacyBaselineCommit, 'HEAD'], { cwd: root });
  const facts = fs.readFileSync(path.join(root, 'data/brand/product-facts.json'));
  const progress = JSON.parse(fs.readFileSync(path.join(root, 'tools/ai-marketing/.notebooklm-video-progress.json'), 'utf8'));
  if (!Array.isArray(progress.completed)) throw new Error('HOLD: video progress records are malformed.');
  const failures = [];
  let legacy = 0;
  for (const name of fs.readdirSync(path.join(root, 'public/blog')).sort()) {
    if (!name.endsWith('.html') || name === 'index.html') continue;
    const relative = `public/blog/${name}`;
    const html = fs.readFileSync(path.join(root, relative), 'utf8');
    let baselineHtml = null;
    try { baselineHtml = execFileSync('git', ['show', `${policy.legacyBaselineCommit}:${relative}`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch { /* New URL: full evidence required. */ }
    const result = inspectArticleRelease({ slug: name.slice(0, -5), html, baselineHtml, records: progress.completed, facts, repository: policy.repository });
    if (result.legacyUnchanged) { legacy++; continue; }
    if (result.record && result.errors.length === 0) {
      try { await verifyProof(result.record, { repository: policy.repository }); }
      catch { result.errors.push('authenticated video workflow artifact could not be verified; missing, expired, or mismatched proof is a HOLD'); }
    }
    // No unauthenticated JSON score or environment override is accepted. The
    // private scanner is ready, but provider-to-release approval handoff is not
    // configured. Preserve the last healthy deployment until it is reviewed.
    result.errors.push('editorial HOLD: authenticated Sapling + Humanizer approval handoff is not configured; private preflight results alone cannot authorize publication');
    failures.push({ file: relative, errors: result.errors });
  }
  return { legacy, failures };
}

async function main() {
  const result = await checkArticleReleases();
  console.log(`Article release gate: ${result.legacy} exact unchanged legacy article(s).`);
  for (const failure of result.failures) { console.error(failure.file); for (const error of failure.errors) console.error(`  HOLD: ${error}`); }
  if (result.failures.length) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch((error) => { console.error(`Article release HOLD: ${error.message}`); process.exitCode = 1; });
