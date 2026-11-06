# Teachify Instructor Release Preparation

Snapshot: 2026-10-28, branch `deploy`. No files were staged or committed; no production database, deployment, or tenant flag was touched. No persistent database migration was run. Current production feature-flag values were not queried and remain unverified. PHPUnit used the configured in-memory SQLite database.

## Worktree reconciliation

Initial status: 41 tracked modifications, 24 untracked files, 0 staged. The prior Instructor inventory could not be found in the accessible session history, so a line-by-line comparison to that earlier report is unavailable. The following is the exact current Instructor release manifest identified from the worktree. The dedicated checklist itself is output-only and excluded from the package.

### Required tracked modifications (32; all unstaged `M`)

- `apps/api/app/Http/Controllers/Api/v1/Assignments/AssignmentGradingController.php`
- `apps/api/app/Http/Controllers/Api/v1/Assignments/LessonAssignmentController.php`
- `apps/api/app/Http/Controllers/Api/v1/Courses/CourseController.php`
- `apps/api/app/Http/Controllers/Api/v1/Courses/CourseLessonController.php`
- `apps/api/app/Http/Controllers/Api/v1/Platform/TenantController.php`
- `apps/api/app/Http/Controllers/Api/v1/Quizzes/LessonQuizController.php`
- `apps/api/app/Http/Controllers/Api/v1/Quizzes/QuizQuestionController.php`
- `apps/api/app/Http/Controllers/Api/v1/StudentController.php`
- `apps/api/app/Http/Middleware/EnsureActiveTenantMembership.php`
- `apps/api/app/Http/Middleware/IdentifyTenant.php`
- `apps/api/app/Http/Resources/TenantResource.php`
- `apps/api/app/Models/Course.php`
- `apps/api/app/Models/TenantUser.php`
- `apps/api/app/Policies/CourseLessonPolicy.php`
- `apps/api/app/Policies/CourseModulePolicy.php`
- `apps/api/app/Policies/CoursePolicy.php`
- `apps/api/app/Policies/CourseSectionPolicy.php`
- `apps/api/app/Repositories/CourseRepository.php`
- `apps/api/app/Services/Auth/AuthenticationService.php`
- `apps/api/app/Services/Auth/InvitationService.php`
- `apps/api/app/Services/Courses/CourseLessonService.php`
- `apps/api/app/Services/Courses/CourseSectionService.php`
- `apps/api/app/Services/Courses/CourseService.php`
- `apps/api/app/Services/Platform/TenantCreationService.php`
- `apps/api/app/Services/Tenant/TenantUserService.php`
- `apps/api/bootstrap/app.php`
- `apps/api/routes/api.php`
- `apps/api/tests/Feature/PlatformTenantProvisioningTest.php`
- `apps/web/src/features/platform-tenants/components/TenantEditDialog.tsx`
- `apps/web/src/features/platform-tenants/services/platformTenantsApiService.ts`
- `apps/web/src/features/platform-tenants/services/tenantsService.ts`
- `apps/web/src/features/platform-tenants/types/index.ts`

### Required untracked new files (24)

