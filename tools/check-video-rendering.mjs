import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import express from 'express'
import puppeteer from 'puppeteer'
import { load } from 'cheerio'
import { decorativeVideoPaths, decorativePosterPaths, decorativePosterUrls, hasExactNoindexHeader } from './video-indexing-policy.mjs'
import heroPreviewMedia from '../src/content/hero-preview-media.json' with { type: 'json' }

// Inspect the browser DOM as well as generated HTML. Homepage previews are
// inserted by React and scroll observers and need media-level exclusions.
const root = path.resolve(process.argv[2] || 'dist')
const homepageHtml = await readFile(path.join(root, 'index.html'), 'utf8')
const homepage = load(homepageHtml)
const initialHero = homepage('#hero [data-izem-hero-preview="true"]')
assert.equal(initialHero.length, 1, 'Initial HTML must contain exactly one hero preview')
assert.equal(initialHero[0].tagName, 'img', 'Initial hero must use a lightweight matching still')
assert.equal(initialHero.attr('src'), decorativePosterUrls[0], 'Initial hero must show the versioned coaching preview')
for (const obsoletePoster of decorativePosterPaths) {
  assert.equal(homepage(`[src="${obsoletePoster}"], [poster="${obsoletePoster}"]`).length, 0,
    `Homepage must not reference an unversioned ${obsoletePoster}`)
}
for (const [index, preview] of heroPreviewMedia.entries()) {
  assert.equal(preview.posterPath, decorativePosterPaths[index])
  assert.equal(preview.videoPath, decorativeVideoPaths[index])
  const bytes = await readFile(path.join(root, preview.posterPath))
  assert.equal(createHash('sha256').update(bytes).digest('hex'), preview.posterSha256,
    `${preview.posterPath}: fallback bytes must match their cache-busting version`)
}
const catalog = JSON.parse(await readFile(path.join(root, 'youtube/video-catalog.json'), 'utf8'))
const { hosting } = JSON.parse(await readFile('firebase.json', 'utf8'))
for (const resource of [...decorativeVideoPaths, ...decorativePosterPaths]) {
  assert.ok(hasExactNoindexHeader(hosting, resource), `${resource}: missing exact media exclusion`)
}
assert.ok(catalog.videos?.length, 'Video catalog must contain watch pages')
const app = express()
app.use(express.static(root))
const server = await new Promise((resolve, reject) => {
  const instance = app.listen(0, '127.0.0.1', () => resolve(instance))
  instance.once('error', reject)
})
const origin = `http://127.0.0.1:${server.address().port}`
const executablePath = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].find((candidate) => candidate && existsSync(candidate))
let browser

