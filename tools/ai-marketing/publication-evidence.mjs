import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const DEPLOY_WORKFLOW_PATH = '.github/workflows/deploy.yml';
export const DEPLOY_STEP_NAME = 'Deploy production artifact to Firebase Hosting';
const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const PAGE_SIZE = 100;
const MAX_RECORDS = 10000;
const MAX_REQUESTS = 2000;
const MAX_ATTEMPTS = 100;
const SHA = /^[a-f0-9]{40}$/;
const COMPLETED_CONCLUSIONS = new Set(['success', 'failure', 'cancelled', 'timed_out', 'action_required', 'neutral', 'skipped', 'stale', 'startup_failure']);
const ACTIVE_STATUSES = new Set(['queued', 'in_progress', 'waiting', 'requested', 'pending']);
const isPost = (file) => /^public\/blog\/[^/]+\.html$/.test(file) && file !== 'public/blog/index.html';
const hold = (message) => { throw new Error(`HOLD: ${message}`); };

function integer(value, label, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(parsed) || parsed > max) hold(`Invalid ${label}.`);
  return parsed;
}

function timestamp(value, label) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) hold(`Invalid ${label}.`);
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== (value.includes('.') ? value : value.replace(/Z$/, '.000Z'))) hold(`Invalid ${label}.`);
  return parsed;
}

