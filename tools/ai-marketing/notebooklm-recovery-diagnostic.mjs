import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const UUID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const STATES = new Set(['completed', 'complete', 'ready', 'success', 'succeeded', 'pending', 'processing', 'in_progress', 'generating', 'failed', 'error', 'queued', 'not_started']);
const CODE_CATEGORIES = new Map([
  ['RATE_LIMITED', 'PROVIDER_LIMIT'], ['RATE_LIMIT', 'PROVIDER_LIMIT'],
  ['QUOTA_EXCEEDED', 'PROVIDER_LIMIT'], ['RESOURCE_EXHAUSTED', 'PROVIDER_LIMIT'],
  ['AUTH_REQUIRED', 'AUTHENTICATION_REQUIRED'], ['UNAUTHENTICATED', 'AUTHENTICATION_REQUIRED'],
  ['AUTH_ERROR', 'AUTHENTICATION_REQUIRED'], ['PERMISSION_DENIED', 'PERMISSION_DENIED'],
  ['INVALID_ARGUMENT', 'CLI_ARGUMENT_ERROR'], ['USAGE_ERROR', 'CLI_ARGUMENT_ERROR'],
  ['NOT_FOUND', 'RESOURCE_NOT_FOUND'], ['NO_VIDEO_AVAILABLE', 'NO_VIDEO_AVAILABLE'],
  ['GENERATION_FAILED', 'GENERATION_FAILED'], ['ARTIFACT_FAILED', 'GENERATION_FAILED'],
  ['NOT_RETRYABLE', 'NOT_RETRYABLE'], ['ARTIFACT_NOT_RETRYABLE', 'NOT_RETRYABLE'],
  ['TIMEOUT', 'TIMEOUT'], ['DEADLINE_EXCEEDED', 'TIMEOUT'],
  ['CANCELLED', 'CANCELLED'], ['RPC_ERROR', 'PROVIDER_RPC_ERROR'],
  ['INTERNAL', 'PROVIDER_INTERNAL_ERROR'], ['UNAVAILABLE', 'PROVIDER_UNAVAILABLE'],
]);
const OPERATIONS = new Set(['auth check', 'source list', 'source add', 'source get', 'artifact list', 'artifact get', 'artifact poll', 'artifact wait', 'artifact retry', 'generate video', 'download video']);

function failureEvidence(error) {
  const outputs = [error?.stdout, error?.stderr].map((value) => String(value || '').slice(0, 65536)).filter((value) => value.trim());
  let providerCode = null;
  for (const output of outputs) {
    try {
      const value = JSON.parse(output.trim());
      const codes = [value?.code, value?.error?.code, typeof value?.error === 'string' ? value.error : null];
      providerCode = codes.find((code) => CODE_CATEGORIES.has(code)) || providerCode;
    } catch { /* Non-JSON diagnostics are classified, never printed. */ }
  }
  // execFile's message repeats argv, including "notebooklm artifact" and --timeout.
  // Those are not evidence of a missing artifact or an actual timeout.
  const message = String(error?.message || '').split(/\r?\n/).filter((line) => !/^\s*Command failed:/i.test(line)).join('\n');
  return { providerCode, text: (outputs.length ? outputs.join('\n') : message).toLowerCase() };
}

// Only fixed categories reach logs, not command arguments or provider payloads.
export function classifyFailure(error) {
  const { text, providerCode } = failureEvidence(error);
  if (providerCode) return CODE_CATEGORIES.get(providerCode);
  if (error?.code === 'ENOENT') return 'CLI_NOT_FOUND';
  if (error?.code === 'ETIMEDOUT') return 'TIMEOUT';
  if (/\brate[ _-]?limit(?:ed)?\b|\bquota(?:_exceeded)?\b|\bresource[ _-]?exhausted\b|\bcapacity\b|too many requests/.test(text)) return 'PROVIDER_LIMIT';
  if (/no such option|unknown option|unrecognized arguments|invalid value/.test(text)) return 'CLI_ARGUMENT_ERROR';
  if (/unauthorized|authentication|not authenticated|login required|expired|sign in/.test(text)) return 'AUTHENTICATION_REQUIRED';
  if (/\bnot[ _-]?retryable\b|cannot (?:be )?retried/.test(text)) return 'NOT_RETRYABLE';
  if (/\bno\s+(?:(?:completed|available|matching|ready|video)\s+){0,3}(?:artifacts?|videos?)\b|\b(?:artifact|video)\b[^\r\n]{0,80}\bnot found\b/.test(text)) return 'NO_VIDEO_AVAILABLE';
  if (/\b(?:generation|rendering)\b[^\r\n]{0,80}\bfailed\b|\b(?:artifact|video)\b[^\r\n]{0,80}\b(?:generation failed|status[ :="']+failed)\b/.test(text)) return 'GENERATION_FAILED';
  if (/not ready|in.progress|processing|pending/.test(text)) return 'NOT_READY';
  if (/\btimed?\s*out\b|\btimeout\b/.test(text)) return 'TIMEOUT';
  return 'UNCLASSIFIED_PROVIDER_ERROR';
}

export function summarizeCommandFailure(error, args = []) {
  const operation = `${args[0] || ''} ${args[1] || ''}`;
  return {
    operation: OPERATIONS.has(operation) ? operation : ['create', 'use'].includes(args[0]) ? args[0] : 'notebooklm',
    category: classifyFailure(error),
    providerCode: failureEvidence(error).providerCode,
    exitCode: Number.isInteger(error?.code) && error.code >= 0 && error.code <= 255 ? error.code : null,
    signal: ['SIGTERM', 'SIGKILL', 'SIGINT'].includes(error?.signal) ? error.signal : null,
    hasStdout: Boolean(String(error?.stdout || '').trim()),
    hasStderr: Boolean(String(error?.stderr || '').trim()),
  };
}

// Catch the rejected promise while stdout/stderr are still available. Never attach
// the raw exception as cause: it may contain cookies, source text or credentials.
export async function runWithSafeFailure(command, args, options, run = exec) {
  try { return await run(command, args, options); }
  catch (error) {
    const failure = new Error(`NotebookLM command failed: ${JSON.stringify(summarizeCommandFailure(error, args))}`);
    failure.name = 'NotebookLMCommandError';
    throw failure;
  }
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
      log(`NotebookLM recovery ${field}: ${JSON.stringify(summarizeCommandFailure(error, args))}`);
    }
  }
}
