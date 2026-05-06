/**
 * Glossary Generator — Creates SEO-optimized glossary pages for fitness terms.
 * Each term becomes its own page: /glossary/progressive-overload, /glossary/tdee, etc.
 * These pages rank extremely well for "what is [term]" searches and get cited by AI.
 * Run once to generate all pages, then add to sitemap.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../../public');
const GLOSSARY_DIR = path.join(PUBLIC_DIR, 'glossary');

const TERMS = [
  { term: "Progressive Overload", slug: "progressive-overload", definition: "The gradual increase of stress placed on the body during exercise training. This is the #1 principle behind muscle growth — you must consistently increase weight, reps, or volume over time to force adaptation.", related: ["1rm", "hypertrophy", "periodization"] },
  { term: "1RM (One Rep Max)", slug: "1rm", definition: "The maximum amount of weight you can lift for a single repetition with proper form. It's used to calculate training percentages and track strength progress. The Epley formula estimates it: 1RM = Weight × (1 + Reps/30).", related: ["progressive-overload", "epley-formula", "strength-training"] },
  { term: "TDEE", slug: "tdee", definition: "Total Daily Energy Expenditure — the total number of calories your body burns per day including your BMR, physical activity, and the thermic effect of food. Your TDEE determines whether you gain, lose, or maintain weight.", related: ["bmr", "calorie-deficit", "macros"] },
  { term: "BMR (Basal Metabolic Rate)", slug: "bmr", definition: "The number of calories your body burns at complete rest just to keep you alive — breathing, heartbeat, brain function. BMR typically accounts for 60-70% of your TDEE.", related: ["tdee", "calorie-deficit", "metabolism"] },
  { term: "Hypertrophy", slug: "hypertrophy", definition: "The increase in muscle cell size as a response to resistance training. Typically achieved through training in the 6-12 rep range with moderate to heavy loads and adequate protein intake.", related: ["progressive-overload", "rep-ranges", "muscle-protein-synthesis"] },
  { term: "Calorie Deficit", slug: "calorie-deficit", definition: "Consuming fewer calories than your body burns (TDEE), forcing it to use stored energy (fat) for fuel. A deficit of 500 calories/day results in approximately 0.5kg of fat loss per week.", related: ["tdee", "fat-loss", "reverse-dieting"] },
  { term: "Macros (Macronutrients)", slug: "macros", definition: "The three main nutrients your body needs in large amounts: protein (4 cal/g), carbohydrates (4 cal/g), and fat (9 cal/g). Tracking macros gives you more control than just counting total calories.", related: ["protein", "tdee", "calorie-deficit"] },
  { term: "Protein Synthesis", slug: "muscle-protein-synthesis", definition: "The biological process where your body builds new muscle protein to repair and grow muscle fibers damaged during training. It's elevated for 24-48 hours after a workout, which is why protein timing and distribution matter.", related: ["protein", "hypertrophy", "recovery"] },
  { term: "Compound Exercises", slug: "compound-exercises", definition: "Exercises that work multiple muscle groups and joints simultaneously — like squats, deadlifts, bench press, and pull-ups. They're more time-efficient and trigger greater hormonal responses than isolation exercises.", related: ["isolation-exercises", "strength-training", "progressive-overload"] },
  { term: "Isolation Exercises", slug: "isolation-exercises", definition: "Exercises that target a single muscle group through one joint — like bicep curls, leg extensions, and lateral raises. They're used to bring up lagging muscle groups after compound movements.", related: ["compound-exercises", "hypertrophy", "rep-ranges"] },
  { term: "Rep Ranges", slug: "rep-ranges", definition: "The number of repetitions performed in a set, which determines the primary training adaptation: 1-5 reps for strength, 6-12 reps for hypertrophy (muscle size), and 12-20+ reps for muscular endurance.", related: ["hypertrophy", "progressive-overload", "1rm"] },
  { term: "Deload Week", slug: "deload", definition: "A planned week of reduced training volume and/or intensity (typically 40-60% reduction) to allow your body to fully recover and prevent overtraining. Usually programmed every 4-8 weeks.", related: ["periodization", "overtraining", "recovery"] },
  { term: "Periodization", slug: "periodization", definition: "The systematic planning of training into phases (mesocycles) that vary volume, intensity, and exercise selection over time to maximize long-term progress and prevent plateaus.", related: ["progressive-overload", "deload", "training-volume"] },
  { term: "Training Volume", slug: "training-volume", definition: "The total amount of work performed — calculated as sets × reps × weight. Research shows 10-20 hard sets per muscle group per week is optimal for most people.", related: ["progressive-overload", "hypertrophy", "periodization"] },
  { term: "Mind-Muscle Connection", slug: "mind-muscle-connection", definition: "The conscious focus on contracting and feeling a specific muscle during an exercise. Research shows it can increase muscle activation by up to 20%, especially for isolation movements.", related: ["hypertrophy", "isolation-exercises", "rep-ranges"] },
  { term: "DOMS (Delayed Onset Muscle Soreness)", slug: "doms", definition: "The muscle pain and stiffness that appears 24-72 hours after intense or unfamiliar exercise. It's caused by micro-tears in muscle fibers and is NOT a reliable indicator of workout quality.", related: ["recovery", "overtraining", "muscle-protein-synthesis"] },
  { term: "Overtraining Syndrome", slug: "overtraining", definition: "A condition where excessive training without adequate recovery leads to decreased performance, chronic fatigue, mood changes, and increased injury risk. Prevention requires proper sleep, nutrition, and deload weeks.", related: ["deload", "recovery", "training-volume"] },
  { term: "Body Recomposition", slug: "body-recomposition", definition: "The process of simultaneously losing fat and building muscle. It's most effective for beginners, people returning after a break, or those with higher body fat percentages. Requires eating at maintenance calories with high protein.", related: ["calorie-deficit", "protein", "hypertrophy"] },
  { term: "Reverse Dieting", slug: "reverse-dieting", definition: "The strategic, gradual increase of calories (50-100 cal/week) after a cutting phase to restore metabolic rate while minimizing fat regain. It helps prevent the rapid weight rebound that occurs after aggressive diets.", related: ["calorie-deficit", "tdee", "metabolism"] },
  { term: "Metabolic Adaptation", slug: "metabolism", definition: "Your body's natural response to prolonged calorie restriction — it becomes more efficient and burns fewer calories. This is why weight loss stalls and why reverse dieting and diet breaks are important strategies.", related: ["reverse-dieting", "tdee", "calorie-deficit"] },
  { term: "Epley Formula", slug: "epley-formula", definition: "A mathematical formula used to estimate your one-rep max: 1RM = Weight × (1 + Reps/30). It's the industry standard used by apps like Your AI Coach to track strength progress without dangerous maximal testing.", related: ["1rm", "progressive-overload", "strength-training"] },
  { term: "Strength Training", slug: "strength-training", definition: "Any exercise that uses resistance to build muscular strength, size, and endurance. Includes free weights, machines, bodyweight exercises, and resistance bands. The foundation of any effective fitness program.", related: ["progressive-overload", "compound-exercises", "hypertrophy"] },
  { term: "Recovery", slug: "recovery", definition: "The process of rest, nutrition, and sleep that allows your body to repair muscle damage and adapt to training stress. Muscle growth happens during recovery, not during the workout itself.", related: ["doms", "deload", "overtraining"] },
  { term: "Fat Loss", slug: "fat-loss", definition: "The reduction of body fat through a sustained calorie deficit combined with resistance training and adequate protein intake. Differs from 'weight loss' because the goal is preserving muscle while losing only fat.", related: ["calorie-deficit", "body-recomposition", "tdee"] },
  { term: "Protein", slug: "protein", definition: "An essential macronutrient made of amino acids that builds and repairs muscle tissue. For muscle building, research recommends 1.6-2.2g per kg of bodyweight daily, spread across 3-5 meals.", related: ["macros", "muscle-protein-synthesis", "protein"] },
  { term: "Superset", slug: "superset", definition: "Performing two exercises back-to-back with no rest in between. Can target the same muscle (compound set) or opposing muscles (antagonist superset). Increases workout efficiency and metabolic demand.", related: ["training-volume", "hypertrophy", "compound-exercises"] },
  { term: "Drop Set", slug: "drop-set", definition: "A technique where you perform a set to failure, immediately reduce the weight by 20-30%, and continue for more reps. Effective for pushing muscles past their normal fatigue point and stimulating additional growth.", related: ["hypertrophy", "training-volume", "progressive-overload"] },
  { term: "RPE (Rate of Perceived Exertion)", slug: "rpe", definition: "A self-reported scale (typically 1-10) measuring how hard a set felt. RPE 7 = could do 3 more reps, RPE 8 = 2 more, RPE 9 = 1 more, RPE 10 = failure. Used to auto-regulate training intensity.", related: ["progressive-overload", "1rm", "training-volume"] },
  { term: "Time Under Tension", slug: "time-under-tension", definition: "The total duration a muscle is under strain during a set. Slowing down the eccentric (lowering) phase to 3-4 seconds can increase muscle activation and hypertrophy stimulus.", related: ["hypertrophy", "rep-ranges", "mind-muscle-connection"] },
  { term: "Intermittent Fasting", slug: "intermittent-fasting", definition: "An eating pattern that cycles between periods of eating and fasting. The most popular protocol is 16:8 (16 hours fasting, 8 hours eating). It's a tool for calorie control, not magic — the deficit still matters.", related: ["calorie-deficit", "fat-loss", "tdee"] },
];

function buildGlossaryPage(item) {
  const today = new Date().toISOString().split('T')[0];
  const relatedLinks = item.related
    .map(r => { const found = TERMS.find(t => t.slug === r); return found ? `<a href="/glossary/${r}">${found.term}</a>` : null; })
    .filter(Boolean).join(' · ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${item.term} — What It Is & Why It Matters | Your AI Coach Glossary</title>
    <meta name="description" content="${item.definition.substring(0, 155)}">
    <link rel="canonical" href="https://youraicoach.life/glossary/${item.slug}">
    <meta name="robots" content="index, follow">
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        "name": "${item.term}",
        "description": "${item.definition.replace(/"/g, '\\"')}",
        "url": "https://youraicoach.life/glossary/${item.slug}",
        "inDefinedTermSet": {"@type": "DefinedTermSet", "name": "Fitness Glossary", "url": "https://youraicoach.life/glossary"}
    }
    </script>
    <style>
        *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;background:#060B1D;color:#E2E8F0;line-height:1.8}.nav{background:rgba(6,11,29,0.95);border-bottom:1px solid rgba(255,255,255,0.08);padding:16px 24px;position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}.ni{max-width:700px;margin:0 auto;display:flex;justify-content:space-between;align-items:center}.nb{font-weight:800;font-size:1.1rem;color:#F8FAFC;text-decoration:none}article{max-width:700px;margin:0 auto;padding:60px 24px 80px}.breadcrumb{font-size:.85rem;color:#475569;margin-bottom:24px}.breadcrumb a{color:#475569;text-decoration:none}h1{font-size:2.2rem;font-weight:800;margin-bottom:24px;color:#F8FAFC}p{margin-bottom:20px;color:#CBD5E1;font-size:1.1rem}.def-box{padding:24px;background:rgba(0,212,255,0.06);border:1px solid rgba(0,212,255,0.2);border-radius:16px;margin:24px 0;font-size:1.15rem;line-height:1.9}.related{margin-top:40px;padding:20px;background:rgba(12,18,50,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:12px}.related h3{color:#00D4FF;margin-bottom:12px;font-size:1rem}.related a{color:#00D4FF;text-decoration:none;border-bottom:1px solid rgba(0,212,255,0.3)}.cta-box{margin-top:40px;padding:24px;background:rgba(0,212,255,0.05);border:1px solid rgba(0,212,255,0.15);border-radius:16px;text-align:center}.cta{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#00D4FF,#7C5CFC);color:white;padding:12px 24px;border-radius:12px;font-weight:700;text-decoration:none;margin:4px}
    </style>
</head>
<body>
<nav class="nav"><div class="ni"><a href="/" class="nb">⚡ Your AI Coach</a><a href="/glossary" style="color:#94A3B8;font-size:.9rem;text-decoration:none">← Glossary</a></div></nav>
<article>
    <div class="breadcrumb"><a href="/">Home</a> → <a href="/glossary">Glossary</a> → ${item.term}</div>
    <h1>${item.term}</h1>
    <div class="def-box"><p style="margin:0"><strong style="color:#00D4FF">Definition:</strong> ${item.definition}</p></div>
    <h2 style="color:#00D4FF;font-size:1.3rem;margin:32px 0 16px">Why It Matters</h2>
    <p>Understanding ${item.term.toLowerCase()} is essential for making real progress in your fitness journey. Without this knowledge, you risk spinning your wheels — training hard but not seeing the results you deserve.</p>
    <p>Your AI Coach automatically tracks and applies ${item.term.toLowerCase()} principles to your training program, so you don't need to be an exercise scientist to benefit from evidence-based programming.</p>
    ${relatedLinks ? `<div class="related"><h3>📚 Related Terms</h3><p>${relatedLinks}</p></div>` : ''}
    <div class="cta-box">
        <p style="color:#CBD5E1;margin-bottom:12px"><strong>Your AI Coach applies these principles automatically.</strong></p>
        <a href="https://apps.apple.com/app/your-ai-coach" class="cta">🍎 App Store</a>
        <a href="https://play.google.com/store/apps/details?id=com.ai.gym.coach" class="cta">▶ Google Play</a>
    </div>
</article>
</body>
</html>`;
}

function buildGlossaryIndex() {
  const cards = TERMS.map(t => `<a href="/glossary/${t.slug}" class="term-card"><h3>${t.term}</h3><p>${t.definition.substring(0, 100)}...</p></a>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fitness Glossary — 30+ Terms Explained Simply | Your AI Coach</title>
    <meta name="description" content="Complete fitness glossary: progressive overload, TDEE, 1RM, macros, hypertrophy, and 25+ more terms explained in simple language.">
    <link rel="canonical" href="https://youraicoach.life/glossary">
    <meta name="robots" content="index, follow">
    <style>
        *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;background:#060B1D;color:#E2E8F0;line-height:1.7}.nav{background:rgba(6,11,29,0.95);border-bottom:1px solid rgba(255,255,255,0.08);padding:16px 24px;position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}.ni{max-width:900px;margin:0 auto;display:flex;justify-content:space-between;align-items:center}.nb{font-weight:800;font-size:1.1rem;color:#F8FAFC;text-decoration:none}.c{max-width:900px;margin:0 auto;padding:48px 24px}h1{font-size:2.4rem;font-weight:800;margin-bottom:8px;color:#F8FAFC}.sub{color:#94A3B8;margin-bottom:40px;font-size:1.05rem}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}.term-card{display:block;background:rgba(12,18,50,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;text-decoration:none;transition:all .3s}.term-card:hover{border-color:rgba(0,212,255,0.3);transform:translateY(-2px)}.term-card h3{color:#00D4FF;font-size:1.1rem;margin-bottom:8px}.term-card p{color:#94A3B8;font-size:.85rem;margin:0;line-height:1.5}
    </style>
</head>
<body>
<nav class="nav"><div class="ni"><a href="/" class="nb">⚡ Your AI Coach</a><a href="/blog" style="color:#94A3B8;font-size:.9rem;text-decoration:none">Blog</a></div></nav>
<div class="c">
    <h1>Fitness Glossary</h1>
    <p class="sub">${TERMS.length} essential fitness terms explained simply — no jargon, no BS.</p>
    <div class="grid">${cards}</div>
</div>
</body>
</html>`;
}

// Generate all pages
if (!fs.existsSync(GLOSSARY_DIR)) fs.mkdirSync(GLOSSARY_DIR, { recursive: true });

for (const term of TERMS) {
  fs.writeFileSync(path.join(GLOSSARY_DIR, `${term.slug}.html`), buildGlossaryPage(term));
}
fs.writeFileSync(path.join(GLOSSARY_DIR, 'index.html'), buildGlossaryIndex());

// Update sitemap
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
if (fs.existsSync(SITEMAP_PATH)) {
  let sitemap = fs.readFileSync(SITEMAP_PATH, 'utf-8');
  const today = new Date().toISOString().split('T')[0];
  const glossaryUrls = TERMS.map(t => `  <url><loc>https://youraicoach.life/glossary/${t.slug}</loc><lastmod>${today}</lastmod><priority>0.7</priority></url>`).join('\n');
  const toolsUrl = `  <url><loc>https://youraicoach.life/tools</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>`;
  const glossaryIndexUrl = `  <url><loc>https://youraicoach.life/glossary</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>`;
  sitemap = sitemap.replace('</urlset>', `${glossaryIndexUrl}\n${toolsUrl}\n${glossaryUrls}\n</urlset>`);
  fs.writeFileSync(SITEMAP_PATH, sitemap);
}

console.log(`✅ Generated ${TERMS.length} glossary pages + index`);
console.log(`✅ Generated /tools calculator page`);
console.log(`✅ Updated sitemap.xml`);
