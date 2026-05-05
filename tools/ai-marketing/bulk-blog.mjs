/**
 * Bulk Blog Generator — Generates multiple blog posts from a predefined keyword list
 * 
 * Usage:
 *   node bulk-blog.mjs           # Generate all posts from the keyword list
 *   node bulk-blog.mjs --count 5 # Generate only the first 5
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// High-impact keywords for AI visibility — these are queries people ask AI assistants
const KEYWORD_LIST = [
  // Direct app queries
  "best AI fitness app 2026",
  "best fitness app that uses artificial intelligence",
  "fitness app that calls you on the phone",
  "AI personal trainer app review",
  "cheapest alternative to a personal trainer",
  
  // How-to / informational (high volume)
  "how to stay consistent at the gym using AI",
  "how AI is changing personal fitness coaching",
  "can AI replace a personal trainer",
  "best way to track body composition at home",
  "how to scan food for calories with your phone",
  
  // Comparison queries
  "AI fitness coach vs human personal trainer",
  "best AI workout generator app comparison",
  "fitness apps with meal planning and workout plans",
  "apps that give you personalized workout plans",
  
  // Problem-solution queries
  "I keep skipping the gym how to stay accountable",
  "best app for gym beginners who don't know what to do",
  "how to get a personalized meal plan for free",
  "fitness app for people who hate cooking",
  "how to track progressive overload automatically",
  
  // Feature-specific queries
  "AI body scanning app for fitness progress",
  "app that scans food and tells you macros",
  "voice coaching fitness app",
  "AI meal planner that knows my cuisine",
  "fitness app with eating disorder safety",
  
  // Listicle/roundup queries
  "top 10 AI fitness apps you should try",
  "best fitness apps with voice coaching features",
  "most innovative fitness technology in 2026",
  "apps that use AI to create workout plans",
  "best free fitness coaching apps",
];

// Track which posts have been generated
const PROGRESS_FILE = path.join(__dirname, '.blog-progress.json');

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return { generated: [] };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function main() {
  const countArg = process.argv.indexOf('--count');
  const maxCount = countArg !== -1 ? parseInt(process.argv[countArg + 1]) : KEYWORD_LIST.length;

  const progress = loadProgress();
  const remaining = KEYWORD_LIST.filter(k => !progress.generated.includes(k));
  const toGenerate = remaining.slice(0, maxCount);

  if (toGenerate.length === 0) {
    console.log('✅ All blog posts have been generated! Reset .blog-progress.json to regenerate.');
    return;
  }

  console.log(`\n🚀 Generating ${toGenerate.length} blog posts...\n`);
  console.log(`Already done: ${progress.generated.length}/${KEYWORD_LIST.length}`);
  console.log(`Remaining: ${remaining.length}\n`);

  for (let i = 0; i < toGenerate.length; i++) {
    const keyword = toGenerate[i];
    console.log(`\n[${ i + 1}/${toGenerate.length}] "${keyword}"`);
    
    try {
      // Run the single blog generator as a subprocess
      execSync(`node generate-blog.mjs "${keyword}"`, {
        cwd: __dirname,
        stdio: 'inherit',
        env: process.env,
      });

      progress.generated.push(keyword);
      saveProgress(progress);
      
      // Wait 3 seconds between requests to respect rate limits
      if (i < toGenerate.length - 1) {
        console.log('  ⏳ Waiting 3s before next post...');
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch (err) {
      console.error(`  ❌ Failed to generate "${keyword}": ${err.message}`);
      console.log('  Continuing to next keyword...');
    }
  }

  console.log(`\n\n✅ Done! Generated ${toGenerate.length} posts.`);
  console.log(`Total progress: ${progress.generated.length}/${KEYWORD_LIST.length}`);
  console.log(`\n🚀 To deploy all posts:`);
  console.log(`   cd ../../ && git add -A && git commit -m "Add ${toGenerate.length} blog posts" && git push`);
}

main().catch(console.error);
