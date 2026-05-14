# Retromachina — Agent Quick Reference

## Structure

```
apps/api/     NestJS backend (nest start → port 3000, ws → port 3001)
apps/web/     React 19 + Vite 7 frontend (dev → port 8080)
packages/shared/  Shared TS library (exports from `.dist/`)
```

- Root `package.json` uses npm workspaces (`apps/*`, `packages/*`).
- No root `tsconfig.json` — each app has its own.
- Formatter/linter: Biome 2 (`biome.json`). lint-staged config is in root `package.json`.
- Turbo v2 manages monorepo tasks (`turbo.json`).
- `.nvmrc` = `v18.11.0`. `packageManager` = `npm@11.8.0`. `engines.node` = `>=24`.

## Commands

```bash
npm run dev              # turbo dev api + web (dotenvx loads .env)
npm run format           # biome check --write --no-errors-on-unmatched ./
npm run test             # turbo test (runs api jest + web playwright)
npm run build            # turbo build (api: nest build; web: vite build)
npm run storybook        # web only — must run from apps/web/
```

Per-app scripts live in `apps/api/package.json` and `apps/web/package.json`:
- `npm run migrate` (api) — `dotenvx run -f ../../.env -- npx prisma migrate dev`
- `npm run studio` (api) — `dotenvx run -f ../../.env -- npx prisma studio`
- `npm run test:ui` (web) — `dotenvx run -f ../../.env -- npx playwright test --ui`
- `npm run test:codegen` (web) — playwright codegen with first-user auth storage
- `npm run test:codegen2` (web) — playwright codegen with second-user auth storage

## .env

Copy `.env.template` → `.env`. Required vars:
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET` (api auth)
- `DATABASE_URL` (default `mysql://root:retro@localhost:3307/retro`)
- `RETRO_WEB_API_URL` (default `http://localhost:3000/api/rest/v1/`)
- `RETRO_WEB_SOCKET_URL` (default `http://localhost:3001`)
- `E2E_FIRST_*` / `E2E_SECOND_*` — e2e test credentials

## API

- Prisma schema: `apps/api/prisma/schema.prisma` → output `apps/api/generated/prisma`.
- After schema changes: `npm run generate` (api) → `prisma generate` + `prisma format`.
- NestJS 9. Target: ES2017, module: commonjs (so `require("@prisma/client")`, not ESM import).
- Auth: Google OAuth (`google.guard.ts` / `google.strategy.ts`) → JWT (`jwt.guard.ts` / `jwt.strategy.ts`).
- All routes require `@UseGuards(JwtAuthGuard)` unless in `auth.controller.ts`.
- Permissions: CASL ability-based via `AuthAbilityFactory` (`@casl/ability` + `@casl/prisma`).
- Jest: tests matching `*.spec.ts` in `apps/api/src/`.

## Web

- Entry: `apps/web/src/index.tsx` → `<App />` → `<AppRouter />`.
- State: Zustand (`apps/web/src/store/`).
- UI: shadcn/ui (new-york style, lucide icons, neutral baseColor, cssVariables) + Tailwind 4 (via `@tailwindcss/vite`). shadcn components live in `components/ui/`.
- API client: `axios` instance at `apps/web/src/api/AxiosInstance.ts` — intercepts JWT from localStorage.
- Storybook stories: `*.stories.tsx` alongside components.
- `tsconfig.json` has `@/*` path alias → `./src/*`.

## E2E tests

```bash
npm run test:ui            # web only — Playwright UI mode
npm run test:codegen       # web only — codegen with first-user auth
npm run test:codegen2      # web only — codegen with second-user auth
```

- Tests live in `apps/web/e2e/`.
- Require full stack running (api + web + db).
- Playwright `setup` project runs before `chromium` — create `*.setup.ts` files for auth fixtures.
- Auth storage: `apps/web/playwright/.auth/first-user.json` and `second-user.json`.
- E2e kills the dev server on exit — don't run e2e while dev is needed.

## Docker (local DB)

```bash
docker compose -f .docker/docker-compose.local.yaml up retro-db -d
```

- MariaDB 10.7 on `localhost:3307`, db `retro`, root password `retro`.
- No API container in local compose — api runs via `npm run dev`.

## Prisma schema entities

Team → User (via TeamUsers), Task, Retrospective, Board, BoardColumn, ReflectionCard, Invite.

## Gotchas

- Prisma client is ESM: `import { PrismaClient } from "generated/prisma/client"`.
- Root scripts use `dotenvx run -- turbo ...` — env must be in `.env`.
- Per-app scripts use `dotenvx run -f ../../.env -- ...` to load root `.env`.
- `turbo.json` has no `lint` script at root — use `npm run format` (Biome).
- Shared package exports via `./*` → `./.dist/*.js` — build with `tsc` first.
- Commit messages validated by Husky + commitlint (Conventional Commits).
- `npm run dev` must be run from the **root** directory.
