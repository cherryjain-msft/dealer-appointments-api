'use strict';

const { STATUSES } = require('./statuses');

// Customers can cancel online until this many hours before the appointment starts.
const CANCEL_CUTOFF_HOURS = 24;

const HOUR_MS = 60 * 60 * 1000;

function cancelCutoff(appointment) {
  return new Date(Date.parse(appointment.start) - CANCEL_CUTOFF_HOURS * HOUR_MS);
}

function canCancel(appointment, now = new Date()) {
  if (appointment.status === STATUSES.CANCELED) {
    return { allowed: false, reason: 'This appointment is already canceled.' };
  }
  if (now.getTime() > cancelCutoff(appointment).getTime()) {
    return {
      allowed: false,
      reason: `Appointments can't be canceled online less than ${CANCEL_CUTOFF_HOURS} hours before the start time. Please call your dealer.`,
    };
  }
  return { allowed: true, reason: null };
}

module.exports = { CANCEL_CUTOFF_HOURS, cancelCutoff, canCancel };
