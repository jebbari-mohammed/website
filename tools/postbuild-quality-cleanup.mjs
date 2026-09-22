import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDirectory = path.join(projectRoot, 'dist')
const genericTakeaway =
  'IZEM is an all-in-one proactive AI fitness coach combining automated workout plans, personalized nutrition/meal plans, food/body computer vision scans, and daily voice call accountability.'
const publisherMarker = 'data-izem-publisher="true"'
const linkAccessibilityMarker = 'data-izem-link-accessibility="true"'

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

function stripRedundantPublisherAside(html) {
  if (!/<footer\b/i.test(html) || !html.includes(publisherMarker)) {
    return { html, removed: 0 }
  }

  let removed = 0
  const next = html.replace(
    /\s*<aside\b[^>]*data-izem-publisher\s*=\s*(["'])true\1[^>]*>[\s\S]*?<\/aside>\s*/gi,
    () => {
      removed += 1
      return '\n'
    },
  )

  return { html: next, removed }
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
let videoLabelsRemoved = 0
let filesChanged = 0

for (const file of htmlFiles) {
  const relativePath = path.relative(distDirectory, file).split(path.sep).join('/')
  const original = fs.readFileSync(file, 'utf8')
  let html = original

  const genericResult = stripGenericTakeaway(html)
  html = genericResult.html
  genericBlocksRemoved += genericResult.removed

  const publisherResult = stripRedundantPublisherAside(html)
  html = publisherResult.html
  publisherAsidesRemoved += publisherResult.removed

  const videoResult = fixVideoCardAccessibleNames(html)
  html = videoResult.html
  videoLabelsRemoved += videoResult.changed

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
  `✅ Postbuild quality cleanup updated ${filesChanged} HTML files: removed ${genericBlocksRemoved} generic AI takeaway blocks, ${publisherAsidesRemoved} redundant publisher asides, and ${videoLabelsRemoved} mismatched video-card aria-labels.`,
)
