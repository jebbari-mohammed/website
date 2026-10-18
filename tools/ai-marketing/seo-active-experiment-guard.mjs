#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const DEFAULT_CONFIG = path.join(ROOT, 'config/seo-active-experiments.json');

function normalizeOwnerImagePolicyThumbnailReferences(content) {
  return String(content ?? '')
    .replace(
      /https?:\/\/(?:i\.ytimg\.com|img\.youtube\.com)\/vi\/([A-Za-z0-9_-]+)\/(?:maxresdefault|sddefault|hqdefault|mqdefault|default)\.jpg(?:\?[^"'\s<>]*)?/gi,
      (_match, videoId) => `__IZEM_SAFE_VIDEO_THUMBNAIL__:${videoId}`,
    )
    .replace(
      /https:\/\/youraicoach\.life\/youtube\/thumbnails\/([A-Za-z0-9_-]+)\.svg/gi,
      (_match, videoId) => `__IZEM_SAFE_VIDEO_THUMBNAIL__:${videoId}`,
    );
}

export function isOwnerImagePolicyThumbnailReplacement(baseContent, headContent) {
  const base = String(baseContent ?? '');
  const head = String(headContent ?? '');
  const remotePattern = /https?:\/\/(?:i\.ytimg\.com|img\.youtube\.com)\/vi\/[A-Za-z0-9_-]+\/(?:maxresdefault|sddefault|hqdefault|mqdefault|default)\.jpg(?:\?[^"'\s<>]*)?/i;
  const safePattern = /https:\/\/youraicoach\.life\/youtube\/thumbnails\/[A-Za-z0-9_-]+\.svg/i;
  if (!remotePattern.test(base) || remotePattern.test(head) || !safePattern.test(head)) return false;
  return normalizeOwnerImagePolicyThumbnailReferences(base) === normalizeOwnerImagePolicyThumbnailReferences(head);
}

function videoBlock(content) {
  const parts = String(content ?? '').split(/<!-- IZEM_VIDEO_(?:START|END) -->/);
  if (parts.length !== 3 || !String(content).includes('<!-- IZEM_VIDEO_START -->') ||
      !String(content).includes('<!-- IZEM_VIDEO_END -->') ||
      String(content).indexOf('<!-- IZEM_VIDEO_START -->') > String(content).indexOf('<!-- IZEM_VIDEO_END -->')) return null;
  return { before: parts[0], block: parts[1], after: parts[2] };
}

// The safety exception cannot authorize an editorial rewrite or a newly asserted
// video validation. The destination record must already exist at the Git base.
export function isDocumentedVideoSafetyCorrection(baseContent, headContent, options = {}) {
  const { correction, baseCorrections = [], baseRecords = [], reviewNote = '', changedFiles = [], now = new Date() } = options;
  const from = correction?.fromVideoId;
  const to = correction?.toVideoId;
  if (correction?.kind !== 'video-visual-safety' || !/^[A-Za-z0-9_-]{11}$/.test(from ?? '') ||
      !/^[A-Za-z0-9_-]{11}$/.test(to ?? '') || from === to) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(correction.date ?? '') ||
      Number.isNaN(new Date(correction.date).getTime()) || new Date(correction.date) > new Date(now)) return false;
  if (!/^docs\/seo-experiments\/[A-Za-z0-9_-]+\.md$/.test(correction.reviewNote ?? '') ||
      !changedFiles.includes(correction.reviewNote) || !reviewNote.includes(from) ||
      !reviewNote.includes(to) || !reviewNote.includes('safety')) return false;
  if (baseCorrections.some((entry) => entry.kind === correction.kind && entry.file === correction.file &&
      entry.fromVideoId === from && entry.toVideoId === to)) return false;
  const destination = baseRecords.find((record) => record.youtube === `https://youtube.com/watch?v=${to}`);
  if (destination?.visual_policy !== 'objects-only-v1' || destination?.people_free_validated !== true) return false;
  const original = videoBlock(baseContent);
  const updated = videoBlock(headContent);
  if (!original || !updated || original.before !== updated.before || original.after !== updated.after) return false;
  if (!original.block.includes(`data-video-id="${from}"`) || !updated.block.includes(`data-video-id="${to}"`)) return false;
  // Only a static, owned companion card is permitted. Active media and arbitrary
  // outbound links would need a separate review and cannot use this exception.
  const staticCard = new RegExp('^\\s*<section class="izem-video note" aria-labelledby="video-title"><h2 id="video-title">[^<>]+</h2>' +
    `<a data-izem-video-card="true" data-video-id="${to}" href="/youtube/${to}/" aria-label="[^<>\"]+">` +
    `<img src="https://youraicoach\\.life/youtube/thumbnails/${to}\\.svg" alt="[^<>\"]+" width="1200" height="675" loading="lazy" decoding="async">` +
    '</a><p>[^<>]+</p></section>\\s*$');
  return staticCard.test(updated.block);
}

// One reviewed calculator correction, pinned to the complete original/corrected
// file bytes. Config annotations cannot authorize a different edit or file.
export const REVIEWED_CALCULATOR_SAFETY_CORRECTION = Object.freeze({
  id: 'macro-positive-calories-2026-10-08',
  kind: 'calculator-input-safety',
  date: '2026-10-08',
  file: 'public/macro-calculator/index.html',
  baseSha256: '910f7d1a34f87684bc903b72895d03936d815e5043a2c7d57e441374533e9655',
  headSha256: '65e3b72cc74fe2a9047cebc26aec375d1a5c05b703c02cb0e9e8c299a89cd758',
  reviewNote: 'docs/seo-experiments/2026-10-08-calculator-input-safety-correction.md',
});

export function isDocumentedCalculatorSafetyCorrection(baseContent, headContent, options = {}) {
  const { correction, baseCorrections = [], reviewNote = '', changedFiles = [], now = new Date() } = options;
  const reviewed = REVIEWED_CALCULATOR_SAFETY_CORRECTION;
  if (!correction || Object.entries(reviewed).some(([key, value]) => correction[key] !== value)) return false;
  if (typeof baseContent !== 'string' || typeof headContent !== 'string') return false;
  const instant = new Date(now);
  if (Number.isNaN(instant.getTime()) || new Date(reviewed.date) > instant) return false;
  if (!changedFiles.includes('config/seo-active-experiments.json') ||
      !changedFiles.includes(reviewed.reviewNote) || !reviewNote.includes('safety') ||
      ![reviewed.id, reviewed.file, reviewed.baseSha256, reviewed.headSha256].every(value => reviewNote.includes(value))) return false;
  if (baseCorrections.some(entry => entry.id === reviewed.id ||
      (entry.file === reviewed.file && entry.baseSha256 === reviewed.baseSha256 && entry.headSha256 === reviewed.headSha256))) return false;
  const digest = content => createHash('sha256').update(content, 'utf8').digest('hex');
  return digest(baseContent) === reviewed.baseSha256 && digest(headContent) === reviewed.headSha256;
}

// The reviewed repair changes only bare XML ampersands in two existing assets.
export const REVIEWED_SVG_RENDERING_CORRECTION = Object.freeze({
  id: 'rest-images-xml-rendering-2026-10-17',
  kind: 'svg-xml-rendering',
  date: '2026-10-17',
  reviewNote: 'docs/seo-experiments/2026-10-17-rest-images-rendering-correction.md',
  files: Object.freeze([
    Object.freeze({ file: 'public/blog/assets/how-long-to-rest-between-sets/hero.svg', baseSha256: 'a5d47fec042d153e81abb38a2881cb8cd0889d69b87cb09b489a2ea68c3af3f8', headSha256: '180c8c70c657ca3156207ee1a06b9fa4ab29b64e527a25bdc29f842f60162b62' }),
    Object.freeze({ file: 'public/blog/assets/how-long-to-rest-between-sets/framework.svg', baseSha256: 'a7ce3a436ed4284f198818c1a5a1cb4ab3cb60e2db7958b56904d1dedeb5d9a6', headSha256: '036e0d216df317d92e91b844826ed49feaea65eff2e0eb723874707f167d7bab' }),
  ]),
});

// One explicitly owner-directed presentation revision. This is not a rendering
// or SEO correction. Complete-file hashes freeze the output reviewed on October
// 13; the request and one-release revision identity retain their October 12 date.
export const REVIEWED_OWNER_DESIGN_REVISION = Object.freeze({
  id: 'owner-athletic-homepage-revision-2026-10-12',
  kind: 'owner-directed-presentation-revision',
  date: '2026-10-12',
  reviewNote: 'docs/seo-experiments/2026-10-12-athletic-homepage-revision.md',
  files: Object.freeze([
    Object.freeze({ file: 'src/styles/homepage-refinement.css', baseSha256: 'ce68fb89d368ab5eee0e9418f04dccc51791964c1a2f12a8d115c29a4e0f2f43', headSha256: '57068046aec681c5269f1084ebec9ca2239d7ed2c54af954417941129714004c' }),
    Object.freeze({ file: 'src/components/Hero.tsx', baseSha256: '1f893dfe23564d9d91b8a63e258f850d43970028b645e72cff5dac5b097da1da', headSha256: '6943a5e180e635cdf5d5ca23d348645443146c68dda7641de32a1096834e7ff4' }),
    Object.freeze({ file: 'src/components/ProductShowcase.tsx', baseSha256: '119032bd94fb770c53d5c9224efa22419339c5bdf12bb1ec5dbe816ef66fe334', headSha256: '183205e03a317f932ab4dfd571aeb0eff8d5770be82295856071ed000559809c' }),
    Object.freeze({ file: 'src/components/Capabilities.tsx', baseSha256: 'b887314e24516e9411f4cf0948e79948c0f41bc4869949236a9585c87a06edad', headSha256: '95b9e0c4c392b414b3630978d87e00bf8090d2a44b86185f277a82729ba1c4aa' }),
  ]),
});

function isFrozenOwnerDesignReview(reviewed) {
  const pinned = REVIEWED_OWNER_DESIGN_REVISION;
  if (!reviewed || ['id', 'kind', 'date', 'reviewNote'].some(field => reviewed[field] !== pinned[field]) ||
      !Array.isArray(reviewed.files) || reviewed.files.length !== pinned.files.length) return false;
  return reviewed.files.every((entry, index) => entry.file === pinned.files[index].file &&
    /^[a-f0-9]{64}$/.test(entry.baseSha256 || '') && /^[a-f0-9]{64}$/.test(entry.headSha256 || '') &&
    entry.baseSha256 !== entry.headSha256);
}

// The reviewed dependency permits deterministic byte fixtures in unit tests.
// The release CLI always supplies the code-pinned manifest, never config input.
export function isDocumentedOwnerDesignRevision(baseContent, headContent, options = {}, reviewed = REVIEWED_OWNER_DESIGN_REVISION) {
  const { revision, baseRevisions = [], reviewNote = '', changedFiles = [], now = new Date() } = options;
  if (!isFrozenOwnerDesignReview(reviewed) || typeof baseContent !== 'string' || typeof headContent !== 'string') return false;
  const entry = reviewed.files.find(item => item.file === revision?.file);
  if (!entry) return false;
  const exactRecord = { id: reviewed.id, kind: reviewed.kind, date: reviewed.date,
    file: entry.file, baseSha256: entry.baseSha256, headSha256: entry.headSha256, reviewNote: reviewed.reviewNote };
  if (Object.entries(exactRecord).some(([field, value]) => revision[field] !== value)) return false;
  const instant = new Date(now);
  if (Number.isNaN(instant.getTime()) || new Date(reviewed.date) > instant ||
      baseRevisions.some(record => record.id === reviewed.id)) return false;
  if (!changedFiles.includes('config/seo-active-experiments.json') || !changedFiles.includes(entry.file) ||
      !changedFiles.includes(reviewed.reviewNote) || typeof reviewNote !== 'string' ||
      ![reviewed.id, reviewed.kind, reviewed.date, entry.file, entry.baseSha256, entry.headSha256]
        .every(value => reviewNote.includes(value))) return false;
  const digest = content => createHash('sha256').update(content, 'utf8').digest('hex');
  return digest(baseContent) === entry.baseSha256 && digest(headContent) === entry.headSha256;
}

function preservesOwnerDesignLock(baseLock, headLock) {
  if (!headLock) return false;
  const { ownerDirectedRevisions: before = [], ...baseDefinition } = baseLock;
  const { ownerDirectedRevisions: after = [], ...headDefinition } = headLock;
  return Array.isArray(before) && Array.isArray(after) && JSON.stringify(baseDefinition) === JSON.stringify(headDefinition) &&
    JSON.stringify(after.slice(0, before.length)) === JSON.stringify(before);
}

function parseArgs(argv) {
  const args = {
    config: DEFAULT_CONFIG,
    base: '',
    head: 'HEAD',
    now: new Date().toISOString(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === '--config') args.config = path.resolve(argv[++index]);
    else if (item.startsWith('--config=')) args.config = path.resolve(item.slice(9));
    else if (item === '--base') args.base = argv[++index];
    else if (item.startsWith('--base=')) args.base = item.slice(7);
    else if (item === '--head') args.head = argv[++index];
    else if (item.startsWith('--head=')) args.head = item.slice(7);
    else if (item === '--now') args.now = argv[++index];
    else if (item.startsWith('--now=')) args.now = item.slice(6);
  }

  return args;
}

function git(args) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  }).trim();
}

