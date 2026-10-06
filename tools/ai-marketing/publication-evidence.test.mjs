import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DEPLOY_STEP_NAME, DEPLOY_WORKFLOW_PATH, inspectPublicationEvidence } from './publication-evidence.mjs';

const NOW = '2026-10-01T12:00:00Z';
const CUTOFF = '2026-09-24T12:00:00Z';
const OLD = '2026-09-23T12:00:00Z';
const RECENT = '2026-09-29T12:00:00Z';
const REPOSITORY = 'jebbari-mohammed/website';
const PREFIX = `repos/${REPOSITORY}/actions`;
const WORKFLOW_ID = 248195500;
const POST = (name) => `public/blog/${name}.html`;
const iso = (time, offset = 0) => new Date(Date.parse(time) + offset).toISOString();

function fixture(t) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'izem-publication-evidence-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }));
  const git = (args) => execFileSync('git', ['-c', 'gc.auto=0', '-c', 'maintenance.auto=false', ...args], {
    cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, GIT_AUTHOR_DATE: '2020-01-01T00:00:00Z', GIT_COMMITTER_DATE: '2020-01-01T00:00:00Z' },
  }).trim();
  git(['init', '-b', 'main']);
  git(['config', 'user.name', 'Publication evidence tester']);
  git(['config', 'user.email', 'release@example.test']);
  const write = (file, value = '<html>Evidence fixture</html>') => {
    fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
    fs.writeFileSync(path.join(cwd, file), value);
  };
  const commit = () => {
    git(['add', '-A']);
    git(['commit', '--allow-empty', '-m', 'Evidence fixture']);
    return git(['rev-parse', 'HEAD']);
  };
  const add = (name) => { write(POST(name)); return commit(); };
  const remove = (name) => { fs.unlinkSync(path.join(cwd, POST(name))); return commit(); };
  write('README.md', 'Publication fixture');
  const root = add('existing');
  return {
    cwd, git, write, commit, add, remove, root,
    check: (requestJson, options = {}) => inspectPublicationEvidence({
      cwd, now: NOW, repository: REPOSITORY, currentRunId: null, currentRunAttempt: null, requestJson, ...options,
    }),
  };
}

function run(id, sha, completedAt = OLD, overrides = {}) {
  return {
    id, workflow_id: WORKFLOW_ID, path: DEPLOY_WORKFLOW_PATH,
    repository: { full_name: REPOSITORY }, head_repository: { full_name: REPOSITORY },
    head_sha: sha, head_branch: 'main', event: 'push', run_attempt: 1,
    status: 'completed', conclusion: 'success',
    created_at: iso(completedAt, -60000), updated_at: iso(completedAt, 10000),
    ...overrides,
  };
}

function jobsFor(runValue, { deploy = 'success', completedAt = iso(runValue.updated_at, -10000) } = {}) {
  return {
    total_count: 1,
    jobs: [{
      id: runValue.id * 100 + runValue.run_attempt,
      run_id: runValue.id, run_attempt: runValue.run_attempt, head_sha: runValue.head_sha,
      status: 'completed', conclusion: runValue.conclusion,
      completed_at: iso(runValue.updated_at, -1000),
      steps: [{
        name: DEPLOY_STEP_NAME, status: 'completed', conclusion: deploy,
        started_at: iso(completedAt, -1000), completed_at: completedAt,
      }],
    }],
  };
}

function api(runs, { attempts = [], jobs = {}, transform } = {}) {
  const calls = [];
  const allRuns = [...runs, ...attempts];
  const request = async (endpoint) => {
    calls.push(endpoint);
    let result;
    if (endpoint === `${PREFIX}/workflows/deploy.yml`) result = { id: WORKFLOW_ID, path: DEPLOY_WORKFLOW_PATH };
    else if (endpoint.startsWith(`${PREFIX}/workflows/deploy.yml/runs?`)) {
      const page = Number(new URLSearchParams(endpoint.split('?')[1]).get('page'));
      result = { total_count: runs.length, workflow_runs: runs.slice((page - 1) * 100, page * 100) };
    } else {
      const match = endpoint.match(/\/runs\/(\d+)\/attempts\/(\d+)(\/jobs\?per_page=100&page=(\d+))?$/);
      if (!match) throw new Error(`Unexpected endpoint: ${endpoint}`);
      const item = [...allRuns].reverse().find((r) => r.id === Number(match[1]) && r.run_attempt === Number(match[2]));
      if (!item) throw new Error('Missing attempt fixture');
      result = match[3] ? (jobs[`${match[1]}/${match[2]}`] ?? jobsFor(item)) : item;
      if (match[3] && result.jobs?.length > 100) {
        const page = Number(match[4]);
        result = { ...result, jobs: result.jobs.slice((page - 1) * 100, page * 100) };
      }
    }
    result = structuredClone(result);
    return transform ? transform(result, endpoint, calls) : result;
  };
  request.calls = calls;
  return request;
}

