import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const SITE_ORIGIN = 'https://youraicoach.life';
const SITE_HOSTS = new Set(['youraicoach.life', 'www.youraicoach.life']);
const VOID_TAGS = new Set(['br', 'hr']);
const ALLOWED_TAGS = new Set([
  'h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'blockquote', 'code',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'br', 'hr',
]);

const FORBIDDEN_PATTERNS = [
  /\bguarantee(?:d|s)?\b/i,
  /\bscientifically proven\b/i,
  /\bclinically proven\b/i,
  /\bresearch proves\b/i,
  /\bstudies prove\b/i,
  /\bdiagnos(?:e|es|ed|ing)\b/i,
  /\bcure(?:s|d|ing)?\b/i,
  /\bzero risk\b/i,
  /\b100% accurate\b/i,
  /\bthe best app in the world\b/i,
  /\bI (?:tested|tried|used)\b/i,
  /\busers? (?:say|report|love)\b/i,
];

export function queryHash(value = '') {
  return crypto.createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex').slice(0, 12);
}

export function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 84);
}

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function stripHtml(value = '') {
  return String(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeSiteUrl(value = '', siteOrigin = SITE_ORIGIN) {
  if (!value) return '';
  try {
    const url = new URL(value, siteOrigin);
    if (!SITE_HOSTS.has(url.hostname.toLowerCase())) return '';
    url.protocol = 'https:';
    url.hostname = new URL(siteOrigin).hostname;
    url.hash = '';
    url.search = '';
    const pathname = decodeURIComponent(url.pathname || '/').replace(/\/{2,}/g, '/');
    url.pathname = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
    return url.toString().replace(/\/$/, url.pathname === '/' ? '/' : '');
  } catch {
    return '';
  }
}

export function resolvePublicFile(urlValue, publicDir, siteOrigin = SITE_ORIGIN) {
  const normalized = normalizeSiteUrl(urlValue, siteOrigin);
  if (!normalized) return '';
  const pathname = new URL(normalized).pathname;
  const relative = decodeURIComponent(pathname).replace(/^\/+/, '').replace(/\/$/, '');
  const candidates = [];

  if (!relative) {
    candidates.push(path.join(publicDir, 'index.html'));
  } else if (/\.html?$/i.test(relative)) {
    candidates.push(path.join(publicDir, relative));
  } else {
    candidates.push(path.join(publicDir, `${relative}.html`));
    candidates.push(path.join(publicDir, relative, 'index.html'));
  }

  return candidates.find((file) => fs.existsSync(file)) || '';
}

export function sanitizeGeneratedHtml(value = '') {
  let html = String(value)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|form|object|embed|svg|math)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/?(?:html|head|body|meta|link|input|button|textarea|select|option|img|video|audio|canvas)[^>]*>/gi, '')
    .replace(/<a\b[^>]*>/gi, '')
    .replace(/<\/a>/gi, '');

  html = html.replace(/<\/?([a-z0-9]+)\b[^>]*>/gi, (tag, rawName) => {
    const name = String(rawName).toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return '';
    const closing = /^<\//.test(tag);
    if (closing) return VOID_TAGS.has(name) ? '' : `</${name}>`;
    return `<${name}>`;
  });

  return html
    .replace(/javascript\s*:/gi, '')
    .replace(/\s{3,}/g, ' ')
    .trim();
}

export function validateHtmlBalance(html = '') {
  const stack = [];
  const issues = [];
  for (const match of String(html).matchAll(/<\/?([a-z0-9]+)>/gi)) {
    const tag = match[1].toLowerCase();
    if (!ALLOWED_TAGS.has(tag) || VOID_TAGS.has(tag)) continue;
    if (!match[0].startsWith('</')) {
      stack.push(tag);
      continue;
    }
    const last = stack.pop();
    if (last !== tag) {
      issues.push(`unbalanced HTML: expected </${last || 'none'}> but found </${tag}>`);
      break;
    }
  }
  if (stack.length) issues.push(`unclosed HTML tag: <${stack.at(-1)}>`);
  return issues;
}

function countSentences(text) {
  return String(text).split(/[.!?]+/).map((item) => item.trim()).filter((item) => item.length > 24);
}

function repetitionIssues(text) {
  const sentences = countSentences(text).map((sentence) => sentence.toLowerCase());
  const seen = new Map();
  for (const sentence of sentences) seen.set(sentence, (seen.get(sentence) || 0) + 1);
  const repeated = [...seen.entries()].find(([, count]) => count >= 3);
  return repeated ? [`a sentence is repeated ${repeated[1]} times`] : [];
}

