import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { transformValue, transformCss, transformHtml, applyBrandTheme, THEME } from './brand-theme.mjs';

const valueCases = [
  ['#00D4FF', '#8DFF6A'], ['#7c5cfc', '#D8FF86'], ['#86d7ff', '#D8FF86'],
  ['#060B1D', '#070A0D'], ['#0C1232', '#111714'], ['#101b2a', '#111714'],
  ['#00d4ff33', '#8DFF6A33'], ['#0cf', '#8DFF6A'], ['#0cf8', '#8DFF6A88'],
  ['rgba(0, 212, 255, .2)', 'rgba(141, 255, 106, .2)'],
  ['rgb(134 215 255 / var(--tw-bg-opacity,1))', 'rgb(216 255 134 / var(--tw-bg-opacity,1))'],
  ['rgb(6 11 29 / 90%)', 'rgb(7 10 13 / 90%)'],
  ['#ef4444', '#ef4444'], ['#fcd34d', '#fcd34d'], ['#8DFF6A', '#8DFF6A'],
  ['#D8FF86', '#D8FF86'], ['#070A0D', '#070A0D'], ['currentColor', 'currentColor'],
  ['url("/images/blue.svg#00d4ff")', 'url("/images/blue.svg#00d4ff")'],
  ['"#00D4FF"', '"#00D4FF"'], ["'#7c5cfc'", "'#7c5cfc'"],
  ['url(data:image/svg+xml,%3Csvg%20fill=%22#00d4ff%22%3E)', 'url(data:image/svg+xml,%3Csvg%20fill=%22#00d4ff%22%3E)'],
];
for (const [input, output] of valueCases) test(`color value: ${input}`, () => assert.equal(transformValue(input), output));

test('selectors, comments, URLs, CSS content strings and sizing are preserved', () => {
  const css = '#00d4ff,.bg-\\[\\#060B1D\\]{width:14px;content:"#00d4ff";background:url(/blue.svg#00d4ff);color:#00d4ff}/* #00d4ff */';
  assert.equal(transformCss(css), css.replace('color:#00d4ff', 'color:#8DFF6A'));
});
test('solid and gradient lime buttons use dark text', () => {
  const output = transformCss('.cta{background:linear-gradient(135deg,#00d4ff,#7c5cfc);color:white}.button{background:#42c7c3}');
  assert.equal((output.match(/color:#070A0D/g) || []).length, 2);
});
test('accent variables also receive contrasting button text', () => {
  assert.match(transformCss(':root{--cyan:#00d4ff;--purple:#7c5cfc}.cta{background:linear-gradient(135deg,var(--cyan),var(--purple));color:white}'), /color:#070A0D/);
});
test('transparent cards do not receive black body text', () => {
  assert.match(transformCss('.panel{background:rgba(0,212,255,.08);color:white}'), /color:white/);
});
test('gradient text stays transparent', () => {
  assert.match(transformCss('h1{background:linear-gradient(90deg,#00d4ff,#7c5cfc);background-clip:text;color:transparent}'), /color:transparent/);
});
test('inline CSS is supported without altering attributes named data-style', () => {
  const output = transformHtml('<head></head><body><a data-style="#00d4ff" style="background:#00d4ff;color:white">Link</a></body>');
  assert.match(output, /data-style="#00d4ff"/);
  assert.match(output, /style="background:#8DFF6A;color:#070A0D"/);
});
test('scripts, JSON-LD, prose, canonical links, images and code samples are unchanged', () => {
  const script = '<script>const color="#00d4ff";const html="<a style=\'color:#00d4ff\'>x</a>";</script>';
  const json = '<script type="application/ld+json">{"url":"https://example.test/#00d4ff"}</script>';
  const rest = '<title>Blue #00d4ff</title><link rel="canonical" href="https://example.test/blue"><img src="/blue.png"><p>Blue #00d4ff</p><pre><code>color:#00d4ff</code></pre>';
  const output = transformHtml(`<html><head>${rest}</head><body>${script}${json}</body></html>`);
  assert.ok(output.includes(script)); assert.ok(output.includes(json)); assert.ok(output.includes(rest));
});
test('only visual browser theme metadata changes', () => {
  const output = transformHtml('<head><meta name="theme-color" content="#20D5D9"><meta name="description" content="blue #00d4ff"></head>');
  assert.match(output, /name="theme-color" content="#070A0D"/);
  assert.match(output, /name="description" content="blue #00d4ff"/);
});
test('SVG presentation attributes change without changing IDs or viewboxes', () => {
  assert.equal(transformHtml('<svg viewBox="0 0 20 20"><path id="blue" fill="#00d4ff" stroke="currentColor"/></svg>'), '<svg viewBox="0 0 20 20"><path id="blue" fill="#8DFF6A" stroke="currentColor"/></svg>');
});
test('processing is idempotent and adds the stylesheet once', () => {
  const once = transformHtml('<html><head><style>body{background:#060b1d}h2{color:#00d4ff}</style></head><body>Test</body></html>');
  assert.equal(transformHtml(once), once);
  assert.equal((once.match(/data-izem-theme=/g) || []).length, 1);
});
test('verification files with no document head stay byte-identical', () => {
  assert.equal(transformHtml('google-site-verification: google123.html'), 'google-site-verification: google123.html');
});
test('invalid CSS fails rather than silently shipping a partly themed site', () => {
  assert.throws(() => transformCss('body{color:#00d4ff'));
});
test('green button and dark label have at least 4.5:1 contrast', () => {
  const luminance = value => {
    const channels = [1,3,5].map(i => parseInt(value.slice(i,i+2),16)/255).map(v => v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
    return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
  };
  for (const color of [THEME.primary,THEME.secondary]) assert.ok((luminance(color)+.05)/(luminance(THEME.background)+.05)>4.5);
});
test('whole-directory check catches regressions, preserves JS and requires the shared stylesheet', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'izem-brand-'));
  try {
    fs.writeFileSync(path.join(dir,'index.html'),'<head><style>body{background:#060b1d}</style></head><body>Hello</body>');
    assert.throws(() => applyBrandTheme(dir), /Missing/);
    fs.writeFileSync(path.join(dir,'izem-theme.css'),':root{--izem-primary:#8DFF6A}');
    fs.writeFileSync(path.join(dir,'app.js'),'const brand="#00d4ff";');
    fs.writeFileSync(path.join(dir,'site.webmanifest'),JSON.stringify({name:'IZEM',theme_color:'#00d4ff',icons:[{src:'/icon.png'}]}));
    assert.throws(() => applyBrandTheme(dir,true), /Unnormalized/);
    assert.equal(applyBrandTheme(dir).htmlCount,1);
    assert.equal(applyBrandTheme(dir,true).changed,0);
    assert.equal(fs.readFileSync(path.join(dir,'app.js'),'utf8'),'const brand="#00d4ff";');
    const manifest=JSON.parse(fs.readFileSync(path.join(dir,'site.webmanifest'),'utf8'));
    assert.equal(manifest.theme_color,THEME.background);assert.equal(manifest.icons[0].src,'/icon.png');
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