export function validateConfig(config) {
  if (!config || Number(config.version) !== 1) throw new Error('Active experiment config version must be 1');
  if (!Array.isArray(config.locks)) throw new Error('Active experiment config must contain a locks array');

  const ids = new Set();
  for (const lock of config.locks) {
    if (!lock?.id || ids.has(lock.id)) throw new Error('Every active experiment lock needs a unique id');
    ids.add(lock.id);
    if (!lock.url || !String(lock.url).startsWith('/')) throw new Error(`Lock ${lock.id} needs a site-relative url`);
    if (!Array.isArray(lock.files) || lock.files.length === 0) throw new Error(`Lock ${lock.id} needs at least one protected file`);
    for (const file of lock.files) {
      if (!String(file).startsWith('public/') && !String(file).startsWith('src/')) {
        throw new Error(`Lock ${lock.id} protects an unsupported path: ${file}`);
      }
    }
    for (const field of ['launchedAt', 'lockUntil', 'preferredReviewAt']) {
      const value = new Date(`${lock[field]}T00:00:00Z`);
      if (!lock[field] || Number.isNaN(value.getTime())) throw new Error(`Lock ${lock.id} has an invalid ${field}`);
    }
    if (new Date(`${lock.lockUntil}T00:00:00Z`) < new Date(`${lock.launchedAt}T00:00:00Z`)) {
      throw new Error(`Lock ${lock.id} ends before it launches`);
    }
  }
  return config;
}

