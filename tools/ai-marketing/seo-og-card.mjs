#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { escapeHtml } from './seo-publisher-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const RECORD = path.join(ROOT, 'data/marketing-employee/seo-growth/last-publish-v2.json');
const SYSTEM_CHROME = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'];

function wrapTitle(value, max = 38) {
  const words = String(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = `${current} ${word}`.trim();
    if (candidate.length <= max) current = candidate;
    else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function cardHtml(title) {
  const lines = wrapTitle(title).map((line) => `<div>${escapeHtml(line)}</div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden}body{font-family:Inter,Arial,sans-serif;background:linear-gradient(135deg,#060B1D,#0C1A3D);color:#F8FAFC;position:relative}.bar{height:7px;background:linear-gradient(90deg,#00D4FF,#7C5CFC)}.glow{position:absolute;width:560px;height:400px;right:-110px;top:-150px;border-radius:50%;background:radial-gradient(circle,rgba(0,212,255,.24),rgba(124,92,252,0) 68%)}.content{position:absolute;left:66px;right:66px;top:68px;bottom:88px;display:flex;flex-direction:column;justify-content:center}.pill{position:absolute;top:64px;left:66px;border:1px solid rgba(0,212,255,.36);background:rgba(0,212,255,.1);color:#8DE8FF;border-radius:999px;padding:10px 18px;font-size:20px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.title{font-size:62px;line-height:1.08;font-weight:900;letter-spacing:-1.8px;max-width:990px}.accent{width:104px;height:6px;border-radius:6px;background:linear-gradient(90deg,#00D4FF,#7C5CFC);margin-top:30px}.footer{position:absolute;left:0;right:0;bottom:0;height:76px;background:rgba(0,0,0,.28);display:flex;align-items:center;justify-content:space-between;padding:0 66px}.brand{font-size:28px;font-weight:900}.domain{font-size:21px;color:#7F8FA5}</style></head><body><div class="bar"></div><div class="glow"></div><div class="pill">AI fitness coaching</div><div class="content"><div class="title">${lines}</div><div class="accent"></div></div><div class="footer"><div class="brand">IZEM</div><div class="domain">youraicoach.life</div></div></body></html>`;
}

async function main() {
  const record = JSON.parse(fs.readFileSync(RECORD, 'utf8'));
  if (record.action !== 'create' || !record.slug || !record.title) {
    console.log('Latest SEO action is not CREATE; PNG social card skipped.');
    return;
  }
  const output = path.join(ROOT, 'public/og', `${record.slug}.png`);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || SYSTEM_CHROME.find((candidate) => fs.existsSync(candidate));
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'], ...(executablePath ? { executablePath } : {}) });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await page.setContent(cardHtml(record.title), { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: output, type: 'png', fullPage: false });
  } finally {
    await browser.close();
  }
  const stat = fs.statSync(output);
  if (stat.size < 20000) throw new Error(`Generated PNG is unexpectedly small (${stat.size} bytes)`);
  console.log(`Generated production PNG social card: public/og/${record.slug}.png (${stat.size} bytes).`);
}

main().catch((error) => {
  console.error(`SEO social-card generation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
