---
name: update-release-notes
description: Prepare or update the Retromachina web changelog entry in apps/web/src/changelog/releases.ts for an upcoming release, following docs/changelog.md. Use when drafting release notes, preparing a release, or synchronizing the changelog with a target release version.
---

# Update Retromachina Release Notes

Read `docs/changelog.md` completely before editing. Treat it as the source of truth for the release-note process, then inspect the current implementation and working tree so existing user changes are preserved.

## Prepare the entry

1. Determine the target stable `major.minor.patch` version from the user's request, the release/tag context, or the intended package version. Strip a leading `v` when present. If no target version can be established without guessing, ask the user for it.
2. Review changes since the preceding release tag or changelog version using local Git history and diffs. Do not require GitHub access when the local repository contains enough evidence.
3. Draft a short Polish title and concise, user-facing Polish change descriptions. Describe observable product changes, not commits, issue numbers, refactors, dependency bumps, or implementation details unless they materially affect users.
4. Prepend the new object to `releases` in `apps/web/src/changelog/releases.ts`. Preserve every older entry and avoid duplicating an existing version.

## Preserve package metadata

Do not update `apps/web/package.json`, `package-lock.json`, or any other package metadata when preparing release notes. In CI release builds, the GitHub Release tag supplies `APP_VERSION`; the changelog version is maintained only in `apps/web/src/changelog/releases.ts`.

Do not use `npm version`, create a Git tag, publish a release, commit, or push unless the user explicitly requests it.

## Verify

- Confirm versions are stable SemVer and the new release is ordered newest first.
- Run Biome on every edited source file.
- Run the web build when the edit changes runtime code.
- Summarize the generated release copy and identify the Git range used to derive it.
