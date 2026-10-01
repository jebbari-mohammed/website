import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { inspectPublicationWindow, ROLLING_WINDOW_MS } from './weekly-publish-guard.mjs';

const NOW = new Date('2026-09-28T12:00:00Z'); // Monday: last week's posts still count.
const SCRIPT = fileURLToPath(new URL('./weekly-publish-guard.mjs', import.meta.url));
const POST = (name) => `public/blog/${name}.html`;

function repository(t, { initial = true } = {}) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'izem-publish-guard-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  const git = (args, env = {}) => execFileSync('git', args, {
    cwd, encoding: 'utf8', env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  git(['init', '-b', 'main']);
  git(['config', 'user.name', 'Release tester']);
  git(['config', 'user.email', 'release@example.test']);
  const write = (file, value = '<html>Article</html>') => {
    fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
    fs.writeFileSync(path.join(cwd, file), value);
  };
  const remove = (file) => fs.unlinkSync(path.join(cwd, file));
  const commit = (date, options = {}) => {
    git(['add', '-A']);
    git(['commit', '--allow-empty', '-m', 'Fixture change'], {
      GIT_COMMITTER_DATE: date,
      GIT_AUTHOR_DATE: options.authorDate || date,
      GIT_AUTHOR_NAME: options.author || 'Release tester',
      GIT_AUTHOR_EMAIL: options.email || 'release@example.test',
    });
    return git(['rev-parse', 'HEAD']);
  };
  const add = (name, date, options) => {
    write(POST(name));
    return commit(date, options);
  };
  if (initial) {
    write('README.md', 'Fixture repository');
    commit('2026-08-01T12:00:00Z');
  }
  return {
    cwd, git, write, remove, commit, add,
    check: (options = {}) => inspectPublicationWindow({ cwd, now: NOW, ...options }),
    cli: (args = [], env = {}) => spawnSync(process.execPath, [SCRIPT, ...args], {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, SEO_WEEKLY_NEW_POST_LIMIT: '3', SEO_PUBLISH_OVERRIDE: '', ...env },
    }),
  };
}

test('an unchanged repository has three available slots', (t) => {
  const repo = repository(t);
  const result = repo.check({ requireSlot: true });
  assert.equal(result.allowed, true);
  assert.deepEqual(result.files, []);
  assert.equal(result.limit, 3);
  assert.equal(new Date(result.end) - new Date(result.start), ROLLING_WINDOW_MS);
});

test('Monday does not reset the cap and all human/bot authors count', (t) => {
  const repo = repository(t);
  repo.add('friday', '2026-09-25T12:00:00Z', { author: 'Human editor' });
  repo.add('saturday', '2026-09-26T12:00:00Z', { author: 'github-actions[bot]' });
  repo.add('sunday', '2026-09-27T12:00:00Z', { author: 'Other publisher' });
  assert.equal(repo.check().allowed, true, 'the third release may finish');
  const result = repo.check({ requireSlot: true });
  assert.equal(result.allowed, false);
  assert.equal(result.files.length, 3);
  assert.match(result.violations.join(' '), /No new-page slot/);
  repo.add('monday', '2026-09-28T10:00:00Z');
  assert.equal(repo.check().allowed, false);
});

test('the exact 168-hour boundary expires while now is included', (t) => {
  const repo = repository(t);
  repo.add('expired', '2026-09-21T12:00:00Z');
  repo.add('inside', '2026-09-21T12:00:01Z');
  repo.add('now', NOW.toISOString());
  assert.deepEqual(repo.check().files, [POST('inside'), POST('now')]);
});

test('only top-level English posts count, using safe filename parsing', (t) => {
  const repo = repository(t);
  for (const file of [
    'public/blog/index.html', 'public/blog/fr/translated.html',
    'public/blog/nested/post.html', 'public/fr/blog/post.html',
    'public/blog/assets/illustration.html', 'public/blog/image.svg',
    'public/landing-page.html', POST('post with "quotes" and\nnewline'),
  ]) repo.write(file);
  repo.commit('2026-09-27T12:00:00Z');
  const result = repo.check();
  assert.equal(result.allowed, true);
  assert.deepEqual(result.files, [POST('post with "quotes" and\nnewline')]);
});

