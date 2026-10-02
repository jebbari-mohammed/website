import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import express from 'express';
import puppeteer from 'puppeteer';
import { load } from 'cheerio';

const root = process.cwd();
const output = path.join(root, 'homepage-qa-artifacts');
const approved = JSON.parse(fs.readFileSync(path.join(root, 'tools/homepage-review/approved-source.json'), 'utf8'));
const normalize = (s) => s.replace(/\s+/g, ' ').replace(/\s+([,.;!?])/g, '$1').trim();
const allowed = new Set(approved.allowedTextValues.map(normalize));
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
fs.mkdirSync(output, { recursive: true });

function verifySource() {
  for (const file of approved.sourceFiles) {
    assert.equal(sha256(fs.readFileSync(path.join(root, file.path))), file.sha256, `Frozen source changed: ${file.path}`);
  }
  console.log(`Verified ${approved.sourceFiles.length} source files for approved text ${approved.approvedTextSha256}`);
}
verifySource();
if (process.argv.includes('--verify-source')) process.exit(0);

function extractBlocks(html) {
  const $ = load(html);
  const lines = [];
  const readable = (n) => {
    if (n.type === 'text') return n.data;
    if (n.type !== 'tag' || ['script', 'style', 'svg'].includes(n.name)) return '';
    return (n.children || []).map(readable).join(' ').replace(/\s+([,.;!?])/g, '$1');
  };
  const block = (n) => n.type === 'tag' && /^(html|body|main|nav|section|article|header|footer|aside|div|figure|figcaption|h[1-6]|p|ul|ol|li|button|label)$/.test(n.name);
  const walk = (n) => {
    if (n.type === 'text') { if (n.data.trim()) lines.push(n.data); return; }
    if (n.type !== 'tag' || ['script', 'style', 'svg'].includes(n.name) || $(n).attr('aria-hidden') === 'true') return;
    const children = n.children || [];
    if (!children.some(block)) { const t = readable(n); if (t.trim()) lines.push(t); }
    else {
      let inline = '';
      for (const c of children) {
        if (block(c)) { if (inline.trim()) lines.push(inline); inline = ''; walk(c); }
        else if (c.type === 'text') inline += c.data;
        else if (c.type === 'tag' && !['script', 'style', 'svg'].includes(c.name)) inline += ' ' + readable(c) + ' ';
      }
      if (inline.trim()) lines.push(inline);
    }
  };
  $('body').each((i, n) => walk(n));
  return lines.map(normalize).filter(Boolean);
}

const builtHtml = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
assert(builtHtml.includes('data-izem-feature-diagram="chat"'), 'Production pre-render must include the diagram');
assert(!builtHtml.includes('data-izem-static-shell'), 'Static fallback remained after production pre-render');
const sourceHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const src = load(sourceHtml); const built = load(builtHtml);
assert.equal(built('title').text(), src('title').text());
for (const name of ['description', 'keywords', 'author']) assert.equal(built(`meta[name="${name}"]`).attr('content'), src(`meta[name="${name}"]`).attr('content'));
assert.equal(built('link[rel="canonical"]').attr('href'), 'https://youraicoach.life/');
assert.deepEqual(built('script[type="application/ld+json"]').toArray().map(n => JSON.parse(built(n).text())), src('script[type="application/ld+json"]').toArray().map(n => JSON.parse(src(n).text())));
for (const value of extractBlocks(builtHtml)) assert(allowed.has(value), `Unapproved built text: ${value}`);
fs.writeFileSync(path.join(output, 'built-index.html'), builtHtml);

const app = express();
app.use(express.static(path.join(root, 'dist'), { extensions: ['html'] }));
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const report = { sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), approvedTextSha256: approved.approvedTextSha256, browser: await browser.version(), states: [], pageErrors: [], consoleErrors: [], failedRequests: [] };

async function clickText(page, selector, text) {
  const candidates = await page.$$(selector);
  for (const candidate of candidates) {
    if (normalize(await candidate.evaluate(el => el.textContent)) === text) { await candidate.click(); return; }
  }
  throw new Error(`Missing ${selector}: ${text}`);
}

