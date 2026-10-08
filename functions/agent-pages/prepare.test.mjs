import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { homepageMarkdown, prepareAgentHosting } from './prepare.mjs';

test('Firebase isolates the public handler and pins it to the matching Hosting artifact', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const config = JSON.parse(readFileSync(path.join(root, 'firebase.json'), 'utf8'));
  assert.equal(config.functions.length, 1);
  assert.equal(config.functions[0].codebase, 'agent-pages');
  assert.equal(config.functions[0].source, 'functions/agent-pages');
  assert.equal(config.functions[0].runtime, 'nodejs22');
  assert.ok(!config.functions[0].ignore.includes('bundle'));
  assert.equal(config.hosting.public, 'dist-agent-hosting');
  assert.deepEqual(config.hosting.predeploy, ['node functions/agent-pages/prepare.mjs']);
  assert.equal(config.hosting.cleanUrls, true);
  assert.deepEqual(config.hosting.rewrites, [{ source: '**', function: { functionId: 'agentPages', region: 'us-central1', pinTag: true } }]);
  for (const resource of ['/index.md', '/llms.txt']) {
    const rule = config.hosting.headers.find(entry => entry.source === resource);
    assert.equal(rule.headers.find(header => header.key === 'Content-Type')?.value, 'text/markdown; charset=utf-8');
  }
});

const html = `<!doctype html><html lang="en"><head><title>IZEM. Your AI Personal Trainer</title><link rel="canonical" href="https://youraicoach.life/"><style>.x{color:red}</style></head><body><nav>Navigation noise</nav><main><h1>IZEM. Your AI Personal Trainer</h1><p>Existing factual product copy stays the same for agents and people, including limitations and availability.</p><h2>Workouts</h2><ul><li>Workout plans</li><li>Training logs</li></ul><a href="/support.html">Customer support</a><script>secretCode()</script><span hidden>Invisible copy</span><svg><text>Icon noise</text></svg></main><footer>Footer navigation</footer></body></html>`;

test('Markdown derives real page content, headings, lists and absolute links without executable/layout noise', () => {
  const markdown = homepageMarkdown(html);
  assert.match(markdown, /^# IZEM\. Your AI Personal Trainer/);
  assert.match(markdown, /## Workouts/);
  assert.match(markdown, /-\s+Workout plans/);
  assert.match(markdown, /Existing factual product copy stays the same/);
  assert.match(markdown, /\[Customer support\]\(https:\/\/youraicoach.life\/support.html\)/);
  assert.match(markdown, /\[Agent guide\]/);
  assert.doesNotMatch(markdown, /secretCode|Navigation noise|Invisible copy|Icon noise|Footer navigation|<script|color:red/);
  assert.throws(() => homepageMarkdown('<html><body>Missing homepage</body></html>'), /real built homepage/);
});

test('staging removes the static homepage shadow while preserving exact HTML, fallback, assets and security headers', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'izem-agent-build-'));
  try {
    mkdirSync(path.join(root, 'dist/.well-known'), { recursive: true });
    writeFileSync(path.join(root, 'dist/index.html'), html);
    writeFileSync(path.join(root, 'dist/404.html'), '<html>Original 404</html>');
    writeFileSync(path.join(root, 'dist/.well-known/assetlinks.json'), '[]');
    writeFileSync(path.join(root, 'dist/app.js'), 'original code');
    writeFileSync(path.join(root, 'firebase.json'), JSON.stringify({ hosting: { headers: [{ source: '**', headers: [{ key: 'X-Frame-Options', value: 'DENY' }] }] } }));
    prepareAgentHosting(root);
    assert.equal(readFileSync(path.join(root, 'dist/index.html'), 'utf8'), html);
    assert.equal(readFileSync(path.join(root, 'functions/agent-pages/bundle/index.html'), 'utf8'), html);
    assert.equal(readFileSync(path.join(root, 'functions/agent-pages/bundle/404.html'), 'utf8'), '<html>Original 404</html>');
    assert.equal(existsSync(path.join(root, 'dist-agent-hosting/index.html')), false);
    assert.equal(readFileSync(path.join(root, 'dist-agent-hosting/app.js'), 'utf8'), 'original code');
    assert.equal(readFileSync(path.join(root, 'dist-agent-hosting/.well-known/assetlinks.json'), 'utf8'), '[]');
    assert.deepEqual(JSON.parse(readFileSync(path.join(root, 'functions/agent-pages/bundle/headers.json'))), { 'X-Frame-Options': 'DENY' });
    assert.equal(readFileSync(path.join(root, 'dist-agent-hosting/index.md'), 'utf8'), homepageMarkdown(html));
    prepareAgentHosting(root);
    assert.equal(existsSync(path.join(root, 'dist-agent-hosting/index.html')), false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
