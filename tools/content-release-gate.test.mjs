import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { generateKeyPairSync, sign } from 'node:crypto';
import { sha256, sourceInScope, safeFile, pendingSources, validatePacket, verifyHumanSignature, detectorPassed, PROVIDERS, packetPath, checkRelease } from './content-release-gate.mjs';
import { preflight, summarize } from './content-detector-scan.mjs';
const policy = { minimumWords: 300, maximumCharacters: 80000, copyleaksMaxAiProportion: .1, saplingMaxAiProbability: .1 };
function fixture() {
  const copyText = 'This is clearly labelled synthetic test data. '.repeat(50);
  const textSha256 = sha256(copyText);
  return { schemaVersion: 1, sourcePath: 'public/blog/test.html', sourceSha256: sha256('source'), language: 'en', copyText, textSha256,
    editorial: { complete: true, factsPreserved: true, noInventedExperience: true, notes: 'Test-only editorial fixture', completedAt: '2026-09-26T10:00:00Z' },
    detectors: PROVIDERS.map(provider => ({ provider, status: 'completed', sandbox: false, textSha256, rawResponseSha256: sha256('synthetic fixture'), scannedAt: '2026-09-26T11:00:00Z', classification: 'HUMAN_ONLY', confidence: 'high', aiProportion: .02, aiProbability: .02 })),
    verification: { complete: true, claims: [{ claim: 'Synthetic claim for unit testing', source: 'Synthetic source for unit testing', check: 'Synthetic verification for unit testing' }], originalValue: 'Synthetic original value fixture', originalEvidence: 'Synthetic evidence fixture', plagiarismReview: 'Synthetic plagiarism review fixture', noFabricatedExperience: true, renderedCopyCoverageConfirmed: true },
    humanReview: { approved: true, reviewer: 'TEST FIXTURE ONLY', approvedAt: '2026-09-26T12:00:00Z' } };
}
const options = p => ({ sourcePath: p.sourcePath, sourceSha256: sha256('source'), policy, now: Date.parse('2026-09-26T13:00:00Z') });
test('complete synthetic fixture validates structurally (not live detector evidence)', () => { const p = fixture(); assert.doesNotThrow(() => validatePacket(p, options(p))); });
for (const [name, mutate] of [
  ['missing detector', p => p.detectors.pop()],
  ['duplicate provider', p => p.detectors[2] = p.detectors[0]],
  ['not run', p => p.detectors[0].status = 'not_run'],
  ['API error', p => p.detectors[0].status = 'error'],
  ['sandbox evidence', p => p.detectors[0].sandbox = true],
  ['mixed verdict', p => p.detectors[0].classification = 'MIXED'],
  ['low confidence', p => p.detectors[0].confidence = 'low'],
  ['high AI score', p => p.detectors[2].aiProbability = .8],
  ['numeric string', p => p.detectors[2].aiProbability = '0.01'],
  ['missing native score', p => delete p.detectors[1].aiProportion],
  ['different scan text', p => p.detectors[1].textSha256 = sha256('other')],
  ['edited source', p => p.sourceSha256 = sha256('edited')],
  ['edited copy', p => p.copyText += 'changed'],
  ['editorial review missing', p => p.editorial.complete = false],
  ['missing claims', p => p.verification.claims = []],
  ['no original evidence', p => p.verification.originalEvidence = ''],
  ['no plagiarism review', p => p.verification.plagiarismReview = ''],
  ['no rendered coverage', p => p.verification.renderedCopyCoverageConfirmed = false],
  ['no human approval', p => p.humanReview.approved = false],
  ['approval before scan', p => p.humanReview.approvedAt = '2026-09-26T10:30:00Z'],
  ['future scan', p => p.detectors[0].scannedAt = '2030-01-01T00:00:00Z'],
  ['unsupported language', p => p.language = 'fr']
]) test(`blocks ${name}`, () => { const p = fixture(); mutate(p); assert.throws(() => validatePacket(p, options(p))); });
test('signatures bind exact bytes and the approved key', () => {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519'); // Test-only; never an owner approval key.
  const pem = publicKey.export({ type: 'spki', format: 'pem' });
  const bytes = Buffer.from(JSON.stringify(fixture()));
  const signature = sign(null, bytes, privateKey);
  assert.doesNotThrow(() => verifyHumanSignature(bytes, signature, pem));
  assert.throws(() => verifyHumanSignature(Buffer.concat([bytes, Buffer.from(' ')]), signature, pem));
  assert.throws(() => verifyHumanSignature(bytes, signature, null));
  const other = generateKeyPairSync('ed25519').publicKey.export({ type: 'spki', format: 'pem' });
  assert.throws(() => verifyHumanSignature(bytes, signature, other));
});
test('scope includes nested translations and app copy, not secrets or tests', () => {
  for (const p of ['index.html', 'public/fr/blog/post.html', 'public/blog/new.html', 'src/App.tsx', 'src/locales/ar.json', 'copy/app-store.txt']) assert.equal(sourceInScope(p), true);
  for (const p of ['.env', 'docs/report.md', 'tools/content-release-gate.mjs', 'public/robots.txt', 'src/App.test.tsx']) assert.equal(sourceInScope(p), false);
});
test('rejects unsafe review paths and symlinks', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-path-'));
  try {
    for (const p of ['../secret', '/etc/passwd', 'a/../b', 'a\\b']) assert.throws(() => safeFile(root, p));
    fs.symlinkSync(os.tmpdir(), path.join(root, 'link'));
    assert.throws(() => safeFile(root, 'link/file'));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
test('missing API credentials or consent fail before any network operation', () => {
  const p = fixture();
  assert.throws(() => preflight(p, policy, {}, true), /Missing credentials/);
  assert.throws(() => preflight(p, policy, {}, false), /Explicit/);
});
test('unknown provider response cannot silently pass', () => {
  for (const provider of PROVIDERS) assert.equal(detectorPassed({ provider, status: 'completed', sandbox: false, ...summarize(provider, {}) }, policy), false);
});
test('cumulative baseline catches an earlier unapproved push plus untracked copy', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-history-'));
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  try {
    git('init'); git('config', 'user.email', 'test@example.invalid'); git('config', 'user.name', 'Test fixture');
    fs.writeFileSync(path.join(root, 'README.md'), 'Baseline'); git('add', '.'); git('commit', '-m', 'baseline');
    const baselineCommit = git('rev-parse', 'HEAD');
    assert.equal(await checkRelease(root, { ...policy, baselineCommit }), 0);
    fs.mkdirSync(path.join(root, 'public/blog'), { recursive: true });
    fs.writeFileSync(path.join(root, 'public/blog/a.html'), '<p>Unapproved article</p>'); git('add', '.'); git('commit', '-m', 'unapproved');
    fs.writeFileSync(path.join(root, 'README.md'), 'A later unrelated push'); git('add', '.'); git('commit', '-m', 'unrelated');
    fs.writeFileSync(path.join(root, 'public/blog/b.html'), '<p>Untracked copy</p>');
    assert.deepEqual(pendingSources(root, baselineCommit), ['public/blog/a.html', 'public/blog/b.html']);
    await assert.rejects(checkRelease(root, { ...policy, baselineCommit }), /CONTENT RELEASE BLOCKED/);
    assert.throws(() => pendingSources(root, '0'.repeat(40)));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