test('a backdated author date cannot hide a current publication', (t) => {
  const repo = repository(t);
  repo.add('current', '2026-09-27T12:00:00Z', { authorDate: '2025-01-01T12:00:00Z' });
  assert.deepEqual(repo.check().files, [POST('current')]);
});

test('complete traversal finds recent ancestors behind an old-dated commit', (t) => {
  const repo = repository(t);
  repo.add('recent', '2026-09-27T12:00:00Z');
  repo.commit('2026-08-02T12:00:00Z');
  assert.deepEqual(repo.check().files, [POST('recent')]);
});

test('a merge counts old branch content when it enters the release history', (t) => {
  const repo = repository(t);
  repo.git(['switch', '-c', 'article']);
  repo.add('old-branch-article', '2026-08-05T12:00:00Z');
  repo.git(['switch', 'main']);
  repo.git(['merge', '--no-ff', 'article', '-m', 'Publish article'], {
    GIT_AUTHOR_DATE: '2026-09-27T12:00:00Z',
    GIT_COMMITTER_DATE: '2026-09-27T12:00:00Z',
  });
  const result = repo.check();
  assert.equal(result.allowed, true);
  assert.deepEqual(result.files, [POST('old-branch-article')]);
  assert.deepEqual(result.runFiles, result.files);
});

test('unmerged branches do not count as published and merged URLs count once', (t) => {
  const repo = repository(t);
  repo.git(['switch', '-c', 'draft']);
  repo.add('draft', '2026-09-26T12:00:00Z');
  repo.git(['switch', 'main']);
  assert.deepEqual(repo.check().files, []);
  repo.git(['merge', '--no-ff', 'draft', '-m', 'Publish draft'], {
    GIT_AUTHOR_DATE: '2026-09-27T12:00:00Z',
    GIT_COMMITTER_DATE: '2026-09-27T12:00:00Z',
  });
  assert.deepEqual(repo.check().files, [POST('draft')]);
});

test('deleting a recent post does not recover its weekly slot', (t) => {
  const repo = repository(t);
  repo.add('removed', '2026-09-25T12:00:00Z');
  repo.remove(POST('removed'));
  repo.commit('2026-09-26T12:00:00Z');
  assert.deepEqual(repo.check().files, [POST('removed')]);
});

test('reintroductions count, deduplicated by URL within the same window', (t) => {
  const repo = repository(t);
  repo.add('returning', '2026-08-05T12:00:00Z');
  repo.remove(POST('returning'));
  repo.commit('2026-09-24T12:00:00Z');
  repo.add('returning', '2026-09-25T12:00:00Z');
  repo.remove(POST('returning'));
  repo.commit('2026-09-26T12:00:00Z');
  repo.add('returning', '2026-09-27T12:00:00Z');
  assert.deepEqual(repo.check().files, [POST('returning')]);
});

test('renaming an old post to a new URL consumes a slot', (t) => {
  const repo = repository(t);
  repo.add('old-url', '2026-08-05T12:00:00Z');
  repo.git(['mv', POST('old-url'), POST('new-url')]);
  repo.commit('2026-09-27T12:00:00Z');
  assert.deepEqual(repo.check().files, [POST('new-url')]);
});

test('root-commit publications are counted', (t) => {
  const repo = repository(t, { initial: false });
  repo.add('first', '2026-09-27T12:00:00Z');
  const result = repo.check();
  assert.equal(result.allowed, true);
  assert.deepEqual(result.files, [POST('first')]);
  assert.deepEqual(result.runFiles, [POST('first')]);
});

test('one run cannot add two posts even when weekly capacity remains', (t) => {
  const repo = repository(t);
  repo.write(POST('one'));
  repo.write(POST('two'));
  repo.commit('2026-09-27T12:00:00Z');
  const result = repo.check();
  assert.equal(result.files.length, 2);
  assert.equal(result.allowed, false);
  assert.match(result.violations.join(' '), /at most one/);
});

