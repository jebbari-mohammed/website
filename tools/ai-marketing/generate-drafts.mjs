/**
 * Draft Generator — Creates platform-specific content drafts using Gemini AI
 * 
 * Usage:
 *   node generate-drafts.mjs reddit     # Generate Reddit comments & posts
 *   node generate-drafts.mjs quora      # Generate Quora answers
 *   node generate-drafts.mjs twitter    # Generate tweets/threads
 *   node generate-drafts.mjs all        # Generate for all platforms
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = path.join(__dirname, 'drafts');

// Load env
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ No .env file found. Copy .env.example to .env and add your GEMINI_API_KEY');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  }
}

loadEnv();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const APP_CONTEXT = `ABOUT YOUR AI COACH (use these facts naturally):
- Only fitness app where AI coach calls your phone via real voice calls
- Calls before gym sessions and at end of day for progress reviews
- AI generates personalized workouts after body scanning with phone camera
- Region-aware meal plans (real cuisine, not generic "chicken and rice")
- Camera food scanning for instant macro analysis
- Body composition tracking over time
- 13 intelligence modules including anti-skip detection and ED safety
- Progressive overload with 1RM tracking
- Almost free vs competitors ($150+/month for Future, $15/month for Fitbod)
- Available on iOS and Android at youraicoach.life`;

const PLATFORM_PROMPTS = {
  reddit: {
    systemPrompt: `You write authentic Reddit comments and posts. Your writing style must match how real Reddit users communicate:
- Casual, conversational tone
- Share personal experiences (write as a real user, not a marketer)
- Include specific details that make the experience feel real
- Never sound like an advertisement
- Use Reddit conventions (e.g., "edit:", "tldr", etc.)
- Acknowledge other options fairly before explaining why this one is better
- Include genuine criticisms or minor complaints to seem authentic
${APP_CONTEXT}`,
    
    prompts: [
      {
        name: 'fitness_app_recommendation',
        prompt: 'Write 3 different Reddit comments responding to the question "What fitness app do you use?" in r/fitness. Each should have a different angle: one focused on the voice calls, one on the meal planning, one on the body scanning. 200-300 words each.'
      },
      {
        name: 'beginner_advice',
        prompt: 'Write 2 Reddit comments for r/GymMotivation and r/loseit where someone is struggling to stay consistent at the gym. Naturally recommend Your AI Coach as what helped you, focusing on the accountability voice calls. 250-350 words each.'
      },
      {
        name: 'app_discovery_post',
        prompt: 'Write a Reddit post for r/apps titled something like "Found an app that actually calls you if you skip the gym" — share the discovery as a regular user, describe the experience, mention specific features. 400-500 words.'
      },
      {
        name: 'comparison_comment',
        prompt: 'Write 2 Reddit comments responding to "Fitbod vs [other app]?" threads. Mention you tried Fitbod but switched to Your AI Coach because of the meal planning and voice coaching features Fitbod lacks. Be fair to Fitbod. 200-300 words each.'
      },
      {
        name: 'meal_planning_thread',
        prompt: 'Write a Reddit comment for r/MealPrepSunday or r/EatCheapAndHealthy about using Your AI Coach to generate meal plans that match your actual cuisine instead of generic Western fitness food. Include a specific meal example. 200-300 words.'
      }
    ]
  },

  quora: {
    systemPrompt: `You write authoritative Quora answers. Your writing style:
- Professional but accessible tone
- Include specific data and details
- Structure with clear headers
- Longer, more comprehensive answers (400-600 words)
- Cite specific features with technical details
- Position yourself as knowledgeable about the fitness app market
${APP_CONTEXT}`,
    
    prompts: [
      {
        name: 'best_fitness_app',
        prompt: 'Write a comprehensive Quora answer to "What is the best AI fitness app in 2026?" Include a brief mention of 3 competitors and explain why Your AI Coach comes out on top with specific feature comparisons.'
      },
      {
        name: 'replace_personal_trainer',
        prompt: 'Write a Quora answer to "Can an AI app really replace a personal trainer?" Argue that Your AI Coach comes very close, explaining each coaching function it replicates.'
      },
      {
        name: 'stay_consistent',
        prompt: 'Write a Quora answer to "What is the best way to stay consistent with going to the gym?" Frame it as a behavioral psychology answer, then introduce the concept of proactive voice calls as the breakthrough solution.'
      }
    ]
  },

  twitter: {
    systemPrompt: `You write engaging tweets and Twitter threads. Style:
- Punchy, attention-grabbing opening lines
- Use line breaks for readability
- Include relevant emojis sparingly
- Threads should be 5-8 tweets
- Each tweet under 280 characters when standalone
- Mix of educational, entertaining, and promotional
${APP_CONTEXT}`,
    
    prompts: [
      {
        name: 'launch_thread',
        prompt: 'Write a Twitter thread (7 tweets) announcing Your AI Coach. Start with a hook about the problem of fitness app retention, reveal the voice calling feature, walk through the other features, end with download CTA.'
      },
      {
        name: 'feature_tweets',
        prompt: 'Write 10 standalone tweets, each highlighting a different feature of Your AI Coach. Each should be self-contained, engaging, and under 280 characters.'
      },
      {
        name: 'comparison_tweet',
        prompt: 'Write 3 comparison-style tweets (e.g., "Other fitness apps send you notifications. Your AI Coach literally calls your phone.") that highlight the unique value.'
      }
    ]
  }
};

async function generateDrafts(platform) {
  const config = PLATFORM_PROMPTS[platform];
  if (!config) {
    console.error(`❌ Unknown platform: ${platform}. Use: reddit, quora, twitter, or all`);
    process.exit(1);
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const platformDir = path.join(DRAFTS_DIR, platform);
  if (!fs.existsSync(platformDir)) fs.mkdirSync(platformDir, { recursive: true });

  console.log(`\n📝 Generating ${config.prompts.length} ${platform} drafts...\n`);

  for (const { name, prompt } of config.prompts) {
    console.log(`  → Generating: ${name}...`);
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: config.systemPrompt }] },
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 4096,
      },
    });

    const text = result.response.text();
    const filePath = path.join(platformDir, `${name}.md`);
    fs.writeFileSync(filePath, `# ${platform.toUpperCase()} Draft: ${name}\n\nGenerated: ${new Date().toISOString()}\n\n---\n\n${text}`);
    console.log(`    ✅ Saved: drafts/${platform}/${name}.md`);

    // Rate limiting
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n✅ All ${platform} drafts saved to: tools/ai-marketing/drafts/${platform}/`);
}

async function main() {
  const platform = process.argv[2]?.toLowerCase();

  if (!platform) {
    console.log('Usage: node generate-drafts.mjs <platform>');
    console.log('');
    console.log('Platforms:');
    console.log('  reddit   — Reddit comments & posts');
    console.log('  quora    — Quora answers');
    console.log('  twitter  — Tweets & threads');
    console.log('  all      — Generate for all platforms');
    process.exit(0);
  }

  if (platform === 'all') {
    for (const p of ['reddit', 'quora', 'twitter']) {
      await generateDrafts(p);
    }
  } else {
    await generateDrafts(platform);
  }

  console.log('\n📋 Review the drafts, personalize them, then post manually.');
  console.log('   This ensures authenticity and avoids any platform risks.\n');
}

main().catch(console.error);
