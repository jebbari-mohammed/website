import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { saveYouTubeCredential } from './youtube-auth-output.mjs';

test('OAuth output is private and cannot overwrite a file or follow a symlink', () => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'izem-oauth-fixture-'));
  try {
    const file=path.join(root,'credential.json');
    const synthetic={YOUTUBE_CLIENT_ID:'FAKE_ID',YOUTUBE_CLIENT_SECRET:'FAKE_SECRET',YOUTUBE_REFRESH_TOKEN:'FAKE_TOKEN'};
    saveYouTubeCredential(file,synthetic);
    assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),synthetic);
    assert.equal(fs.statSync(file).mode & 0o777,0o600);
    assert.throws(()=>saveYouTubeCredential(file,synthetic),/EEXIST/);
    const link=path.join(root,'link.json'); fs.symlinkSync(file,link);
    assert.throws(()=>saveYouTubeCredential(link,synthetic),/EEXIST/);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});
