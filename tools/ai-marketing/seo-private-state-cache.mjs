#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverCredentialSource, parseServiceAccountCredential } from './gsc-fetch-private.mjs';

export const STATE_FILES = Object.freeze(['publish-state-v2.json', 'experiments-v2.json']);
export const MAX_FILE_BYTES = 1024 * 1024;
export const MAX_STATE_BYTES = 2 * MAX_FILE_BYTES + 1024;
const MAX_ENVELOPE_BYTES = Math.ceil(MAX_STATE_BYTES * 4 / 3) + 2048;
const ALGORITHM = 'HKDF-SHA256+AES-256-GCM';
const FAILURE = 'Private SEO state cache rejected; publication must remain stopped.';
const MISSING_HISTORY = 'Private SEO state history is missing; run dry_run=true or arrange a trusted encrypted history migration before publication.';

class CacheError extends Error {}
function reject(message = FAILURE) { throw new CacheError(message); }
function sanitizeFailure(error) { if (error instanceof CacheError) throw error; reject(); }
function contextValue(repository) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository || '')) reject();
  return `izem:seo-production-cache:v1:${repository}:refs/heads/main`;
}
function validateFiles(files) {
  if (!files || typeof files !== 'object' || Array.isArray(files)) reject();
  const names = Object.keys(files);
  if (names.length !== STATE_FILES.length || names.some(name => !STATE_FILES.includes(name))) reject();
  for (const name of names) {
    const value = files[name];
    if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 2) reject();
    if (Buffer.byteLength(JSON.stringify(value)) > MAX_FILE_BYTES) reject();
  }
  if (!files['publish-state-v2.json'].actions || typeof files['publish-state-v2.json'].actions !== 'object'
    || Array.isArray(files['publish-state-v2.json'].actions) || !Array.isArray(files['experiments-v2.json'].experiments)) reject();
  return files;
}
function decode(value, expectedBytes, maxBytes = expectedBytes) {
  if (typeof value !== 'string' || value.length > Math.ceil(maxBytes * 4 / 3) + 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) reject();
  const bytes = Buffer.from(value, 'base64');
  if (bytes.toString('base64') !== value || bytes.length > maxBytes || (expectedBytes !== null && bytes.length !== expectedBytes)) reject();
  return bytes;
}
function deriveKey(privateKey, salt, context) {
  const key = crypto.createPrivateKey(privateKey);
  if (key.asymmetricKeyType !== 'rsa') reject();
  const der = key.export({ type: 'pkcs8', format: 'der' });
  try {
    return Buffer.from(crypto.hkdfSync('sha256', der, salt, Buffer.from(context), 32));
  } finally { der.fill(0); }
}
function additionalData(context) { return Buffer.from(JSON.stringify({ version: 1, algorithm: ALGORITHM, context })); }

export function encryptState(files, privateKey, repository) {
  let key;
  let plaintext;
  try {
    const context = contextValue(repository);
    plaintext = Buffer.from(JSON.stringify({ files: validateFiles(files) }));
    if (plaintext.length > MAX_STATE_BYTES) reject();
    const salt = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);
    key = deriveKey(privateKey, salt, context);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(additionalData(context));
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return {
      version: 1, algorithm: ALGORITHM, context,
      salt: salt.toString('base64'), iv: iv.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64'),
    };
  } catch (error) { sanitizeFailure(error); }
  finally { key?.fill(0); plaintext?.fill(0); }
}

export function decryptState(envelope, privateKey, repository) {
  let key;
  let plaintext;
  try {
    const context = contextValue(repository);
    if (!envelope || envelope.version !== 1 || envelope.algorithm !== ALGORITHM || envelope.context !== context
      || Object.keys(envelope).length !== 7) reject();
    const salt = decode(envelope.salt, 32);
    const iv = decode(envelope.iv, 12);
    const tag = decode(envelope.tag, 16);
    const ciphertext = decode(envelope.ciphertext, null, MAX_STATE_BYTES);
    key = deriveKey(privateKey, salt, context);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAAD(additionalData(context));
    decipher.setAuthTag(tag);
    plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    if (plaintext.length > MAX_STATE_BYTES) reject();
    const decoded = JSON.parse(plaintext.toString('utf8'));
    if (Object.keys(decoded).length !== 1 || !Object.hasOwn(decoded, 'files')) reject();
    return validateFiles(decoded.files);
  } catch (error) { sanitizeFailure(error); }
  finally { key?.fill(0); plaintext?.fill(0); }
}

