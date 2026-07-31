import puppeteer from 'puppeteer';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, 'dist');
const HTML_FILE = path.join(DIST_DIR, 'index.html');
const GOOGLE_TAG_ID = 'G-3W49ZGG4NS';
const PUBLISHER_NAME = 'Mohammed Jebbari';
const PUBLISHER_ATTRIBUTION_MARKER = 'data-izem-publisher';
const SYSTEM_CHROME_PATHS = [
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];
const PUBLISHER_ATTRIBUTION = `<aside data-izem-publisher="true" aria-label="Publisher information" style="max-width:920px;margin:32px auto 20px;padding:16px 20px;border-top:1px solid rgba(148,163,184,.25);color:#94A3B8;font:14px/1.6 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center">
      Published by <a href="/about" style="color:#00D4FF">${PUBLISHER_NAME}</a>, founder of IZEM. Editorial pages may use disclosed AI assistance; IZEM remains accountable for corrections. <a href="/editorial-policy.html" style="color:#00D4FF">Editorial policy</a>.
      <nav data-izem-site-links="true" aria-label="Explore IZEM" style="display:flex;justify-content:center;gap:14px;flex-wrap:wrap;margin-top:10px">
        <a href="/izem-ai-fitness-coach/" style="color:#CBD5E1">AI Coach</a>
        <a href="/blog/" style="color:#CBD5E1">Blog</a>
        <a href="/glossary/" style="color:#CBD5E1">Glossary</a>
        <a href="/tools/" style="color:#CBD5E1">Calculators</a>
        <a href="/comparisons/" style="color:#CBD5E1">Comparisons</a>
        <a href="/youtube/" style="color:#CBD5E1">Videos</a>
        <a href="/landing-page" style="color:#CBD5E1">How IZEM works</a>
      </nav>
    </aside>`;
const GOOGLE_TAG = `<!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GOOGLE_TAG_ID}');
    </script>`;

function findHtmlFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return findHtmlFiles(fullPath);
    return entry.isFile() && entry.name.endsWith('.html') ? [fullPath] : [];
  });
}

function injectGoogleTag() {
  const htmlFiles = findHtmlFiles(DIST_DIR);
  let changed = 0;

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf-8');
    if (html.includes(GOOGLE_TAG_ID)) continue;

    const nextHtml = html.replace(/<head(\s[^>]*)?>/i, match => `${match}\n    ${GOOGLE_TAG}`);
    if (nextHtml === html) {
      console.warn(`⚠️ Could not find <head> in ${path.relative(DIST_DIR, file)}`);
      continue;
    }

    fs.writeFileSync(file, nextHtml);
    changed += 1;
  }

  console.log(`✅ Google tag present in ${htmlFiles.length} HTML files (${changed} updated).`);
}

function injectPublisherAttribution() {
  const htmlFiles = findHtmlFiles(DIST_DIR);
  let changed = 0;

  for (const file of htmlFiles) {
    let html = fs.readFileSync(file, 'utf-8');
    if (html.includes(PUBLISHER_ATTRIBUTION_MARKER)) continue;

    if (!/<meta\s+name=["']publisher["']/i.test(html)) {
      html = html.replace(/<head(\s[^>]*)?>/i, match => `${match}\n    <meta name="publisher" content="${PUBLISHER_NAME}">`);
    }

    const nextHtml = html.replace(/<\/body>/i, `${PUBLISHER_ATTRIBUTION}\n</body>`);
    if (nextHtml === html) {
      console.warn(`⚠️ Could not find <body> in ${path.relative(DIST_DIR, file)}`);
      continue;
    }

    fs.writeFileSync(file, nextHtml);
    changed += 1;
  }

  console.log(`✅ Publisher attribution present in ${htmlFiles.length} HTML files (${changed} updated).`);
}

function injectSiteMetadata() {
  injectGoogleTag();
  injectPublisherAttribution();
}

function resolveChromeExecutable() {
  const configuredPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (configuredPath && fs.existsSync(configuredPath)) return configuredPath;
  return SYSTEM_CHROME_PATHS.find(candidate => fs.existsSync(candidate));
}

async function preRender() {
  if (!fs.existsSync(HTML_FILE)) {
    console.error('dist/index.html not found. Did you run vite build?');
    process.exit(1);
  }

  console.log('🚀 Starting pre-render process...');
  
  // Start local server to serve the dist folder
  const app = express();
  app.use(express.static(DIST_DIR));
  
  const server = app.listen(3000, async () => {
    console.log('🌍 Local server running on port 3000');
    
    try {
      const executablePath = resolveChromeExecutable();
      const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ...(executablePath ? { executablePath } : {}),
      });
      const page = await browser.newPage();
      
      console.log('📱 Visiting http://localhost:3000...');
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
      
      // Wait specifically for React to mount and the Hero section to render
      await page.waitForSelector('#root > div', { timeout: 10000 });
      
      // Additional small wait to ensure Framer Motion initial states settle
      await new Promise(r => setTimeout(r, 1000));
      
      console.log('📸 Capturing static HTML...');
      const html = await page.evaluate(() => {
        return '<!DOCTYPE html>\n<html lang="en">' + document.documentElement.innerHTML + '</html>';
      });
      
      await browser.close();
      
      // Overwrite the original index.html with the fully rendered static HTML
      fs.writeFileSync(HTML_FILE, html);
      console.log('✅ Pre-rendering complete! Overwrote dist/index.html with static content.');

      injectSiteMetadata();
      
      server.close();
      process.exit(0);
    } catch (err) {
      console.warn('⚠️ Pre-rendering skipped (expected in sandboxed environment):', err.message);
      console.log('ℹ️ Proceeding with static html deployment and injecting Google tag...');
      try {
        injectSiteMetadata();
      } catch (injectErr) {
        console.error('❌ Failed to inject Google tag:', injectErr);
      }
      if (server && typeof server.close === 'function') {
        server.close();
      }
      process.exit(0);
    }
  });
}

preRender();
