import test from 'node:test';
import assert from 'node:assert/strict';
import { assertWorkflowOutput } from './workflow-output-safety.mjs';

test('only safe public HTML files and production URLs are emitted', () => {
  assert.equal(assertWorkflowOutput('files', 'public/blog/safe-file.html,public/tools/index.html'), 'public/blog/safe-file.html,public/tools/index.html');
  assert.equal(assertWorkflowOutput('url', 'https://youraicoach.life/blog/safe-file'), 'https://youraicoach.life/blog/safe-file');
  for (const file of ['public/blog/$(printf BAD).html', 'public/../private.html', 'public/blog/a,b.html', 'public/blog/a\noutput=true.html']) {
    assert.throws(() => assertWorkflowOutput('files', file), /Unsafe/);
  }
  for (const url of ['https://youraicoach.life/$(printf BAD)', 'https://youraicoach.life/%24%28BAD%29', 'https://other.example/safe', 'https://youraicoach.life/safe?token=private', 'https://user@youraicoach.life/safe']) {
    assert.throws(() => assertWorkflowOutput('url', url), /Unsafe/);
  }
  assert.throws(() => assertWorkflowOutput('slug', 'safe$(printf BAD)'), /Unsafe/);
  assert.throws(() => assertWorkflowOutput('marker', 'safe\nchanged=true'), /Unsafe/);
});
