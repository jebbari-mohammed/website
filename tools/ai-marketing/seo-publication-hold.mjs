import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CONFIG = 'config/seo-publication-hold.json';

export function readSeoPublicationHold(root = ROOT) {
  let hold;
  try {
    hold = JSON.parse(fs.readFileSync(path.join(root, CONFIG), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return { active: false };
    throw new Error(`Cannot verify the SEO publication hold: ${error.message}`);
  }
  if (!hold || typeof hold.active !== 'boolean') {
    throw new Error('Cannot verify the SEO publication hold: active must be a boolean.');
  }
  // reviewAfter is a reminder, never permission to resume publication.
  return hold;
}

export function seoPublicationHoldMessage(hold) {
  return `SEO publication hold active: ${hold.reason || 'Automated content changes are paused.'} Manual release is required${hold.reviewAfter ? `; review after ${hold.reviewAfter}` : ''}.`;
}

export function skipHeldSeoPublication({ root = ROOT, dryRun = false, log = console.log } = {}) {
  const hold = readSeoPublicationHold(root);
  if (!hold.active || dryRun) return false;
  log(seoPublicationHoldMessage(hold));
  return true;
}

export function assertSeoPublicationAllowed({ root = ROOT, dryRun = false } = {}) {
  const hold = readSeoPublicationHold(root);
  if (hold.active && !dryRun) {
    const error = new Error(seoPublicationHoldMessage(hold));
    error.code = 'SEO_PUBLICATION_HELD';
    throw error;
  }
}

// Mutation APIs can receive temporary fixture files or real repository files.
// Resolve each source's owning hold rather than trusting a caller's cwd.
export function assertSeoFileMutationAllowed(files, { dryRun = false } = {}) {
  for (const file of files) {
    let directory = path.dirname(path.resolve(file));
    while (true) {
      if (fs.existsSync(path.join(directory, CONFIG))) {
        assertSeoPublicationAllowed({ root: directory, dryRun });
        break;
      }
      const parent = path.dirname(directory);
      if (parent === directory) break;
      directory = parent;
    }
  }
}
