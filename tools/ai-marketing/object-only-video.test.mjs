import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { safeSlideText, storyboardFromArticle, slideSvg, rebuildObjectOnlyVideo } from './object-only-video.mjs';

const post = {
  title: 'How many exercises per workout?',
  description: 'Count sets and rest before deciding what fits.',
  url: 'https://youraicoach.life/blog/how-many-exercises-per-workout',
  html: '<main><h1>How many exercises per workout?</h1><h2>Count working sets</h2><p>Four exercises with three sets each means twelve working sets.</p><h2>Budget for rest</h2><p>Leave time for warm-ups and changing equipment.</p><h2>Sources</h2><p>Reference list.</p><!-- IZEM_VIDEO_START --><h2>Watch the video</h2><p>Old companion video.</p><!-- IZEM_VIDEO_END --></main>',
};
test('removes pictograms, body emoji, and numeric emoji entities', () => {
  assert.equal(safeSlideText('Keep 💪 🏋️ &#x1F4AA; &#128170; <b>text</b>'), 'Keep text');
});
test('extracts canonical sections, not old video or scripts', () => {
  const slides = storyboardFromArticle(post);
  assert.equal(slides.length, 4);
  assert.ok(slides.some((slide) => slide.body.includes('twelve working sets')));
  assert.ok(!JSON.stringify(slides).includes('Old companion'));
  assert.ok(!JSON.stringify(slides).includes('Reference list'));
});
test('refuses absent canonical body or unrelated URLs', () => {
  assert.throws(() => storyboardFromArticle({ ...post, html: '<h1>No article</h1>' }), /body/);
  assert.throws(() => storyboardFromArticle({ ...post, url: 'https://example.com/blog/test' }), /canonical/);
});
test('SVG uses only generated geometry and escaped text', () => {
  const svg = slideSvg({ heading: '<img src=x> & "Title"', body: '<script>x</script> people 💪', label: 'TEST' }, 0, 2);
  assert.ok(svg.includes('&amp;'));
  assert.ok(!/<(?:image|script|foreignObject|iframe|use)\b/i.test(svg));
  assert.ok(!svg.includes('💪'));
  assert.ok(!/(?:href|onload)\s*=/i.test(svg));
});
test('rebuilds actual MP4 with narration and without original video pixels', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'izem-render-test-'));
  let rebuilt;
  try {
    const input = path.join(dir, 'original.mp4');
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=red:s=320x180:r=24:d=2', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=2', '-c:v', 'libx264', '-c:a', 'aac', '-shortest', input]);
    rebuilt = await rebuildObjectOnlyVideo(input, post);
    const metadata = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', rebuilt.outputFile], { encoding: 'utf8' }));
    assert.equal(metadata.streams.filter((stream) => stream.codec_type === 'video').length, 1);
    assert.equal(metadata.streams.find((stream) => stream.codec_type === 'video').width, 1280);
    assert.equal(metadata.streams.filter((stream) => stream.codec_type === 'audio').length, 1);
    assert.ok(Math.abs(Number(metadata.format.duration) - 2) < 0.2);
    const pixel = execFileSync('ffmpeg', ['-v', 'error', '-i', rebuilt.outputFile, '-frames:v', '1', '-vf', 'crop=2:2:0:0', '-pix_fmt', 'rgb24', '-f', 'rawvideo', 'pipe:1']);
    assert.ok(pixel[0] < 60 && pixel[1] < 60 && pixel[2] < 60, 'Original red video track must not be retained');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    if (rebuilt) fs.rmSync(path.dirname(rebuilt.outputFile), { recursive: true, force: true });
  }
});
