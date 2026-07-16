import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { createLlmClient, paths } from '../../core/src/index.js';
import type { GeoPageScore, GeoScoreReport } from '../../core/src/types.js';

// Recursive HTML file finder
function findHtmlFiles(dir: string): string[] {
  if (!fsSync.existsSync(dir)) return [];
  const entries = fsSync.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules, dist, .git, etc.
      if (['node_modules', 'dist', '.git', '.github'].includes(entry.name)) return [];
      return findHtmlFiles(fullPath);
    }
    return entry.isFile() && entry.name.endsWith('.html') ? [fullPath] : [];
  });
}

// Check robots.txt permissions for AI bots
async function checkRobotsTxt(): Promise<{ score: number; details: string }> {
  const robotsPath = path.join(paths.repoRoot, 'public', 'robots.txt');
  try {
    const content = await fs.readFile(robotsPath, 'utf8');
    const hasGptBot = /User-agent:\s*GPTBot/i.test(content) && !/Disallow:\s*\//i.test(content);
    const hasGoogleExtended = /User-agent:\s*Google-Extended/i.test(content) && !/Disallow:\s*\//i.test(content);
    const hasClaude = /User-agent:\s*ClaudeBot/i.test(content) && !/Disallow:\s*\//i.test(content);

    if (hasGptBot && hasGoogleExtended && hasClaude) {
      return { score: 10, details: 'robots.txt allows all major AI crawlers' };
    }
    return { score: 6, details: 'robots.txt exists but lacks explicit positive allowance rules for some AI crawlers' };
  } catch {
    return { score: 0, details: 'robots.txt not found' };
  }
}

