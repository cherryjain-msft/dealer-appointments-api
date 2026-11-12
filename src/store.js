'use strict';

const { STATUSES } = require('./statuses');
const { canCancel } = require('./policy');

class AppointmentError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'AppointmentError';
    this.status = status;
  }
}

const HOUR_MS = 60 * 60 * 1000;

function nextHour(date) {
  const rounded = new Date(date.getTime());
  rounded.setMinutes(0, 0, 0);
  return new Date(rounded.getTime() + HOUR_MS);
}

// Demo data for one customer, generated relative to the current time so the
// cancellation rules can be exercised at any time of day.
function seedAppointments(now = new Date()) {
  const base = nextHour(now).getTime();
  const at = (hours) => new Date(base + hours * HOUR_MS).toISOString();
  const customer = 'Jordan Lee';
  const dealer = 'Northgate Service Center';
  return [
    { id: 'APT-1001', customer, dealer, vehicle: '2022 compact SUV', service: 'Oil and filter change', start: at(5), status: STATUSES.BOOKED },
    { id: 'APT-1002', customer, dealer, vehicle: '2021 midsize sedan', service: 'Tire rotation', start: at(30), status: STATUSES.BOOKED },
    { id: 'APT-1003', customer, dealer, vehicle: '2020 minivan', service: '30,000-mile maintenance', start: at(40), status: STATUSES.CHECKED_IN, checkedInAt: new Date(now.getTime() - HOUR_MS).toISOString() },
    { id: 'APT-1004', customer, dealer, vehicle: '2022 compact SUV', service: 'Cabin air filter replacement', start: at(96), status: STATUSES.CANCELED, canceledAt: new Date(now.getTime() - 26 * HOUR_MS).toISOString() },
    { id: 'APT-1005', customer, dealer, vehicle: '2020 minivan', service: 'Tire replacement', start: at(-9 * 24), status: STATUSES.COMPLETED },
  ];
}

function createStore({ now = () => new Date(), appointments } = {}) {
  const items = new Map();
  for (const appointment of appointments ?? seedAppointments(now())) {
    items.set(appointment.id, { ...appointment });
  }

  function find(id) {
    const appointment = items.get(id);
    if (!appointment) throw new AppointmentError(`Appointment ${id} was not found.`, 404);
    return appointment;
  }

  return {
    list() {
      return [...items.values()]
        .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
        .map((appointment) => ({ ...appointment }));
    },

    get(id) {
      return { ...find(id) };
    },

    cancel(id) {
      const appointment = find(id);
      const decision = canCancel(appointment, now());
      if (!decision.allowed) throw new AppointmentError(decision.reason, 409);
      appointment.status = STATUSES.CANCELED;
      appointment.canceledAt = now().toISOString();
      return { ...appointment };
    },
  };
}

module.exports = { AppointmentError, createStore, seedAppointments };
