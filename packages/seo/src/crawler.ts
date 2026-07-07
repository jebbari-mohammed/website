import crypto from 'node:crypto';
import * as cheerio from 'cheerio';
import type { CrawledPage } from '../../core/src/index.js';
import { enforceRateLimit, withRetry } from '../../core/src/index.js';

type CrawlOptions = {
  maxPages?: number;
  timeoutMs?: number;
};

function normalizeUrl(url: string): string {
  const parsed = new URL(url);
  parsed.hash = '';
  parsed.search = '';
  return parsed.toString().replace(/\/$/, '/');
}

function absoluteUrl(href: string, base: string): string | undefined {
  try {
    const url = new URL(href, base);
    if (!['http:', 'https:'].includes(url.protocol)) return undefined;
    return normalizeUrl(url.toString());
  } catch {
    return undefined;
  }
}

function getSchemaTypes($: cheerio.CheerioAPI): string[] {
  const types = new Set<string>();
  $('script[type="application/ld+json"]').each((_, element) => {
    const raw = $(element).contents().text();
    try {
      const parsed = JSON.parse(raw) as unknown;
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item && typeof item === 'object' && '@type' in item) {
          const type = (item as { '@type': string | string[] })['@type'];
          if (Array.isArray(type)) type.forEach((entry) => types.add(entry));
          else types.add(type);
        }
      }
    } catch {
      types.add('InvalidJsonLd');
    }
  });
  return [...types];
}

async function fetchPage(url: string, timeoutMs: number) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await withRetry(
      () =>
        fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'IZEM-Marketing-Employee/1.0 (+https://youraicoach.life)',
          },
        }),
      {
        attempts: 2,
        shouldRetry: (error) => !(error instanceof DOMException && error.name === 'AbortError'),
      }
    );
    const html = await response.text();
    return { status: response.status, html, loadMs: Date.now() - startedAt };
  } finally {
    clearTimeout(timer);
  }
}

export async function crawlSite(startUrl: string, options: CrawlOptions = {}): Promise<CrawledPage[]> {
  const maxPages = options.maxPages ?? 25;
  const timeoutMs = options.timeoutMs ?? 12000;
  const origin = new URL(startUrl).origin;
  const queue = [normalizeUrl(startUrl)];
  const visited = new Set<string>();
  const pages: CrawledPage[] = [];

  while (queue.length > 0 && pages.length < maxPages) {
    const url = queue.shift();
    if (!url || visited.has(url)) continue;
    visited.add(url);
    await enforceRateLimit(`crawl:${origin}`, 1, 350);

    try {
      const { status, html, loadMs } = await fetchPage(url, timeoutMs);
      const $ = cheerio.load(html);
      const title = $('title').first().text().trim();
      const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';
      const canonical = $('link[rel="canonical"]').attr('href') || '';
      const h1 = $('h1')
        .map((_, element) => $(element).text().replace(/\s+/g, ' ').trim())
        .get()
        .filter(Boolean);
      const h2 = $('h2')
        .map((_, element) => $(element).text().replace(/\s+/g, ' ').trim())
        .get()
        .filter(Boolean);
      const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
      const wordCount = bodyText ? bodyText.split(/\s+/).length : 0;
      const images = $('img')
        .map((_, element) => ({
          src: $(element).attr('src') || '',
          alt: $(element).attr('alt') || '',
        }))
        .get();
      const links = $('a[href]')
        .map((_, element) => {
          const href = absoluteUrl($(element).attr('href') || '', url);
          if (!href) return undefined;
          return {
            href,
            text: $(element).text().replace(/\s+/g, ' ').trim(),
            internal: new URL(href).origin === origin,
          };
        })
        .get()
        .filter(Boolean);

      for (const link of links) {
        if (link.internal && !visited.has(link.href) && queue.length + pages.length < maxPages * 2) {
          queue.push(link.href);
        }
      }

      pages.push({
        url,
        status,
        title,
        metaDescription,
        canonical: canonical ? absoluteUrl(canonical, url) || canonical : '',
        h1,
        h2,
        wordCount,
        images,
        links,
        schemaTypes: getSchemaTypes($),
        loadMs,
      });
    } catch (error) {
      pages.push({
        url,
        status: 0,
        title: '',
        metaDescription: '',
        canonical: '',
        h1: [],
        h2: [],
        wordCount: 0,
        images: [],
        links: [],
        schemaTypes: [],
        loadMs: 0,
      });
      console.warn(`Failed to crawl ${url}: ${(error as Error).message}`);
    }
  }

  return pages.map((page) => ({ ...page, url: page.url || crypto.randomUUID() }));
}
