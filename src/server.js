'use strict';

const http = require('node:http');
const { AppointmentError, createStore } = require('./store');

const PORT = Number(process.env.PORT) || 4000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function send(res, status, body) {
  if (body === undefined) {
    res.writeHead(status, CORS_HEADERS);
    res.end();
    return;
  }
  res.writeHead(status, { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function route(store, req, res) {
  const { pathname } = new URL(req.url, 'http://localhost');

  if (req.method === 'OPTIONS') return send(res, 204);
  if (req.method === 'GET' && pathname === '/api/health') return send(res, 200, { status: 'ok' });
  if (req.method === 'GET' && pathname === '/api/appointments') {
    return send(res, 200, { appointments: store.list() });
  }

  const match = pathname.match(/^\/api\/appointments\/([A-Za-z0-9-]+)(\/cancel)?$/);
  if (match) {
    const [, id, cancel] = match;
    if (!cancel && req.method === 'GET') return send(res, 200, store.get(id));
    if (cancel && req.method === 'POST') return send(res, 200, store.cancel(id));
    return send(res, 405, { error: 'Method not allowed.' });
  }

  return send(res, 404, { error: 'Not found.' });
}

function createServer(store = createStore()) {
  return http.createServer((req, res) => {
    req.resume();
    try {
      route(store, req, res);
    } catch (err) {
      if (err instanceof AppointmentError) {
        send(res, err.status, {
          error: err.message,
          ...(err.appointment ? { appointment: err.appointment } : {}),
        });
        return;
      }
      console.error(err);
      send(res, 500, { error: 'Something went wrong.' });
    }
  });
}

if (require.main === module) {
  createServer().listen(PORT, () => {
    console.log(`dealer-appointments-api listening on http://localhost:${PORT}`);
  });
}

module.exports = { createServer };
