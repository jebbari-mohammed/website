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
  { city: "New York", country: "USA", emoji: "🗽", gyms: "Equinox, Planet Fitness, Blink Fitness", culture: "NYC never sleeps and neither should your fitness routine. Between Wall Street hustlers squeezing in 5 AM sessions and Brooklyn yogis finding balance, this city runs on ambition — and Your AI Coach matches that energy with 24/7 voice coaching." },
  { city: "Los Angeles", country: "USA", emoji: "🌴", gyms: "Gold's Gym Venice, Equinox, Barry's Bootcamp", culture: "LA is where fitness meets lifestyle. From Muscle Beach to hiking Runyon Canyon, Angelenos treat working out as a social event. Your AI Coach brings that personal trainer experience to your phone." },
  { city: "London", country: "UK", emoji: "🇬🇧", gyms: "PureGym, Virgin Active, The Gym Group", culture: "London's fitness scene has exploded — from Shoreditch boutique studios to Canary Wharf lunch break HIIT. Your AI Coach gives you the personal trainer experience without the £80/hour London price tag." },
  { city: "Dubai", country: "UAE", emoji: "🏙️", gyms: "Fitness First, GymNation, Warehouse Gym", culture: "Dubai's fitness culture is world-class. From training in air-conditioned mega-gyms during summer to outdoor bootcamps in winter, the city demands excellence — and Your AI Coach delivers." },
  { city: "Tokyo", country: "Japan", emoji: "🗼", gyms: "Anytime Fitness, RIZAP, Gold's Gym Japan", culture: "Tokyo's fitness scene values discipline and consistency — the kaizen approach. Space-efficient workouts and precise nutrition tracking align perfectly with how Your AI Coach operates." },
  { city: "Sydney", country: "Australia", emoji: "🦘", gyms: "Fitness First, Anytime Fitness, F45 Training", culture: "Sydneysiders love outdoor fitness — Bondi to Bronte runs, ocean pools, and sunrise bootcamps. Your AI Coach adds the structured programming that turns casual fitness into real results." },
  { city: "Toronto", country: "Canada", emoji: "🍁", gyms: "GoodLife Fitness, Equinox, YMCA", culture: "Toronto's multicultural fitness scene ranges from Kensington Market yoga studios to downtown powerlifting gyms. Your AI Coach adapts to your style with region-aware meal plans that match your cuisine preferences." },
  { city: "São Paulo", country: "Brazil", emoji: "🇧🇷", gyms: "Bodytech, Smart Fit, Bio Ritmo", culture: "Brazil is the world's #2 fitness market. Paulistanos take their training seriously — from CrossFit boxes to beach volleyball. Your AI Coach brings the accountability of a personal trainer at a fraction of the cost." },
  { city: "Mumbai", country: "India", emoji: "🇮🇳", gyms: "Cult.fit, Gold's Gym, Talwalkars", culture: "Mumbai's fitness revolution is real — from Bandra boutique studios to Andheri mega-gyms. Your AI Coach handles vegetarian-friendly meal planning and adapts workouts to crowded gym conditions." },
  { city: "Berlin", country: "Germany", emoji: "🇩🇪", gyms: "McFit, FitX, John Reed", culture: "Berlin's fitness culture is no-nonsense and data-driven. From Kreuzberg calisthenics parks to Mitte premium gyms, Berliners want efficient, science-backed training — exactly what Your AI Coach delivers." },
  { city: "Paris", country: "France", emoji: "🇫🇷", gyms: "CMG Sports Club, Neoness, Basic-Fit", culture: "Parisians are embracing fitness like never before — from CrossFit in the Marais to HIIT studios near the Champs-Élysées. Your AI Coach provides the structure of a coach without the premium Parisian prices." },
  { city: "Singapore", country: "Singapore", emoji: "🇸🇬", gyms: "Fitness First, Anytime Fitness, Virgin Active", culture: "Singapore's compact lifestyle demands efficient workouts. With limited space and high gym membership costs, Your AI Coach maximizes every minute of your training with AI-optimized programs." },
  { city: "Mexico City", country: "Mexico", emoji: "🇲🇽", gyms: "Smart Fit, Sports World, Bodytech", culture: "CDMX's fitness scene is booming — from Polanco boutique gyms to Coyoacán outdoor parks. Your AI Coach adapts to the local lifestyle with flexible scheduling and cuisine-aware meal planning." },
  { city: "Istanbul", country: "Turkey", emoji: "🇹🇷", gyms: "MAC, Mars Athletic, Gold's Gym", culture: "Istanbul bridges East and West — and its fitness culture does too. From Kadıköy CrossFit boxes to Beşiktaş bodybuilding gyms, Your AI Coach provides the accountability Turkish gym-goers crave." },
  { city: "Jakarta", country: "Indonesia", emoji: "🇮🇩", gyms: "Celebrity Fitness, Gold's Gym, Fitness First", culture: "Jakarta's traffic makes gym consistency hard — but Your AI Coach calls you to keep you accountable. Home workout programs are optimized for the space you have available." },
  { city: "Seoul", country: "South Korea", emoji: "🇰🇷", gyms: "Anytime Fitness, Spoany, World Gym", culture: "Seoul's fitness culture is tech-forward and aesthetic-focused. Your AI Coach's body scanning and progress tracking align perfectly with Korean fitness values." },
  { city: "Bangkok", country: "Thailand", emoji: "🇹🇭", gyms: "Fitness First, Jetts, Virgin Active", culture: "Bangkok's fitness scene ranges from Muay Thai camps to luxury Sukhumvit gyms. Your AI Coach adapts to the heat with smart workout timing and hydration-aware coaching." },
  { city: "Casablanca", country: "Morocco", emoji: "🇲🇦", gyms: "City Club, Gold's Gym, Fitness Park", culture: "Casablanca's gym culture is growing fast. From Maarif fitness centers to Ain Diab outdoor training, Your AI Coach brings world-class coaching to Morocco — in Arabic, French, or English." },
  { city: "Cairo", country: "Egypt", emoji: "🇪🇬", gyms: "Gold's Gym, Samia Allouba, Smart Gym", culture: "Cairo's fitness community is passionate and growing. From Zamalek to New Cairo, gyms are packed with dedicated lifters. Your AI Coach handles Ramadan training schedules and local cuisine meal plans." },
  { city: "Riyadh", country: "Saudi Arabia", emoji: "🇸🇦", gyms: "Fitness Time, Leejam Sports, NuYu", culture: "Saudi Arabia's Vision 2030 has ignited a fitness revolution. Your AI Coach aligns with this momentum — providing world-class coaching with cultural sensitivity and prayer-time-aware scheduling." },
];

