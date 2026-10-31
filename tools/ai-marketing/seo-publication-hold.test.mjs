import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { assertSeoPublicationAllowed, readSeoPublicationHold } from './seo-publication-hold.mjs';
import { applyInternalLinkAction } from './cold-start-growth.mjs';
import { persistCheckpoint, claimNativeAttempt, generateNarrationFallback } from './article-video-fallback.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const HOLD = { active: true, startedAt: '2026-10-31', reviewAfter: '2000-01-01', manualReleaseRequired: true, reason: 'Fixture investigation.' };

function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'izem-publication-hold-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'config'), { recursive: true });
  fs.mkdirSync(path.join(root, 'tools/ai-marketing'), { recursive: true });
  fs.writeFileSync(path.join(root, 'config/seo-publication-hold.json'), JSON.stringify(HOLD));
  copy(root, 'tools/ai-marketing/seo-publication-hold.mjs');
  return root;
}

function copy(root, file) {
  const output = path.join(root, file);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.copyFileSync(path.join(ROOT, file), output);
}

function snapshot(root) {
  const files = {};
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile()) files[path.relative(root, file)] = fs.readFileSync(file).toString('base64');
    }
  }
  walk(root);
  return files;
}

function run(root, script, args = []) {
  const result = spawnSync(process.execPath, [path.join(root, script), ...args], {
    cwd: root, encoding: 'utf8', timeout: 20000,
    env: { ...process.env, GITHUB_OUTPUT: '', GEMINI_API_KEY: '', GEMINI_API_KEY_2: '', GEMINI_API_KEY_3: '' },
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

test('an active hold never expires merely because its review date passed', (t) => {
  const root = fixture(t);
  assert.equal(readSeoPublicationHold(root).active, true);
  assert.throws(() => assertSeoPublicationAllowed({ root }), { code: 'SEO_PUBLICATION_HELD' });
  assert.doesNotThrow(() => assertSeoPublicationAllowed({ root, dryRun: true }));
  fs.writeFileSync(path.join(root, 'config/seo-publication-hold.json'), '{"active":false}');
  assert.doesNotThrow(() => assertSeoPublicationAllowed({ root }));
});

test('invalid hold configuration fails closed; unrelated fixtures without a hold remain usable', (t) => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'config/seo-publication-hold.json'), '{"active":"false"}');
  assert.throws(() => assertSeoPublicationAllowed({ root }), /active must be a boolean/);
  fs.unlinkSync(path.join(root, 'config/seo-publication-hold.json'));
  assert.doesNotThrow(() => assertSeoPublicationAllowed({ root }));
});

