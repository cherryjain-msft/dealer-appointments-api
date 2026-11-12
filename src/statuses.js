'use strict';

const STATUSES = Object.freeze({
  BOOKED: 'booked',
  CHECKED_IN: 'checked_in',
  IN_SERVICE: 'in_service',
  READY_FOR_PICKUP: 'ready_for_pickup',
  COMPLETED: 'completed',
  CANCELED: 'canceled',
  NO_SHOW: 'no_show',
});

const ALL_STATUSES = Object.freeze(Object.values(STATUSES));

module.exports = { STATUSES, ALL_STATUSES };
