#!/usr/bin/env node

// Backward-compatible entrypoint. The old implementation printed exact Search
// Console queries and landing pages into logs. Production and local callers now
// use the privacy-safe fetcher, which writes private JSON and prints only totals.
import './gsc-fetch-private.mjs';