export function findActiveLockViolations(changedFiles, config, now = new Date(), options = {}) {
  validateConfig(config);
  const instant = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(instant.getTime())) throw new Error('Guard received an invalid current time');
  const changed = new Set(changedFiles.map((file) => String(file).trim()).filter(Boolean));
  const enforceLockIds = options.enforceLockIds == null
    ? null
    : new Set(Array.from(options.enforceLockIds, (id) => String(id)));
  const ignoreFiles = new Set(Array.from(options.ignoreFiles || [], (file) => String(file)));
  const violations = [];

  for (const lock of config.locks) {
    // A lock introduced by this same change is the launch boundary, not an
    // already-active experiment. It starts protecting the target on the next
    // change. Pre-existing locks remain enforced even when the config file is
    // also edited in the current PR.
    if (enforceLockIds && !enforceLockIds.has(lock.id)) continue;

    const unlock = new Date(`${lock.lockUntil}T23:59:59.999Z`);
    if (instant > unlock) continue;
    const touched = lock.files.filter((file) => changed.has(file) && !ignoreFiles.has(String(file)));
    if (!touched.length) continue;
    violations.push({
      id: lock.id,
      url: lock.url,
      lockUntil: lock.lockUntil,
      preferredReviewAt: lock.preferredReviewAt,
      files: touched,
      reason: lock.reason || '',
    });
  }

  return violations;
}

