import assert from 'node:assert/strict';
import path from 'node:path';
import express from 'express';
import puppeteer from 'puppeteer';

const app = express();
app.use(express.static(path.resolve(process.argv[2] || 'dist')));
const server = await new Promise((resolve) => {
  const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
});
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.url().startsWith(`${origin}/`) || request.url().startsWith('data:')) request.continue();
    else request.abort();
  });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewport({ width, height: 900 });
    await page.goto(origin, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.editorial-showcase-tabs');
    await page.evaluate(() => document.fonts.ready);
    const state = await page.evaluate(() => {
      const parse = (value) => {
        const parts = value.match(/[\d.]+/g)?.map(Number) || [];
        return [parts[0] || 0, parts[1] || 0, parts[2] || 0, parts[3] ?? 1];
      };
      const blend = (front, back) => front.slice(0, 3).map((c, i) => c * front[3] + back[i] * (1 - front[3]));
      const luminance = (rgb) => rgb.map((c) => c / 255).map((c) => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4)
        .reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
      const backgrounds = (element) => {
        const layers = [];
        for (let node = element; node; node = node.parentElement) layers.unshift(parse(getComputedStyle(node).backgroundColor));
        return layers.reduce((base, front) => blend(front, base), [255, 255, 255]);
      };
      const failures = [];
      const ratios = [];
      const containers = [...document.querySelectorAll('main > section:not(#opening-film), .editorial-footer')];
      for (const container of containers) {
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (!node.textContent.trim()) continue;
          const element = node.parentElement;
          // Media fallback text is not rendered by a browser with media support.
          if (element.closest('video, audio, script, style, svg, noscript')) continue;
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          if (!rect.width || !rect.height || style.visibility === 'hidden' || style.display === 'none') continue;
          const background = backgrounds(element);
          const color = blend(parse(style.color), background);
          const [high, low] = [luminance(color), luminance(background)].sort((a, b) => b - a);
          const ratio = (high + .05) / (low + .05);
          const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700);
          const minimum = large ? 3 : 4.5;
          ratios.push(ratio);
          if (ratio < minimum) failures.push({ text: node.textContent.trim().slice(0, 75), ratio, minimum, color: style.color, background });
        }
      }
      return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
        rangeHeight: document.querySelector('#session-slider').getBoundingClientRect().height,
        minContrast: Math.min(...ratios), textSamples: ratios.length, failures };
    });
    assert.ok(state.scrollWidth <= width + 1, `${width}px: horizontal overflow`);
    assert.ok(state.rangeHeight >= 44, `${width}px: range hit area`);
    assert.deepEqual(state.failures, [], `${width}px: unreadable text contrast`);
    for (const selector of ['#showcase button', '#how-calls-work button']) {
      const buttons = await page.$$(selector);
      assert.equal(buttons.length, 3, 'All choices must remain discoverable');
      for (const button of buttons) {
        const geometry = await button.evaluate((element) => {
          const r = element.getBoundingClientRect();
          return { left: r.left, right: r.right, height: r.height, width: r.width };
        });
        assert.ok(geometry.left >= 0 && geometry.right <= width + 1 && geometry.height >= 44, `${width}px: clipped or small choice`);
        await button.evaluate((element) => element.click());
        const after = await button.boundingBox();
        assert.ok(Math.abs(after.width - geometry.width) < 1, 'Selection must not reflow a choice');
        assert.equal(await page.$$eval(`${selector}[aria-pressed="true"]`, (nodes) => nodes.length), 1);
      }
    }
    await page.focus('#session-slider');
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.querySelector('#session-slider').value === '4');
    assert.ok(await page.$eval('.editorial-budget-amount', (e) => e.textContent.includes(Math.round(4 * 4.33 * 65 * 12).toLocaleString())), 'Keyboard input must update budget');
    for (const rate of [0, 1000]) {
      await page.$eval('#rate-input', (e) => e.select());
      await page.keyboard.type(String(rate));
      await page.waitForFunction((value) => document.querySelector('.editorial-budget-amount').textContent.includes(Math.round(4 * 4.33 * value * 12).toLocaleString()), {}, rate);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Budget limits must fit');
    }
    // A font outage or OS fallback must not join words across a hidden break.
    // Exercise a wider fallback as well as the authored font on narrow phones.
    if (width === 320) {
      const fallback = await page.addStyleTag({ content: '#root main > section:not(#opening-film), #root main > section:not(#opening-film) * { font-family: Verdana, sans-serif !important; }' });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Wide fallback font must fit');
      await fallback.evaluate((e) => e.remove());
    }
    await page.focus('#rate-input');
    assert.equal(await page.$eval('#rate-input', (e) => getComputedStyle(e).outlineStyle), 'solid', 'Keyboard focus must remain visible');
    console.log(`Homepage ${width}px: no overflow, accessible choices, working keyboard budget; ${state.textSamples} text samples, minimum contrast ${state.minContrast.toFixed(2)}:1.`);
  }
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
