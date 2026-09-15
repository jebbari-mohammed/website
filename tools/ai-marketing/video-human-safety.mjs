#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const HERE = path.dirname(fileURLToPath(import.meta.url));

function parseJson(text) {
  const clean = String(text || '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(clean.slice(start, end + 1));
    throw new Error(`Video safety model did not return JSON: ${clean.slice(0, 400)}`);
  }
}

function videoDurationSeconds(videoPath) {
  const value = execFileSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    videoPath,
  ], { encoding: 'utf8' }).trim();
  const duration = Number(value);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error(`Could not determine video duration: ${value}`);
  return duration;
}

function sampleFrames(videoPath, directory, count = 14) {
  const duration = videoDurationSeconds(videoPath);
  const frames = [];
  for (let index = 0; index < count; index += 1) {
    const ratio = count === 1 ? 0.5 : index / (count - 1);
    const timestamp = Math.max(0, Math.min(duration - 0.05, ratio * Math.max(0.05, duration - 0.05)));
    const output = path.join(directory, `frame-${String(index + 1).padStart(2, '0')}.jpg`);
    execFileSync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-ss', timestamp.toFixed(3),
      '-i', videoPath,
      '-frames:v', '1',
      '-vf', 'scale=640:-2',
      output,
    ], { stdio: 'inherit' });
    if (fs.existsSync(output) && fs.statSync(output).size > 1000) frames.push(output);
  }
  return frames;
}

export async function assertVideoIsPeopleFree(videoPath, options = {}) {
  if (!fs.existsSync(videoPath)) throw new Error(`Video safety input does not exist: ${videoPath}`);

  const apiKey = options.apiKey || process.env.VIDEO_SAFETY_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY_3;
  const model = options.model || process.env.VIDEO_SAFETY_GEMINI_MODEL || process.env.SEO_GEMINI_MODEL || 'gemini-3.5-flash';
  if (!apiKey) throw new Error('People-free video validation requires a Gemini API key. Failing closed before YouTube upload.');

  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'izem-video-safety-'));
  try {
    const frames = sampleFrames(videoPath, directory);
    if (frames.length < 8) throw new Error(`Only ${frames.length} usable video frames were extracted; failing closed.`);

    const ai = new GoogleGenAI({ apiKey });
    const parts = [
      {
        text: `You are a strict visual-safety classifier for a website whose owner forbids ANY human depiction in generated blog/video media.

The supplied images are uniformly sampled across the FULL duration of one generated video. Mark the video UNSAFE if any frame contains or depicts any human or human-like person, including: real people, faces, heads, torsos, full bodies, arms, legs, hands, fingers, body parts, silhouettes, human outlines, avatars, portraits, cartoon people, illustrated people, stick figures, trainers, athletes, crowds, before/after bodies, or humanoid characters clearly representing people.

Objects such as phones, dumbbells, barbells, food, charts, app UI without people, text, abstract shapes, rooms, equipment, and non-humanoid icons are allowed.

Be conservative: uncertainty means unsafe.

Return JSON only in exactly this shape:
{"safe":true,"containsHuman":false,"reason":"short explanation","unsafeFrameHints":[]}`,
      },
      ...frames.flatMap((frame, index) => [
        { text: `Uniform sample ${index + 1} of ${frames.length}:` },
        { inlineData: { mimeType: 'image/jpeg', data: fs.readFileSync(frame).toString('base64') } },
      ]),
    ];

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts }],
      config: { responseMimeType: 'application/json', maxOutputTokens: 700 },
    });
    const verdict = parseJson(response.text);

    if (verdict?.safe !== true || verdict?.containsHuman !== false) {
      throw new Error(`NotebookLM video blocked by people-free policy: ${String(verdict?.reason || 'human depiction detected').slice(0, 500)}`);
    }

    console.log(`People-free video validation passed across ${frames.length} uniform full-duration sample(s) using ${model}.`);
    return verdict;
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

async function main() {
  const videoPath = process.argv[2];
  if (!videoPath) throw new Error('Usage: node tools/ai-marketing/video-human-safety.mjs <video.mp4>');
  await assertVideoIsPeopleFree(videoPath);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.join(HERE, 'video-human-safety.mjs')) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