async function checkState(page, name, screenshotSelector) {
  await page.waitForSelector('#hero');
  const html = await page.content();
  const $ = load(html);
  assert.equal(normalize($('h1').text()), 'IZEM. Your AI Personal Trainer');
  assert.equal($('h1').length, 1);
  assert.equal($('video').length, 0);
  assert.equal($('[data-izem-feature-diagram]').length, 2);
  assert.equal($('figcaption').length, 2);
  assert(!/hero[12](?:-desktop)?\.(png|webp)|izem-coach-chat-dark-web|izem-workout-nutrition-dark-web|lucide-(?:brain|heart|eye|person|user-round)|🏋|❤️/.test(html), 'Disallowed homepage visual reference');
  $('img').each((i, n) => { assert.equal($(n).attr('src'), '/images/izem-app-logo-192.png'); assert($(n).attr('alt')); });
  const unapproved = extractBlocks(html).filter(value => !allowed.has(value));
  assert.deepEqual(unapproved, [], `Unapproved rendered text in ${name}`);
  const geometry = await page.evaluate(() => ({ width: window.innerWidth, pageWidth: document.documentElement.scrollWidth, heroWidth: document.querySelector('#hero').getBoundingClientRect().width }));
  assert(geometry.pageWidth <= geometry.width + 1, `Horizontal page overflow in ${name}: ${JSON.stringify(geometry)}`);
  const columns = await page.evaluate(() => {
    const count = (selector) => getComputedStyle(document.querySelector(selector)).gridTemplateColumns.split(' ').filter(Boolean).length;
    return { hero: count('#hero .grid'), showcase: count('#showcase > div.max-w-7xl > div.grid'), diagramInputs: Array.from(document.querySelectorAll('[data-izem-feature-diagram] .grid')).map(el => getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length) };
  });
  assert.equal(columns.hero, geometry.width >= 1024 ? 12 : 1, `Unexpected hero columns at ${geometry.width}: ${JSON.stringify(columns)}`);
  assert.equal(columns.showcase, geometry.width >= 1024 ? 12 : 1, `Unexpected showcase columns at ${geometry.width}: ${JSON.stringify(columns)}`);
  assert.deepEqual(columns.diagramInputs, [2, 2], `Diagram input columns at ${geometry.width}`);
  for (const node of $('a').toArray().filter(n => normalize($(n).text()) === 'Try the free workout generator')) assert.equal($(node).attr('href'), '/workout-plan-generator/');
  fs.writeFileSync(path.join(output, name + '.html'), html);
  if (screenshotSelector) await (await page.$(screenshotSelector)).screenshot({ path: path.join(output, name + '.png') });
  else await page.screenshot({ path: path.join(output, name + '.png'), fullPage: true });
  report.states.push({ name, geometry, columns, textBlocks: extractBlocks(html).length, status: 'passed' });
}