test('backdated Git timestamps cannot hide an unpublished proposed URL', async (t) => {
  const repo = fixture(t);
  repo.add('backdated');
  const request = api([run(1, repo.root)]);
  const result = await repo.check(request);
  assert.equal(result.allowed, true);
  assert.deepEqual(result.files, [POST('backdated')]);
  assert.deepEqual(result.prospectiveFiles, result.files);
  assert.equal(result.baseline.headSha, repo.root);
  assert.equal(result.baseline.deployedAt, iso(OLD));
  assert.match(result.baseline.source, /\/actions\/runs\/1\/job\/101$/);
  assert.equal(result.evidenceCount, 1);
  assert.equal(result.start, iso(CUTOFF));
});

test('four unpublished source additions block the cap regardless of commit dates', async (t) => {
  const repo = fixture(t);
  for (const name of ['one', 'two', 'three', 'four']) repo.add(name);
  const result = await repo.check(api([run(1, repo.root)]));
  assert.equal(result.allowed, false);
  assert.equal(result.files.length, 4);
  assert.match(result.violations.join(' '), /ceiling of 3/);
});

test('three slots may finish deployment but cannot create another post', async (t) => {
  const repo = fixture(t);
  for (const name of ['one', 'two', 'three']) repo.add(name);
  assert.equal((await repo.check(api([run(1, repo.root)]))).allowed, true);
  assert.equal((await repo.check(api([run(1, repo.root)]), { requireSlot: true })).allowed, false);
});

test('recently exposed URLs still count after deletion from the proposed head', async (t) => {
  const repo = fixture(t);
  const published = repo.add('removed');
  repo.remove('removed');
  const result = await repo.check(api([run(2, published, RECENT), run(1, repo.root)]));
  assert.deepEqual(result.files, [POST('removed')]);
  assert.deepEqual(result.prospectiveFiles, []);
});

for (const conclusion of ['failure', 'cancelled', 'timed_out', 'skipped']) {
  test(`a long-running ${conclusion} attempt counts using its completion upper bound`, async (t) => {
    const repo = fixture(t);
    const published = repo.add('late-exposure');
    repo.remove('late-exposure');
    const late = run(2, published, RECENT, { conclusion, created_at: '2026-09-22T12:00:00Z' });
    const result = await repo.check(api([late, run(1, repo.root)], { jobs: { '2/1': jobsFor(late, { deploy: conclusion }) } }));
    assert.deepEqual(result.files, [POST('late-exposure')]);
    assert.equal(result.baseline.runId, 1);
  });
}

test('a successful overall run with skipped deployment cannot advance the baseline', async (t) => {
  const repo = fixture(t);
  const skippedHead = repo.add('never-proven-deployed');
  const skipped = run(2, skippedHead, iso(CUTOFF, -1000));
  const result = await repo.check(api([skipped, run(1, repo.root)], { jobs: { '2/1': jobsFor(skipped, { deploy: 'skipped' }) } }));
  assert.equal(result.baseline.runId, 1);
  assert.deepEqual(result.files, [POST('never-proven-deployed')]);
});

test('an actual deploy before cutoff proves baseline even when later smoke failed', async (t) => {
  const repo = fixture(t);
  const deployed = repo.add('already-exposed');
  const failedSmoke = run(2, deployed, CUTOFF, { conclusion: 'failure', updated_at: iso(CUTOFF, 120000) });
  const result = await repo.check(api([failedSmoke, run(1, repo.root)], {
    jobs: { '2/1': jobsFor(failedSmoke, { completedAt: CUTOFF }) },
  }));
  assert.equal(result.baseline.runId, 2);
  assert.deepEqual(result.files, []);
});

