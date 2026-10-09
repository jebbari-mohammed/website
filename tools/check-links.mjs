import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

import { load } from 'cheerio'
import { THEME } from './brand-theme.mjs'
import { decorativeVideoPaths, decorativePosterPaths, hasExactNoindexHeader } from './video-indexing-policy.mjs'

const siteOrigin = 'https://youraicoach.life'
const distDirectory = path.resolve('dist')
const excludedDirectory = 'blog/drafts/'
const videoSitemapFile = 'video-sitemap.xml'
const brandLogoPath = '/images/izem-app-logo-192.png'
const brandAssets = [
  'images/izem-app-logo.png',
  'images/izem-app-logo-512.png',
  'images/izem-app-logo-192.png',
  'favicon-32x32.png',
  'favicon-16x16.png',
  'favicon.ico',
  'apple-touch-icon.png',
  'site.webmanifest',
  'izem-theme.css',
]
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

function isInfrastructureHtml(file) {
  // Google FILE verification tokens must contain only the exact token text.
  // They are deployable control files, not branded/indexable webpages.
  return /^google[A-Za-z0-9_-]+\.html$/.test(path.posix.basename(file))
}

const htmlFiles = files.filter(
  (file) =>
    file.endsWith('.html') &&
    !file.startsWith(excludedDirectory) &&
    !isInfrastructureHtml(file),
)
const errors = []
let checkedLinks = 0
const sitemapCanonicalUrls = new Set()
const videoSitemapUrls = new Set()
const { hosting } = JSON.parse(await readFile('firebase.json', 'utf8'))

for (const resource of [...decorativeVideoPaths, ...decorativePosterPaths]) {
  if (!hasExactNoindexHeader(hosting, resource)) {
    errors.push(`${resource}: decorative homepage media must carry its exact noindex response header`)
  }
}

for (const asset of brandAssets) {
  if (!allFiles.has(asset)) errors.push(`${asset}: required IZEM brand asset is missing`)
}

function typedJsonLdItems(value, type, items = []) {
  if (Array.isArray(value)) {
    for (const item of value) typedJsonLdItems(item, type, items)
  } else if (value && typeof value === 'object') {
    const itemType = value['@type']
    if (itemType === type || (Array.isArray(itemType) && itemType.includes(type))) items.push(value)
    for (const child of Object.values(value)) typedJsonLdItems(child, type, items)
  }
  return items
}

function youtubeEmbedUrl(value) {
  if (!value) return null
  try {
    const url = new URL(value, siteOrigin)
    return /^(?:www\.)?youtube(?:-nocookie)?\.com$/i.test(url.hostname) && url.pathname.startsWith('/embed/')
      ? url
      : null
  } catch {
    return null
  }
}

function isStaticallyHidden($, element) {
  const node = $(element)
  return node.is('script, style, template, link, meta, [hidden]') ||
    /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*(?:hidden|collapse))\s*(?:!important\s*)?(?:;|$)/i.test(node.attr('style') || '')
}

