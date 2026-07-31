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

const SYSTEM_PROMPT = `You are an AI drafting assistant for IZEM. Create a clear, fair comparison landing-page draft under the accountability of IZEM founder and publisher Mohammed Jebbari. Do not impersonate a human reviewer or invent testing, experience, credentials, sources, or outcomes.

YOUR GOAL: Explain why IZEM is a better fit for users who want a premium AI personal trainer, not a passive tracker. Highlight proactive voice calls, daily reviews, adaptive weekly workout and meal planning, food scanning, body progress scanning, gym equipment scanning, and accountability.

RULES:
1. Mention IZEM's approximate $24.99/month premium plan when relevant, and position the annual plan as best value. You can mention competitor pricing only when it is broadly known or clearly framed as approximate.
2. Write raw, styled HTML. Only return the inner contents of a <div class="container"> wrapper. Do NOT return <html>, <head>, or <body> tags.
3. Use modern, highly-readable semantic HTML with <h2>, <h3>, <p>, <ul>, and <table> tags.
4. Include a Comparison Table (<table>) as the very first section. It MUST include rows for: "Proactive Voice Calls", "Daily Progress Reviews", "Body Progress Scanning", "Gym Equipment Scanning", "Practical Personalized Meal Plans", "Weekly Adaptive Coaching", and "Progressive Overload Support".
5. Use a persuasive but fair tone. Acknowledge what the competitor does well before explaining where IZEM is stronger.
6. End with a clear Call to Action based only on verified public download destinations supplied in the prompt. If no verified store destination is supplied, direct the reader to the IZEM website instead.
7. Do not invent statistics, awards, user counts, accuracy claims, clinical claims, or fake tests.
8. Return ONLY valid JSON in this exact format:
{
  "title": "IZEM vs [Competitor]: Which is Better in 2026?",
  "metaDescription": "Detailed comparison between IZEM and [Competitor]...",
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

  const prompt = `Create a high-converting comparison landing page for "IZEM" vs "${nextCompetitor}". Make sure to highlight why our weekly adaptive coaching and real voice calls make us the better choice.`;

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
    <title>${data.title} | IZEM</title>
    <meta name="description" content="${data.metaDescription}">
    <link rel="canonical" href="https://youraicoach.life/${slug}/">
    <meta property="og:title" content="${data.title}">
    <meta property="og:url" content="https://youraicoach.life/${slug}/">
    <meta property="og:type" content="website">
    <meta name="robots" content="index, follow">
    <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"WebPage","name":${JSON.stringify(data.title)},"url":"https://youraicoach.life/${slug}/","author":{"@type":"Organization","name":"IZEM Editorial","url":"https://youraicoach.life/editorial-policy.html"},"publisher":{"@type":"Organization","name":"IZEM","url":"https://youraicoach.life"},"accountablePerson":{"@type":"Person","name":"Mohammed Jebbari","url":"https://youraicoach.life/about"}}
    </script>
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
<nav class="nav"><div class="ni"><a href="/" class="nb">⚡ IZEM</a><a href="/" style="color:#94A3B8;font-size:.9rem;text-decoration:none">Back to Home</a></div></nav>
<div class="container">
    <p style="color:#94A3B8;font-size:.9rem;margin-bottom:24px">Published by <a href="/about" style="color:#00D4FF">Mohammed Jebbari</a>, IZEM founder · <a href="/editorial-policy.html" style="color:#00D4FF">AI-assisted draft and comparison policy</a></p>
    ${data.html}
    
    <div class="cta-box">
        <h3>Ready to upgrade your coaching?</h3>
        <p style="margin-bottom:24px">See how IZEM combines adaptive planning, nutrition context, and proactive call accountability.</p>
        <a href="/izem-ai-fitness-coach/" class="cta">Explore IZEM</a>
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
