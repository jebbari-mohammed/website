import http from 'node:http';
import { refreshDashboardIndex } from '../../../packages/core/src/index.js';

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

server.listen(port, () => {
  console.log(`Autonomous Marketing Employee worker listening on http://localhost:${port}`);
});
