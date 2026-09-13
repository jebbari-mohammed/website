import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';

// Apply the approved visual palette to generated output, never editorial source.
// No scripts, selectors, URLs, article text, or structured data are rewritten.
export const THEME = Object.freeze({
  primary: '#8DFF6A', secondary: '#D8FF86', background: '#070A0D',
  surface: '#111714', elevated: '#18211B', border: '#26322A',
});
const approved = new Set(Object.values(THEME).map(value => value.toLowerCase()));
const marker = 'data-izem-theme="green-black-v1"';
const stylesheet = `<link rel="stylesheet" href="/izem-theme.css" ${marker}>`;
const attribute = /(^|\s)(style|fill|stroke|stop-color|flood-color|bgcolor|color)\s*=\s*(["'])([\s\S]*?)\3/gi;
// Whole quoted strings and URLs are consumed before color tokens, including data URLs.
const valueToken = /url\(\s*(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|(?:\\.|[^)\\])*)\s*\)|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\*[\s\S]*?\*\/|#[\da-f]{3,8}\b|\brgba?\(\s*[\d.]+(?:\s*,\s*|\s+)[\d.]+(?:\s*,\s*|\s+)[\d.]+(?:\s*[,/]\s*(?:[\d.]+%?|var\([^)]*\)))?\s*\)/gi;

export function remapRgb(r, g, b) {
  const hex = '#' + [r, g, b].map(channel => Math.round(channel).toString(16).padStart(2, '0')).join('');
  if (approved.has(hex)) return null;
  const high = Math.max(r, g, b), low = Math.min(r, g, b), delta = high - low;
  if (delta === 0) return null;
  let hue = high === r ? ((g - b) / delta) % 6 : high === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  hue = (hue * 60 + 360) % 360;
  if (hue < 155 || hue > 285) return null; // Keep green, red/error, amber/warning and brand logos intact.
  const lightness = (high + low) / 510;
  const saturation = delta / (255 - Math.abs(high + low - 255));
  const grey = Math.round(r * .2126 + g * .7152 + b * .0722);
  if (high <= 66) {
    return grey <= 14 ? THEME.background : grey <= 26 ? THEME.surface : grey <= 42 ? THEME.elevated : THEME.border;
  }
  if (saturation >= .45 && delta >= 40 && lightness < .92) {
    return hue >= 235 || lightness >= .72 ? THEME.secondary : THEME.primary;
  }
  // Muted slate text stays neutral, not green. Retain its approximate luminance.
  return '#' + grey.toString(16).padStart(2, '0').repeat(3);
}

function transformToken(token) {
  if (token.startsWith('#')) {
    let value = token.slice(1);
    if (![3, 4, 6, 8].includes(value.length)) return token;
    if (value.length <= 4) value = [...value].map(c => c + c).join('');
    const rgb = [0, 2, 4].map(offset => parseInt(value.slice(offset, offset + 2), 16));
    const next = remapRgb(...rgb);
    return next ? next + value.slice(6) : token;
  }
  if (/^rgba?\(/i.test(token)) {
    const match = token.match(/^(rgba?\(\s*)([\d.]+)(\s*,\s*|\s+)([\d.]+)(\s*,\s*|\s+)([\d.]+)([\s\S]*)$/i);
    if (!match) return token;
    const rgb = [match[2], match[4], match[6]].map(Number);
    if (rgb.some(channel => channel < 0 || channel > 255)) return token;
    const next = remapRgb(...rgb);
    if (!next) return token;
    const channels = [1, 3, 5].map(offset => parseInt(next.slice(offset, offset + 2), 16));
    return `${match[1]}${channels[0]}${match[3]}${channels[1]}${match[5]}${channels[2]}${match[7]}`;
  }
  return token;
}

export function transformValue(value) {
  return value.replace(valueToken, transformToken);
}

const brightFill = value => {
  // Opaque brand fills only; no transparent overlays, background-clip:text or photos.
  const colors = value.match(/#[\da-f]{3,8}\b/gi) || [];
  return colors.length > 0 && colors.every(color => /^#(?:8dff6a|d8ff86|a3ff85|c8ff7e|7cff6b)$/i.test(color)) &&
    !/(?:url\(|var\(|rgba?\(|transparent)/i.test(value);
};

export function transformCss(css, inline = false) {
  const root = postcss.parse(inline ? `x{${css}}` : css);
  root.walkDecls(decl => { decl.value = transformValue(decl.value); });
  const variables = new Map();
  root.walkDecls(/^--/, decl => { variables.set(decl.prop, decl.value); });
  const resolveVariables = value => {
    for (let i = 0; i < 8 && /var\(/.test(value); i++) {
      const next = value.replace(/var\((--[\w-]+)\)/g, (token, name) => variables.get(name) || token);
      if (next === value) break;
      value = next;
    }
    return value;
  };
  root.walkRules(rule => {
    const declarations = rule.nodes.filter(node => node.type === 'decl');
    if (declarations.some(decl => /background-clip|text-fill-color/.test(decl.prop) && /text|transparent/.test(decl.value))) return;
    const background = [...declarations].reverse().find(decl => /^(background|background-color)$/.test(decl.prop));
    if (!background || !brightFill(resolveVariables(background.value))) return;
    const foreground = [...declarations].reverse().find(decl => decl.prop === 'color');
    if (foreground) foreground.value = THEME.background;
    else rule.append({ prop: 'color', value: THEME.background, important: background.important });
  });
  const result = root.toString();
  return inline ? result.slice(2, -1) : result;
}

export function transformHtml(html) {
  // Skip comments and raw-text content before matching tags, preserving their bytes.
  const token = /<!--[\s\S]*?-->|<(script|textarea|title|pre|code)\b(?:[^"'<>]|"[^"]*"|'[^']*')*>[\s\S]*?<\/\1\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<[a-zA-Z](?:[^"'<>]|"[^"]*"|'[^']*')*>/gi;
  let output = html.replace(token, (part, rawTag) => {
    if (rawTag || part.startsWith('<!--')) return part;
    if (/^<style\b/i.test(part)) return part.replace(/(^<style\b[^>]*>)([\s\S]*)(<\/style\s*>$)/i, (_, open, css, close) => open + transformCss(css) + close);
    if (/^<meta\s/i.test(part) && /\bname\s*=\s*(["'])theme-color\1/i.test(part)) {
      return part.replace(/(\bcontent\s*=\s*)(["'])(.*?)\2/i, `$1$2${THEME.background}$2`);
    }
    return part.replace(attribute, (_, space, name, quote, value) =>
      `${space}${name}=${quote}${name.toLowerCase() === 'style' ? transformCss(value, true) : transformValue(value)}${quote}`);
  });
  if (/<\/head\s*>/i.test(output) && !output.includes(marker)) output = output.replace(/<\/head\s*>/i, `${stylesheet}\n</head>`);
  return output;
}

export function visitFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Theme build refuses symlink: ${filename}`);
    return entry.isDirectory() ? visitFiles(filename) : [filename];
  });
}

export function applyBrandTheme(directory, check = false) {
  if (!fs.existsSync(path.join(directory, 'izem-theme.css'))) throw new Error('Missing public/izem-theme.css in build output');
  let htmlCount = 0, changed = 0;
  const pending = [];
  for (const filename of visitFiles(directory)) {
    if (!/\.(?:html|css|webmanifest)$/.test(filename)) continue;
    const original = fs.readFileSync(filename, 'utf8');
    let output;
    if (filename.endsWith('.html')) { output = transformHtml(original); htmlCount++; }
    else if (filename.endsWith('.css')) output = transformCss(original);
    else {
      const manifest = JSON.parse(original);
      manifest.theme_color = THEME.background;
      manifest.background_color = THEME.background;
      output = JSON.stringify(manifest, null, 2) + '\n';
    }
    if (output !== original) { changed++; pending.push([filename, output]); }
  }
  if (check && changed) throw new Error(`Unnormalized brand output in ${changed} files: ${pending.slice(0, 5).map(([name]) => path.relative(directory, name)).join(', ')}`);
  // Parse the entire site before writing, so malformed CSS cannot cause a partial release.
  if (!check) for (const [filename, output] of pending) fs.writeFileSync(filename, output);
  console.log(`Green/black theme: ${htmlCount} HTML pages checked; ${changed} files ${check ? 'need changes' : 'normalized'}.`);
  return { htmlCount, changed };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directory = process.argv[2];
  if (!directory) throw new Error('Usage: node tools/brand-theme.mjs <build-directory> [--check]');
  applyBrandTheme(path.resolve(directory), process.argv.includes('--check'));
}
