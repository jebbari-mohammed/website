#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const DEFAULT_CONFIG = path.join(ROOT, 'config/seo-active-experiments.json');

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

export function findActiveLockViolations(changedFiles, config, now = new Date()) {
  validateConfig(config);
  const instant = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(instant.getTime())) throw new Error('Guard received an invalid current time');
  const changed = new Set(changedFiles.map((file) => String(file).trim()).filter(Boolean));
  const violations = [];

  for (const lock of config.locks) {
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = validateConfig(JSON.parse(fs.readFileSync(args.config, 'utf8')));
  const changedFiles = changedFilesBetween(args.base, args.head);
  const violations = findActiveLockViolations(changedFiles, config, new Date(args.now));

  if (violations.length) {
    console.error(`SEO active-experiment guard blocked ${violations.length} protected target(s).`);
    for (const violation of violations) {
      console.error(`- ${violation.url} is locked through ${violation.lockUntil}; touched: ${violation.files.join(', ')}`);
      console.error(`  Reason: ${violation.reason}`);
    }
    console.error('If this is a genuine factual, legal, safety, rendering, indexing, canonical, or deployment correction, update the lock intentionally with a documented reason in the same reviewed change.');
    process.exitCode = 1;
    return;
  }

  console.log(`SEO active-experiment guard passed for ${changedFiles.length} changed file(s); no protected target was modified inside its lock window.`);
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((error) => {
    console.error(`SEO active-experiment guard failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
