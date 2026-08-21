#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const DEFAULT_INPUT = path.resolve('tools/ai-marketing/search-console-reports/latest-28d.json');
const DEFAULT_PUBLIC_KEY = path.resolve('tools/ai-marketing/gsc-evidence-public.pem');
const CHUNK_SIZE = 3000;
const ALGORITHM = 'RSA-OAEP-SHA256+AES-256-GCM';
const COMPRESSION = 'gzip';

function parseArgs(argv) {
  const args = {
    input: process.env.GSC_PRIVATE_INPUT ? path.resolve(process.env.GSC_PRIVATE_INPUT) : DEFAULT_INPUT,
    publicKey: process.env.GSC_PRIVATE_PUBLIC_KEY ? path.resolve(process.env.GSC_PRIVATE_PUBLIC_KEY) : DEFAULT_PUBLIC_KEY,
    output: process.env.GSC_PRIVATE_OUTPUT ? path.resolve(process.env.GSC_PRIVATE_OUTPUT) : '',
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === '--input') args.input = path.resolve(argv[++index]);
    else if (item.startsWith('--input=')) args.input = path.resolve(item.slice(8));
    else if (item === '--public-key') args.publicKey = path.resolve(argv[++index]);
    else if (item.startsWith('--public-key=')) args.publicKey = path.resolve(item.slice(13));
    else if (item === '--output') args.output = path.resolve(argv[++index]);
    else if (item.startsWith('--output=')) args.output = path.resolve(item.slice(9));
  }
  return args;
}

export function keyFingerprint(publicKeyPem) {
  const key = crypto.createPublicKey(publicKeyPem);
  const der = key.export({ type: 'spki', format: 'der' });
  return crypto.createHash('sha256').update(der).digest('hex');
}

function parseReport(rawReport) {
  let report;
  try {
    report = typeof rawReport === 'string' ? JSON.parse(rawReport) : rawReport;
  } catch {
    throw new Error('Private GSC report is not valid JSON');
  }
  if (!report || !Array.isArray(report.rows)) throw new Error('Private GSC report is missing rows');
  if (!report.startDate || !report.endDate) throw new Error('Private GSC report is missing its reporting period');
  if (!Array.isArray(report.dimensions) || !report.dimensions.includes('query') || !report.dimensions.includes('page')) {
    throw new Error('Private GSC report must contain query and page dimensions');
  }
  return report;
}

export function encryptPrivateReport(rawReport, publicKeyPem, options = {}) {
  const report = parseReport(rawReport);
  const serialized = typeof rawReport === 'string' ? rawReport : `${JSON.stringify(report, null, 2)}\n`;
  const compressed = gzipSync(Buffer.from(serialized, 'utf8'), { level: 9 });
  const contentKey = options.contentKey || crypto.randomBytes(32);
  const iv = options.iv || crypto.randomBytes(12);
  if (!Buffer.isBuffer(contentKey) || contentKey.length !== 32) throw new Error('AES content key must contain 32 bytes');
  if (!Buffer.isBuffer(iv) || iv.length !== 12) throw new Error('AES-GCM IV must contain 12 bytes');

  const cipher = crypto.createCipheriv('aes-256-gcm', contentKey, iv);
  const ciphertext = Buffer.concat([cipher.update(compressed), cipher.final()]);
  const tag = cipher.getAuthTag();
  const encryptedKey = crypto.publicEncrypt({
    key: publicKeyPem,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256',
  }, contentKey);

  return {
    version: 1,
    algorithm: ALGORITHM,
    compression: COMPRESSION,
    createdAt: options.createdAt || new Date().toISOString(),
    reportPeriod: { startDate: report.startDate, endDate: report.endDate },
    rowCount: report.rows.length,
    publicKeySha256: keyFingerprint(publicKeyPem),
    encryptedKey: encryptedKey.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

export function encodeEnvelope(envelope) {
  return Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [rawReport, publicKeyPem] = await Promise.all([
    fs.readFile(args.input, 'utf8'),
    fs.readFile(args.publicKey, 'utf8'),
  ]);
  const envelope = encryptPrivateReport(rawReport, publicKeyPem);

  if (args.output) {
    await fs.mkdir(path.dirname(args.output), { recursive: true });
    await fs.writeFile(args.output, `${JSON.stringify(envelope, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    await fs.chmod(args.output, 0o600);
  }

  const encoded = encodeEnvelope(envelope);
  console.log(`Private GSC evidence encrypted: ${envelope.rowCount} row(s), period ${envelope.reportPeriod.startDate} to ${envelope.reportPeriod.endDate}.`);
  console.log(`Public-key fingerprint: ${envelope.publicKeySha256}`);
  if (args.output) console.log('Encrypted artifact payload written with mode 0600.');
  console.log('PRIVATE_GSC_ENVELOPE_BEGIN');
  for (let offset = 0; offset < encoded.length; offset += CHUNK_SIZE) {
    console.log(encoded.slice(offset, offset + CHUNK_SIZE));
  }
  console.log('PRIVATE_GSC_ENVELOPE_END');
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((error) => {
    console.error(`Private GSC encryption failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
