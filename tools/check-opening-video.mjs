import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import express from 'express'
import puppeteer from 'puppeteer'

// Exercise the real component and media over HTTP, including the browser's
// audible-autoplay restriction. No autoplay or playback APIs are mocked.
const root = path.resolve(process.argv[2] || 'dist')
const screenshotDirectory = process.env.OPENING_VIDEO_SCREENSHOT_DIR
  ? path.resolve(process.env.OPENING_VIDEO_SCREENSHOT_DIR) : ''
const section = '#opening-film'
const player = `${section} video[data-izem-opening-video]`
const mobileVideo = '/videos/intro/izem-unfair-advantage-mobile-v2.mp4'
const desktopVideo = '/videos/intro/izem-unfair-advantage-desktop-v2.mp4'
const mobilePoster = '/images/intro/izem-unfair-advantage-mobile-v2.webp'
const desktopPoster = '/images/intro/izem-unfair-advantage-desktop-v2.webp'
const introVideos = [mobileVideo, desktopVideo]
assert.ok(existsSync(path.join(root, 'index.html')), `Build first: ${root}/index.html is missing`)
if (screenshotDirectory) await mkdir(screenshotDirectory, { recursive: true })

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

async function waitWithoutGesture(page, expression) {
  // Puppeteer's evaluate/waitForFunction sets CDP userGesture=true. Before the
  // initial autoplay decision, use the protocol directly so a test read does
  // not accidentally grant the activation we are trying to verify is absent.
  const session = await page.createCDPSession()
  const deadline = Date.now() + 30000
  try {
    while (Date.now() < deadline) {
      const { result, exceptionDetails } = await session.send('Runtime.evaluate', {
        expression, returnByValue: true, userGesture: false,
      })
      assert.equal(exceptionDetails, undefined, 'Initial autoplay probe must not throw')
      if (result.value) return
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    assert.fail(`Timed out waiting without user activation: ${expression}`)
  } finally {
    await session.detach()
  }
}

async function newPage(viewport, options = {}) {
  const page = await browser.newPage()
  const requestedVideos = []
  const pendingMedia = []
  const runtimeErrors = []
  await page.setViewport(viewport)
  if (options.noJavaScript) await page.setJavaScriptEnabled(false)
  await page.setCacheEnabled(false)
  await page.setRequestInterception(true)
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (introVideos.includes(url.pathname)) {
      requestedVideos.push(url.pathname)
      if (options.holdMedia) {
        pendingMedia.push(request)
        return
      }
      if (options.failMedia) {
        void request.abort('failed')
        return
      }
    }
    if (url.origin === origin || url.protocol === 'data:') void request.continue()
    else void request.abort()
  })
  if (options.reducedMotion) {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  }
  if (options.saveData) {
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator.connection, 'saveData', { configurable: true, get: () => true })
    })
  }
  await page.goto(origin, { waitUntil: 'domcontentloaded' })
  if (options.noJavaScript) await page.waitForSelector(section)
  else await waitWithoutGesture(page, `Boolean(document.querySelector('${player}'))`)
  if (!options.noJavaScript && !options.reducedMotion && !options.saveData && !options.failMedia) {
    await waitWithoutGesture(page, options.holdMedia
      ? `document.querySelector('${player}')?.muted === true`
      : `(() => { const v = document.querySelector('${player}'); return v?.readyState >= 2 && !v.paused })()`)
  }
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
  return { page, requestedVideos, pendingMedia, runtimeErrors }
}

async function state(page) {
  return page.$eval(player, (video) => {
    const opening = video.closest('#opening-film')
    const rect = opening.getBoundingClientRect()
    const videoRect = video.getBoundingClientRect()
    const barRect = opening.querySelector('.opening-film__bar').getBoundingClientRect()
    const image = opening.querySelector('picture img')
    const picture = image?.closest('picture')
    return {
      src: video.currentSrc || video.getAttribute('src') || '',
      paused: video.paused,
      muted: video.muted,
      readyState: video.readyState,
      currentTime: video.currentTime,
      ended: video.ended,
      loop: video.loop,
      playsInline: video.playsInline,
      fit: getComputedStyle(video).objectFit,
      top: rect.top,
      bottom: rect.bottom,
      height: rect.height,
      viewportHeight: innerHeight,
      viewportWidth: innerWidth,
      videoRect: { top: videoRect.top, left: videoRect.left, width: videoRect.width, height: videoRect.height },
      barBottom: barRect.bottom,
      overflow: document.documentElement.scrollWidth > innerWidth,
      posterSrc: image?.currentSrc || image?.src || '',
      posterLoaded: Boolean(image?.complete && image.naturalWidth > 0),
      posterVisible: Boolean(image && picture && getComputedStyle(picture).visibility === 'visible' &&
        getComputedStyle(picture).display !== 'none' && image.getBoundingClientRect().height > 0),
    }
  })
}

