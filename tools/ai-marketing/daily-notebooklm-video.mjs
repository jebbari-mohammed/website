#!/usr/bin/env node

// The one publisher owns generation, fallback, safety, upload and verification.
// Read-only diagnostics cannot turn a failed native retry into a release blocker
// before the publisher has had a chance to create the authorized fallback.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectRequestedRecovery } from './notebooklm-recovery-diagnostic.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
await inspectRequestedRecovery(root);
await import('./daily-notebooklm-video-v2.mjs');
