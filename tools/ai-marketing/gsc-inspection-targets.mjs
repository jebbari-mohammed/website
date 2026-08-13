#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const SITE = process.env.GSC_SITE_URL || 'https://youraicoach.life/';
const SITE_ORIGIN = new URL(SITE).origin;
const EXPERIMENT_DIR = path.resolve(process.env.SEO_EXPERIMENT_DIR || 'docs/seo-experiments');
const MAX_RECENT_EXPERIMENT_URLS = 12;
const MAX_INSPECTION_URLS = 25;

const CORE_URLS = [
  'https://youraicoach.life/',
  'https://youraicoach.life/ai-fitness-coach',
  'https://youraicoach.life/izem-ai-fitness-coach/',
  'https://youraicoach.life/best-ai-fitness-app',
  'https://youraicoach.life/workout-consistency-calculator',
  'https://youraicoach.life/blog/accountability-apps-for-working-out',
  'https://youraicoach.life/blog/gym-machines-vs-free-weights',
  'https://youraicoach.life/blog/strength-training-after-40-guide',
];

function normalizeUrl(value) {
  const url = new URL(value, SITE);
  if (url.origin !== SITE_ORIGIN) {
    throw new Error(`Inspection target is outside the Search Console property: ${url.origin}`);
  }
  url.hash = '';
  return url.href;
}

function setOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return Promise.resolve();
  return fs.appendFile(process.env.GITHUB_OUTPUT, `${name}=${String(value).replace(/\r?\n/g, ' ')}\n`);
}

async function recentExperimentTargets(limit = MAX_RECENT_EXPERIMENT_URLS) {
  let entries;
  try {
    entries = await fs.readdir(EXPERIMENT_DIR, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }

  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a));

  const targets = [];
  for (const file of files) {
    if (targets.length >= limit) break;
    const body = await fs.readFile(path.join(EXPERIMENT_DIR, file), 'utf8');
    const status = body.match(/^\s*-\s*\*\*Status:\*\*\s*(.+?)\s*$/im)?.[1]?.trim().toLowerCase();
    if (status && !['launched', 'active', 'running'].includes(status)) continue;

    const rawTarget = body.match(/^\s*-\s*\*\*Target URL:\*\*\s*(https?:\/\/\S+)\s*$/im)?.[1];
    if (!rawTarget) continue;

    try {
      targets.push({ file, url: normalizeUrl(rawTarget) });
    } catch (error) {
      console.warn(`Skipping invalid experiment target in ${file}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return targets;
}

export async function buildInspectionTargets() {
  const coreUrls = [...new Set(CORE_URLS.map(normalizeUrl))];
  const experimentTargets = await recentExperimentTargets();
  const urls = [...new Set([...coreUrls, ...experimentTargets.map((item) => item.url)])];

  if (urls.length === 0) throw new Error('No Search Console inspection targets were generated');
  if (urls.length > MAX_INSPECTION_URLS) {
    throw new Error(`Generated ${urls.length} inspection targets, above the intentional cap of ${MAX_INSPECTION_URLS}`);
  }

  return { urls, coreUrls, experimentTargets };
}

async function main() {
  const { urls, coreUrls, experimentTargets } = await buildInspectionTargets();

  await setOutput('urls', urls.join(','));
  await setOutput('url_count', urls.length);
  await setOutput('core_count', coreUrls.length);
  await setOutput('experiment_count', experimentTargets.length);

  console.log(`Adaptive GSC inspection set: ${urls.length} URL(s); ${coreUrls.length} core; ${experimentTargets.length} recent experiment target(s).`);
  for (const item of experimentTargets) {
    console.log(`- recent experiment: ${new URL(item.url).pathname} (${item.file})`);
  }
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((error) => {
    console.error(`Failed to build GSC inspection targets: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