- `apps/api/app/Http/Controllers/Api/v1/Instructor/InstructorAuthController.php`
- `apps/api/app/Http/Controllers/Api/v1/Instructor/InstructorController.php`
- `apps/api/app/Http/Middleware/EnsureAssignedInstructorCourse.php`
- `apps/api/app/Http/Middleware/EnsureInstructorContext.php`
- `apps/api/app/Services/Instructors/InstructorAccountService.php`
- `apps/api/app/Services/Instructors/InstructorAuthenticationService.php`
- `apps/api/app/Services/Instructors/InstructorCourseAuthorization.php`
- `apps/api/app/Services/Instructors/InstructorFeature.php`
- `apps/api/app/Services/Instructors/InstructorMembershipGuard.php`
- `apps/api/database/migrations/2026_10_26_000001_add_instructor_identity_to_tenant_users_table.php`
- `apps/api/database/migrations/2026_10_28_000001_add_instructor_assignment_managed_to_courses_table.php`
- `apps/api/docs/INSTRUCTOR_ASSIGNMENT_MANAGED.md`
- `apps/api/tests/Feature/InstructorAuthenticationTest.php`
- `apps/api/tests/Feature/InstructorCourseAuthorizationTest.php`
- `apps/web/src/app/(instructor)/instructor/change-password/page.tsx`
- `apps/web/src/app/(instructor)/instructor/courses/[courseId]/page.tsx`
- `apps/web/src/app/(instructor)/instructor/courses/page.tsx`
- `apps/web/src/app/(instructor)/instructor/login/page.tsx`
- `apps/web/src/app/(instructor)/layout.tsx`
- `apps/web/src/features/instructors/InstructorAuthProvider.tsx`
- `apps/web/src/features/instructors/api.ts`
- `apps/web/src/features/instructors/pages.test.ts`
- `apps/web/src/features/instructors/store.ts`
- `apps/web/src/features/instructors/types.ts`

### Dirty files explicitly excluded

These nine tracked modifications are not part of this feature manifest and must remain untouched/excluded:

- `apps/api/app/Http/Controllers/Api/v1/Tenant/TenantAuthController.php` (the diff is generic tenant-login rate-limit cleanup)
- `apps/web/src/components/auth/ProtectedRoute.tsx`
- `apps/web/src/components/auth/TenantGuestRoute.tsx`
- `apps/web/src/components/layout/TenantDashboardLayout.tsx`
- `apps/web/src/components/layout/WorkspaceLeftSidebar.tsx`
- `apps/web/src/components/studio/navigation/StudioSidebarItem.tsx`
- `apps/web/src/providers/AuthProvider.tsx`
- `apps/web/src/services/api/axios.ts`
- `apps/web/src/stores/auth.store.ts`

The full-worktree `git diff --check` reports trailing whitespace in excluded `apps/web/src/providers/AuthProvider.tsx` lines 167, 196, 355, 472, and 475. Those unrelated changes were not edited. The scoped checks below pass.

## Consistency and validation

- Identity migration adds `tenant_users.is_instructor` (default false) and `must_change_password` (default false). Assignment-marker migration adds `courses.instructor_assignment_managed` (default false); it does not backfill existing courses. File timestamps place identity before assignment marker.
- API instructor routes use `instructor.context`; course/nested routes additionally use `instructor.course`. Access and refresh tokens carry `instructor:tenant:<id>` and both middleware/service checks bind them to the resolved tenant. Refresh also checks active Instructor membership and the single Instructor role. Regression coverage rejects a tenant-A refresh token in tenant B.
- Refresh-token expiry was not previously checked by the Instructor refresh service. Added a guard rejecting both expired and non-expiring refresh tokens, with regression assertions; issued refresh tokens remain tenant-scoped and have a 30-day expiration.
- Assignment writes validate the active tenant's Instructor membership, set `instructor_assignment_managed`, and synchronize the primary marker/pivot. Authorization reads the current primary assignment, so reassignment and unassignment take effect on subsequent requests. Tests cover legacy creator/pivot access, nested resources, and tenant-admin access.
- Instructor UI is isolated under `web/src/app/(instructor)` and uses its dedicated auth store/API. Platform tenant feature control defaults to false. No feature flag was enabled during this preparation.
- Migration/code compatibility with the production server, its database engine/version, deployment process, and installed PHP runtime remains unverified.

Commands run from `apps/api` / `apps/web` as indicated:

