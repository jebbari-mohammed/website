import http from 'node:http';
import { refreshDashboardIndex } from '../../../packages/core/src/index.js';
import { executeGeoOptimization } from '../../../packages/agents/src/index.js';

const port = Number(process.env.MARKETING_WORKER_PORT || 4317);

function sendJson(res: http.ServerResponse, status: number, value: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(value));
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      sendJson(res, 200, { ok: true, service: 'autonomous-marketing-employee-worker' });
      return;
    }

    if (req.method === 'POST' && req.url === '/snapshot') {
      sendJson(res, 200, await refreshDashboardIndex());
      return;
    }

    sendJson(res, 404, { ok: false, error: 'Not found' });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

function startDailyGeoScheduler() {
  const ONE_HOUR = 60 * 60 * 1000;
  let lastRunDate = '';

  setInterval(async () => {
    const today = new Date().toISOString().split('T')[0];
    if (lastRunDate !== today) {
      console.log(`[GEO Cron] Starting daily GEO score optimization task for date ${today}...`);
      try {
        const result = await executeGeoOptimization({ apply: true });
        console.log(`[GEO Cron] Success. Audited ${result.report.pages.length} pages, average score ${result.report.averageScore}/100. Applied ${result.report.appliedOptimizationsCount} patches.`);
        lastRunDate = today;
      } catch (err) {
        console.error('[GEO Cron] Run failed:', err instanceof Error ? err.message : err);
      }
    }
  }, ONE_HOUR);

  // Run once immediately on start after 5 seconds to verify correct setup
  setTimeout(async () => {
    const today = new Date().toISOString().split('T')[0];
    console.log(`[GEO Cron] Running initial GEO score optimization check on startup...`);
    try {
      const result = await executeGeoOptimization({ apply: true });
      console.log(`[GEO Cron] Initial check complete. Average score: ${result.report.averageScore}/100. Applied patches: ${result.report.appliedOptimizationsCount}`);
      lastRunDate = today;
    } catch (err) {
      console.error('[GEO Cron] Initial check failed:', err instanceof Error ? err.message : err);
    }
  }, 5000);
}

server.listen(port, () => {
  console.log(`Autonomous Marketing Employee worker listening on http://localhost:${port}`);
  startDailyGeoScheduler();
});
