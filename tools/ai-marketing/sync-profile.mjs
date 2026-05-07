import { Storage } from '@google-cloud/storage';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

const BUCKET_NAME = 'ai-gym-coach-notebooklm-state';
const PROFILE_DIR = path.join(os.homedir(), 'Library', 'Application Support', 'notebooklm-mcp');
const ARCHIVE_PATH = '/tmp/chrome_profile.tar.gz';

// Find the downloaded JSON key
const PROJECT_DIR = path.resolve(process.cwd(), '../..'); // Assuming run from tools/ai-marketing
let keyFile = fs.readdirSync(PROJECT_DIR).find(f => f.endsWith('.json') && f.includes('ai-gym-coach'));

if (!keyFile) {
  // Check if run from root
  keyFile = fs.readdirSync(process.cwd()).find(f => f.endsWith('.json') && f.includes('ai-gym-coach'));
  if (!keyFile) {
    console.error('❌ Could not find Google Cloud JSON key in website root.');
    process.exit(1);
  }
}
const keyPath = path.resolve(process.cwd() === PROJECT_DIR ? process.cwd() : PROJECT_DIR, keyFile);
console.log(`🔑 Using Google Cloud Key: ${keyPath}`);

const storage = new Storage({ keyFilename: keyPath });

async function createBucket() {
  try {
    const [bucketExists] = await storage.bucket(BUCKET_NAME).exists();
    if (!bucketExists) {
      console.log(`🪣 Creating bucket: ${BUCKET_NAME}...`);
      await storage.createBucket(BUCKET_NAME, {
        location: 'US',
        storageClass: 'STANDARD',
      });
    } else {
      console.log(`🪣 Bucket ${BUCKET_NAME} already exists.`);
    }
  } catch (e) {
    console.error('Failed to create bucket:', e.message);
    process.exit(1);
  }
}

async function uploadProfile() {
  if (!fs.existsSync(PROFILE_DIR)) {
    console.error(`❌ NotebookLM Profile not found at ${PROFILE_DIR}. You must run notebooklm-mcp locally first!`);
    process.exit(1);
  }

  console.log(`📦 Zipping Chrome Profile from ${PROFILE_DIR}...`);
  // Tar the contents, not the directory itself, so we can extract it cleanly on Linux
  execSync(`cd "${PROFILE_DIR}" && tar -czf "${ARCHIVE_PATH}" chrome_profile`, { stdio: 'inherit' });

  console.log(`☁️ Uploading to Google Cloud Storage...`);
  await storage.bucket(BUCKET_NAME).upload(ARCHIVE_PATH, {
    destination: 'chrome_profile.tar.gz',
    gzip: true,
  });
  
  console.log(`✅ Upload complete! Your session state is safely in the cloud.`);
  fs.unlinkSync(ARCHIVE_PATH);
}

async function main() {
  await createBucket();
  await uploadProfile();
}

main().catch(console.error);
