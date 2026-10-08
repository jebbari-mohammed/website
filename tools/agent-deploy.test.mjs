import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

// Exercise the deployed Firebase CLI's real selector parser. Emulators do not
// run this deployment stage and cannot catch first-release pinTag failures.
assert.ok(process.env.FIREBASE_TOOLS_ROOT, 'Set FIREBASE_TOOLS_ROOT to the installed firebase-tools package directory.');
const require = createRequire(path.join(process.env.FIREBASE_TOOLS_ROOT, 'package.json'));
const { ensureTargeted } = require('./lib/functions/ensureTargeted.js');
const { getEndpointFilters, targetCodebases, endpointMatchesAnyFilter } = require('./lib/deploy/functions/functionsDeployHelper.js');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(path.join(root, 'firebase.json'), 'utf8'));
const workflow = readFileSync(path.join(root, '.github/workflows/deploy.yml'), 'utf8');
const selectors = [...workflow.matchAll(/firebase deploy --only (\S+)/g)].map(match => match[1]);

test('both credential paths explicitly scope Hosting and the public function', () => {
  assert.equal(selectors.length, 2);
  for (const selector of selectors) {
    assert.deepEqual(selector.split(','), ['hosting', 'functions:agent-pages:agentPages']);
  }
});

test('the pinned CLI selects the isolated codebase on first and later releases', () => {
  for (const selector of selectors) {
    for (const firstRelease of [true, false]) {
      // These are the CLI pinTag expansion paths before/after the endpoint exists.
      const only = firstRelease
        ? ensureTargeted(selector, 'agentPages')
        : ensureTargeted(selector, 'agent-pages', 'agentPages');
      const filters = getEndpointFilters({ only }, config.functions);
      assert.deepEqual(targetCodebases(config.functions, filters), ['agent-pages']);
      assert.equal(endpointMatchesAnyFilter({ id: 'agentPages', codebase: 'agent-pages' }, filters), true);
      assert.equal(endpointMatchesAnyFilter({ id: 'sendEmail', codebase: 'default' }, filters), false);
      assert.equal(endpointMatchesAnyFilter({ id: 'appApi', codebase: 'app' }, filters), false);
      assert.equal(endpointMatchesAnyFilter({ id: 'otherPage', codebase: 'agent-pages' }, filters), false);
    }
  }
});

test('the regression fixture reproduces the rejected first Hosting-only release', () => {
  const only = ensureTargeted('hosting', 'agentPages');
  const filters = getEndpointFilters({ only }, config.functions);
  assert.deepEqual(targetCodebases(config.functions, filters), []);
});
