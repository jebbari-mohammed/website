import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORKFLOWS = path.join(ROOT, '.github/workflows');
const pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/workflow-action-pins.json'), 'utf8'));

function steps(file) {
  const text = fs.readFileSync(path.join(WORKFLOWS, file), 'utf8');
  return [...text.matchAll(/^      - (?:name: ([^\n]+)|(?:uses|run):[^\n]+)[\s\S]*?(?=^      - |^  [a-z][a-z-]+:|$(?![\s\S]))/gm)]
    .map(match => ({ name: match[1] || '', source: match[0] }));
}

function namedStep(file, name) {
  const found = steps(file).find(step => step.name === name);
  assert.ok(found, `${file}: missing step ${name}`);
  return found;
}

function shell(step) {
  const source = step.source.match(/^        run: \|\n([\s\S]*)/m)?.[1];
  assert.ok(source, `Expected a multiline shell step: ${step.name}`);
  const lines = [];
  for (const line of source.split('\n')) {
    if (line && !line.startsWith('          ')) break;
    lines.push(line.slice(10));
  }
  return lines.join('\n');
}

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'izem-workflow-security-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const bin = path.join(root, 'bin');
  fs.mkdirSync(bin);
  const capture = path.join(root, 'arguments.jsonl');
  const stub = `#!${process.execPath}\nconst fs = require('node:fs');\nconst args = process.argv.slice(2);\nfs.appendFileSync(process.env.CAPTURE_FILE, JSON.stringify({command: require('node:path').basename(process.argv[1]), args}) + '\\n');\nif (args[0] === 'diff' && args.includes('--quiet')) process.exit(1);\nif (args[0] === 'rev-parse') console.log('0123456789012345678901234567890123456789');\n`;
  for (const name of ['git', 'node']) fs.writeFileSync(path.join(bin, name), stub, { mode: 0o700 });
  const execute = (script, env) => spawnSync('bash', ['-e', '-o', 'pipefail', '-c', script], {
    cwd: root,
    env: { PATH: `${bin}${path.delimiter}${process.env.PATH}`, CAPTURE_FILE: capture, ...env },
    encoding: 'utf8',
    timeout: 5000,
  });
  const calls = () => fs.existsSync(capture)
    ? fs.readFileSync(capture, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line)) : [];
  return { root, execute, calls };
}

