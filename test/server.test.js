'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../src/server');
const { createStore } = require('../src/store');

const fixedNow = new Date('2026-03-02T09:15:00.000Z');

async function withServer(fn) {
  const server = createServer(createStore({ now: () => fixedNow }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

test('lists appointments in start-time order', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/appointments`);
    assert.equal(res.status, 200);
    const { appointments } = await res.json();
    assert.equal(appointments.length, 5);
    const starts = appointments.map((a) => Date.parse(a.start));
    assert.deepEqual(starts, [...starts].sort((a, b) => a - b));
  });
});

test('cancels a booked appointment before the cutoff', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/appointments/APT-1002/cancel`, { method: 'POST' });
    assert.equal(res.status, 200);
    const appointment = await res.json();
    assert.equal(appointment.status, 'canceled');
    assert.ok(appointment.canceledAt);
  });
});

test('returns 409 with a reason inside the cutoff', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/appointments/APT-1001/cancel`, { method: 'POST' });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.match(body.error, /24 hours/);
  });
});

test('returns 404 for an unknown appointment', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/appointments/APT-9999/cancel`, { method: 'POST' });
    assert.equal(res.status, 404);
  });
});
