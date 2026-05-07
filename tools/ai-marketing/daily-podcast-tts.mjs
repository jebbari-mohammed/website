import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { GoogleGenerativeAI } from '@google/generative-ai';
import textToSpeech from '@google-cloud/text-to-speech';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../../public');
const PODCAST_DIR = path.join(PUBLIC_DIR, 'podcasts_tts');
const PROGRESS_FILE = path.join(__dirname, '.podcast-tts-progress.json');

if (!fs.existsSync(PODCAST_DIR)) fs.mkdirSync(PODCAST_DIR, { recursive: true });

// We load env vars
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && !k.startsWith('#') && k.trim()) {
      process.env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
    }
  });
}

// Ensure Google Cloud credentials exist (if GOOGLE_APPLICATION_CREDENTIALS path is not set but JSON is)
if (process.env.GOOGLE_CLOUD_JSON) {
  const tmpKey = path.join(__dirname, 'gcloud-key.json');
  fs.writeFileSync(tmpKey, process.env.GOOGLE_CLOUD_JSON);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpKey;
}

const REVIEW_QUEUE = [
  { title: 'Your AI Coach Review 2026 — Is This AI Fitness App Worth It?', slug: 'review-your-ai-coach-2026' },
  { title: 'I Tested Your AI Coach for 30 Days — Here Is My Honest Review', slug: 'review-your-ai-coach-30-days' },
  { title: 'Your AI Coach vs Fitbod — Which AI Fitness App Is Better in 2026?', slug: 'review-vs-fitbod' },
  { title: 'Top 5 AI Fitness Apps Compared — Your AI Coach vs The Competition', slug: 'review-top-5-ai-fitness-apps' },
  { title: 'Best App to Replace a Personal Trainer in 2026 — Save 300 Dollars a Month', slug: 'review-replace-personal-trainer' }
];

async function generateScript(title) {
  console.log(`🧠 Generating script for: ${title}`);
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are writing a short, snappy 2-minute podcast script between two hosts reviewing the AI fitness app "Your AI Coach".
Topic: ${title}

Rules:
- Host 1 (Female) leads the show.
- Host 2 (Male) provides insight and tries things out.
- They must sound natural, casual, and energetic.
- Discuss real features: "VoIP voice calls", "13 AI Modules", "Freemium model".
- NO sound effects or actions. Just dialogue.
- Return ONLY a valid JSON array of objects. Format:
[
  {"speaker": "Host 1", "text": "Welcome back to the Daily Fitness Review..."},
  {"speaker": "Host 2", "text": "Today we're looking at something crazy..."}
]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Failed to parse JSON array from Gemini output");
  return JSON.parse(match[0]);
}

