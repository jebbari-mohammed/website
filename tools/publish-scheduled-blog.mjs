#!/usr/bin/env node
/**
 * Publish Scheduled Blog & Architecture Releases — Promotes due architecture releases
 * and due 3-day scheduled blog posts defined in config/seo-scheduled-blogs.json.
 *
 * Usage:
 *   node tools/publish-scheduled-blog.mjs --list
 *   node tools/publish-scheduled-blog.mjs --next-due [--dry-run]
 *   node tools/publish-scheduled-blog.mjs --slug <slug> [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCHEDULE_PATH = path.join(ROOT, 'config', 'seo-scheduled-blogs.json');
const EXPERIMENTS_PATH = path.join(ROOT, 'config', 'seo-active-experiments.json');

function parseArgs(argv) {
  const args = { list: false, nextDue: false, dryRun: false, slug: null, date: null };
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--list') args.list = true;
    else if (token === '--next-due') args.nextDue = true;
    else if (token === '--dry-run') args.dryRun = true;
    else if (token === '--slug' && argv[i + 1]) args.slug = argv[++i];
    else if (token === '--date' && argv[i + 1]) args.date = argv[++i];
  }
  return args;
}

function addDaysIso(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function publishDueArchitectureReleases(manifest, today, dryRun) {
  const releases = manifest.architectureReleases || [];
  const due = releases.filter((r) => r.status === 'scheduled' && r.scheduledDate <= today);
  let changed = false;

  for (const rel of due) {
    if (dryRun) {
      console.log(`[DRY RUN] Architecture Release #${rel.release} (${rel.scheduledDate}) is due: ${rel.branch}`);
      continue;
    }

    execFileSync('git', ['checkout', rel.branch, '--', ...rel.files], {
      cwd: ROOT,
      stdio: 'inherit'
    });

    if (rel.lock && fs.existsSync(EXPERIMENTS_PATH)) {
      const expData = JSON.parse(fs.readFileSync(EXPERIMENTS_PATH, 'utf8'));
      expData.locks = expData.locks || [];
      if (!expData.locks.some((l) => l.id === rel.lock.id)) {
        expData.locks.push(rel.lock);
        fs.writeFileSync(EXPERIMENTS_PATH, `${JSON.stringify(expData, null, 2)}\n`, 'utf8');
      }
    }

    execFileSync('node', ['tools/sync-sitemap.mjs'], {
      cwd: ROOT,
      stdio: 'inherit'
    });

    rel.status = 'published';
    rel.publishedAt = today;
    changed = true;
    console.log(`Published Architecture Release #${rel.release} (${rel.branch}) on ${today}.`);
  }

  return changed;
}

function main() {
  const args = parseArgs(process.argv);
  const today = args.date || new Date().toISOString().slice(0, 10);
  const manifest = JSON.parse(fs.readFileSync(SCHEDULE_PATH, 'utf8'));

  if (args.list || (!args.nextDue && !args.slug)) {
    console.log(`Staggered Architecture Releases (today: ${today}):`);
    for (const rel of manifest.architectureReleases || []) {
      console.log(
        `  Release #${rel.release} | ${rel.scheduledDate} | [${rel.status.padEnd(9)}] | ${rel.branch} — ${rel.title}`
      );
    }
    console.log(`\n3-Day Scheduled Blog Queue (today: ${today}):`);
    for (const item of manifest.schedule) {
      console.log(
        `  #${String(item.order).padStart(2, '0')} | ${item.scheduledDate} | [${item.status.padEnd(9)}] | ${item.slug} (${item.keyword})`
      );
    }
    return;
  }

  let archChanged = false;
  if (args.nextDue) {
    archChanged = publishDueArchitectureReleases(manifest, today, args.dryRun);
  }

  let candidate = null;
  if (args.slug) {
    candidate = manifest.schedule.find((item) => item.slug === args.slug);
    if (!candidate) {
      throw new Error(`Slug "${args.slug}" not found in config/seo-scheduled-blogs.json.`);
    }
  } else if (args.nextDue) {
    candidate = manifest.schedule.find(
      (item) => item.status === 'scheduled' && item.scheduledDate <= today
    );
    if (!candidate) {
      if (archChanged && !args.dryRun) {
        fs.writeFileSync(SCHEDULE_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
      }
      console.log(`No scheduled blog due on or before ${today}. Next upcoming:`);
      const nextUpcoming = manifest.schedule.find((item) => item.status === 'scheduled');
      if (nextUpcoming) {
        console.log(`  -> ${nextUpcoming.scheduledDate}: ${nextUpcoming.slug}`);
      }
      return;
    }
  }

  const draftAbs = path.join(ROOT, candidate.draftPath);
  const liveAbs = path.join(ROOT, candidate.livePath);

  if (!fs.existsSync(draftAbs)) {
    throw new Error(`Draft file missing: ${candidate.draftPath}`);
  }

  // Validate strict object-only media policy on the draft
  execFileSync('node', ['tools/ai-marketing/blog-media-policy.mjs', '--file', candidate.draftPath], {
    cwd: ROOT,
    stdio: 'inherit'
  });

  if (args.dryRun) {
    console.log(`[DRY RUN] Validated ${candidate.slug} (scheduled ${candidate.scheduledDate}). Ready to promote ${candidate.draftPath} -> ${candidate.livePath}.`);
    return;
  }

  // Check weekly publish guard before promoting
  execFileSync('node', ['tools/ai-marketing/weekly-publish-guard.mjs', '--require-slot'], {
    cwd: ROOT,
    stdio: 'inherit'
  });

  // Promote draft to live blog directory
  fs.copyFileSync(draftAbs, liveAbs);
  fs.unlinkSync(draftAbs);

  // Rebuild blog index + RSS feed and sync sitemap
  execFileSync('node', ['tools/ai-marketing/rebuild-blog-index.mjs'], {
    cwd: ROOT,
    stdio: 'inherit'
  });
  execFileSync('node', ['tools/sync-sitemap.mjs'], {
    cwd: ROOT,
    stdio: 'inherit'
  });

  // Add 21-day new-page lock to config/seo-active-experiments.json
  if (fs.existsSync(EXPERIMENTS_PATH)) {
    const expData = JSON.parse(fs.readFileSync(EXPERIMENTS_PATH, 'utf8'));
    expData.locks = expData.locks || [];
    const lockId = `blog-${candidate.slug}-launch-${today}`;
    if (!expData.locks.some((e) => e.id === lockId)) {
      expData.locks.push({
        id: lockId,
        url: `/blog/${candidate.slug}`,
        files: [candidate.livePath],
        launchedAt: today,
        lockUntil: addDaysIso(today, 21),
        preferredReviewAt: addDaysIso(today, 28),
        reason: `Publish SERP-synthesized human guide for "${candidate.keyword}" on the 3-day schedule. Preserve for a 21-day crawl, indexing, and ranking evaluation window.`
      });
      fs.writeFileSync(EXPERIMENTS_PATH, `${JSON.stringify(expData, null, 2)}\n`, 'utf8');
    }
  }

  candidate.status = 'published';
  candidate.publishedAt = today;
  fs.writeFileSync(SCHEDULE_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(`Published ${candidate.slug} -> ${candidate.livePath} and updated blog index, RSS feed, sitemap, and experiment locks.`);
}

main();
