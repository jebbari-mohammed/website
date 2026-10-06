import { setTimeout as delay } from 'node:timers/promises';

/** Poll YouTube itself. An upload response or repository record is not publication. */
export async function verifyYouTubePublication({
  videoId, title, canonicalUrl, validationStamp, readVideo,
  wait = delay, attempts = 60, intervalMs = 10000,
}) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId || '')) throw new Error('Invalid YouTube video id.');
  if (!title || !canonicalUrl || !validationStamp || typeof readVideo !== 'function') {
    throw new Error('YouTube publication verification requires identity and a reader.');
  }
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 60) throw new Error('Invalid publication verification budget.');
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const video = await readVideo(videoId);
    if (video) {
      if (video.id !== videoId || video.snippet?.title !== title) {
        throw new Error('YouTube publication identity does not match this article.');
      }
      const lines = String(video.snippet?.description || '').split(/\r?\n/).map((line) => line.trim());
      if (!lines.includes(`Canonical article: ${canonicalUrl}`) || !lines.includes(validationStamp)) {
        throw new Error('YouTube publication is missing the exact canonical article or validation stamp.');
      }
      const status = video.status || {};
      const processing = video.processingDetails?.processingStatus;
      if (['failed', 'rejected', 'deleted'].includes(status.uploadStatus) || ['failed', 'terminated'].includes(processing)) {
        throw new Error(`YouTube rejected or failed processing video ${videoId}.`);
      }
      if (status.privacyStatus !== 'public') {
        throw new Error(`YouTube video ${videoId} is ${status.privacyStatus || 'not verifiably public'}; publication is blocked.`);
      }
      if (status.embeddable === false) throw new Error(`YouTube video ${videoId} is not embeddable.`);
      if (status.uploadStatus === 'processed' && (!processing || processing === 'succeeded')) {
        return {
          videoId, title, channelId: video.snippet?.channelId || null,
          publishedAt: video.snippet?.publishedAt || null,
          privacyStatus: status.privacyStatus, uploadStatus: status.uploadStatus,
          processingStatus: processing || null, verifiedAt: new Date().toISOString(),
        };
      }
    }
    if (attempt < attempts) await wait(intervalMs);
  }
  throw new Error(`YouTube video ${videoId} did not finish public processing within the verification budget; do not re-upload it.`);
}
