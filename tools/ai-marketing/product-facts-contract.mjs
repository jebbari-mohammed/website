#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const FACTS = path.join(ROOT, 'data', 'brand', 'product-facts.json');
const FALLBACK_PUBLISHER = path.join(HERE, 'seo-production.mjs');
const VIDEO_PUBLISHER = path.join(HERE, 'daily-notebooklm-video-v2.mjs');

function main() {
  const facts = JSON.parse(fs.readFileSync(FACTS, 'utf8'));
  const fallback = fs.readFileSync(FALLBACK_PUBLISHER, 'utf8');
  const video = fs.readFileSync(VIDEO_PUBLISHER, 'utf8');
  const errors = [];

  for (const fact of facts.verifiedFacts || []) {
    if (!fallback.includes(fact)) errors.push(`Manual SEO fallback drifted from canonical fact: ${fact}`);
  }

  if (!video.includes('productFacts()') || !video.includes("data', 'brand', 'product-facts.json")) {
    errors.push('Hardened video publisher is not reading canonical product-facts.json');
  }

  const stalePricingPatterns = [
    /pricing anchor/i,
    /\$\s*\d+(?:\.\d{2})?\s*\/\s*(?:month|mo|week)/i,
    /around\s+\$\s*\d+/i,
  ];
  for (const pattern of stalePricingPatterns) {
    if (pattern.test(video)) errors.push(`Video publisher contains a hard-coded pricing claim matching ${pattern}`);
  }

  if (errors.length) {
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log('Canonical product facts contract passed: editorial fallback is aligned and video generation has no hard-coded pricing.');
}

main();
