#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const PUBLIC = path.join(ROOT, 'public');
const BLOG = path.join(PUBLIC, 'blog');
const STRICT_MARKER = 'data-owner-visual-policy="objects-only-v1"';
const SAFE_YOUTUBE_THUMBNAIL = /^https:\/\/youraicoach\.life\/youtube\/thumbnails\/[A-Za-z0-9_-]+\.svg$/;
const SAFE_LOCAL_OBJECT_ASSET = /^\/blog\/assets\/[A-Za-z0-9/_-]+\.svg$/;
const SAFE_OG_ASSET = /^https:\/\/youraicoach\.life\/og\/[A-Za-z0-9_-]+\.png$/;

function parseArgs(argv) {
  const args = { checkAll: false, file: '' };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--check-all') args.checkAll = true;
    else if (item === '--file') args.file = argv[++i] || '';
    else if (item.startsWith('--file=')) args.file = item.slice('--file='.length);
  }
  if (!args.checkAll && !args.file) throw new Error('Usage: node tools/ai-marketing/blog-media-policy.mjs --check-all | --file public/blog/<slug>.html');
  return args;
}

function resolveInsideRoot(relative) {
  const resolved = path.resolve(ROOT, relative);
  const prefix = `${ROOT}${path.sep}`;
  if (resolved !== ROOT && !resolved.startsWith(prefix)) throw new Error(`Path escapes repository: ${relative}`);
  return resolved;
}

function topLevelBlogFiles() {
  if (!fs.existsSync(BLOG)) return [];
  return fs.readdirSync(BLOG, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html') && entry.name !== 'index.html')
    .map((entry) => path.join(BLOG, entry.name));
}

function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*(["'])(.*?)\2/g)) result[match[1].toLowerCase()] = match[3];
  return result;
}

function imageTags(html) {
  return [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => ({ tag: match[0], attrs: attributes(match[0]) }));
}

function validateSvg(publicPath, errors) {
  const absolute = path.join(PUBLIC, publicPath.replace(/^\//, ''));
  if (!fs.existsSync(absolute)) {
    errors.push(`missing referenced object-only visual: ${publicPath}`);
    return;
  }
  const svg = fs.readFileSync(absolute, 'utf8');
  if (!/<svg\b/i.test(svg)) errors.push(`${publicPath}: expected an SVG document`);
  if (/<(?:image|foreignObject|script|video|iframe|object|embed)\b/i.test(svg)) errors.push(`${publicPath}: SVG contains disallowed embedded/executable media`);
  if (/(?:href|xlink:href)\s*=\s*["']\s*(?:https?:|data:|\/\/)/i.test(svg)) errors.push(`${publicPath}: SVG contains a remote or data-URI reference`);
  if (/data:image\//i.test(svg)) errors.push(`${publicPath}: SVG contains an embedded raster image`);
  if (/<(?:text|tspan)\b[^>]*>[^<]*(?:man|woman|person|people|trainer|athlete|body|face|hand|portrait|silhouette)[^<]*<\/(?:text|tspan)>/i.test(svg)) {
    errors.push(`${publicPath}: SVG text appears to reference a human visual; review before publication`);
  }
}

function validateSocialImages(html, errors) {
  const metas = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of metas) {
    const attrs = attributes(tag);
    const key = String(attrs.property || attrs.name || '').toLowerCase();
    if (!['og:image', 'twitter:image'].includes(key)) continue;
    const content = attrs.content || '';
    if (!content) continue;
    if (!SAFE_OG_ASSET.test(content) && !SAFE_YOUTUBE_THUMBNAIL.test(content)) {
      errors.push(`unapproved social image source for ${key}: ${content}`);
    }
  }
}

function validateFile(file, { requireStrict = false } = {}) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const strict = html.includes(STRICT_MARKER);
  const errors = [];

  if (requireStrict && !strict) errors.push(`missing ${STRICT_MARKER}`);
  if (!strict && !requireStrict) return { rel, strict: false, errors: [] };

  const images = imageTags(html);
  const objectImages = images.filter(({ tag, attrs }) => tag.includes(STRICT_MARKER) && SAFE_LOCAL_OBJECT_ASSET.test(attrs.src || ''));
  if (objectImages.length < 2) errors.push(`requires at least 2 local deterministic object-only SVG visuals; found ${objectImages.length}`);

  for (const { tag, attrs } of images) {
    const src = attrs.src || '';
    const objectAsset = SAFE_LOCAL_OBJECT_ASSET.test(src);
    const videoThumb = SAFE_YOUTUBE_THUMBNAIL.test(src);
    if (!objectAsset && !videoThumb) {
      errors.push(`unsafe/unapproved article image source: ${src || '(missing src)'}. Strict articles allow only deterministic local object SVGs and generated local video thumbnails.`);
      continue;
    }
    if (objectAsset && !tag.includes(STRICT_MARKER)) errors.push(`object-only image is missing ${STRICT_MARKER}: ${src}`);
    if (objectAsset) validateSvg(src, errors);
  }

  validateSocialImages(html, errors);

  if (/<iframe\b[^>]*youtube(?:-nocookie)?\.com/i.test(html)) errors.push('blog article contains a direct YouTube iframe; use the established /youtube/<id>/ card/watch-page method instead');
  if (/https?:\/\/(?:i\.ytimg\.com|img\.youtube\.com)\//i.test(html)) errors.push('blog article references a raw YouTube thumbnail host; use the generated local /youtube/thumbnails/<id>.svg asset');

  const hasVideoBlock = html.includes('<!-- IZEM_VIDEO_START -->');
  if (hasVideoBlock) {
    if (!/href=["']\/youtube\/[A-Za-z0-9_-]+\/["']/i.test(html)) errors.push('IZEM video block does not link to the dedicated /youtube/<id>/ watch page');
    if (!/youraicoach\.life\/youtube\/thumbnails\/[A-Za-z0-9_-]+\.svg/i.test(html)) errors.push('IZEM video block does not use the generated people-free local SVG thumbnail');
  }

  return { rel, strict: true, errors };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const targets = args.checkAll ? topLevelBlogFiles() : [resolveInsideRoot(args.file)];
  const results = targets.map((file) => validateFile(file, { requireStrict: Boolean(args.file) }));
  const failures = results.filter((result) => result.errors.length);
  const checked = results.filter((result) => result.strict).length;

  if (failures.length) {
    console.error(`Blog media policy failed for ${failures.length} page(s).`);
    for (const failure of failures) {
      console.error(`- ${failure.rel}`);
      for (const issue of failure.errors) console.error(`  - ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Blog media policy passed: ${checked} strict object-only article(s) validated.`);
}

main();