test('held scheduled promotion leaves drafts, schedule, and architecture releases untouched; list and dry-run work', (t) => {
  const root = fixture(t);
  copy(root, 'tools/publish-scheduled-blog.mjs');
  fs.mkdirSync(path.join(root, 'public/blog/drafts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'public/blog/drafts/example.html'), '<h1>Draft fixture</h1>');
  fs.writeFileSync(path.join(root, 'tools/ai-marketing/blog-media-policy.mjs'), '// Fixture validator: read-only.\n');
  fs.writeFileSync(path.join(root, 'config/seo-scheduled-blogs.json'), JSON.stringify({
    architectureReleases: [{ release: 1, scheduledDate: '2000-01-01', status: 'scheduled', branch: 'must-not-checkout', files: ['must-not-write.html'], title: 'Fixture' }],
    schedule: [{ order: 1, scheduledDate: '2000-01-01', status: 'scheduled', slug: 'example', keyword: 'fixture', draftPath: 'public/blog/drafts/example.html', livePath: 'public/blog/example.html' }],
  }));
  const before = snapshot(root);
  for (const args of [['--next-due'], ['--slug', 'example']]) {
    assert.match(run(root, 'tools/publish-scheduled-blog.mjs', args), /SEO publication hold active/);
    assert.deepEqual(snapshot(root), before);
  }
  assert.match(run(root, 'tools/publish-scheduled-blog.mjs', ['--list']), /example/);
  assert.match(run(root, 'tools/publish-scheduled-blog.mjs', ['--next-due', '--dry-run']), /DRY RUN.*Validated example/);
  assert.deepEqual(snapshot(root), before);
});

test('direct internal-link mutation is blocked while dry-run still identifies proposed files', async (t) => {
  const root = fixture(t);
  const file = path.join(root, 'public/blog/source.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const html = '<main><p>Original fixture.</p></main>';
  fs.writeFileSync(file, html);
  const action = { type: 'internal-links', marker: 'fixture', target: { canonical: 'https://youraicoach.life/blog/target', title: 'Target' }, sources: [{ file, relative: 'blog/source.html' }] };
  await assert.rejects(applyInternalLinkAction(action), { code: 'SEO_PUBLICATION_HELD' });
  assert.deepEqual(await applyInternalLinkAction(action, { dryRun: true }), [file]);
  assert.equal(fs.readFileSync(file, 'utf8'), html);
});

test('video spending and checkpoint APIs block before provider calls or writes', async (t) => {
  const root = fixture(t);
  const before = snapshot(root);
  assert.throws(() => persistCheckpoint(root, path.join(root, 'attempt.json'), {}), { code: 'SEO_PUBLICATION_HELD' });
  assert.throws(() => claimNativeAttempt(root, {}), { code: 'SEO_PUBLICATION_HELD' });
  await assert.rejects(generateNarrationFallback(root, {}, { speech() { throw new Error('Provider must never run'); } }), { code: 'SEO_PUBLICATION_HELD' });
  assert.deepEqual(snapshot(root), before);
});

test('held article and video CLIs stop before credentials, generation, or publication', (t) => {
  const root = fixture(t);
  for (const file of [
    'daily-blog.mjs', 'generate-blog.mjs', 'bulk-blog.mjs', 'translate-blog.mjs',
    'generate-og-images.mjs', 'generate-object-blog-visuals.mjs', 'daily-notebooklm-video.mjs',
    'notebooklm-recovery-diagnostic.mjs',
  ]) copy(root, `tools/ai-marketing/${file}`);
  const before = snapshot(root);
  for (const [script, args] of [
    ['daily-blog.mjs', []], ['generate-blog.mjs', ['fixture topic']], ['bulk-blog.mjs', []],
    ['translate-blog.mjs', []], ['generate-og-images.mjs', []],
    ['generate-object-blog-visuals.mjs', ['--slug', 'must-not-read']],
    ['daily-notebooklm-video.mjs', []],
  ]) assert.match(run(root, `tools/ai-marketing/${script}`, args), /SEO publication hold active/);
  assert.deepEqual(snapshot(root), before);
});

test('production runner skips held writes but dry-run reaches a read-only zero-row plan', (t) => {
  const root = fixture(t);
  fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(root, 'node_modules'), 'dir');
  for (const file of ['seo-production.mjs', 'seo-production-runner.mjs', 'seo-publisher-core.mjs', 'workflow-output-safety.mjs', 'gemini-grounded-research.mjs', 'model-json.mjs']) copy(root, `tools/ai-marketing/${file}`);
  const plan = path.join(root, 'plan.json');
  fs.writeFileSync(plan, JSON.stringify({ summary: { gscRows: 0 }, opportunities: [], source: { gscReport: 'fixture.json', dimensions: ['query', 'page'] } }));
  const before = snapshot(root);
  assert.match(run(root, 'tools/ai-marketing/seo-production-runner.mjs', ['--plan', 'missing.json']), /SEO publication hold active/);
  assert.match(run(root, 'tools/ai-marketing/seo-production.mjs', ['--plan', 'missing.json']), /SEO publication hold active/);
  assert.match(run(root, 'tools/ai-marketing/seo-production-runner.mjs', ['--plan', plan, '--dry-run']), /no evidence-backed action selected/);
  assert.deepEqual(snapshot(root), before);
});