export function findActiveLockMutationViolations(baseConfig, headConfig, now = new Date()) {
  if (!baseConfig) return [];
  validateConfig(baseConfig);
  validateConfig(headConfig);

  const instant = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(instant.getTime())) throw new Error('Guard received an invalid current time');

  const headById = new Map(headConfig.locks.map((lock) => [String(lock.id), lock]));
  const violations = [];

  for (const baseLock of baseConfig.locks) {
    const baseUnlock = new Date(`${baseLock.lockUntil}T23:59:59.999Z`);
    if (instant > baseUnlock) continue;

    const headLock = headById.get(String(baseLock.id));
    if (!headLock) {
      violations.push({
        id: baseLock.id,
        url: baseLock.url,
        type: 'removed',
        detail: `active lock was removed before ${baseLock.lockUntil}`,
      });
      continue;
    }

    const headUnlock = new Date(`${headLock.lockUntil}T23:59:59.999Z`);
    if (headUnlock < baseUnlock) {
      violations.push({
        id: baseLock.id,
        url: baseLock.url,
        type: 'shortened',
        detail: `lockUntil changed from ${baseLock.lockUntil} to ${headLock.lockUntil}`,
      });
    }

    if (headLock.url !== baseLock.url) {
      violations.push({
        id: baseLock.id,
        url: baseLock.url,
        type: 'retargeted',
        detail: `protected URL changed from ${baseLock.url} to ${headLock.url}`,
      });
    }

    const headFiles = new Set(headLock.files.map(String));
    const removedFiles = baseLock.files.filter((file) => !headFiles.has(String(file)));
    if (removedFiles.length) {
      violations.push({
        id: baseLock.id,
        url: baseLock.url,
        type: 'files-removed',
        detail: `protected file(s) removed from the lock: ${removedFiles.join(', ')}`,
      });
    }
  }

  return violations;
}

