import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { slideSvg, storyboardFromArticle } from './object-only-video.mjs';
import { narrationPlan, sourceDigest } from './article-video-fallback.mjs';

const execute = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sha256 = value => createHash('sha256').update(value).digest('hex');
const articleHash = post => sha256(JSON.stringify({ title: post.title, url: post.url, html: post.html }));
const TAGS = new Set(['svg', 'defs', 'linearGradient', 'stop', 'rect', 'text']);
const ATTRIBUTES = new Set(['xmlns', 'width', 'height', 'viewBox', 'id', 'x', 'y', 'x2', 'y2', 'rx', 'fill', 'opacity', 'offset', 'stop-color', 'font-family', 'font-size', 'font-weight']);

// This accepts only the reviewed typography constructor's output, not an
// arbitrary SVG that happens to contain rectangular or textual elements.
export function assertPermittedSlide(svg, slide, index, count) {
  if (svg !== slideSvg(slide, index, count)) throw new Error('Slide differs from the permitted typography template.');
  const rectangles = [], texts = [];
  // Exact constructor equality above confines this lexical check to our small
  // serialized grammar. No dependency or arbitrary external SVG parser is used.
  for (const tag of svg.matchAll(/<([A-Za-z][A-Za-z0-9-]*)\b([^>]*)>/g)) {
    if (!TAGS.has(tag[1])) throw new Error('Typography slide contains an unapproved element.');
    const attributes = {};
    const remainder = tag[2].replace(/\s+([A-Za-z_:][-A-Za-z0-9_:.]*)="[^\"]*"/g, (_attribute, name) => {
      if (!ATTRIBUTES.has(name)) throw new Error('Typography slide contains an unapproved attribute.');
      attributes[name] = _attribute.match(/="([^\"]*)"$/)[1];
      return '';
    }).trim();
    if (remainder && remainder !== '/') throw new Error('Typography slide contains malformed attributes.');
    if (tag[1] === 'rect') rectangles.push(attributes);
    if (tag[1] === 'text') texts.push(attributes);
  }
  // Pin the permitted geometry separately from the renderer. A future renderer
  // edit cannot introduce a figure made of otherwise allowed rectangles/text.
  const headingCount = texts.filter(node => node['font-size'] === '44').length;
  const bodyCount = texts.filter(node => node['font-size'] === '26').length;
  if (headingCount < 1 || headingCount > 3 || bodyCount > 6) throw new Error('Typography layout is outside the reviewed bounds.');
  const expectedRects = [
    {width:'1280',height:'720',fill:'url(#bg)'},
    {x:'1054',y:'82',width:'136',height:'136',rx:'24',fill:'#89ec76',opacity:'.06'},
    {x:'1120',y:'300',width:'70',height:'170',rx:'16',fill:'#89ec76',opacity:'.05'},
    {x:'90',y:String(205+(headingCount-1)*56),width:'100',height:'5',rx:'2',fill:'#8DFF6A'},
    {x:'90',y:'686',width:'1060',height:'4',rx:'2',fill:'#263f3b'},
    {x:'90',y:'686',width:String(Math.round(1060*(index+1)/count)),height:'4',rx:'2',fill:'#8DFF6A'},
  ];
  const font='DejaVu Sans,Arial,sans-serif';
  const expectedTexts = [
    {x:'90',y:'84','font-family':font,'font-size':'22',fill:'#8DFF6A','font-weight':'700'},
    ...Array.from({length:headingCount},(_,i)=>({x:'90',y:String(180+i*56),'font-family':font,'font-size':'44','font-weight':'700',fill:'#f7fafc'})),
    ...Array.from({length:bodyCount},(_,i)=>({x:'90',y:String(285+(headingCount-1)*56+i*36),'font-family':font,'font-size':'26',fill:'#c5d4d9'})),
    {x:'90',y:'661','font-family':font,'font-size':'17',fill:'#a7bfba'},
    {x:'1140',y:'661','font-family':font,'font-size':'17',fill:'#a7bfba'},
  ];
  const stable=items=>JSON.stringify(items.map(item=>Object.fromEntries(Object.entries(item).sort())));
  if (stable(rectangles)!==stable(expectedRects)||stable(texts)!==stable(expectedTexts)) throw new Error('Typography geometry or fonts differ from the reviewed layout.');
  const text = [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map(match => match[1]).join(' ');
  if (/[^\x20-\x7e]|[\\|]|(?:^|\s)[:;=8][-^]?[)(DP](?=$|\s)/i.test(text)) throw new Error('Typography slide contains pictographic or drawing-like text.');
}

function permittedStoryboard(post, recipe, root) {
  sourceDigest(post); // Require the actual canonical article and owner visual policy.
  if (!recipe || recipe.version !== 1 || recipe.articleSha256 !== articleHash(post)) throw new Error('Typography recipe does not match the current article.');
  const duration = recipe.durationSeconds;
  if (!Number.isFinite(duration) || duration <= 0 || duration > 1200) throw new Error('Typography recipe has an invalid duration.');
  const defaults = storyboardFromArticle(post);
  if (recipe.narrationSource === 'notebooklm-retained') return { slides: defaults, weights: defaults.map(() => 1), duration };
  if (recipe.narrationSource !== 'gemini-tts-canonical-script') throw new Error('Typography recipe has an unknown narration source.');
  const file = path.join(root, 'data/marketing-employee/narrations', `${post.slug}.json`);
  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw new Error('Approved narration manifest could not be read.'); }
  const plan = narrationPlan(post, manifest, manifest ? null : defaults);
  return { slides: plan.slides, weights: plan.slides.map(slide => slide.narration.split(/\s+/).length), duration };
}