test('deploy completion just after cutoff does not prove an expired baseline', async (t) => {
  const repo = fixture(t);
  const deployed = repo.add('inside');
  const crossing = run(2, deployed, iso(CUTOFF, 1000));
  const result = await repo.check(api([crossing, run(1, repo.root)]));
  assert.equal(result.baseline.runId, 1);
  assert.deepEqual(result.files, [POST('inside')]);
});

test('the latest actual step wins even when an older deploy has later smoke completion', async (t) => {
  const repo = fixture(t);
  const first = repo.add('first');
  const second = repo.add('second');
  const older = run(2, first, iso(CUTOFF, -60000), { updated_at: iso(CUTOFF, 100000) });
  const newer = run(3, second, iso(CUTOFF, -30000));
  const result = await repo.check(api([older, newer, run(1, repo.root)], {
    jobs: { '2/1': jobsFor(older, { completedAt: iso(CUTOFF, -60000) }) },
  }));
  assert.equal(result.baseline.runId, 3);
  // The still-running older deployment's ambiguous exposure is conservatively
  // treated as a possible rollback and reintroduction of the second URL.
  assert.deepEqual(result.files, [POST('second')]);
});

test('deleting then reintroducing a baseline URL consumes a slot', async (t) => {
  const repo = fixture(t);
  const deleted = repo.remove('existing');
  repo.add('existing');
  const result = await repo.check(api([run(2, deleted, RECENT), run(1, repo.root)]));
  assert.deepEqual(result.files, [POST('existing')]);
});

test('all rerun attempts are reconstructed, including an old run retried recently', async (t) => {
  const repo = fixture(t);
  const prior = repo.add('rerun-post');
  repo.remove('rerun-post');
  const baseline = run(3, repo.git(['rev-parse', 'HEAD']));
  const first = run(1, prior, '2026-08-01T12:00:00Z');
  const second = run(1, prior, RECENT, { run_attempt: 2, conclusion: 'failure' });
  const listed = { ...second, created_at: first.created_at, updated_at: iso(second.updated_at, -1000) };
  const request = api([baseline, listed], { attempts: [first, second] });
  const result = await repo.check(request);
  assert.deepEqual(result.files, [POST('rerun-post')]);
  assert.equal(result.reconstructedAttempts, 3);
  assert.ok(request.calls.includes(`${PREFIX}/runs/1/attempts/1`));
  assert.ok(request.calls.includes(`${PREFIX}/runs/1/attempts/2`));
});

test('an earlier rerun attempt can prove cutoff baseline independently of the recent attempt', async (t) => {
  const repo = fixture(t);
  const source = repo.add('earlier-exposure');
  const first = run(2, source, iso(CUTOFF, -30000));
  const second = run(2, source, RECENT, { run_attempt: 2 });
  const request = api([second, run(1, repo.root)], { attempts: [first, second] });
  const result = await repo.check(request);
  assert.equal(result.baseline.runId, 2);
  assert.equal(result.baseline.runAttempt, 1);
  assert.deepEqual(result.files, []);
  assert.ok(request.calls.includes(`${PREFIX}/runs/2/attempts/1/jobs?per_page=100&page=1`));
});

test('a retry start slightly earlier than creation is a valid lower bound', async (t) => {
  const repo = fixture(t);
  const baseline = run(1, repo.root, OLD, { run_started_at: iso(OLD, -62000) });
  assert.equal((await repo.check(api([baseline]))).allowed, true);
});

test('full pagination includes old listed records and lazy baseline lookup avoids old jobs', async (t) => {
  const repo = fixture(t);
  const records = Array.from({ length: 205 }, (_, index) => run(index + 1, repo.root, '2026-08-01T12:00:00Z'));
  records[204] = run(205, repo.root, OLD);
  const request = api(records);
  const result = await repo.check(request);
  assert.equal(result.evidenceCount, 205);
  assert.equal(result.baseline.runId, 205);
  assert.equal(request.calls.filter((call) => call.includes('/jobs?')).length, 1);
  assert.equal(request.calls.filter((call) => call.endsWith('/runs?per_page=100&page=3')).length, 2);
});

