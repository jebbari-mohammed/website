import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { encryptState, decryptState, restoreState, saveState, MAX_FILE_BYTES } from './seo-private-state-cache.mjs';

const repository = 'fixture/seo-security';
const key = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({ type: 'pkcs8', format: 'pem' });
const otherKey = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({ type: 'pkcs8', format: 'pem' });
const privateText = 'PRIVATE QUERY AND BASELINE FIXTURE';
const files = {
  'publish-state-v2.json': { version: 2, actions: { fixture: { at: '2026-10-08', queryHash: privateText } } },
  'experiments-v2.json': { version: 2, experiments: [{ baseline: { query: privateText, impressions: 1234 } }] },
};
const rejected = /Private SEO state cache rejected; publication must remain stopped\./;
function fixture(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'izem-private-state-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { root, cacheFile: path.join(root, 'ciphertext/envelope.json'), stateDir: path.join(root, 'state'), privateKey: key, repository };
}
function putCache(f, envelope) {
  fs.mkdirSync(path.dirname(f.cacheFile), { recursive: true });
  fs.writeFileSync(f.cacheFile, JSON.stringify(envelope));
}

test('synthetic private cooldown and experiment files round-trip only in ciphertext', () => {
  const a = encryptState(files, key, repository);
  const b = encryptState(files, key, repository);
  assert.notEqual(a.ciphertext, b.ciphertext);
  assert.doesNotMatch(JSON.stringify(a), /PRIVATE QUERY|impressions|publish-state|experiments-v2/);
  assert.deepEqual(decryptState(a, key, repository), files);
  assert.throws(() => decryptState(a, key, 'fixture/other-repository'), rejected);
});

test('tampering and credential rotation stop before any plaintext or publication', t => {
  const f = fixture(t);
  const original = encryptState(files, key, repository);
  for (const field of ['salt', 'iv', 'tag', 'ciphertext']) {
    const value = Buffer.from(original[field], 'base64');
    value[0] ^= 1;
    putCache(f, { ...original, [field]: value.toString('base64') });
    assert.throws(() => restoreState(f), rejected);
    assert.equal(fs.existsSync(f.stateDir), false);
  }
  putCache(f, original);
  assert.throws(() => restoreState({ ...f, privateKey: otherKey }), rejected);
  assert.equal(fs.existsSync(f.stateDir), false);
});

test('unapproved paths, schemas, oversized files and malformed envelopes are rejected', () => {
  for (const name of ['../outside.json', '/tmp/outside.json', 'private-query.json', '__proto__']) {
    assert.throws(() => encryptState(JSON.parse(`{"${name}":{"version":2}}`), key, repository), rejected);
  }
  assert.throws(() => encryptState({ 'publish-state-v2.json': { version: 1 } }, key, repository), rejected);
  assert.throws(() => encryptState({ ...files, 'publish-state-v2.json': { version: 2, actions: {}, text: 'x'.repeat(MAX_FILE_BYTES) } }, key, repository), rejected);
  assert.throws(() => encryptState({ 'publish-state-v2.json': files['publish-state-v2.json'] }, key, repository), rejected);
  const a = encryptState(files, key, repository);
  for (const bad of [{ ...a, version: 2 }, { ...a, algorithm: 'plain' }, { ...a, tag: 'bad' }, { ...a, ciphertext: '!' }]) {
    assert.throws(() => decryptState(bad, key, repository), rejected);
  }
});

test('restore gives plaintext directory 0700 and approved files 0600', t => {
  const f = fixture(t);
  putCache(f, encryptState(files, key, repository));
  assert.deepEqual(restoreState(f), { mode: 'restored', fileCount: 2 });
  assert.equal(fs.statSync(f.stateDir).mode & 0o777, 0o700);
  for (const [name, value] of Object.entries(files)) {
    assert.equal(fs.statSync(path.join(f.stateDir, name)).mode & 0o777, 0o600);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(f.stateDir, name), 'utf8')), value);
  }
});

test('save includes only the two approved state files and restricts ciphertext permissions', t => {
  const f = fixture(t);
  fs.mkdirSync(f.stateDir);
  for (const [name, value] of Object.entries(files)) fs.writeFileSync(path.join(f.stateDir, name), JSON.stringify(value));
  fs.writeFileSync(path.join(f.stateDir, 'latest-28d.json'), privateText);
  assert.deepEqual(saveState(f), { mode: 'encrypted', fileCount: 2 });
  const raw = fs.readFileSync(f.cacheFile, 'utf8');
  assert.doesNotMatch(raw, /PRIVATE QUERY|latest-28d/);
  assert.deepEqual(decryptState(JSON.parse(raw), key, repository), files);
  assert.equal(fs.statSync(f.cacheFile).mode & 0o777, 0o600);
});

test('symlinked cache, state directory or approved files cannot escape the state boundary', t => {
  const f = fixture(t);
  const outside = path.join(f.root, 'outside');
  fs.mkdirSync(outside);
  fs.symlinkSync(outside, f.stateDir);
  assert.throws(() => restoreState(f), rejected);
  assert.throws(() => saveState(f), rejected);
  fs.unlinkSync(f.stateDir);
  fs.mkdirSync(f.stateDir);
  const target = path.join(outside, 'state.json');
  fs.writeFileSync(target, JSON.stringify(files['publish-state-v2.json']));
  fs.symlinkSync(target, path.join(f.stateDir, 'publish-state-v2.json'));
  assert.throws(() => saveState(f), rejected);
  putCache(f, encryptState(files, key, repository));
  assert.throws(() => restoreState(f), rejected);
  assert.equal(fs.readFileSync(target, 'utf8'), JSON.stringify(files['publish-state-v2.json']));
  fs.unlinkSync(f.cacheFile);
  fs.symlinkSync(target, f.cacheFile);
  assert.throws(() => restoreState(f), rejected);
});

test('missing history stops publication, permitting only dry validation with source markers', t => {
  const f = fixture(t);
  assert.throws(() => restoreState(f), /Private SEO state history is missing; run dry_run=true/);
  assert.deepEqual(restoreState({ ...f, dryRun: true }), { mode: 'bootstrap-dry-run', fileCount: 0 });
  assert.throws(() => restoreState({ ...f, dryRun: true, force: true }), /Private SEO state history is missing/);
  assert.equal(fs.existsSync(f.stateDir), false);
});

test('CLI missing history fails before a simulated publication and prints only an actionable message', t => {
  const f = fixture(t);
  const helper = fileURLToPath(new URL('./seo-private-state-cache.mjs', import.meta.url));
  const sentinel = path.join(f.root, 'publication');
  const script = `"${process.execPath}" "${helper}" restore && printf published > "${sentinel}"`;
  const credential = JSON.stringify({ type: 'service_account', client_email: 'fixture@example.invalid', private_key: key });
  const result = spawnSync('bash', ['-e', '-c', script], {
    cwd: f.root,
    env: { PATH: process.env.PATH, SEO_PRIVATE_CACHE_FILE: f.cacheFile, GITHUB_REPOSITORY: repository,
      GOOGLE_SERVICE_ACCOUNT_JSON: credential, DRY_RUN: 'false', FORCE_RUN: 'false' },
    encoding: 'utf8', timeout: 5000,
  });
  assert.notEqual(result.status, 0);
  assert.equal(fs.existsSync(sentinel), false);
  assert.match(result.stderr, /Private SEO state history is missing; run dry_run=true/);
  assert.doesNotMatch(result.stderr + result.stdout, /BEGIN PRIVATE KEY|fixture@example|Error:|stack|private_key/);
});