async function waitForPlayback(page) {
  await page.waitForFunction((selector) => {
    const video = document.querySelector(selector)
    return video && video.readyState >= 2 && !video.paused
  }, { timeout: 30000 }, player)
}

async function assertLayout(page, label) {
  const sample = await state(page)
  assert.equal(sample.overflow, false, `${label}: horizontal overflow`)
  assert.ok(Math.abs(sample.height - sample.viewportHeight) <= 2,
    `${label}: opening must fill one viewport (${sample.height}/${sample.viewportHeight})`)
  assert.equal(sample.fit, 'cover', `${label}: fill the screen without letterboxing`)
  assert.ok(Math.abs(sample.videoRect.top) <= 2 && Math.abs(sample.videoRect.left) <= 2,
    `${label}: video must start at the top-left of the viewport`)
  assert.ok(Math.abs(sample.videoRect.width - sample.viewportWidth) <= 2 &&
    Math.abs(sample.videoRect.height - sample.viewportHeight) <= 2,
    `${label}: video must cover the full viewport behind navigation and controls`)
  assert.ok(Math.abs(sample.barBottom - sample.viewportHeight) <= 2,
    `${label}: floating controls must stay at the bottom of the viewport`)
  assert.equal(sample.loop, false, `${label}: narration must not loop`)
  assert.equal(sample.playsInline, true, `${label}: mobile playback must stay inline`)
  assert.equal(await page.$$eval(`${section} a[href="#hero"]`, (links) => links.length), 1,
    `${label}: scroll cue must lead to the existing hero`)
  assert.equal(await page.$$eval('main h1', (headings) => headings.length), 1,
    `${label}: existing homepage heading must remain intact`)
  assert.equal(await page.$$eval('#faq', (elements) => elements.length), 1,
    `${label}: existing FAQ must remain reachable`)
}

async function scrollAway(page) {
  await page.evaluate(() => window.scrollTo({ top: innerHeight + 40, behavior: 'instant' }))
  await page.waitForFunction((selector) => document.querySelector(selector)?.getBoundingClientRect().bottom <= 0,
    {}, section)
  await page.waitForFunction((selector) => document.querySelector(selector)?.paused === true, {}, player)
}

async function returnToOpening(page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForFunction((selector) => Math.abs(document.querySelector(selector)?.getBoundingClientRect().top) <= 1,
    {}, section)
}

async function snapshot(page, name) {
  if (screenshotDirectory) await page.screenshot({ path: path.join(screenshotDirectory, `${name}.png`) })
}

