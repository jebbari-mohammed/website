import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { persistCheckpoint } from './article-video-fallback.mjs';

test('real Git pushes only the allowlisted checkpoint, not ignored private marketing data', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'izem-checkpoint-git-'));
  try {
    const repo = path.join(root, 'checkout');
    const remote = path.join(root, 'remote.git');
    fs.mkdirSync(repo);
    execFileSync('git', ['init', '--bare', remote], {stdio: 'ignore'});
    execFileSync('git', ['init', '-b', 'main', repo], {stdio: 'ignore'});
    fs.writeFileSync(path.join(repo, '.gitignore'), 'data/marketing-employee/\n');
    execFileSync('git', ['add', '.gitignore'], {cwd: repo});
    execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'fixture'], {cwd: repo, stdio: 'ignore'});
    execFileSync('git', ['remote', 'add', 'origin', remote], {cwd: repo});
    const file = path.join(repo, 'data/marketing-employee/video-attempts/test-article.json');
    const privateFile = path.join(repo, 'data/marketing-employee/private-report.json');
    fs.mkdirSync(path.dirname(privateFile), {recursive: true});
    fs.writeFileSync(privateFile, 'Private test fixture must stay untracked.');
    persistCheckpoint(repo, file, {slug: 'test-article'}, {...process.env, GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: 'jebbari-mohammed/website', GITHUB_REF: 'refs/heads/main'});
    const tracked = execFileSync('git', ['ls-files'], {cwd: repo, encoding: 'utf8'});
    assert.ok(tracked.includes('video-attempts/test-article.json'));
    assert.ok(!tracked.includes('private-report'));
    const upstream = execFileSync('git', ['--git-dir', remote, 'show', 'main:data/marketing-employee/video-attempts/test-article.json'], {encoding: 'utf8'});
    assert.equal(JSON.parse(upstream).slug, 'test-article');
  } finally { fs.rmSync(root, {recursive: true, force: true}); }
});