function git(cwd, args) {
  return execFileSync('git', ['--no-replace-objects', ...args], {
    cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function fullHistoryHead(cwd, head) {
  if (git(cwd, ['rev-parse', '--is-shallow-repository']).trim() !== 'false') hold('Full Git history is required for publication evidence.');
  const grafts = path.resolve(cwd, git(cwd, ['rev-parse', '--git-path', 'info/grafts']).trim());
  if (fs.existsSync(grafts) && fs.readFileSync(grafts, 'utf8').split('\n').some((line) => line.trim() && !line.trim().startsWith('#'))) hold('Git grafts obscure publication evidence.');
  return git(cwd, ['rev-parse', '--verify', '--end-of-options', `${head}^{commit}`]).trim();
}

function snapshot(cwd, sha, resolvedHead) {
  if (!SHA.test(sha)) hold('Invalid publication source commit.');
  try {
    git(cwd, ['merge-base', '--is-ancestor', sha, resolvedHead]);
  } catch {
    hold(`Publication source ${sha} is missing or is not an ancestor of the proposed head; fetch full release history and investigate diverged releases.`);
  }
  const files = new Set();
  for (const entry of git(cwd, ['ls-tree', '-r', '-z', '--full-tree', sha, '--', 'public']).split('\0').filter(Boolean)) {
    const tab = entry.indexOf('\t');
    if (tab === -1) hold('Malformed Git tree evidence.');
    const [mode, type] = entry.slice(0, tab).split(' ');
    const file = entry.slice(tab + 1);
    if (isPost(file) || file === 'public' || file === 'public/blog') {
      if (type !== 'blob' || !['100644', '100755'].includes(mode)) hold(`Publication source ${file} must be a regular tracked file.`);
      if (isPost(file)) files.add(file);
    }
  }
  return files;
}

function defaultRequestJson(cwd) {
  return async (endpoint) => {
    const output = execFileSync('gh', ['api', '--method', 'GET', endpoint], {
      cwd, encoding: 'utf8', timeout: 90000, maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    });
    try { return JSON.parse(output); } catch { hold('GitHub returned invalid JSON publication evidence.'); }
  };
}

async function pages(request, endpoint, field) {
  let total;
  const records = [];
  const ids = new Set();
  for (let page = 1; page <= Math.ceil(MAX_RECORDS / PAGE_SIZE); page += 1) {
    const response = await request(`${endpoint}?per_page=${PAGE_SIZE}&page=${page}`);
    if (!response || !Number.isSafeInteger(response.total_count) || response.total_count < 0
      || response.total_count > MAX_RECORDS || !Array.isArray(response[field])) hold(`Malformed or oversized ${field} pagination evidence.`);
    if (total === undefined) total = response.total_count;
    if (response.total_count !== total) hold(`${field} changed while paginating; retry with stable release evidence.`);
    const expected = Math.min(PAGE_SIZE, total - records.length);
    if (response[field].length !== expected) hold(`Incomplete ${field} pagination evidence.`);
    for (const record of response[field]) {
      const id = integer(record?.id, `${field} record ID`);
      if (ids.has(id)) hold(`Duplicate ${field} pagination evidence.`);
      ids.add(id);
      records.push(record);
    }
    if (records.length === total) return records;
  }
  hold(`${field} pagination exceeded the bounded evidence limit.`);
}

function trustedRun(run, { repository, workflowId, now }) {
  integer(run?.id, 'workflow run ID');
  if (run?.repository?.full_name !== repository || run?.path !== DEPLOY_WORKFLOW_PATH || run?.workflow_id !== workflowId) hold('Workflow evidence does not match the trusted repository and deployment workflow.');
  if (typeof run?.head_repository?.full_name !== 'string' || typeof run.event !== 'string' || typeof run.head_branch !== 'string') hold('Incomplete workflow provenance.');
  // Other refs/events cannot prove the trusted baseline. Do not silently ignore
  // them: workflow_dispatch (or historical workflow definitions) may deploy
  // production from such a ref. They are safe to ignore only before a later
  // authenticated baseline. Reconstruct their reruns too.
  const trusted = run.head_repository.full_name === repository && ['push', 'workflow_dispatch'].includes(run.event)
    && ['main', 'master'].includes(run.head_branch);
  if (!SHA.test(run.head_sha)) hold('Invalid workflow source SHA.');
  const attempt = integer(run.run_attempt, 'workflow run attempt', MAX_ATTEMPTS);
  const created = timestamp(run.created_at, 'workflow creation time');
  const updated = timestamp(run.updated_at, 'workflow update time');
  // GitHub can report a retry's run_started_at a second or two before its
  // per-attempt created_at. Both are lower bounds, never exposure upper bounds.
  const started = run.run_started_at == null ? created : timestamp(run.run_started_at, 'workflow start time');
  if (updated < created || updated < started || updated > now || created > now) hold('Inconsistent or future workflow timestamps.');
  if (run.status === 'completed') {
    if (!COMPLETED_CONCLUSIONS.has(run.conclusion)) hold('Invalid completed workflow conclusion.');
  } else if (!ACTIVE_STATUSES.has(run.status) || run.conclusion != null) hold('Invalid active workflow status.');
  return { ...run, trusted, attempt, created, updated, lower: Math.min(created, started) };
}

function sameRunIdentity(a, b) {
  return ['id', 'workflow_id', 'path', 'head_sha', 'head_branch', 'event'].every((key) => a[key] === b[key])
    && a.repository.full_name === b.repository.full_name && a.head_repository.full_name === b.head_repository.full_name;
}

async function deployedBefore(request, prefix, run, cutoff) {
  const jobs = await pages(request, `${prefix}/runs/${run.id}/attempts/${run.attempt}/jobs`, 'jobs');
  if (!jobs.length) hold(`Completed deployment attempt ${run.id}/${run.attempt} has no job evidence.`);
  const matches = [];
  for (const job of jobs) {
    if (job.run_id !== run.id || job.run_attempt !== run.attempt || job.head_sha !== run.head_sha
      || job.status !== 'completed' || !COMPLETED_CONCLUSIONS.has(job.conclusion) || !Array.isArray(job.steps)) hold('Job evidence does not match its completed deployment attempt.');
    for (const step of job.steps) {
      if (step?.name !== DEPLOY_STEP_NAME) continue;
      matches.push({ job, step });
    }
  }
  if (matches.length > 1) hold('Ambiguous production deployment-step evidence.');
  if (!matches.length) return null;
  const { step, job } = matches[0];
  if (step.status !== 'completed' || !COMPLETED_CONCLUSIONS.has(step.conclusion)) hold('Incomplete or malformed deployment-step evidence.');
  if (step.conclusion !== 'success') return null;
  const completed = timestamp(step.completed_at, 'deployment-step completion time');
  const started = timestamp(step.started_at, 'deployment-step start time');
  const jobCompleted = timestamp(job.completed_at, 'deployment-job completion time');
  if (completed < started || completed > jobCompleted || jobCompleted > run.updated || started < run.lower) hold('Inconsistent deployment-step timestamps.');
  return completed <= cutoff ? { run, time: completed, jobId: job.id } : null;
}

function inventorySignature(runs) {
  return JSON.stringify(runs.map((run) => [run.id, run.run_attempt, run.head_sha, run.head_branch, run.event,
    run.status, run.conclusion, run.created_at, run.updated_at, run.repository?.full_name, run.head_repository?.full_name, run.path, run.workflow_id]));
}

/**
 * A conservative cap based on authenticated Actions exposure evidence, never
 * author/committer dates. List the entire deployment workflow without a date
 * filter: an old run can be rerun today. Reconstruct every rerun's attempts.
 * The latest successful Firebase step at/before the cutoff proves the fixed
 * baseline, even if later smoke tests failed. Overall success or a skipped
 * deploy is not proof. Jobs are read lazily while proving that baseline.
 *
 * Every potentially exposed snapshot after that baseline (including failed,
 * cancelled and skipped runs) and the proposed head contributes new URLs. This
 * intentionally overcounts uncertain exposure; missing evidence always HOLDs.
 * The caller must separately include pending worktree/index additions and its
 * per-run one-post rule. Supply currentRunId/currentRunAttempt only from the
 * invoking CI run's immutable environment, never from an article or plan.
 */
export async function inspectPublicationEvidence({
  cwd = process.cwd(), head = 'HEAD', now = new Date(), requireSlot = false, limit = 3,
  repository = process.env.GITHUB_REPOSITORY || 'jebbari-mohammed/website',
  currentRunId = process.env.GITHUB_RUN_ID, currentRunAttempt = process.env.GITHUB_RUN_ATTEMPT,
  requestJson,
} = {}) {
  const instant = new Date(now).getTime();
  if (!Number.isFinite(instant)) hold('Invalid publication-check time.');
  limit = integer(limit, 'weekly publication limit', 3);
  if (typeof repository !== 'string' || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) hold('A trusted repository identity is required.');
  const currentId = currentRunId == null || currentRunId === '' ? null : integer(currentRunId, 'current run ID');
  const currentAttempt = currentRunAttempt == null || currentRunAttempt === '' ? null : integer(currentRunAttempt, 'current run attempt', MAX_ATTEMPTS);
  if ((currentId === null) !== (currentAttempt === null)) hold('Current run ID and attempt must be supplied together.');
  const resolvedHead = fullHistoryHead(cwd, head);
  const cutoff = instant - WINDOW_MS;
  const prefix = `repos/${repository}/actions`;
  const invoke = requestJson ?? defaultRequestJson(cwd);
  let requestCount = 0;
  const request = async (endpoint) => {
    if (++requestCount > MAX_REQUESTS) hold('Publication evidence exceeded the bounded API request budget.');
    try { return await invoke(endpoint); } catch (error) { hold(`Cannot authenticate complete publication evidence: ${error.message}`); }
  };
  const workflow = await request(`${prefix}/workflows/deploy.yml`);
  const workflowId = integer(workflow?.id, 'deployment workflow ID');
  if (workflow?.path !== DEPLOY_WORKFLOW_PATH) hold('Deployment workflow identity does not match.');
  const endpoint = `${prefix}/workflows/deploy.yml/runs`;
  const inventory = await pages(request, endpoint, 'workflow_runs');
  const context = { repository, workflowId, now: instant };
  const attempts = [];
  for (const raw of inventory) {
    const run = trustedRun(raw, context);
    if (run.attempt === 1) attempts.push(run);
    else {
      for (let attempt = 1; attempt <= run.attempt; attempt += 1) {
        const evidence = trustedRun(await request(`${prefix}/runs/${run.id}/attempts/${attempt}`), context);
        if (evidence.attempt !== attempt || !sameRunIdentity(evidence, run)
          || (attempt < run.attempt && evidence.status !== 'completed')
          || (attempt === run.attempt && (evidence.status !== run.status || evidence.conclusion !== run.conclusion))) hold('Missing, changed or inconsistent workflow rerun-attempt evidence.');
        // GitHub's list and attempt resources can disagree by a second even
        // after completion. Retain the later conservative upper bound.
        if (attempt === run.attempt) evidence.updated = Math.max(evidence.updated, run.updated);
        attempts.push(evidence);
      }
    }
  }
  for (const run of attempts.filter((item) => item.status !== 'completed')) {
    if (!run.trusted || run.id !== currentId || run.attempt !== currentAttempt || run.head_sha !== resolvedHead || run.status !== 'in_progress') hold(`Another production deployment ${run.id}/${run.attempt} is active; wait for its terminal evidence.`);
  }
  let baseline;
  const completed = attempts.filter((run) => run.status === 'completed').sort((a, b) => b.updated - a.updated || b.id - a.id || b.attempt - a.attempt);
  for (const run of completed) {
    if (baseline && run.updated < baseline.time) break;
    if (!run.trusted || run.lower > cutoff) continue;
    const candidate = await deployedBefore(request, prefix, run, cutoff);
    if (candidate && (!baseline || candidate.time > baseline.time)) baseline = candidate;
    else if (candidate && candidate.time === baseline?.time && candidate.run.head_sha !== baseline.run.head_sha) hold('Simultaneous deployment baselines have inconsistent source commits.');
  }
  if (!baseline) hold('No authentic successful production deployment is proven at or before the seven-day cutoff.');
  if (completed.some((run) => !run.trusted && run.updated >= baseline.time)) hold('An unsupported deployment event, branch or fork may have exposed production after the trusted baseline.');
  const snapshots = new Map();
  const readSnapshot = (sha) => {
    if (!snapshots.has(sha)) snapshots.set(sha, snapshot(cwd, sha, resolvedHead));
    return snapshots.get(sha);
  };
  const baselineFiles = readSnapshot(baseline.run.head_sha);
  const files = new Set();
  const missingBaselineFiles = new Set();
  const presentAfterBaseline = new Set();
  const later = completed.filter((run) => run.updated >= baseline.time
    && !(run.id === baseline.run.id && run.attempt === baseline.run.attempt));
  const addSnapshot = (candidate) => {
    for (const file of candidate) {
      presentAfterBaseline.add(file);
      if (!baselineFiles.has(file)) files.add(file);
    }
    for (const file of baselineFiles) if (!candidate.has(file)) missingBaselineFiles.add(file);
  };
  for (const run of later) addSnapshot(readSnapshot(run.head_sha));
  const proposed = readSnapshot(resolvedHead);
  addSnapshot(proposed);
  // A previously published URL can be removed then reintroduced. Failed runs
  // may partly expose either tree, so conservatively charge every such URL.
  for (const file of missingBaselineFiles) if (presentAfterBaseline.has(file)) files.add(file);
  const prospectiveFiles = [...proposed].filter((file) => !baselineFiles.has(file) || missingBaselineFiles.has(file)).sort();
  // Detect pagination races, old-run reruns, and completion changes during the
  // inspection. No date filter or assumed page ordering can replace this check.
  const finalInventory = await pages(request, endpoint, 'workflow_runs');
  if (inventorySignature(finalInventory) !== inventorySignature(inventory)) hold('Deployment history changed during inspection; retry with stable evidence.');
  const violations = [];
  if (files.size > limit) violations.push(`The actual-publication rolling seven-day ceiling of ${limit} is exceeded. No further publication or deployment is allowed.`);
  if (requireSlot && files.size >= limit) violations.push('No new-page slot remains under actual-publication evidence. Improve an existing URL or publish nothing.');
  return {
    start: new Date(cutoff).toISOString(), end: new Date(instant).toISOString(), limit,
    files: [...files].sort(), prospectiveFiles, violations, allowed: violations.length === 0,
    evidenceCount: inventory.length, reconstructedAttempts: attempts.length, requestCount,
    baseline: {
      runId: baseline.run.id, runAttempt: baseline.run.attempt, headSha: baseline.run.head_sha,
      deployedAt: new Date(baseline.time).toISOString(),
      source: `https://github.com/${repository}/actions/runs/${baseline.run.id}/job/${baseline.jobId}`,
    },
  };
}