function changedFilesBetween(base, head) {
  let resolvedBase = base;
  if (!resolvedBase || /^0+$/.test(resolvedBase)) {
    try {
      resolvedBase = git(['rev-parse', `${head}^`]);
    } catch {
      return [];
    }
  }
  return git(['diff', '--name-only', `${resolvedBase}..${head}`, '--'])
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function fileAtRef(ref, file) {
  if (!ref || /^0+$/.test(ref)) return null;
  try {
    return git(['show', `${ref}:${file}`]);
  } catch {
    return null;
  }
}

function exactFileAtRef(ref, file) {
  if (!ref || /^0+$/.test(ref)) return null;
  try {
    // Unlike the historical git() text helper, digest verification must preserve
    // trailing newlines and every other byte in the reviewed UTF-8 HTML file.
    return execFileSync('git', ['show', `${ref}:${file}`], {
      cwd: ROOT, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024,
    });
  } catch {
    return null;
  }
}

function ownerImagePolicySafetyOverrideFiles(base, head, changedFiles) {
  const allowed = new Set();
  for (const file of changedFiles) {
    if (!String(file).startsWith('public/') || !String(file).endsWith('.html')) continue;
    const baseContent = fileAtRef(base, file);
    const headContent = fileAtRef(head, file);
    if (baseContent == null || headContent == null) continue;
    if (isOwnerImagePolicyThumbnailReplacement(baseContent, headContent)) allowed.add(String(file));
  }
  return allowed;
}

function configAtBase(base, configPath) {
  if (!base || /^0+$/.test(base)) return null;

  const relativeConfig = path.relative(ROOT, configPath).split(path.sep).join('/');
  if (relativeConfig.startsWith('../') || path.isAbsolute(relativeConfig)) {
    // A custom config outside the repository cannot be reconstructed from Git.
    // Preserve the conservative historical behavior and enforce every head lock.
    return null;
  }

  let raw;
  try {
    raw = git(['show', `${base}:${relativeConfig}`]);
  } catch (error) {
    const stderr = String(error?.stderr || '');
    if (/does not exist in|exists on disk, but not in|Path .* does not exist/i.test(stderr)) return { version: 1, locks: [] };
    throw new Error(`Could not read the active-experiment config at base ${base}: ${error instanceof Error ? error.message : String(error)}`);
  }

  return validateConfig(JSON.parse(raw));
}

function documentedVideoSafetyOverrideFiles(base, head, changedFiles, baseConfig, headConfig, now) {
  const allowed = new Set();
  if (!baseConfig) return allowed;
  const rawRecords = fileAtRef(base, 'tools/ai-marketing/.notebooklm-video-progress.json');
  const baseRecords = rawRecords ? JSON.parse(rawRecords).completed || [] : [];
  for (const file of changedFiles.filter((item) => item.startsWith('public/') && item.endsWith('.html'))) {
    const protectingLocks = baseConfig.locks.filter((lock) => lock.files.includes(file) &&
      now <= new Date(`${lock.lockUntil}T23:59:59.999Z`));
    if (!protectingLocks.length) continue;
    const accepted = protectingLocks.every((baseLock) => {
      const headLock = headConfig.locks.find((lock) => lock.id === baseLock.id);
      return (headLock?.corrections || []).some((correction) => correction.file === file &&
        isDocumentedVideoSafetyCorrection(fileAtRef(base, file), fileAtRef(head, file), {
          correction, baseCorrections: baseLock.corrections || [], baseRecords,
          changedFiles, now, reviewNote: fileAtRef(head, correction.reviewNote) || '',
        }));
    });
    if (accepted) allowed.add(file);
  }
  return allowed;
}

export function documentedCalculatorSafetyOverrideFiles(base, head, changedFiles, baseConfig, headConfig, now, readAtRef = exactFileAtRef) {
  const allowed = new Set();
  if (!baseConfig) return allowed;
  const reviewed = REVIEWED_CALCULATOR_SAFETY_CORRECTION;
  if (!changedFiles.includes(reviewed.file)) return allowed;
  const protectingLocks = baseConfig.locks.filter(lock => lock.files.includes(reviewed.file) &&
    now <= new Date(`${lock.lockUntil}T23:59:59.999Z`));
  if (!protectingLocks.length) return allowed;
  const accepted = protectingLocks.every(baseLock => {
    const headLock = headConfig.locks.find(lock => lock.id === baseLock.id);
    return (headLock?.corrections || []).some(correction => correction.file === reviewed.file &&
      correction.reviewNote === reviewed.reviewNote &&
      isDocumentedCalculatorSafetyCorrection(readAtRef(base, reviewed.file), readAtRef(head, reviewed.file), {
        correction, baseCorrections: baseLock.corrections || [], changedFiles, now,
        reviewNote: readAtRef(head, reviewed.reviewNote) || '',
      }));
  });
  if (accepted) allowed.add(reviewed.file);
  return allowed;
}

export function documentedOwnerDesignOverrideFiles(base, head, changedFiles, baseConfig, headConfig, now,
  readAtRef = exactFileAtRef, reviewed = REVIEWED_OWNER_DESIGN_REVISION) {
  const allowed = new Set();
  if (!baseConfig || !isFrozenOwnerDesignReview(reviewed) ||
      findActiveLockMutationViolations(baseConfig, headConfig, now).length ||
      !changedFiles.includes('config/seo-active-experiments.json') || !changedFiles.includes(reviewed.reviewNote)) return allowed;
  // An uncommitted local annotation cannot approve a different committed diff.
  const rawHeadConfig = readAtRef(head, 'config/seo-active-experiments.json');
  if (typeof rawHeadConfig !== 'string') return allowed;
  let committedHeadConfig;
  try { committedHeadConfig = validateConfig(JSON.parse(rawHeadConfig)); } catch { return allowed; }
  if (JSON.stringify(committedHeadConfig) !== JSON.stringify(headConfig)) return allowed;
  const reviewNote = readAtRef(head, reviewed.reviewNote);
  for (const entry of reviewed.files) {
    if (!changedFiles.includes(entry.file)) continue;
    const protectingLocks = baseConfig.locks.filter(lock => lock.files.includes(entry.file) &&
      now <= new Date(`${lock.lockUntil}T23:59:59.999Z`));
    if (!protectingLocks.length) continue;
    const accepted = protectingLocks.every(baseLock => {
      const headLock = committedHeadConfig.locks.find(lock => lock.id === baseLock.id);
      if (!preservesOwnerDesignLock(baseLock, headLock)) return false;
      return (headLock.ownerDirectedRevisions || []).some(revision => revision.file === entry.file &&
        isDocumentedOwnerDesignRevision(readAtRef(base, entry.file), readAtRef(head, entry.file), {
          revision, baseRevisions: baseLock.ownerDirectedRevisions || [], changedFiles, now, reviewNote,
        }, reviewed));
    });
    if (accepted) allowed.add(entry.file);
  }
  return allowed;
}

// Only the two reviewed complete-file transitions can repair malformed SVG XML
// during this experiment. Config annotations alone cannot approve new edits.
export function documentedSvgRenderingOverrideFiles(base, head, changedFiles, baseConfig, headConfig, now,
  readAtRef = exactFileAtRef) {
  const allowed = new Set();
  const reviewed = REVIEWED_SVG_RENDERING_CORRECTION;
  const instant = new Date(now);
  if (!baseConfig || Number.isNaN(instant.getTime()) || new Date(reviewed.date) > instant ||
      findActiveLockMutationViolations(baseConfig, headConfig, instant).length ||
      !changedFiles.includes('config/seo-active-experiments.json') || !changedFiles.includes(reviewed.reviewNote)) return allowed;
  let committedConfig;
  try { committedConfig = validateConfig(JSON.parse(readAtRef(head, 'config/seo-active-experiments.json'))); } catch { return allowed; }
  if (JSON.stringify(committedConfig) !== JSON.stringify(headConfig)) return allowed;
  const note = readAtRef(head, reviewed.reviewNote) || '';
  const digest = content => typeof content === 'string' ? createHash('sha256').update(content, 'utf8').digest('hex') : null;
  for (const entry of reviewed.files) {
    if (!changedFiles.includes(entry.file) || ![reviewed.id, reviewed.kind, reviewed.date,
      entry.file, entry.baseSha256, entry.headSha256].every(value => note.includes(value))) continue;
    if (digest(readAtRef(base, entry.file)) !== entry.baseSha256 || digest(readAtRef(head, entry.file)) !== entry.headSha256) continue;
    const locks = baseConfig.locks.filter(lock => lock.files.includes(entry.file) && instant <= new Date(`${lock.lockUntil}T23:59:59.999Z`));
    const record = { id: reviewed.id, kind: reviewed.kind, date: reviewed.date, reviewNote: reviewed.reviewNote, ...entry };
    if (locks.length && locks.every(lock => !(lock.corrections || []).some(c => c.id === reviewed.id) &&
      (committedConfig.locks.find(l => l.id === lock.id)?.corrections || []).some(c =>
        Object.entries(record).every(([key, value]) => c[key] === value)))) allowed.add(entry.file);
  }
  return allowed;
}

// One reviewed discovery correction: the generated TRX archive row only.
// Entire-file digests preserve the protected experiment copy and every other row.
export const REVIEWED_ARCHIVE_DISCOVERY_CORRECTION = Object.freeze({
  "id": "trx-archive-discovery-2026-10-18",
  "kind": "archive-discovery",
  "date": "2026-10-18",
  "file": "public/blog/index.html",
  "baseSha256": "03ecd95d2d696a89390038c7ec71b0e354deffcd1a8ae4bf5843ca794725c7ab",
  "headSha256": "a4a95951aa4e27937a967ee72371a703068db64b56590722d7379c842ffa4708",
  "reviewNote": "docs/seo-experiments/2026-10-18-trx-workout-launch.md"
});

export function documentedArchiveDiscoveryOverrideFiles(base, head, changedFiles, baseConfig, headConfig, now,
  readAtRef = exactFileAtRef, reviewed = REVIEWED_ARCHIVE_DISCOVERY_CORRECTION) {
  const allowed = new Set(), instant = new Date(now);
  if (!baseConfig || Number.isNaN(instant.getTime()) || new Date(reviewed.date) > instant ||
      instant.toISOString().slice(0, 10) !== reviewed.date ||
      findActiveLockMutationViolations(baseConfig, headConfig, instant).length ||
      ![reviewed.file, reviewed.reviewNote, 'config/seo-active-experiments.json'].every(f => changedFiles.includes(f))) return allowed;
  let committedConfig;
  try { committedConfig = validateConfig(JSON.parse(readAtRef(head, 'config/seo-active-experiments.json'))); } catch { return allowed; }
  if (JSON.stringify(committedConfig) !== JSON.stringify(headConfig)) return allowed;
  const note = readAtRef(head, reviewed.reviewNote) || '';
  if (!Object.values(reviewed).every(value => note.includes(value))) return allowed;
  const original = readAtRef(base, reviewed.file), updated = readAtRef(head, reviewed.file);
  const digest = value => typeof value === 'string' ? createHash('sha256').update(value, 'utf8').digest('hex') : null;
  if (digest(original) !== reviewed.baseSha256 || digest(updated) !== reviewed.headSha256) return allowed;
  const archive = /<!-- BLOG_ARCHIVE_START -->[\s\S]*?<!-- BLOG_ARCHIVE_END -->/;
  if (!archive.test(original) || !archive.test(updated) || original.replace(archive, '') !== updated.replace(archive, '')) return allowed;
  const locks = baseConfig.locks.filter(lock => lock.files.includes(reviewed.file) && instant <= new Date(`${lock.lockUntil}T23:59:59.999Z`));
  if (locks.length && locks.every(lock => !(lock.corrections || []).some(c => c.id === reviewed.id) &&
      (committedConfig.locks.find(l => l.id === lock.id)?.corrections || []).some(c =>
        Object.entries(reviewed).every(([k, v]) => c[k] === v)))) allowed.add(reviewed.file);
  return allowed;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = validateConfig(JSON.parse(fs.readFileSync(args.config, 'utf8')));
  const changedFiles = changedFilesBetween(args.base, args.head);
  const baseConfig = configAtBase(args.base, args.config);
  const baseLockIds = baseConfig ? new Set(baseConfig.locks.map((lock) => lock.id)) : null;
  const instant = new Date(args.now);
  const ownerImageSafetyOverrideFiles = ownerImagePolicySafetyOverrideFiles(args.base, args.head, changedFiles);
  const videoSafetyOverrideFiles = documentedVideoSafetyOverrideFiles(args.base, args.head, changedFiles, baseConfig, config, instant);
  const calculatorSafetyOverrideFiles = documentedCalculatorSafetyOverrideFiles(args.base, args.head, changedFiles, baseConfig, config, instant);
  const ownerDesignOverrideFiles = documentedOwnerDesignOverrideFiles(args.base, args.head, changedFiles, baseConfig, config, instant);
  const svgRenderingOverrideFiles = documentedSvgRenderingOverrideFiles(args.base, args.head, changedFiles, baseConfig, config, instant);

  const archiveDiscoveryOverrideFiles = documentedArchiveDiscoveryOverrideFiles(args.base, args.head, changedFiles, baseConfig, config, instant);

  const mutationViolations = findActiveLockMutationViolations(baseConfig, config, instant);
  if (mutationViolations.length) {
    console.error(`SEO active-experiment guard blocked ${mutationViolations.length} active lock weakening mutation(s).`);
    for (const violation of mutationViolations) {
      console.error(`- ${violation.url} (${violation.id}): ${violation.detail}`);
    }
    console.error('Active locks are immutable in normal PRs until their lock window expires. This prevents deleting, shortening, retargeting, or dropping protected files to bypass experiment attribution.');
    process.exitCode = 1;
    return;
  }

  const violations = findActiveLockViolations(changedFiles, config, instant, {
    enforceLockIds: baseLockIds,
    ignoreFiles: new Set([...ownerImageSafetyOverrideFiles, ...videoSafetyOverrideFiles, ...calculatorSafetyOverrideFiles, ...ownerDesignOverrideFiles, ...svgRenderingOverrideFiles, ...archiveDiscoveryOverrideFiles]),
  });

  if (violations.length) {
    console.error(`SEO active-experiment guard blocked ${violations.length} protected target(s).`);
    for (const violation of violations) {
      console.error(`- ${violation.url} is locked through ${violation.lockUntil}; touched: ${violation.files.join(', ')}`);
      console.error(`  Reason: ${violation.reason}`);
    }
    console.error('If this is a genuine factual, legal, safety, rendering, indexing, canonical, or deployment correction, use an explicitly reviewed governance override rather than weakening the lock definition in the same change.');
    console.error('An explicit owner-directed presentation revision needs its own reviewed complete-file digest transition and committed documentation; it is not a rendering or SEO correction.');
    process.exitCode = 1;
    return;
  }

  if (ownerImageSafetyOverrideFiles.size) {
    console.log(`SEO active-experiment guard accepted a narrowly scoped owner-image safety correction in ${ownerImageSafetyOverrideFiles.size} protected HTML file(s). Only exact YouTube-thumbnail URL replacements are exempt; any other content change remains blocked.`);
  }
  if (videoSafetyOverrideFiles.size) {
    console.log(`SEO active-experiment guard accepted ${videoSafetyOverrideFiles.size} documented video-block safety correction(s), using destination validation already present at the base. Article content and lock dates remain protected.`);
  }
  if (calculatorSafetyOverrideFiles.size) {
    console.log(`SEO active-experiment guard accepted ${calculatorSafetyOverrideFiles.size} documented calculator safety correction(s) matching reviewed base/head SHA-256 digests. Other file content and lock dates remain protected.`);
  }
  if (ownerDesignOverrideFiles.size) {
    console.log(`SEO active-experiment guard accepted ${ownerDesignOverrideFiles.size} exact reviewed owner-directed presentation file transition(s). Existing lock definitions remain intact; engagement comparisons must account for this owner intervention.`);
  }
  if (svgRenderingOverrideFiles.size) {
    console.log(`SEO active-experiment guard accepted ${svgRenderingOverrideFiles.size} exact reviewed SVG XML rendering correction(s). Other asset content and lock dates remain protected.`);
  }

  const introduced = baseLockIds
    ? config.locks.filter((lock) => !baseLockIds.has(lock.id)).map((lock) => lock.id)
    : [];
  if (introduced.length) {
    console.log(`SEO active-experiment guard accepted ${introduced.length} newly introduced launch lock(s): ${introduced.join(', ')}.`);
  }
  console.log(`SEO active-experiment guard passed for ${changedFiles.length} changed file(s); no pre-existing protected target or active lock definition was weakened inside its lock window.`);
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((error) => {
    console.error(`SEO active-experiment guard failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
