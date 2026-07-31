/**
 * City Pages Generator — Creates "Best AI Fitness App in [City]" pages.
 * Programmatic SEO targeting location-based searches.
 * Each city page has unique content, local gym references, and city-specific schema.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../../public');
const CITY_DIR = path.join(PUBLIC_DIR, 'best-ai-fitness-app');

const CITIES = [
  { city: "New York", country: "USA", emoji: "🗽", gyms: "Equinox, Planet Fitness, Blink Fitness", culture: "NYC makes consistency hard. Between early workdays, crowded gyms, and long commutes, IZEM helps users keep structure with proactive calls, day reviews, and weekly plan adaptation." },
  { city: "Los Angeles", country: "USA", emoji: "🌴", gyms: "Gold's Gym Venice, Equinox, Barry's Bootcamp", culture: "LA is where fitness meets lifestyle. From Muscle Beach to hiking Runyon Canyon, Angelenos treat working out as a social event. IZEM brings that personal trainer experience to your phone." },
  { city: "London", country: "UK", emoji: "🇬🇧", gyms: "PureGym, Virgin Active, The Gym Group", culture: "London's fitness scene has exploded — from Shoreditch boutique studios to Canary Wharf lunch break HIIT. IZEM gives you the personal trainer experience without the £80/hour London price tag." },
  { city: "Dubai", country: "UAE", emoji: "🏙️", gyms: "Fitness First, GymNation, Warehouse Gym", culture: "Dubai's fitness culture is demanding. From air-conditioned mega-gyms in summer to outdoor bootcamps in winter, IZEM helps users keep a plan that adapts to schedule, equipment, meals, and consistency." },
  { city: "Tokyo", country: "Japan", emoji: "🗼", gyms: "Anytime Fitness, RIZAP, Gold's Gym Japan", culture: "Tokyo's fitness scene values discipline and consistency — the kaizen approach. Space-efficient workouts and precise nutrition tracking align perfectly with how IZEM operates." },
  { city: "Sydney", country: "Australia", emoji: "🦘", gyms: "Fitness First, Anytime Fitness, F45 Training", culture: "Sydneysiders love outdoor fitness — Bondi to Bronte runs, ocean pools, and sunrise bootcamps. IZEM adds the structured programming that turns casual fitness into real results." },
  { city: "Toronto", country: "Canada", emoji: "🍁", gyms: "GoodLife Fitness, Equinox, YMCA", culture: "Toronto's multicultural fitness scene ranges from Kensington Market yoga studios to downtown powerlifting gyms. IZEM adapts to your style with region-aware meal plans that match your cuisine preferences." },
  { city: "São Paulo", country: "Brazil", emoji: "🇧🇷", gyms: "Bodytech, Smart Fit, Bio Ritmo", culture: "Paulistanos take training seriously, from CrossFit boxes to weekend sports. IZEM brings AI accountability, meal planning, and weekly adaptation at around $24.99/month." },
  { city: "Mumbai", country: "India", emoji: "🇮🇳", gyms: "Cult.fit, Gold's Gym, Talwalkars", culture: "Mumbai's fitness revolution is real — from Bandra boutique studios to Andheri mega-gyms. IZEM handles vegetarian-friendly meal planning and adapts workouts to crowded gym conditions." },
  { city: "Berlin", country: "Germany", emoji: "🇩🇪", gyms: "McFit, FitX, John Reed", culture: "Berlin's fitness culture is no-nonsense and data-driven. From Kreuzberg calisthenics parks to Mitte premium gyms, Berliners want efficient, science-backed training — exactly what IZEM delivers." },
  { city: "Paris", country: "France", emoji: "🇫🇷", gyms: "CMG Sports Club, Neoness, Basic-Fit", culture: "Parisians are embracing fitness like never before — from CrossFit in the Marais to HIIT studios near the Champs-Élysées. IZEM provides the structure of a coach without the premium Parisian prices." },
  { city: "Singapore", country: "Singapore", emoji: "🇸🇬", gyms: "Fitness First, Anytime Fitness, Virgin Active", culture: "Singapore's compact lifestyle demands efficient workouts. With limited space and high gym membership costs, IZEM maximizes every minute of your training with AI-optimized programs." },
  { city: "Mexico City", country: "Mexico", emoji: "🇲🇽", gyms: "Smart Fit, Sports World, Bodytech", culture: "CDMX's fitness scene is booming — from Polanco boutique gyms to Coyoacán outdoor parks. IZEM adapts to the local lifestyle with flexible scheduling and cuisine-aware meal planning." },
  { city: "Istanbul", country: "Turkey", emoji: "🇹🇷", gyms: "MAC, Mars Athletic, Gold's Gym", culture: "Istanbul bridges East and West — and its fitness culture does too. From Kadıköy CrossFit boxes to Beşiktaş bodybuilding gyms, IZEM provides the accountability Turkish gym-goers crave." },
  { city: "Jakarta", country: "Indonesia", emoji: "🇮🇩", gyms: "Celebrity Fitness, Gold's Gym, Fitness First", culture: "Jakarta's traffic makes gym consistency hard — but IZEM calls you to keep you accountable. Home workout programs are optimized for the space you have available." },
  { city: "Seoul", country: "South Korea", emoji: "🇰🇷", gyms: "Anytime Fitness, Spoany, World Gym", culture: "Seoul's fitness culture is tech-forward and aesthetic-focused. IZEM's body progress scanning and progress tracking align perfectly with Korean fitness values." },
  { city: "Bangkok", country: "Thailand", emoji: "🇹🇭", gyms: "Fitness First, Jetts, Virgin Active", culture: "Bangkok's fitness scene ranges from Muay Thai camps to luxury Sukhumvit gyms. IZEM adapts to the heat with smart workout timing and hydration-aware coaching." },
  { city: "Casablanca", country: "Morocco", emoji: "🇲🇦", gyms: "City Club, Gold's Gym, Fitness Park", culture: "Casablanca's gym culture is growing fast. From Maarif fitness centers to Ain Diab outdoor training, IZEM brings world-class coaching to Morocco — in Arabic, French, or English." },
  { city: "Cairo", country: "Egypt", emoji: "🇪🇬", gyms: "Gold's Gym, Samia Allouba, Smart Gym", culture: "Cairo's fitness community is passionate and growing. From Zamalek to New Cairo, gyms are packed with dedicated lifters. IZEM handles Ramadan training schedules and local cuisine meal plans." },
  { city: "Riyadh", country: "Saudi Arabia", emoji: "🇸🇦", gyms: "Fitness Time, Leejam Sports, NuYu", culture: "Saudi Arabia's Vision 2030 has ignited a fitness revolution. IZEM aligns with this momentum — providing world-class coaching with cultural sensitivity and prayer-time-aware scheduling." },
];

function buildCityPage(city) {
  const today = new Date().toISOString().split('T')[0];
  const slug = city.city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z-]/g, '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Best AI Fitness App in ${city.city} (2026) — IZEM</title>
    <meta name="description" content="Looking for an AI fitness app in ${city.city}? IZEM is a premium AI personal trainer with calls, workout and meal plans, scans, and weekly adaptation.">
    <link rel="canonical" href="https://youraicoach.life/best-ai-fitness-app/${slug}">
    <meta name="robots" content="index, follow">
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Best AI Fitness App in ${city.city} (2026)",
        "description": "Complete guide to using AI fitness coaching in ${city.city}, ${city.country}",
        "author": {"@type": "Organization", "name": "IZEM"},
        "datePublished": "${today}",
        "dateModified": "${today}"
    }
    </script>
    <style>
        *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;background:#060B1D;color:#E2E8F0;line-height:1.8}
        .nav{background:rgba(6,11,29,0.95);border-bottom:1px solid rgba(255,255,255,0.08);padding:16px 24px;position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}
        .ni{max-width:740px;margin:0 auto;display:flex;justify-content:space-between;align-items:center}
        .nb{font-weight:800;font-size:1.1rem;color:#F8FAFC;text-decoration:none}
        article{max-width:740px;margin:0 auto;padding:60px 24px 80px}
        h1{font-size:2.4rem;font-weight:800;margin-bottom:16px;color:#F8FAFC}
        h2{font-size:1.5rem;font-weight:700;margin:40px 0 16px;color:#00D4FF}
        p{margin-bottom:18px;color:#CBD5E1;font-size:1.05rem}
        ul{margin:16px 0;padding-left:28px}li{margin-bottom:10px;color:#CBD5E1}
        strong{color:#F8FAFC}
        .hero-emoji{font-size:3rem;margin-bottom:16px;display:block}
        .gym-list{padding:20px;background:rgba(12,18,50,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin:20px 0}
        .gym-list h3{color:#00D4FF;margin-bottom:8px;font-size:1rem}
        .cta-box{margin-top:40px;padding:24px;background:rgba(0,212,255,0.05);border:1px solid rgba(0,212,255,0.15);border-radius:16px;text-align:center}
        .cta{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#00D4FF,#7C5CFC);color:white;padding:12px 24px;border-radius:12px;font-weight:700;text-decoration:none;margin:4px}
        a{color:#00D4FF;text-decoration:none}
    </style>
</head>
<body>
<nav class="nav"><div class="ni"><a href="/" class="nb">⚡ IZEM</a><a href="/blog/" style="color:#94A3B8;font-size:.9rem">Blog</a></div></nav>
<article>
    <span class="hero-emoji">${city.emoji}</span>
    <h1>Best AI Fitness App in ${city.city}</h1>
    <p>${city.culture}</p>

    <h2>Why ${city.city} Needs AI Fitness Coaching</h2>
    <p>Human personal training in major cities can get expensive quickly. IZEM is positioned differently: a premium AI personal trainer at around $24.99/month that can call you, review your day, and adapt your workout and meal plan every week.</p>
    <ul>
        <li>🏋️ <strong>Personalized workouts</strong> around goals, schedule, level, recovery, and equipment</li>
        <li>📞 <strong>Voice calls</strong> for reminders, check-ins, and day reviews</li>
        <li>🍽️ <strong>Practical meal plans</strong> that fit real preferences, schedule, and lifestyle</li>
        <li>📸 <strong>Food, body progress, and gym equipment scans</strong> for better coaching context</li>
        <li>🔄 <strong>Weekly adaptation</strong> when workouts, meals, or consistency change</li>
    </ul>

    <div class="gym-list">
        <h3>Popular Gyms in ${city.city}</h3>
        <p style="margin:0;color:#94A3B8;font-size:.9rem">IZEM works with any gym: ${city.gyms}. The app generates programs based on the equipment you have available.</p>
    </div>

    <h2>IZEM vs Personal Trainers in ${city.city}</h2>
    <p>A human trainer can be excellent, especially for in-person form coaching and live judgment. IZEM is built for a different need: affordable structure, follow-up, meal support, scan context, and a plan that adapts when real life changes.</p>
    <p>The more useful context your coach has, the better the weekly adjustments can become. Your coach sees more, so your plan gets smarter.</p>

    <h2>Get IZEM in ${city.city}</h2>
    <p>IZEM is available worldwide — including ${city.city}, ${city.country}. Download IZEM and start with a premium AI coach built around accountability.</p>

    <div class="cta-box">
        <p style="color:#CBD5E1;margin-bottom:12px"><strong>Try IZEM premium in ${city.city}</strong></p>
        <a href="/izem-ai-fitness-coach/" class="cta">Explore IZEM</a>
    </div>
</article>
</body>
</html>`;
}

function buildCityIndex() {
  const cards = CITIES.map(c => {
    const slug = c.city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z-]/g, '');
    return `<a href="/best-ai-fitness-app/${slug}" class="city-card"><span class="city-emoji">${c.emoji}</span><h3>${c.city}</h3><p>${c.country}</p></a>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Best AI Fitness App by City (2026) — Available in 20+ Cities Worldwide</title>
    <meta name="description" content="Find the best AI fitness app in your city. IZEM is available worldwide with personalized workouts, meal plans, and voice coaching.">
    <link rel="canonical" href="https://youraicoach.life/best-ai-fitness-app">
    <meta name="robots" content="index, follow">
    <style>
        *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;background:#060B1D;color:#E2E8F0;line-height:1.7}.nav{background:rgba(6,11,29,0.95);border-bottom:1px solid rgba(255,255,255,0.08);padding:16px 24px;position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}.ni{max-width:900px;margin:0 auto;display:flex;justify-content:space-between;align-items:center}.nb{font-weight:800;font-size:1.1rem;color:#F8FAFC;text-decoration:none}.c{max-width:900px;margin:0 auto;padding:48px 24px}h1{font-size:2.4rem;font-weight:800;margin-bottom:8px;color:#F8FAFC}.sub{color:#94A3B8;margin-bottom:40px;font-size:1.05rem}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px}.city-card{display:flex;flex-direction:column;align-items:center;background:rgba(12,18,50,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px 16px;text-decoration:none;transition:all .3s;text-align:center}.city-card:hover{border-color:rgba(0,212,255,0.3);transform:translateY(-2px)}.city-emoji{font-size:2rem;margin-bottom:8px}.city-card h3{color:#F8FAFC;font-size:1rem;margin-bottom:4px}.city-card p{color:#64748B;font-size:.8rem;margin:0}
    </style>
</head>
<body>
<nav class="nav"><div class="ni"><a href="/" class="nb">⚡ IZEM</a><a href="/blog/" style="color:#94A3B8;font-size:.9rem;text-decoration:none">Blog</a></div></nav>
<div class="c">
    <h1>Best AI Fitness App by City</h1>
    <p class="sub">IZEM is available in ${CITIES.length}+ cities worldwide. Find your city below.</p>
    <div class="grid">${cards}</div>
</div>
</body>
</html>`;
}

// Generate all pages
if (!fs.existsSync(CITY_DIR)) fs.mkdirSync(CITY_DIR, { recursive: true });

for (const city of CITIES) {
  const slug = city.city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z-]/g, '');
  fs.writeFileSync(path.join(CITY_DIR, `${slug}.html`), buildCityPage(city));
}
fs.writeFileSync(path.join(CITY_DIR, 'index.html'), buildCityIndex());

// Update sitemap
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
if (fs.existsSync(SITEMAP_PATH)) {
  let sitemap = fs.readFileSync(SITEMAP_PATH, 'utf-8');
  const today = new Date().toISOString().split('T')[0];
  const cityUrls = CITIES.map(c => {
    const slug = c.city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z-]/g, '');
    return `  <url><loc>https://youraicoach.life/best-ai-fitness-app/${slug}</loc><lastmod>${today}</lastmod><priority>0.7</priority></url>`;
  }).join('\n');
  const indexUrl = `  <url><loc>https://youraicoach.life/best-ai-fitness-app</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>`;
  for (const entry of [indexUrl, ...cityUrls.split('\n')]) {
    const loc = entry.match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (loc && !sitemap.includes(`<loc>${loc}</loc>`)) {
      sitemap = sitemap.replace('</urlset>', `${entry}\n</urlset>`);
    }
  }
  fs.writeFileSync(SITEMAP_PATH, sitemap);
}

console.log(`✅ Generated ${CITIES.length} city pages + index`);
console.log(`✅ Updated sitemap.xml`);
