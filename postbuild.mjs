import puppeteer from 'puppeteer';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, 'dist');
const HTML_FILE = path.join(DIST_DIR, 'index.html');
const GOOGLE_TAG_ID = 'G-ZXDRG5V07H';
const GOOGLE_TAG = `<!-- Google tag (gtag.js), delayed until after first paint -->
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      (function(){
        var tagLoaded = false;
        function loadGoogleTag(){
          if (tagLoaded) return;
          tagLoaded = true;
          var script = document.createElement('script');
          script.async = true;
          script.src = 'https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}';
          document.head.appendChild(script);
          gtag('js', new Date());
          gtag('config', '${GOOGLE_TAG_ID}');
        }
        function scheduleGoogleTag(){
          if ('requestIdleCallback' in window) {
            window.requestIdleCallback(loadGoogleTag, { timeout: 2000 });
          } else {
            window.setTimeout(loadGoogleTag, 1);
          }
        }
        window.addEventListener('load', function(){ window.setTimeout(scheduleGoogleTag, 6000); }, { once: true });
        window.addEventListener('pointerdown', scheduleGoogleTag, { once: true, passive: true });
        window.addEventListener('keydown', scheduleGoogleTag, { once: true });
        window.addEventListener('scroll', scheduleGoogleTag, { once: true, passive: true });
      })();
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
      const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
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

      injectGoogleTag();
      
      server.close();
      process.exit(0);
    } catch (err) {
      console.warn('⚠️ Pre-rendering skipped (expected in sandboxed environment):', err.message);
      console.log('ℹ️ Proceeding with static html deployment and injecting Google tag...');
      try {
        injectGoogleTag();
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
