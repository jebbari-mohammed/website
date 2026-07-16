import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { auditGeoPage } from './geo.js';
import { paths } from '../../core/src/index.js';

test('GEO audit page scoring matches expected boundaries', async () => {
  // Create a temporary mock HTML page in the repository root for testing
  const tempFile = path.join(paths.repoRoot, 'temp-geo-test.html');
  const mockHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>IZEM Test AI Personal Trainer Coach</title>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": []
        }
        </script>
      </head>
      <body>
        <h1>IZEM AI Personal Trainer</h1>
        <p>IZEM is a premium AI personal trainer app that call you for accountability. The workout routines adapt weekly.</p>
        
        <h2>How does the adaptive workout app work?</h2>
        <p>IZEM is the coaching system that reviews your day, updates your calendar, and changes meal plans and workout plans every single week based on actual progress.</p>
        
        <h2>What does the meal plan include?</h2>
        <p>It provides full macro tracking details, shopping lists, and adapts to your diet.</p>
        
        <p>Author: Jane Doe. Published: 2026-05-18.</p>
        <a href="https://ncbi.nlm.nih.gov/pubmed/12345">Read clinical study</a>
      </body>
    </html>
  `;

  await fs.writeFile(tempFile, mockHtml, 'utf8');

  try {
    const pageScore = await auditGeoPage(tempFile, 10);
    
    assert.ok(pageScore.score > 50, `Score should be high, was ${pageScore.score}`);
    assert.equal(pageScore.details.hasSchema, true, 'Should detect schema');
    assert.ok(pageScore.details.schemaTypes.includes('FAQPage'), 'Should find FAQPage schema type');
    assert.equal(pageScore.details.hasAuthor, true, 'Should detect author');
    assert.equal(pageScore.details.hasDate, true, 'Should detect date');
    assert.ok(pageScore.details.citationCount >= 1, 'Should find outbound citations');
  } finally {
    // Clean up
    await fs.rm(tempFile, { force: true });
  }
});
