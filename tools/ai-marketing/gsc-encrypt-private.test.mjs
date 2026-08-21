import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { encryptPrivateReport, encodeEnvelope, keyFingerprint } from './gsc-encrypt-private.mjs';

function keys() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
}

function decrypt(envelope, privateKey) {
  const contentKey = crypto.privateDecrypt({
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256',
  }, Buffer.from(envelope.encryptedKey, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', contentKey, Buffer.from(envelope.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  const compressed = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, 'base64')),
    decipher.final(),
  ]);
  return JSON.parse(gunzipSync(compressed).toString('utf8'));
}

const report = {
  site: 'https://youraicoach.life/',
  startDate: '2026-07-24',
  endDate: '2026-08-20',
  dimensions: ['query', 'page'],
  rows: [{
    keys: ['SECRET QUERY MUST STAY ENCRYPTED', 'https://youraicoach.life/private-landing-page'],
    clicks: 0,
    impressions: 4,
    ctr: 0,
    position: 17,
  }],
};

test('creates an authenticated envelope that round-trips exact query/page evidence', () => {
  const { publicKey, privateKey } = keys();
  const envelope = encryptPrivateReport(`${JSON.stringify(report, null, 2)}\n`, publicKey, {
    contentKey: Buffer.alloc(32, 7),
    iv: Buffer.alloc(12, 9),
    createdAt: '2026-08-21T00:00:00.000Z',
  });

  assert.equal(envelope.version, 1);
  assert.equal(envelope.algorithm, 'RSA-OAEP-SHA256+AES-256-GCM');
  assert.equal(envelope.compression, 'gzip');
  assert.equal(envelope.rowCount, 1);
  assert.deepEqual(envelope.reportPeriod, { startDate: report.startDate, endDate: report.endDate });
  assert.equal(envelope.publicKeySha256, keyFingerprint(publicKey));
  assert.doesNotMatch(JSON.stringify(envelope), /SECRET QUERY MUST STAY ENCRYPTED/);
  assert.doesNotMatch(encodeEnvelope(envelope), /SECRET QUERY MUST STAY ENCRYPTED/);
  assert.deepEqual(decrypt(envelope, privateKey), report);
});

test('fails closed when query/page dimensions are incomplete', () => {
  const { publicKey } = keys();
  assert.throws(
    () => encryptPrivateReport({ ...report, dimensions: ['page'] }, publicKey),
    /query and page dimensions/,
  );
});

test('fails closed for invalid AES key and IV lengths', () => {
  const { publicKey } = keys();
  assert.throws(
    () => encryptPrivateReport(report, publicKey, { contentKey: Buffer.alloc(31), iv: Buffer.alloc(12) }),
    /32 bytes/,
  );
  assert.throws(
    () => encryptPrivateReport(report, publicKey, { contentKey: Buffer.alloc(32), iv: Buffer.alloc(11) }),
    /12 bytes/,
  );
});