try {
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    ...(executablePath ? { executablePath } : {}),
  })
  const page = await browser.newPage()
  const requestedPaths = new Set()
  let holdPreviewVideo = false
  const heldVideoRequests = []
  // Fetch each viewport sample afresh so conditional cache responses do not
  // replace the HTTP 200 reachability check on repeated visits.
  await page.setCacheEnabled(false)
  await page.setRequestInterception(true)
  page.on('request', (request) => {
    const url = new URL(request.url())
    requestedPaths.add(`${url.pathname}${url.search}`)
    // This check tests our layout and hydration, not third-party availability.
    // Keep production builds independent of YouTube, fonts and external APIs.
    if (holdPreviewVideo && url.origin === origin && decorativeVideoPaths.includes(url.pathname)) {
      heldVideoRequests.push(request)
    } else if (request.url().startsWith(`${origin}/`) || request.url().startsWith('data:')) request.continue()
    else request.abort()
  })

  // Check the actual first-render HTML without the application bundle. A slow
  // bundle must not expose an old screenshot or start an animation.
  await page.setJavaScriptEnabled(false)
  for (const width of [390, 1440]) {
    await page.setViewport({ width, height: 900 })
    await page.goto(origin, { waitUntil: 'networkidle0' })
    const state = await page.$eval('#hero img[data-izem-hero-preview]', (preview) => ({
      src: preview.getAttribute('src'), complete: preview.complete,
      naturalWidth: preview.naturalWidth,
    }))
    assert.equal(state.src, decorativePosterUrls[0])
    assert.ok(state.complete && state.naturalWidth > 0,
      `Initial hero at ${width}px must load an intended still without JavaScript`)
  }
  await page.setJavaScriptEnabled(true)

  // Hold the actual media response through React startup. The matching poster
  // must cover the new video node while its first frame is still unavailable.
  await page.setViewport({ width: 1440, height: 900 })
  holdPreviewVideo = true
  await page.goto(origin, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#hero video')
  const pendingPreview = await page.$eval('#hero video', async (preview) => {
    const poster = new Image()
    poster.src = preview.getAttribute('poster') || ''
    await poster.decode()
    return { src: preview.getAttribute('src'), poster: preview.getAttribute('poster'),
      readyState: preview.readyState, posterWidth: poster.naturalWidth }
  })
  assert.equal(pendingPreview.src, decorativeVideoPaths[0])
  assert.equal(pendingPreview.poster, decorativePosterUrls[0])
  assert.equal(pendingPreview.readyState, 0, 'Regression must inspect the preview before its media frame loads')
  assert.ok(pendingPreview.posterWidth > 0, 'Matching poster must decode while the video is pending')
  holdPreviewVideo = false
  await Promise.all(heldVideoRequests.splice(0).map((request) => request.continue()))
  await page.waitForFunction(() => document.querySelector('#hero video')?.readyState >= 2)

  const assertHomepagePreview = async (section) => {
    const state = await page.evaluate((selector) => {
      const preview = document.querySelector(`${selector} video, ${selector} img[data-izem-hero-preview]`)
      const videoFrames = [...document.querySelectorAll('iframe')].filter((frame) =>
        /youtube(?:-nocookie)?\.com\/embed\//i.test(frame.src || frame.dataset.src || frame.srcdoc || ''),
      )
      return {
        videoFrames: videoFrames.length,
        videos: [...document.querySelectorAll('video')].map((video) => ({
          src: video.getAttribute('src'), poster: video.getAttribute('poster'),
        })),
        previewLoaded: Boolean(preview && (preview.tagName === 'VIDEO'
          ? preview.readyState >= 2 : preview.complete && preview.naturalWidth > 0)),
      }
    }, section)
    assert.equal(state.videoFrames, 0, 'Homepage must link to dedicated watch pages for YouTube guides')
    for (const video of state.videos) {
      assert.ok(decorativeVideoPaths.includes(video.src) && hasExactNoindexHeader(hosting, video.src),
        `Homepage video ${video.src} must have an explicit media exclusion`)
      if (video.poster) assert.ok(decorativePosterUrls.includes(video.poster) && hasExactNoindexHeader(hosting, video.poster),
        `Homepage poster ${video.poster} must have an explicit media exclusion`)
    }
    assert.ok(state.previewLoaded, `${section}: existing preview must load`)
  }

  for (const width of [390, 1440]) {
    await page.setViewport({ width, height: 900 })
    await page.goto(origin, { waitUntil: 'networkidle0' })
    await page.waitForSelector('#hero [data-izem-hero-preview="true"]')
    for (const section of ['#hero', '#showcase']) {
      await page.$eval(section, (element) => element.scrollIntoView())
      const buttons = await page.$$(`${section} button`)
      const expectedSources = section === '#hero'
        ? width < 768 ? decorativePosterUrls : decorativeVideoPaths
        : [decorativeVideoPaths[1], decorativeVideoPaths[1], decorativeVideoPaths[0]]
      assert.equal(buttons.length, expectedSources.length, `${section}: every preview tab needs a checked source`)
      for (const [index, button] of buttons.entries()) {
        await button.click()
        await page.waitForFunction((element) => element.getAttribute('aria-pressed') === 'true', {}, button)
        await page.waitForFunction((selector, expectedSource) => {
          const preview = document.querySelector(`${selector} video, ${selector} img[data-izem-hero-preview]`)
          return preview?.getAttribute('src') === expectedSource && (preview.tagName === 'VIDEO'
            ? preview.readyState >= 2 : preview.complete && preview.naturalWidth > 0)
        }, {}, section, expectedSources[index])
        await assertHomepagePreview(section)
        if (section === '#hero') {
          const state = await page.$eval('#hero [data-izem-hero-preview]', (preview) => ({
            tag: preview.tagName, paused: preview.paused,
          }))
          assert.equal(state.tag, width < 768 ? 'IMG' : 'VIDEO')
          if (width >= 768) assert.equal(state.paused, false)
        }
      }
    }
  }

  // A preference change must replace a playing preview with its intended still.
  await page.setViewport({ width: 1440, height: 900 })
  await page.goto(origin, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => document.querySelector('#hero video')?.paused === false)
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.waitForSelector('#hero img[data-izem-hero-preview]')
  const reducedMotionButtons = await page.$$('#hero button')
  for (const [index, button] of reducedMotionButtons.entries()) {
    await button.click()
    await page.waitForFunction((expectedSource) => {
      const preview = document.querySelector('#hero img[data-izem-hero-preview]')
      return preview?.getAttribute('src') === expectedSource && preview.complete && preview.naturalWidth > 0
    }, {}, decorativePosterUrls[index])
  }
  await page.emulateMediaFeatures([])
  await page.waitForFunction(() => document.querySelector('#hero video')?.paused === false)
  await page.setViewport({ width: 390, height: 900 })
  await page.waitForSelector('#hero img[data-izem-hero-preview]')
  for (const obsoletePoster of decorativePosterPaths) {
    assert.equal(requestedPaths.has(obsoletePoster), false, `Homepage must never request ${obsoletePoster}`)
  }

  const longestTitle = [...catalog.videos].sort((a, b) => b.title.length - a.title.length)[0]
  const samples = [...new Map([catalog.videos[0], longestTitle].map((video) => [video.id, video])).values()]
  let layouts = 0
  for (const width of [320, 390, 1440]) {
    await page.setViewport({ width, height: 900 })
    for (const video of samples) {
      const route = `/youtube/${video.id}/`
      const response = await page.goto(`${origin}${route}`, { waitUntil: 'networkidle0' })
      assert.equal(response.status(), 200, `${route}: watch page must be reachable`)
      const state = await page.evaluate(() => {
        const frame = document.querySelector('main [data-primary-video="true"] iframe')
        const title = document.querySelector('main h1')
        const rect = frame?.getBoundingClientRect()
        const style = frame && getComputedStyle(frame)
        return {
          frameCount: document.querySelectorAll('iframe, video').length,
          width: rect?.width,
          height: rect?.height,
          top: rect?.top,
          bottom: rect?.bottom,
          titleTop: title?.getBoundingClientRect().top,
          visible: Boolean(rect && style?.display !== 'none' && style?.visibility === 'visible' && style?.opacity !== '0'),
          viewportHeight: innerHeight,
          overflow: document.documentElement.scrollWidth > innerWidth,
        }
      })
      assert.equal(state.frameCount, 1, `${route}: exactly one player must be rendered`)
      assert.ok(state.visible && state.width >= 200 && state.height >= 200,
        `${route} at ${width}px: player must meet YouTube's 200 x 200 minimum, got ${state.width} x ${state.height}`)
      assert.ok(state.top >= 0 && state.bottom <= state.viewportHeight,
        `${route} at ${width}px: primary player must be fully in the first viewport`)
      assert.ok(state.titleTop >= state.bottom, `${route}: title must follow the primary player`)
      assert.equal(state.overflow, false, `${route} at ${width}px: page must not overflow horizontally`)
      console.log(`${route} at ${width}px: player ${state.width} x ${state.height}, top ${state.top}px`)
      layouts += 1
    }
  }
  console.log(`Video rendering passed: initial and runtime homepage previews at 2 widths, reduced-motion and resize transitions; ${layouts} mobile/desktop watch-page layouts.`)
} finally {
  await browser?.close()
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
}
