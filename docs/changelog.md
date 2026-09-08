# Publishing release notes

The changelog source is `apps/web/src/changelog/releases.ts`. Entries ship with
 the application build and require no API, GitHub token, or external service.

1. Before a release, prepend an entry to `releases` with a `version`, `date`
   (YYYY-MM-DD), short Polish `title`, and user-facing `changes` list.
2. Increase the version using stable `major.minor.patch` versions, such as
   `1.1.0`. The first entry defines the current release version in the UI.
   Update `apps/web/package.json` and the lockfile version for the release too.
3. Keep previous entries. Review the copy and deploy it with the code.
   A GitHub Release can reuse the description, but is not the UI data source.

The first authenticated visit saves the current version without opening the dialog.
On a later visit, a newer version opens the notes for all skipped releases.
The version is saved on entry, so dismissing the dialog and refreshing does not
open it again. A rollback never lowers the saved version. Versions are compared
numerically.

