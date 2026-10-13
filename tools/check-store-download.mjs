import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import express from 'express'
import puppeteer from 'puppeteer'

// Test local presentation and destinations. Store requests are intercepted;
// this deliberately makes no claim about public listing availability.
const root = path.resolve(process.argv[2] || 'dist')
const links = JSON.parse(await readFile(new URL('../src/content/store-links.json', import.meta.url), 'utf8'))
const screenshotDirectory = process.env.STORE_DOWNLOAD_SCREENSHOT_DIR
  ? path.resolve(process.env.STORE_DOWNLOAD_SCREENSHOT_DIR) : ''
const downloadSelector = '#opening-film a[data-izem-download="true"]'
assert.ok(existsSync(path.join(root, 'index.html')), 'Build the homepage before testing store downloads')
assert.ok(existsSync(path.join(root, 'download/index.html')), 'Built no-JavaScript /download/ chooser is missing')
assert.equal(new URL(links.apple).protocol, 'https:', 'Apple destination must use HTTPS')
assert.equal(new URL(links.google).protocol, 'https:', 'Google destination must use HTTPS')
if (screenshotDirectory) await mkdir(screenshotDirectory, { recursive: true })

const app = express()
app.use(express.static(root))
const server = await new Promise((resolve, reject) => {
  const instance = app.listen(0, '127.0.0.1', () => resolve(instance))
  instance.once('error', reject)
})
const origin = `http://127.0.0.1:${server.address().port}`
const storeOrigins = new Set([new URL(links.apple).origin, new URL(links.google).origin])
const executablePath = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find((candidate) => candidate && existsSync(candidate))
let browser

const profiles = {
  iphone: { platform: 'iPhone', target: 'apple', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' },
  android: { platform: 'Linux aarch64', target: 'android', ua: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' },
  mac: { platform: 'MacIntel', target: 'apple', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15' },
  ipadDesktop: { platform: 'MacIntel', target: 'apple', touchPoints: 5, ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15' },
  windows: { platform: 'Win32', target: 'other', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' },
  linux: { platform: 'Linux x86_64', target: 'other', ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' },
}

async function createPage(viewport, profile, noJavaScript = false) {
  const page = await browser.newPage()
  const runtimeErrors = []
  const interceptedStores = []
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  await page.setViewport(viewport)
  await page.setCacheEnabled(false)
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  if (noJavaScript) await page.setJavaScriptEnabled(false)
  if (profile) {
    const session = await page.createCDPSession()
    await session.send('Network.setUserAgentOverride', { userAgent: profile.ua, platform: profile.platform })
    if (profile.touchPoints) await page.evaluateOnNewDocument((count) => {
      Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: count })
    }, profile.touchPoints)
  }
  await page.setRequestInterception(true)
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (request.isNavigationRequest() && storeOrigins.has(url.origin)) {
      interceptedStores.push(request.url())
      void request.abort('blockedbyclient')
    } else if (url.origin === origin || url.protocol === 'data:') void request.continue()
    else void request.abort()
  })
  return { page, runtimeErrors, interceptedStores }
}

async function assertChooser(page, label) {
  const destinations = await page.$$eval('a.store', (anchors) => anchors.map((anchor) => anchor.href))
  assert.deepEqual(destinations, [links.apple, links.google], `${label}: chooser must preserve both configured store URLs`)
  const state = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    hasScript: document.querySelector('script') !== null,
    noindex: document.querySelector('meta[name="robots"]')?.content.includes('noindex'),
    back: document.querySelector('a.back')?.getAttribute('href'),
  }))
  assert.equal(state.overflow, false, `${label}: chooser must not overflow`)
  assert.equal(state.hasScript, false, `${label}: static chooser must work without JavaScript`)
  assert.equal(state.noindex, true, `${label}: chooser must retain noindex`)
  assert.equal(state.back, '/', `${label}: chooser must link back to IZEM`)
}

async function screenshot(page, name) {
  if (screenshotDirectory) await page.screenshot({ path: path.join(screenshotDirectory, `${name}.png`) })
}

