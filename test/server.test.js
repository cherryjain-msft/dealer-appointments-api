'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../src/server');
const { createStore } = require('../src/store');

const fixedNow = new Date('2026-03-02T09:15:00.000Z');

async function withServer(fn, store = createStore({ now: () => fixedNow })) {
  const server = createServer(store);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

test('lists appointments in start-time order with cancellation details matching get', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/appointments`);
    assert.equal(res.status, 200);
    const { appointments } = await res.json();
    assert.equal(appointments.length, 5);
    const starts = appointments.map((a) => Date.parse(a.start));
    assert.deepEqual(starts, [...starts].sort((a, b) => a - b));
    for (const appointment of appointments) {
      assert.equal(appointment.cancelDeadline, new Date(Date.parse(appointment.start) - 2 * 60 * 60 * 1000).toISOString());
      assert.equal(appointment.canCancel, appointment.status === 'booked');
      assert.equal(appointment.cancellationReason === null, appointment.canCancel);
      const single = await fetch(`${base}/api/appointments/${appointment.id}`);
      assert.equal(single.status, 200);
      assert.deepEqual(await single.json(), appointment);
    }
  });
});

test('cancels a booked appointment before the cutoff', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/appointments/APT-1001/cancel`, { method: 'POST' });
    assert.equal(res.status, 200);
    const appointment = await res.json();
    assert.equal(appointment.status, 'canceled');
    assert.equal(appointment.canceledAt, fixedNow.toISOString());
    assert.equal(appointment.canCancel, false);
    assert.match(appointment.cancellationReason, /already canceled/);
    const get = await fetch(`${base}/api/appointments/APT-1001`);
    assert.deepEqual(await get.json(), appointment);
    const retry = await fetch(`${base}/api/appointments/APT-1001/cancel`, { method: 'POST' });
    assert.equal(retry.status, 409);
    assert.deepEqual(await retry.json(), { error: appointment.cancellationReason, appointment });
  });
});

test('rechecks a stale decision after the exact cutoff and returns current details without canceling', async () => {
  let currentTime = fixedNow;
  const store = createStore({
    now: () => currentTime,
    appointments: [{ id: 'APT-1', start: '2026-03-02T11:15:00.000Z', status: 'booked' }],
  });
  await withServer(async (base) => {
    const before = await fetch(`${base}/api/appointments/APT-1`);
    const eligible = await before.json();
    assert.equal(eligible.canCancel, true);
    currentTime = new Date(fixedNow.getTime() + 1);
    const res = await fetch(`${base}/api/appointments/APT-1/cancel`, { method: 'POST' });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.match(body.error, /2 hours.*call your dealer/);
    assert.deepEqual(body.appointment, {
      ...eligible, canCancel: false, cancellationReason: body.error,
    });
    const after = await fetch(`${base}/api/appointments/APT-1`);
    assert.deepEqual(await after.json(), body.appointment);
    assert.equal(Object.hasOwn(body.appointment, 'canceledAt'), false);
  }, store);
});

test('cancels at the inclusive cutoff using one clock reading for the decision and timestamp', async () => {
  let clockReads = 0;
  const store = createStore({
    now: () => new Date(fixedNow.getTime() + clockReads++),
    appointments: [{ id: 'APT-1', start: '2026-03-02T11:15:00.000Z', status: 'booked' }],
  });
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/appointments/APT-1/cancel`, { method: 'POST' });
    assert.equal(res.status, 200);
    const appointment = await res.json();
    assert.equal(appointment.status, 'canceled');
    assert.equal(appointment.cancelDeadline, fixedNow.toISOString());
    assert.equal(appointment.canceledAt, fixedNow.toISOString());
    assert.equal(appointment.canCancel, false);
    assert.equal(clockReads, 1);
  }, store);
});

test('refuses key-drop checked-in vehicles before the cutoff without changing them', async () => {
  await withServer(async (base) => {
    const before = await fetch(`${base}/api/appointments/APT-1003`);
    const appointment = await before.json();
    const res = await fetch(`${base}/api/appointments/APT-1003/cancel`, { method: 'POST' });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.match(body.error, /checked in.*key-drop.*service advisor/);
    assert.deepEqual(body.appointment, appointment);
    const after = await fetch(`${base}/api/appointments/APT-1003`);
    assert.deepEqual(await after.json(), appointment);
  });
});

test('returns 404 for an unknown appointment', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/appointments/APT-9999/cancel`, { method: 'POST' });
    assert.equal(res.status, 404);
    assert.deepEqual(await res.json(), { error: 'Appointment APT-9999 was not found.' });
  });
});
