#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const BLOG = path.join(ROOT, 'public', 'blog');
const PROGRESS_FILE = path.join(ROOT, 'tools', 'ai-marketing', '.notebooklm-video-progress.json');
const CONTRACT_START = Date.parse('2026-10-05T00:00:00Z');
const STRICT_MARKER = 'data-owner-visual-policy="objects-only-v1"';
const VIDEO_START = '<!-- IZEM_VIDEO_START -->';
const VIDEO_END = '<!-- IZEM_VIDEO_END -->';
const CANONICAL_ORIGIN = 'https://youraicoach.life';

function parseArgs(argv) {
  const args = { checkAll: false, findPending: false, file: '' };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--check-all') args.checkAll = true;
    else if (item === '--find-pending') args.findPending = true;
    else if (item === '--file') args.file = argv[++i] || '';
    else if (item.startsWith('--file=')) args.file = item.slice('--file='.length);
    else throw new Error(`Unknown argument: ${item}`);
  }
  const modes = [args.checkAll, args.findPending, Boolean(args.file)].filter(Boolean).length;
  if (modes !== 1) throw new Error('Usage: article-video-contract.mjs --check-all | --find-pending | --file public/blog/<slug>.html');
  return args;
}

function resolveInsideRoot(relative) {
  const absolute = path.resolve(ROOT, relative);
  const prefix = `${ROOT}${path.sep}`;
  if (absolute !== ROOT && !absolute.startsWith(prefix)) throw new Error(`Path escapes repository: ${relative}`);
  return absolute;
}

function topLevelBlogFiles() {
  if (!fs.existsSync(BLOG)) return [];
  return fs.readdirSync(BLOG, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html') && entry.name !== 'index.html')
    .map((entry) => path.join(BLOG, entry.name));
}

function relative(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function slugFor(file) {
  return path.basename(file, '.html');
}

function createdAt(file) {
  const rel = relative(file);
  const output = execFileSync('git', ['log', '--diff-filter=A', '--follow', '--format=%cI', '--', rel], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  const lines = output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) throw new Error(`${rel}: could not resolve the file creation commit from Git history`);
  const value = Date.parse(lines.at(-1));
  if (!Number.isFinite(value)) throw new Error(`${rel}: invalid creation timestamp from Git history: ${lines.at(-1)}`);
  return value;
}

function progressRecords() {
  if (!fs.existsSync(PROGRESS_FILE)) return [];
  const value = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  if (!Array.isArray(value.completed)) throw new Error(`${relative(PROGRESS_FILE)}: completed must be an array`);
  return value.completed;
}

function youtubeId(value) {
  try {
    const parsed = new URL(value);
    if (parsed.hostname === 'youtu.be') return parsed.pathname.replace(/^\//, '');
    if (parsed.hostname.endsWith('youtube.com')) return parsed.searchParams.get('v') || '';
  } catch {
    return '';
  }
  return '';
}

function canonicalFrom(html) {
  const match = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)
    || html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
  return match?.[1] || '';
}

function videoIdFrom(html) {
  const start = html.indexOf(VIDEO_START);
  const end = html.indexOf(VIDEO_END);
  if (start < 0 || end < 0 || end <= start) return '';
  const block = html.slice(start, end + VIDEO_END.length);
  return block.match(/data-video-id=["']([A-Za-z0-9_-]+)["']/i)?.[1] || '';
}

function validate(file, records, { force = false } = {}) {
  const rel = relative(file);
  const slug = slugFor(file);
  const creation = createdAt(file);
  const contracted = force || creation >= CONTRACT_START;
  if (!contracted) return { rel, slug, creation, contracted: false, errors: [] };

  const html = fs.readFileSync(file, 'utf8');
  const expectedUrl = `${CANONICAL_ORIGIN}/blog/${slug}`;
  const canonical = canonicalFrom(html);
  const videoId = videoIdFrom(html);
  const record = records.find((item) => item?.slug === slug) || null;
  const errors = [];

  if (!html.includes(STRICT_MARKER)) errors.push(`missing ${STRICT_MARKER}`);
  if (!html.includes(VIDEO_START) || !html.includes(VIDEO_END)) errors.push('missing final IZEM video block');
  if (!videoId) errors.push('video block is missing data-video-id');
  if (canonical !== expectedUrl) errors.push(`canonical must be ${expectedUrl}; found ${canonical || '(missing)'}`);

  if (!record) {
    errors.push('no dedicated article video record exists for this slug');
  } else {
    const recordVideoId = youtubeId(String(record.youtube || ''));
    if (record.url !== expectedUrl) errors.push(`video record canonical does not match article: ${record.url || '(missing)'}`);
    if (!recordVideoId) errors.push('video record has no parseable YouTube id');
    else if (videoId && recordVideoId !== videoId) errors.push(`article video ${videoId} does not match dedicated record ${recordVideoId}`);
    if (record.visual_policy !== 'objects-only-v1') errors.push('video record is missing objects-only-v1 validation');
    if (record.people_free_validated !== true) errors.push('video record is not marked people_free_validated=true');
  }

  return { rel, slug, creation, contracted: true, errors };
}

function formatDate(value) {
  return new Date(value).toISOString();
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const records = progressRecords();

  if (args.file) {
    const result = validate(resolveInsideRoot(args.file), records, { force: true });
    if (result.errors.length) {
      console.error(`Article video contract failed for ${result.rel}:`);
      for (const issue of result.errors) console.error(`- ${issue}`);
      process.exitCode = 1;
      return;
    }
    console.log(`Article video contract passed for ${result.rel}.`);
    return;
  }

  const results = topLevelBlogFiles().map((file) => validate(file, records)).filter((result) => result.contracted);
  const pending = results.filter((result) => result.errors.length).sort((a, b) => b.creation - a.creation);

  if (args.findPending) {
    if (!pending.length) return;
    const target = pending[0];
    console.error(`Recovery target ${target.slug} (${formatDate(target.creation)}): ${target.errors.join('; ')}`);
    process.stdout.write(target.slug);
    return;
  }

  if (pending.length) {
    console.error(`Dedicated article video contract failed for ${pending.length} post(s).`);
    for (const item of pending) {
      console.error(`- ${item.rel} (created ${formatDate(item.creation)})`);
      for (const issue of item.errors) console.error(`  - ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Dedicated article video contract passed for ${results.length} post(s) created on or after 2026-10-05.`);
}

main();
