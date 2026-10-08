/** Explicit, bounded live scans. Never invoked implicitly by a build. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { sha256, PROVIDERS, detectorPassed } from './content-release-gate.mjs';

const requiredCredentials = ['GPTZERO_API_KEY', 'COPYLEAKS_EMAIL', 'COPYLEAKS_API_KEY', 'SAPLING_API_KEY'];
export function preflight(packet, policy, env, consent) {
  if (!consent) throw new Error('Explicit --allow-external-processing is required. Only public-ready copy may be submitted.');
  if (packet.language !== 'en') throw new Error('This combination supports English only; no scan was sent.');
  if (typeof packet.copyText !== 'string' || sha256(packet.copyText) !== packet.textSha256) throw new Error('Text/hash mismatch');
  if (packet.copyText.trim().split(/\s+/u).length < policy.minimumWords || packet.copyText.length > policy.maximumCharacters) throw new Error('Unsupported text length; no scan was sent.');
  if (packet.editorial?.complete !== true || packet.editorial.factsPreserved !== true || packet.editorial.noInventedExperience !== true || !Number.isFinite(Date.parse(packet.editorial.completedAt))) throw new Error('Complete the editorial pass before scanning.');
  const missing = requiredCredentials.filter(name => !env[name]);
  if (missing.length) throw new Error(`Missing credentials: ${missing.join(', ')}. No live scan was performed.`);
}

async function request(url, body, headers = {}) {
  const response = await fetch(url, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(45000),
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`Provider HTTP ${response.status}`); // Never log bodies, request text, or credentials.
  const raw = await response.text();
  if (raw.length > 6000000) throw new Error('Oversized provider response');
  return { raw, json: JSON.parse(raw) };
}

export function summarize(provider, json) {
  if (provider === 'gptzero') {
    const d = Array.isArray(json.documents) && json.documents.length === 1 ? json.documents[0] : json;
    return { classification: d.document_classification ?? null,
      confidence: typeof d.confidence_category === 'string' ? d.confidence_category.toLowerCase() : null,
      model: d.model_version ?? 'provider-default; version not returned' };
  }
  if (provider === 'copyleaks') return { aiProportion: json.summary?.ai ?? null, model: json.modelVersion ?? 'not returned', scanId: json.scannedDocument?.scanId ?? null };
  if (provider === 'sapling') return { aiProbability: json.score ?? null, model: '20260820 (requested)' };
  throw new Error('Unknown detector provider');
}

async function scan(provider, text, env) {
  if (provider === 'gptzero') return request('https://api.gptzero.me/v2/predict/text', { document: text }, { 'x-api-key': env.GPTZERO_API_KEY });
  if (provider === 'copyleaks') {
    const auth = await request('https://id.copyleaks.com/v3/account/login/api', { email: env.COPYLEAKS_EMAIL, key: env.COPYLEAKS_API_KEY });
    if (typeof auth.json.access_token !== 'string' || !auth.json.access_token) throw new Error('Copyleaks authentication returned no token');
    return request(`https://api.copyleaks.com/v2/writer-detector/${randomUUID()}/check`,
      { text, sandbox: false, explain: false, sensitivity: 2, language: 'en' }, { Authorization: `Bearer ${auth.json.access_token}` });
  }
  return request('https://api.sapling.ai/api/v1/aidetect', { text, version: '20260820', sent_scores: true }, { Authorization: `Bearer ${env.SAPLING_API_KEY}` });
}

async function main() {
  const [packetFile, ...flags] = process.argv.slice(2);
  if (!packetFile || flags.some(f => f !== '--allow-external-processing')) throw new Error('Usage: node tools/content-detector-scan.mjs PACKET.json --allow-external-processing');
  const packet = JSON.parse(fs.readFileSync(packetFile, 'utf8'));
  const policy = JSON.parse(fs.readFileSync('config/content-release-policy.json', 'utf8'));
  // Re-scanning invalidates prior approvals, even when preflight or a provider fails.
  fs.rmSync(packetFile + '.sig', { force: true });
  packet.humanReview = { approved: false, reviewer: '', approvedAt: null };
  packet.detectors = PROVIDERS.map(provider => ({ provider, status: 'not_run', sandbox: false, textSha256: packet.textSha256 }));
  const save = () => fs.writeFileSync(packetFile, JSON.stringify(packet, null, 2) + '\n', { mode: 0o600 });
  save();
  preflight(packet, policy, process.env, flags.includes('--allow-external-processing'));
  const evidenceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'content-detector-evidence-'));
  fs.chmodSync(evidenceDir, 0o700);
  for (let i = 0; i < PROVIDERS.length; i++) {
    const provider = PROVIDERS[i];
    try {
      const { raw, json } = await scan(provider, packet.copyText, process.env);
      fs.writeFileSync(path.join(evidenceDir, provider + '.json'), raw, { mode: 0o600 });
      packet.detectors[i] = { provider, status: 'completed', sandbox: false, textSha256: packet.textSha256,
        scannedAt: new Date().toISOString(), rawResponseSha256: sha256(raw), ...summarize(provider, json) };
    } catch (error) {
      packet.detectors[i] = { provider, status: 'error', sandbox: false, textSha256: packet.textSha256, error: error.message };
    }
    save();
  }
  console.log(`Private provider evidence: ${evidenceDir}. Inspect it before signing; never commit raw responses or credentials.`);
  for (const report of packet.detectors) console.log(`${report.provider}: ${detectorPassed(report, policy) ? 'within editorial threshold' : 'BLOCKED'}`);
  console.log('No human approval was created. Any change to the source or packet invalidates the eventual signature.');
  if (!packet.detectors.every(r => detectorPassed(r, policy))) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