test('workflow shell source never interpolates a GitHub expression', () => {
  for (const file of fs.readdirSync(WORKFLOWS).filter(file => file.endsWith('.yml'))) {
    for (const step of steps(file)) {
      const run = step.source.match(/^        run: \|/m) ? shell(step)
        : step.source.match(/^        run: ([^\n]*)/m)?.[1]
        || step.source.match(/^      - run: ([^\n]+)/m)?.[1];
      if (run) assert.doesNotMatch(run, /\$\{\{/, `${file}: ${step.name}`);
    }
  }
});

test('workflow expressions outside shell keep GitHub condition scope', () => {
  for (const file of fs.readdirSync(WORKFLOWS).filter(file => file.endsWith('.yml'))) {
    const source = fs.readFileSync(path.join(WORKFLOWS, file), 'utf8');
    for (const line of source.split('\n').filter(line => /^\s*(if|ref|group|needs|outputs|name):/.test(line))) {
      assert.doesNotMatch(line, /\$\{(?!\{)/, `${file}: shell variable outside run block`);
    }
  }
  const validation = fs.readFileSync(path.join(WORKFLOWS, 'seo-growth-engine-ci.yml'), 'utf8');
  assert.match(validation, /credentialed-smoke:[\s\S]*?    if: \$\{\{ github\.event_name == 'workflow_dispatch' \}\}/);
  assert.match(validation, /lockfile:[\s\S]*?    if: \$\{\{ github\.event_name == 'pull_request' && github\.event\.pull_request\.head\.repo\.full_name == github\.repository \}\}/);
  assert.doesNotMatch(validation, /CONTEXT_GITHUB_EVENT_NAME_(?:WORKFLOW_DISPATCH|PULL_REQUEST)/);
  for (const file of ['agent-readiness.yml', 'deploy.yml', 'seo-growth-engine-ci.yml']) {
    assert.match(fs.readFileSync(path.join(WORKFLOWS, file), 'utf8'), /run: pnpm test:security/);
  }
});

test('all action references use the reviewed upstream commit and pnpm version', () => {
  const approved = new Map(pins.pins.map(pin => [pin.repository, pin.commit]));
  for (const file of fs.readdirSync(WORKFLOWS).filter(file => file.endsWith('.yml'))) {
    const source = fs.readFileSync(path.join(WORKFLOWS, file), 'utf8');
    for (const match of source.matchAll(/uses: ([\w/-]+)@([^\s#]+)/g)) {
      assert.match(match[2], /^[a-f0-9]{40}$/, `${file}: mutable action reference`);
      assert.equal(match[2], approved.get(match[1]), `${file}: unreviewed action commit`);
    }
    assert.doesNotMatch(source, /--no-frozen-lockfile/);
    for (const step of steps(file).filter(step => step.source.includes('uses: pnpm/action-setup@'))) {
      assert.match(step.source, /version: 9\.15\.9(?:\n|$)/);
    }
  }
});

test('PR validation has a read-only token and no persisted checkout credential', () => {
  const validation = fs.readFileSync(path.join(WORKFLOWS, 'seo-growth-engine-ci.yml'), 'utf8');
  assert.match(validation, /permissions:\n  contents: read\n/);
  assert.doesNotMatch(validation, /contents: write/);
  for (const file of ['agent-readiness.yml', 'content-integrity.yml', 'seo-active-experiment-guard.yml', 'seo-growth-engine-ci.yml']) {
    for (const step of steps(file).filter(step => step.source.includes('uses: actions/checkout@'))) {
      assert.match(step.source, /persist-credentials: false/);
    }
  }
});

test('GSC and Gemini credentials are absent from jobs and dependency setup steps', () => {
  const secretName = '(?:GOOGLE_SERVICE_ACCOUNT_JSON|GOOGLE_CLOUD_JSON|GCP_SA_KEY|GOOGLE_APPLICATION_CREDENTIALS_JSON|GEMINI_API_KEY(?:_[23])?)';
  for (const file of ['daily-blog.yml', 'daily-cold-start-growth.yml', 'search-console-bootstrap.yml', 'seo-growth-engine-ci.yml']) {
    const source = fs.readFileSync(path.join(WORKFLOWS, file), 'utf8');
    assert.doesNotMatch(source, new RegExp(`^      ${secretName}:`, 'm'), `${file}: job-wide secret`);
    for (const step of steps(file).filter(step => /uses: |(?:pnpm install|pip install)/.test(step.source))) {
      assert.doesNotMatch(step.source, new RegExp(`^          ${secretName}:`, 'm'), `${file}: setup secret`);
    }
    assert.match(source, /name: Delete local plaintext Search Console and decision evidence\n        if: always\(\)/);
  }
  const cache = namedStep('daily-blog.yml', 'Restore encrypted experiment and cooldown state');
  assert.match(cache.source, /path: \$\{\{ runner\.temp \}\}\/seo-private-cache\/envelope\.json/);
  assert.doesNotMatch(cache.source, /data\/marketing-employee|publish-state-v2|experiments-v2/);
  assert.match(cache.source, /key: seo-production-private-v1-/);
  const publication = fs.readFileSync(path.join(WORKFLOWS, 'daily-blog.yml'), 'utf8');
  assert.ok(publication.indexOf('seo-private-state-cache.mjs restore') < publication.indexOf('seo-production-runner.mjs'));
  assert.ok(publication.indexOf('seo-private-state-cache.mjs save') < publication.indexOf('git commit'));
  const publisher = fs.readFileSync(path.join(ROOT, 'tools/ai-marketing/seo-production.mjs'), 'utf8');
  assert.match(publisher, /if \(!force && hasMarker\(fs\.readFileSync\(target, 'utf8'\), marker\)\) continue/);
  assert.match(publisher, /if \(fs\.existsSync\(createFileFor\(item\)\)\) continue/);
  const editor = namedStep('daily-blog.yml', 'Research, draft, critique, validate, and prepare the best action');
  assert.match(editor.source, /\[ "\$DRY_RUN" = "true" \] && args\+=\(--dry-run\)/);
  assert.match(namedStep('daily-blog.yml', 'Commit only public website files').source, /if: steps\.publish\.outputs\.changed == 'true'/);
});

test('malicious filenames are rejected before git, without executing substitutions', t => {
  const f = fixture(t);
  const proof = path.join(f.root, 'executed');
  const step = namedStep('daily-cold-start-growth.yml', 'Commit only the exact HTML files selected by the engine');
  assert.match(step.source, /GROWTH_FILES: \$\{\{ steps\.growth\.outputs\.files \}\}/);
  for (const files of [
    `public/blog/$(touch ${proof}).html`,
    `public/blog/\`touch ${proof}\`.html`,
    `public/blog/x.html"; touch ${proof}; #`,
    'public/blog/../../outside.html',
    'public/blog/valid.html\npublic/blog/another.html',
  ]) {
    const result = f.execute(shell(step), { GROWTH_FILES: files, GROWTH_TARGET_HASH: '0123456789ab' });
    assert.notEqual(result.status, 0, 'Unsafe path unexpectedly accepted');
    assert.equal(fs.existsSync(proof), false, 'Shell payload executed');
  }
  assert.deepEqual(f.calls(), [], 'Unsafe input reached git');
});

test('valid publication files stage explicitly and commit text remains data', t => {
  const f = fixture(t);
  const file = 'public/blog/valid-fixture.html';
  fs.mkdirSync(path.join(f.root, 'public/blog'), { recursive: true });
  fs.writeFileSync(path.join(f.root, file), '<h1>Fixture</h1>');
  const proof = path.join(f.root, 'executed');
  const message = `$(touch ${proof})`;
  const step = namedStep('daily-cold-start-growth.yml', 'Commit only the exact HTML files selected by the engine');
  const result = f.execute(shell(step), {
    GROWTH_FILES: file,
    GROWTH_TARGET_HASH: message,
    GITHUB_OUTPUT: path.join(f.root, 'outputs'),
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(proof), false);
  assert.ok(f.calls().some(call => JSON.stringify(call.args) === JSON.stringify(['add', '--', file])));
  assert.ok(f.calls().some(call => call.args[0] === 'commit' && call.args.includes(`seo: strengthen internal links ${message}`)));
});

test('malicious URL and marker values reach verification as literal arguments', t => {
  const f = fixture(t);
  const proof = path.join(f.root, 'executed');
  const url = `https://youraicoach.life/blog/$(touch ${proof})"; echo injection; #`;
  const marker = `\`touch ${proof}\`\n$(touch ${proof})`;
  for (const [file, name, env] of [
    ['daily-blog.yml', 'Verify an existing-page refresh reached the live site', { PUBLISH_URL: url, PUBLISH_MARKER: marker }],
    ['daily-cold-start-growth.yml', 'Verify the exact internal-link marker reached the live source page', { GROWTH_SOURCE_URL: url, GROWTH_MARKER: marker }],
  ]) {
    const result = f.execute(shell(namedStep(file, name)), env);
    assert.equal(result.status, 0, result.stderr);
    const last = f.calls().at(-1);
    assert.deepEqual(last.args, ['tools/ai-marketing/verify-live-seo.mjs', '--url', url, '--marker', marker]);
    assert.equal(fs.existsSync(proof), false);
  }
});

test('NotebookLM CI requires exact hashed wheels and compatible reviewed commands', () => {
  const workflow = fs.readFileSync(path.join(WORKFLOWS, 'daily-video-tts.yml'), 'utf8');
  assert.match(workflow, /pip install --require-hashes --only-binary=:all:/);
  assert.doesNotMatch(workflow, /pip install --upgrade pip|pip install "notebooklm-py"/);
  const lock = fs.readFileSync(path.join(ROOT, pins.notebooklm.lockfile), 'utf8');
  assert.match(lock, /notebooklm-py==0\.8\.4/);
  const requirements = lock.split('\n').filter(line => line && !line.startsWith('#') && !line.startsWith(' '));
  assert.equal(requirements.length, pins.notebooklm.wheelCount);
  assert.equal((lock.match(/--hash=sha256:[a-f0-9]{64}/g) || []).length, requirements.length);
  assert.ok(requirements.every(line => /^[\w-]+==[\w.]+ \\$/.test(line)));
  assert.ok(pins.notebooklm.compatibilityHelpChecks.every(check => check.exit === 0 && check.missingFlags.length === 0));
});
