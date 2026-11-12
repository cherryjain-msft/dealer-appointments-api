# Copilot instructions

- Node.js 20+, CommonJS and no npm dependencies. Use built-in modules only, such as `node:http`, `node:test` and `node:assert`.
- Keep business rules in `src/policy.js` and status values in `src/statuses.js`. Keep `src/server.js` thin.
- Throw `AppointmentError` for expected failures: 404 when an appointment doesn't exist and 409 when an action isn't allowed. Error messages are shown to customers, so make them clear.
- Use US English. Status values and copy use "canceled" with one l.
- `dealer-customer-portal` consumes this API. Keep responses backward compatible: add fields instead of renaming or removing them.
- Add or update tests with every behavior change, and run `npm test`.
