import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('tools/sync-video-pages.mjs');
let source = fs.readFileSync(file, 'utf8');

const oldBlock = `  next = next.replace(/<a\\b[^>]*data-izem-video-card\\s*=\\s*(["'])true\\1[^>]*>[\\s\\S]*?<\\/a>/gi, (card) => {
    const id = attribute(card, 'data-video-id') || ''
    const video = videoMap.get(id)
    return video ? renderArticleVideoCard(video) : card
  })`;

const newBlock = `  next = next.replace(/<a\\b[^>]*data-izem-video-card\\s*=\\s*(["'])true\\1[^>]*>[\\s\\S]*?<\\/a>/gi, (card) => {
    const id = attribute(card, 'data-video-id') || ''
    if (!videoMap.has(id)) return card
    return card.replace(/(<img\\b[^>]*\\bsrc\\s*=\\s*)(["'])[^"']*\\2/i, (_match, prefix, quote) =>
      \`\${prefix}\${quote}\${thumbnailUrl(id)}\${quote}\`,
    )
  })`;

if (!source.includes(oldBlock)) throw new Error('Existing-card migration block not found');
source = source.replace(oldBlock, newBlock);
fs.writeFileSync(file, source);
console.log('Updated existing video-card migration to preserve all card text/markup except image src.');
