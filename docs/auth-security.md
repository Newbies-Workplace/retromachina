# Authentication security deployment (SEC-04 / SEC-05)

Access JWTs expire after 15 minutes, use HS256 and require the issuer
`retromachina`, audience `retromachina-api`, `exp`, and a live database session.
HTTP, all three Socket.IO namespaces and notification SSE enforce these checks.
Idle sockets disconnect and SSE streams complete at the access token deadline.
Commands and notification events also check session revocation in the database.

The browser renews access one minute before expiry and reconnects its transports.
A rotating, opaque refresh token lives in a host-only HttpOnly cookie for an
absolute seven days from login. Refresh does not extend that deadline. Consumed
refresh token hashes are retained until the session is removed; replay revokes
that session. Logout revokes the database session, clears the cookie, local
credentials and Axios Authorization header. Server revocation requires a successful
logout response: if the network request fails, the HttpOnly cookie may remain
valid and a reload can restore the session. Temporary network failures preserve
local credentials and retry renewal; an invalid refresh session requires login.
Supported browsers coordinate refresh and logout across tabs with Web Locks.
Browsers without Web Locks can race refresh requests across tabs; replay detection
fails closed and may require logging in again. Within one tab renewals are shared.

OAuth state is a random single-use nonce valid for ten minutes, bound to a second
random HttpOnly browser cookie. Only SHA-256 hashes are stored. Passport verifies
and atomically consumes the matching unexpired database record **before** code
exchange. Missing, malformed, changed, expired, wrong-browser and replayed state
are rejected. Starting another login replaces the binding cookie, so the latest
login attempt is the one that can complete. The frontend exchanges code/state
with credentials and deduplicates its callback effect under React Strict Mode.

## Rollout requirements

1. Apply `apps/api/prisma/migrations/20261006170000_auth_security/migration.sql`
   using the existing `migrate:deploy` command before starting the updated API.
   All API instances must share this database and the same JWT secret, Google
   configuration and callback URL. Keep instance clocks synchronized.
2. Deploy the API and frontend together. Old JWTs lacking expiry/session/issuer/
   audience are rejected immediately. Existing users must log in once again;
   there is no legacy-token grace period. Existing socket connections terminate
   when the old API processes stop during rollout.
3. Set the existing `CALLBACK_URL` to the exact public frontend callback URL.
   Its origin supplies the HTTP CORS allowlist and refresh/logout Origin check.
   Frontend requests use credentials; refresh/logout also require
   `X-Requested-With: Retromachina`. No new environment variable is required.
4. Serve production frontend and API over HTTPS on the **same site** (for example
   `app.example.com` and `api.example.com`). Cookie paths are
   `/api/rest/v1/auth` and `/api/rest/v1/google`, with SameSite=Lax and Secure when
   the callback uses HTTPS. Reverse proxies must preserve those public paths.
   Unrelated frontend/API domains do not support this cookie configuration.
5. Include expired AuthSession removal in database maintenance. Their refresh
   records cascade on deletion; do not remove consumed hashes of live sessions,
   because they are needed for replay detection. Expired OAuthState rows are
   cleaned when a login is initiated. Keep the database migration on rollback;
   running the old API reintroduces unbounded JWT issuance.

## Verification

Regression tests execute the actual Passport Google strategy with a synthetic
code exchange, state persistence shared by two service instances, session issuance,
rotation/replay, browser renewal/logout and active socket/SSE expiry. External
Google credentials and a production browser callback are not exercised by these
unit/integration tests. A local Chromium smoke check covers successful and rejected
callback navigation with mocked API responses. Verify the real Google callback and cookie delivery on
staging before production rollout.

Design references: [OAuth security best current practice](https://www.rfc-editor.org/rfc/rfc9700.html)
and [JWT best current practices](https://www.rfc-editor.org/rfc/rfc8725.html).