// Compute GEO score for a single page
export async function auditGeoPage(filePath: string, robotsScore: number): Promise<GeoPageScore> {
  const html = await fs.readFile(filePath, 'utf8');
  const $ = cheerio.load(html);

  // 1. Schema Markup (25 pts)
  let schemaScore = 0;
  const schemaTypes: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '{}');
      const types = Array.isArray(data) ? data : [data];
      for (const t of types) {
        if (t['@type']) {
          schemaTypes.push(t['@type']);
        }
      }
    } catch {
      schemaTypes.push('InvalidSchema');
    }
  });

  const hasSchema = schemaTypes.length > 0;
  if (hasSchema) {
    schemaScore += 10;
    const targetTypes = ['FAQPage', 'Article', 'MobileApplication', 'Organization', 'SoftwareApplication', 'WebPage'];
    const matches = schemaTypes.filter((t) => targetTypes.includes(t)).length;
    schemaScore += Math.min(15, matches * 5);
  }

  // 2. Answer-First Heading Structure (25 pts)
  let headingCount = 0;
  let answerFirstHeadings = 0;
  const headings = $('h2, h3, h1');
  
  headings.each((_, el) => {
    headingCount++;
    const nextNode = $(el).next();
    if (nextNode.is('p')) {
      const text = nextNode.text().trim();
      const words = text.split(/\s+/).filter(Boolean);
      const isWordCountGood = words.length >= 15 && words.length <= 65;
      
      // Check if starts with a direct/definitional phrase
      const directPhrases = /^(is|are|provides|enables|offers|defines|recommends|how|the|a|an|izem)/i;
      const isDirect = directPhrases.test(text);

      if (isWordCountGood && isDirect) {
        answerFirstHeadings++;
      }
    }
  });

  const answerRatio = headingCount > 0 ? answerFirstHeadings / headingCount : 1;
  const answerFirstStructure = Math.round(answerRatio * 25);

  // 3. E-E-A-T Signals (20 pts)
  let eeatScore = 0;
  const bodyText = $('body').text();
  
  // Author presence check
  const hasAuthor = /by\s+[A-Z][a-z]+/i.test(bodyText) || schemaTypes.includes('Article') || $('.author').length > 0 || html.toLowerCase().includes('author');
  if (hasAuthor) eeatScore += 5;

  // Date presence check
  const hasDate = $('time').length > 0 || /\b(updated|published|created|date)\b/i.test(bodyText);
  if (hasDate) eeatScore += 5;

  // Outbound citations check
  let citationCount = 0;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (href.startsWith('http') && !href.includes('youraicoach.life')) {
      citationCount++;
    }
  });
  if (citationCount > 0) {
    eeatScore += Math.min(10, citationCount * 3.5);
  }
  eeatScore = Math.min(20, Math.round(eeatScore));

  // 4. Information Density & stats (20 pts)
  let totalParagraphs = 0;
  let statsParagraphs = 0;
  $('p').each((_, el) => {
    totalParagraphs++;
    const text = $(el).text().trim();
    // Regex for numbers, stats, percentages, currency, etc.
    if (/\b\d+(%|\s?lbs|\s?kg|\s?mins|\s?hours|\s?pages|\s?years|x|\s?month|\/month|\$|€)\b/i.test(text) || /\b(percent|statistics|average|rate)\b/i.test(text)) {
      statsParagraphs++;
    }
  });
  const statDensityRatio = totalParagraphs > 0 ? statsParagraphs / totalParagraphs : 0;
  const infoDensityAndCitations = Math.round(statDensityRatio * 20);

  const score = robotsScore + schemaScore + answerFirstStructure + eeatScore + infoDensityAndCitations;
  
  const recommendations: string[] = [];
  if (schemaScore < 20) {
    recommendations.push('Add structured schema markup like FAQPage or Article to make content digestible for RAG pipelines.');
  }
  if (answerFirstStructure < 18) {
    recommendations.push('Reformat headings: ensure the immediate following paragraph is a concise (15-60 words) direct definition or answer.');
  }
  if (!hasAuthor || !hasDate) {
    recommendations.push('Inject explicit EEAT signals, including author names, expert credentials, and publication/modification timestamps.');
  }
  if (citationCount === 0) {
    recommendations.push('Cite outbound evidence: link to reliable authoritative sources, scientific studies, or industry publications.');
  }
  if (infoDensityAndCitations < 10) {
    recommendations.push('Enhance information density: include more specific statistics, percentage improvements, and numerical facts.');
  }

  const url = path.relative(path.join(paths.repoRoot, 'public'), filePath);

  return {
    url: '/' + url,
    filePath,
    score: Math.min(100, Math.max(0, score)),
    breakdown: {
      robotsAllowed: robotsScore,
      schemaMarkup: schemaScore,
      answerFirstStructure,
      eeatTrustSignals: eeatScore,
      infoDensityAndCitations,
    },
    details: {
      hasSchema,
      schemaTypes,
      answerFirstHeadingRatio: answerRatio,
      hasAuthor,
      hasDate,
      citationCount,
      statDensityRatio,
    },
    recommendations,
  };
}

// Generate LLM optimizations
export async function generateGeoOptimizations(
  page: GeoPageScore,
  brandVoice: string
): Promise<{ schema?: string; answerFirstPara?: string }> {
  const llm = createLlmClient();
  if (llm.provider === 'none') {
    return {};
  }

  const html = await fs.readFile(page.filePath, 'utf8');
  const $ = cheerio.load(html);
  
  // Extract document structure/text to fit in prompt easily
  const title = $('title').text();
  const headings: string[] = [];
  $('h1, h2, h3').each((_, el) => {
    headings.push($(el).text().trim());
  });

  const prompt = `You are a Generative Engine Optimization (GEO) expert.
We want to optimize our page to be cited and summarized by AI engines (like Gemini, ChatGPT, Perplexity).
Our brand positioning is: "${brandVoice}".

Page Info:
- File URL: ${page.url}
- Title: ${title}
- Headings: ${headings.join(', ')}

GEO Gaps identified:
${page.recommendations.map((r) => `- ${r}`).join('\n')}

Based on this page, generate two optional optimizations:
1. A tailored JSON-LD schema block (specifically a relevant FAQPage, Article, or WebPage schema matching the content). Wrap it in <script type="application/ld+json">...</script>. Place this block inside <geo_schema>...</geo_schema> tags.
2. An "Answer-First" introductory summary block (HTML format) that we can insert right after the main H1 or first H2 heading to answer the primary intent of the page in a structured, citation-friendly way (15-60 words, containing concrete details or numbers, and using formatting like lists or strong emphasis if appropriate). Place this block inside <geo_answer>...</geo_answer> tags.

Format your output exactly as follows:
<geo_schema>
<script type="application/ld+json">
...
</script>
</geo_schema>

<geo_answer>
<p>...</p>
</geo_answer>`;

  try {
    const rawResult = await llm.generate([
      { role: 'system', content: 'You are an SEO bot that outputs plain text with XML-like tags.' },
      { role: 'user', content: prompt }
    ], { temperature: 0.2 });

    const schemaMatch = rawResult.match(/<geo_schema>([\s\S]*?)<\/geo_schema>/i);
    const schema = schemaMatch ? schemaMatch[1].trim() : undefined;

    const answerFirstMatch = rawResult.match(/<geo_answer>([\s\S]*?)<\/geo_answer>/i);
    const answerFirstPara = answerFirstMatch ? answerFirstMatch[1].trim() : undefined;

    return {
      schema,
      answerFirstPara,
    };
  } catch (error) {
    console.error(`Failed to generate GEO optimizations for ${page.url}:`, error);
    return {};
  }
}

