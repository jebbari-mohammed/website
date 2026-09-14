#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const DEFAULT_CONFIG = path.join(ROOT, 'config/seo-active-experiments.json');
const DEFAULT_SAFETY_OVERRIDES = path.join(ROOT, 'config/seo-safety-overrides.json');
const OWNER_THUMBNAIL_OVERRIDE_KIND = 'owner-image-policy-thumbnail-migration';

function parseArgs(argv) {
  const args = {
    config: DEFAULT_CONFIG,
    safetyOverrides: DEFAULT_SAFETY_OVERRIDES,
    base: '',
    head: 'HEAD',
    now: new Date().toISOString(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === '--config') args.config = path.resolve(argv[++index]);
    else if (item.startsWith('--config=')) args.config = path.resolve(item.slice(9));
    else if (item === '--safety-overrides') args.safetyOverrides = path.resolve(argv[++index]);
    else if (item.startsWith('--safety-overrides=')) args.safetyOverrides = path.resolve(item.slice(19));
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

function gitRaw(args) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
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

export function validateSafetyOverrideConfig(config) {
  if (!config || Number(config.version) !== 1) throw new Error('SEO safety override config version must be 1');
  if (!Array.isArray(config.overrides)) throw new Error('SEO safety override config must contain an overrides array');

  const ids = new Set();
  for (const override of config.overrides) {
    if (!override?.id || ids.has(override.id)) throw new Error('Every SEO safety override needs a unique id');
    ids.add(override.id);
    if (override.kind !== OWNER_THUMBNAIL_OVERRIDE_KIND) {
      throw new Error(`SEO safety override ${override.id} has unsupported kind: ${override.kind || '(missing)'}`);
    }
    if (!override.reason || String(override.reason).trim().length < 20) {
      throw new Error(`SEO safety override ${override.id} needs a specific reason`);
    }
    if (!Array.isArray(override.files) || override.files.length === 0) {
      throw new Error(`SEO safety override ${override.id} needs at least one exact protected file`);
    }
    const seenFiles = new Set();
    for (const file of override.files) {
      const normalized = String(file);
      if (!/^public\/blog\/[^/]+\.html$/.test(normalized)) {
        throw new Error(`SEO safety override ${override.id} may only target exact English public/blog HTML files: ${normalized}`);
      }
      if (seenFiles.has(normalized)) throw new Error(`SEO safety override ${override.id} repeats file: ${normalized}`);
      seenFiles.add(normalized);
    }
    const expiresAt = new Date(`${override.expiresAt}T23:59:59.999Z`);
    if (!override.expiresAt || Number.isNaN(expiresAt.getTime())) {
      throw new Error(`SEO safety override ${override.id} has an invalid expiresAt`);
    }
  }
  return config;
}

export function isOwnerImagePolicyThumbnailOnlyChange(baseText, headText) {
  let replacements = 0;
  const remoteThumbnail = /https:\/\/(?:i\.ytimg\.com|img\.youtube\.com)\/vi\/([^/"'?#]+)\/(?:hqdefault|maxresdefault|sddefault|mqdefault|default)\.jpg/g;
  const expected = String(baseText).replace(remoteThumbnail, (_match, videoId) => {
    replacements += 1;
    return `https://youraicoach.life/youtube/${videoId}/thumbnail.svg`;
  });
  return replacements > 0 && expected === String(headText);
}

export function findActiveLockViolations(changedFiles, config, now = new Date(), options = {}) {
  validateConfig(config);
  const instant = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(instant.getTime())) throw new Error('Guard received an invalid current time');
  const changed = new Set(changedFiles.map((file) => String(file).trim()).filter(Boolean));
  const enforceLockIds = options.enforceLockIds == null
    ? null
    : new Set(Array.from(options.enforceLockIds, (id) => String(id)));
  const violations = [];

  for (const lock of config.locks) {
    // A lock introduced by this same change is the launch boundary, not an
    // already-active experiment. It starts protecting the target on the next
    // change. Pre-existing locks remain enforced even when the config file is
    // also edited in the current PR.
    if (enforceLockIds && !enforceLockIds.has(lock.id)) continue;

    const unlock = new Date(`${lock.lockUntil}T23:59:59.999Z`);
    if (instant > unlock) continue;
    const touched = lock.files.filter((file) => changed.has(file));
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

function safetyOverridesFromFile(filePath) {
  if (!fs.existsSync(filePath)) return { version: 1, overrides: [] };
  return validateSafetyOverrideConfig(JSON.parse(fs.readFileSync(filePath, 'utf8')));
}

function fileAtRef(ref, file) {
  if (!ref || /^0+$/.test(ref)) return null;
  try {
    return gitRaw(['show', `${ref}:${file}`]);
  } catch {
    return null;
  }
}

function approvedOwnerThumbnailFiles(overrideConfig, now, base, head) {
  const instant = now instanceof Date ? now : new Date(now);
  const approved = new Map();
  const rejected = [];

  for (const override of overrideConfig.overrides) {
    const expires = new Date(`${override.expiresAt}T23:59:59.999Z`);
    if (instant > expires) continue;

    for (const file of override.files) {
      const baseText = fileAtRef(base, file);
      const headText = fileAtRef(head, file);
      if (baseText == null || headText == null) {
        rejected.push({ overrideId: override.id, file, reason: 'file could not be read at both base and head refs' });
        continue;
      }
      if (!isOwnerImagePolicyThumbnailOnlyChange(baseText, headText)) {
        rejected.push({ overrideId: override.id, file, reason: 'diff is not an exact remote-to-local thumbnail URL migration' });
        continue;
      }
      approved.set(file, override.id);
    }
  }

  return { approved, rejected };
}

function applySafetyOverrides(violations, overrideConfig, now, base, head) {
  if (!violations.length || !base || /^0+$/.test(base)) {
    return { remaining: violations, accepted: [], rejected: [] };
  }

  const { approved, rejected } = approvedOwnerThumbnailFiles(overrideConfig, now, base, head);
  const accepted = [];
  const remaining = [];

  for (const violation of violations) {
    const blockedFiles = [];
    for (const file of violation.files) {
      const overrideId = approved.get(file);
      if (overrideId) accepted.push({ overrideId, lockId: violation.id, url: violation.url, file });
      else blockedFiles.push(file);
    }
    if (blockedFiles.length) remaining.push({ ...violation, files: blockedFiles });
  }

  return { remaining, accepted, rejected };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = validateConfig(JSON.parse(fs.readFileSync(args.config, 'utf8')));
  const safetyOverrides = safetyOverridesFromFile(args.safetyOverrides);
  const changedFiles = changedFilesBetween(args.base, args.head);
  const baseConfig = configAtBase(args.base, args.config);
  const baseLockIds = baseConfig ? new Set(baseConfig.locks.map((lock) => lock.id)) : null;
  const instant = new Date(args.now);

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
  });
  const safetyResult = applySafetyOverrides(violations, safetyOverrides, instant, args.base, args.head);

  if (safetyResult.accepted.length) {
    const grouped = new Map();
    for (const item of safetyResult.accepted) {
      if (!grouped.has(item.overrideId)) grouped.set(item.overrideId, []);
      grouped.get(item.overrideId).push(item.file);
    }
    for (const [overrideId, files] of grouped) {
      console.log(`SEO safety governance override ${overrideId} accepted ${files.length} thumbnail-URL-only protected-file correction(s).`);
    }
  }
  if (safetyResult.rejected.length) {
    for (const item of safetyResult.rejected) {
      if (!changedFiles.includes(item.file)) continue;
      console.error(`SEO safety governance override ${item.overrideId} rejected ${item.file}: ${item.reason}.`);
    }
  }

  if (safetyResult.remaining.length) {
    console.error(`SEO active-experiment guard blocked ${safetyResult.remaining.length} protected target(s).`);
    for (const violation of safetyResult.remaining) {
      console.error(`- ${violation.url} is locked through ${violation.lockUntil}; touched: ${violation.files.join(', ')}`);
      console.error(`  Reason: ${violation.reason}`);
    }
    console.error('If this is a genuine factual, legal, safety, rendering, indexing, canonical, or deployment correction, use an explicitly reviewed governance override rather than weakening the lock definition in the same change.');
    process.exitCode = 1;
    return;
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
