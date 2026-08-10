#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const file = path.resolve('public/seo-system-version.json');
const current = JSON.parse(await fs.readFile(file, 'utf8'));
const next = {
  ...current,
  version: Math.max(3, Number(current.version || 0)),
  pipeline: 'verified-url-prefix-gsc-expert-plan-grounded-two-pass-editor',
  searchConsoleProperty: 'https://youraicoach.life/',
  searchConsoleVerified: true,
  updatedAt: new Date().toISOString().slice(0, 10),
};
await fs.writeFile(file, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
console.log('Search Console production readiness marker updated.');