function assertNoSymlink(target) {
  const absolute = path.resolve(target);
  const parsed = path.parse(absolute);
  let current = parsed.root;
  for (const component of absolute.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, component);
    try { if (fs.lstatSync(current).isSymbolicLink()) reject(); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}
function readBounded(file, limit) {
  assertNoSymlink(file);
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || stat.size > limit) reject();
    const bytes = Buffer.alloc(limit + 1);
    let used = 0;
    while (used < bytes.length) {
      const count = fs.readSync(fd, bytes, used, bytes.length - used, null);
      if (!count) break;
      used += count;
    }
    if (used > limit) reject();
    return bytes.subarray(0, used).toString('utf8');
  } finally { fs.closeSync(fd); }
}
function writeRestricted(file, value) {
  assertNoSymlink(file);
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  fs.chmodSync(path.dirname(file), 0o700);
  const temporary = `${file}.${crypto.randomBytes(8).toString('hex')}.tmp`;
  try {
    fs.writeFileSync(temporary, value, { mode: 0o600, flag: 'wx' });
    fs.renameSync(temporary, file);
    fs.chmodSync(file, 0o600);
  } finally { fs.rmSync(temporary, { force: true }); }
}

export function saveState({ stateDir, cacheFile, privateKey, repository }) {
  try {
    assertNoSymlink(stateDir);
    for (const name of STATE_FILES) assertNoSymlink(path.join(stateDir, name));
    const files = Object.fromEntries(STATE_FILES.filter(name => fs.existsSync(path.join(stateDir, name)))
      .map(name => [name, JSON.parse(readBounded(path.join(stateDir, name), MAX_FILE_BYTES))]));
    if (!Object.keys(files).length) return { mode: 'unchanged', fileCount: 0 };
    writeRestricted(cacheFile, `${JSON.stringify(encryptState(files, privateKey, repository))}\n`);
    return { mode: 'encrypted', fileCount: Object.keys(files).length };
  } catch (error) { sanitizeFailure(error); }
}

export function restoreState({ stateDir, cacheFile, privateKey, repository, dryRun = false, force = false }) {
  try {
    assertNoSymlink(cacheFile);
    assertNoSymlink(stateDir);
    if (!fs.existsSync(cacheFile)) {
      if (!dryRun || force) reject(MISSING_HISTORY);
      // Source markers protect validation; missing history can never authorize publication.
      return { mode: 'bootstrap-dry-run', fileCount: 0 };
    }
    const envelope = JSON.parse(readBounded(cacheFile, MAX_ENVELOPE_BYTES));
    const files = decryptState(envelope, privateKey, repository);
    // Authenticate and validate the entire envelope before creating any plaintext file.
    for (const [name, value] of Object.entries(files)) writeRestricted(path.join(stateDir, name), `${JSON.stringify(value)}\n`);
    return { mode: 'restored', fileCount: Object.keys(files).length };
  } catch (error) { sanitizeFailure(error); }
}

function configuredPrivateKey(env) {
  const source = discoverCredentialSource(env);
  if (!source) reject();
  return parseServiceAccountCredential(env[source], source).private_key;
}
function main() {
  const mode = process.argv[2];
  if (!['restore', 'save'].includes(mode) || !process.env.SEO_PRIVATE_CACHE_FILE || !process.env.GITHUB_REPOSITORY) reject();
  process.umask(0o077);
  const options = {
    stateDir: path.resolve('data/marketing-employee/seo-growth'),
    cacheFile: path.resolve(process.env.SEO_PRIVATE_CACHE_FILE),
    privateKey: configuredPrivateKey(process.env),
    repository: process.env.GITHUB_REPOSITORY,
    dryRun: process.env.DRY_RUN === 'true',
    force: process.env.FORCE_RUN === 'true',
  };
  const result = mode === 'restore' ? restoreState(options) : saveState(options);
  console.log(`Private SEO state cache: ${result.mode}; ${result.fileCount} approved file(s).`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error instanceof CacheError ? error.message : FAILURE); process.exitCode = 1; }
}