test('an explicit run base covers multiple commits and transient additions', (t) => {
  const repo = repository(t);
  const base = repo.git(['rev-parse', 'HEAD']);
  repo.add('one', '2026-09-25T12:00:00Z');
  repo.add('two', '2026-09-26T12:00:00Z');
  repo.remove(POST('one'));
  repo.commit('2026-09-27T12:00:00Z');
  const result = repo.check({ base });
  assert.equal(result.allowed, false);
  assert.deepEqual(result.runFiles, [POST('one'), POST('two')]);
  assert.deepEqual(repo.check({ base: 'HEAD' }).runFiles, []);
});

test('old-dated additions in the release run fail closed rather than receiving a temporary slot', (t) => {
  const repo = repository(t);
  for (const day of [25, 26, 27]) repo.add(`post-${day}`, `2026-09-${day}T12:00:00Z`);
  const base = repo.git(['rev-parse', 'HEAD']);
  repo.add('backdated', '2026-08-05T12:00:00Z');
  assert.throws(() => repo.check({ base }), /outside the rolling seven-day window/);
  assert.throws(() => repo.check(), /outside the rolling seven-day window/);
});

test('consecutive runs cannot reuse capacity through separate backdated additions', (t) => {
  const repo = repository(t);
  for (const name of ['one', 'two', 'three', 'four']) {
    const base = repo.git(['rev-parse', 'HEAD']);
    repo.add(name, '2026-08-05T12:00:00Z');
    assert.throws(() => repo.check({ base }), /publication time cannot be verified for subsequent runs/);
  }
});

test('a run-added publication exactly at the expired boundary also fails closed', (t) => {
  const repo = repository(t);
  const base = repo.git(['rev-parse', 'HEAD']);
  repo.add('expired-release', '2026-09-21T12:00:00Z');
  assert.throws(() => repo.check({ base }), /outside the rolling seven-day window/);
});

test('pre-creation checks do not treat a previous run as this run', (t) => {
  const repo = repository(t);
  repo.write(POST('one'));
  repo.write(POST('two'));
  repo.commit('2026-09-27T12:00:00Z');
  assert.equal(repo.check({ requireSlot: true }).allowed, true);
});

test('staged and untracked additions are included before committing', (t) => {
  const repo = repository(t);
  repo.write(POST('staged'));
  repo.git(['add', POST('staged')]);
  repo.write(POST('untracked'));
  const result = repo.check({ base: 'HEAD' });
  assert.equal(result.allowed, false);
  assert.deepEqual(result.pendingFiles, [POST('staged'), POST('untracked')]);
  assert.deepEqual(result.files, result.pendingFiles);
  assert.deepEqual(result.runFiles, result.pendingFiles);
});

test('a staged addition deleted from the worktree still counts', (t) => {
  const repo = repository(t);
  repo.write(POST('staged'));
  repo.git(['add', POST('staged')]);
  repo.remove(POST('staged'));
  assert.deepEqual(repo.check().pendingFiles, [POST('staged')]);
});

test('pending post additions cannot exceed an already-full weekly cap', (t) => {
  const repo = repository(t);
  for (const day of [25, 26, 27]) repo.add(`post-${day}`, `2026-09-${day}T12:00:00Z`);
  repo.write(POST('fourth'));
  const result = repo.check({ base: 'HEAD' });
  assert.equal(result.allowed, false);
  assert.equal(result.files.length, 4);
  assert.equal(result.runFiles.length, 1);
});

test('existing-page edits and pending translations do not count', (t) => {
  const repo = repository(t);
  repo.add('existing', '2026-08-05T12:00:00Z');
  repo.write(POST('existing'), 'Updated article');
  repo.write('public/blog/index.html', 'Updated index');
  repo.write('public/blog/fr/new-translation.html');
  assert.deepEqual(repo.check({ base: 'HEAD' }).files, []);
});

