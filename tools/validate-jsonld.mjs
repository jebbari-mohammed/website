#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const requestedRoots = process.argv.slice(2).filter((value) => !value.startsWith('-'));
const roots = requestedRoots.length ? requestedRoots : ['public'];
const errors = [];
let htmlCount = 0;
let blockCount = 0;

async function collectHtmlFiles(target) {
  const entries = await readdir(target, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectHtmlFiles(absolutePath)));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(absolutePath);
    }
  }

  return files;
}

function lineNumberAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

function jsonLdBlocks(html) {
  const pattern = /<script\b[^>]*\btype\s*=\s*(["'])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/gi;
  return [...html.matchAll(pattern)].map((match) => ({
    json: match[2].trim(),
    index: match.index ?? 0,
  }));
}

function hasType(value, expectedType) {
  const type = value?.['@type'];
  return type === expectedType || (Array.isArray(type) && type.includes(expectedType));
}

function visit(value, visitor) {
  if (Array.isArray(value)) {
    for (const item of value) visit(item, visitor);
    return;
  }

  if (!value || typeof value !== 'object') return;
  visitor(value);
  for (const child of Object.values(value)) visit(child, visitor);
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateFaqPage(node, file, line) {
  if (!Array.isArray(node.mainEntity) || node.mainEntity.length === 0) {
    errors.push(`${file}:${line}: FAQPage mainEntity must be a non-empty array`);
    return;
  }

  node.mainEntity.forEach((question, index) => {
    const label = `${file}:${line}: FAQ question ${index + 1}`;
    if (!question || typeof question !== 'object' || !nonEmptyString(question.name)) {
      errors.push(`${label} is missing a non-empty name`);
      return;
    }

    const answers = Array.isArray(question.acceptedAnswer)
      ? question.acceptedAnswer
      : [question.acceptedAnswer];

    if (
      answers.length === 0 ||
      answers.some((answer) => !answer || typeof answer !== 'object' || !nonEmptyString(answer.text))
    ) {
      errors.push(`${label} is missing a non-empty acceptedAnswer.text`);
    }
  });
}

for (const root of roots) {
  let files;
  try {
    files = await collectHtmlFiles(root);
  } catch (error) {
    errors.push(`${root}: unable to scan directory (${error.message})`);
    continue;
  }

  for (const file of files) {
    htmlCount += 1;
    const html = await readFile(file, 'utf8');
    const relativeFile = path.relative(process.cwd(), file) || file;

    for (const block of jsonLdBlocks(html)) {
      blockCount += 1;
      const line = lineNumberAt(html, block.index);

      if (!block.json) {
        errors.push(`${relativeFile}:${line}: empty JSON-LD block`);
        continue;
      }

      let data;
      try {
        data = JSON.parse(block.json);
      } catch (error) {
        errors.push(`${relativeFile}:${line}: invalid JSON-LD (${error.message})`);
        continue;
      }

      visit(data, (node) => {
        if (hasType(node, 'FAQPage')) validateFaqPage(node, relativeFile, line);
      });
    }
  }
}

if (errors.length) {
  console.error(`JSON-LD validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`JSON-LD validation passed: ${blockCount} block(s) across ${htmlCount} HTML file(s).`);
