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
4. Prepend the new object to `releases` in `apps/web/src/changelog/releases.ts`. Use the release date in `YYYY-MM-DD`, preserve every older entry, and avoid duplicating an existing version.

## Keep versions consistent

Inspect how `APP_VERSION` is supplied before changing package metadata. In CI release builds, the GitHub Release tag is forwarded into `apps/web/package.json` inside the Docker builder. Do not overwrite that mechanism.

When preparing a versioned release in the repository and `docs/changelog.md` still requires package synchronization, update `apps/web/package.json` and the matching web workspace version in `package-lock.json` to the same normalized version. Do not use `npm version`, create a Git tag, publish a release, commit, or push unless the user explicitly requests it.

## Verify

- Confirm versions are stable SemVer and the new release is ordered newest first.
- Run Biome on every edited source or JSON file.
- Run the web build when the edit changes runtime code or package metadata.
- Summarize the generated release copy and identify the Git range used to derive it.
