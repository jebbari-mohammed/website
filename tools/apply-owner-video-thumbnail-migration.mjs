import fs from 'node:fs';
import path from 'node:path';

const syncPath = path.resolve('tools/sync-video-pages.mjs');
let source = fs.readFileSync(syncPath, 'utf8');

const oldThumbnail = `function thumbnailUrl(videoId) {
  return \`https://i.ytimg.com/vi/\${videoId}/hqdefault.jpg\`
}
`;

const newThumbnail = `function thumbnailUrl(videoId) {
  return \`\${siteOrigin}\${watchPath(videoId)}thumbnail.svg\`
}

function wrapThumbnailTitle(value, maxChars = 30, maxLines = 3) {
  const words = String(value || 'IZEM video guide').replace(/\\s+/g, ' ').trim().split(' ').filter(Boolean)
  const lines = []
  let current = ''

  for (const word of words) {
    const candidate = current ? \`\${current} \${word}\` : word
    if (!current || candidate.length <= maxChars) {
      current = candidate
      continue
    }
    lines.push(current)
    current = word
  }
  if (current) lines.push(current)

  if (lines.length > maxLines) {
    const visible = lines.slice(0, maxLines)
    const last = visible[maxLines - 1]
    visible[maxLines - 1] = \`\${last.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…\`
    return visible
  }
  return lines.length ? lines : ['IZEM video guide']
}

function renderThumbnail(video) {
  const lines = wrapThumbnailTitle(video.title)
  const titleLines = lines
    .map((line, index) => \`<tspan x="96" dy="\${index === 0 ? 0 : 78}">\${xmlEscape(line)}</tspan>\`)
    .join('')
  return \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720" role="img" aria-labelledby="title desc">
  <title id="title">\${xmlEscape(video.title)}</title>
  <desc id="desc">People-free IZEM video guide thumbnail using typography and abstract fitness-tech graphics.</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#060B1D"/>
      <stop offset="1" stop-color="#0F2A24"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8DFF6A"/>
      <stop offset="1" stop-color="#86D7FF"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <circle cx="1110" cy="120" r="220" fill="#8DFF6A" opacity="0.08"/>
  <circle cx="1160" cy="620" r="300" fill="#86D7FF" opacity="0.07"/>
  <path d="M760 590 C860 500 940 520 1030 420 S1170 290 1240 330" fill="none" stroke="url(#accent)" stroke-width="16" stroke-linecap="round" opacity="0.42"/>
  <rect x="96" y="78" width="250" height="58" rx="29" fill="#111C2A" stroke="#8DFF6A" stroke-opacity="0.55"/>
  <text x="221" y="116" fill="#D8FF86" font-family="system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="26" font-weight="800" text-anchor="middle" letter-spacing="2">IZEM VIDEO GUIDE</text>
  <text x="96" y="286" fill="#F8FAFC" font-family="system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="68" font-weight="850">\${titleLines}</text>
  <g transform="translate(1030 475)">
    <circle cx="0" cy="0" r="86" fill="#8DFF6A" opacity="0.96"/>
    <path d="M-20 -35 L44 0 L-20 35 Z" fill="#060B1D"/>
  </g>
  <rect x="96" y="602" width="360" height="6" rx="3" fill="url(#accent)"/>
  <text x="96" y="652" fill="#AEBBCC" font-family="system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="28" font-weight="650">youraicoach.life</text>
</svg>\n\`
}
`;

if (!source.includes(oldThumbnail)) throw new Error('thumbnailUrl patch anchor not found');
source = source.replace(oldThumbnail, newThumbnail);

const oldTransform = `function transformArticle(html, videoMap) {
  let next = html.replace(/<iframe\\b[^>]*src\\s*=\\s*(["'])https:\\/\\/www\\.youtube\\.com\\/embed\\/[^"']+\\1[^>]*>\\s*<\\/iframe>/gi, (iframe) => {
    const id = videoIdFromEmbed(attribute(iframe, 'src'))
    const video = videoMap.get(id)
    return video ? renderArticleVideoCard(video) : iframe
  })
  next = removeArticleVideoSchema(next)
  return next
}
`;

const newTransform = `function transformArticle(html, videoMap) {
  let next = html.replace(/<iframe\\b[^>]*src\\s*=\\s*(["'])https:\\/\\/www\\.youtube\\.com\\/embed\\/[^"']+\\1[^>]*>\\s*<\\/iframe>/gi, (iframe) => {
    const id = videoIdFromEmbed(attribute(iframe, 'src'))
    const video = videoMap.get(id)
    return video ? renderArticleVideoCard(video) : iframe
  })
  next = next.replace(/<a\\b[^>]*data-izem-video-card\\s*=\\s*(["'])true\\1[^>]*>[\\s\\S]*?<\\/a>/gi, (card) => {
    const id = attribute(card, 'data-video-id') || ''
    const video = videoMap.get(id)
    return video ? renderArticleVideoCard(video) : card
  })
  next = removeArticleVideoSchema(next)
  return next
}
`;

