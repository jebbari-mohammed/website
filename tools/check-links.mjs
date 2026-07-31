import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

import { load } from 'cheerio'

const siteOrigin = 'https://youraicoach.life'
const distDirectory = path.resolve('dist')
const excludedDirectory = 'blog/drafts/'
const knownDeadUrls = [
  'https://apps.apple.com/app/your-ai-coach',
  'https://play.google.com/store/apps/details?id=com.ai.gym.coach',
  'https://health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines/current-guidelines/adults',
]

async function collectFiles(directory, relativeDirectory = '') {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const relativePath = path.posix.join(relativeDirectory, entry.name)
    const absolutePath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath, relativePath)))
    } else {
      files.push(relativePath)
    }
  }

  return files
}

function pageUrl(relativeFile) {
  if (relativeFile === 'index.html') return `${siteOrigin}/`
  if (relativeFile.endsWith('/index.html')) {
    return `${siteOrigin}/${relativeFile.slice(0, -'index.html'.length)}`
  }
  return `${siteOrigin}/${relativeFile}`
}

function candidateFiles(pathname) {
  let decodedPath

  try {
    decodedPath = decodeURIComponent(pathname)
  } catch {
    decodedPath = pathname
  }

  const relativePath = decodedPath.replace(/^\/+/, '')
  if (!relativePath || decodedPath.endsWith('/')) {
    return [path.posix.join(relativePath, 'index.html')]
  }

  return [relativePath, `${relativePath}.html`, path.posix.join(relativePath, 'index.html')]
}

function resolveInternalUrl(href, sourceFile) {
  const normalizedHref = href.trim()
  if (
    !normalizedHref ||
    normalizedHref.startsWith('#') ||
    /^(?:mailto|tel|javascript|data):/i.test(normalizedHref)
  ) {
    return null
  }

  const url = new URL(normalizedHref, pageUrl(sourceFile))
  if (url.origin !== siteOrigin) return null
  return url
}

function targetExists(url, allFiles) {
  return candidateFiles(url.pathname).some((candidate) => allFiles.has(candidate))
}

function targetFile(url, allFiles) {
  return candidateFiles(url.pathname).find((candidate) => allFiles.has(candidate))
}

function normalizedIndexUrl(value) {
  const url = value instanceof URL ? value : new URL(value)
  const pathname = url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '')
  return `${url.origin}${pathname}${url.search}`
}

const files = await collectFiles(distDirectory)
const allFiles = new Set(files)
const htmlFiles = files.filter(
  (file) => file.endsWith('.html') && !file.startsWith(excludedDirectory),
)
const errors = []
let checkedLinks = 0
const sitemapCanonicalUrls = new Set()

for (const htmlFile of htmlFiles) {
  const html = await readFile(path.join(distDirectory, htmlFile), 'utf8')

  for (const deadUrl of knownDeadUrls) {
    if (html.includes(deadUrl)) {
      errors.push(`${htmlFile}: contains known 404 URL ${deadUrl}`)
    }
  }

  const $ = load(html)
  for (const element of $('a[href]').toArray()) {
    const href = $(element).attr('href')
    if (!href) continue

    let url
    try {
      url = resolveInternalUrl(href, htmlFile)
    } catch {
      errors.push(`${htmlFile}: invalid href ${href}`)
      continue
    }

    if (!url) continue
    checkedLinks += 1

    if (!targetExists(url, allFiles)) {
      errors.push(`${htmlFile}: ${href} has no built target`)
    }
  }
}

const sitemapFile = 'sitemap.xml'
if (allFiles.has(sitemapFile)) {
  const sitemap = await readFile(path.join(distDirectory, sitemapFile), 'utf8')
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim())
  const seenLocations = new Set()

  for (const location of locations) {
    let url
    try {
      url = new URL(location)
    } catch {
      errors.push(`${sitemapFile}: invalid URL ${location}`)
      continue
    }

    if (seenLocations.has(normalizedIndexUrl(url))) {
      errors.push(`${sitemapFile}: duplicate URL ${location}`)
    }
    seenLocations.add(normalizedIndexUrl(url))
    sitemapCanonicalUrls.add(normalizedIndexUrl(url))

    if (url.origin !== siteOrigin) continue

    const relativeFile = targetFile(url, allFiles)
    if (!relativeFile) {
      errors.push(`${sitemapFile}: ${location} has no built target`)
      continue
    }

    if (!relativeFile.endsWith('.html')) continue

    const html = await readFile(path.join(distDirectory, relativeFile), 'utf8')
    const $ = load(html)
    const canonicalLinks = $('link[rel="canonical"]')

    if (canonicalLinks.length !== 1) {
      errors.push(`${relativeFile}: sitemap page must have exactly one canonical (found ${canonicalLinks.length})`)
    } else {
      const canonicalHref = canonicalLinks.attr('href')
      try {
        const canonicalUrl = new URL(canonicalHref, url)
        if (normalizedIndexUrl(canonicalUrl) !== normalizedIndexUrl(url)) {
          errors.push(`${relativeFile}: canonical ${canonicalUrl.href} does not match sitemap URL ${location}`)
        }
      } catch {
        errors.push(`${relativeFile}: invalid canonical ${canonicalHref}`)
      }
    }

    const robotsContents = $('meta')
      .toArray()
      .filter((element) => ($(element).attr('name') || '').toLowerCase() === 'robots')
      .map((element) => $(element).attr('content') || '')
    if (robotsContents.some((content) => /(?:^|,)\s*noindex(?:\s|,|$)/i.test(content))) {
      errors.push(`${relativeFile}: sitemap page is marked noindex`)
    }

    for (const element of $('script[type="application/ld+json"]').toArray()) {
      const json = $(element).text().trim()
      if (!json) continue
      try {
        JSON.parse(json)
      } catch (error) {
        errors.push(`${relativeFile}: invalid JSON-LD (${error.message})`)
      }
    }
  }
}

for (const htmlFile of htmlFiles) {
  const html = await readFile(path.join(distDirectory, htmlFile), 'utf8')
  const $ = load(html)
  const robotsContents = $('meta')
    .toArray()
    .filter((element) => ($(element).attr('name') || '').toLowerCase() === 'robots')
    .map((element) => $(element).attr('content') || '')

  if (robotsContents.some((content) => /(?:^|,)\s*noindex(?:\s|,|$)/i.test(content))) continue

  const canonicalLinks = $('link')
    .toArray()
    .filter((element) =>
      (($(element).attr('rel') || '').toLowerCase().split(/\s+/)).includes('canonical'),
    )

  if (canonicalLinks.length !== 1) {
    errors.push(`${htmlFile}: indexable page must have exactly one canonical (found ${canonicalLinks.length})`)
    continue
  }

  const canonicalHref = $(canonicalLinks[0]).attr('href')
  try {
    const canonicalUrl = new URL(canonicalHref, pageUrl(htmlFile))
    if (canonicalUrl.origin === siteOrigin && !sitemapCanonicalUrls.has(normalizedIndexUrl(canonicalUrl))) {
      errors.push(`${htmlFile}: indexable canonical ${canonicalUrl.href} is missing from sitemap.xml`)
    }
  } catch {
    errors.push(`${htmlFile}: invalid canonical ${canonicalHref}`)
  }
}

if (errors.length > 0) {
  console.error(`Link check failed with ${errors.length} error(s):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exitCode = 1
} else {
  console.log(`Link check passed: ${htmlFiles.length} pages and ${checkedLinks} internal links checked.`)
}
