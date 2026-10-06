import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const xml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

// Render only basic Latin text and punctuation. No emoji, pictograms, HTML, or external media.
export function safeSlideText(value = '') {
  return String(value).replace(/<[^>]*>/g, ' ')
    .replace(/&(?:amp|quot|apos|nbsp|lt|gt);/g, (entity) => ({ '&amp;': '&', '&quot;': '"', '&apos;': "'", '&nbsp;': ' ', '&lt;': '<', '&gt;': '>' }[entity]))
    .replace(/&#(x[0-9a-f]+|[0-9]+);/gi, (_match, n) => {
      const code = n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : Number(n);
      return code >= 32 && code <= 126 ? String.fromCharCode(code) : ' ';
    })
    .replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x20-\x7e]/g, ' ').replace(/\s+/g, ' ').trim();
}

function wrap(value, columns, maxLines) {
  const words = safeSlideText(value).split(/\s+/).filter(Boolean).flatMap((word) => word.match(new RegExp(`.{1,${columns}}`, 'g')) || []);
  const lines = [];
  let line = '';
  for (const word of words) {
    if (line && `${line} ${word}`.length > columns) { lines.push(line); line = ''; }
    line += `${line ? ' ' : ''}${word}`;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) return [...lines.slice(0, maxLines - 1), `${lines[maxLines - 1].slice(0, columns - 3)}...`];
  return lines;
}

export function storyboardFromArticle(post) {
  if (!post?.title || !/^https:\/\/youraicoach\.life\/blog\/[a-z0-9-]+$/.test(post.url || '')) throw new Error('A canonical IZEM article is required.');
  const cleaned = String(post.html || '')
    .replace(/<!-- (?:NOTEBOOKLM|IZEM)_VIDEO_START -->[\s\S]*?<!-- (?:NOTEBOOKLM|IZEM)_VIDEO_END -->/gi, '')
    .replace(/<(script|style|nav|footer)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  const article = cleaned.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || cleaned.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1];
  if (!article) throw new Error('Could not identify the canonical article body.');
  const headings = [...article.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)];
  const slides = [{ heading: post.title, body: post.description || '', label: 'ARTICLE VIDEO GUIDE' }];
  for (let i = 0; i < headings.length && slides.length < 7; i += 1) {
    const heading = safeSlideText(headings[i][1]);
    if (/^(sources|references|related|watch the video)/i.test(heading)) continue;
    const start = headings[i].index + headings[i][0].length;
    const end = headings[i + 1]?.index ?? article.length;
    const paragraph = article.slice(start, end).match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1];
    if (!paragraph) continue;
    slides.push({ heading, body: safeSlideText(paragraph), label: 'FROM THE CANONICAL ARTICLE' });
  }
  if (slides.length < 3) throw new Error('Insufficient article sections for a useful object-only storyboard.');
  slides.push({ heading: 'Read the complete guide', body: post.url.replace('https://', ''), label: 'IZEM' });
  return slides;
}

