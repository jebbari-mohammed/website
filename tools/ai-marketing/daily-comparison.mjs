import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../../public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
const PROGRESS_FILE = path.join(__dirname, '.comparison-progress.json');

// Ensure dotenv is loaded if API key not in env
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '.env') });

const COMPETITORS = [
  "myfitnesspal",
  "strong",
  "hevy",
  "noom",
  "peloton",
  "apple-fitness-plus",
  "nike-training-club",
  "sweat",
  "jefit",
  "caliber"
];

const SYSTEM_PROMPT = `You are an elite direct-response copywriter and technical SEO expert. Your job is to create high-converting, "David vs Goliath" comparison landing pages for 'Your AI Coach' against major fitness apps.

YOUR GOAL: Prove logically and emotionally why 'Your AI Coach' is superior, specifically highlighting its unique VoIP voice calls, AI intelligence, and personalized approach. 

RULES:
1. Do NOT mention specific pricing for Your AI Coach (we use a Freemium model). You can mention the competitor's high pricing if applicable (e.g., $150/mo for human coaches).
2. Write raw, styled HTML. Only return the inner contents of a <div class="container"> wrapper. Do NOT return <html>, <head>, or <body> tags.
3. Use modern, highly-readable semantic HTML with <h2>, <h3>, <p>, <ul>, and <table> tags.
4. Include a Comparison Table (<table>) as the very first section. It MUST include rows for: "Real-time VoIP Voice Coaching", "Camera Body Scanning", "Custom Region Meal Plans", "Intelligence Modules (13 vs 0)", and "Progressive Overload Tracking".
5. Use a highly persuasive tone. Address the user's pain points directly (e.g., "Tired of generic workout plans?", "Do notifications actually motivate you? No.").
6. End with a strong Call to Action section directing them to the App Store and Google Play.
7. Return ONLY valid JSON in this exact format:
{
  "title": "Your AI Coach vs [Competitor]: Which is Better in 2026?",
  "metaDescription": "Detailed comparison between Your AI Coach and [Competitor]...",
  "html": "raw html content here"
}`;

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return { generated: [] };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function updateSitemap(slug) {
  if (!fs.existsSync(SITEMAP_PATH)) return;
  let sitemap = fs.readFileSync(SITEMAP_PATH, 'utf-8');
  const url = `https://youraicoach.life/${slug}`;
  if (sitemap.includes(url)) return;
  
  const today = new Date().toISOString().split('T')[0];
  const entry = `  <url>\n    <loc>${url}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  sitemap = sitemap.replace('</urlset>', entry + '</urlset>');
  fs.writeFileSync(SITEMAP_PATH, sitemap);
}

async function generateComparisonPage() {
  const progress = loadProgress();
  const nextCompetitor = COMPETITORS.find(c => !progress.generated.includes(c));
  
  if (!nextCompetitor) {
    console.log("✅ All competitors generated.");
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing");

  console.log(`🤖 Generating landing page for vs-${nextCompetitor}...`);
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });

  const prompt = `Create a high-converting comparison landing page for "Your AI Coach" vs "${nextCompetitor}". Make sure to highlight why our 13 AI intelligence modules and real voice calls make us the better choice.`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    generationConfig: {
      temperature: 0.8,
      responseMimeType: 'application/json',
    },
  });

  const responseText = result.response.text();
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    const match = responseText.match(/\\{[\\s\\S]*\\}/);
    if (match) data = JSON.parse(match[0]);
    else throw new Error("Failed to parse JSON");
  }

  const slug = `vs-${nextCompetitor}`;
  const dirPath = path.join(PUBLIC_DIR, slug);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

  const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title} | Your AI Coach</title>
    <meta name="description" content="${data.metaDescription}">
    <link rel="canonical" href="https://youraicoach.life/${slug}/">
    <meta property="og:title" content="${data.title}">
    <meta property="og:url" content="https://youraicoach.life/${slug}/">
    <meta property="og:type" content="website">
    <meta name="robots" content="index, follow">
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Segoe UI',system-ui,sans-serif;background:#060B1D;color:#E2E8F0;line-height:1.7}
        .nav{background:rgba(6,11,29,0.95);border-bottom:1px solid rgba(255,255,255,0.08);padding:16px 24px;position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}
        .ni{max-width:900px;margin:0 auto;display:flex;justify-content:space-between;align-items:center}
        .nb{font-weight:800;font-size:1.1rem;color:#F8FAFC;text-decoration:none}
        .container{max-width:800px;margin:0 auto;padding:60px 24px}
        h1{font-size:2.8rem;font-weight:800;margin-bottom:16px;color:#F8FAFC;line-height:1.2}
        h2{font-size:1.8rem;font-weight:700;margin:48px 0 20px;color:#00D4FF}
        h3{font-size:1.4rem;font-weight:600;margin:32px 0 16px;color:#F8FAFC}
        p{margin-bottom:20px;color:#94A3B8;font-size:1.1rem}
        ul{margin-bottom:24px;padding-left:24px;color:#94A3B8}
        li{margin-bottom:10px}
        table{width:100%;border-collapse:collapse;margin:40px 0;background:rgba(12,18,50,0.4);border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)}
        th{background:rgba(0,212,255,0.1);color:#00D4FF;padding:16px;text-align:left;font-weight:700}
        td{padding:16px;border-top:1px solid rgba(255,255,255,0.05);color:#F8FAFC}
        tr:hover td{background:rgba(255,255,255,0.02)}
        td:first-child{font-weight:600;color:#CBD5E1}
        .cta-box{margin-top:60px;padding:40px;background:linear-gradient(135deg,rgba(0,212,255,0.08),rgba(124,92,252,0.08));border:1px solid rgba(0,212,255,0.2);border-radius:24px;text-align:center}
        .cta-box h3{margin-top:0;font-size:1.8rem}
        .cta{display:inline-flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#00D4FF,#7C5CFC);color:white;padding:16px 32px;border-radius:12px;font-weight:700;text-decoration:none;font-size:1.1rem;margin:8px;transition:opacity .3s}
        .cta:hover{opacity:0.9}
        @media(max-width:600px){h1{font-size:2.2rem}th,td{padding:12px}}
    </style>
</head>
<body>
<nav class="nav"><div class="ni"><a href="/" class="nb">⚡ Your AI Coach</a><a href="/" style="color:#94A3B8;font-size:.9rem;text-decoration:none">Back to Home</a></div></nav>
<div class="container">
    ${data.html}
    
    <div class="cta-box">
        <h3>Ready to upgrade your coaching?</h3>
        <p style="margin-bottom:24px">Join thousands of users who switched to Your AI Coach and finally started seeing consistent results.</p>
        <a href="https://apps.apple.com/app/your-ai-coach" class="cta">🍎 Download on App Store</a>
        <a href="https://play.google.com/store/apps/details?id=com.ai.gym.coach" class="cta">▶ Get it on Google Play</a>
    </div>
</div>
</body>
</html>`;

  fs.writeFileSync(path.join(dirPath, 'index.html'), fullHTML);
  updateSitemap(`${slug}/`);
  
  progress.generated.push(nextCompetitor);
  saveProgress(progress);
  console.log(`✅ Successfully generated and saved ${slug}`);
}

generateComparisonPage().catch(console.error);