export function frameRows(value) {
  const rows = String(value).split(/\r?\n/).filter(line => line && !line.startsWith('#')).map(line => line.replace(/\s/g, ''));
  if (!rows.length || rows.some(line => !/^0,-?\d+,-?\d+,\d+,\d+,[a-f0-9]{64}$/.test(line))) throw new Error('Decoded video frame hashes are missing or malformed.');
  return rows;
}

export function compareEveryFrame(actual, expected) {
  const a = frameRows(actual), b = frameRows(expected);
  if (a.length !== b.length || a.some((row, index) => row !== b[index])) throw new Error('Video differs from the permitted typography track.');
  return { frameCount: a.length, frameDigest: sha256(a.join('\n')) };
}

async function decodedFrames(file) {
  const { stdout } = await execute('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', file, '-map', '0:v:0', '-an', '-vf', 'format=rgb24', '-f', 'framehash', '-hash', 'sha256', '-'], { timeout: 15 * 60 * 1000, maxBuffer: 8 * 1024 * 1024 });
  return stdout;
}

/** Independently re-render the approved recipe and compare ALL decoded frames. */
export async function assertTypographyVideoIsPeopleFree(video, post, recipe, { root = ROOT } = {}) {
  const { slides, weights, duration } = permittedStoryboard(post, recipe, root);
  const file = fs.realpathSync(video);
  const { stdout: probe } = await execute('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], { timeout: 60000 });
  const metadata = JSON.parse(probe), streams = metadata.streams || [];
  if (streams.length !== 2 || streams.filter(s => s.codec_type === 'video').length !== 1 || streams.filter(s => s.codec_type === 'audio').length !== 1 || streams.some(s => s.disposition?.attached_pic) || Math.abs(Number(metadata.format?.duration) - duration) > 1 || !Number.isFinite(Number(metadata.format?.duration))) throw new Error('Video is not the bounded single visual/audio track described by the recipe.');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'izem-visual-verification-'));
  try {
    const total = weights.reduce((a, b) => a + b, 0), concat = ['ffconcat version 1.0'];
    for (const [index, slide] of slides.entries()) {
      const name = `reference-${String(index).padStart(2, '0')}`;
      const svg = slideSvg(slide, index, slides.length);
      assertPermittedSlide(svg, slide, index, slides.length);
      fs.writeFileSync(path.join(directory, `${name}.svg`), svg);
      await execute('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(directory, `${name}.svg`), '-frames:v', '1', path.join(directory, `${name}.png`)], { timeout: 60000 });
      concat.push(`file '${name}.png'`, `duration ${(duration * weights[index] / total).toFixed(6)}`);
    }
    concat.push(`file 'reference-${String(slides.length - 1).padStart(2, '0')}.png'`);
    const list = path.join(directory, 'reference.ffconcat'), reference = path.join(directory, 'reference.mp4');
    fs.writeFileSync(list, `${concat.join('\n')}\n`);
    await execute('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '1', '-i', list, '-map', '0:v:0', '-map_metadata', '-1', '-vf', 'fps=24,format=yuv420p', '-c:v', 'libx264', '-threads:v', '1', '-preset', 'veryfast', '-tune', 'stillimage', '-crf', '20', '-t', duration.toFixed(3), '-movflags', '+faststart', reference], { timeout: 15 * 60 * 1000 });
    const [actual, expected] = await Promise.all([decodedFrames(file), decodedFrames(reference)]);
    const match = compareEveryFrame(actual, expected);
    console.log(`Independent typography validation passed: all ${match.frameCount} decoded frames match the approved text-and-rectangle track.`);
    return { safe: true, containsHuman: false, method: 'deterministic-typography-all-frames-v1', articleSha256: recipe.articleSha256, videoSha256: sha256(fs.readFileSync(file)), ...match };
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
}
