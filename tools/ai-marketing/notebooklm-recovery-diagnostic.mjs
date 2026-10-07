import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const UUID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const STATES = new Set(['completed', 'complete', 'ready', 'success', 'succeeded', 'pending', 'processing', 'in_progress', 'generating', 'failed', 'error', 'queued', 'not_started']);

// Only fixed categories and counts reach logs. Never print provider payloads,
// titles, URLs, credentials, notebook contents, or exception messages.
export function classifyFailure(error) {
  const text = `${error?.stdout || ''}\n${error?.stderr || ''}\n${error?.message || ''}`.toLowerCase();
  if (/rate.?limit|quota|resource.?exhausted|capacity|too many requests/.test(text)) return 'PROVIDER_LIMIT';
  if (/no such option|unknown option|unrecognized arguments|invalid value/.test(text)) return 'CLI_ARGUMENT_ERROR';
  if (/unauthorized|authentication|not authenticated|login required|expired|sign in/.test(text)) return 'AUTHENTICATION_REQUIRED';
  if (/no.*(?:artifact|video)|(?:artifact|video).*not found/.test(text)) return 'NO_VIDEO_AVAILABLE';
  if (/not ready|in.progress|processing|pending/.test(text)) return 'NOT_READY';
  if (/timed? ?out|timeout/.test(text)) return 'TIMEOUT';
  return 'UNCLASSIFIED_PROVIDER_ERROR';
}

export function summarizeListing(value, field) {
  const items = Array.isArray(value) ? value : value?.[field];
  if (!Array.isArray(items)) return { shape: 'unrecognized' };
  const states = {};
  for (const item of items) {
    const raw = item?.status ?? item?.state;
    const state = typeof raw === 'number' && Number.isInteger(raw) && raw >= 0 && raw <= 10
      ? `code_${raw}` : STATES.has(raw) ? raw : 'unknown';
    states[state] = (states[state] || 0) + 1;
  }
  return { count: items.length, states };
}

export async function inspectRequestedRecovery(root, env = process.env, run = exec, log = console.log) {
  const file = path.join(root, 'data/marketing-employee/video-repair-request.json');
  if (!fs.existsSync(file)) return;
  const request = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (request.slug !== env.NOTEBOOKLM_POST_SLUG || !request.recoverNotebookId) return;
  if (!UUID.test(String(request.recoverNotebookId))) throw new Error('Invalid recovery notebook id.');
  const notebook = request.recoverNotebookId;
  const command = env.NOTEBOOKLM_BIN || 'notebooklm';
  for (const [field, args] of [
    ['sources', ['source', 'list', '-n', notebook, '--json']],
    ['artifacts', ['artifact', 'list', '-n', notebook, '--type', 'video', '--json']],
  ]) {
    try {
      const result = await run(command, args, { cwd: root, env, timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
      let value;
      try { value = JSON.parse(String(result.stdout || '').trim()); }
      catch { log(`NotebookLM recovery ${field}: INVALID_JSON`); continue; }
      log(`NotebookLM recovery ${field}: ${JSON.stringify(summarizeListing(value, field))}`);
    } catch (error) {
      log(`NotebookLM recovery ${field}: ${classifyFailure(error)}`);
    }
  }
}
