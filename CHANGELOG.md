# Changelog

## 1.4.0 (2025-04-14)

- Changed the online cancellation cutoff from 48 hours to 24 hours before the start time (cancellation policy v1).
- Cancellation refusals return `409` with a message that tells the customer to call their dealer.

## 1.3.0 (2025-01-20)

- Added `GET /api/appointments/:id`.
- Canceled appointments now include `canceledAt`.

## 1.2.0 (2024-08-05)

- Added the `no_show` status.

## 1.1.0 (2024-03-11)

- Added `POST /api/appointments/:id/cancel` with a 48-hour online cancellation cutoff (cancellation policy v0).

## 1.0.0 (2024-01-15)

- First release: list appointments for the signed-in customer.
