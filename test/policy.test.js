'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { CANCEL_CUTOFF_HOURS, canCancel } = require('../src/policy');

const HOUR_MS = 60 * 60 * 1000;
const now = new Date('2026-03-02T09:00:00.000Z');

function startsIn(hours, status = 'booked') {
  return { id: 'APT-1', status, start: new Date(now.getTime() + hours * HOUR_MS).toISOString() };
}

test('online cancellation cutoff is 24 hours', () => {
  assert.equal(CANCEL_CUTOFF_HOURS, 24);
});

test('allows canceling a booked appointment before the cutoff', () => {
  assert.deepEqual(canCancel(startsIn(30), now), { allowed: true, reason: null });
});

test('refuses to cancel inside the cutoff and explains why', () => {
  const decision = canCancel(startsIn(5), now);
  assert.equal(decision.allowed, false);
  assert.match(decision.reason, /24 hours/);
});

test('refuses to cancel an appointment that is already canceled', () => {
  const decision = canCancel(startsIn(30, 'canceled'), now);
  assert.equal(decision.allowed, false);
  assert.match(decision.reason, /already canceled/);
});