for (const htmlFile of htmlFiles) {
  const html = await readFile(path.join(distDirectory, htmlFile), 'utf8')

  for (const deadUrl of knownDeadUrls) {
    if (html.includes(deadUrl)) {
      errors.push(`${htmlFile}: contains known 404 URL ${deadUrl}`)
    }
  }

  const $ = load(html)

  const brandLogo = $(`[data-izem-brand-logo="true"] img[src="${brandLogoPath}"]`)
  if (brandLogo.length !== 1) {
    errors.push(`${htmlFile}: every page must display exactly one universal IZEM app logo (found ${brandLogo.length})`)
  }
  if (brandLogo.attr('alt') !== 'IZEM app logo' || brandLogo.attr('width') !== '64' || brandLogo.attr('height') !== '64') {
    errors.push(`${htmlFile}: universal IZEM app logo must have accessible text and fixed dimensions`)
  }
  const requiredHeadElements = [
    ['32x32 favicon', 'link[rel="icon"][sizes="32x32"][href="/favicon-32x32.png"]'],
    ['16x16 favicon', 'link[rel="icon"][sizes="16x16"][href="/favicon-16x16.png"]'],
    ['shortcut favicon', 'link[rel="shortcut icon"][href="/favicon.ico"]'],
    ['Apple touch icon', 'link[rel="apple-touch-icon"][href="/apple-touch-icon.png"]'],
    ['web app manifest', 'link[rel="manifest"][href="/site.webmanifest"]'],
    ['brand theme colour', `meta[name="theme-color"][content="${THEME.background}"]`],
    ['theme-colour declaration', 'meta[name="theme-color"]'],
    ['green/black stylesheet', 'link[rel="stylesheet"][href="/izem-theme.css"][data-izem-theme="green-black-v1"]'],
  ]
  for (const [label, selector] of requiredHeadElements) {
    if ($(selector).length !== 1) errors.push(`${htmlFile}: must have exactly one ${label}`)
  }
  if (html.includes('https://youraicoach.life/favicon.svg')) {
    errors.push(`${htmlFile}: structured data still references the retired favicon logo`)
  }
  for (const anchor of $('a[href="/"]').toArray()) {
    const text = $(anchor).text().replace(/\s+/g, ' ').trim()
    if (/^⚡\s*IZEM$/i.test(text)) {
      errors.push(`${htmlFile}: navigation still uses the retired lightning character logo`)
    }
    if (/^IZEM(?:\s*\/\s*(?:SUPPORT|TERMS))?$/i.test(text)) {
      const navigationLogos = $(anchor).find(
        'img[data-izem-navigation-logo="true"][src="/images/izem-app-logo-192.png"]',
      )
      if (navigationLogos.length !== 1) {
        errors.push(`${htmlFile}: IZEM navigation brand must display the supplied app logo`)
      }
    }
  }

  const videoFrames = $('iframe').filter((_, element) => {
    const frame = $(element)
    if (youtubeEmbedUrl(frame.attr('src')) || youtubeEmbedUrl(frame.attr('data-src'))) return true
    const srcdoc = frame.attr('srcdoc')
    if (!srcdoc) return false
    const embedded = load(srcdoc)
    return embedded('video').length > 0 || embedded('iframe').toArray().some((child) =>
      youtubeEmbedUrl(embedded(child).attr('src')) || youtubeEmbedUrl(embedded(child).attr('data-src')),
    )
  })
  const videoPlayers = videoFrames.add($('video'))
  const isWatchPage = /^youtube\/[^/]+\/index\.html$/.test(htmlFile)
  const videoObjects = []
  const webPages = []
  for (const element of $('script[type="application/ld+json"]').toArray()) {
    try {
      const data = JSON.parse($(element).text())
      typedJsonLdItems(data, 'VideoObject', videoObjects)
      if (isWatchPage) typedJsonLdItems(data, 'WebPage', webPages)
    } catch {
      // The general JSON-LD validation below reports the parse error.
    }
  }

  if (isWatchPage) {
    const videoId = htmlFile.split('/')[1]
    const canonical = `${siteOrigin}/youtube/${videoId}/`
    if (!html.includes('Generated by tools/sync-video-pages.mjs')) {
      errors.push(`${htmlFile}: dedicated watch page is not generated by the video sync tool`)
    }
    if (videoPlayers.length !== 1 || videoFrames.length !== 1) {
      errors.push(`${htmlFile}: dedicated watch page must have exactly one supported video player, a YouTube iframe (found ${videoPlayers.length} players and ${videoFrames.length} video iframes)`)
    } else {
      const embedUrl = youtubeEmbedUrl(videoFrames.attr('src'))
      if (!embedUrl || embedUrl.protocol !== 'https:' || embedUrl.pathname.replace(/\/$/, '') !== `/embed/${videoId}`) {
        errors.push(`${htmlFile}: iframe ${videoFrames.attr('src') || '(missing src)'} does not match watch-page video ${videoId}`)
      }
      if ((videoFrames.attr('loading') || '').toLowerCase() === 'lazy' ||
          videoFrames.attr('data-src') !== undefined || videoFrames.attr('srcdoc') !== undefined) {
        errors.push(`${htmlFile}: primary video must load directly from src without lazy loading, data-src, or srcdoc`)
      }
      if (!(Number(videoFrames.attr('width')) > 0) || !(Number(videoFrames.attr('height')) > 0)) {
        errors.push(`${htmlFile}: primary video must declare positive width and height`)
      }
      if (videoFrames.add(videoFrames.parents()).toArray().some((element) =>
        isStaticallyHidden($, element) || $(element).attr('aria-hidden') === 'true',
      )) {
        errors.push(`${htmlFile}: primary video must not be hidden`)
      }
    }
    const main = $('main')
    const primary = $('main > [data-primary-video="true"]')
    const firstVisibleContent = main.first().contents().toArray().find((element) =>
      element.type === 'text' ? element.data.trim().length > 0 :
        element.type !== 'comment' && !isStaticallyHidden($, element),
    )
    if (main.length !== 1 || primary.length !== 1 || firstVisibleContent !== primary[0] ||
        !primary.find('iframe').toArray().includes(videoFrames[0])) {
      errors.push(`${htmlFile}: primary video container must be the first visible content directly inside the single main element`)
    }
    const canonicals = $('link').filter((_, element) =>
      (($(element).attr('rel') || '').toLowerCase().split(/\s+/)).includes('canonical'),
    )
    if (canonicals.length !== 1 || canonicals.attr('href') !== canonical) {
      errors.push(`${htmlFile}: dedicated watch page must have canonical ${canonical}`)
    }
    if (videoObjects.length !== 1) {
      errors.push(`${htmlFile}: expected exactly one VideoObject (found ${videoObjects.length})`)
    } else {
      const video = videoObjects[0]
      for (const required of ['name', 'description', 'thumbnailUrl', 'uploadDate', 'embedUrl']) {
        if (!video[required]) errors.push(`${htmlFile}: VideoObject is missing ${required}`)
      }
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/i.test(String(video.uploadDate || ''))) {
        errors.push(`${htmlFile}: VideoObject uploadDate must include a valid time and time zone`)
      }
      const schemaEmbedUrl = youtubeEmbedUrl(video.embedUrl)
      if (!schemaEmbedUrl || schemaEmbedUrl.protocol !== 'https:' || schemaEmbedUrl.pathname.replace(/\/$/, '') !== `/embed/${videoId}`) {
        errors.push(`${htmlFile}: VideoObject embedUrl does not match ${videoId}`)
      }
      if (video['@id'] !== `${canonical}#video` || video.url !== canonical ||
          video.mainEntityOfPage?.['@id'] !== `${canonical}#webpage`) {
        errors.push(`${htmlFile}: VideoObject must identify this watch page and reference its WebPage`)
      }
    }
    if (webPages.length !== 1 || webPages[0]['@id'] !== `${canonical}#webpage` ||
        webPages[0].url !== canonical || webPages[0].mainEntity?.['@id'] !== `${canonical}#video`) {
      errors.push(`${htmlFile}: WebPage mainEntity must reference this watch page's VideoObject`)
    }
  } else {
    const unexcludedPlayers = videoPlayers.filter((_, element) => {
      const player = $(element)
      // Google permits supplementary media. The known homepage previews retain
      // their design and are explicitly excluded at the media-response level.
      if (htmlFile !== 'index.html' || element.tagName !== 'video') return true
      const src = player.attr('src') || ''
      const poster = player.attr('poster') || ''
      return !decorativeVideoPaths.includes(src) || !hasExactNoindexHeader(hosting, src) ||
        (poster && (!decorativePosterPaths.includes(poster) || !hasExactNoindexHeader(hosting, poster)))
    })
    if (unexcludedPlayers.length > 0) {
      errors.push(`${htmlFile}: indexable video players must live on a dedicated /youtube/{id}/ watch page`)
    }
    if (videoObjects.length > 0) {
      errors.push(`${htmlFile}: VideoObject structured data is reserved for dedicated watch pages`)
    }
    const videoMeta = $('meta').filter((_, element) => {
      const meta = $(element)
      const content = (meta.attr('content') || '').trim().toLowerCase()
      return ['name', 'property'].some((attribute) => {
        const key = (meta.attr(attribute) || '').trim().toLowerCase()
        return /^(?:og:video|twitter:player)(?::|$)/.test(key) ||
          (key === 'og:type' && /^video(?:\.|$)/.test(content)) ||
          (key === 'twitter:card' && content === 'player')
      })
    })
    if (videoMeta.length > 0) {
      errors.push(`${htmlFile}: Open Graph and Twitter video-player declarations are reserved for dedicated watch pages`)
    }
  }

  for (const card of $('[data-izem-video-card="true"][data-video-id]').toArray()) {
    const videoId = $(card).attr('data-video-id')
    const href = $(card).attr('href')
    if (href !== `/youtube/${videoId}/`) {
      errors.push(`${htmlFile}: video card ${videoId} must link to /youtube/${videoId}/`)
    }
  }

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

