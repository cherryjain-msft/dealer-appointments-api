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

Errors return JSON in the form `{ "error": "message" }`.

| Status | When |
| --- | --- |
| 404 | The appointment doesn't exist. |
| 409 | The appointment can't be canceled. The message explains why. |

## Cancellation rules

Customers can cancel online until **24 hours** before the appointment start time. Inside that window, the API returns `409` and asks the customer to call their dealer. An appointment that's already canceled can't be canceled again.

The cutoff is `CANCEL_CUTOFF_HOURS` in `src/policy.js`.

## Appointment statuses

`booked`, `checked_in`, `in_service`, `ready_for_pickup`, `completed`, `canceled` and `no_show`. See `src/statuses.js`.

## Scope

Authentication is out of scope for this demo. Every request acts as Jordan Lee.

## Related repositories

- [dealer-customer-portal](https://github.com/cherryjain-msft/dealer-customer-portal): the customer portal that calls this API.
- [dealer-help-center](https://github.com/cherryjain-msft/dealer-help-center): customer help articles.
