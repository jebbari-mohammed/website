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
    ignoreFiles: new Set([...ownerImageSafetyOverrideFiles, ...videoSafetyOverrideFiles, ...calculatorSafetyOverrideFiles]),
  });

  if (violations.length) {
    console.error(`SEO active-experiment guard blocked ${violations.length} protected target(s).`);
    for (const violation of violations) {
      console.error(`- ${violation.url} is locked through ${violation.lockUntil}; touched: ${violation.files.join(', ')}`);
      console.error(`  Reason: ${violation.reason}`);
    }
    console.error('If this is a genuine factual, legal, safety, rendering, indexing, canonical, or deployment correction, use an explicitly reviewed governance override rather than weakening the lock definition in the same change.');
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
