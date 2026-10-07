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
      const codes = [value?.code, value?.error_code, value?.error?.code, value?.error?.error_code, typeof value?.error === 'string' ? value.error : null];
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
    operation: OPERATIONS.has(operation) ? operation : ['create', 'use', 'usage'].includes(args[0]) ? args[0] : 'notebooklm',
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

// artifact poll is a single read: its JSON can report a failure even at exit 0.
// Never classify its URL, metadata, title or prompt as failure evidence.
export function summarizeArtifactPoll(value, expectedId) {
  if (!UUID.test(String(expectedId)) || value?.task_id !== expectedId) return { shape: 'identity_mismatch' };
  const rawError = value?.error;
  const error = typeof rawError === 'string' ? rawError.slice(0, 4096) : {
    code: rawError?.code,
    message: typeof rawError?.message === 'string' ? rawError.message.slice(0, 4096) : undefined,
  };
  const evidence = { stdout: JSON.stringify({ error_code: value?.error_code, error }) };
  const status = STATES.has(value?.status) ? value.status : 'unknown';
  const hasError = Boolean(rawError);
  return {
    status,
    category: ['failed', 'error'].includes(status) || hasError || value?.error_code
      ? classifyFailure(evidence) : null,
    providerCode: failureEvidence(evidence).providerCode,
    hasError,
    hasDownloadUrl: typeof value?.url === 'string' && value.url.length > 0,
  };
}

const booleanOrNull = (value) => typeof value === 'boolean' ? value : null;

// Only availability booleans and numeric category codes are public. Do not log
// account IDs, percentages, reset timestamps, URLs or arbitrary response fields.
// Current availability is not proof of the cause of an earlier failed request.
export function summarizeUsage(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { shape: 'unrecognized' };
  return {
    status: ['ready', 'disabled', 'skipped'].includes(value.status) ? value.status : 'unknown',
    available: booleanOrNull(value.available),
    exhausted: booleanOrNull(value.is_exhausted),
    categories: Array.isArray(value.actions) ? value.actions
      .filter((item) => Number.isInteger(item?.code) && item.code >= 0 && item.code <= 100)
      .slice(0, 100)
      .map((item) => ({ code: item.code, sufficient: booleanOrNull(item.has_sufficient_quota) })) : [],
  };
}

export async function inspectRequestedRecovery(root, env = process.env, run = exec, log = console.log) {
  const file = path.join(root, 'data/marketing-employee/video-repair-request.json');
  if (!fs.existsSync(file)) return;
  const request = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (request.slug !== env.NOTEBOOKLM_POST_SLUG || !request.recoverNotebookId) return;
  if (!UUID.test(String(request.recoverNotebookId))) throw new Error('Invalid recovery notebook id.');
  const notebook = request.recoverNotebookId;
  const command = env.NOTEBOOKLM_BIN || 'notebooklm';
  const inspect = async (label, args, summarize) => {
    try {
      const result = await run(command, args, { cwd: root, env, timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
      let value;
      try { value = JSON.parse(String(result.stdout || '').trim()); }
      catch { log(`NotebookLM recovery ${label}: INVALID_JSON`); return null; }
      log(`NotebookLM recovery ${label}: ${JSON.stringify(summarize(value))}`);
      return value;
    } catch (error) {
      log(`NotebookLM recovery ${label}: ${JSON.stringify(summarizeCommandFailure(error, args))}`);
      return null;
    }
  };
  await inspect('sources', ['source', 'list', '-n', notebook, '--json'], (value) => summarizeListing(value, 'sources'));
  const listing = await inspect('artifacts', ['artifact', 'list', '-n', notebook, '--type', 'video', '--json'], (value) => summarizeListing(value, 'artifacts'));
  const artifacts = Array.isArray(listing) ? listing : listing?.artifacts;
  // At most two extra read-only calls, and only for a single identified failed
  // video in the requested notebook. This does not call retry, generate or upload.
  if (Array.isArray(artifacts) && artifacts.length === 1 && artifacts[0]?.status === 'failed' && UUID.test(String(artifacts[0]?.id))) {
    const id = artifacts[0].id;
    await inspect('artifact-status', ['artifact', 'poll', id, '-n', notebook, '--json'], (value) => summarizeArtifactPoll(value, id));
    await inspect('usage', ['usage', '--json'], summarizeUsage);
  }
}
