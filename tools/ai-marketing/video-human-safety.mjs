#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { GoogleGenAI } from '@google/genai';

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

function sampleFrames(videoPath, directory) {
  const pattern = path.join(directory, 'frame-%02d.jpg');
  execFileSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    videoPath,
    '-vf',
    'fps=1/5,scale=640:-2',
    '-frames:v',
    '12',
    pattern,
  ], { stdio: 'inherit' });

  return fs.readdirSync(directory)
    .filter((name) => /^frame-\d+\.jpg$/.test(name))
    .sort()
    .map((name) => path.join(directory, name));
}

export async function assertVideoIsPeopleFree(videoPath, options = {}) {
  if (!fs.existsSync(videoPath)) throw new Error(`Video safety input does not exist: ${videoPath}`);

  const apiKey = options.apiKey || process.env.VIDEO_SAFETY_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY_3;
  const model = options.model || process.env.VIDEO_SAFETY_GEMINI_MODEL || process.env.SEO_GEMINI_MODEL || 'gemini-3.5-flash';
  if (!apiKey) throw new Error('People-free video validation requires a Gemini API key. Failing closed before YouTube upload.');

  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'izem-video-safety-'));
  try {
    const frames = sampleFrames(videoPath, directory);
    if (!frames.length) throw new Error('Could not extract frames for people-free video validation.');

    const ai = new GoogleGenAI({ apiKey });
    const parts = [
      {
        text: `You are a strict visual-safety classifier for a website whose owner forbids ANY human depiction in generated blog/video media.

Inspect every supplied video frame. A frame is UNSAFE if it contains or depicts any human or human-like person, including: a real person, face, head, torso, full body, arms, legs, hands, fingers, body parts, silhouette, human outline, avatar, portrait, cartoon person, illustrated person, stick figure, trainer, athlete, crowd, before/after body, or humanoid character clearly representing a person.

Objects such as phones, dumbbells, barbells, food, charts, app UI without people, text, abstract shapes, rooms, equipment, and non-humanoid icons are allowed.

Be conservative. If uncertain whether something is a human depiction, mark it unsafe.

Return JSON only in exactly this shape:
{"safe":true,"containsHuman":false,"reason":"short explanation","unsafeFrameHints":[]}`,
      },
      ...frames.flatMap((frame, index) => [
        { text: `Frame ${index + 1}:` },
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

    console.log(`People-free video validation passed across ${frames.length} sampled frame(s) using ${model}.`);
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

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
