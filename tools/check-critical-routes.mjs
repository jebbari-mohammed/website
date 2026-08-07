#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const siteOrigin = 'https://youraicoach.life';
const root = path.resolve(process.argv[2] || 'dist');
const errors = [];
let checkedLinks = 0;

async function collectFiles(directory, relativeDirectory = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.posix.join(relativeDirectory, entry.name);
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath, relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files;
}

function pageUrl(relativeFile) {
  if (relativeFile === 'index.html') return `${siteOrigin}/`;
  if (relativeFile.endsWith('/index.html')) {
    return `${siteOrigin}/${relativeFile.slice(0, -'index.html'.length)}`;
  }
  return `${siteOrigin}/${relativeFile}`;
}

function candidateFiles(pathname) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    decodedPath = pathname;
  }

  const relativePath = decodedPath.replace(/^\/+/, '');
  if (!relativePath || decodedPath.endsWith('/')) {
    return [path.posix.join(relativePath, 'index.html')];
  }

  return [
    relativePath,
    `${relativePath}.html`,
    path.posix.join(relativePath, 'index.html'),
  ];
}

function targetExists(url, allFiles) {
  return candidateFiles(url.pathname).some((candidate) => allFiles.has(candidate));
}

function internalUrl(value, base) {
  const href = String(value || '').trim();
  if (
    !href ||
    href.startsWith('#') ||
    /^(?:mailto|tel|javascript|data):/i.test(href)
  ) {
    return null;
  }

  const url = new URL(href, base);
  return url.origin === siteOrigin ? url : null;
}

function htmlAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match?.[2];
}

const files = await collectFiles(root);
const allFiles = new Set(files);
const htmlFiles = files.filter((file) => file.endsWith('.html'));

for (const htmlFile of htmlFiles) {
  const html = await readFile(path.join(root, htmlFile), 'utf8');
  const anchors = html.match(/<a\b[^>]*>/gi) || [];

  for (const anchor of anchors) {
    const href = htmlAttribute(anchor, 'href');
    if (!href) continue;

    let url;
    try {
      url = internalUrl(href, pageUrl(htmlFile));
    } catch {
      errors.push(`${htmlFile}: invalid href ${href}`);
      continue;
    }

    if (!url) continue;
    checkedLinks += 1;
    if (!targetExists(url, allFiles)) {
      errors.push(`${htmlFile}: ${href} has no built target`);
    }
  }
}

for (const manifestFile of ['sitemap.xml', 'news-sitemap.xml', 'blog/feed.xml']) {
  if (!allFiles.has(manifestFile)) continue;
  const content = await readFile(path.join(root, manifestFile), 'utf8');
  const urls = [
    ...content.matchAll(/<(?:loc|link|guid)>(https?:\/\/[^<]+)<\/(?:loc|link|guid)>/gi),
  ].map((match) => match[1].trim());

  for (const value of urls) {
    let url;
    try {
      url = new URL(value);
    } catch {
      errors.push(`${manifestFile}: invalid URL ${value}`);
      continue;
    }

    if (url.origin === siteOrigin && !targetExists(url, allFiles)) {
      errors.push(`${manifestFile}: ${value} has no built target`);
    }
  }
}

if (errors.length) {
  console.error(`Critical route check failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Critical route check passed: ${htmlFiles.length} pages and ${checkedLinks} internal links checked.`);
