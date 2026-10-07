import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const UUID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const ERROR_CODES = new Set(['NOT_FOUND', 'GENERATION_FAILED', 'ARTIFACT_NOT_RETRYABLE', 'RATE_LIMITED', 'RATE_LIMIT', 'QUOTA_EXCEEDED', 'RESOURCE_EXHAUSTED', 'AUTHENTICATION_REQUIRED', 'TIMEOUT', 'RPC_ERROR', 'API_ERROR']);

export function safeNarrationFailure(error) {
  for (const output of [error?.stdout, error?.stderr]) {
    try {
      const value = JSON.parse(String(output || '').trim());
      const code = value.code || value.error?.code || value.error_code;
      if (ERROR_CODES.has(code)) return code;
    } catch { /* Never echo unstructured provider output. */ }
  }
  if (error?.killed === true) return 'TIMEOUT';
  return 'PROVIDER_REQUEST_FAILED';
}

// Recovery of one approved article through the existing renderer and uploader.
// This module returns audio, never an upload, a video approval or a release record.
export async function recoverRequestedNarration(root, post, env = process.env, run = execute, log = console.log) {
  const requestFile = path.join(root, 'data/marketing-employee/video-repair-request.json');
  if (!fs.existsSync(requestFile)) return null;
  const request = JSON.parse(fs.readFileSync(requestFile, 'utf8'));
  if (request.slug !== post.slug || request.recoverNarration !== true) return null;
  const notebook = String(request.recoverNotebookId || '');
  if (!UUID.test(notebook) || !/^[a-z0-9][a-z0-9-]{1,119}$/.test(post.slug) ||
      post.url !== `https://youraicoach.life/blog/${post.slug}` || !post.title) throw new Error('Invalid narration recovery identity.');
  const command = env.NOTEBOOKLM_BIN || 'notebooklm';
  async function json(args, timeout = 120000) {
    let result;
    try { result = await run(command, args, {cwd: root, env, timeout, maxBuffer: 4 * 1024 * 1024}); }
    catch (error) { throw new Error(`NotebookLM narration: ${safeNarrationFailure(error)}. No automatic generation retry.`); }
    try { return JSON.parse(String(result.stdout || '').trim()); }
    catch { throw new Error('NotebookLM narration: INVALID_JSON.'); }
  }
  const selected = await json(['use', notebook, '--json']);
  if (selected.verified !== true || selected.notebook?.id !== notebook ||
      !String(selected.notebook?.title || '').startsWith(`IZEM Video - ${post.title}`)) throw new Error('Narration notebook does not match the article.');
  const sourceResult = await json(['source', 'list', '-n', notebook, '--json']);
  const sources = Array.isArray(sourceResult) ? sourceResult : sourceResult.sources;
  if (!Array.isArray(sources) || sources.length !== 1 || sources[0].status !== 'ready' ||
      !UUID.test(String(sources[0].id || '')) || sources[0].title !== `${post.title} - canonical article`) {
    throw new Error('Narration recovery requires the one ready canonical article source.');
  }
  const listArgs = ['artifact', 'list', '-n', notebook, '--type', 'audio', '--json'];
  const listed = await json(listArgs);
  let audio = Array.isArray(listed) ? listed : listed.artifacts;
  if (!Array.isArray(audio) || audio.length > 1) throw new Error('Ambiguous article narration; refusing generation.');
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'izem-narration-recovery-'));
  try {
    if (!audio.length) {
      if (!/^\d+$/.test(String(request.narrationWorkflowRunId || '')) ||
          !/^\d+$/.test(String(request.narrationWorkflowRunAttempt || '')) ||
          String(request.narrationWorkflowRunId) !== env.GITHUB_RUN_ID ||
          String(request.narrationWorkflowRunAttempt) !== env.GITHUB_RUN_ATTEMPT) {
        throw new Error('No article narration exists; generation is not authorized for this run and attempt.');
      }
      const usage = await json(['usage', '--json']);
      if (usage.is_exhausted === true || usage.actions?.some(a => a.kind === 'audio_overview' && a.has_sufficient_quota === false)) {
        throw new Error('NotebookLM reports insufficient narration quota; no generation requested.');
      }
      const promptFile = path.join(work, 'narration-prompt.txt');
      const prompt = `Produce a short, single-presenter English narration for the article "${post.title}" using only its canonical source. This narration will accompany the existing IZEM text-and-calendar video. Explain choosing reliable days before a training split, then the article's two-through-six-day comparisons and its uncertain-Friday example. Describe calendars as scheduling examples, never medically validated or optimal prescriptions. Session-focus counts are not sets, recovery or predicted results. More days do not automatically mean more training or muscle gain. Preserve the equal-training-volume condition if mentioning the 2024 review; do not invent research or outcomes. Do not add exercise prescriptions, prices, testimonials or personal experiences. Keep IZEM's role brief and accurate: planning, adaptation, progress review and accountability software, not medical care. Close with a short invitation to read the complete article and use its calendar. Calm, natural delivery, no music or invented conversation. Canonical article: ${post.url}`;
      fs.writeFileSync(promptFile, prompt, 'utf8');
      log('Requesting one brief narration from the same canonical article source; no new notebook or source.');
      const created = await json(['generate', 'audio', '-n', notebook, '-s', sources[0].id, '--format', 'brief', '--length', 'short', '--language', 'en', '--prompt-file', promptFile, '--wait', '--timeout', '900', '--interval', '10', '--retry', '0', '--json'], 16 * 60 * 1000);
      const id = String(created.task_id || created.artifact_id || '');
      if (!UUID.test(id)) throw new Error('Narration creation returned no valid artifact identity; do not generate again.');
      const after = await json(listArgs);
      audio = Array.isArray(after) ? after : after.artifacts;
      if (!Array.isArray(audio) || audio.length !== 1 || audio[0].id !== id) throw new Error('Generated narration identity did not reconcile.');
    }
    if (audio.length !== 1 || !UUID.test(String(audio[0].id || '')) || audio[0].status !== 'completed') {
      throw new Error('Article narration is not completed; no duplicate or retry requested.');
    }
    const outputFile = path.join(work, 'canonical-article-narration.m4a');
    await json(['download', 'audio', outputFile, '-n', notebook, '-a', audio[0].id, '--force', '--json'], 5 * 60 * 1000);
    if (!fs.existsSync(outputFile) || fs.statSync(outputFile).size < 10000) throw new Error('Downloaded article narration is missing or empty.');
    log('Recovered canonical NotebookLM audio. Existing object-only video rendering and all publication checks are still required.');
    return {outputFile, notebookId: notebook, narrationArtifactId: audio[0].id};
  } catch (error) {
    fs.rmSync(work, {recursive: true, force: true});
    throw error;
  }
}
