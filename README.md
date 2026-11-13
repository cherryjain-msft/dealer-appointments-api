# dealer-appointments-api

Service appointment API for the dealer network's customer-facing apps. It's the system of record for service appointments. [dealer-customer-portal](https://github.com/cherryjain-msft/dealer-customer-portal) reads and cancels appointments through it.

> Fictional demo service. Data is kept in memory and resets when the server restarts.

## Run it

Requires Node.js 20 or later. There are no dependencies to install.

```bash
npm start   # http://localhost:4000
npm test
```

Set `PORT` to use a different port.

Seed data belongs to the demo customer Jordan Lee. Start times are generated relative to the current time so the cancellation rules can be exercised at any time of day.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Health check. |
| GET | `/api/appointments` | The customer's appointments, sorted by start time. |
| GET | `/api/appointments/:id` | One appointment. |
| POST | `/api/appointments/:id/cancel` | Cancel an appointment. |

Errors retain the JSON field `error` containing a customer-facing message.
Cancellation refusals (`409`) also include `appointment`: the current full appointment
with the cancellation fields below. The portal can use it to refresh a stale decision.
Missing appointments (`404`) return only `{ "error": "message" }`.

| Status | When |
| --- | --- |
| 404 | The appointment doesn't exist. |
| 409 | The appointment can't be canceled. The message explains why. |

## Cancellation rules

Only **booked** appointments can be canceled online, until **2 hours** before
the appointment start time, including the exact cutoff instant. After that,
the API returns `409` and asks the customer to call their dealer. Checked-in
vehicles (including key-drop vehicles) and vehicles in service require contacting
the service advisor. Other statuses receive a status-specific explanation and next step.

There are **no late-cancellation or no-show fees** under cancellation policy v2,
effective October 1, 2026. Online rescheduling is out of scope.

The cutoff is `CANCEL_CUTOFF_HOURS` in `src/policy.js`.

### Appointment cancellation fields

List, get and successful cancel responses preserve all existing appointment fields
and add these fields to each appointment:

| Field | Type | Meaning |
| --- | --- | --- |
| `cancelDeadline` | string | UTC ISO 8601 timestamp: `start` minus exactly 2 hours. Present for every status; a deadline alone does not imply eligibility. |
| `canCancel` | boolean | True only when status is `booked` and the server's current time is at or before `cancelDeadline`. |
| `cancellationReason` | string or null | Customer-facing refusal explanation and next step; null if and only if `canCancel` is true. |

These fields are computed on every request, not stored. Display the exact deadline
in the customer's appropriate local time. The cancel endpoint rechecks status and
time rather than trusting previously fetched eligibility. Successful cancellation
returns `status: "canceled"`, `canceledAt`, `canCancel: false` and the already-canceled reason.

## Appointment statuses

| Value | Customer label |
| --- | --- |
| `booked` | Booked |
| `checked_in` | Checked in |
| `in_service` | In service |
| `ready_for_pickup` | Ready for pickup |
| `completed` | Completed |
| `canceled` | Canceled |
| `no_show` | No-show |

Values remain defined in `src/statuses.js`. Consumers show the labels rather than
raw values. Completed, canceled and no-show appointments belong under **Past and
canceled** for 90 days after their start time; all other statuses belong under
**Upcoming**. This demo API continues returning stored appointments without
filtering or deleting history, so consumers apply the display grouping and window.

## Scope

Authentication is out of scope for this demo. Every request acts as Jordan Lee.

## Related repositories

- [dealer-customer-portal](https://github.com/cherryjain-msft/dealer-customer-portal): the customer portal that calls this API.
- [dealer-help-center](https://github.com/cherryjain-msft/dealer-help-center): customer help articles.
