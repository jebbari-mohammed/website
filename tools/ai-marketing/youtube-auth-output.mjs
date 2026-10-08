import fs from 'node:fs';

export function saveYouTubeCredential(file, credential) {
  if (!credential.YOUTUBE_CLIENT_ID || !credential.YOUTUBE_CLIENT_SECRET || !credential.YOUTUBE_REFRESH_TOKEN) {
    throw new Error('OAuth credential is incomplete');
  }
  // Refuse overwrite/symlink following and never print credential material.
  fs.writeFileSync(file, JSON.stringify(credential, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
}
