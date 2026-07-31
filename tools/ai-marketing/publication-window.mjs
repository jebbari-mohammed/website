/**
 * Choose one stable, pseudo-random publication time per UTC day.
 *
 * Scheduled workflows run once per hour during the seven-hour window. Each run
 * calculates the same target, so only the matching hour continues. The selected
 * run waits only for the remaining minutes/seconds inside that hour. This avoids
 * GitHub-hosted runners' six-hour execution limit.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';

const WINDOW_SECONDS = 7 * 60 * 60;

function readArg(name, fallback = '') {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

function appendOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  }
}

const eventName = readArg('event', process.env.GITHUB_EVENT_NAME || 'manual');
const baseHour = Number(readArg('base-hour'));
const schedule = readArg('schedule');
const salt = readArg('salt', 'izem-content');
const repository = process.env.GITHUB_REPOSITORY || 'local/izem';

if (!Number.isInteger(baseHour) || baseHour < 0 || baseHour > 23) {
  throw new Error(`Invalid --base-hour value: ${readArg('base-hour')}`);
}

if (eventName !== 'schedule') {
  appendOutput('publish', 'true');
  appendOutput('wait_seconds', '0');
  console.log('Manual or chained run: publishing without an additional delay.');
  process.exit(0);
}

const scheduleParts = schedule.trim().split(/\s+/);
const scheduledHour = Number(scheduleParts[1]);
if (!Number.isInteger(scheduledHour)) {
  throw new Error(`Could not read the scheduled hour from: ${schedule}`);
}

const now = new Date();
const utcDate = now.toISOString().slice(0, 10);
const seed = `${utcDate}:${repository}:${salt}`;
const randomValue = crypto.createHash('sha256').update(seed).digest().readUInt32BE(0);
const delaySeconds = randomValue % WINDOW_SECONDS;
const targetHour = baseHour + Math.floor(delaySeconds / 3600);
const secondsIntoTargetHour = delaySeconds % 3600;
const publish = scheduledHour === targetHour;

let waitSeconds = 0;
if (publish) {
  const elapsedSeconds = now.getUTCMinutes() * 60 + now.getUTCSeconds();
  waitSeconds = Math.max(0, secondsIntoTargetHour - elapsedSeconds);
}

appendOutput('publish', String(publish));
appendOutput('wait_seconds', String(waitSeconds));
appendOutput('target_utc', `${String(targetHour).padStart(2, '0')}:${String(Math.floor(secondsIntoTargetHour / 60)).padStart(2, '0')}:${String(secondsIntoTargetHour % 60).padStart(2, '0')}`);

console.log(`Today's ${salt} target is ${targetHour.toString().padStart(2, '0')}:${Math.floor(secondsIntoTargetHour / 60).toString().padStart(2, '0')}:${(secondsIntoTargetHour % 60).toString().padStart(2, '0')} UTC.`);
console.log(publish
  ? `This is the selected hourly run; waiting ${waitSeconds} seconds before publishing.`
  : 'This is not the selected hourly run; no content will be published.');
