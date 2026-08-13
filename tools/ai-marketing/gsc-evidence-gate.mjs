#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { buildInspectionTargets } from './gsc-inspection-targets.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_REPORT = path.join(ROOT, 'tools/ai-marketing/search-console-reports/latest-28d.json');

function setOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${String(value).replace(/\r?\n/g, ' ')}\n`);
}

function setEnv(name, value) {
  if (!process.env.GITHUB_ENV) return;
  fs.appendFileSync(process.env.GITHUB_ENV, `${name}=${String(value).replace(/\r?\n/g, ' ')}\n`);
}

export function evaluateGscEvidence(report) {
  if (!report || typeof report !== 'object') throw new Error('Search Console report is not an object');
  const dimensions = Array.isArray(report.dimensions) ? report.dimensions : [];
  if (!dimensions.includes('query') || !dimensions.includes('page')) {
    throw new Error('Search Console report must include private query and page dimensions');
  }
  if (!Array.isArray(report.rows)) throw new Error('Search Console report rows must be an array');
  const rowCount = report.rows.length;
  return {
    rowCount,
    evidenceAvailable: rowCount > 0,
    site: String(report.site || ''),
    startDate: String(report.startDate || ''),
    endDate: String(report.endDate || ''),
  };
}

export function readEvidenceReport(file = DEFAULT_REPORT) {
  return evaluateGscEvidence(JSON.parse(fs.readFileSync(file, 'utf8')));
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  try {
    const result = readEvidenceReport(process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_REPORT);
    const targets = await buildInspectionTargets();

    setOutput('row_count', result.rowCount);
    setOutput('evidence_available', result.evidenceAvailable ? 'true' : 'false');
    setOutput('inspection_target_count', targets.urls.length);
    setOutput('recent_experiment_count', targets.experimentTargets.length);
    setEnv('GSC_INSPECTION_URLS', targets.urls.join(','));

    console.log(`Private GSC evidence gate: ${result.rowCount} query+page row(s); publication evidence ${result.evidenceAvailable ? 'available' : 'not yet available'}.`);
    console.log(`Adaptive GSC inspection set: ${targets.urls.length} URL(s); ${targets.coreUrls.length} core; ${targets.experimentTargets.length} recent experiment target(s).`);
    for (const item of targets.experimentTargets) {
      console.log(`- recent experiment queued for inspection: ${new URL(item.url).pathname} (${item.file})`);
    }
  } catch (error) {
    console.error(`Private GSC evidence gate failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
