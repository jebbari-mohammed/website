import http from 'node:http';

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
      // Private records are available only through the owner's local CLI.
      // A loopback address is not authentication for browser/other local clients.
      sendJson(res, 403, { ok: false, error: 'HTTP snapshot access is disabled. Use the local snapshot:refresh command.' });
      return;
    }

    sendJson(res, 404, { ok: false, error: 'Not found' });
  } catch {
    sendJson(res, 500, { ok: false, error: 'Request failed' });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Autonomous Marketing Employee worker listening on http://127.0.0.1:${port}`);
});