test('only top-level English HTML URLs count and unusual names remain exact', async (t) => {
  const repo = fixture(t);
  const strange = POST('space "quote" and\nnewline');
  for (const file of [strange, 'public/blog/index.html', 'public/blog/fr/article.html', 'public/fr/blog/post.html', 'public/landing.html']) repo.write(file);
  repo.commit();
  assert.deepEqual((await repo.check(api([run(1, repo.root)]))).files, [strange]);
});

test('verified current deployment is counted prospectively without requiring current jobs', async (t) => {
  const repo = fixture(t);
  const head = repo.add('current');
  const active = run(2, head, RECENT, { status: 'in_progress', conclusion: null });
  const request = api([active, run(1, repo.root)]);
  const result = await repo.check(request, { currentRunId: '2', currentRunAttempt: '1' });
  assert.deepEqual(result.files, [POST('current')]);
  assert.ok(!request.calls.some((call) => call.includes('/runs/2/attempts/1/jobs')));
});

for (const reason of ['different ID', 'different attempt', 'different SHA', 'queued status', 'non-main manual']) {
  test(`an active deployment HOLDs with ${reason}`, async (t) => {
    const repo = fixture(t);
    const head = repo.add('current');
    const active = run(2, head, RECENT, { status: 'in_progress', conclusion: null });
    const options = { currentRunId: 2, currentRunAttempt: 1 };
    if (reason === 'different ID') options.currentRunId = 3;
    if (reason === 'different attempt') options.currentRunAttempt = 2;
    if (reason === 'different SHA') active.head_sha = repo.root;
    if (reason === 'queued status') active.status = 'queued';
    if (reason === 'non-main manual') { active.event = 'workflow_dispatch'; active.head_branch = 'feature'; }
    await assert.rejects(repo.check(api([active, run(1, repo.root)]), options), /Another production deployment/);
  });
}

for (const unsupported of [{ event: 'workflow_run' }, { event: 'workflow_dispatch', head_branch: 'feature' }, { head_repository: { full_name: 'fork/website' } }]) {
  test(`unsupported exposure cannot bypass the cap: ${JSON.stringify(unsupported)}`, async (t) => {
    const repo = fixture(t);
    await assert.rejects(repo.check(api([run(2, repo.root, RECENT, unsupported), run(1, repo.root)])), /unsupported deployment/);
    assert.equal((await repo.check(api([run(2, repo.root, '2026-08-01T12:00:00Z', unsupported), run(1, repo.root)]))).allowed, true);
  });
}

test('a stale current ID does not exempt a separate active deployment', async (t) => {
  const repo = fixture(t);
  const active = run(3, repo.root, RECENT, { status: 'in_progress', conclusion: null });
  await assert.rejects(repo.check(api([active, run(1, repo.root)]), { currentRunId: 2, currentRunAttempt: 1 }), /Another production deployment/);
});

test('missing successful deployment proof HOLDs even with overall success', async (t) => {
  const repo = fixture(t);
  const baseline = run(1, repo.root);
  await assert.rejects(repo.check(api([baseline], { jobs: { '1/1': jobsFor(baseline, { deploy: 'skipped' }) } })), /No authentic successful/);
  await assert.rejects(repo.check(api([])), /No authentic successful/);
});

test('unavailable, non-ancestor and grafted/shallow source histories HOLD', async (t) => {
  const repo = fixture(t);
  await assert.rejects(repo.check(api([run(1, 'a'.repeat(40))])), /missing or is not an ancestor/);
  repo.git(['switch', '-c', 'other']);
  const unrelated = repo.add('other-branch');
  repo.git(['switch', 'main']);
  await assert.rejects(repo.check(api([run(1, unrelated)])), /not an ancestor/);
  repo.write('.git/info/grafts', `${repo.root}\n`);
  await assert.rejects(repo.check(api([run(1, repo.root)])), /grafts/);
  fs.unlinkSync(path.join(repo.cwd, '.git/info/grafts'));
  repo.write('.git/shallow', `${repo.root}\n`);
  await assert.rejects(repo.check(api([run(1, repo.root)])), /Full Git history/);
});

