import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import TurndownService from 'turndown';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function homepageMarkdown(html) {
  const $ = load(html);
  const title = $('title').text().trim();
  const canonical = $('link[rel="canonical"]').attr('href');
  if (!title || canonical !== 'https://youraicoach.life/' || !$('h1').length) {
    throw new Error('A real built homepage with its title, canonical and H1 is required.');
  }
  $('script, style, noscript, svg, img, picture, video, audio, iframe, nav, footer, button, input, select, textarea, [hidden], [aria-hidden="true"]').remove();
  $('a[href]').each((_index, element) => {
    const href = $(element).attr('href');
    const url = new URL(href, canonical);
    if (['https:', 'http:', 'mailto:'].includes(url.protocol)) $(element).attr('href', url.href);
    else $(element).removeAttr('href');
  });
  const converter = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced' });
  const body = converter.turndown($('body').html());
  if (body.length < 100) throw new Error('The generated Markdown homepage is empty or incomplete.');
  return `${body}\n\n[Canonical homepage](${canonical}) · [Agent guide](https://youraicoach.life/llms.txt) · [Sitemap](https://youraicoach.life/sitemap.xml)\n`;
}

export function prepareAgentHosting(root = projectRoot) {
  const dist = path.join(root, 'dist');
  const bundle = path.join(root, 'functions/agent-pages/bundle');
  const hosting = path.join(root, 'dist-agent-hosting');
  const html = readFileSync(path.join(dist, 'index.html'), 'utf8');
  const notFound = readFileSync(path.join(dist, '404.html'), 'utf8');
  const markdown = homepageMarkdown(html);
  const config = JSON.parse(readFileSync(path.join(root, 'firebase.json'), 'utf8'));
  const generalHeaders = config.hosting.headers.find(rule => rule.source === '**')?.headers;
  if (!generalHeaders?.length) throw new Error('Existing Hosting security headers must be preserved.');

  // Keep dist intact for ordinary build/route validation and previews. Stage a
  // separate Hosting directory so its index.html cannot shadow the function.
  rmSync(hosting, { recursive: true, force: true });
  cpSync(dist, hosting, { recursive: true });
  rmSync(path.join(hosting, 'index.html'));
  if (existsSync(path.join(hosting, 'index'))) throw new Error('A static /index route would shadow homepage negotiation.');
  mkdirSync(bundle, { recursive: true });
  writeFileSync(path.join(bundle, 'index.html'), html);
  writeFileSync(path.join(bundle, '404.html'), notFound);
  writeFileSync(path.join(bundle, 'index.md'), markdown);
  writeFileSync(path.join(bundle, 'headers.json'), JSON.stringify(Object.fromEntries(generalHeaders.map(({ key, value }) => [key, value])), null, 2) + '\n');
  writeFileSync(path.join(hosting, 'index.md'), markdown);
  copyFileSync(path.join(hosting, 'index.md'), path.join(dist, 'index.md'));
  return { htmlBytes: Buffer.byteLength(html), markdownBytes: Buffer.byteLength(markdown) };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  console.log('Prepared agent-aware Hosting artifact:', prepareAgentHosting());
}
