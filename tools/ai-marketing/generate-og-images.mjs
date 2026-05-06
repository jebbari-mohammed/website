/**
 * OG Image Generator — Creates Open Graph social share images for each blog post.
 * Uses SVG (no external dependencies) — generates branded card images.
 * Referenced in blog HTML as og:image — makes shares on Twitter/LinkedIn/WhatsApp look premium.
 * Also generates images for glossary and city pages.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../../public');
const OG_DIR = path.join(PUBLIC_DIR, 'og');

if (!fs.existsSync(OG_DIR)) fs.mkdirSync(OG_DIR, { recursive: true });

// ========================
// SVG CARD BUILDER
// ========================
function escapeXML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export { buildOGImage as buildOGImageForPost };

function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3); // max 3 lines
}

function buildOGImage({ title, category = 'AI Fitness', emoji = '⚡' }) {
  const lines = wrapText(title, 38);
  const lineHeight = 72;
  const titleY = 240 - ((lines.length - 1) * lineHeight) / 2;

  const titleLines = lines.map((line, i) =>
    `<text x="60" y="${titleY + i * lineHeight}" font-family="system-ui,-apple-system,sans-serif" font-size="56" font-weight="800" fill="#F8FAFC" letter-spacing="-1">${escapeXML(line)}</text>`
  ).join('\n    ');

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#060B1D"/>
      <stop offset="100%" style="stop-color:#0C1A3D"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#00D4FF"/>
      <stop offset="100%" style="stop-color:#7C5CFC"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#00D4FF;stop-opacity:0.15"/>
      <stop offset="100%" style="stop-color:#7C5CFC;stop-opacity:0"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Glow blob top-right -->
  <ellipse cx="1050" cy="80" rx="280" ry="180" fill="url(#glow)" opacity="0.6"/>

  <!-- Grid lines (subtle) -->
  <line x1="0" y1="210" x2="1200" y2="210" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
  <line x1="0" y1="420" x2="1200" y2="420" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
  <line x1="400" y1="0" x2="400" y2="630" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
  <line x1="800" y1="0" x2="800" y2="630" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>

  <!-- Top accent bar -->
  <rect x="0" y="0" width="1200" height="6" fill="url(#accent)"/>

  <!-- Category pill -->
  <rect x="60" y="60" width="${category.length * 13 + 40}" height="40" rx="20" fill="rgba(0,212,255,0.12)" stroke="rgba(0,212,255,0.3)" stroke-width="1"/>
  <text x="80" y="84" font-family="system-ui,-apple-system,sans-serif" font-size="18" font-weight="600" fill="#00D4FF">${escapeXML(category)}</text>

  <!-- Title -->
  ${titleLines}

  <!-- Bottom bar -->
  <rect x="0" y="560" width="1200" height="70" fill="rgba(0,0,0,0.3)"/>

  <!-- Logo -->
  <text x="60" y="604" font-family="system-ui,-apple-system,sans-serif" font-size="26" font-weight="800" fill="#F8FAFC">⚡ Your AI Coach</text>

  <!-- Domain -->
  <text x="1140" y="604" font-family="system-ui,-apple-system,sans-serif" font-size="20" fill="#475569" text-anchor="end">youraicoach.life</text>

  <!-- Decorative accent line -->
  <rect x="60" y="${titleY + lines.length * lineHeight + 24}" width="80" height="4" rx="2" fill="url(#accent)"/>
</svg>`;
}

// ========================
// GENERATE FROM PROGRESS
// ========================
function generateBlogOGImages() {
  const PROGRESS_FILE = path.join(__dirname, '.daily-progress.json');
  if (!fs.existsSync(PROGRESS_FILE)) return 0;

  const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  let count = 0;

  for (const post of progress.generated) {
    const outPath = path.join(OG_DIR, `${post.slug}.svg`);
    if (!fs.existsSync(outPath)) {
      const svg = buildOGImage({ title: post.title, category: 'AI Fitness' });
      fs.writeFileSync(outPath, svg);
      count++;
    }
  }
  return count;
}

// ========================
// PATCH OG TAG INTO HTML
// ========================
export function patchOGImageTag(htmlContent, slug) {
  const ogImageTag = `<meta property="og:image" content="https://youraicoach.life/og/${slug}.svg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:image" content="https://youraicoach.life/og/${slug}.svg" />
    <meta name="twitter:card" content="summary_large_image" />`;

  // Insert after og:type tag if present, otherwise before </head>
  if (htmlContent.includes('og:type')) {
    return htmlContent.replace(
      /(<meta property="og:type"[^>]+>)/,
      `$1\n    ${ogImageTag}`
    );
  }
  return htmlContent.replace('</head>', `    ${ogImageTag}\n</head>`);
}

// ========================
// MAIN (standalone mode)
// ========================
async function main() {
  const blogCount = generateBlogOGImages();
  console.log(`✅ Generated ${blogCount} new blog OG images`);

  // Patch all existing blog HTML files with og:image tags
  const BLOG_DIR = path.join(PUBLIC_DIR, 'blog');
  const PROGRESS_FILE = path.join(__dirname, '.daily-progress.json');

  if (fs.existsSync(PROGRESS_FILE) && fs.existsSync(BLOG_DIR)) {
    const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    let patched = 0;
    for (const post of progress.generated) {
      const htmlPath = path.join(BLOG_DIR, `${post.slug}.html`);
      if (!fs.existsSync(htmlPath)) continue;
      let html = fs.readFileSync(htmlPath, 'utf-8');
      if (!html.includes('og:image')) {
        html = patchOGImageTag(html, post.slug);
        fs.writeFileSync(htmlPath, html);
        patched++;
      }
    }
    console.log(`✅ Patched og:image tags into ${patched} blog posts`);
  }
}

main().catch(console.error);