try {
  for (const viewport of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 375, height: 812 }]) {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    page.on('pageerror', error => report.pageErrors.push({ viewport: viewport.name, message: error.message }));
    page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push({ viewport: viewport.name, message: message.text(), location: message.location() }); });
    page.on('requestfailed', request => report.failedRequests.push({ viewport: viewport.name, url: request.url(), failure: request.failure() }));
    await page.goto(origin, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    await checkState(page, viewport.name + '-default');
    for (const [label, mode] of [['Workout planning', 'workout'], ['Coaching context', 'chat']]) {
      await clickText(page, '#hero button', label);
      await page.waitForFunction(expected => document.querySelector('#hero [data-izem-feature-diagram]')?.dataset.izemFeatureDiagram === expected, {}, mode);
      await checkState(page, viewport.name + '-hero-' + mode, '#hero');
    }
    for (const [label, mode] of [['Personalized Nutrition', 'nutrition'], ['Coach Chat & Calls', 'chat'], ['Adaptive Workouts', 'workout']]) {
      await clickText(page, '#showcase button', label);
      await page.waitForFunction(expected => document.querySelector('#showcase [data-izem-feature-diagram]')?.dataset.izemFeatureDiagram === expected, {}, mode);
      await checkState(page, viewport.name + '-showcase-' + mode, '#showcase');
    }
    for (const [label, state] of [['You Call the Coach', 'userinitiated'], ['Day Review Call', 'review'], ['Pre-Workout Call', 'preworkout']]) {
      await clickText(page, '#how-calls-work button', label);
      await page.waitForFunction(expected => Array.from(document.querySelectorAll('#how-calls-work button')).some(el => el.textContent.trim() === expected && el.getAttribute('aria-pressed') === 'true'), {}, label);
      await checkState(page, viewport.name + '-voice-' + state, '#how-calls-work');
    }
    if (viewport.name === 'mobile') {
      for (let attempt = 0; attempt < 2; attempt++) {
        await page.click('button[aria-label="Toggle navigation"]');
        await page.waitForSelector('#mobile-navigation');
        assert.equal(await page.$eval('button[aria-label="Toggle navigation"]', el => el.getAttribute('aria-expanded')), 'true');
        if (attempt === 0) await checkState(page, 'mobile-menu-open');
        await page.click('button[aria-label="Toggle navigation"]');
        await page.waitForSelector('#mobile-navigation', { hidden: true });
      }
      await page.click('button[aria-label="Toggle navigation"]');
      await clickText(page, '#mobile-navigation a', 'Feature diagrams');
      await page.waitForSelector('#mobile-navigation', { hidden: true });
      assert.equal(new URL(page.url()).hash, '#showcase');
      await page.goBack({ waitUntil: 'domcontentloaded' });
      await page.goForward({ waitUntil: 'domcontentloaded' });
      assert.equal(await page.$('#mobile-navigation'), null);
      await page.goto(origin, { waitUntil: 'networkidle0' });
    }
    // Exercise real input events. User-generated numeric values are covered by
    // the frozen formula, rather than treated as new editorial prose.
    await page.$eval('#rate-input', el => el.scrollIntoView({ block: 'center' }));
    await page.click('#rate-input', { clickCount: 3 });
    await page.type('#rate-input', '100');
    await page.focus('#session-slider');
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.querySelector('#session-slider').value === '2' && document.querySelector('#rate-input').value === '100');
    assert((await page.$eval('body', el => el.innerText)).includes('$10,392'), 'Calculator did not produce 100 × 2 × 4.33 × 12');
    await page.screenshot({ path: path.join(output, viewport.name + '-calculator.png') });
    await page.goto(origin, { waitUntil: 'networkidle0' });
    await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }), clickText(page, '#hero a', 'Try the free workout generator')]);
    assert.equal(new URL(page.url()).pathname, '/workout-plan-generator/');
    assert((await page.$eval('body', el => el.innerText)).toLowerCase().includes('workout'));
    // History restoration may use BFCache and has no new network-idle event.
    // Wait for the document lifecycle, then verify the actual destination and
    // full homepage state. A wrong/blank/stale page still fails these assertions.
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => location.pathname === '/' && document.querySelector('#hero h1')?.textContent.replace(/\s+/g, ' ').trim() === 'IZEM. Your AI Personal Trainer');
    assert.equal(page.url(), origin + '/');
    await checkState(page, viewport.name + '-returned-home', '#hero');
    await page.close();
  }
  const tablet = await browser.newPage();
  await tablet.setViewport({ width: 768, height: 1024 });
  await tablet.goto(origin, { waitUntil: 'networkidle0' });
  await checkState(tablet, 'tablet-768');
  await tablet.close();
  const narrow = await browser.newPage();
  await narrow.setViewport({ width: 320, height: 740 });
  await narrow.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await narrow.goto(origin, { waitUntil: 'networkidle0' });
  await checkState(narrow, 'mobile-320-reduced-motion');
  await narrow.close();
  const noJS = await browser.newPage();
  await noJS.setJavaScriptEnabled(false);
  await noJS.setViewport({ width: 375, height: 812 });
  await noJS.goto(origin, { waitUntil: 'networkidle0' });
  await checkState(noJS, 'mobile-no-javascript');
  await noJS.close();
  assert.equal(report.pageErrors.length, 0, JSON.stringify(report.pageErrors));
  const failedLocal = report.failedRequests.filter(entry => entry.url.startsWith(origin));
  assert.equal(failedLocal.length, 0, JSON.stringify(failedLocal));
  const unexpectedConsole = report.consoleErrors.filter(entry => !/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//.test(entry.location?.url || ''));
  assert.equal(unexpectedConsole.length, 0, JSON.stringify(unexpectedConsole));
  verifySource();
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.failure = { message: error.message, stack: error.stack };
  throw error;
} finally {
  fs.writeFileSync(path.join(output, 'browser-qa-report.json'), JSON.stringify(report, null, 2) + '\n');
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
console.log(`Browser QA passed: ${report.states.length} state captures, desktop/mobile interactions, generator navigation, calculator, no-JavaScript and source integrity.`);