if (!allFiles.has(videoSitemapFile)) {
  errors.push(`${videoSitemapFile}: missing generated video sitemap`)
} else {
  const videoSitemap = await readFile(path.join(distDirectory, videoSitemapFile), 'utf8')
  const entries = [...videoSitemap.matchAll(/<url>\s*([\s\S]*?)\s*<\/url>/g)].map((match) => match[1])

  for (const entry of entries) {
    const location = entry.match(/<loc>([^<]+)<\/loc>/)?.[1]?.trim()
    const playerLocation = entry.match(/<video:player_loc\b[^>]*>([^<]+)<\/video:player_loc>/)?.[1]?.trim()
    if (!location) {
      errors.push(`${videoSitemapFile}: entry is missing loc`)
      continue
    }

    const normalizedLocation = normalizedIndexUrl(location)
    if (videoSitemapUrls.has(normalizedLocation)) {
      errors.push(`${videoSitemapFile}: duplicate watch page ${location}`)
    }
    videoSitemapUrls.add(normalizedLocation)

    const match = new URL(location).pathname.match(/^\/youtube\/([^/]+)\/?$/)
    const videoId = match?.[1]
    if (!videoId) errors.push(`${videoSitemapFile}: ${location} is not a dedicated watch page`)
    if (!playerLocation || !playerLocation.includes(`/embed/${videoId}`)) {
      errors.push(`${videoSitemapFile}: ${location} has a missing or mismatched player_loc`)
    }
    for (const requiredTag of ['video:thumbnail_loc', 'video:title', 'video:description', 'video:publication_date']) {
      if (!entry.includes(`<${requiredTag}>`)) errors.push(`${videoSitemapFile}: ${location} is missing ${requiredTag}`)
    }
    const publicationDate = entry.match(/<video:publication_date>([^<]+)<\/video:publication_date>/)?.[1]?.trim()
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/i.test(publicationDate || '')) {
      errors.push(`${videoSitemapFile}: ${location} publication_date must include a valid time and time zone`)
    }
    if (!targetExists(new URL(location), allFiles)) {
      errors.push(`${videoSitemapFile}: ${location} has no built watch page`)
    }
  }

  const watchPages = htmlFiles.filter((file) => /^youtube\/[^/]+\/index\.html$/.test(file))
  for (const watchPage of watchPages) {
    const videoId = watchPage.split('/')[1]
    const location = normalizedIndexUrl(`${siteOrigin}/youtube/${videoId}/`)
    if (!videoSitemapUrls.has(location)) {
      errors.push(`${watchPage}: dedicated watch page is missing from ${videoSitemapFile}`)
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

for (const videoLocation of videoSitemapUrls) {
  if (!sitemapCanonicalUrls.has(videoLocation)) {
    errors.push(`${videoSitemapFile}: ${videoLocation} is missing from sitemap.xml`)
  }
}

const newsSitemapFile = 'news-sitemap.xml'
if (allFiles.has(newsSitemapFile)) {
  const newsSitemap = await readFile(path.join(distDirectory, newsSitemapFile), 'utf8')
  for (const location of [...newsSitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim())) {
    let url
    try {
      url = new URL(location)
    } catch {
      errors.push(`${newsSitemapFile}: invalid URL ${location}`)
      continue
    }
    if (!targetExists(url, allFiles)) errors.push(`${newsSitemapFile}: ${location} has no built target`)
    if (!sitemapCanonicalUrls.has(normalizedIndexUrl(url))) {
      errors.push(`${newsSitemapFile}: ${location} is missing from sitemap.xml`)
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

const canonicalPageAudits = new Map()
const inboundCanonicalLinks = new Map([...sitemapCanonicalUrls].map((url) => [url, 0]))

for (const htmlFile of htmlFiles) {
  const html = await readFile(path.join(distDirectory, htmlFile), 'utf8')
  const $ = load(html)
  const robots = $('meta[name="robots"]').attr('content') || ''
  if (/(?:^|,)\s*noindex(?:\s|,|$)/i.test(robots)) continue

  const canonicalHref = $('link[rel="canonical"]').attr('href')
  if (!canonicalHref) continue
  let canonicalUrl
  try {
    canonicalUrl = new URL(canonicalHref, pageUrl(htmlFile))
  } catch {
    continue
  }
  const canonical = normalizedIndexUrl(canonicalUrl)

  const title = $('title').text().trim()
  const description = $('meta[name="description"]').attr('content')?.trim() || ''
  const language = $('html').attr('lang')?.trim() || ''
  if (!title) errors.push(`${htmlFile}: indexable page is missing a title`)
  if (!description) errors.push(`${htmlFile}: indexable page is missing a meta description`)
  if (!language) errors.push(`${htmlFile}: indexable page is missing an html lang attribute`)
  if ($('h1').length !== 1) {
    errors.push(`${htmlFile}: indexable page must have exactly one h1 (found ${$('h1').length})`)
  }
  for (const image of $('img').toArray()) {
    if ($(image).attr('alt') === undefined) errors.push(`${htmlFile}: image is missing alt text`)
    if (!$(image).attr('width') || !$(image).attr('height')) {
      errors.push(`${htmlFile}: image ${$(image).attr('src') || '(unknown source)'} is missing width or height`)
    }
  }

  const target = targetFile(canonicalUrl, allFiles)
  const current = canonicalPageAudits.get(canonical)
  const audit = { htmlFile, title, description }
  if (!current || target === htmlFile) canonicalPageAudits.set(canonical, audit)

  for (const anchor of $('a[href]').toArray()) {
    const href = $(anchor).attr('href')
    if (!href) continue
    try {
      const url = resolveInternalUrl(href, htmlFile)
      if (!url) continue
      const destination = normalizedIndexUrl(url)
      if (destination !== canonical && inboundCanonicalLinks.has(destination)) {
        inboundCanonicalLinks.set(destination, inboundCanonicalLinks.get(destination) + 1)
      }
    } catch {
      // The general link validation above reports malformed href values.
    }
  }
}

for (const [canonical, inboundLinks] of inboundCanonicalLinks) {
  if (canonical !== siteOrigin && inboundLinks === 0) {
    errors.push(`${canonical}: sitemap page has no inbound internal link`)
  }
}

for (const field of ['title', 'description']) {
  const owners = new Map()
  for (const [canonical, page] of canonicalPageAudits) {
    if (!sitemapCanonicalUrls.has(canonical)) continue
    const key = page[field].toLowerCase()
    if (!key) continue
    const urls = owners.get(key) || []
    urls.push(canonical)
    owners.set(key, urls)
  }
  for (const [value, urls] of owners) {
    if (urls.length > 1) {
      errors.push(`duplicate ${field} on ${urls.join(', ')}: ${value.slice(0, 120)}`)
    }
  }
}

if (errors.length > 0) {
  console.error(`Link check failed with ${errors.length} error(s):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exitCode = 1
} else {
  console.log(`Link check passed: ${htmlFiles.length} pages and ${checkedLinks} internal links checked.`)
}
