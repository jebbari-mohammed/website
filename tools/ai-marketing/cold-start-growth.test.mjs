import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  applyInternalLinkAction,
  buildPageInventory,
  chooseInternalLinkAction,
} from './cold-start-growth.mjs';

function page({ title, pathName, description, body, robots = 'index, follow', links = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
  <title>${title} | IZEM</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="${robots}">
  <link rel="canonical" href="https://youraicoach.life${pathName}">
</head>
<body>
  <main>
    <h1>${title}</h1>
    ${body}
    ${links}
  </main>
</body>
</html>`;
}

function paragraphs(topic, count = 35) {
  return Array.from({ length: count }, (_, index) =>
    `<p>${topic} practical step ${index + 1} explains workout accountability, fitness coaching, scheduling, fallback planning, and realistic consistency decisions for busy people.</p>`,
  ).join('\n');
}

async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'izem-cold-start-'));
  const blog = path.join(root, 'blog');
  await fs.mkdir(blog, { recursive: true });
  await fs.writeFile(path.join(blog, 'workout-accountability.html'), page({
    title: 'Workout Accountability App Decision Guide',
    pathName: '/blog/workout-accountability',
    description: 'Choose a workout accountability system by comparing proactive follow-up, fallback workouts, plan adaptation, and practical coaching support.',
    body: paragraphs('accountability app'),
  }));
  await fs.writeFile(path.join(blog, 'fitness-consistency.html'), page({
    title: 'How to Stay Consistent With Workouts',
    pathName: '/blog/fitness-consistency',
    description: 'Build workout consistency with a realistic schedule, fallback sessions, accountability, and weekly review instead of relying on motivation.',
    body: paragraphs('workout consistency'),
  }));
  await fs.writeFile(path.join(blog, 'ai-fitness-coach.html'), page({
    title: 'How an AI Fitness Coach Adapts Your Week',
    pathName: '/blog/ai-fitness-coach',
    description: 'Understand how an AI fitness coach can review missed sessions, adjust a workout week, and support better accountability decisions.',
    body: paragraphs('AI fitness coach'),
  }));
  await fs.writeFile(path.join(blog, 'private-page.html'), page({
    title: 'Private Draft',
    pathName: '/blog/private-page',
    description: 'This page must never participate in the indexable internal-link system because it is noindex.',
    body: paragraphs('private draft'),
    robots: 'noindex, follow',
  }));
  return root;
}

test('inventory excludes noindex pages and calculates indexable pages', async () => {
  const root = await fixture();
  const pages = await buildPageInventory(root);
  assert.equal(pages.length, 3);
  assert.equal(pages.some((entry) => entry.canonical.endsWith('/private-page')), false);
});

test('selects and applies a safe internal-link action without touching the target page', async () => {
  const root = await fixture();
  const pages = await buildPageInventory(root);
  const action = chooseInternalLinkAction(pages, 2);
  assert.ok(action);
  assert.equal(action.type, 'internal-links');
  assert.equal(action.sources.length, 2);
  assert.equal(action.sources.some((source) => source.file === action.target.file), false);

  const originalTarget = await fs.readFile(action.target.file, 'utf8');
  const changed = await applyInternalLinkAction(action);
  assert.equal(changed.length, 2);
  assert.equal(await fs.readFile(action.target.file, 'utf8'), originalTarget);

  for (const file of changed) {
    const html = await fs.readFile(file, 'utf8');
    assert.match(html, new RegExp(`SEO_ALWAYS_IMPROVE_LINK:${action.marker}`));
    assert.match(html, new RegExp(`href="${new URL(action.target.canonical).pathname}"`));
    assert.match(html, /<h2>Related resource<\/h2>/);
  }
});

test('the same action is idempotent and does not duplicate markers', async () => {
  const root = await fixture();
  const action = chooseInternalLinkAction(await buildPageInventory(root), 2);
  assert.ok(action);
  await applyInternalLinkAction(action);
  const changedAgain = await applyInternalLinkAction(action);
  assert.equal(changedAgain.length, 0);
  for (const source of action.sources) {
    const html = await fs.readFile(source.file, 'utf8');
    assert.equal((html.match(new RegExp(`SEO_ALWAYS_IMPROVE_LINK:${action.marker}`, 'g')) || []).length, 2);
  }
});

test('dry-run identifies files but leaves them unchanged', async () => {
  const root = await fixture();
  const action = chooseInternalLinkAction(await buildPageInventory(root), 1);
  assert.ok(action);
  const before = await fs.readFile(action.sources[0].file, 'utf8');
  const changed = await applyInternalLinkAction(action, { dryRun: true });
  assert.equal(changed.length, 1);
  assert.equal(await fs.readFile(action.sources[0].file, 'utf8'), before);
});
