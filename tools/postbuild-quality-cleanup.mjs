import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDirectory = path.join(projectRoot, 'dist')
const genericTakeaway =
  'IZEM is an all-in-one proactive AI fitness coach combining automated workout plans, personalized nutrition/meal plans, food/body computer vision scans, and daily voice call accountability.'
const publisherMarker = 'data-izem-publisher="true"'
const brandLogoMarker = 'data-izem-brand-logo="true"'
const linkAccessibilityMarker = 'data-izem-link-accessibility="true"'
const compactUniversalLogo = `<a data-izem-brand-logo="true" href="/" aria-label="IZEM home" style="display:inline-flex;margin:0 auto 12px;border-radius:12px;box-shadow:0 8px 22px rgba(20,210,220,.18)"><img src="/images/izem-app-logo-192.png" alt="IZEM app logo" width="64" height="64" loading="lazy" decoding="async" style="display:block;width:40px;height:40px;border-radius:12px;object-fit:cover"></a>`

function collectHtmlFiles(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) return collectHtmlFiles(absolutePath)
    return entry.isFile() && entry.name.endsWith('.html') ? [absolutePath] : []
  })
}

function stripGenericTakeaway(html) {
  if (!html.includes(genericTakeaway)) return { html, removed: 0 }

  let removed = 0
  const next = html.replace(
    /\s*<div\b[^>]*class\s*=\s*(["'])[^"']*\bgeo-summary\b[^"']*\1[^>]*>[\s\S]*?<strong>\s*AI Key Takeaway:\s*<\/strong>\s*IZEM is an all-in-one proactive AI fitness coach combining automated workout plans, personalized nutrition\/meal plans, food\/body computer vision scans, and daily voice call accountability\.\s*<\/div>\s*/gi,
    () => {
      removed += 1
      return '\n'
    },
  )

  return { html: next, removed }
}

function compactRedundantPublisherAside(html) {
  if (!/<footer\b/i.test(html) || !html.includes(publisherMarker)) {
    return { html, removed: 0, logoAdded: 0 }
  }

  let removed = 0
  let next = html.replace(
    /\s*<aside\b[^>]*data-izem-publisher\s*=\s*(["'])true\1[^>]*>[\s\S]*?<\/aside>\s*/gi,
    () => {
      removed += 1
      return '\n'
    },
  )

  let logoAdded = 0
  if (!next.includes(brandLogoMarker)) {
    next = next.replace(/<footer\b([^>]*)>/i, (tag) => {
      logoAdded += 1
      return `${tag}\n${compactUniversalLogo}`
    })
  }

  return { html: next, removed, logoAdded }
}

function fixVideoCardAccessibleNames(html) {
  let changed = 0
  const next = html.replace(
    /<a\b[^>]*class\s*=\s*(["'])[^"']*\bizem-video-card\b[^"']*\1[^>]*>/gi,
    (tag) => {
      const cleaned = tag.replace(/\s+aria-label\s*=\s*(["'])[^"']*\1/i, '')
      if (cleaned !== tag) changed += 1
      return cleaned
    },
  )

  return { html: next, changed }
}

function replacePrerenderedHeroVideo(html, relativePath) {
  if (relativePath !== 'index.html' || !html.includes('data-izem-hero-preview="true"')) {
    return { html, changed: 0 }
  }

  let changed = 0
  const next = html.replace(
    /<video\b(?=[^>]*data-izem-hero-preview\s*=\s*(["'])true\1)[^>]*>[\s\S]*?<\/video>/i,
    () => {
      changed += 1
      return '<img data-izem-hero-preview="true" src="/images/hero1-desktop.webp" alt="IZEM AI coach chat interface preview" width="800" height="1260" loading="eager" decoding="async" fetchpriority="high" class="w-full h-full object-cover">'
    },
  )

  return { html: next, changed }
}

function improvePublisherLinkVisibility(html) {
  if (!html.includes(publisherMarker)) return html

  return html.replace(
    /<aside\b[^>]*data-izem-publisher\s*=\s*(["'])true\1[^>]*>[\s\S]*?<\/aside>/gi,
    (aside) => aside.replace(/style="color:/gi, 'style="text-decoration:underline;text-underline-offset:3px;color:'),
  )
}

function addBlogFooterLinkStyles(html, relativePath) {
  if (relativePath !== 'blog/index.html' || html.includes(linkAccessibilityMarker)) return html

  const styles = `<style ${linkAccessibilityMarker}>footer a{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}footer a:hover{text-decoration-thickness:2px}</style>`
  return html.replace(/<\/head>/i, `${styles}\n</head>`)
}

if (!fs.existsSync(distDirectory)) {
  throw new Error('dist directory does not exist; run the production build first')
}

const htmlFiles = collectHtmlFiles(distDirectory)
let genericBlocksRemoved = 0
let publisherAsidesRemoved = 0
let compactLogosAdded = 0
let videoLabelsRemoved = 0
let prerenderedHeroVideosReplaced = 0
let filesChanged = 0

for (const file of htmlFiles) {
  const relativePath = path.relative(distDirectory, file).split(path.sep).join('/')
  const original = fs.readFileSync(file, 'utf8')
  let html = original

  const genericResult = stripGenericTakeaway(html)
  html = genericResult.html
  genericBlocksRemoved += genericResult.removed

  const publisherResult = compactRedundantPublisherAside(html)
  html = publisherResult.html
  publisherAsidesRemoved += publisherResult.removed
  compactLogosAdded += publisherResult.logoAdded

  const videoResult = fixVideoCardAccessibleNames(html)
  html = videoResult.html
  videoLabelsRemoved += videoResult.changed

  const heroResult = replacePrerenderedHeroVideo(html, relativePath)
  html = heroResult.html
  prerenderedHeroVideosReplaced += heroResult.changed

  html = improvePublisherLinkVisibility(html)
  html = addBlogFooterLinkStyles(html, relativePath)

  if (html !== original) {
    fs.writeFileSync(file, html)
    filesChanged += 1
  }
}

const remainingGenericPages = htmlFiles.filter((file) => fs.readFileSync(file, 'utf8').includes(genericTakeaway))
if (remainingGenericPages.length > 0) {
  throw new Error(
    `Generic AI takeaway remained in ${remainingGenericPages.length} built page(s): ${remainingGenericPages
      .slice(0, 10)
      .map((file) => path.relative(distDirectory, file))
      .join(', ')}`,
  )
}

console.log(
  `✅ Postbuild quality cleanup updated ${filesChanged} HTML files: removed ${genericBlocksRemoved} generic AI takeaway blocks, compacted ${publisherAsidesRemoved} redundant publisher asides with ${compactLogosAdded} footer logos, removed ${videoLabelsRemoved} mismatched video-card aria-labels, and replaced ${prerenderedHeroVideosReplaced} prerendered hero video with a lightweight image.`,
)
