#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { inspectPublicationEvidence } from './publication-evidence.mjs';

export const MAX_NEW_POSTS = 3;
export const ROLLING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function isBlogPost(file) {
  return /^public\/blog\/[^/]+\.html$/.test(file) && file !== 'public/blog/index.html';
}

function postPaths(output) {
  // NUL delimiters preserve paths containing spaces, quotes, or newlines.
  return output.split('\0').filter(isBlogPost);
}

function git(cwd, args) {
  return execFileSync('git', ['--no-replace-objects', ...args], {
    cwd,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function resolveCommit(cwd, ref) {
  return git(cwd, ['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`]).trim();
}

function validateLimit(value) {
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_NEW_POSTS) {
    throw new Error(`SEO_WEEKLY_NEW_POST_LIMIT must be an integer from 1 to ${MAX_NEW_POSTS}; the policy ceiling cannot be raised.`);
  }
  return limit;
}

/**
 * Inspect first-parent source history regardless of author. This diagnostic
 * alone cannot approve publication: CLI success also requires authenticated
 * deployment evidence, which prevents backdated commits expiring early.
 * A merge publishes its tree changes at merge time, even when its branch was
 * authored weeks earlier. Renames and reintroductions consume a slot; a URL is
 * counted only once in a window, including if it has subsequently been deleted.
 *
 * The rolling interval is (now - 168 hours, now]. Read the complete history and
 * filter dates ourselves: git log --since can stop early at a backdated commit.
 * --require-slot is a pre-creation check. Release checks additionally allow at
 * most one distinct added URL across base..head (default: the latest commit),
 * plus any pending worktree/index additions. Pass the run's original base to
 * cover multi-commit runs; an explicit base must be on the first-parent history.
 */
export function inspectPublicationWindow({
  cwd = process.cwd(),
  head = 'HEAD',
  base,
  now = new Date(),
  limit = MAX_NEW_POSTS,
  requireSlot = false,
  includeWorktree = true,
} = {}) {
  limit = validateLimit(limit);
  const instant = new Date(now);
  if (!Number.isFinite(instant.getTime())) throw new Error('Publish guard received an invalid current time.');
  const start = new Date(instant.getTime() - ROLLING_WINDOW_MS);

  if (git(cwd, ['rev-parse', '--is-shallow-repository']).trim() !== 'false') {
    throw new Error('Full Git history is required; use actions/checkout with fetch-depth: 0 (or git fetch --unshallow).');
  }
  const grafts = path.resolve(cwd, git(cwd, ['rev-parse', '--git-path', 'info/grafts']).trim());
  if (fs.existsSync(grafts) && fs.readFileSync(grafts, 'utf8').split('\n').some((line) => line.trim() && !line.trim().startsWith('#'))) {
    throw new Error('Git grafts obscure publication history; remove the grafts before checking the full history.');
  }
  const resolvedHead = resolveCommit(cwd, head);
  if (includeWorktree && resolvedHead !== resolveCommit(cwd, 'HEAD')) {
    throw new Error('The requested head must match the checkout when including pending changes.');
  }
  const history = git(cwd, ['log', '--first-parent', '--format=%H %ct %P', resolvedHead, '--'])
    .trim().split('\n').filter(Boolean).map((line) => {
      const [sha, timestamp, ...parents] = line.split(' ');
      const time = Number(timestamp) * 1000;
      if (!Number.isFinite(time)) throw new Error(`Invalid commit time for ${sha}.`);
      return { sha, time, parent: parents[0] };
    });

  let runCommits;
  if (base !== undefined) {
    const resolvedBase = resolveCommit(cwd, base);
    const baseIndex = history.findIndex(({ sha }) => sha === resolvedBase);
    if (baseIndex === -1) throw new Error('Run base must be an ancestor on the head first-parent history.');
    runCommits = new Set(history.slice(0, baseIndex).map(({ sha }) => sha));
  } else {
    runCommits = new Set(requireSlot ? [] : [resolvedHead]);
  }

  const windowFiles = new Set();
  const runFiles = new Set();
  for (const commit of history) {
    if (commit.time <= start.getTime() && !runCommits.has(commit.sha)) continue;
    const diffArgs = commit.parent
      ? ['diff', commit.parent, commit.sha]
      : ['diff-tree', '--root', '--no-commit-id', '-r', commit.sha];
    const added = postPaths(git(cwd, [
      ...diffArgs, '--no-ext-diff', '--no-textconv', '--no-renames', '--diff-filter=A', '--name-only', '-z', '--', 'public/blog/',
    ]));
    if (added.length && commit.time > instant.getTime()) {
      throw new Error(`Future-dated publication commit ${commit.sha} prevents a reliable rolling-window check.`);
    }
    if (added.length && runCommits.has(commit.sha) && commit.time <= start.getTime()) {
      // Fast-forwarding an old-dated addition has no durable publication time
      // in Git: merely charging it to this run would forget it on the next run.
      // Require a current, auditable release commit (for example a merge).
      throw new Error(`Run-added publication commit ${commit.sha} is outside the rolling seven-day window; its publication time cannot be verified for subsequent runs.`);
    }
    for (const file of added) {
      if (commit.time > start.getTime()) windowFiles.add(file);
      if (runCommits.has(commit.sha)) runFiles.add(file);
    }
  }

  const pendingFiles = new Set();
  if (includeWorktree) {
    // Check both the staged snapshot and the working tree; either can contain
    // additions the other lacks. Untracked files can enter the production build.
    for (const args of [
      ['diff', '--cached', resolvedHead],
      ['diff', resolvedHead],
    ]) {
      for (const file of postPaths(git(cwd, [
        ...args, '--no-ext-diff', '--no-textconv', '--no-renames', '--diff-filter=A', '--name-only', '-z', '--', 'public/blog/',
      ]))) pendingFiles.add(file);
    }
    for (const file of postPaths(git(cwd, ['ls-files', '--others', '--exclude-standard', '-z', '--', 'public/blog/']))) {
      pendingFiles.add(file);
    }
    for (const file of pendingFiles) {
      windowFiles.add(file);
      runFiles.add(file);
    }
  }

  const violations = [];
  if (windowFiles.size > limit) violations.push(`The rolling seven-day ceiling of ${limit} is exceeded. No further publication or deployment is allowed.`);
  if (runFiles.size > 1) violations.push(`This run adds ${runFiles.size} top-level English blog posts; at most one is allowed per run.`);
  if (requireSlot && windowFiles.size >= limit) violations.push('No new-page slot remains in the rolling seven-day window. Improve an existing URL or publish nothing.');

  return {
    start: start.toISOString(),
    end: instant.toISOString(),
    limit,
    files: [...windowFiles].sort(),
    runFiles: [...runFiles].sort(),
    pendingFiles: [...pendingFiles].sort(),
    violations,
    allowed: violations.length === 0,
  };
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--require-slot') options.requireSlot = true;
    else if (arg === '--commit-history-only') options.commitHistoryOnly = true;
    else if (arg === '--base' || arg === '--head') {
      const value = argv[++index];
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a commit reference.`);
      options[arg.slice(2)] = value;
    } else if (/^--(?:base|head)=/.test(arg)) {
      const [name, ...value] = arg.slice(2).split('=');
      options[name] = value.join('=');
      if (!options[name]) throw new Error(`--${name} requires a commit reference.`);
    } else throw new Error(`Unknown publish guard argument: ${arg}`);
  }
  return options;
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = inspectPublicationWindow({
      ...options,
      limit: process.env.SEO_WEEKLY_NEW_POST_LIMIT ?? MAX_NEW_POSTS,
    });
    const summary = `${result.files.length}/${result.limit} new top-level English blog posts in (${result.start}, ${result.end}]`;
    if (!result.allowed) {
      console.error(`Weekly SEO publish guard BLOCKED: ${summary}.`);
      for (const violation of result.violations) console.error(violation);
      console.error('SEO_PUBLISH_OVERRIDE cannot bypass the publication ceilings.');
      process.exitCode = 1;
      return;
    }
    if (options.commitHistoryOnly) {
      console.log(`Git-history diagnostic only (NOT publication approval): ${summary}.`);
      process.exitCode = 2; // A diagnostic can never act as a successful release gate.
      return;
    }
    const evidence = await inspectPublicationEvidence({
      head: options.head || 'HEAD', requireSlot: options.requireSlot, limit: result.limit,
      repository: process.env.GITHUB_REPOSITORY || 'jebbari-mohammed/website',
      currentRunId: process.env.GITHUB_RUN_ID, currentRunAttempt: process.env.GITHUB_RUN_ATTEMPT,
    });
    const allFiles = new Set([...result.files, ...evidence.files]);
    const violations = [...evidence.violations];
    if (allFiles.size > result.limit) violations.push(`Combined publication and pending-source evidence exceeds the ${result.limit}-post rolling ceiling.`);
    if (options.requireSlot && allFiles.size >= result.limit) violations.push('No new-page slot remains in the evidence-backed rolling window.');
    if (violations.length) {
      console.error(`Weekly SEO publish guard BLOCKED by deployment evidence (${allFiles.size}/${result.limit}).`);
      for (const violation of violations) console.error(violation);
      process.exitCode = 1;
      return;
    }
    console.log(`Weekly SEO publish guard passed: ${allFiles.size}/${result.limit} conservative publication reservations in the rolling 168-hour window; ${result.runFiles.length}/1 additions in this run. Authenticated deployment evidence checked; Git timestamps alone cannot approve publication.`);
  } catch (error) {
    console.error(`Weekly SEO publish guard BLOCKED: ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
