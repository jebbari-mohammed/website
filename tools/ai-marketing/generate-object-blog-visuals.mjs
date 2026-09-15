#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const BLOG = path.join(ROOT, 'public', 'blog');
const POLICY = 'objects-only-v1';
const MARKER = '<!-- IZEM_OBJECT_VISUALS_V1 -->';

const PROFILES = {
  schedule: { label: 'SCHEDULE SYSTEM', accent: '#8DFF6A', secondary: '#42C7C3' },
  nutrition: { label: 'NUTRITION SYSTEM', accent: '#FFD36E', secondary: '#8DFF6A' },
  comparison: { label: 'DECISION GUIDE', accent: '#86D7FF', secondary: '#C9A84C' },
  accountability: { label: 'ACCOUNTABILITY LOOP', accent: '#8DFF6A', secondary: '#86D7FF' },
  equipment: { label: 'EQUIPMENT PLAN', accent: '#86D7FF', secondary: '#8DFF6A' },
  progress: { label: 'PROGRESS SYSTEM', accent: '#8DFF6A', secondary: '#FFD36E' },
  planning: { label: 'PRACTICAL GUIDE', accent: '#8DFF6A', secondary: '#42C7C3' },
};

function parseArgs(argv) {
  let slug = '';
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === '--slug') slug = argv[++index] || '';
    else if (item.startsWith('--slug=')) slug = item.slice('--slug='.length);
  }
  if (!/^[a-z0-9][a-z0-9-]{1,119}$/.test(slug)) throw new Error('A safe --slug is required');
  return { slug };
}