export function validateGeneratedContent({
  action,
  query,
  directAnswer = '',
  bodyHtml = '',
  title = '',
  metaDescription = '',
}) {
  const safeBody = sanitizeGeneratedHtml(bodyHtml);
  const text = stripHtml(`${directAnswer} ${safeBody}`);
  const words = text.split(/\s+/).filter(Boolean).length;
  const minWords = action === 'create' ? 900 : 280;
  const maxWords = action === 'create' ? 2600 : 1100;
  const issues = [];

  if (words < minWords) issues.push(`generated content is too thin (${words} words; minimum ${minWords})`);
  if (words > maxWords) issues.push(`generated content is too long (${words} words; maximum ${maxWords})`);
  const h2Count = (safeBody.match(/<h2>/gi) || []).length;
  if (h2Count < (action === 'create' ? 3 : 1)) issues.push(`not enough H2 sections (${h2Count})`);
  if (title.length < 25 || title.length > 75) issues.push(`title length ${title.length} is outside 25-75 characters`);
  if (metaDescription.length < 90 || metaDescription.length > 175) issues.push(`meta description length ${metaDescription.length} is outside 90-175 characters`);
  if (String(directAnswer).length < 60 || String(directAnswer).length > 500) issues.push('direct answer must be 60-500 characters');
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) issues.push(`blocked claim pattern: ${pattern}`);
  }
  const exact = String(query).trim().toLowerCase();
  const exactMatches = exact ? text.toLowerCase().split(exact).length - 1 : 0;
  const maxExact = action === 'create' ? 8 : 5;
  if (exactMatches > maxExact) issues.push(`exact target query repeated ${exactMatches} times`);
  if (/<(?:script|iframe|form|object|embed)\b|javascript:/i.test(safeBody)) issues.push('unsafe HTML detected');
  if (/<a\b/i.test(safeBody)) issues.push('generated links are not allowed; internal links are injected separately');
  issues.push(...validateHtmlBalance(safeBody));
  issues.push(...repetitionIssues(text));
  if (/\$\s?\d|\b\d+(?:\.\d+)?%\b/.test(text)) issues.push('unverified price/statistic-like claim detected');

  if (issues.length) {
    const error = new Error(`Quality gate rejected ${action}: ${issues.join('; ')}`);
    error.issues = issues;
    throw error;
  }
  return { words, safeBody };
}

function attrPattern(attribute, value) {
  return new RegExp(`<meta\\b(?=[^>]*\\b${attribute}\\s*=\\s*(["'])${value}\\1)[^>]*>`, 'i');
}

export function setMetaTag(html, attribute, name, content) {
  const tag = `<meta ${attribute}="${escapeHtml(name)}" content="${escapeHtml(content)}">`;
  const pattern = attrPattern(attribute, name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

export function removeMetaTags(html, attribute, name) {
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\b${attribute}\\s*=\\s*(["'])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1)[^>]*>\\s*`, 'gi');
  return html.replace(pattern, '');
}

export function setTitle(html, title) {
  const tag = `<title>${escapeHtml(title)}</title>`;
  if (/<title\b[^>]*>[\s\S]*?<\/title>/i.test(html)) return html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, tag);
  return html.replace(/<head(\s[^>]*)?>/i, (match) => `${match}\n  ${tag}`);
}

export function setCanonical(html, url) {
  const tag = `<link rel="canonical" href="${escapeHtml(url)}">`;
  const pattern = /<link\b(?=[^>]*\brel\s*=\s*(["'])canonical\1)[^>]*>/i;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function jsonStringContent(value) {
  return JSON.stringify(String(value)).slice(1, -1);
}

export function syncArticleMetadata(html, { title, description, dateModified }) {
  let output = setTitle(html, title);
  output = setMetaTag(output, 'name', 'description', description);
  output = setMetaTag(output, 'property', 'og:title', title);
  output = setMetaTag(output, 'property', 'og:description', description);
  output = setMetaTag(output, 'name', 'twitter:title', title);
  output = setMetaTag(output, 'name', 'twitter:description', description);
  const escapedTitle = jsonStringContent(title);
  const escapedDescription = jsonStringContent(description);
  output = output.replace(/("headline"\s*:\s*")[^"\\]*(?:\\.[^"\\]*)*(")/g, `$1${escapedTitle}$2`);
  output = output.replace(/("description"\s*:\s*")[^"\\]*(?:\\.[^"\\]*)*(")/g, `$1${escapedDescription}$2`);
  if (dateModified) {
    if (/"dateModified"\s*:/.test(output)) {
      output = output.replace(/("dateModified"\s*:\s*")[^"]+("\s*)/g, `$1${dateModified}$2`);
    } else {
      output = output.replace(/("datePublished"\s*:\s*"[^"]+"\s*,?)/, `$1\n        "dateModified": "${dateModified}",`);
    }
  }
  return output;
}

export function setSocialImage(html, imageUrl) {
  let output = removeMetaTags(html, 'property', 'og:image');
  output = removeMetaTags(output, 'property', 'og:image:width');
  output = removeMetaTags(output, 'property', 'og:image:height');
  output = removeMetaTags(output, 'name', 'twitter:image');
  output = removeMetaTags(output, 'name', 'twitter:card');
  output = setMetaTag(output, 'property', 'og:image', imageUrl);
  output = setMetaTag(output, 'property', 'og:image:width', '1200');
  output = setMetaTag(output, 'property', 'og:image:height', '630');
  output = setMetaTag(output, 'name', 'twitter:image', imageUrl);
  output = setMetaTag(output, 'name', 'twitter:card', 'summary_large_image');
  return output;
}

export function injectMarkedSection(html, marker, sectionHtml) {
  const start = `<!-- SEO_GROWTH_REFRESH_START:${marker} -->`;
  const end = `<!-- SEO_GROWTH_REFRESH_END:${marker} -->`;
  const section = `${start}\n${sectionHtml}\n${end}`;
  const existing = new RegExp(`<!-- SEO_GROWTH_REFRESH_START:${marker} -->[\\s\\S]*?<!-- SEO_GROWTH_REFRESH_END:${marker} -->`, 'i');
  if (existing.test(html)) return html.replace(existing, section);
  if (/<\/article>/i.test(html)) return html.replace(/<\/article>/i, `${section}\n</article>`);
  if (/<\/main>/i.test(html)) return html.replace(/<\/main>/i, `${section}\n</main>`);
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${section}\n</body>`);
  throw new Error('Cannot inject refresh section: no closing article, main, or body tag found.');
}

export function countMetaTags(html, attribute, name) {
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\b${attribute}\\s*=\\s*(["'])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1)[^>]*>`, 'gi');
  return [...String(html).matchAll(pattern)].length;
}

export function hasMarker(html, marker) {
  return String(html).includes(`SEO_GROWTH_REFRESH_START:${marker}`);
}
