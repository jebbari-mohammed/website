import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import express from 'express'
import puppeteer from 'puppeteer'
import { load } from 'cheerio'
import { decorativeVideoPaths, decorativePosterPaths, hasExactNoindexHeader } from './video-indexing-policy.mjs'

// Inspect the browser DOM as well as generated HTML. Homepage previews are
// inserted by React and scroll observers and need media-level exclusions.
const root = path.resolve(process.argv[2] || 'dist')
const homepageHtml = await readFile(path.join(root, 'index.html'), 'utf8')
const homepage = load(homepageHtml)
const initialHero = homepage('#hero [data-izem-hero-preview="true"]')
assert.equal(initialHero.length, 1, 'Initial HTML must contain exactly one hero preview')
assert.equal(initialHero[0].tagName, 'video', 'Initial hero must use the same video as the loaded page')
assert.equal(initialHero.attr('src'), decorativeVideoPaths[0], 'Initial hero must show the coaching preview')
assert.equal(initialHero.attr('poster'), undefined, 'Initial hero must not flash an unrelated poster')
assert.equal(initialHero.attr('autoplay'), undefined, 'Initial hero must wait for runtime motion preferences')
assert.equal(initialHero.attr('loop'), undefined, 'Initial hero must start paused')
for (const obsoletePoster of decorativePosterPaths) {
  assert.equal(homepageHtml.includes(obsoletePoster), false, `Homepage must not reference ${obsoletePoster}`)
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
  // Fetch each viewport sample afresh so conditional cache responses do not
  // replace the HTTP 200 reachability check on repeated visits.
  await page.setCacheEnabled(false)
  await page.setRequestInterception(true)
  page.on('request', (request) => {
    requestedPaths.add(new URL(request.url()).pathname)
    // This check tests our layout and hydration, not third-party availability.
    // Keep production builds independent of YouTube, fonts and external APIs.
    if (request.url().startsWith(`${origin}/`) || request.url().startsWith('data:')) request.continue()
    else request.abort()
  })

  // Check the actual first-render HTML without the application bundle. A slow
  // bundle must not expose an old screenshot or animate before preferences run.
  await page.setJavaScriptEnabled(false)
  for (const width of [390, 1440]) {
    await page.setViewport({ width, height: 900 })
    await page.goto(origin, { waitUntil: 'networkidle0' })
    const state = await page.$eval('#hero video', (preview) => ({
      src: preview.getAttribute('src'), readyState: preview.readyState,
      paused: preview.paused, poster: preview.getAttribute('poster'),
    }))
    assert.equal(state.src, decorativeVideoPaths[0])
    assert.equal(state.poster, null)
    assert.ok(state.readyState >= 2, `Initial hero at ${width}px must load an intended frame without JavaScript`)
    assert.equal(state.paused, true, `Initial hero at ${width}px must remain paused`)
  }
  await page.setJavaScriptEnabled(true)

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
      if (video.poster) assert.ok(decorativePosterPaths.includes(video.poster) && hasExactNoindexHeader(hosting, video.poster),
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
        ? decorativeVideoPaths
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
          await page.waitForFunction((shouldPause) => {
            const preview = document.querySelector('#hero video')
            return preview?.paused === shouldPause
          }, {}, width < 768)
        }
      }
    }
  }

  // A preference change must stop an already playing preview, and each tab
  // must remain still when reduced motion is requested on desktop.
  await page.setViewport({ width: 1440, height: 900 })
  await page.goto(origin, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => document.querySelector('#hero video')?.paused === false)
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.waitForFunction(() => document.querySelector('#hero video')?.paused === true)
  const reducedMotionButtons = await page.$$('#hero button')
  for (const [index, button] of reducedMotionButtons.entries()) {
    await button.click()
    await page.waitForFunction((expectedSource) => {
      const preview = document.querySelector('#hero video')
      return preview?.getAttribute('src') === expectedSource && preview.readyState >= 2 && preview.paused
    }, {}, decorativeVideoPaths[index])
  }
  await page.emulateMediaFeatures([])
  await page.waitForFunction(() => document.querySelector('#hero video')?.paused === false)
  await page.setViewport({ width: 390, height: 900 })
  await page.waitForFunction(() => document.querySelector('#hero video')?.paused === true)
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