if (!source.includes(oldTransform)) throw new Error('transformArticle patch anchor not found');
source = source.replace(oldTransform, newTransform);

const oldLoop = `for (const video of videos) {
  await applyExpected(path.join(youtubeDirectory, video.id, 'index.html'), renderWatchPage(video), changedFiles)
}
`;
const newLoop = `for (const video of videos) {
  await applyExpected(path.join(youtubeDirectory, video.id, 'thumbnail.svg'), renderThumbnail(video), changedFiles)
  await applyExpected(path.join(youtubeDirectory, video.id, 'index.html'), renderWatchPage(video), changedFiles)
}
`;
if (!source.includes(oldLoop)) throw new Error('video output loop patch anchor not found');
source = source.replace(oldLoop, newLoop);
fs.writeFileSync(syncPath, source);

const guard = `#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');

const BLOCKED_VISUAL_PATHS = [
  '/images/hero-premium.png',
];

const BLOCKED_REMOTE_IMAGE_PATTERNS = [
  /https?:\\/\\/i\\.ytimg\\.com\\//gi,
  /https?:\\/\\/img\\.youtube\\.com\\//gi,
];

const TEXT_EXTENSIONS = new Set(['.html', '.xml', '.json', '.svg']);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(full);
  }
  return files;
}

const publicFiles = walk(PUBLIC_DIR);
const violations = [];
for (const file of publicFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const blocked of BLOCKED_VISUAL_PATHS) {
    if (!content.includes(blocked)) continue;
    violations.push({ file: path.relative(ROOT, file).split(path.sep).join('/'), blocked });
  }
  for (const pattern of BLOCKED_REMOTE_IMAGE_PATTERNS) {
    pattern.lastIndex = 0;
    if (!pattern.test(content)) continue;
    violations.push({ file: path.relative(ROOT, file).split(path.sep).join('/'), blocked: pattern.source });
  }
}

if (violations.length) {
  console.error(\`Owner image policy check failed: \${violations.length} blocked or unverified visual reference(s) found.\`);
  for (const violation of violations) console.error(\`- \${violation.file}: \${violation.blocked}\`);
  console.error('Use a visually verified people-free asset, or a clearly fully/modestly covered human visual explicitly accepted by the owner.');
  process.exitCode = 1;
} else {
  console.log(\`Owner image policy check passed: \${publicFiles.length} public text asset(s) scanned; no blocked or unverified thumbnail sources referenced.\`);
}
`;
fs.writeFileSync(path.resolve('tools/check-owner-image-policy.mjs'), guard);

const experiment = `# Owner-safe video thumbnail migration - 2026-09-14

## Decision

Replace every unverified remote YouTube thumbnail published by IZEM with a deterministic, repository-owned, people-free SVG thumbnail generated from typography and abstract geometric graphics.

## Evidence

- The owner requires every website/blog image to be visibly verified and modest; when uncertain, use people-free visuals.
- Repository search on 2026-09-14 found YouTube CDN thumbnail references across article video cards, the video hub, dedicated watch-page social metadata/schema, and the video sitemap.
- The generator itself emitted those remote URLs, so deleting individual references would not be durable.
- Google video documentation requires a crawlable thumbnail URL and supports SVG image files; this migration preserves a dedicated thumbnail URL per video instead of removing video thumbnail metadata.

## Change

- Generate \`/youtube/<video-id>/thumbnail.svg\` for every catalogued video.
- The SVG template contains only typography and abstract geometry; it embeds no photographs, raster images, remote resources, people, silhouettes, or screenshots.
- Re-render existing article video cards so legacy YouTube CDN thumbnails are replaced, not only new embeds.
- Keep \`VideoObject.thumbnailUrl\`, Open Graph/Twitter image metadata, and the video sitemap pointed at the new local thumbnail URL.
- Expand the owner-image CI guard to fail on \`i.ytimg.com\` or \`img.youtube.com\` references in published HTML/XML/JSON/SVG.

## Hypothesis and measurement

Hypothesis: local people-free thumbnails will bring every generated video-image surface under the owner's publishing policy while preserving video discoverability and rich-result eligibility.

Baseline: remote YouTube thumbnail references were present across the generated video surface before this migration.

Targets:
- zero YouTube CDN thumbnail references in published text assets;
- \`video:check\`, owner-image policy, structured-data validation, sitemap/link checks, and production build remain green;
- no material decline in indexed video/watch-page coverage attributable to the thumbnail migration.

Immediate technical review: 2026-09-14.
Earliest SEO safety review: 2026-09-21.
Preferred richer video-search review: 2026-09-28.
`;
fs.mkdirSync(path.resolve('docs/seo-experiments'), { recursive: true });
fs.writeFileSync(path.resolve('docs/seo-experiments/2026-09-14-owner-safe-video-thumbnails.md'), experiment);

console.log('Owner-safe video thumbnail migration patch applied.');
