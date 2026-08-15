#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { gzipSync } from 'node:zlib';

const DEFAULT_INPUT = path.resolve('tools/ai-marketing/search-console-reports/latest-28d.json');
const DEFAULT_PUBLIC_KEY = path.resolve('tools/ai-marketing/gsc-evidence-public.pem');
const CHUNK_SIZE = 3000;

function parseArgs(argv) {
  const args = {
    input: process.env.GSC_PRIVATE_INPUT ? path.resolve(process.env.GSC_PRIVATE_INPUT) : DEFAULT_INPUT,
    publicKey: process.env.GSC_PRIVATE_PUBLIC_KEY ? path.resolve(process.env.GSC_PRIVATE_PUBLIC_KEY) : DEFAULT_PUBLIC_KEY,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === '--input') args.input = path.resolve(argv[++index]);
    else if (item.startsWith('--input=')) args.input = path.resolve(item.slice(8));
    else if (item === '--public-key') args.publicKey = path.resolve(argv[++index]);
    else if (item.startsWith('--public-key=')) args.publicKey = path.resolve(item.slice(13));
  }
  return args;
}

function keyFingerprint(publicKeyPem) {
  const key = crypto.createPublicKey(publicKeyPem);
  const der = key.export({ type: 'spki', format: 'der' });
  return crypto.createHash('sha256').update(der).digest('hex');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [rawReport, publicKeyPem] = await Promise.all([
    fs.readFile(args.input, 'utf8'),
    fs.readFile(args.publicKey, 'utf8'),
  ]);

  let report;
  try {
    report = JSON.parse(rawReport);
  } catch {
    throw new Error('Private GSC report is not valid JSON');
  }
  if (!Array.isArray(report.rows)) throw new Error('Private GSC report is missing rows');
  if (!report.startDate || !report.endDate) throw new Error('Private GSC report is missing its reporting period');

  const compressed = gzipSync(Buffer.from(rawReport, 'utf8'), { level: 9 });
  const contentKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', contentKey, iv);
  const ciphertext = Buffer.concat([cipher.update(compressed), cipher.final()]);
  const tag = cipher.getAuthTag();
  const encryptedKey = crypto.publicEncrypt({
    key: publicKeyPem,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256',
  }, contentKey);

  const envelope = {
    version: 1,
    algorithm: 'RSA-OAEP-SHA256+AES-256-GCM',
    compression: 'gzip',
    createdAt: new Date().toISOString(),
    reportPeriod: { startDate: report.startDate, endDate: report.endDate },
    rowCount: report.rows.length,
    publicKeySha256: keyFingerprint(publicKeyPem),
    encryptedKey: encryptedKey.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };

  const encoded = Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64');
  console.log(`Private GSC evidence encrypted: ${report.rows.length} row(s), period ${report.startDate} to ${report.endDate}.`);
  console.log(`Public-key fingerprint: ${envelope.publicKeySha256}`);
  console.log('PRIVATE_GSC_ENVELOPE_BEGIN');
  for (let offset = 0; offset < encoded.length; offset += CHUNK_SIZE) {
    console.log(encoded.slice(offset, offset + CHUNK_SIZE));
  }
  console.log('PRIVATE_GSC_ENVELOPE_END');
}

main().catch((error) => {
  console.error(`Private GSC encryption failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
