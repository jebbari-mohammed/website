import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { Writable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { load } from 'cheerio';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const quietConsole = { log() {}, warn() {}, error() {} };

// Compile actual application code while stubbing every runtime dependency. In
// particular, do not import core/index.js or config.ts: those can load .env.
function moduleFixture(file, modules = {}, globals = {}) {
  const context = {
    exports: {}, console: quietConsole,
    process: { cwd: () => ROOT, env: {}, argv: [] },
    require(name) {
      if (!Object.hasOwn(modules, name)) throw new Error(`Unexpected fixture import: ${name}`);
      return modules[name];
    },
    ...globals,
  };
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(output, context, { filename: file });
  return context;
}

function viteFixture(publicDir) {
  const context = moduleFixture('vite.config.ts', {
    vite: { defineConfig: value => value }, '@vitejs/plugin-react': () => ({}),
    'node:fs': fs, 'node:path': path,
  });
  let middleware;
  context.exports.staticPublicHtmlMiddleware(publicDir).configureServer({
    middlewares: { use(callback) { middleware = callback; } },
  });
  return { middleware, config: context.exports.default };
}

async function invokeMiddleware(middleware, url) {
  let body = '';
  let fellThrough = false;
  const headers = {};
  const response = new Writable({ write(chunk, _encoding, done) { body += chunk.toString(); done(); } });
  response.statusCode = 200;
  response.setHeader = (key, value) => { headers[key] = value; };
  const finished = new Promise((resolve, reject) => { response.on('finish', resolve); response.on('error', reject); });
  middleware({ url }, response, () => { fellThrough = true; response.end(); });
  await finished;
  return { body, fellThrough, headers, status: response.statusCode };
}

async function publicFixture(t) {
  const root = await fsp.mkdtemp(path.join(process.env.TMPDIR || '/tmp', 'izem-security-'));
  t.after(() => fsp.rm(root, { recursive: true, force: true }));
  const publicDir = path.join(root, 'public');
  await fsp.mkdir(path.join(publicDir, 'blog'), { recursive: true });
  await fsp.writeFile(path.join(publicDir, 'about.html'), '<h1>PUBLIC ABOUT</h1>');
  await fsp.writeFile(path.join(publicDir, 'blog/index.html'), '<h1>PUBLIC BLOG</h1>');
  await fsp.writeFile(path.join(publicDir, 'style.css'), 'body { color: green; }');
  await fsp.writeFile(path.join(root, 'outside.html'), '<h1>SYNTHETIC PRIVATE MARKER</h1>');
  return { root, publicDir, ...viteFixture(publicDir) };
}

test('development HTML middleware rejects raw/encoded traversal and malformed paths without reading the sibling fixture', async t => {
  const { middleware } = await publicFixture(t);
  for (const url of ['/../outside.html', '/%2e%2e/outside.html', '/..%2foutside.html', '/%2e%2e%2foutside.html', '/./about.html', '//outside.html', '/%5c../outside.html', '/%00.html', 'relative.html']) {
    const response = await invokeMiddleware(middleware, url);
    assert.equal(response.status, 403, url);
    assert.equal(response.fellThrough, false, url);
    assert.doesNotMatch(response.body, /SYNTHETIC PRIVATE MARKER/, url);
  }
  assert.equal((await invokeMiddleware(middleware, '/%ZZ.html')).status, 400);
});

test('development HTML middleware denies symlink escape but retains contained HTML aliases and leaves assets to Vite', async t => {
  const { root, publicDir, middleware, config } = await publicFixture(t);
  await fsp.symlink(path.join(root, 'outside.html'), path.join(publicDir, 'escape.html'));
  assert.equal((await invokeMiddleware(middleware, '/escape.html')).status, 403);
  for (const url of ['/about', '/about.html', '/about.html?test=synthetic']) {
    const response = await invokeMiddleware(middleware, url);
    assert.equal(response.status, 200);
    assert.equal(response.body, '<h1>PUBLIC ABOUT</h1>');
    assert.equal(response.headers['Content-Type'], 'text/html; charset=utf-8');
  }
  assert.equal((await invokeMiddleware(middleware, '/blog/')).body, '<h1>PUBLIC BLOG</h1>');
  for (const url of ['/style.css', '/assets/image.png', '/', '/missing']) {
    assert.equal((await invokeMiddleware(middleware, url)).fellThrough, true, url);
  }
  assert.equal(config.server.host, '127.0.0.1');
});

test('Docker publishes only the dashboard on loopback and exposes no worker host port', () => {
  const source = fs.readFileSync(path.join(ROOT, 'docker-compose.yml'), 'utf8');
  const published = [...source.matchAll(/^\s*-\s*"([^"\n]+:\d+)"\s*$/gm)].map(match => match[1]);
  assert.deepEqual(published, ['127.0.0.1:5173:5173']);
});

function workerFixture() {
  let handler, binding;
  moduleFixture('apps/worker/src/serve.ts', {
    'node:http': { createServer(callback) { handler = callback; return { listen(...args) { binding = args; } }; } },
  });
  async function request(method, url, headers = {}) {
    let status, body;
    await handler({ method, url, headers }, { writeHead(code) { status = code; }, end(value) { body = JSON.parse(value); } });
    return { status, body };
  }
  return { handler, binding, request };
}

test('private worker denies snapshots to all HTTP clients without importing private-data/config modules', async () => {
  const { request, binding } = workerFixture();
  assert.equal(binding[1], '127.0.0.1');
  assert.equal((await request('GET', '/health')).status, 200);
  for (const headers of [{}, { origin: 'https://untrusted.example' }, { origin: 'http://127.0.0.1:4317', authorization: 'Bearer synthetic' }]) {
    const response = await request('POST', '/snapshot', headers);
    assert.equal(response.status, 403);
    assert.equal(response.body.ok, false);
    assert.doesNotMatch(JSON.stringify(response.body), /latestDraft|latestAudit|latestRoadmap|recentLogs/);
  }
  assert.equal((await request('GET', '/snapshot')).status, 404);
});

test('private worker errors return a generic message rather than internal details', async () => {
  const { handler } = workerFixture();
  let first = true, status, body;
  await handler({ method: 'GET', url: '/health' }, {
    writeHead(code) { if (first) { first = false; throw new Error('SYNTHETIC PRIVATE FILE DETAIL'); } status = code; },
    end(value) { body = JSON.parse(value); },
  });
  assert.equal(status, 500);
  assert.equal(body.error, 'Request failed');
  assert.doesNotMatch(JSON.stringify(body), /PRIVATE FILE DETAIL/);
});

test('snapshot remains available through the local CLI without printing the private snapshot', async () => {
  let calls = 0;
  const output = [];
  const context = moduleFixture('apps/worker/src/cli.ts', {
    '../../../packages/agents/src/index.js': {},
    '../../../packages/core/src/index.js': { refreshDashboardIndex: async () => { calls++; return { latestDraft: 'SYNTHETIC PRIVATE RECORD' }; } },
  }, { process: { env: {}, argv: ['node', 'cli', 'snapshot:refresh'] }, console: { log: value => output.push(value), error: value => output.push(value) } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(context.process.exitCode, undefined);
  assert.equal(calls, 1);
  assert.doesNotMatch(output.join('\n'), /SYNTHETIC PRIVATE RECORD/);
});

const realPolicy = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/autonomy.policy.json'), 'utf8'));
const evaluatePolicy = moduleFixture('packages/core/src/policy.ts', {
  'node:fs/promises': {}, './paths.js': { paths: {} },
}).exports.evaluatePolicy;

function agentsFixture(policy) {
  const effects = { reads: 0, writes: 0, pushes: 0, generations: 0 };
  const record = { id: 'SYNTHETIC-RECORD', posts: [], validation: { approvalRequired: false, riskLevel: 'low' }, title: 'Synthetic' };
  const exports = moduleFixture('packages/agents/src/index.ts', {
    'node:fs/promises': { writeFile: async () => { effects.writes++; } }, 'node:path': path,
    '../../core/src/index.js': {
      evaluatePolicy, loadPolicy: async () => policy,
      loadLatestDraft: async () => { effects.reads++; return record; },
      loadLatestRoadmap: async () => { effects.reads++; return undefined; },
      saveRecord: async () => { effects.writes++; return '/tmp/synthetic.json'; },
      saveMarkdown: async () => { effects.writes++; return '/tmp/synthetic.md'; },
      logAction: async () => { effects.writes++; },
    },
    '../../content/src/index.js': {
      repurposeBlogDraft: () => record, socialCalendarToMarkdown: () => '', socialCalendarToCsv: () => '',
      createBlogDraft: async () => { effects.generations++; return record; }, blogDraftToMarkdown: () => '',
    },
    '../../seo/src/index.js': {
      runSiteAudit: async () => { effects.generations++; return record; }, siteAuditToMarkdown: () => '',
      createKeywordRoadmap: () => { effects.generations++; return record; }, roadmapToMarkdown: () => '',
    },
    '../../social/src/index.js': { pushCalendarDraftsToPostiz: async () => { effects.pushes++; return { reason: 'Synthetic draft push' }; } },
    './weekly.js': { generateWeeklyReport: async () => { effects.generations++; return record; }, weeklyReportToMarkdown: () => '' },
  }).exports;
  return { exports, effects };
}

test('manual approval-required actions are denied before any reads, writes, generation or external draft effect', async () => {
  const { exports, effects } = agentsFixture({ ...realPolicy, mode: 'manual' });
  for (const invoke of [
    () => exports.executeSiteAudit({}), () => exports.executeKeywordRoadmap({}),
    () => exports.executeBlogDraft({}), () => exports.executeSocialRepurpose({ pushPostiz: true }),
    () => exports.executeWeeklyReport(),
  ]) await assert.rejects(invoke, /Approval required/);
  assert.deepEqual(effects, { reads: 0, writes: 0, pushes: 0, generations: 0 });
});

test('Postiz approval/blocked decisions are checked before a permitted repurpose action writes its calendar', async () => {
  for (const policy of [
    { ...realPolicy, approvalThresholds: [{ action: 'postiz_push_draft', requiresApprovalAt: 'medium' }] },
    { ...realPolicy, approvalThresholds: [], blockedActions: [...realPolicy.blockedActions, 'postiz_push_draft'] },
  ]) {
    const { exports, effects } = agentsFixture(policy);
    await assert.rejects(() => exports.executeSocialRepurpose({ pushPostiz: true }), /Approval required|blocked by policy/);
    assert.deepEqual(effects, { reads: 0, writes: 0, pushes: 0, generations: 0 });
  }
});

test('explicitly permitted repurposing still works with fake storage and a fake Postiz draft client', async () => {
  const { exports, effects } = agentsFixture({ ...realPolicy, approvalThresholds: [] });
  await exports.executeSocialRepurpose({ pushPostiz: true });
  assert.equal(effects.pushes, 1);
  assert.equal(effects.reads, 1);
  assert.equal(effects.writes, 4);
});

function calculatorFixture(file, values, result) {
  const elements = Object.fromEntries(Object.entries(values).map(([id, value]) => [id, { value: String(value) }]));
  elements[`${result}-result`] = { style: {} };
  elements[`${result}-val`] = {};
  elements[`${result}-detail`] = {};
  const $ = load(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  const script = $('script:not([src])').filter((_i, element) => !$(element).attr('type')).first().html();
  const context = { document: { getElementById: id => elements[id] } };
  vm.runInNewContext(script, context, { filename: file });
  return { context, elements };
}

test('macro calculator rejects invalid/nonfinite/out-of-range baselines, unknown goals and nonpositive adjusted totals', () => {
  for (const [calories, goal] of [
    ['', 'maintain'], [0, 'maintain'], [-1, 'maintain'], ['Infinity', 'bulk'], ['NaN', 'maintain'], [100001, 'maintain'],
    [500, 'aggressivecut'], [750, 'aggressivecut'], [500, 'cut'], [2500, 'unexpected'],
  ]) {
    const { context, elements } = calculatorFixture('public/macro-calculator/index.html', { 'macro-cal': calories, 'macro-goal': goal }, 'macro');
    context.calcMacros();
    assert.equal(elements['macro-val'].textContent, 'Check your inputs', `${calories}/${goal}`);
    assert.doesNotMatch(elements['macro-detail'].innerHTML, /Protein: -|Carbs: -|Fat: -/);
  }
});

test('macro calculator retains its valid goal adjustment and 30/45/25 split', () => {
  for (const [goal, calories] of [['bulk', 2800], ['maintain', 2500], ['cut', 2000], ['aggressivecut', 1750]]) {
    const { context, elements } = calculatorFixture('public/macro-calculator/index.html', { 'macro-cal': 2500, 'macro-goal': goal }, 'macro');
    context.calcMacros();
    assert.equal(elements['macro-val'].textContent, `${calories} cal/day`);
    assert.equal(elements['macro-detail'].innerHTML, `Protein: ${Math.round(calories * .30 / 4)}g · Carbs: ${Math.round(calories * .45 / 4)}g · Fat: ${Math.round(calories * .25 / 9)}g (30/45/25 split)`);
  }
});

test('1RM calculator rejects invalid weights and repetitions outside its supported whole-number range', () => {
  for (const [weight, reps] of [[0, 8], [.001, 1], [.09, 8], [-100, 8], ['NaN', 8], ['Infinity', 8], [10001, 8], [100, 0], [100, -1], [100, 11], [100, 1.5], [100, 'Infinity'], [100, '']]) {
    const { context, elements } = calculatorFixture('public/1rm-calculator/index.html', { 'orm-weight': weight, 'orm-reps': reps }, 'orm');
    context.calcORM();
    assert.equal(elements['orm-val'].textContent, 'Check your inputs', `${weight}/${reps}`);
  }
});

test('1RM calculator preserves a single-repetition load and a positive low-weight boundary', () => {
  for (const [weight, reps, estimate] of [[100, 1, 100], [.1, 1, .1], [100, 8, 126.67], [100, 10, 133.33]]) {
    const { context, elements } = calculatorFixture('public/1rm-calculator/index.html', { 'orm-weight': weight, 'orm-reps': reps }, 'orm');
    context.calcORM();
    assert.equal(elements['orm-val'].textContent, estimate);
    assert.ok(elements['orm-val'].textContent > 0);
  }
});