test('unrelated recent exposure cannot be silently dropped as an unmerged branch', async (t) => {
  const repo = fixture(t);
  repo.git(['switch', '-c', 'diverged']);
  const divergent = repo.add('divergent');
  repo.git(['switch', 'main']);
  await assert.rejects(repo.check(api([run(2, divergent, RECENT), run(1, repo.root)])), /not an ancestor/);
});

test('replacement refs do not hide the actual source tree', async (t) => {
  const repo = fixture(t);
  const real = repo.add('real');
  repo.git(['replace', real, repo.root]);
  assert.deepEqual((await repo.check(api([run(1, repo.root)]))).files, [POST('real')]);
});

test('tracked HTML symlinks cannot masquerade as source-backed page snapshots', async (t) => {
  const repo = fixture(t);
  fs.symlinkSync('../../README.md', path.join(repo.cwd, POST('linked')));
  repo.commit();
  await assert.rejects(repo.check(api([run(1, repo.root)])), /regular tracked file/);
});

test('workflow identity, malformed timestamps and invalid policy limits HOLD', async (t) => {
  const repo = fixture(t);
  for (const overrides of [
    { path: '.github/workflows/other.yml' }, { workflow_id: WORKFLOW_ID + 1 },
    { repository: { full_name: 'other/website' } }, { head_sha: 'bad-sha' },
    { created_at: '2026-02-30T12:00:00Z' }, { updated_at: '2027-01-01T00:00:00Z' },
    { run_attempt: 0 }, { conclusion: null }, { status: 'mystery' },
  ]) await assert.rejects(repo.check(api([run(1, repo.root, OLD, overrides)])), /HOLD:/);
  for (const limit of [0, 4, 'unlimited', 2.5]) await assert.rejects(repo.check(api([run(1, repo.root)]), { limit }), /Invalid weekly publication limit/);
  await assert.rejects(repo.check(api([run(1, repo.root)]), { currentRunId: 1 }), /supplied together/);
});

test('missing and mismatched rerun attempt metadata HOLD', async (t) => {
  const repo = fixture(t);
  const second = run(1, repo.root, RECENT, { run_attempt: 2 });
  await assert.rejects(repo.check(api([second])), /Missing attempt/);
  const first = run(1, repo.root, OLD, { head_branch: 'master' });
  await assert.rejects(repo.check(api([second], { attempts: [first] })), /inconsistent workflow rerun/);
});

test('incomplete, duplicate, changing and oversized pagination HOLD', async (t) => {
  const repo = fixture(t);
  const records = Array.from({ length: 101 }, (_, index) => run(index + 1, repo.root));
  for (const alter of [
    (value) => ({ ...value, total_count: value.total_count + 1 }),
    (value) => ({ ...value, workflow_runs: value.workflow_runs.slice(1) }),
    (value) => ({ ...value, workflow_runs: value.workflow_runs.map(() => value.workflow_runs[0]) }),
    (value) => ({ ...value, total_count: 10001 }),
  ]) {
    await assert.rejects(repo.check(api(records, { transform: (value, endpoint) => endpoint.includes('/runs?') ? alter(value) : value })), /pagination evidence|changed while paginating/);
  }
});

test('history changes during the read HOLD instead of returning a stale allowance', async (t) => {
  const repo = fixture(t);
  let inventories = 0;
  const request = api([run(1, repo.root)], {
    transform: (value, endpoint) => {
      if (endpoint.includes('/runs?') && ++inventories === 2) value.workflow_runs[0].updated_at = iso(OLD, 20000);
      return value;
    },
  });
  await assert.rejects(repo.check(request), /history changed during inspection/);
});