try {
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=document-user-activation-required'],
    ...(executablePath ? { executablePath } : {}),
  })

  for (const [name, profile, viewport] of [
    ['iphone', profiles.iphone, { width: 390, height: 844 }],
    ['android', profiles.android, { width: 390, height: 844 }],
    ['mac', profiles.mac, { width: 1440, height: 900 }],
    ['ipad-desktop-mode', profiles.ipadDesktop, { width: 834, height: 1112 }],
    ['windows', profiles.windows, { width: 1440, height: 900 }],
    ['linux', profiles.linux, { width: 1440, height: 900 }],
    ['narrow-phone', profiles.iphone, { width: 320, height: 740 }],
    ['phone-landscape', profiles.android, { width: 660, height: 390 }],
  ]) {
    const { page, runtimeErrors, interceptedStores } = await createPage(viewport, profile)
    const response = await page.goto(origin, { waitUntil: 'domcontentloaded' })
    assert.equal(response.status(), 200, `${name}: homepage must be reachable`)
    await page.waitForFunction((selector, expected) => document.querySelector(selector)?.dataset.downloadPlatform === expected,
      {}, downloadSelector, profile.target)
    const expectedHref = profile.target === 'apple' ? links.apple : profile.target === 'android' ? links.google : `${origin}/download/`
    const state = await page.$eval(downloadSelector, (anchor) => ({
      href: anchor.href,
      count: document.querySelectorAll('[data-izem-download]').length,
      label: anchor.getAttribute('aria-label'),
      overflow: document.documentElement.scrollWidth > innerWidth,
      openingBottom: document.querySelector('#opening-film').getBoundingClientRect().bottom,
      viewportHeight: innerHeight,
    }))
    assert.equal(state.href, expectedHref, `${name}: wrong platform destination`)
    assert.equal(state.count, 1, `${name}: download action must not be duplicated by prerendering or StrictMode`)
    assert.ok(state.label?.startsWith('Download IZEM from '), `${name}: action needs its descriptive accessible label`)
    assert.equal(state.overflow, false, `${name}: download layout must not overflow`)
    assert.ok(state.openingBottom <= state.viewportHeight + 2, `${name}: controls must remain inside the first viewport`)
    const controlRects = await page.$$eval([
      '.store-download-button', '.opening-film__sound', '.opening-film__play', '.opening-film__explore',
    ].map((selector) => `#opening-film ${selector}`).join(','), (elements) => elements.map((element) => {
      const rect = element.getBoundingClientRect()
      return { name: element.className, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
        width: rect.width, height: rect.height, viewportWidth: innerWidth, viewportHeight: innerHeight }
    }))
    assert.equal(controlRects.length, 4, `${name}: preserve download, sound, playback and scroll controls`)
    for (const rect of controlRects) {
      assert.ok(rect.width >= 24 && rect.height >= 44, `${name}: ${rect.name} must retain a usable touch target`)
      assert.ok(rect.left >= 0 && rect.right <= rect.viewportWidth + 1 && rect.top >= 0 && rect.bottom <= rect.viewportHeight + 1,
        `${name}: ${rect.name} must remain fully visible`)
    }
    for (let first = 0; first < controlRects.length; first++) {
      for (let second = first + 1; second < controlRects.length; second++) {
        const a = controlRects[first], b = controlRects[second]
        const overlapWidth = Math.min(a.right, b.right) - Math.max(a.left, b.left)
        const overlapHeight = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
        assert.ok(overlapWidth <= 1 || overlapHeight <= 1, `${name}: ${a.name} and ${b.name} must not overlap`)
      }
    }
    assert.equal(await page.$eval('#opening-film .opening-film__explore', (anchor) => anchor.getAttribute('href')), '#hero',
      `${name}: preserve the native scroll destination`)
    await screenshot(page, name)
    assert.deepEqual(runtimeErrors, [], `${name}: browser runtime errors`)

    if (profile.target === 'other') {
      const navigation = page.waitForNavigation({ waitUntil: 'domcontentloaded' })
      await page.click(downloadSelector)
      await navigation
      assert.equal(new URL(page.url()).pathname, '/download/', `${name}: generic platform must open the local chooser`)
      await assertChooser(page, name)
      assert.deepEqual(interceptedStores, [], `${name}: chooser must not navigate to a store automatically`)
    } else {
      const destination = page.waitForRequest((request) => request.isNavigationRequest() && request.url() === expectedHref)
      await page.click(downloadSelector)
      assert.equal((await destination).url(), expectedHref, `${name}: clicking must select the configured store`)
      assert.deepEqual(interceptedStores, [expectedHref], `${name}: store navigation must be intercepted exactly once`)
    }
    await page.close()
    console.log(`Store download ${name}: ${profile.target}, correct click destination, visible controls and no overflow.`)
  }

  // Prerendering must not preserve the build machine's platform destination.
  for (const [name, profile, viewport] of [
    ['mobile', profiles.iphone, { width: 390, height: 844 }],
    ['desktop', profiles.mac, { width: 1440, height: 900 }],
  ]) {
    const { page, interceptedStores } = await createPage(viewport, profile, true)
    const response = await page.goto(origin, { waitUntil: 'domcontentloaded' })
    assert.equal(response.status(), 200, `No-JavaScript ${name} homepage must be reachable`)
    await page.waitForSelector(downloadSelector)
    const initial = await page.$eval(downloadSelector, (anchor) => ({
      href: anchor.getAttribute('href'),
      platform: anchor.dataset.downloadPlatform,
      label: anchor.getAttribute('aria-label'),
      count: document.querySelectorAll('[data-izem-download]').length,
    }))
    assert.equal(initial.href, '/download/', `No-JavaScript ${name}: initial action must use the chooser`)
    assert.equal(initial.platform, 'other', `No-JavaScript ${name}: initial platform must stay neutral`)
    assert.equal(initial.label, 'Download IZEM from your app store', `No-JavaScript ${name}: accessible label must stay neutral`)
    assert.equal(initial.count, 1, `No-JavaScript ${name}: preserve exactly one download action`)
    await screenshot(page, `${name}-without-javascript`)
    const navigation = page.waitForNavigation({ waitUntil: 'domcontentloaded' })
    await page.click(downloadSelector)
    await navigation
    assert.equal(new URL(page.url()).pathname, '/download/', `No-JavaScript ${name}: click must open the chooser`)
    await assertChooser(page, `no-JavaScript initial ${name}`)
    assert.deepEqual(interceptedStores, [], `No-JavaScript ${name}: no automatic store navigation`)
    await page.close()
    console.log(`Store download initial ${name} HTML: neutral chooser destination and functional click without JavaScript.`)
  }

  // This static page supplies the generic-platform and no-JavaScript fallback.
  for (const width of [320, 1440]) {
    const { page } = await createPage({ width, height: 900 }, undefined, true)
    const response = await page.goto(`${origin}/download/`, { waitUntil: 'domcontentloaded' })
    assert.equal(response.status(), 200, `Static chooser at ${width}px must return HTTP 200`)
    await assertChooser(page, `no-JavaScript ${width}px`)
    await screenshot(page, `chooser-${width}`)
    await page.close()
  }

  // The action is portaled into the same bar; exercise both retained controls.
  {
    const { page, runtimeErrors } = await createPage({ width: 390, height: 844 }, profiles.iphone)
    await page.goto(origin, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector(downloadSelector)
    await page.waitForSelector('#opening-film button[aria-label="Play film"]:not([disabled])')
    await page.click('#opening-film button[aria-label="Play film"]')
    await page.waitForFunction(() => {
      const video = document.querySelector('#opening-film video')
      return video && video.readyState >= 2 && !video.paused
    })
    const beforeMuted = await page.$eval('#opening-film video', (video) => video.muted)
    await page.click('#opening-film .opening-film__sound')
    await page.waitForFunction((previous) => document.querySelector('#opening-film video')?.muted !== previous, {}, beforeMuted)
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
    await page.click('#opening-film a[href="#hero"]')
    await page.waitForFunction(() => document.querySelector('#hero')?.getBoundingClientRect().top < innerHeight)
    await page.waitForFunction(() => document.querySelector('#opening-film video')?.paused === true)
    assert.deepEqual(runtimeErrors, [], 'Store action must preserve sound controls and native scrolling')
    await page.close()
  }

  console.log('Store download browser checks passed. Public store availability was not tested.')
  if (screenshotDirectory) console.log(`Store download screenshots: ${screenshotDirectory}`)
} finally {
  await browser?.close()
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
}