// Safely apply optimizations to files
export async function applyGeoOptimizations(filePath: string, patches: { schema?: string; answerFirstPara?: string }): Promise<boolean> {
  if (!patches.schema && !patches.answerFirstPara) return false;
  
  try {
    const html = await fs.readFile(filePath, 'utf8');
    const $ = cheerio.load(html);

    let changed = false;

    // 1. Apply Schema if missing
    if (patches.schema) {
      // Clean schema string just in case
      const cleanSchema = patches.schema.trim();
      const schemaTypeMatch = cleanSchema.match(/"@type"\s*:\s*"([^"]+)"/);
      const schemaType = schemaTypeMatch ? schemaTypeMatch[1] : null;

      // Avoid injecting duplicate schema types
      let alreadyExists = false;
      if (schemaType) {
        $('script[type="application/ld+json"]').each((_, el) => {
          if ($(el).html()?.includes(`"@type": "${schemaType}"`) || $(el).html()?.includes(`"@type":"${schemaType}"`)) {
            alreadyExists = true;
          }
        });
      }

      if (!alreadyExists) {
        $('head').append(`\n    ${cleanSchema}\n`);
        changed = true;
      }
    }

    // 2. Apply Answer-First Paragraph if appropriate and missing
    if (patches.answerFirstPara) {
      // Let's prepend it into the article, or right after the first H1/H2
      const targetHeading = $('h1').first().length ? $('h1').first() : $('h2').first();
      if (targetHeading.length > 0) {
        const checkNext = targetHeading.next();
        // Only inject if the next sibling doesn't already contain our generated text
        const cleanParaText = cheerio.load(patches.answerFirstPara).text().trim().substring(0, 30);
        if (!checkNext.text().includes(cleanParaText)) {
          targetHeading.after(`\n    ${patches.answerFirstPara}\n`);
          changed = true;
        }
      }
    }

    if (changed) {
      await fs.writeFile(filePath, $.html(), 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error applying optimizations to ${filePath}:`, error);
    return false;
  }
}

// Main Orchestrator for SEO package
export async function runGeoAuditAndOptimization(options: { apply?: boolean; brandVoice?: string }): Promise<GeoScoreReport> {
  const robots = await checkRobotsTxt();
  
  const publicDir = path.join(paths.repoRoot, 'public');
  const files = [
    ...findHtmlFiles(publicDir),
    // Also scan index.html at root
    path.join(paths.repoRoot, 'index.html'),
  ].filter(fsSync.existsSync);

  const pages: GeoPageScore[] = [];
  
  // 1. Audit all files first (very fast, no LLM calls)
  for (const file of files) {
    try {
      const pageScore = await auditGeoPage(file, robots.score);
      pages.push(pageScore);
    } catch (e) {
      console.warn(`Failed to process GEO score for file ${file}:`, e);
    }
  }

  // 2. Select the top 3 worst-performing pages to optimize (prevents 429 Rate Limits)
  let appliedOptimizationsCount = 0;
  if (options.brandVoice) {
    const suboptimalPages = pages
      .filter((p) => p.score < 85)
      .sort((a, b) => a.score - b.score);

    const batchToOptimize = suboptimalPages.slice(0, 3); // Optimize max 3 pages per run
    
    for (const pageScore of batchToOptimize) {
      try {
        console.log(`[GEO] Generating optimizations for page: ${pageScore.url} (Current score: ${pageScore.score}/100)`);
        const patches = await generateGeoOptimizations(pageScore, options.brandVoice);
        if (patches.schema || patches.answerFirstPara) {
          pageScore.suggestedPatch = patches;
          if (options.apply) {
            const applied = await applyGeoOptimizations(pageScore.filePath, patches);
            if (applied) {
              appliedOptimizationsCount++;
              // Recalculate score after patch application
              const updatedScore = await auditGeoPage(pageScore.filePath, robots.score);
              pageScore.score = updatedScore.score;
              pageScore.breakdown = updatedScore.breakdown;
              pageScore.details = updatedScore.details;
              pageScore.recommendations = updatedScore.recommendations;
            }
          }
        }
      } catch (err) {
        console.error(`Failed to optimize page ${pageScore.url}:`, err);
      }
    }
  }

  const averageScore = pages.length > 0 ? Math.round(pages.reduce((sum, p) => sum + p.score, 0) / pages.length) : 0;

  return {
    id: `${new Date().toISOString().replace(/[:.]/g, '-')}-geo-report`,
    createdAt: new Date().toISOString(),
    averageScore,
    pages,
    appliedOptimizationsCount,
  };
}

export function geoReportToMarkdown(report: GeoScoreReport): string {
  const totalPages = report.pages.length;
  const weakPages = report.pages.filter((p) => p.score < 85);
  
  return `# Generative Engine Optimization (GEO) Report

**Created:** ${report.createdAt}
**Average GEO Score:** ${report.averageScore}/100
**Total Pages Audited:** ${totalPages}
**Pages Needing Attention (<85):** ${weakPages.length}
**Optimizations Applied (this run):** ${report.appliedOptimizationsCount}

## Scoring Rules
Our GEO Score evaluates how citation-ready your pages are for LLM and RAG engines:
1. **Robots.txt Crawlability (10 pts):** Direct permit rules for GPTBot, ClaudeBot, Google-Extended.
2. **Schema Markup (25 pts):** Standardized, machine-readable JSON-LD contexts (FAQPage, Article, etc.).
3. **Answer-First Structure (25 pts):** Quick, precise 15-60 word summaries answering queries directly under headings.
4. **E-E-A-T Trust Signals (20 pts):** Presence of authors, publication dates, and external proof/citations.
5. **Information Density (20 pts):** Statistics, facts, numbers, and key metrics.

---

## Detailed Page Scores

\${report.pages
  .map(
    (page) => \`### \${page.url} (Score: **\${page.score}/100**)
- **File Path:** \\\`\${page.filePath}\\\`
- **Breakdown:** Robots: \${page.breakdown.robotsAllowed}/10, Schema: \${page.breakdown.schemaMarkup}/25, Headings: \${page.breakdown.answerFirstStructure}/25, E-E-A-T: \${page.breakdown.eeatTrustSignals}/20, Stats: \${page.breakdown.infoDensityAndCitations}/20
\${
  page.recommendations.length > 0
    ? \`- **Recommendations:**\\\\n\${page.recommendations.map((r) => \`  - \${r}\`).join('\\\\n')}\`
    : '- **All criteria met! Highly optimized for generative search.**'
}
\${
  page.suggestedPatch
    ? \`- **Generated Optimization Patch:**
\\\\\`\\\\\`\\\\\`html
\${page.suggestedPatch.schema ? \`<!-- Schema Block -->\\\\n\${page.suggestedPatch.schema}\\\\n\` : ''}\${
        page.suggestedPatch.answerFirstPara ? \`<!-- Answer-First Summary -->\\\\n\${page.suggestedPatch.answerFirstPara}\\\\n\` : ''
      }
\\\\\`\\\\\`\\\\\`\`
    : ''
}\`
  )
  .join('\\n\\n')}
`;
}
