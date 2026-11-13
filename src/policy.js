'use strict';

const { STATUSES } = require('./statuses');

// Customers can cancel online until this many hours before the appointment starts.
const CANCEL_CUTOFF_HOURS = 2;

const HOUR_MS = 60 * 60 * 1000;

function cancelCutoff(appointment) {
  return new Date(Date.parse(appointment.start) - CANCEL_CUTOFF_HOURS * HOUR_MS);
}

function canCancel(appointment, now = new Date()) {
  if (appointment.status !== STATUSES.BOOKED) {
    switch (appointment.status) {
      case STATUSES.CHECKED_IN:
        return { allowed: false, reason: 'Your vehicle is checked in, including key-drop vehicles. Contact your service advisor to discuss changes.' };
      case STATUSES.IN_SERVICE:
        return { allowed: false, reason: 'Your vehicle is in service. Contact your service advisor to discuss changes.' };
      case STATUSES.READY_FOR_PICKUP:
        return { allowed: false, reason: 'Your vehicle is ready for pickup and cannot be canceled online. Contact your service advisor to arrange pickup.' };
      case STATUSES.COMPLETED:
        return { allowed: false, reason: 'This appointment is completed and cannot be canceled. Contact your dealer if you have questions about the service.' };
      case STATUSES.CANCELED:
        return { allowed: false, reason: 'This appointment is already canceled. No further cancellation is needed.' };
      case STATUSES.NO_SHOW:
        return { allowed: false, reason: 'This appointment is marked as a no-show and cannot be canceled online. Call your dealer to book another appointment.' };
      default:
        return { allowed: false, reason: 'Only booked appointments can be canceled online. Contact your dealer to confirm this appointment\'s status.' };
    }
  }
  if (now.getTime() > cancelCutoff(appointment).getTime()) {
    return {
      allowed: false,
      reason: `Appointments can't be canceled online less than ${CANCEL_CUTOFF_HOURS} hours before the start time. Please call your dealer.`,
    };
  }
  return { allowed: true, reason: null };
}

function cancellationDetails(appointment, now = new Date()) {
  const decision = canCancel(appointment, now);
  return {
    cancelDeadline: cancelCutoff(appointment).toISOString(),
    canCancel: decision.allowed,
    cancellationReason: decision.reason,
  };
}

module.exports = { CANCEL_CUTOFF_HOURS, cancelCutoff, canCancel, cancellationDetails };
