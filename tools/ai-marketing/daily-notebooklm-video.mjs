#!/usr/bin/env node

// Keep the existing uploader and every visual/publication gate unchanged.
// A matching repair request receives read-only, payload-free diagnostics first.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectRequestedRecovery } from './notebooklm-recovery-diagnostic.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
await inspectRequestedRecovery(root);
await import('./daily-notebooklm-video-v2.mjs');
