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
const BRAND_ICON_MARKER = 'data-izem-brand-icons';
const BRAND_LOGO_PATH = '/images/izem-app-logo-192.png';
const BRAND_SCHEMA_LOGO_URL = 'https://youraicoach.life/images/izem-app-logo-512.png';
const SYSTEM_CHROME_PATHS = [
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];
const PUBLISHER_ATTRIBUTION = `<aside data-izem-publisher="true" aria-label="Publisher information" style="max-width:920px;margin:32px auto 20px;padding:16px 20px;border-top:1px solid rgba(148,163,184,.25);color:#94A3B8;font:14px/1.6 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center">
      <a data-izem-brand-logo="true" href="/" aria-label="IZEM home" style="display:inline-flex;margin-bottom:10px;border-radius:18px;box-shadow:0 10px 30px rgba(20,210,220,.22)"><img src="${BRAND_LOGO_PATH}" alt="IZEM app logo" width="64" height="64" loading="lazy" decoding="async" style="display:block;width:64px;height:64px;border-radius:18px;object-fit:cover"></a><br>
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
const BRAND_ICON_TAGS = `<link ${BRAND_ICON_MARKER}="true" rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="shortcut icon" href="/favicon.ico">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="manifest" href="/site.webmanifest">
    <meta name="theme-color" content="#20D5D9">`;
const NAVIGATION_LOGO = `<img data-izem-navigation-logo="true" src="${BRAND_LOGO_PATH}" alt="" width="30" height="30" style="display:inline-block;width:30px;height:30px;margin-right:8px;border-radius:9px;object-fit:cover;vertical-align:middle;box-shadow:0 6px 18px rgba(20,210,220,.2)">`;
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

function tagAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match?.[2] || '';
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

function injectBrandAssets() {
  const htmlFiles = findHtmlFiles(DIST_DIR);
  let changed = 0;

  for (const file of htmlFiles) {
    const originalHtml = fs.readFileSync(file, 'utf-8');
    let html = originalHtml
      .replace(/<link\b[^>]*>/gi, tag => {
        const rel = tagAttribute(tag, 'rel').toLowerCase().replace(/\s+/g, ' ').trim();
        return ['icon', 'shortcut icon', 'apple-touch-icon', 'manifest'].includes(rel) ? '' : tag;
      })
      .replace(/<meta\b[^>]*>/gi, tag =>
        tagAttribute(tag, 'name').toLowerCase() === 'theme-color' ? '' : tag,
      )
      .replaceAll('https://youraicoach.life/favicon.svg', BRAND_SCHEMA_LOGO_URL)
      .replace(
        /(<a\b[^>]*\bhref\s*=\s*(["'])\/\2[^>]*>)\s*(?:⚡\s*)?IZEM\s*(<\/a>)/gi,
        (_match, opening, _quote, closing) => `${opening}${NAVIGATION_LOGO}IZEM${closing}`,
      )
      .replace(
        /(<a\b[^>]*\bhref\s*=\s*(["'])\/\2[^>]*>\s*<span\b[^>]*>)\s*IZEM\s*(<\/span>)/gi,
        (_match, opening, _quote, closing) => `${opening}${NAVIGATION_LOGO}IZEM${closing}`,
      )
      .replace(
        /(<div\b[^>]*class\s*=\s*(["'])[^"']*\blogo-icon\b[^"']*\2[^>]*>)\s*⚡\s*(<\/div>)/gi,
        (_match, opening, _quote, closing) => `${opening}${NAVIGATION_LOGO}${closing}`,
      );

    html = html.replace(/<head(\s[^>]*)?>/i, match => `${match}\n    ${BRAND_ICON_TAGS}`);
    if (html === originalHtml || !html.includes(BRAND_ICON_MARKER)) {
      if (!html.includes(BRAND_ICON_MARKER)) {
        console.warn(`⚠️ Could not inject brand icons in ${path.relative(DIST_DIR, file)}`);
      }
      continue;
    }

    fs.writeFileSync(file, html);
    changed += 1;
  }

  console.log(`✅ IZEM logo and favicon metadata present in ${htmlFiles.length} HTML files (${changed} updated).`);
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
  injectBrandAssets();
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
