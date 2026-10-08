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
const { checkFiltersIntegrity } = require('./lib/deploy/functions/validate.js');
const backend = require('./lib/deploy/functions/backend.js');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(path.join(root, 'firebase.json'), 'utf8'));
const workflow = readFileSync(path.join(root, '.github/workflows/deploy.yml'), 'utf8');
const selectors = [...workflow.matchAll(/firebase deploy --only (\S+)/g)].map(match => match[1]);

const want = { 'agent-pages': backend.of({ id: 'agentPages', codebase: 'agent-pages', region: 'us-central1', project: 'demo-izem-agent-readiness' }) };

test('both credential paths bootstrap the exact function before the pinned Hosting release', () => {
  assert.deepEqual(selectors, [
    'functions:agent-pages:agentPages', 'hosting,functions:agent-pages:agentPages',
    'functions:agent-pages:agentPages', 'hosting,functions:agent-pages:agentPages',
  ]);
});

test('the pinned CLI selects the isolated codebase on first and later releases', () => {
  for (const selector of selectors) {
    // A function-only command has no Hosting pinTag expansion. The following
    // combined release sees the endpoint created by the successful bootstrap.
      const only = selector.startsWith('hosting,')
        ? ensureTargeted(selector, 'agent-pages', 'agentPages')
        : selector;
      const filters = getEndpointFilters({ only }, config.functions);
      assert.doesNotThrow(() => checkFiltersIntegrity(want, filters));
      assert.deepEqual(targetCodebases(config.functions, filters), ['agent-pages']);
      assert.equal(endpointMatchesAnyFilter({ id: 'agentPages', codebase: 'agent-pages' }, filters), true);
      assert.equal(endpointMatchesAnyFilter({ id: 'sendEmail', codebase: 'default' }, filters), false);
      assert.equal(endpointMatchesAnyFilter({ id: 'appApi', codebase: 'app' }, filters), false);
      assert.equal(endpointMatchesAnyFilter({ id: 'otherPage', codebase: 'agent-pages' }, filters), false);
  }
});

test('the regression fixture reproduces the rejected first Hosting-only release', () => {
  const only = ensureTargeted('hosting', 'agentPages');
  const filters = getEndpointFilters({ only }, config.functions);
  assert.deepEqual(targetCodebases(config.functions, filters), []);
  assert.throws(() => checkFiltersIntegrity(want, filters), /No function matches the filter: default:agentPages/);
});

test('the actual CLI rejects first-release combined pinTag expansion without bootstrap', () => {
  const only = ensureTargeted('hosting,functions:agent-pages:agentPages', 'agentPages');
  const filters = getEndpointFilters({ only }, config.functions);
  assert.throws(() => checkFiltersIntegrity(want, filters), /No function matches the filter: default:agentPages/);
});