async function synthesizeAudio(dialogue, slug) {
  console.log(`🎙️ Synthesizing ${dialogue.length} audio clips using Google Cloud TTS...`);
  const ttsClient = new textToSpeech.TextToSpeechClient();
  const audioFiles = [];

  for (let i = 0; i < dialogue.length; i++) {
    const { speaker, text } = dialogue[i];
    
    // Select voice based on speaker
    const voiceParams = speaker === 'Host 1' 
      ? { languageCode: 'en-US', name: 'en-US-Journey-F' } 
      : { languageCode: 'en-US', name: 'en-US-Journey-D' };

    const request = {
      input: { text },
      voice: voiceParams,
      audioConfig: { audioEncoding: 'MP3' },
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    const fileName = path.join(PODCAST_DIR, `temp_${slug}_${i}.mp3`);
    fs.writeFileSync(fileName, response.audioContent, 'binary');
    audioFiles.push(fileName);
    process.stdout.write(`\r   Generated ${i + 1}/${dialogue.length}`);
  }
  console.log(`\n✅ Generated all audio clips`);
  return audioFiles;
}

async function mergeAudioAndRenderVideo(audioFiles, slug) {
  console.log(`🎞️ Merging audio clips and rendering MP4...`);
  const finalAudio = path.join(PODCAST_DIR, `${slug}.mp3`);
  const finalVideo = path.join(PODCAST_DIR, `${slug}.mp4`);

  return new Promise((resolve, reject) => {
    // Phase 1: Concat audio
    const command = ffmpeg();
    audioFiles.forEach(file => command.input(file));
    command.on('error', reject)
           .on('end', () => {
             console.log(`✅ Audio merged into ${finalAudio}`);
             // Phase 2: Render black background video with audio
             ffmpeg()
               .input('color=c=black:s=1280x720:r=1')
               .inputFormat('lavfi')
               .input(finalAudio)
               .outputOptions(['-c:v libx264', '-tune stillimage', '-c:a aac', '-b:a 192k', '-pix_fmt yuv420p', '-shortest'])
               .save(finalVideo)
               .on('error', reject)
               .on('end', () => {
                  console.log(`✅ Video rendered to ${finalVideo}`);
                  // Cleanup temp files
                  audioFiles.push(finalAudio);
                  audioFiles.forEach(f => fs.unlinkSync(f));
                  resolve(finalVideo);
               });
           })
           .mergeToFile(finalAudio, PODCAST_DIR);
  });
}

// YouTube Upload logic (reused)
async function getYouTubeAccessToken() {
  const clientId = process.env.YOUTUBE_CLIENT_ID_2; // Channel 2
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET_2;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN_2;
  if (!clientId || !clientSecret || !refreshToken) return null;

  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      client_id: clientId, client_secret: clientSecret,
      refresh_token: refreshToken, grant_type: 'refresh_token',
    }).toString();

    const req = https.request({
      hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const p = JSON.parse(data);
        p.access_token ? resolve(p.access_token) : reject(new Error(data));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function uploadToYouTube(filePath, review, accessToken) {
  const fileSize = fs.statSync(filePath).size;
  const metadata = {
    snippet: {
      title: review.title.slice(0, 100),
      description: `Listen to our latest AI-generated review of Your AI Coach.\n\nTry it now: https://youraicoach.life\n\n#Fitness #AI #Podcast`,
      tags: ['AI fitness app review', 'podcast'],
      categoryId: '26',
      defaultLanguage: 'en',
    },
    status: { privacyStatus: 'public' },
  };

  const uploadUrl = await new Promise((resolve, reject) => {
    const metaBody = JSON.stringify(metadata);
    const req = https.request({
      hostname: 'www.googleapis.com',
      path: '/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': 'video/mp4',
        'X-Upload-Content-Length': fileSize,
        'Content-Length': Buffer.byteLength(metaBody),
      },
    }, (res) => {
      if (res.statusCode === 200) resolve(res.headers.location);
      else {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => reject(new Error(`Init failed ${res.statusCode}: ${d}`)));
      }
    });
    req.on('error', reject);
    req.write(metaBody);
    req.end();
  });

  return new Promise((resolve, reject) => {
    const urlObj = new URL(uploadUrl);
    const fileStream = fs.createReadStream(filePath);
    let uploaded = 0;

    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'video/mp4',
        'Content-Length': fileSize,
      },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const parsed = JSON.parse(data);
          resolve(`https://youtube.com/watch?v=${parsed.id}`);
        } else reject(new Error(`Upload failed ${res.statusCode}: ${data}`));
      });
    });

    fileStream.on('data', (chunk) => {
      uploaded += chunk.length;
      process.stdout.write(`\r   Uploading: ${Math.round(uploaded / fileSize * 100)}%`);
    });
    fileStream.on('end', () => process.stdout.write('\n'));
    fileStream.on('error', reject);
    req.on('error', reject);
    fileStream.pipe(req);
  });
}

async function main() {
  console.log('\n🚀 Starting Google Cloud TTS Video Generator\n');

  let progress = { completed: [] };
  if (fs.existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }

  const completedSlugs = new Set(progress.completed.map(c => c.slug));
  const review = REVIEW_QUEUE.find(r => !completedSlugs.has(r.slug));

  if (!review) {
    console.log('✅ All reviews completed. Queue finished.');
    return;
  }

  try {
    const dialogue = await generateScript(review.title);
    const audioFiles = await synthesizeAudio(dialogue, review.slug);
    const videoFile = await mergeAudioAndRenderVideo(audioFiles, review.slug);

    const accessToken = await getYouTubeAccessToken();
    if (!accessToken) {
      console.log('\n⚠️  YouTube (Channel 2) credentials not configured — skipping upload');
    } else {
      console.log('\n📺 Uploading review to YouTube...');
      const youtubeUrl = await uploadToYouTube(videoFile, review, accessToken);
      console.log(`✅ Live on YouTube: ${youtubeUrl}`);
      progress.completed.push({ slug: review.slug, title: review.title, youtube: youtubeUrl });
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    }
  } catch (e) {
    console.error('\n❌ Fatal Error:', e.message);
  }
}

main();