function buildCityPage(city) {
  const today = new Date().toISOString().split('T')[0];
  const slug = city.city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z-]/g, '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Best AI Fitness App in ${city.city} (2026) — Your AI Coach</title>
    <meta name="description" content="Looking for the best AI fitness app in ${city.city}? Your AI Coach provides personalized workouts, meal plans, and voice coaching. Better than ${city.gyms.split(',')[0]} personal trainers.">
    <link rel="canonical" href="https://youraicoach.life/best-ai-fitness-app/${slug}">
    <meta name="robots" content="index, follow">
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Best AI Fitness App in ${city.city} (2026)",
        "description": "Complete guide to using AI fitness coaching in ${city.city}, ${city.country}",
        "author": {"@type": "Organization", "name": "Your AI Coach"},
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
<nav class="nav"><div class="ni"><a href="/" class="nb">⚡ Your AI Coach</a><a href="/blog" style="color:#94A3B8;font-size:.9rem">Blog</a></div></nav>
<article>
    <span class="hero-emoji">${city.emoji}</span>
    <h1>Best AI Fitness App in ${city.city}</h1>
    <p>${city.culture}</p>

    <h2>Why ${city.city} Needs AI Fitness Coaching</h2>
    <p>Personal trainers in ${city.city} charge anywhere from $50-150 per session. That's $200-600/month for just 4 sessions. Your AI Coach provides <strong>24/7 personalized coaching for a fraction of the cost</strong> — and it actually calls your phone to keep you accountable.</p>
    <ul>
        <li>🏋️ <strong>Personalized workouts</strong> that adapt to any gym in ${city.city}</li>
        <li>📞 <strong>Voice calls</strong> — your AI coach literally calls your phone before gym sessions</li>
        <li>🍽️ <strong>Meal plans</strong> that match ${city.country} cuisine preferences</li>
        <li>📸 <strong>Body scanning</strong> — track your progress with just your phone camera</li>
        <li>🔄 <strong>Progressive overload</strong> tracked automatically — no spreadsheets needed</li>
    </ul>

    <div class="gym-list">
        <h3>Popular Gyms in ${city.city}</h3>
        <p style="margin:0;color:#94A3B8;font-size:.9rem">Your AI Coach works with any gym: ${city.gyms}. The app generates programs based on the equipment you have available.</p>
    </div>

    <h2>Your AI Coach vs Personal Trainers in ${city.city}</h2>
    <p>A human personal trainer sees you 2-4 times per week for 45-60 minutes. Your AI Coach is available <strong>24 hours a day, 7 days a week</strong>. It tracks your nutrition, adjusts your program based on recovery, and calls you when you're about to skip a session.</p>
    <p>The best part? It gets smarter over time. The more you train, the better it understands your strengths, weaknesses, and preferences. No human trainer can process that much data.</p>

    <h2>Download Free in ${city.city}</h2>
    <p>Your AI Coach is available worldwide — including ${city.city}, ${city.country}. Download free and start your first AI-coached workout today.</p>

    <div class="cta-box">
        <p style="color:#CBD5E1;margin-bottom:12px"><strong>Try Your AI Coach free in ${city.city}</strong></p>
        <a href="https://apps.apple.com/app/your-ai-coach" class="cta">🍎 App Store</a>
        <a href="https://play.google.com/store/apps/details?id=com.ai.gym.coach" class="cta">▶ Google Play</a>
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
    <meta name="description" content="Find the best AI fitness app in your city. Your AI Coach is available worldwide with personalized workouts, meal plans, and voice coaching.">
    <link rel="canonical" href="https://youraicoach.life/best-ai-fitness-app">
    <meta name="robots" content="index, follow">
    <style>
        *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;background:#060B1D;color:#E2E8F0;line-height:1.7}.nav{background:rgba(6,11,29,0.95);border-bottom:1px solid rgba(255,255,255,0.08);padding:16px 24px;position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}.ni{max-width:900px;margin:0 auto;display:flex;justify-content:space-between;align-items:center}.nb{font-weight:800;font-size:1.1rem;color:#F8FAFC;text-decoration:none}.c{max-width:900px;margin:0 auto;padding:48px 24px}h1{font-size:2.4rem;font-weight:800;margin-bottom:8px;color:#F8FAFC}.sub{color:#94A3B8;margin-bottom:40px;font-size:1.05rem}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px}.city-card{display:flex;flex-direction:column;align-items:center;background:rgba(12,18,50,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px 16px;text-decoration:none;transition:all .3s;text-align:center}.city-card:hover{border-color:rgba(0,212,255,0.3);transform:translateY(-2px)}.city-emoji{font-size:2rem;margin-bottom:8px}.city-card h3{color:#F8FAFC;font-size:1rem;margin-bottom:4px}.city-card p{color:#64748B;font-size:.8rem;margin:0}
    </style>
</head>
<body>
<nav class="nav"><div class="ni"><a href="/" class="nb">⚡ Your AI Coach</a><a href="/blog" style="color:#94A3B8;font-size:.9rem;text-decoration:none">Blog</a></div></nav>
<div class="c">
    <h1>Best AI Fitness App by City</h1>
    <p class="sub">Your AI Coach is available in ${CITIES.length}+ cities worldwide. Find your city below.</p>
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
  sitemap = sitemap.replace('</urlset>', `${indexUrl}\n${cityUrls}\n</urlset>`);
  fs.writeFileSync(SITEMAP_PATH, sitemap);
}

console.log(`✅ Generated ${CITIES.length} city pages + index`);
console.log(`✅ Updated sitemap.xml`);
