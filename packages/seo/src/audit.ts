import crypto from 'node:crypto';
import type { CrawledPage, SeoIssue, SiteAudit } from '../../core/src/index.js';
import { crawlSite } from './crawler.js';

function issue(input: Omit<SeoIssue, 'id'>): SeoIssue {
  return { id: crypto.randomUUID(), ...input };
}

export function auditPages(websiteUrl: string, pages: CrawledPage[]): SiteAudit {
  const issues: SeoIssue[] = [];

  for (const page of pages) {
    if (page.status === 0 || page.status >= 400) {
      issues.push(
        issue({
          url: page.url,
          category: 'technical',
          severity: 'high',
          title: 'Page failed to load',
          detail: `The crawler received status ${page.status || 'network failure'}.`,
          recommendation: 'Check the route, hosting logs, redirects, and whether this URL should be in the sitemap.',
        })
      );
      continue;
    }

    if (!page.title) {
      issues.push(
        issue({
          url: page.url,
          category: 'metadata',
          severity: 'high',
          title: 'Missing title tag',
          detail: 'No HTML title tag was found.',
          recommendation: 'Add a specific title tag around 45-60 characters with the page intent and IZEM brand.',
        })
      );
    } else if (page.title.length < 25 || page.title.length > 65) {
      issues.push(
        issue({
          url: page.url,
          category: 'metadata',
          severity: 'medium',
          title: 'Title length is weak',
          detail: `Title length is ${page.title.length} characters.`,
          recommendation: 'Rewrite the title to be descriptive, keyword-specific, and usually 45-60 characters.',
        })
      );
    }

    if (!page.metaDescription) {
      issues.push(
        issue({
          url: page.url,
          category: 'metadata',
          severity: 'medium',
          title: 'Missing meta description',
          detail: 'No meta description was found.',
          recommendation: 'Add a 145-160 character description with the page promise and a restrained CTA.',
        })
      );
    } else if (page.metaDescription.length < 80 || page.metaDescription.length > 170) {
      issues.push(
        issue({
          url: page.url,
          category: 'metadata',
          severity: 'low',
          title: 'Meta description length is suboptimal',
          detail: `Meta description length is ${page.metaDescription.length} characters.`,
          recommendation: 'Keep descriptions concise, readable, and aligned to search intent.',
        })
      );
    }

    if (page.h1.length !== 1) {
      issues.push(
        issue({
          url: page.url,
          category: 'content',
          severity: page.h1.length === 0 ? 'high' : 'medium',
          title: page.h1.length === 0 ? 'Missing H1' : 'Multiple H1 headings',
          detail: `Found ${page.h1.length} H1 headings.`,
          recommendation: 'Use exactly one clear H1 that matches the page intent.',
        })
      );
    }

    if (page.wordCount < 250) {
      issues.push(
        issue({
          url: page.url,
          category: 'content',
          severity: 'medium',
          title: 'Thin page',
          detail: `The page has about ${page.wordCount} words.`,
          recommendation: 'Add useful, specific content or consolidate this page if it does not deserve its own URL.',
        })
      );
    }

    const missingAlt = page.images.filter((image) => image.src && !image.alt).length;
    if (missingAlt > 0) {
      issues.push(
        issue({
          url: page.url,
          category: 'content',
          severity: 'low',
          title: 'Images missing alt text',
          detail: `${missingAlt} image(s) have no alt text.`,
          recommendation: 'Add descriptive alt text where the image conveys meaning. Decorative images can use empty alt attributes intentionally.',
        })
      );
    }

    const internalLinks = page.links.filter((link) => link.internal).length;
    if (internalLinks < 3) {
      issues.push(
        issue({
          url: page.url,
          category: 'links',
          severity: 'medium',
          title: 'Weak internal linking',
          detail: `Found ${internalLinks} internal links.`,
          recommendation: 'Add contextual links to nearby accountability, calls, workout, meal plan, and comparison pages.',
        })
      );
    }

    if (page.schemaTypes.length === 0) {
      issues.push(
        issue({
          url: page.url,
          category: 'schema',
          severity: 'low',
          title: 'No structured data detected',
          detail: 'No JSON-LD schema types were found.',
          recommendation: 'Consider Article, SoftwareApplication, BreadcrumbList, FAQ-style content where eligible, or ItemList for hubs.',
        })
      );
    }

    if (page.loadMs > 2500) {
      issues.push(
        issue({
          url: page.url,
          category: 'performance',
          severity: 'medium',
          title: 'Slow response for crawler',
          detail: `Fetch and parse took ${page.loadMs}ms.`,
          recommendation: 'Check page weight, render-blocking assets, images, and hosting response time.',
        })
      );
    }
  }

  const high = issues.filter((item) => item.severity === 'high').length;
  const medium = issues.filter((item) => item.severity === 'medium').length;
  const low = issues.filter((item) => item.severity === 'low').length;
  const score = Math.max(0, 100 - high * 12 - medium * 6 - low * 2);

  return {
    id: `${new Date().toISOString().replace(/[:.]/g, '-')}-site-audit`,
    createdAt: new Date().toISOString(),
    websiteUrl,
    pages,
    issues,
    summary: {
      pagesCrawled: pages.length,
      high,
      medium,
      low,
      score,
    },
  };
}

export async function runSiteAudit(websiteUrl: string, maxPages = 25): Promise<SiteAudit> {
  const pages = await crawlSite(websiteUrl, { maxPages });
  return auditPages(websiteUrl, pages);
}

export function siteAuditToMarkdown(audit: SiteAudit): string {
  const topIssues = audit.issues.slice(0, 30);
  return `# Website SEO Audit

Website: ${audit.websiteUrl}
Created: ${audit.createdAt}

## Summary

- Pages crawled: ${audit.summary.pagesCrawled}
- SEO health score: ${audit.summary.score}/100
- High severity: ${audit.summary.high}
- Medium severity: ${audit.summary.medium}
- Low severity: ${audit.summary.low}

## Priority Issues

${topIssues
  .map(
    (item) => `### ${item.severity.toUpperCase()} - ${item.title}

- URL: ${item.url}
- Category: ${item.category}
- Detail: ${item.detail}
- Recommendation: ${item.recommendation}`
  )
  .join('\n\n')}

## Pages Crawled

${audit.pages
  .map((page) => `- ${page.status} ${page.url} - ${page.title || 'Untitled'} (${page.wordCount} words)`)
  .join('\n')}
`;
}
