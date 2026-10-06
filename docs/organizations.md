# Organizations

Organizations are optional. A team can belong to at most one organization, while a user can belong to multiple organizations. Existing teams remain outside any organization after migration.

Any signed-in user can create an organization and becomes its owner. Owners and administrators manage organization membership and create teams within it. Users must have signed in to the application before they can be added; organization membership does not grant access to teams. Team permissions remain independent.

Moving a team or removing it from an organization requires the team owner role. Moving it into an organization also requires the owner or administrator role in the destination organization. The organization is selected in the team creation or editing form.

## URLs

Each organization chooses a globally unique subdomain when it is created. Subdomains allow lowercase ASCII letters, digits, and hyphens, up to 63 characters. Reserved system names such as `www`, `api`, `admin`, `team`, `retro`, and `organizations` are unavailable.

A team's URL is `https://<organization>.retromachine.eu/<team-slug>`. Slugs are generated from team names, for example `Zespół Łódź` → `zespol-lodz`. Collisions within the same organization receive suffixes such as `-2`, `-3`, and so on. A database index enforces uniqueness, and writes are retried when concurrent creation causes a collision. The same slug is allowed in different organizations. Renaming a team preserves its slug. Moving a team also preserves its slug unless it is already taken in the destination organization, in which case a suffix is added. Existing ID-based URLs continue to work.

A user's organizations appear in the account menu. The organization dashboard lists teams and lets administrators manage members. Regular members see only teams they belong to; administrators see the organization's team list, but accessing team data still requires team membership.

## Shared session and deployment

All subdomains must use the same central API and WebSocket server. The session uses an HttpOnly cookie on the API host, renewed for 30 days when the session is restored. In production, the cookie uses Secure and SameSite=Lax. In local development, the localhost API uses Secure and SameSite=None because browsers treat localhost and its subdomains as different sites; Chromium supports the local Secure exception. The frontend restores an in-memory token from the session for existing WebSocket and SSE connections; new tokens are not stored in `localStorage`. Existing Bearer authentication migrates to the cookie on first use. Signing out clears the shared cookie; other open tabs synchronize their state when they regain focus.

Before deployment:

1. Point DNS for `retromachine.eu` and the wildcard `*.retromachine.eu` to the application's reverse proxy. Do not serve other applications on organization subdomains.
2. Provide a TLS certificate covering both the root domain and wildcard subdomains.
3. Configure the reverse proxy to serve the same frontend on these hosts, with an SPA fallback for direct navigation to `/<slug>`. Keep the central REST API and WebSocket server at the URLs specified in the frontend configuration.
4. Build the frontend with `RETRO_WEB_ROOT_DOMAIN=retromachine.eu`, `RETRO_WEB_API_URL=https://retromachine.eu/api/rest/v1/`, and the appropriate central `RETRO_WEB_SOCKET_URL`. Frontend environment variables are embedded in the bundle; changing them requires rebuilding the container image.
5. Configure the API with `RETRO_ROOT_DOMAIN=retromachine.eu` and `RETRO_SESSION_SECURE=true` (the production Docker Compose configuration already sets this flag). Optional additional trusted origins can be supplied in `RETRO_ALLOWED_ORIGINS`, separated by commas. HTTPS origins on the root domain and single-level subdomains are allowed by default; untrusted origins cannot use cookie sessions.
6. Keep the central Google OAuth callback configured in `CALLBACK_URL` and the Google console. Post-login redirects allow only the application's own URLs.
7. Apply both new migrations with `npm run migrate:deploy --workspace=api`. The migration backfills existing team slugs without automatically assigning teams to organizations.

## Verification

Unit tests: `npm exec --workspace=api -- jest --runInBand --watchman=false`.

Real MariaDB integration test: build the `shared` and `api` workspaces, then run `node apps/api/test/organizations.integration.cjs`. The script uses the local `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, and `DATABASE_PASSWORD` settings, defaulting to the local Docker Compose database server. It creates a separate database with a random `retro_org_test_*` name, applies all migrations, verifies API behavior, and drops the database in `finally`. It does not use the application database.

Full browser test: also build the frontend with the central HTTPS URLs above, then run `node apps/api/test/organizations.integration.cjs --browser`. The test intercepts requests to the root domain and organization hosts in Playwright without changing DNS or production. It checks forms, menus, slug routing, session restoration on another subdomain, page reloads, and shared sign-out for both HTTPS and local localhost subdomains. The local scenario also verifies migration of a legacy token from `localStorage`. The test requires Chromium installed for Playwright. Screenshots are saved in the system's temporary directory.
