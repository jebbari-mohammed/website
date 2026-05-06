/**
 * Daily Auto-Blog — Generates one blog post per day, commits & pushes automatically.
 * Designed to run via GitHub Actions cron schedule.
 * 
 * Features:
 * - Picks the next keyword from the list that hasn't been published yet
 * - Generates a human-sounding, long-form article using Gemini
 * - Saves as HTML with full SEO markup
 * - Updates sitemap
 * - Updates the blog index page with all published posts
 * - Commits and pushes to GitHub (auto-deploys via GitHub Pages)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../../public');
const BLOG_DIR = path.join(PUBLIC_DIR, 'blog');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
const PROGRESS_FILE = path.join(__dirname, '.daily-progress.json');

// ========================
// KEYWORD QUEUE (one per day)
// ========================
const KEYWORD_QUEUE = [
  // Week 1-2: High-intent "best app" queries
  "best AI fitness app 2026 complete guide",
  "fitness app that calls you on the phone to train",
  "cheapest alternative to hiring a personal trainer",
  "best app for personalized workout and meal plans",
  "AI personal trainer that actually works",
  "best fitness app for beginners who dont know what to do",
  "fitness app with real voice coaching not chatbot",
  "best app to track progressive overload automatically",
  "AI meal planner app that matches your cuisine",
  "best body scanning app for fitness progress tracking",
  "app that scans your food and tells you calories and protein",
  "best accountability app for going to the gym",
  "free AI fitness coach app review 2026",
  "best workout app with meal planning included",

  // Week 3-4: Comparison & education queries
  "AI fitness coach versus human personal trainer which is better",
  "how artificial intelligence is changing personal fitness",
  "why most people quit fitness apps after two weeks",
  "the science behind accountability and why phone calls work",
  "how to build muscle on a budget with AI help",
  "meal prep for gym goers who hate cooking",
  "progressive overload explained simple guide for beginners",
  "how to calculate your macros without a nutritionist",
  "body recomposition guide lose fat gain muscle at same time",
  "morning workout vs evening workout what science says",
  "high protein recipes that actually taste good",
  "how to break through a fitness plateau",
  "signs you need a rest day from the gym",
  "how to stay motivated when you dont see results yet",

  // Week 5-6: Long-tail & niche queries
  "best fitness app for women over 30",
  "fitness app for people with injuries or limitations",
  "how to get back to the gym after a long break",
  "AI technology in health and fitness industry trends 2026",
  "why generic workout plans dont work for most people",
  "eating disorder awareness in fitness apps why it matters",
  "how to make high protein meals in under 15 minutes",
  "gym anxiety how to feel confident working out",
  "best exercises for each muscle group complete guide",
  "how much protein do you actually need to build muscle",
  "intermittent fasting and working out what you need to know",
  "sleep and muscle recovery the connection nobody talks about",

  // ========================================
  // MONTH 2 — "Vs Competitor" Cluster (High-Intent Buyers)
  // ========================================
  "your ai coach vs fitbod which ai fitness app is actually better",
  "your ai coach vs future fitness app 150 dollar coach vs free AI",
  "your ai coach vs freeletics bodyweight vs full gym AI comparison",
  "your ai coach vs ray app which has better voice coaching",
  "fitbod review 2026 honest pros cons and missing features",
  "future fitness app review is a human coach worth 150 per month",
  "freeletics review 2026 does it actually build muscle",
  "best fitbod alternative that includes meal planning",
  "best future fitness alternative for people on a budget",
  "best freeletics alternative with real progressive overload",
  "noom vs AI fitness apps which approach actually works for weight loss",
  "peloton app vs AI personal trainer which gives better results",
  "apple fitness plus vs AI coaching apps personalization comparison",
  "nike training club vs AI fitness apps 2026 comparison",
  "is a personal trainer app better than youtube workout videos",
  "why I switched from fitbod to an AI voice coaching app",
  "problems with most fitness apps and how AI coaching fixes them",
  "what fitness app influencers wont tell you about generic plans",
  "gym buddy app vs AI accountability coach which keeps you going",
  "fitness app subscription fatigue how to pick just one that works",
  "why most fitness apps fail you after the first month",
  "the hidden cost of cheap fitness apps and what you actually need",
  "comparing every AI fitness app voice features in 2026",
  "which fitness app has the best food scanning accuracy",
  "best fitness app for someone leaving a personal trainer",
  "AI fitness coach vs hiring an online coach real cost breakdown",
  "your ai coach vs caliber app which handles progressive overload better",
  "your ai coach vs trainerize for self-guided training",
  "best fitness app that combines strength training and nutrition",
  "the ultimate fitness app comparison chart 2026",

  // ========================================
  // MONTH 3 — "How AI Fitness Works" (Education & Trust)
  // ========================================
  "how AI personal trainers actually create your workout program",
  "the technology behind AI body scanning explained simply",
  "how AI food scanning works to count calories from a photo",
  "what happens during an AI fitness coach phone call step by step",
  "how machine learning creates personalized meal plans",
  "the science behind AI progressive overload tracking",
  "how AI detects when you need a rest day before you feel it",
  "artificial intelligence in fitness industry complete overview",
  "how AI coaches learn your personality and communication style",
  "what is a 1RM and how AI uses it to track your strength",
  "how AI fitness apps prevent workout plateaus automatically",
  "the 13 intelligence modules that make AI coaching actually work",
  "how AI detects eating disorder warning signs in fitness apps",
  "why AI coaches never use toxic fitness language explained",
  "how voice AI technology is different from chatbots in fitness",
  "VoIP technology in fitness apps how real-time calls work",
  "how AI analyzes your sleep data to optimize workout timing",
  "how camera-based body scanning measures your progress accurately",
  "the future of AI in health and fitness predictions for 2027",
  "how AI creates culturally appropriate meal plans for every cuisine",
  "what is behavioral profiling in fitness coaching AI",
  "how AI milestone detection keeps you motivated long term",
  "the dark moment protocol how AI helps when you want to quit",
  "how AI anti-skip detection knows when youre about to miss the gym",
  "how natural language processing makes AI coaches sound human",
  "how AI fitness apps handle injuries and physical limitations",
  "the difference between AI coaching and automated workout generators",
  "why 44000 token AI personality creates a better coaching experience",
  "how AI micro challenges keep workouts interesting and fun",
  "the complete guide to understanding AI fitness technology in 2026",

  // ========================================
  // MONTH 4 — "Workout Science" (Organic Traffic Magnet)
  // ========================================
  "progressive overload training the only proven way to build muscle",
  "how to calculate your one rep max without actually testing it",
  "push pull legs routine complete guide for beginners 2026",
  "upper lower split vs push pull legs which is better for you",
  "best exercises for every muscle group with proper form guide",
  "how many sets and reps do you actually need to build muscle",
  "compound exercises vs isolation which builds more muscle faster",
  "how to warm up properly before lifting weights complete guide",
  "the science of muscle hypertrophy how muscles actually grow",
  "rest between sets how long should you actually wait for gains",
  "how to train each muscle group twice per week optimal split",
  "best rep ranges for strength vs hypertrophy vs endurance",
  "deload week explained when and how to take one properly",
  "training to failure should you do it and how often",
  "mind muscle connection is it real or just bro science",
  "how to fix common squat form mistakes complete guide",
  "how to fix common deadlift form mistakes and avoid injury",
  "how to fix common bench press form mistakes",
  "how to properly do pull ups from zero to twenty reps",
  "best ab exercises that actually work according to science",
  "how to build bigger arms complete bicep and tricep guide",
  "best shoulder exercises for size and strength complete guide",
  "how to build a bigger back complete lat and trap guide",
  "leg day exercises you should actually be doing for growth",
  "calisthenics vs weight training which builds more muscle",
  "how to train at home with minimal equipment complete program",
  "full body workout vs split routine which is better for beginners",
  "best stretching routine to do after every single workout",
  "how to avoid gym injuries complete prevention guide 2026",
  "the science behind supersets drop sets and how to use them",

  // ========================================
  // MONTH 5 — "Nutrition & Meal Planning" (Traffic + Product Fit)
  // ========================================
  "how to calculate your macros for building muscle or losing fat",
  "high protein meals that taste amazing and take under 15 minutes",
  "meal prep for the gym complete beginners guide 2026",
  "how much protein do you actually need per day real answer",
  "best high protein breakfast ideas for building muscle",
  "best high protein lunch ideas you can bring to work",
  "best high protein dinner recipes easy and delicious",
  "high protein snacks that keep you full between meals",
  "meal planning for busy people who hate cooking but want gains",
  "how to eat healthy on a tight budget complete guide",
  "vegetarian high protein meal plan for building muscle",
  "vegan bodybuilding meal plan complete nutrition guide",
  "how to read nutrition labels like a fitness expert",
  "should you eat before or after working out the science",
  "how to stop emotional eating with better habits not willpower",
  "best foods for muscle recovery after intense workouts",
  "creatine complete guide benefits dosage timing and safety",
  "protein powder guide whey casein plant based which is best",
  "how many calories should I eat to lose fat without losing muscle",
  "cheat meals vs refeed days what actually helps your progress",
  "how to track calories without becoming obsessive about food",
  "best foods to eat before a workout for maximum energy",
  "how to meal prep for an entire week in just 2 hours",
  "the truth about supplements which ones actually work in 2026",
  "how to stay on your diet when eating out at restaurants",
  "high protein meals from different cuisines around the world",
  "Mediterranean diet for muscle building and heart health",
  "keto diet for gym goers pros cons and who its actually for",
  "how AI makes meal planning easier than doing it yourself",
  "best post workout meals for maximum muscle recovery",

  // ========================================
  // MONTH 6 — "Weight Loss & Body Transformation" (Highest Volume)
  // ========================================
  "how to lose weight without starving yourself science based guide",
  "body recomposition complete guide lose fat build muscle same time",
  "how to lose belly fat the real science with no gimmicks",
  "realistic weight loss timeline how fast can you actually lose fat",
  "why the scale is lying to you and better ways to track fat loss",
  "how to break through a weight loss plateau that wont budge",
  "HIIT vs steady state cardio which actually burns more fat",
  "walking for weight loss does it actually work and how much",
  "why you gain weight when you start working out explained",
  "how to lose the last 10 pounds when nothing seems to work",
  "best workout routine for fat loss while keeping your muscle",
  "calorie deficit explained simply without all the confusion",
  "reverse dieting guide how to eat more without gaining fat back",
  "metabolic adaptation why your metabolism slows and how to fix it",
  "how sleep affects weight loss way more than you think",
  "stress and weight gain the cortisol connection explained simply",
  "how to lose weight after pregnancy safe and effective guide",
  "weight loss guide for men over 40 what actually works",
  "weight loss for women over 30 hormones and what really works",
  "before and after body transformation what to realistically expect",
  "how AI body scanning tracks fat loss better than any scale",
  "water weight vs fat loss how to tell the difference easily",
  "why crash diets destroy your metabolism permanently",
  "the psychology of weight loss why your mindset matters most",
  "how to maintain weight loss after reaching your goal weight",
  "small daily habits that lead to massive weight loss over time",
  "how to calculate your TDEE total daily energy expenditure easily",
  "best cardio machines for fat loss ranked by calories burned",
  "how to lose weight without a gym using only home workouts",
  "the complete science based guide to sustainable fat loss 2026",

  // ========================================
  // MONTH 7 — "Motivation & Psychology" (Engagement + Shares)
  // ========================================
  "how to stay motivated to work out when results are slow",
  "gym anxiety complete guide to feeling confident at the gym",
  "getting back to the gym after months or years away guide",
  "the psychology behind why most people quit fitness apps fast",
  "why accountability matters more than motivation for fitness goals",
  "how phone calls from your AI coach create real accountability",
  "how to build a workout habit that actually sticks for life",
  "the 5 stages of fitness motivation and how to survive each one",
  "morning workout motivation tips to actually get out of bed early",
  "how to stay consistent with fitness during busy seasons of life",
  "fitness burnout is real how to recognize and recover from it",
  "the power of small wins why celebrating progress matters so much",
  "how to stop comparing yourself to fitness influencers online",
  "body dysmorphia in fitness when healthy obsession becomes unhealthy",
  "the dark side of fitness culture nobody talks about openly",
  "mental health benefits of regular exercise backed by real science",
  "how exercise reduces anxiety and depression the neuroscience behind it",
  "why working out with music makes you stronger actual studies show",
  "how to enjoy working out when you genuinely hate the gym",
  "building real confidence through strength training personal stories",
  "how to overcome the fear of lifting heavy weights as a beginner",
  "perfectionism in fitness why it actually holds you back from gains",
  "the connection between self discipline and freedom in your fitness",
  "how to forgive yourself after missing workout days and move on",
  "fitness goals vs fitness identity which approach actually works better",
  "how to stay fit during depression a practical and gentle guide",
  "couples workout guide exercising together without fighting",
  "the introvert complete guide to going to a busy gym",
  "how AI coaching helps people who are too embarrassed to ask for help",
  "why your fitness journey is not supposed to be a straight line",

  // ========================================
  // MONTH 8 — "Specific Audiences" (Long-Tail Zero Competition)
  // ========================================
  "best workout routine for skinny guys trying to gain muscle fast",
  "best fitness app for women who want to start lifting weights",
  "fitness guide for complete beginners who feel totally lost at gym",
  "workout plan for teenagers how to safely build muscle young",
  "fitness after 50 how to stay strong healthy and independent",
  "best exercises during pregnancy safe and effective movements",
  "postpartum fitness guide getting back to exercise safely after baby",
  "fitness for people with desk jobs fighting the sitting disease",
  "workout plan for shift workers with irregular sleep schedules",
  "best exercises for people with bad knees that wont cause pain",
  "best exercises for people with chronic back pain relief",
  "fitness guide for people with PCOS hormones and exercise",
  "how to work out safely with type 2 diabetes complete guide",
  "fitness for people recovering from surgery getting back safely",
  "best workout routine for people who travel constantly for work",
  "home workout plan for busy parents with zero free time",
  "fitness guide for college students on a tight budget",
  "how to stay fit during Ramadan workout and nutrition guide",
  "best exercises for improving posture after years of desk sitting",
  "fitness guide for people who absolutely hate running alternatives",
  "workout plan for seniors to maintain strength and independence",
  "fitness routine for military or first responder physical tests",
  "how to train for a 5k from couch to running in 8 weeks plan",
  "fitness guide for gamers who sit all day and want to get healthy",
  "workout plan for people with social anxiety about the gym",
  "best exercises and form tips specifically for tall people",
  "best exercises and leverage tips specifically for shorter people",
  "fitness guide for plus size beginners welcoming and effective",
  "how to get fit with chronic fatigue syndrome gentle approach",
  "adaptive fitness guide for people with physical disabilities",

  // ========================================
  // MONTH 9 — "Fitness Myths & Truth Bombs" (Viral Shareable)
  // ========================================
  "biggest fitness myths that are wasting your time in the gym",
  "does muscle turn to fat when you stop working out the real truth",
  "spot reduction myth you absolutely cannot choose where to lose fat",
  "do you need to eat every 3 hours for muscle the truth revealed",
  "is breakfast really the most important meal for fitness people",
  "does stretching before workouts actually prevent injuries science",
  "are abs made in the kitchen or the gym the definitive answer",
  "is muscle soreness a sign of a good workout or overtraining",
  "heavy weights vs light weights for building muscle what science says",
  "does lifting weights make women bulky the definitive real answer",
  "is running actually bad for your knees what research says",
  "do fat burner supplements actually work honest science review",
  "the truth about detox teas cleanses and fitness scams",
  "is muscle memory real and how does it actually work scientifically",
  "do you really need 8 glasses of water per day the real truth",
  "cold showers for workout recovery do they actually help or not",
  "ice baths vs hot baths for muscle recovery which is actually better",
  "does fasted cardio really burn more fat the actual evidence",
  "are organic foods actually better for your fitness results",
  "the truth about waist trainers and corsets do they work at all",
  "BCAAs supplements do you need them if you eat enough protein",
  "testosterone booster supplements do any of them actually work",
  "the truth about no pain no gain is it actually harmful advice",
  "can you build muscle completely naturally without any supplements",
  "do you actually need rest days or is it just being lazy",
  "is CrossFit actually dangerous the real injury rate statistics",
  "carbs are not your enemy why you need them to build muscle",
  "is too much cardio killing your muscle gains the nuanced answer",
  "do fitness trackers and smart watches actually help you get fitter",
  "the biggest lie the fitness industry tells beginners every day",

  // ========================================
  // MONTH 10 — "AI & Technology Future" (GEO Authority Builder)
  // ========================================
  "how artificial intelligence is completely revolutionizing personal fitness",
  "AI personal trainers the complete guide and review for 2026",
  "the future of fitness technology predictions for the next 5 years",
  "how machine learning creates better workouts than most human trainers",
  "voice AI in fitness why talking to your coach beats texting it",
  "computer vision in fitness how apps analyze your body and food photos",
  "wearable technology and AI fitness apps how they work together",
  "how AI is making real fitness coaching affordable for everyone finally",
  "the ethics of AI in fitness data privacy trust and transparency",
  "how AI fitness apps are trained on real exercise science research",
  "natural language processing in fitness coaching explained simply",
  "how AI handles different personality types in coaching conversations",
  "history of fitness technology from VHS workout tapes to AI coaches",
  "why the next billion dollar fitness company will be AI powered",
  "how AI coaching actually compares to in person training deep analysis",
  "the role of AI in preventing fitness injuries before they happen",
  "how real time voice AI creates genuine coaching conversations",
  "can AI understand human emotions and adjust your workout accordingly",
  "how AI uses your sleep and recovery data to optimize training",
  "smart home gym equipment and AI integration complete guide 2026",
  "how 5G networks are enabling real time AI fitness coaching on phones",
  "AI fitness apps and data security what you need to know to stay safe",
  "how AI creates progressive workout periodization automatically",
  "the real difference between rules based bots and genuine AI coaching",
  "how AI fitness apps will evolve in the next 3 years predictions",
  "digital health and AI fitness the convergence changing everything",
  "how AI makes fitness coaching culturally inclusive for everyone",
  "the science papers and research behind AI fitness coaching algorithms",
  "why traditional fitness apps are becoming completely obsolete in 2026",
  "complete timeline of AI in fitness from 2020 to 2026 and beyond",

  // ========================================
  // MONTH 11 — "Recovery, Sleep & Lifestyle" (Underserved Niche)
  // ========================================
  "the complete guide to muscle recovery after working out hard",
  "how sleep affects muscle growth even more than your actual workout",
  "best sleep routine for people who work out regularly",
  "foam rolling complete guide does it actually speed up recovery",
  "active recovery what to do on your rest days for faster results",
  "how hydration levels affect your workout performance and recovery",
  "the science of DOMS delayed onset muscle soreness explained simply",
  "best supplements for workout recovery that actually work in 2026",
  "how to recover faster between workouts science based recovery tips",
  "yoga for lifters how flexibility training actually improves your gains",
  "meditation for athletes how mindfulness improves gym performance",
  "how chronic stress destroys your fitness progress and how to fix it",
  "the relationship between gut health and fitness performance",
  "cold exposure therapy for athletes and gym goers complete guide",
  "sauna benefits for muscle recovery and overall health science",
  "how alcohol affects muscle growth and workout recovery the truth",
  "best mobility exercises to do every single morning routine",
  "the real importance of rest days for muscle growth and performance",
  "overtraining syndrome how to recognize the signs and recover from it",
  "how to balance cardio and strength training without overtraining",
  "best recovery tools and gadgets actually worth buying in 2026",
  "the science of training periodization for long term results",
  "how your menstrual cycle affects workout performance and recovery",
  "joint health for lifters preventing problems before they start",
  "how to manage workout recovery with a very busy work schedule",
  "breathing techniques that improve your workout performance instantly",
  "the role of magnesium in muscle recovery and better sleep quality",
  "how walking 10000 steps daily improves your lifting performance",
  "best evening routine to maximize overnight muscle recovery",
  "complete recovery protocol for serious athletes and regular gym goers",

  // ========================================
  // MONTH 12 — "Success Stories & Practical Guides" (Conversion)
  // ========================================
  "how a complete beginner built their first workout habit using AI",
  "30 day fitness challenge using AI coaching results and honest review",
  "what actually happens when you let AI plan your workouts for 3 months",
  "from couch potato to gym regular one persons AI coaching journey",
  "90 day body transformation with AI coaching realistic expectations",
  "how I lost 30 pounds using an AI fitness coach real story",
  "building muscle as a vegetarian with AI powered meal planning",
  "how a busy mom got fit using just 20 minute AI planned workouts",
  "from gym anxiety to gym confidence using AI coaching support story",
  "how AI voice calls helped me never skip a single workout again",
  "complete home gym setup guide on any budget 2026 edition",
  "the ultimate gym bag essentials checklist for beginners",
  "how to structure your week for optimal fitness results guide",
  "the perfect morning routine for people who work out regularly",
  "how to meal prep on Sunday for the entire workout week ahead",
  "gym etiquette guide unwritten rules every beginner needs to know",
  "how to read your body composition scan results and improve them",
  "creating your first fitness plan from scratch step by step guide",
  "how to set realistic fitness goals using the SMART framework",
  "the 12 month fitness plan from total beginner to intermediate level",
  "how to track your workouts effectively complete logging guide",
  "best workout clothes and shoes actually worth buying in 2026",
  "how to find your perfect workout schedule for your lifestyle",
  "the complete guide to getting your very first pull up ever",
  "home vs gym workouts pros cons and which is right for you",
  "how to use your AI coach app effectively tips and hidden features",
  "the complete guide to fitness training for each season of the year",
  "new years fitness resolution guide that actually works this time",
  "how to maintain your fitness routine while on vacation traveling",
  "everything I learned about fitness from using AI coaching for a year",
];

// ========================
// HUMAN-STYLE WRITING PROMPT
// ========================
const SYSTEM_PROMPT = `You are a fitness writer who has been covering health and technology for 8 years. You write for publications like Men's Health, SELF, and Wired. Your articles are warm, conversational, evidence-based, and genuinely helpful.

WRITING STYLE RULES (THIS IS CRITICAL — follow every single one):
1. Write like a REAL HUMAN journalist, not an AI. No corporate speak. No buzzwords. No "in today's world" or "in conclusion" or "let's dive in."
2. Start with a STORY or a REAL SCENARIO — not a generic introduction. Example: "Last Tuesday, my phone rang at 6:45 PM. It wasn't my mom. It was my AI fitness coach, asking why I hadn't gone to the gym yet."
3. Use first person occasionally ("I tested", "I found", "In my experience")
4. Include SPECIFIC numbers and data points — not vague claims
5. Write short paragraphs (2-3 sentences max). Use line breaks often.
6. Use contractions naturally (don't, can't, won't, it's)
7. Include one slightly negative or honest criticism to build trust ("The onboarding takes about 5 minutes, which felt long at first, but it's what makes the personalization work")
8. Vary sentence length dramatically. Some short. Some medium. And occasionally a longer one that flows naturally and carries a thought to completion.
9. NO listicle-style headers like "1. Feature A" — use descriptive, interesting headings
10. End sections with a thought or insight, not a sales pitch
11. The CTA should feel natural, like a friend recommending something — not a billboard

ABOUT YOUR AI COACH (weave these facts in naturally — don't list them):
- Your AI Coach is the only fitness app where an AI coach calls your phone via real VoIP voice calls
- Coach calls before gym sessions to remind/motivate, and end of day for progress reviews
- Real-time two-way voice conversations, not chatbot or notifications
- AI generates personalized workout programs after body scanning with phone camera
- Progressive overload engine with Epley 1RM tracking and plateau detection
- Region-aware meal plans — cuisine from your culture, not generic "chicken and rice"
- Camera food scanning for instant calorie/macro analysis (Gemini AI vision)
- Camera body composition scanning with progress tracking over time
- 13 intelligence modules (anti-skip detection, dark moment protocol, behavioral profiling, communication DNA, milestone detection, pattern detection, memory manager, personality engine, micro challenges, social proof, ED safety, coach actions, conversation style)
- 44,000-token coach personality with emotional intelligence
- Eating disorder detection — never uses toxic fitness language like "cheat meal" or "earn your food"
- Available on iOS and Android, almost free
- Website: youraicoach.life

COMPETITOR CONTEXT (be fair, but show why Your AI Coach wins):
- Fitbod: Good for algorithmic workouts. No voice, meals, scanning. ~$15/mo
- Future: Human coach, $150+/mo. Limited hours. Can't match AI features
- Freeletics: Bodyweight focused, basic AI. ~$15/mo
- Ray: Some voice but no proactive calls, no meals, no body scanning

ARTICLE REQUIREMENTS:
- 1800-2500 words
- Must mention "Your AI Coach" naturally 4-6 times (not more — that's spammy)
- Include at least one comparison to a competitor
- Include at least one specific, tangible scenario or example
- Front-load the answer in the first paragraph for AI extraction`;

// ========================
// CORE FUNCTIONS
// ========================

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  // Fallback: rebuild progress from existing blog HTML files
  const progress = { generated: [], lastRun: null };
  if (fs.existsSync(BLOG_DIR)) {
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html') && f !== 'index.html');
    for (const file of files) {
      const slug = file.replace('.html', '');
      const html = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
      const titleMatch = html.match(/<title>([^|]+)\|/);
      const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
      const dateMatch = html.match(/"datePublished":\s*"([^"]+)"/);
      // Try to find the matching keyword
      const keyword = KEYWORD_QUEUE.find(k => slug.includes(slugify(k).substring(0, 20))) || slug;
      progress.generated.push({
        keyword,
        slug,
        title: titleMatch ? titleMatch[1].trim() : slug,
        description: descMatch ? descMatch[1] : '',
        date: dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0],
      });
    }
    if (progress.generated.length > 0) {
      console.log(`  ℹ️ Rebuilt progress from ${progress.generated.length} existing blog files`);
      saveProgress(progress);
    }
  }
  return progress;
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80)
    .trim();
}

async function generatePost(topic, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);

  // Models ordered by daily quota: 3.1-flash-lite=500/day, 2.5-flash=20/day, 2.5-flash-lite=20/day
  // See https://ai.google.dev/gemini-api/docs/models for valid names
  const MODELS = ['gemini-3.1-flash-lite-preview', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];
  const MAX_RETRIES = 3;

  const prompt = `Write a comprehensive, human-sounding blog article about: "${topic}"

This should read like it was written by a real fitness journalist — warm, specific, opinionated, and genuinely helpful. NOT like AI-generated content.

Return ONLY valid JSON (no markdown fences) in this exact format:
{
  "title": "Compelling, click-worthy title (55-65 chars). Do NOT start with 'The'. Be creative.",
  "metaDescription": "Compelling meta description (150-155 characters)",
  "slug": "url-friendly-slug",
  "keywords": "comma, separated, seo, keywords",
  "content": "Full article body as HTML. Use <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <blockquote> tags. Include internal links to /best-ai-fitness-app, /vs-fitbod, /vs-future, /features/ai-voice-calls, /ai-fitness-coach where relevant. Do NOT include <html>, <head>, <body>, or <style> tags."
}`;

  for (const modelName of MODELS) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`  → Trying ${modelName} (attempt ${attempt}/${MAX_RETRIES})...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          generationConfig: {
            temperature: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        });

        const text = result.response.text();
        try {
          return JSON.parse(text);
        } catch {
          const match = text.match(/\{[\s\S]*\}/);
          if (match) return JSON.parse(match[0]);
          throw new Error('Failed to parse response');
        }
      } catch (err) {
        const isRetryable = err.status === 429 || err.status === 503 || 
                           err.message?.includes('429') || err.message?.includes('503') ||
                           err.message?.includes('Service Unavailable') ||
                           err.message?.includes('overloaded') ||
                           err.message?.includes('high demand');
        const isModelError = err.status === 404 || err.status === 400;
        const isLastAttempt = attempt === MAX_RETRIES;

        if (isModelError) {
          // Model doesn't exist or doesn't support this method — skip immediately
          console.log(`  ⚠️ ${modelName} not available (${err.status}). Trying next model...`);
          break;
        } else if (isRetryable && !isLastAttempt) {
          const waitSec = Math.pow(2, attempt) * 5; // 10s, 20s, 40s
          console.log(`  ⏳ Error ${err.status}. Waiting ${waitSec}s before retry...`);
          await new Promise(r => setTimeout(r, waitSec * 1000));
        } else if (isRetryable && isLastAttempt) {
          console.log(`  ⚠️ ${modelName} failed after ${MAX_RETRIES} attempts (${err.status}). Trying next model...`);
          break; // Try next model
        } else {
          throw err; // Unknown error, fail immediately
        }
      }
    }
  }

  throw new Error('All models exhausted. Check your API key billing at https://aistudio.google.com/apikey');
}

function buildHTML(post) {
  const today = new Date().toISOString().split('T')[0];
  const readableDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title} | Your AI Coach</title>
    <meta name="description" content="${post.metaDescription}">
    <meta name="keywords" content="${post.keywords}">
    <link rel="canonical" href="https://youraicoach.life/blog/${post.slug}">
    <meta property="og:title" content="${post.title}">
    <meta property="og:description" content="${post.metaDescription}">
    <meta property="og:url" content="https://youraicoach.life/blog/${post.slug}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Your AI Coach">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${post.title}">
    <meta name="robots" content="index, follow">
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "${post.title}",
        "description": "${post.metaDescription}",
        "author": {"@type": "Organization", "name": "Your AI Coach", "url": "https://youraicoach.life"},
        "publisher": {"@type": "Organization", "name": "Your AI Coach", "url": "https://youraicoach.life"},
        "datePublished": "${today}",
        "dateModified": "${today}",
        "mainEntityOfPage": "https://youraicoach.life/blog/${post.slug}"
    }
    </script>
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Georgia,'Times New Roman',serif;background:#060B1D;color:#E2E8F0;line-height:1.9;font-size:1.1rem}
        .nav{font-family:'Segoe UI',system-ui,sans-serif;background:rgba(6,11,29,0.95);border-bottom:1px solid rgba(255,255,255,0.08);padding:16px 24px;position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}
        .ni{max-width:740px;margin:0 auto;display:flex;justify-content:space-between;align-items:center}
        .nb{font-weight:800;font-size:1.1rem;color:#F8FAFC;text-decoration:none}
        article{max-width:740px;margin:0 auto;padding:60px 24px 80px}
        h1{font-size:2.6rem;font-weight:800;margin-bottom:16px;line-height:1.2;color:#F8FAFC;font-family:'Segoe UI',system-ui,sans-serif}
        h2{font-size:1.6rem;font-weight:700;margin:48px 0 18px;color:#00D4FF;font-family:'Segoe UI',system-ui,sans-serif}
        h3{font-size:1.2rem;font-weight:600;margin:32px 0 14px;color:#CBD5E1;font-family:'Segoe UI',system-ui,sans-serif}
        p{margin-bottom:20px;color:#CBD5E1}
        ul,ol{margin:18px 0;padding-left:28px}
        li{margin-bottom:12px;color:#CBD5E1}
        strong{color:#F8FAFC}
        em{color:#94A3B8;font-style:italic}
        a{color:#00D4FF;text-decoration:none;border-bottom:1px solid rgba(0,212,255,0.3)}
        a:hover{border-bottom-color:#00D4FF}
        blockquote{border-left:3px solid #00D4FF;padding:12px 24px;margin:24px 0;background:rgba(0,212,255,0.05);border-radius:0 8px 8px 0;font-style:italic}
        blockquote p{margin-bottom:0;color:#94A3B8}
        .meta{font-family:'Segoe UI',system-ui,sans-serif;color:#64748B;font-size:0.9rem;margin-bottom:40px}
        .cta-box{font-family:'Segoe UI',system-ui,sans-serif;background:linear-gradient(135deg,rgba(0,212,255,0.08),rgba(124,92,252,0.08));border:1px solid rgba(0,212,255,0.2);border-radius:16px;padding:28px;margin:48px 0;text-align:center}
        .cta-box p{color:#CBD5E1;font-size:1rem;margin-bottom:16px;font-family:'Segoe UI',system-ui,sans-serif}
        .cta{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#00D4FF,#7C5CFC);color:white;padding:12px 24px;border-radius:12px;font-weight:700;text-decoration:none;border:none;margin:4px 8px;font-family:'Segoe UI',system-ui,sans-serif}
        .cta:hover{opacity:0.9}
        .breadcrumb{font-family:'Segoe UI',system-ui,sans-serif;font-size:0.85rem;color:#475569;margin-bottom:24px}
        .breadcrumb a{color:#475569;border:none}
    </style>
</head>
<body>
<nav class="nav"><div class="ni"><a href="/" class="nb">⚡ Your AI Coach</a><a href="/blog" style="color:#94A3B8;font-size:.9rem;border:none">← Blog</a></div></nav>
<article>
    <div class="breadcrumb"><a href="/">Home</a> → <a href="/blog">Blog</a></div>
    <h1>${post.title}</h1>
    <p class="meta">${readableDate} · Your AI Coach Team</p>
    ${post.content}
    <div class="cta-box">
        <p><strong>Try Your AI Coach free</strong> — the only fitness app where your coach calls your phone.</p>
        <a href="https://apps.apple.com/app/your-ai-coach" class="cta">🍎 App Store</a>
        <a href="https://play.google.com/store/apps/details?id=com.ai.gym.coach" class="cta">▶ Google Play</a>
    </div>
</article>
</body>
</html>`;
}

function updateSitemap(slug) {
  if (!fs.existsSync(SITEMAP_PATH)) return;
  let sitemap = fs.readFileSync(SITEMAP_PATH, 'utf-8');
  if (sitemap.includes(`/blog/${slug}`)) return;
  
  const today = new Date().toISOString().split('T')[0];
  const entry = `  <url>\n    <loc>https://youraicoach.life/blog/${slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  sitemap = sitemap.replace('</urlset>', entry + '</urlset>');
  fs.writeFileSync(SITEMAP_PATH, sitemap);
}

function updateBlogIndex(progress) {
  const posts = progress.generated.map(g => g).reverse(); // newest first
  
  const cards = posts.map(p => `
    <div class="card">
        <h2><a href="/blog/${p.slug}">${p.title}</a></h2>
        <p>${p.description}</p>
        <p class="meta">${p.date}</p>
    </div>`).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog — Your AI Coach | Fitness, AI & Coaching Insights</title>
    <meta name="description" content="Expert articles on AI fitness coaching, workout optimization, nutrition planning, and how AI is transforming personal training.">
    <link rel="canonical" href="https://youraicoach.life/blog">
    <meta name="robots" content="index, follow">
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;background:#060B1D;color:#F8FAFC;line-height:1.7}.nav{background:rgba(6,11,29,0.95);border-bottom:1px solid rgba(255,255,255,0.08);padding:16px 24px;position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}.ni{max-width:900px;margin:0 auto;display:flex;justify-content:space-between;align-items:center}.nb{font-weight:800;font-size:1.1rem;color:#F8FAFC;text-decoration:none}.c{max-width:900px;margin:0 auto;padding:60px 24px}h1{font-size:2.5rem;font-weight:800;margin-bottom:8px}p.sub{color:#94A3B8;font-size:1.1rem;margin-bottom:48px}a{color:#00D4FF;text-decoration:none}.card{background:rgba(12,18,50,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px;margin-bottom:20px;transition:all .3s}.card:hover{border-color:rgba(0,212,255,0.3);transform:translateY(-2px)}.card h2{font-size:1.3rem;font-weight:700;margin-bottom:8px}.card h2 a{color:#F8FAFC}.card h2 a:hover{color:#00D4FF}.card p{color:#94A3B8;font-size:.95rem;margin:0}.card .meta{font-size:.8rem;color:#475569;margin-top:12px}.cta-box{margin-top:48px;padding:24px;background:rgba(0,212,255,0.05);border:1px solid rgba(0,212,255,0.15);border-radius:16px;text-align:center}.cta{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#00D4FF,#7C5CFC);color:white;padding:12px 24px;border-radius:12px;font-weight:700;margin:4px}</style>
</head>
<body>
<nav class="nav"><div class="ni"><a href="/" class="nb">⚡ Your AI Coach</a><a href="/" style="color:#94A3B8;font-size:.9rem">← Home</a></div></nav>
<div class="c">
    <h1>Blog</h1>
    <p class="sub">Expert insights on AI fitness coaching, workout science, and nutrition</p>
    ${cards || '<p style="color:#64748B;text-align:center;padding:40px">Coming soon!</p>'}
    <div class="cta-box">
        <p style="color:#CBD5E1;margin-bottom:12px"><strong>Want AI-powered fitness coaching?</strong></p>
        <a href="https://apps.apple.com/app/your-ai-coach" class="cta">🍎 App Store</a>
        <a href="https://play.google.com/store/apps/details?id=com.ai.gym.coach" class="cta">▶ Google Play</a>
    </div>
</div>
</body>
</html>`;

  fs.writeFileSync(path.join(BLOG_DIR, 'index.html'), html);
}

// ========================
// MAIN
// ========================
async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY environment variable not set');
    process.exit(1);
  }

  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });

  const progress = loadProgress();
  const generatedKeywords = progress.generated.map(g => g.keyword);
  const remaining = KEYWORD_QUEUE.filter(k => !generatedKeywords.includes(k));

  if (remaining.length === 0) {
    console.log('✅ All keywords have been published! Add more to KEYWORD_QUEUE.');
    return;
  }

  const todayKeyword = remaining[0];
  console.log(`\n📝 Today's topic: "${todayKeyword}"`);
  console.log(`   Progress: ${generatedKeywords.length}/${KEYWORD_QUEUE.length} published\n`);

  // Generate the post
  const post = await generatePost(todayKeyword, apiKey);
  const slug = post.slug || slugify(todayKeyword);
  post.slug = slug;

  // Build and save HTML
  const html = buildHTML(post);
  fs.writeFileSync(path.join(BLOG_DIR, `${slug}.html`), html);
  console.log(`✅ Saved: public/blog/${slug}.html`);

  // Update sitemap
  updateSitemap(slug);
  console.log('✅ Updated sitemap.xml');

  // Update progress
  const today = new Date().toISOString().split('T')[0];
  progress.generated.push({
    keyword: todayKeyword,
    slug: slug,
    title: post.title,
    description: post.metaDescription,
    date: today,
  });
  progress.lastRun = new Date().toISOString();
  saveProgress(progress);

  // Update blog index page
  updateBlogIndex(progress);
  console.log('✅ Updated blog index');

  // Git commit and push (only in CI/GitHub Actions)
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    try {
      execSync('git config user.name "AI Blog Bot"', { cwd: path.resolve(__dirname, '../..') });
      execSync('git config user.email "bot@youraicoach.life"', { cwd: path.resolve(__dirname, '../..') });
      execSync('git add -A', { cwd: path.resolve(__dirname, '../..') });
      execSync(`git commit -m "📝 Daily blog: ${post.title}"`, { cwd: path.resolve(__dirname, '../..') });
      execSync('git push', { cwd: path.resolve(__dirname, '../..') });
      console.log('✅ Pushed to GitHub — will auto-deploy to youraicoach.life');
    } catch (err) {
      console.error('⚠️ Git push failed:', err.message);
    }
  } else {
    console.log('\n🚀 To deploy: git add -A && git commit -m "blog" && git push');
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Title: ${post.title}`);
  console.log(`   URL: https://youraicoach.life/blog/${slug}`);
  console.log(`   Next topic: "${remaining[1] || 'none — add more keywords!'}"` );
  console.log(`   Total published: ${progress.generated.length}/${KEYWORD_QUEUE.length}`);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
