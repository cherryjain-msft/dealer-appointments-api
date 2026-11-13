'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { canCancel, cancellationDetails } = require('../src/policy');

const HOUR_MS = 60 * 60 * 1000;
const now = new Date('2026-03-02T09:00:00.000Z');

function startsIn(hours, status = 'booked') {
  return { id: 'APT-1', status, start: new Date(now.getTime() + hours * HOUR_MS).toISOString() };
}

test('allows canceling a booked appointment before the cutoff', () => {
  assert.deepEqual(canCancel(startsIn(5), now), { allowed: true, reason: null });
});

test('allows the exact two-hour cutoff but refuses one millisecond later', () => {
  const appointment = startsIn(2);
  assert.deepEqual(cancellationDetails(appointment, now), {
    cancelDeadline: now.toISOString(), canCancel: true, cancellationReason: null,
  });
  const decision = canCancel(appointment, new Date(now.getTime() + 1));
  assert.equal(decision.allowed, false);
  assert.match(decision.reason, /2 hours.*call your dealer/);
});

test('computes the exact UTC deadline from an offset start time', () => {
  assert.deepEqual(cancellationDetails({ status: 'booked', start: '2026-03-02T08:30:45.123-05:00' }, now), {
    cancelDeadline: '2026-03-02T11:30:45.123Z', canCancel: true, cancellationReason: null,
  });
});

for (const [status, reason] of [
  ['checked_in', /checked in.*key-drop.*service advisor/],
  ['in_service', /in service.*service advisor/],
  ['ready_for_pickup', /ready for pickup.*service advisor/],
  ['completed', /completed.*dealer/],
  ['canceled', /already canceled.*No further cancellation/],
  ['no_show', /no-show.*dealer/],
  ['unknown', /Only booked.*dealer/],
]) {
  test(`refuses ${status} even before the cutoff with a status-specific next step`, () => {
    const decision = canCancel(startsIn(30, status), now);
    assert.equal(decision.allowed, false);
    assert.match(decision.reason, reason);
    assert.equal(canCancel(startsIn(-1, status), now).reason, decision.reason);
  });
}