try {
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=document-user-activation-required',
      '--disable-features=PreloadMediaEngagementData,MediaEngagementBypassAutoplayPolicies'],
    ...(executablePath ? { executablePath } : {}),
  })

  for (const [name, viewport, expectedPoster] of [
    ['mobile', { width: 390, height: 844 }, mobilePoster],
    ['desktop', { width: 1440, height: 900 }, desktopPoster],
  ]) {
    const { page, requestedVideos } = await newPage(viewport, { noJavaScript: true })
    await page.waitForFunction((selector) => {
      const image = document.querySelector(`${selector} picture img`)
      return image?.complete && image.naturalWidth > 0
    }, {}, section)
    const still = await page.$eval(`${section} picture img`, (image) => ({
      src: image.currentSrc,
      visible: getComputedStyle(image.closest('picture')).visibility === 'visible',
    }))
    assert.equal(new URL(still.src).pathname, expectedPoster, `${name}: first HTML must select the matching still`)
    assert.equal(still.visible, true, `${name}: initial still must remain visible without JavaScript`)
    assert.deepEqual(requestedVideos, [], `${name}: first HTML must not prefetch an unselected video variant`)
    await snapshot(page, `${name}-without-javascript`)
    await page.click(`${section} a[href="#hero"]`)
    await page.waitForFunction(() => document.querySelector('#hero')?.getBoundingClientRect().top < innerHeight)
    await page.close()
    console.log(`Opening film initial ${name} HTML: responsive still and scroll cue work before JavaScript.`)
  }

  for (const [name, viewport, expectedVideo, expectedPoster] of [
    ['mobile', { width: 390, height: 844 }, mobileVideo, mobilePoster],
    ['narrow-phone', { width: 320, height: 740 }, mobileVideo, mobilePoster],
    ['desktop', { width: 1440, height: 900 }, desktopVideo, desktopPoster],
    ['phone-landscape', { width: 660, height: 390 }, desktopVideo, desktopPoster],
  ]) {
    const { page, requestedVideos, runtimeErrors } = await newPage(viewport)
    await waitForPlayback(page)
    const sample = await state(page)
    assert.equal(new URL(sample.src).pathname, expectedVideo, `${name}: wrong responsive source`)
    assert.equal(sample.muted, true, `${name}: blocked audible autoplay must fall back to muted playback`)
    await page.waitForFunction((selector) => {
      const image = document.querySelector(`${selector} picture img`)
      return image?.complete && image.naturalWidth > 0
    }, {}, section)
    assert.equal(new URL((await state(page)).posterSrc).pathname, expectedPoster, `${name}: wrong responsive still`)
    assert.deepEqual([...new Set(requestedVideos)], [expectedVideo], `${name}: do not download both initial variants`)
    await assertLayout(page, name)
    await snapshot(page, name)
    assert.deepEqual(runtimeErrors, [], `${name}: browser runtime errors`)
    await page.close()
    console.log(`Opening film ${name}: correct single source, full-screen coverage, muted autoplay fallback.`)
  }

  {
    const { page, runtimeErrors } = await newPage({ width: 390, height: 844 })
    await waitForPlayback(page)
    // Let the muted opening move beyond its beginning before enabling audio.
    await page.waitForFunction((selector) => document.querySelector(selector)?.currentTime > 1.5, {}, player)
    await page.click(`${section} button[aria-label="Turn sound on"]`)
    await page.waitForFunction((selector) => {
      const video = document.querySelector(selector)
      return video && !video.muted && !video.paused && video.currentTime < 1.5
    }, {}, player)
    await page.click(`${section} button[aria-label="Turn sound off"]`)
    await page.waitForFunction((selector) => document.querySelector(selector)?.muted === true, {}, player)
    // A real foreground-tab change produces the document visibility event.
    const foregroundTab = await browser.newPage()
    await foregroundTab.bringToFront()
    await page.waitForFunction(() => document.visibilityState === 'hidden')
    await page.waitForFunction((selector) => document.querySelector(selector)?.paused === true, {}, player)
    await page.bringToFront()
    await page.waitForFunction(() => document.visibilityState === 'visible')
    await waitForPlayback(page)
    await foregroundTab.close()
    await scrollAway(page)
    await returnToOpening(page)
    await waitForPlayback(page)
    await page.focus(`${section} button[aria-label="Pause film"]`)
    await page.keyboard.press('Space')
    await page.waitForFunction((selector) => document.querySelector(selector)?.paused === true, {}, player)
    await scrollAway(page)
    await returnToOpening(page)
    // Allow an observer cycle before checking that manual pause stays sticky.
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    assert.equal((await state(page)).paused, true, 'Manual pause must survive scrolling away and returning')
    await page.click(`${section} button[aria-label="Play film"]`)
    await waitForPlayback(page)
    await page.setViewport({ width: 1440, height: 900 })
    await page.waitForFunction((selector, expected) => {
      const video = document.querySelector(selector)
      return video && new URL(video.currentSrc || video.src).pathname === expected && video.readyState >= 2
    }, {}, player, desktopVideo)
    await assertLayout(page, 'portrait-to-desktop resize')
    await page.setViewport({ width: 390, height: 844 })
    await page.waitForFunction((selector, expected) => {
      const video = document.querySelector(selector)
      return video && new URL(video.currentSrc || video.src).pathname === expected && video.readyState >= 2
    }, {}, player, mobileVideo)
    await assertLayout(page, 'desktop-to-portrait resize')
    await waitForPlayback(page)
    await page.$eval(player, (video) => { video.currentTime = video.duration - 0.1 })
    await page.waitForSelector(`${section} button[aria-label="Replay film"]`)
    assert.equal((await state(page)).paused, true, 'Completed narration must stop')
    await page.setViewport({ width: 1440, height: 900 })
    await page.waitForFunction((selector, expected) => {
      const video = document.querySelector(selector)
      return video && new URL(video.currentSrc || video.src).pathname === expected && video.readyState >= 2
    }, {}, player, desktopVideo)
    await page.waitForSelector(`${section} button[aria-label="Replay film"]`)
    assert.equal((await state(page)).paused, true, 'Completed film must stay stopped after switching to desktop')
    await page.setViewport({ width: 390, height: 844 })
    await page.waitForFunction((selector, expected) => {
      const video = document.querySelector(selector)
      return video && new URL(video.currentSrc || video.src).pathname === expected && video.readyState >= 2
    }, {}, player, mobileVideo)
    await page.waitForSelector(`${section} button[aria-label="Replay film"]`)
    assert.equal((await state(page)).paused, true, 'Completed film must stay stopped after returning to portrait')
    await page.click(`${section} button[aria-label="Replay film"]`)
    await waitForPlayback(page)
    assert.ok((await state(page)).currentTime < 1.5, 'Replay must start at the beginning')
    assert.deepEqual(runtimeErrors, [], 'Interactive controls: browser runtime errors')
    await page.close()
    console.log('Opening film controls: sound restart, mute, background-tab and scroll pause/resume, sticky keyboard pause, resize, ending and replay.')
  }

  for (const preference of ['reducedMotion', 'saveData']) {
    const { page, runtimeErrors } = await newPage({ width: 390, height: 844 }, { [preference]: true })
    await page.waitForSelector(`${section} button[aria-label="Play film"]`)
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 500)))
    assert.equal((await state(page)).paused, true, `${preference}: autoplay must be disabled`)
    assert.equal((await state(page)).currentTime, 0, `${preference}: video must remain at its beginning`)
    await page.click(`${section} button[aria-label="Play film"]`)
    await waitForPlayback(page)
    await assertLayout(page, preference)
    assert.deepEqual(runtimeErrors, [], `${preference}: browser runtime errors`)
    await page.close()
    console.log(`Opening film ${preference}: no autoplay; manual playback works.`)
  }

  {
    const { page, pendingMedia, runtimeErrors } = await newPage({ width: 390, height: 844 }, { holdMedia: true })
    await page.waitForFunction((selector) => {
      const image = document.querySelector(`${selector} picture img`)
      return image?.complete && image.naturalWidth > 0
    }, {}, section)
    assert.equal((await state(page)).readyState, 0, 'Slow media check must observe an unavailable video frame')
    assert.equal((await state(page)).posterVisible, true, 'Slow media: matching still must remain visible')
    await assertLayout(page, 'slow media')
    await snapshot(page, 'slow-media')
    await scrollAway(page)
    assert.ok(await page.$('#hero'), 'Existing homepage must remain reachable while media loads')
    await Promise.all(pendingMedia.splice(0).map((request) => request.abort('failed')))
    assert.deepEqual(runtimeErrors, [], 'Slow media: browser runtime errors')
    await page.close()
    console.log('Opening film slow media: responsive still and normal scrolling remain usable.')
  }

  {
    const { page, runtimeErrors } = await newPage({ width: 390, height: 844 }, { failMedia: true })
    await page.waitForFunction((selector) => Boolean(document.querySelector(selector)?.error), {}, player)
    await page.waitForFunction((selector) => {
      const image = document.querySelector(`${selector} picture img`)
      return image?.complete && image.naturalWidth > 0
    }, {}, section)
    assert.equal((await state(page)).posterVisible, true, 'Failed media: matching still must remain visible')
    await assertLayout(page, 'failed media')
    await snapshot(page, 'failed-media')
    await page.click(`${section} a[href="#hero"]`)
    await page.waitForFunction(() => document.querySelector('#hero')?.getBoundingClientRect().top < innerHeight)
    assert.deepEqual(runtimeErrors, [], 'Failed media: browser runtime errors')
    await page.close()
    console.log('Opening film failed media: responsive still and scroll cue remain usable.')
  }

  console.log('Opening video regression checks passed under strict browser autoplay policy.')
  if (screenshotDirectory) console.log(`Opening video screenshots: ${screenshotDirectory}`)
} finally {
  await browser?.close()
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
}
