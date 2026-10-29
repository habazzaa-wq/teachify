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

No full test suite or production/server validation was run.

## Packaging disposition and commands

No archive was created: the earlier inventory is unavailable, the worktree contains unrelated dirt, and this run was constrained not to copy repository files into a package. Reconcile this manifest with the earlier inventory and review the exact 32 tracked diffs before packaging. Do not use `git add`/`git archive` against this dirty worktree as a shortcut; `git archive` omits working-tree modifications and untracked files.

After reconciliation, use a new output path outside the repository and an explicit allowlist. From the repository root in PowerShell, this extracts only the 56 bullet paths in the two Required sections (and excludes the later dirty-file list), verifies the paths exist, and writes the archive directly without staging or moving repository files:

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

1. Keep all tenant `has_instructors` flags off. Confirm a tested backup/restore point and identify the correct target database, migration runner, active release path, and rollback owner.
2. Plan an additive migration-first window. The release's current API code reads the new `tenant_users` and `courses` columns, so code-before-migration is unsafe. If the deployment system permits, run the migration-bearing release's `php artisan migrate --force` while the old application code is still serving, then verify both migrations completed before switching application code. If that is not supported, plan a maintenance/atomic deployment or migration-only phase appropriate to the actual platform; do not assume compatibility.
3. Deploy API code after both migrations are verified; then deploy the web app. Verify health, route availability, and logs with all tenant flags still off.
4. Exercise the feature in a non-production tenant/environment where enabling its test flag is explicitly approved. Keep production tenant flags off until the complete smoke checklist passes. Then enable only approved production tenants through the controlled flag owner/process.
5. Treat rollback as an authorization/data decision: rolling back the identity migration drops Instructor identity and forced-password state; rolling back the assignment-marker migration drops assignment history and can restore legacy creator/pivot authorization while the feature is disabled. Do not automatically roll back either migration after code has used the columns.

## Post-deployment smoke checklist

Run in the approved non-production/canary tenant before production enablement:

- [ ] Tenant Admin provisions an Instructor account; generic user/invitation flows cannot create or promote that identity.
- [ ] Tenant Admin assigns a course, verifies its primary membership/marker, then unassigns it and verifies the marker remains managed with no primary assignment.
- [ ] Instructor logs in with the temporary password; all protected actions are denied until forced password change; after changing it, the returned access/refresh credentials work.
- [ ] Instructor can list/open and perform permitted operations on currently assigned courses only.
- [ ] After reassignment, the former Instructor is denied and the new Instructor is allowed on the next request; after unassignment, both are denied, including nested course operations.
- [ ] Present a tenant-A access token and refresh token with tenant-B context; both are rejected and tenant-B data remains unchanged.
- [ ] Confirm failures are logged/observable, no unexpected account/course access occurs, and production flags remain off until all checks pass.

## Release gates

- **Packaging:** NO-GO for an archive from this run; manifest/checklist preparation is complete, but prior-inventory reconciliation and reviewed allowlist packaging remain outstanding.
- **Production enablement:** NO-GO. Server/database compatibility and production smoke checks have not been verified. No deploy, production DB command, or feature-flag change was performed.
