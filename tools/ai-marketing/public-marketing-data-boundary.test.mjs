import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

test('private marketing records cannot be regenerated under public/marketing-data', () => {
  const pathsSource = read('packages/core/src/paths.ts');
  assert.doesNotMatch(pathsSource, /public["']?\s*,\s*["']marketing-data/i);
  assert.match(pathsSource, /publicDataDir:\s*path\.join\(repoRoot,\s*['"]data['"],\s*['"]marketing-employee['"]\)/);
  assert.equal(fs.existsSync(path.join(ROOT, 'public', 'marketing-data')), false);
});

test('production app does not expose the internal marketing dashboard route', () => {
  const appSource = read('src/App.tsx');
  assert.doesNotMatch(appSource, /MarketingDashboard/);
  assert.doesNotMatch(appSource, /marketing-dashboard/);
  assert.doesNotMatch(appSource, /marketing-data\/index\.json/);
});
