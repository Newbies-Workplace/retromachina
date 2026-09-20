# Repository Guidelines

## Project Structure & Module Organization

This is an npm workspaces monorepo coordinated by Turborepo.

- `apps/web/`: React/Vite frontend. UI lives in `src/components`, screens in `src/views`, state in `src/context` and `src/store`, and media in `src/assets`.
- `apps/api/`: NestJS backend. Features live in `src/<feature>` with controllers, services, modules, gateways, and converters. Prisma schema and migrations are in `apps/api/prisma`.
- `packages/shared/`: contracts and domain types shared by both apps.
- `apps/web/e2e/`: Playwright specs, fixtures, helpers, and page objects.
- `docs/`: project-maintenance documentation.

Keep feature code in its owning workspace; put cross-app contracts in `packages/shared` rather than duplicating types.

## Build, Test, and Development Commands

Use Node 24+ and npm 11. Copy `.env.template` to `.env` before local development.

- `npm ci`: install lockfile-defined dependencies.
- `docker compose -f .docker/docker-compose.local.yaml up retro-db -d`: start MariaDB locally.
- `npm run dev`: run all services; the web app uses `http://localhost:8080`.
- `npm run build`: generate Prisma artifacts and build all workspaces.
- `npm test`: run workspace test tasks, including Playwright end-to-end tests.
- `npm exec --workspace=api -- jest`: run backend unit tests directly.
- `npm run format`: apply Biome formatting, import organization, and lint fixes.
- `npm run storybook --workspace=web`: launch the component catalog on port 6006.

## Coding Style & Naming Conventions

Write TypeScript with two-space indentation and let Biome enforce formatting and lint rules. Prefer typed interfaces over `any`; resolve warnings for non-null assertions and hook dependencies. Use `PascalCase` for React components and classes, `camelCase` for functions and variables, `useX` for hooks, and feature-oriented filenames such as `retro.gateway.ts`. Follow established suffixes such as `.controller.ts`, `.service.ts`, and `.converter.ts`.

## Testing Guidelines

Backend Jest tests live beside source as `*.spec.ts`. Playwright tests use `apps/web/e2e/*.spec.ts`; reusable interactions belong in page objects or helpers. Add regression coverage for changed behavior, including relevant failure cases. No numeric coverage threshold is enforced. Playwright requires the local database and valid environment/auth fixtures.

## Commit & Pull Request Guidelines

Use Conventional Commits: `feat: add archive filter` or `fix(api): reject expired invite`. Husky and commitlint validate messages. Keep commits focused. Pull requests should explain the change and verification, link issues, call out migrations or environment changes, and include screenshots for visible UI changes. Ensure Biome, builds, and relevant tests pass before review.
