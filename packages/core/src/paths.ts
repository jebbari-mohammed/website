import path from 'node:path';
import { fileURLToPath } from 'node:url';

const thisFile = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(thisFile), '../../..');

export const paths = {
  repoRoot,
  config: path.join(repoRoot, 'config', 'autonomy.policy.json'),
  dataDir: path.join(repoRoot, 'data', 'marketing-employee'),
  publicDataDir: path.join(repoRoot, 'data', 'marketing-employee'),
  docsDir: path.join(repoRoot, 'docs'),
};