function text(value = '') {
  return String(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function xml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function html(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shorten(value, max = 62) {
  const clean = text(value);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

function wrap(value, maxChars = 32, maxLines = 3) {
  const words = text(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines - 1) break;
    } else current = candidate;
  }
  if (current && lines.length < maxLines) lines.push(current);
  const consumed = lines.join(' ').split(/\s+/).filter(Boolean).length;
  if (consumed < words.length && lines.length) lines[lines.length - 1] = shorten(lines[lines.length - 1], maxChars);
  return lines.slice(0, maxLines);
}

function multiline(lines, x, y, size, gap, weight = 760, fill = '#F8FAFC') {
  return `<text x="${x}" y="${y}" font-family="Inter,Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${lines.map((line, index) => `<tspan x="${x}" dy="${index ? gap : 0}">${xml(line)}</tspan>`).join('')}</text>`;
}

function profileFor(value) {
  const haystack = text(value).toLowerCase();
  if (/nurse|shift|night shift|schedule|rota|calendar|busy day|time window/.test(haystack)) return 'schedule';
  if (/meal|nutrition|food|macro|calorie|protein|grocery|diet/.test(haystack)) return 'nutrition';
  if (/alternative|\bvs\b|versus|compare|comparison|best .*app|top .*app/.test(haystack)) return 'comparison';
  if (/call|voice|remind|accountab|procrast|motivat|check-in|consisten/.test(haystack)) return 'accountability';
  if (/dumbbell|equipment|machine|home gym|gym gear|barbell|resistance band/.test(haystack)) return 'equipment';
  if (/progress|overload|track|streak|plateau|review|adapt/.test(haystack)) return 'progress';
  return 'planning';
}

function shell(title, description, profileName, body) {
  const profile = PROFILES[profileName];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-labelledby="title desc">
<title id="title">${xml(title)}</title>
<desc id="desc">${xml(description)}</desc>
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#060B12"/><stop offset="0.54" stop-color="#0C1824"/><stop offset="1" stop-color="#102A25"/></linearGradient>
  <radialGradient id="glow" cx="0.84" cy="0.14" r="0.68"><stop offset="0" stop-color="${profile.accent}" stop-opacity=".15"/><stop offset="1" stop-color="${profile.accent}" stop-opacity="0"/></radialGradient>
  <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#000" flood-opacity=".28"/></filter>
</defs>
<rect width="1200" height="675" rx="28" fill="url(#bg)"/>
<rect width="1200" height="675" rx="28" fill="url(#glow)"/>
<g opacity=".07" stroke="#BCECDD" stroke-width="1"><path d="M0 135H1200M0 270H1200M0 405H1200M0 540H1200"/><path d="M200 0V675M400 0V675M600 0V675M800 0V675M1000 0V675"/></g>
${body}
<text x="70" y="627" font-family="Inter,Arial,sans-serif" font-size="18" font-weight="850" fill="${profile.accent}" letter-spacing="2">IZEM · ${profile.label}</text>
</svg>`;
}

function phone(x, y, accent) {
  return `<g transform="translate(${x} ${y})" filter="url(#shadow)">
  <rect width="258" height="448" rx="34" fill="#08121D" stroke="${accent}" stroke-width="3"/>
  <rect x="22" y="52" width="214" height="92" rx="18" fill="#122536"/>
  <rect x="42" y="77" width="108" height="10" rx="5" fill="${accent}" opacity=".9"/><rect x="42" y="103" width="158" height="9" rx="5" fill="#AFC0CF" opacity=".48"/>
  <rect x="22" y="165" width="214" height="115" rx="18" fill="#102923"/>
  <polyline points="42,250 82,224 116,235 151,200 190,211 216,184" fill="none" stroke="${accent}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="22" y="301" width="214" height="99" rx="18" fill="#122536"/>
  <circle cx="49" cy="330" r="9" fill="${accent}"/><path d="M45 330l4 4 8-10" fill="none" stroke="#07120D" stroke-width="3.5"/>
  <rect x="70" y="324" width="126" height="10" rx="5" fill="#D6E0E8" opacity=".7"/>
  <circle cx="129" cy="422" r="6" fill="#41586D"/>
</g>`;
}

function dumbbell(x, y, scale = 1, accent = '#F8FAFC') {
  return `<g transform="translate(${x} ${y}) scale(${scale})" stroke="${accent}" stroke-width="13" stroke-linecap="round"><line x1="36" y1="54" x2="208" y2="54"/><line x1="36" y1="28" x2="36" y2="80"/><line x1="62" y1="18" x2="62" y2="90"/><line x1="182" y1="18" x2="182" y2="90"/><line x1="208" y1="28" x2="208" y2="80"/></g>`;
}

function calendar(x, y, accent) {
  return `<g transform="translate(${x} ${y})" filter="url(#shadow)"><rect width="270" height="220" rx="24" fill="#101D2A" stroke="#30485A" stroke-width="3"/><rect width="270" height="56" rx="24" fill="${accent}" opacity=".14"/><path d="M0 56H270" stroke="${accent}" stroke-width="2"/><path d="M58 0V30M212 0V30" stroke="${accent}" stroke-width="10" stroke-linecap="round"/><g fill="#B9C8D4" opacity=".7">${[0,1,2].map((row)=>[0,1,2,3].map((col)=>`<rect x="${34+col*56}" y="${88+row*45}" width="25" height="20" rx="5"/>`).join('')).join('')}</g><rect x="146" y="133" width="25" height="20" rx="5" fill="${accent}"/></g>`;
}

function nutritionMotif(x, y, accent, secondary) {
  return `<g transform="translate(${x} ${y})" filter="url(#shadow)"><circle cx="160" cy="150" r="128" fill="#0E1C27" stroke="#344D58" stroke-width="3"/><path d="M56 150h208c-9 83-53 124-104 124S65 233 56 150z" fill="#132D28" stroke="${accent}" stroke-width="4"/><path d="M88 126c28-50 62-64 104-44 18 9 34 26 46 44" fill="none" stroke="${secondary}" stroke-width="16" stroke-linecap="round"/><circle cx="125" cy="112" r="18" fill="${accent}" opacity=".85"/><circle cx="179" cy="104" r="22" fill="${secondary}" opacity=".75"/><circle cx="215" cy="124" r="15" fill="#FFD36E" opacity=".8"/><path d="M282 66v176" stroke="#DCE7EF" stroke-width="9" stroke-linecap="round"/><path d="M306 66v176M330 66v176" stroke="#DCE7EF" stroke-width="4" stroke-linecap="round"/></g>`;
}

function comparisonMotif(x, y, accent, secondary) {
  return `<g transform="translate(${x} ${y})" filter="url(#shadow)"><rect width="410" height="330" rx="28" fill="#0D1925" stroke="#32495B" stroke-width="3"/><rect x="28" y="34" width="154" height="240" rx="20" fill="#12283A" stroke="${accent}" stroke-width="3"/><rect x="228" y="34" width="154" height="240" rx="20" fill="#172820" stroke="${secondary}" stroke-width="3"/><text x="105" y="85" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="900" fill="${accent}">OPTION A</text><text x="305" y="85" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="900" fill="${secondary}">OPTION B</text>${[0,1,2].map((i)=>`<rect x="52" y="${120+i*44}" width="105" height="11" rx="6" fill="#DDE7EF" opacity="${.65-i*.12}"/><rect x="252" y="${120+i*44}" width="105" height="11" rx="6" fill="#DDE7EF" opacity="${.65-i*.12}"/>`).join('')}<circle cx="205" cy="154" r="31" fill="#08121D" stroke="#637789" stroke-width="2"/><text x="205" y="162" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="18" font-weight="900" fill="#F8FAFC">VS</text></g>`;
}

function accountabilityMotif(x, y, accent) {
  return `<g transform="translate(${x} ${y})" filter="url(#shadow)"><rect width="340" height="330" rx="30" fill="#0E1A27" stroke="#30485A" stroke-width="3"/><rect x="36" y="38" width="268" height="78" rx="18" fill="#142B37"/><path d="M62 78h20l10-22 18 46 18-33 14 9h24l13-19 18 39 18-30 15 10h45" fill="none" stroke="${accent}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="170" cy="206" r="67" fill="${accent}" opacity=".12"/><path d="M142 205c0-16 12-28 28-28s28 12 28 28v24c0 16-12 28-28 28s-28-12-28-28z" fill="none" stroke="${accent}" stroke-width="8"/><path d="M122 210v10c0 31 20 51 48 51s48-20 48-51v-10M170 271v28M143 299h54" fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round"/></g>`;
}

function progressMotif(x, y, accent, secondary) {
  return `<g transform="translate(${x} ${y})" filter="url(#shadow)"><rect width="400" height="315" rx="28" fill="#0E1B28" stroke="#30485A" stroke-width="3"/><path d="M48 250V62M48 250H352" stroke="#617487" stroke-width="3"/><path d="M70 226L126 197L178 205L230 148L284 165L336 90" fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>${[[70,226],[126,197],[178,205],[230,148],[284,165],[336,90]].map(([cx,cy])=>`<circle cx="${cx}" cy="${cy}" r="8" fill="${secondary}"/>`).join('')}<rect x="64" y="34" width="112" height="12" rx="6" fill="#E0E9EF" opacity=".65"/><rect x="196" y="34" width="74" height="12" rx="6" fill="${accent}" opacity=".75"/></g>`;
}

function equipmentMotif(x, y, accent) {
  return `<g transform="translate(${x} ${y})" filter="url(#shadow)"><rect width="420" height="318" rx="28" fill="#0D1A25" stroke="#30485A" stroke-width="3"/>${dumbbell(70,64,1.15,accent)}<rect x="70" y="190" width="280" height="18" rx="9" fill="#42596B"/><rect x="96" y="208" width="20" height="60" rx="7" fill="#42596B"/><rect x="304" y="208" width="20" height="60" rx="7" fill="#42596B"/><circle cx="91" cy="273" r="24" fill="none" stroke="${accent}" stroke-width="8"/><circle cx="329" cy="273" r="24" fill="none" stroke="${accent}" stroke-width="8"/></g>`;
}

function motif(profileName, x, y) {
  const p = PROFILES[profileName];
  if (profileName === 'schedule') return calendar(x, y, p.accent);
  if (profileName === 'nutrition') return nutritionMotif(x, y, p.accent, p.secondary);
  if (profileName === 'comparison') return comparisonMotif(x, y, p.accent, p.secondary);
  if (profileName === 'accountability') return accountabilityMotif(x, y, p.accent);
  if (profileName === 'equipment') return equipmentMotif(x, y, p.accent);
  if (profileName === 'progress') return progressMotif(x, y, p.accent, p.secondary);
  return `${phone(x + 80, y - 40, p.accent)}${dumbbell(x - 170, y + 230, .9, '#F8FAFC')}`;
}

function heroSvg(title, profileName) {
  const p = PROFILES[profileName];
  return shell(
    `${title} — object-only IZEM editorial visual`,
    `People-free ${p.label.toLowerCase()} illustration using only devices, equipment, food, charts, calendars, or abstract objects relevant to this guide.`,
    profileName,
    `<rect x="70" y="72" width="210" height="38" rx="19" fill="${p.accent}" opacity=".12"/><text x="92" y="98" font-family="Inter,Arial,sans-serif" font-size="15" font-weight="900" fill="${p.accent}" letter-spacing="2">${p.label}</text>
${multiline(wrap(title, 27, 4), 70, 170, 42, 52, 880)}
<path d="M70 414H570" stroke="${p.accent}" stroke-width="5" stroke-linecap="round" opacity=".75"/>
<text x="70" y="457" font-family="Inter,Arial,sans-serif" font-size="20" font-weight="650" fill="#AFC0CF">Evidence → decision → useful next action</text>
${motif(profileName, 730, 160)}`,
  );
}

function frameworkSvg(title, headings, profileName) {
  const p = PROFILES[profileName];
  const cards = headings.slice(0, 3);
  while (cards.length < 3) cards.push(['Define the real constraint', 'Choose the smallest useful action', 'Review what actually happened'][cards.length]);
  return shell(
    `${title} — decision framework`,
    'People-free three-step decision framework using text cards and abstract arrows only.',
    profileName,
    `<text x="70" y="104" font-family="Inter,Arial,sans-serif" font-size="17" font-weight="900" fill="${p.accent}" letter-spacing="3">DECISION FRAMEWORK</text>
${multiline(['Turn the topic into a repeatable decision'], 70, 158, 38, 46, 850)}
${cards.map((heading, index) => {
      const x = 70 + index * 365;
      return `<g transform="translate(${x} 254)" filter="url(#shadow)"><rect width="315" height="238" rx="24" fill="#0D1A27" stroke="${index === 1 ? p.accent : '#30485A'}" stroke-width="3"/><rect x="26" y="26" width="48" height="48" rx="14" fill="${p.accent}" opacity="${index === 1 ? .95 : .2}"/><text x="50" y="59" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="20" font-weight="900" fill="${index === 1 ? '#07120D' : p.accent}">${index + 1}</text>${multiline(wrap(heading, 20, 3), 26, 112, 23, 31, 800)}<rect x="26" y="198" width="206" height="10" rx="5" fill="#9DB0C0" opacity=".32"/></g>${index < 2 ? `<path d="M${x + 318} 374H${x + 354}" stroke="${p.secondary}" stroke-width="6" stroke-linecap="round"/><path d="M${x + 344} 362l13 12-13 12" fill="none" stroke="${p.secondary}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` : ''}`;
    }).join('')}`,
  );
}

function checklistSvg(title, items, profileName) {
  const p = PROFILES[profileName];
  const rows = items.slice(0, 4).map((item) => shorten(item, 60));
  while (rows.length < 4) rows.push(['Match the actual goal', 'Fit the real schedule', 'Use what is available', 'Review the result'][rows.length]);
  return shell(
    `${title} — practical checklist`,
    'People-free checklist graphic using text, check marks, and abstract object-only design.',
    profileName,
    `<text x="70" y="104" font-family="Inter,Arial,sans-serif" font-size="17" font-weight="900" fill="${p.accent}" letter-spacing="3">PRACTICAL CHECKLIST</text>
${multiline(['Before you choose, check these four things'], 70, 158, 38, 46, 850)}
<g transform="translate(70 225)" filter="url(#shadow)"><rect width="1060" height="330" rx="26" fill="#0D1A27" stroke="#30485A" stroke-width="3"/>${rows.map((row, index) => { const y = 58 + index * 66; return `<circle cx="52" cy="${y}" r="18" fill="${p.accent}"/><path d="M44 ${y}l6 6 12-16" fill="none" stroke="#07120D" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>${multiline(wrap(row, 67, 2), 88, y + 8, 23, 28, 720, '#E8F0F5')}<rect x="790" y="${y - 5}" width="210" height="10" rx="5" fill="${index % 2 ? p.secondary : p.accent}" opacity=".18"/>`; }).join('')}</g>`,
  );
}

function figure(src, alt, caption, eager = false) {
  return `<figure data-owner-visual-policy="${POLICY}" style="margin:30px 0 34px">
  <img data-owner-visual-policy="${POLICY}" src="${src}" alt="${html(alt)}" width="1200" height="675" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" style="display:block;width:100%;height:auto;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:#081019">
  <figcaption style="margin-top:10px;color:#AEBBCC;font-size:.92rem">${html(caption)}</figcaption>
</figure>`;
}

function insertAfterNthH2(source, block, targetIndex) {
  const regex = /<h2\b[^>]*>[\s\S]*?<\/h2>/gi;
  let match;
  for (let index = 0; index <= targetIndex; index += 1) {
    match = regex.exec(source);
    if (!match) break;
  }
  if (!match) return `${source}\n${block}`;
  const at = match.index + match[0].length;
  return `${source.slice(0, at)}\n${block}${source.slice(at)}`;
}

function main() {
  const { slug } = parseArgs(process.argv.slice(2));
  const file = path.join(BLOG, `${slug}.html`);
  if (!fs.existsSync(file)) throw new Error(`Blog post not found: ${file}`);
  let source = fs.readFileSync(file, 'utf8');
  if (source.includes(MARKER)) {
    console.log(`Object-only visuals already present for ${slug}.`);
    return;
  }

  const title = text(source.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || source.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || slug);
  const headings = [...source.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map((match) => text(match[1]))
    .filter((value) => value && !/frequently asked|watch the video|useful izem guides/i.test(value))
    .slice(0, 8);
  const listItems = [...source.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => text(match[1]))
    .filter((value) => value.length >= 12 && value.length <= 180)
    .slice(0, 10);
  const profileName = profileFor(`${title} ${headings.join(' ')}`);

  const assetDir = path.join(BLOG, 'assets', slug);
  fs.mkdirSync(assetDir, { recursive: true });
  fs.writeFileSync(path.join(assetDir, 'hero.svg'), heroSvg(title, profileName), 'utf8');
  fs.writeFileSync(path.join(assetDir, 'framework.svg'), frameworkSvg(title, headings, profileName), 'utf8');
  fs.writeFileSync(path.join(assetDir, 'checklist.svg'), checklistSvg(title, listItems, profileName), 'utf8');

  const base = `/blog/assets/${slug}`;
  const profile = PROFILES[profileName];
  const hero = `${MARKER}\n${figure(`${base}/hero.svg`, `${title}: people-free ${profile.label.toLowerCase()} editorial illustration`, `A topic-specific, people-free ${profile.label.toLowerCase()} visual built from objects, diagrams, and typography.`, true)}`;
  const framework = figure(`${base}/framework.svg`, `${title}: people-free decision framework`, 'A three-step decision framework distilled from the guide, with no people or body imagery.');
  const checklist = figure(`${base}/checklist.svg`, `${title}: people-free practical checklist`, 'A practical four-point checklist using only typography and abstract interface elements.');

  const disclosure = /(<div\b[^>]*class=["'][^"']*\bdisclosure\b[^"']*["'][^>]*>[\s\S]*?<\/div>)/i;
  if (disclosure.test(source)) source = source.replace(disclosure, `$1\n${hero}`);
  else if (/<main\b[^>]*>/i.test(source)) source = source.replace(/<main\b[^>]*>/i, (match) => `${match}\n${hero}`);
  else source = `${hero}\n${source}`;

  source = insertAfterNthH2(source, framework, 0);
  source = insertAfterNthH2(source, checklist, 1);
  fs.writeFileSync(file, source, 'utf8');
  console.log(`Generated 3 premium topic-specific object-only SVG visuals for ${slug} (${profileName}).`);
}

main();
