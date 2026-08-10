import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicDirectory = path.join(projectRoot, 'public')
const sitemapPath = path.join(publicDirectory, 'sitemap.xml')
const siteOrigin = 'https://youraicoach.life'
const checkOnly = process.argv.includes('--check')

async function collectHtmlFiles(directory, relativeDirectory = '') {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const relativePath = path.posix.join(relativeDirectory, entry.name)
    const absolutePath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await collectHtmlFiles(absolutePath, relativePath)))
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push({ absolutePath, relativePath })
    }
  }

  return files
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))
  return match?.[2]
}

function matchingTags(html, tagName) {
  return html.match(new RegExp(`<${tagName}\\b[^>]*>`, 'gi')) || []
}

function canonicalUrls(html) {
  return matchingTags(html, 'link')
    .filter((tag) => (attribute(tag, 'rel') || '').toLowerCase().split(/\s+/).includes('canonical'))
    .map((tag) => attribute(tag, 'href'))
    .filter(Boolean)
}

function isNoindex(html) {
  return matchingTags(html, 'meta').some((tag) => {
    if ((attribute(tag, 'name') || '').toLowerCase() !== 'robots') return false
    return /(?:^|,)\s*noindex(?:\s|,|$)/i.test(attribute(tag, 'content') || '')
  })
}

function isInfrastructureHtml(relativePath) {
  const filename = path.posix.basename(relativePath)
  // Google FILE verification tokens are control files, not webpages. Their
  // required body is the filename itself, so adding canonical/robots markup
  // would invalidate ownership verification.
  return /^google[A-Za-z0-9_-]+\.html$/.test(filename)
}

function normalizedUrl(value) {
  const url = new URL(value, siteOrigin)
  url.hash = ''
  return url.href
}

function pageDate(html) {
  return (
    html.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})"/i)?.[1] ||
    html.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})"/i)?.[1]
  )
}

function xmlEscape(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function parseExistingEntries(xml) {
  const entries = new Map()

  for (const match of xml.matchAll(/<url>\s*([\s\S]*?)\s*<\/url>/g)) {
    const body = match[1]
    const location = body.match(/<loc>([^<]+)<\/loc>/)?.[1]?.trim()
    if (!location) continue

    const key = normalizedUrl(location)
    entries.set(key, {
      lastmod: body.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]?.trim(),
      changefreq: body.match(/<changefreq>([^<]+)<\/changefreq>/)?.[1]?.trim(),
      priority: body.match(/<priority>([^<]+)<\/priority>/)?.[1]?.trim(),
    })
  }

  return entries
}

function urlSort(left, right) {
  const a = new URL(left).pathname
  const b = new URL(right).pathname
  if (a === '/') return -1
  if (b === '/') return 1
  return a.localeCompare(b)
}

function renderEntry(location, existing = {}, discoveredDate) {
  const lastmod = [existing.lastmod, discoveredDate].filter(Boolean).sort().at(-1)
  const lines = ['  <url>', `    <loc>${xmlEscape(location)}</loc>`]
  if (lastmod) lines.push(`    <lastmod>${xmlEscape(lastmod)}</lastmod>`)
  if (existing.changefreq) lines.push(`    <changefreq>${xmlEscape(existing.changefreq)}</changefreq>`)
  if (existing.priority) lines.push(`    <priority>${xmlEscape(existing.priority)}</priority>`)
  lines.push('  </url>')
  return lines.join('\n')
}

const publicFiles = await collectHtmlFiles(publicDirectory)
const sourceFiles = [
  { absolutePath: path.join(projectRoot, 'index.html'), relativePath: '../index.html' },
  ...publicFiles,
].filter((file) =>
  !file.relativePath.startsWith('blog/drafts/') &&
  !isInfrastructureHtml(file.relativePath),
)

const indexableUrls = new Map()
const errors = []

for (const file of sourceFiles) {
  const html = await readFile(file.absolutePath, 'utf8')
  if (isNoindex(html)) continue

  const canonicals = canonicalUrls(html)
  if (canonicals.length !== 1) {
    errors.push(`${file.relativePath}: expected exactly one canonical, found ${canonicals.length}`)
    continue
  }

  const canonical = new URL(canonicals[0], siteOrigin)
  if (canonical.origin !== siteOrigin) {
    errors.push(`${file.relativePath}: canonical must use ${siteOrigin}`)
    continue
  }

  const key = normalizedUrl(canonical)
  const foundDate = pageDate(html)
  const previousDate = indexableUrls.get(key)
  indexableUrls.set(key, [previousDate, foundDate].filter(Boolean).sort().at(-1))
}

if (errors.length > 0) {
  console.error(`Sitemap sync found ${errors.length} indexability error(s):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

const existingXml = await readFile(sitemapPath, 'utf8')
const existingEntries = parseExistingEntries(existingXml)
const locations = [...indexableUrls.keys()].sort(urlSort)
const body = locations
  .map((location) => renderEntry(location, existingEntries.get(location), indexableUrls.get(location)))
  .join('\n')
const nextXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`

if (nextXml === existingXml) {
  console.log(`Sitemap is current: ${locations.length} indexable canonical URLs.`)
} else if (checkOnly) {
  console.error('Sitemap is out of date. Run: npm run sitemap:sync')
  process.exit(1)
} else {
  await writeFile(sitemapPath, nextXml)
  console.log(`Sitemap synchronized: ${locations.length} indexable canonical URLs.`)
}
