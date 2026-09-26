/** Three-layer editorial release gate. No network calls during check/build. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash, createPublicKey, verify } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const sha256 = value => createHash('sha256').update(value).digest('hex');
export const PROVIDERS = ['gptzero', 'copyleaks', 'sapling'];
const HEX = /^[a-f0-9]{64}$/;
const requireThat = (condition, message) => { if (!condition) throw new Error(message); };
const present = value => typeof value === 'string' && value.trim().length >= 10;
const isDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const probability = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;

export function sourceInScope(file) {
  if (/(^|\/)(AGENTS\.md|robots\.txt)$/.test(file) || /\.(test|spec)\.[cm]?[jt]sx?$/.test(file)) return false;
  if (file === 'index.html') return true;
  if (/^(src|content|copy|locales)\//.test(file)) return /\.(html?|mdx?|txt|json|[cm]?[jt]sx?)$/i.test(file);
  return /^public\//.test(file) && /\.(html?|mdx?|txt|json)$/i.test(file)
    && !['public/seo-system-version.json', 'public/manifest.json', 'public/manifest.webmanifest', 'public/blog/index.html', 'public/youtube/index.html'].includes(file);
}

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
}

export function safeFile(root, relative) {
  requireThat(typeof relative === 'string' && relative.length > 0 && !relative.includes('\\')
    && !path.isAbsolute(relative) && !relative.split('/').some(p => ['.', '..', ''].includes(p)), 'Unsafe repository path');
  const target = path.join(root, relative);
  let current = root;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    if (fs.existsSync(current)) requireThat(!fs.lstatSync(current).isSymbolicLink(), 'Symlinks are not allowed in review inputs');
  }
  return target;
}

export function pendingSources(root, baselineCommit) {
  requireThat(/^[a-f0-9]{40}$/.test(baselineCommit ?? ''), 'A pinned baseline commit is required');
  git(root, ['cat-file', '-e', `${baselineCommit}^{commit}`]); // Missing/shallow history must fail, not skip.
  const changed = git(root, ['diff', '--name-only', '-z', '--diff-filter=ACMRT', '--no-renames', baselineCommit, '--']);
  const untracked = git(root, ['ls-files', '--others', '--exclude-standard', '-z']);
  return [...new Set((changed + untracked).split('\0').filter(sourceInScope))].sort();
}

export async function htmlCopy(html) {
  const { load } = await import('cheerio'); // Existing repository dependency; never execute page scripts.
  const $ = load(html);
  const parts = [$('title').text()];
  $('meta[name="description"],meta[property="og:title"],meta[property="og:description"],meta[name="twitter:title"],meta[name="twitter:description"]').each((_, e) => parts.push($(e).attr('content') || ''));
  $('[alt],[aria-label],[title]').each((_, e) => {
    for (const attr of ['alt', 'aria-label', 'title']) if ($(e).attr(attr)) parts.push($(e).attr(attr));
  });
  const walk = value => {
    if (typeof value === 'string') parts.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  $('script[type="application/ld+json"]').each((_, e) => walk(JSON.parse($(e).text())));
  $('script,style,template').remove();
  $('p,div,section,article,main,h1,h2,h3,h4,h5,h6,li,br,tr,td,th').each((_, e) => $(e).append(' '));
  parts.push($('body').text());
  return parts.join('\n').replace(/\s+/gu, ' ').trim();
}

export function detectorPassed(result, policy) {
  if (result?.status !== 'completed' || result.sandbox !== false) return false;
  if (result.provider === 'gptzero') return result.classification === 'HUMAN_ONLY' && result.confidence === 'high';
  if (result.provider === 'copyleaks') return probability(result.aiProportion) && result.aiProportion <= policy.copyleaksMaxAiProportion;
  if (result.provider === 'sapling') return probability(result.aiProbability) && result.aiProbability <= policy.saplingMaxAiProbability;
  return false;
}

export function validatePacket(packet, { sourcePath, sourceSha256, policy, now = Date.now() }) {
  requireThat(packet?.schemaVersion === 1 && packet.sourcePath === sourcePath && packet.sourceSha256 === sourceSha256, 'Source changed or packet belongs to another file');
  requireThat(packet.language === 'en', 'This detector combination is English-only; unsupported languages remain blocked');
  requireThat(typeof packet.copyText === 'string' && sha256(packet.copyText) === packet.textSha256, 'Scan text/hash mismatch');
  requireThat(packet.copyText.trim().split(/\s+/u).length >= policy.minimumWords && packet.copyText.length <= policy.maximumCharacters, 'Text outside the configured scan length range; do not pad or truncate it');
  requireThat(packet.editorial?.complete === true && packet.editorial.factsPreserved === true && packet.editorial.noInventedExperience === true && present(packet.editorial.notes) && isDate(packet.editorial.completedAt), 'Layer 1 editorial review incomplete');
  requireThat(Array.isArray(packet.detectors) && packet.detectors.length === 3 && new Set(packet.detectors.map(r => r.provider)).size === 3, 'Three distinct detector reports are required');
  for (const provider of PROVIDERS) {
    const result = packet.detectors.find(r => r.provider === provider);
    requireThat(result?.textSha256 === packet.textSha256 && HEX.test(result.rawResponseSha256 ?? '') && isDate(result.scannedAt), `${provider}: missing or mismatched scan evidence`);
    requireThat(Date.parse(result.scannedAt) >= Date.parse(packet.editorial.completedAt) && Date.parse(result.scannedAt) <= now + 300000, `${provider}: scan must follow editing and not be future-dated`);
    requireThat(detectorPassed(result, policy), `${provider}: not passed (missing/error/mixed/low-confidence results cannot pass)`);
  }
  const proof = packet.verification;
  requireThat(proof?.complete === true && Array.isArray(proof.claims) && proof.claims.length > 0 && proof.claims.every(c => present(c.claim) && present(c.source) && present(c.check)), 'Layer 3: claim-to-source verification required');
  requireThat(present(proof.originalValue) && present(proof.originalEvidence) && present(proof.plagiarismReview) && proof.noFabricatedExperience === true && proof.renderedCopyCoverageConfirmed === true, 'Layer 3: original value, provenance, plagiarism review and rendered-copy coverage required');
  requireThat(present(packet.humanReview?.reviewer) && isDate(packet.humanReview.approvedAt) && packet.humanReview.approved === true, 'Actual human approval is missing');
  const approvedAt = Date.parse(packet.humanReview.approvedAt);
  requireThat(approvedAt <= now + 300000 && packet.detectors.every(r => Date.parse(r.scannedAt) <= approvedAt), 'Human approval must follow all three scans');
}

export function verifyHumanSignature(bytes, signature, publicKeyPem) {
  requireThat(typeof publicKeyPem === 'string' && publicKeyPem.includes('PUBLIC KEY'), 'Human review public key is not configured');
  const key = createPublicKey(publicKeyPem);
  requireThat(key.asymmetricKeyType === 'ed25519', 'Human review key must be Ed25519');
  requireThat(verify(null, bytes, key, signature), 'Human approval signature is missing, invalid, or stale');
}

export function packetPath(file) { return `.content-reviews/${sha256(file)}.json`; }

export async function checkRelease(root, policy) {
  const pending = pendingSources(root, policy.baselineCommit);
  const failures = [];
  for (const file of pending) {
    try {
      const source = fs.readFileSync(safeFile(root, file));
      const packetFile = safeFile(root, packetPath(file));
      const bytes = fs.readFileSync(packetFile);
      const packet = JSON.parse(bytes.toString('utf8'));
      validatePacket(packet, { sourcePath: file, sourceSha256: sha256(source), policy });
      if (/\.html?$/i.test(file)) requireThat(packet.copyText === await htmlCopy(source.toString('utf8')), 'HTML copy changed or scan input omits page text');
      verifyHumanSignature(bytes, fs.readFileSync(safeFile(root, packetPath(file) + '.sig')), policy.humanReviewPublicKeyPem);
    } catch (error) { failures.push(`${file}: ${error.code === 'ENOENT' ? 'review packet/signature missing' : error.message}`); }
  }
  requireThat(failures.length === 0, `CONTENT RELEASE BLOCKED\n${failures.join('\n')}`);
  return pending.length;
}

async function main() {
  const [command = 'check', file, copyFile] = process.argv.slice(2);
  const root = process.cwd();
  const policy = JSON.parse(fs.readFileSync(path.join(root, 'config/content-release-policy.json'), 'utf8'));
  requireThat(policy.schemaVersion === 1 && Number.isInteger(policy.minimumWords) && policy.minimumWords >= 300
    && Number.isInteger(policy.maximumCharacters) && policy.maximumCharacters <= 80000
    && probability(policy.copyleaksMaxAiProportion) && probability(policy.saplingMaxAiProbability), 'Invalid release policy');
  if (command === 'check') {
    const count = await checkRelease(root, policy);
    console.log(`Content gate passed: ${count} changed source file(s) have signed reviews. Unchanged baseline content was not re-audited.`);
  } else if (command === 'prepare') {
    requireThat(sourceInScope(file ?? ''), 'Specify an in-scope source file');
    const source = fs.readFileSync(safeFile(root, file));
    const copyText = /\.html?$/i.test(file) ? await htmlCopy(source.toString('utf8')) : fs.readFileSync(copyFile || '', 'utf8').trim();
    const packet = {
      schemaVersion: 1, sourcePath: file, sourceSha256: sha256(source), language: 'en', copyText, textSha256: sha256(copyText),
      editorial: { complete: false, factsPreserved: false, noInventedExperience: false, completedAt: null, notes: '' },
      detectors: [], verification: { complete: false, claims: [], originalValue: '', originalEvidence: '', plagiarismReview: '', noFabricatedExperience: false, renderedCopyCoverageConfirmed: false },
      humanReview: { approved: false, reviewer: '', approvedAt: null }
    };
    fs.mkdirSync(path.join(root, '.content-reviews'), { recursive: true });
    fs.writeFileSync(safeFile(root, packetPath(file)), JSON.stringify(packet, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    console.log(`Created ${packetPath(file)} with all layers pending. No scan or approval was performed.`);
  } else throw new Error('Usage: node tools/content-release-gate.mjs check | prepare SOURCE [RENDERED_COPY_TEXT_FILE]');
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