export function slideSvg(slide, index, count) {
  const heading = wrap(slide.heading, 38, 3);
  const body = wrap(slide.body, 66, 6);
  const progress = Math.round(1060 * (index + 1) / count);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
<defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#071019"/><stop offset="1" stop-color="#132d29"/></linearGradient></defs>
<rect width="1280" height="720" fill="url(#bg)"/>
<rect x="1054" y="82" width="136" height="136" rx="24" fill="#89ec76" opacity=".06"/>
<rect x="1120" y="300" width="70" height="170" rx="16" fill="#89ec76" opacity=".05"/>
<text x="90" y="84" font-family="DejaVu Sans,Arial,sans-serif" font-size="22" fill="#8DFF6A" font-weight="700">IZEM / ${xml(safeSlideText(slide.label))}</text>
${heading.map((line, i) => `<text x="90" y="${180 + i * 56}" font-family="DejaVu Sans,Arial,sans-serif" font-size="44" font-weight="700" fill="#f7fafc">${xml(line)}</text>`).join('\n')}
<rect x="90" y="${205 + (heading.length - 1) * 56}" width="100" height="5" rx="2" fill="#8DFF6A"/>
${body.map((line, i) => `<text x="90" y="${285 + (heading.length - 1) * 56 + i * 36}" font-family="DejaVu Sans,Arial,sans-serif" font-size="26" fill="#c5d4d9">${xml(line)}</text>`).join('\n')}
<text x="90" y="661" font-family="DejaVu Sans,Arial,sans-serif" font-size="17" fill="#a7bfba">YOURAICOACH.LIFE</text>
<text x="1140" y="661" font-family="DejaVu Sans,Arial,sans-serif" font-size="17" fill="#a7bfba">${index + 1} / ${count}</text>
<rect x="90" y="686" width="1060" height="4" rx="2" fill="#263f3b"/>
<rect x="90" y="686" width="${progress}" height="4" rx="2" fill="#8DFF6A"/>
</svg>`;
}

async function probe(file) {
  const result = await execute('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', file], { timeout: 60000 });
  return JSON.parse(result.stdout);
}

/** Discard ALL generated video frames; retain only that article's NotebookLM narration. */
export async function rebuildObjectOnlyVideo(inputFile, post) {
  const input = fs.realpathSync(inputFile);
  const media = await probe(input);
  const audio = media.streams?.find((stream) => stream.codec_type === 'audio');
  const duration = Number(audio?.duration || media.format?.duration);
  if (!audio || !Number.isFinite(duration) || duration <= 0 || duration > 1200) throw new Error('A bounded NotebookLM narration track is required.');
  const slides = storyboardFromArticle(post);
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'izem-object-video-'));
  const outputFile = path.join(work, 'object-only.mp4');
  try {
    const concat = ['ffconcat version 1.0'];
    for (const [index, slide] of slides.entries()) {
      const basename = `slide-${String(index).padStart(2, '0')}`;
      const svgFile = path.join(work, `${basename}.svg`);
      const pngFile = path.join(work, `${basename}.png`);
      fs.writeFileSync(svgFile, slideSvg(slide, index, slides.length));
      await execute('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', svgFile, '-frames:v', '1', pngFile], { timeout: 60000 });
      concat.push(`file '${basename}.png'`, `duration ${(duration / slides.length).toFixed(6)}`);
    }
    concat.push(`file 'slide-${String(slides.length - 1).padStart(2, '0')}.png'`);
    const list = path.join(work, 'slides.ffconcat');
    fs.writeFileSync(list, `${concat.join('\n')}\n`);
    await execute('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '1', '-i', list, '-i', input,
      '-map', '0:v:0', '-map', '1:a:0', '-map_metadata', '-1',
      '-vf', 'fps=24,format=yuv420p', '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'stillimage', '-crf', '20',
      '-c:a', 'aac', '-b:a', '160k', '-t', duration.toFixed(3), '-movflags', '+faststart', outputFile,
    ], { timeout: 15 * 60 * 1000, maxBuffer: 1024 * 1024 });
    const final = await probe(outputFile);
    if (!final.streams?.some((s) => s.codec_type === 'audio') || !final.streams?.some((s) => s.codec_type === 'video')
      || Math.abs(Number(final.format?.duration) - duration) > 1 || fs.statSync(outputFile).size < 10000) throw new Error('Rebuilt video failed duration or stream validation.');
    console.log(`Rebuilt ${slides.length} deterministic typography slides with ${duration.toFixed(2)} seconds of original NotebookLM narration; original visual track discarded.`);
    return { outputFile, renderMethod: 'notebooklm-narration-object-typography-v1', durationSeconds: duration, slideCount: slides.length };
  } catch (error) {
    fs.rmSync(work, { recursive: true, force: true });
    throw error;
  }
}