test('shallow history fails closed instead of silently undercounting', (t) => {
  const repo = repository(t);
  repo.add('published', '2026-09-27T12:00:00Z');
  const clone = fs.mkdtempSync(path.join(os.tmpdir(), 'izem-shallow-'));
  t.after(() => fs.rmSync(clone, { recursive: true, force: true }));
  execFileSync('git', ['clone', '--depth=1', pathToFileURL(repo.cwd).href, clone], { stdio: 'pipe' });
  assert.throws(() => inspectPublicationWindow({ cwd: clone, now: NOW }), /Full Git history/);
});

test('local Git replacement refs cannot hide earlier publication history', (t) => {
  const repo = repository(t);
  const initial = repo.git(['rev-parse', 'HEAD']);
  const added = repo.add('published', '2026-09-27T12:00:00Z');
  repo.commit('2026-09-28T10:00:00Z');
  repo.git(['replace', added, initial]);
  assert.deepEqual(repo.check().files, [POST('published')]);
});

test('legacy Git grafts fail closed instead of truncating history', (t) => {
  const repo = repository(t);
  const head = repo.add('published', '2026-09-27T12:00:00Z');
  repo.write('.git/info/grafts', `${head}\n`);
  assert.throws(() => repo.check(), /grafts obscure publication history/);
});

test('future-dated publication fails closed', (t) => {
  const repo = repository(t);
  repo.add('future', '2026-09-28T12:00:01Z');
  assert.throws(() => repo.check(), /Future-dated publication/);
});

test('a lower configured ceiling is honored and raising it is rejected', (t) => {
  const repo = repository(t);
  repo.add('one', '2026-09-25T12:00:00Z');
  repo.add('two', '2026-09-26T12:00:00Z');
  assert.equal(repo.check({ limit: 1 }).allowed, false);
  for (const limit of [0, -1, 4, 10, 2.5, 'NaN', '', null]) {
    assert.throws(() => repo.check({ limit }), /ceiling cannot be raised/);
  }
});

test('invalid history refs, run bases, and dates fail closed', (t) => {
  const repo = repository(t);
  const initial = repo.git(['rev-parse', 'HEAD']);
  repo.git(['switch', '-c', 'unmerged']);
  const other = repo.add('unmerged', '2026-09-25T12:00:00Z');
  repo.git(['switch', 'main']);
  repo.add('main', '2026-09-26T12:00:00Z');
  assert.throws(() => repo.check({ head: 'missing-ref' }));
  assert.throws(() => repo.check({ base: 'missing-ref' }));
  assert.throws(() => repo.check({ base: other }), /first-parent history/);
  assert.throws(() => repo.check({ head: initial }), /match the checkout/);
  assert.throws(() => repo.check({ now: 'not-a-date' }), /invalid current time/);
  assert.deepEqual(repo.check({ head: initial, includeWorktree: false }).files, []);
});

test('CLI overrides cannot bypass the cap or raise it', (t) => {
  const repo = repository(t);
  const recent = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  for (const name of ['one', 'two', 'three']) repo.add(name, recent);
  let result = repo.cli(['--require-slot'], { SEO_PUBLISH_OVERRIDE: 'true' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /No new-page slot/);
  result = repo.cli([], { SEO_WEEKLY_NEW_POST_LIMIT: '10', SEO_PUBLISH_OVERRIDE: 'true' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /ceiling cannot be raised/);
  repo.add('four', recent);
  result = repo.cli([], { SEO_PUBLISH_OVERRIDE: 'true' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /ceiling of 3 is exceeded/);
});

test('CLI validates arguments and supports explicit run boundaries', (t) => {
  const repo = repository(t);
  const base = repo.git(['rev-parse', 'HEAD']);
  const recent = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  repo.add('one', recent);
  const head = repo.add('two', recent);
  const result = repo.cli([`--base=${base}`, '--head', head]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /at most one/);
  assert.equal(repo.cli(['--commit-history-only', '--base', 'HEAD', '--head=HEAD']).status, 2);
  for (const args of [['--base'], ['--head='], ['--now', NOW.toISOString()], ['--unknown']]) {
    assert.equal(repo.cli(args).status, 1);
  }
});