| Command | Result |
|---|---|
| `php artisan test --compact tests/Feature/InstructorAuthenticationTest.php` | Passed: 6 tests, 38 assertions (after expiry regressions were added). |
| `php artisan test --compact tests/Feature/InstructorCourseAuthorizationTest.php` | Passed: 9 tests, 126 assertions. |
| `npm test -- src/features/instructors/pages.test.ts` | Passed: 1 file, 4 tests. Vite emitted its existing config-loader warning. |
| `npm run typecheck` | Passed (`tsc --noEmit`). |
| Changed-PHP lint loop (exact command below) | Passed: 42 changed PHP files, no syntax errors. |
| From repository root: `git diff --check -- apps/api apps/web/src/features/platform-tenants` | Passed. |
| Manifest-scoped trailing-whitespace scan of untracked Instructor files (exact command below) | Passed: all 24 files scanned; none found. |
| Full-worktree `git diff --check` | Not clean only because of the five trailing-whitespace lines in excluded `AuthProvider.tsx` listed above; left untouched. |

Exact PHP lint command, from repository root:

```powershell
Set-Location 'D:\projects\techify_production'
$paths = @(& git diff --name-only | Where-Object { $_.EndsWith('.php') }) + @(& git ls-files --others --exclude-standard | Where-Object { $_.EndsWith('.php') })
$failed = @()
foreach ($path in $paths) {
  & php -l $path
  if (-not $?) { $failed += $path }
}
Write-Output "PHP_FILES_LINTED=$($paths.Count)"
if ($failed.Count -gt 0) {
  Write-Output ('PHP_LINT_FAILED=' + ($failed -join ', '))
  exit 1
}
```

Exact untracked Instructor whitespace command, from repository root:

```powershell
Set-Location 'D:\projects\techify_production'
$lines = Get-Content 'apps\INSTRUCTOR_RELEASE_CHECKLIST.md'
$inUntracked = $false
$files = @(foreach ($line in $lines) {
  if ($line -match '^### Required untracked new files') { $inUntracked = $true; continue }
  if ($line -match '^### ') { $inUntracked = $false }
  if ($inUntracked -and $line -match '^- `([^`]+)`$') { $Matches[1] }
})
$hits = foreach ($file in $files) {
  $lineNo = 0
  foreach ($line in [System.IO.File]::ReadAllLines((Join-Path (Get-Location) $file))) {
    $lineNo++
    if ($line -match '[ \t]+$') { "$file`:$lineNo" }
  }
}
if ($hits) { $hits; exit 1 }
Write-Output "UNTRACKED_INSTRUCTOR_FILES_CHECKED=$($files.Count); trailing whitespace: none"
```

At this initial preparation snapshot, no full test suite or production/server validation had been run; the later targeted tests and deployment checks are recorded below.

## Original packaging notes (2026-10-28 snapshot)

At this snapshot no archive had been created: the earlier inventory was unavailable, the worktree contained unrelated dirt, and the preparation was constrained not to copy repository files into a package. The later reconciliation and artifact creation are recorded below. Do not use `git add`/`git archive` against a dirty worktree as a shortcut; `git archive` omits working-tree modifications and untracked files.

The following command is retained for the original 56-file snapshot only; it is not the 71-file manifest used for the 2026-11-05 release. For a future release, reconcile the current file list first and use a new output path outside the repository with an explicit allowlist. This historical command extracts the original 56 bullet paths in the two Required sections:

```powershell
$checklist = Get-Content 'apps\INSTRUCTOR_RELEASE_CHECKLIST.md'
$inManifest = $false
$releaseFiles = @(
  foreach ($line in $checklist) {
    if ($line -match '^### Required (tracked modifications|untracked new files)') {
      $inManifest = $true
      continue
    }
    if ($line -match '^### ') { $inManifest = $false }
    if ($inManifest -and $line -match '^- `([^`]+)`$') { $Matches[1] }
  }
)
if ($releaseFiles.Count -ne 56 -or @($releaseFiles | Where-Object { -not (Test-Path -LiteralPath $_) }).Count -ne 0) {
  throw 'Release allowlist is incomplete or contains a missing file.'
}
tar.exe -a -c -f 'D:\safe-output\teachify-instructor.zip' -C 'D:\projects\techify_production' @releaseFiles
```

Verify the archive listing against those 56 paths before distribution; do not include the checklist, any other dirty files, environment files, or build outputs. Replace the example archive path only with a new, non-existing destination outside the repository.

## Deployment sequence

1. Record the current tenant `has_instructors` values and do not change them as part of a code deployment. Confirm a tested backup/restore point and identify the correct target database, migration runner, active release path, and rollback owner.
2. Plan an additive migration-first window. The release's current API code reads the new `tenant_users` and `courses` columns, so code-before-migration is unsafe. If the deployment system permits, run the migration-bearing release's `php artisan migrate --force` while the old application code is still serving, then verify both migrations completed before switching application code. If that is not supported, plan a maintenance/atomic deployment or migration-only phase appropriate to the actual platform; do not assume compatibility.
3. Deploy API code after both migrations are verified; then deploy the web app. Verify health and route availability, and confirm the production flag values remain exactly as recorded.
4. Exercise the feature in a non-production tenant/environment where enabling its test flag is explicitly approved. Change production flags only through the controlled flag owner/process after the complete smoke checklist passes.
5. Treat rollback as an authorization/data decision: rolling back the identity migration drops Instructor identity and forced-password state; rolling back the assignment-marker migration drops assignment history and can restore legacy creator/pivot authorization while the feature is disabled. Do not automatically roll back either migration after code has used the columns.

## Post-deployment smoke checklist

Run in an approved non-production/canary tenant before enabling any additional production tenant. At the 2026-11-05 deployment baseline, one of six production tenants already had `has_instructors` enabled; that state was preserved and not broadened.

- [ ] Tenant Admin provisions an Instructor account; generic user/invitation flows cannot create or promote that identity.
- [ ] Tenant Admin assigns a course, verifies its primary membership/marker, then unassigns it and verifies the marker remains managed with no primary assignment.
- [ ] Instructor logs in with the temporary password; all protected actions are denied until forced password change; after changing it, the returned access/refresh credentials work.
- [ ] Instructor can list/open and perform permitted operations on currently assigned courses only.
- [ ] After reassignment, the former Instructor is denied and the new Instructor is allowed on the next request; after unassignment, both are denied, including nested course operations.
- [ ] Present a tenant-A access token and refresh token with tenant-B context; both are rejected and tenant-B data remains unchanged.
- [ ] Confirm failures are logged/observable, no unexpected account/course access occurs, and production flag values are unchanged until all checks pass.

## Reconciliation update — 2026-11-05

The earlier 56-file inventory is retained above as the 2026-10-28 snapshot. At reconciliation time, excluding this output-only checklist, all 56 paths existed, 11 were modified, and there were no untracked files. The implementation worktree had 26 modified tracked source files; the 15 modified files outside the historical allowlist are added below because they implement or support the current Instructor course-management changes. The reconciled package therefore contains 71 source files (the original 56 plus these 15); the checklist and all other worktree files remain excluded.

### Additional required tracked files (15)

- `apps/api/app/Http/Controllers/Api/v1/Instructor/InstructorWorkspaceController.php`
- `apps/api/app/Repositories/CourseSectionRepository.php`
- `apps/web/src/app/(instructor)/instructor/courses/new/page.tsx`
- `apps/web/src/features/course-categories/hooks/index.ts`
- `apps/web/src/features/courses/components/CourseBlock.tsx`
- `apps/web/src/features/courses/components/CourseCreatePanel.tsx`
- `apps/web/src/features/courses/components/CourseEditDrawer.tsx`
- `apps/web/src/features/courses/components/CourseFormPanel.tsx`
- `apps/web/src/features/courses/components/CourseImageUploader.tsx`
- `apps/web/src/features/courses/components/CoursesHomeContent.tsx`
- `apps/web/src/features/courses/hooks/index.ts`
- `apps/web/src/features/courses/hooks/useCourseTags.ts`
- `apps/web/src/features/courses/services/index.ts`
- `apps/web/src/features/homepage/educational-stages/hooks.ts`
- `apps/web/src/features/subjects/hooks.ts`

The focused checks were rerun after fixing Instructor deletion authorization to preserve assigned-Instructor deletion only while the feature is enabled, correcting the course-feature API method reference, typing the distinct Instructor lookup shape, and providing the React Query test context:

- `php artisan test --compact tests/Feature/InstructorCourseAuthorizationTest.php` — passed, 10 tests / 166 assertions.
- `npm run typecheck` — passed.
- `npm test -- src/features/instructors/pages.test.ts` — passed, 6 tests. Vite emitted its existing config-loader warning.

An allowlist-only archive was created at `C:\Users\everest\.copilot\session-state\3afae97a-c14e-4e22-bb59-170b6c01d6ac\files\teachify-instructor-release-20261105.zip`. Its listing was verified against the 71 reconciled paths; no checklist, environment file, build output, or unrelated worktree change is included. At artifact creation, this was only a source overlay and the production compatibility and enablement gates were still pending.

**Disposition at artifact review:** packaging was complete for the reconciled source allowlist. Production deployment was still pending the server/database compatibility review and recovery checks recorded below. The final deployment outcome is recorded at the end of this document.

### Pre-cutover server preflight — 2026-11-05

- Server checkout is on `deploy` at `b499eada7a3ca3252c8eace12a0e0e2199275193`, matching local `HEAD`.
- The live layout has no `/var/www/teachify/current`, `releases`, or `shared` path; the documented deployment script intentionally refuses live-path writes.
- `git status` reports 13,771 dirty paths, including three Instructor source files and extensive generated `.next` artifacts. This differs from the older five-file server-dirt snapshot. The three source files included in the release were saved in the rollback snapshot before replacement; unrelated generated paths and the separate untracked Instructor component were preserved.
- The current 71-file ZIP is not the documented migration-first pair of a two-migration archive plus 54-file application archive. The old deployment script pins a different base/candidate and a 56-path manifest, so it cannot safely deploy this artifact.
- Before cutover, the isolated production-dump restore verification was confirmed, the staged Webpack build and smoke test passed, and the user's deployment instruction authorized the maintenance cutover. The reconciled ZIP was uploaded mode `0600` to `/home/deplo/.local/share/teachify-releases/instructor-release-20261105-da08c71936d3.zip`; its SHA-256 is `DA08C71936D331495B47569CE43A6CF836E7F291DD9EBC67A241BA0451315E2B`.

## Original release gates (2026-10-28 snapshot)

- **Packaging:** pending at the initial snapshot; the reconciled 71-file artifact and its validation are recorded above.
- **Deployment:** pending at the initial snapshot; the final deployment outcome is recorded below.

## Deployment result — 2026-11-05

- **Deployment:** completed from the verified artifact. The Webpack production build passed and the staged homepage and `/instructor/login` smoke checks returned HTTP 200.
- **Overlay:** 24 changed runtime source files were installed individually. The two migration files matched the deployed source and were already applied exactly once; no production migration was run.
- **Cutover:** the previous web `.next` build and all 24 pre-deployment source files are retained in `/home/deplo/.local/share/teachify-releases/instructor-release-20261105-da08c71936d3/rollback-live-20261105T220406Z`. Only the frontend and relevant queue/scheduler PM2 processes were restarted; no global restart was used.
- **Live verification:** homepage HTTP 200, Instructor login HTTP 200, API `/up` HTTP 200, and Instructor API routes are present. The live web build ID is `gEqLFoT3NJ3kAcRnvtSR5`.
- **Preserved state:** the pre-deployment Instructor flag state was one enabled tenant out of six and its fingerprint is unchanged. No feature flag was changed. The untracked `InstructorCoursesPageContent.tsx` and protected same-origin `env.ts` configuration were verified unchanged.
- **Not covered:** no credentialed, account-level Instructor workflow or custom-domain end-to-end smoke test was run. The checklist above remains required before enabling any additional tenant.
