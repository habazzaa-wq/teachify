# Instructor release on the current direct-path server

This is a prepared procedure, not an executed deployment. The live services use
`/var/www/teachify/apps/api` and `/var/www/teachify/apps/web` directly; there is
no configured `current`/`releases` switch. Do not run it until the isolated
database restore check and a maintenance window are complete.

## Preconditions

- Verify `ee6c2a7ba6ac43b5a6a108bf4a8a2e7e200cda77` is still the server base and
  the two release archives match `SHA256SUMS.txt` and the 56-path manifest.
- Confirm the private production dump can be restored to
  `teachify_instructor_restore_verify`, then compare its table counts and
  representative row counts with production. Never restore over `teachify`.
- Keep all six `has_instructors` values disabled.
- Verify the five existing server modifications are unchanged. They are not in
  either archive and must not be copied from or to another worktree.
- Protected paths that must be excluded from overlay and rollback:
  `apps/api/app/Http/Controllers/Api/v1/Tenant/TenantAuthController.php`,
  `apps/web/src/components/auth/ProtectedRoute.tsx`,
  `apps/web/src/components/auth/TenantGuestRoute.tsx`,
  `apps/web/src/providers/AuthProvider.tsx`, and
  `apps/web/src/stores/auth.store.ts`.
- Record SHA256 hashes of those five files immediately before overlay; compare
  them after overlay and after any rollback. Stop if a hash changes. Never
  restore or remove these files from a feature snapshot.
- Verify `apps/web/src/config/env.ts` line 108 is exactly
  `return `${protocol}//${hostname}`;`. The release does not contain this file.
- Confirm `/var/www/teachify` has sufficient private storage for a file-level
  snapshot and the previous web `.next` build. Confirm the FPM OPcache timestamp
  policy and identify exact PM2 process IDs before deciding which processes
  need a controlled reload.

## Staged overlay and migration order

1. Copy the two archives, manifest, and checksum file to a new, owner-only
   directory outside `apps`, for example
   `/home/deplo/.local/share/teachify-releases/<release-id>/`. Verify checksums
   and archive entries again on the server. Do not extract into a live path.
2. Derive a newline-delimited path list from only the 56 `apps/...` entries in
   the manifest. Extract both archives to a staging directory. Compare every
   extracted path and file hash to the manifest and expected archive split:
   two migration paths in identity-then-assignment order, then 54 application
   paths. Refuse absolute paths, `..`, duplicates, and paths outside `apps/`.
   Keep the extraction root private (`0700`), but normalize source files to
   `0644` and source directories to `0755` before overlay; the private-release
   umask must not make PHP files unreadable to PHP-FPM.
3. Before any live write, create a mode-700 snapshot directory outside
   `apps`. Save the pre-release state of each allowlisted path that currently
   exists, and record separately which allowlisted paths are absent. Do not
   snapshot/restore by replacing the whole `apps` tree. Record checksums for
   the five unrelated dirty files and the protected `env.ts` line.
4. Enter the approved maintenance window. Copy only the two staged migration
   files to `apps/api/database/migrations/`, using a temporary file in that
   destination directory followed by rename. Keep the old application code
   serving until both additive migrations are independently verified:

   ```bash
   cd /var/www/teachify/apps/api
   php artisan migrate:status --path=database/migrations/2026_10_26_000001_add_instructor_identity_to_tenant_users_table.php
   php artisan migrate --force --path=database/migrations/2026_10_26_000001_add_instructor_identity_to_tenant_users_table.php
   php artisan migrate:status --path=database/migrations/2026_10_26_000001_add_instructor_identity_to_tenant_users_table.php
   php artisan migrate --force --path=database/migrations/2026_10_28_000001_add_instructor_assignment_managed_to_courses_table.php
   php artisan migrate:status --path=database/migrations/2026_10_28_000001_add_instructor_assignment_managed_to_courses_table.php
   ```

   Stop immediately if a command fails or either migration is not recorded as
   applied. Do not run `migrate:fresh`, seeders, reset commands, or destructive
   SQL.
5. Only after both migrations are verified, overlay the 54 application files
   individually. For each destination, copy to a temporary sibling file while
   preserving mode/owner where possible, then rename it over that exact
   allowlisted file. Never copy a directory tree wholesale. Build the web app
   with Webpack in a private staging directory before the live overlay (the
   staging `node_modules` link is outside Turbopack's allowed filesystem root);
   activate the staged `.next` build only after it has been snapshotted. Clear
   the Laravel route cache and restart only the frontend and specifically
   identified Laravel
   workers that need the new code; never use `pm2 restart all`.
6. Verify API/web health, same-origin login for a custom domain, migration
   status, the unchanged five dirty files, unchanged `env.ts` line 108, and
   disabled production flags. Keep the maintenance window until those checks
   pass. Do not enable Instructor flags as part of deployment.

## Rollback

- If either migration fails, stop before installing application code. Leave the
  additive schema state untouched and restore service availability with the
  old application code; investigate the migration before retrying.
- If an application overlay, build, restart, or health check fails, keep flags
  off and restore only the allowlisted paths from the pre-release snapshot.
  Remove only allowlisted files recorded as absent before deployment. Restore
  the previous `.next` build from its snapshot and restart only the processes
  that were stopped/restarted for this release.
- Keep the two additive migration source files and their applied database
  records after an application rollback; do not automatically reverse them.
- Verify the five unrelated files and `env.ts` line 108 against their recorded
  pre-deploy checksums/content. Never restore the whole repository or `apps`
  directory.
- The protected five-file checksum comparison is a stop condition both before
  declaring deployment healthy and after rollback; do not silently restore
  their prior contents because their live behavior may have changed.
- Do not automatically roll back either database migration. The identity
  migration can remove Instructor identity/password state and the assignment
  migration can remove assignment-management state. Any schema rollback
  requires a separate data-impact decision and a verified recovery point.

`apps/scripts/deploy-instructor-release.ps1` performs local artifact checks and
a read-only server preflight only. It deliberately refuses to write into the
current direct-path layout; this runbook does not change that guard or run any
production operation.