test('malformed, truncated and mismatched job proof HOLD', async (t) => {
  const repo = fixture(t);
  const baseline = run(1, repo.root);
  const mutate = [
    (value) => { value.total_count = 2; },
    (value) => { value.jobs[0].run_attempt = 2; },
    (value) => { value.jobs[0].head_sha = 'b'.repeat(40); },
    (value) => { value.jobs[0].steps.push(value.jobs[0].steps[0]); },
    (value) => { value.jobs[0].steps[0].completed_at = RECENT; },
    (value) => { value.jobs[0].steps[0].completed_at = null; },
    (value) => { value.jobs[0].steps[0].status = 'in_progress'; },
    (value) => { value.total_count = 0; value.jobs = []; },
  ];
  for (const change of mutate) {
    const jobs = jobsFor(baseline);
    change(jobs);
    await assert.rejects(repo.check(api([baseline], { jobs: { '1/1': jobs } })), /HOLD:/);
  }
});

test('API errors fail closed without treating unavailable evidence as zero publication', async (t) => {
  const repo = fixture(t);
  await assert.rejects(repo.check(async () => { throw new Error('403 Actions access unavailable'); }), /Cannot authenticate complete publication evidence.*403/);
});

test('master pushes and main/manual dispatch use the same trusted evidence rules', async (t) => {
  const repo = fixture(t);
  repo.add('next');
  for (const overrides of [{ head_branch: 'master' }, { event: 'workflow_dispatch' }]) {
    const result = await repo.check(api([run(1, repo.root, OLD, overrides)]));
    assert.deepEqual(result.files, [POST('next')]);
  }
});

test('the baseline deploy step can appear after the first page of jobs', async (t) => {
  const repo = fixture(t);
  const baseline = run(1, repo.root);
  const proof = jobsFor(baseline);
  const deployJob = proof.jobs[0];
  proof.jobs = Array.from({ length: 100 }, (_, index) => ({ ...deployJob, id: index + 1000, steps: [] }));
  proof.jobs.push(deployJob);
  proof.total_count = proof.jobs.length;
  const request = api([baseline], { jobs: { '1/1': proof } });
  assert.equal((await repo.check(request)).baseline.runId, 1);
  assert.ok(request.calls.includes(`${PREFIX}/runs/1/attempts/1/jobs?per_page=100&page=2`));
});

test('a recent rerun hidden on an old run-list page still consumes its slot', async (t) => {
  const repo = fixture(t);
  const oldSource = repo.add('rerun-visible');
  const deleted = repo.remove('rerun-visible');
  const baseline = run(500, deleted);
  const first = run(1, oldSource, '2026-07-01T12:00:00Z');
  const second = run(1, oldSource, RECENT, { run_attempt: 2, created_at: first.created_at });
  const records = [baseline, ...Array.from({ length: 199 }, (_, index) => run(index + 2, repo.root, '2026-08-01T12:00:00Z')), second];
  const result = await repo.check(api(records, { attempts: [first, { ...second, created_at: iso(RECENT, -60000) }] }));
  assert.equal(result.evidenceCount, 201);
  assert.deepEqual(result.files, [POST('rerun-visible')]);
});

test('a rerun change on an old page is rejected even when the first page stays stable', async (t) => {
  const repo = fixture(t);
  const records = [run(500, repo.root), ...Array.from({ length: 100 }, (_, index) => run(index + 1, repo.root, '2026-08-01T12:00:00Z'))];
  let reads = 0;
  const request = api(records, {
    transform: (value, endpoint) => {
      if (endpoint.includes('/runs?per_page=100&page=2') && ++reads === 2) value.workflow_runs[0].run_attempt = 2;
      return value;
    },
  });
  await assert.rejects(repo.check(request), /history changed during inspection/);
});

test('conflicting successful deployment baselines in the same second HOLD', async (t) => {
  const repo = fixture(t);
  const other = repo.add('other');
  await assert.rejects(repo.check(api([run(2, other), run(1, repo.root)])), /Simultaneous deployment baselines/);
});

test('a possible rollback at the baseline timestamp still charges reintroduction', async (t) => {
  const repo = fixture(t);
  const deleted = repo.remove('existing');
  repo.add('existing');
  const rollback = run(2, deleted, iso(OLD, -1000), { conclusion: 'failure', updated_at: OLD });
  const result = await repo.check(api([run(1, repo.root), rollback], { jobs: { '2/1': jobsFor(rollback, { deploy: 'failure' }) } }));
  assert.deepEqual(result.files, [POST('existing')]);
});
