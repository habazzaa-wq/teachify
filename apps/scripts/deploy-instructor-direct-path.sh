#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

PROJECT=/var/www/teachify
API="$PROJECT/apps/api"
WEB="$PROJECT/apps/web"
RELEASE=/home/deplo/.local/share/teachify-releases/instructor-ee6c2a7-7b0ef7a
INCOMING="$RELEASE/incoming"
EXTRACTED="$RELEASE/extracted-$$"
ROLLBACK_ROOT="$RELEASE/rollback"
EXPECTED_BASE=ee6c2a7ba6ac43b5a6a108bf4a8a2e7e200cda77
EXPECTED_SOURCE=7b0ef7af16cfec3d110fb2db694995a2a30b90b0
BACKUP=/home/deplo/.local/share/teachify-production-backups/teachify-20261028T210017Z.sql.gz
BACKUP_SHA="$BACKUP.sha256"
SNAPSHOT=
OVERLAY_STARTED=0
TEMP_PATHS=()
STAGED_SERVER_PID=

PROTECTED_PATHS=(
  apps/api/app/Http/Controllers/Api/v1/Tenant/TenantAuthController.php
  apps/web/src/components/auth/ProtectedRoute.tsx
  apps/web/src/components/auth/TenantGuestRoute.tsx
  apps/web/src/providers/AuthProvider.tsx
  apps/web/src/stores/auth.store.ts
)
MIGRATION_PATHS=(
  apps/api/database/migrations/2026_10_26_000001_add_instructor_identity_to_tenant_users_table.php
  apps/api/database/migrations/2026_10_28_000001_add_instructor_assignment_managed_to_courses_table.php
)

fail() {
  printf 'STOP: %s\n' "$*" >&2
  exit 1
}

migration_count() {
  local name="$1"
  (cd "$API" && php -r '
    require "vendor/autoload.php";
    $app=require "bootstrap/app.php";
    $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
    echo \Illuminate\Support\Facades\DB::table("migrations")->where("migration",$argv[1])->count();
  ' "$name")
}

on_exit() {
  local status=$?
  local temp
  if [[ -n "$STAGED_SERVER_PID" ]]; then
    kill "$STAGED_SERVER_PID" 2>/dev/null || true
    wait "$STAGED_SERVER_PID" 2>/dev/null || true
    STAGED_SERVER_PID=
  fi
  for temp in "${TEMP_PATHS[@]}"; do
    rm -f -- "$temp"
  done
  if [[ "$status" -ne 0 && "$OVERLAY_STARTED" -eq 1 && -n "$SNAPSHOT" ]]; then
    printf '%s\n' "DEPLOY_FAILED; restoring only the 54 application paths and previous web build; migrations remain applied" >&2
    if restore_files "$SNAPSHOT"; then
      for temp in teachify-frontend teachify-queue teachify-queue-bunny teachify-queue-grading teachify-queue-usage teachify-scheduler; do
        pm2 restart "$temp" || printf 'TARGETED_PROCESS_RESTART_FAILED=%s\n' "$temp" >&2
      done
    else
      printf '%s\n' "AUTOMATIC_FILE_RESTORE=FAILED; preserve snapshot at $SNAPSHOT; services were not restarted" >&2
    fi
  fi
  return "$status"
}
trap on_exit EXIT

verify_artifacts() {
  cd "$INCOMING"
  sha256sum -c SHA256SUMS.txt
  local base source
  base=$(awk -F': ' '/^Base revision:/ {gsub(/\r/, "", $2); print $2}' release-manifest.txt)
  source=$(awk -F': ' '/^Local feature candidate source:/ {gsub(/\r/, "", $2); print $2}' release-manifest.txt)
  [[ "$base" == "$EXPECTED_BASE" ]] || fail "Release base SHA mismatch: $base"
  [[ "$source" == "$EXPECTED_SOURCE" ]] || fail "Release source SHA mismatch: $source"

  awk '/^apps\// {sub(/\r$/, ""); print}' release-manifest.txt > "$RELEASE/manifest-paths.txt"
  [[ $(wc -l < "$RELEASE/manifest-paths.txt") -eq 56 ]] || fail "Manifest must contain 56 paths"
  if grep -Eq '(^/|(^|/)\.\.?(/|$)|\\|:)' "$RELEASE/manifest-paths.txt"; then
    fail "Manifest contains an unsafe path"
  fi
  if [[ $(sort -u "$RELEASE/manifest-paths.txt" | wc -l) -ne 56 ]]; then
    fail "Manifest contains duplicate paths"
  fi
  local path
  for path in "${PROTECTED_PATHS[@]}"; do
    ! grep -Fxq "$path" "$RELEASE/manifest-paths.txt" || fail "Protected server path included: $path"
  done
  ! grep -Fxq 'apps/web/src/config/env.ts' "$RELEASE/manifest-paths.txt" ||
    fail "Protected same-origin configuration included"

  tar -tf 01-instructor-migrations.tar > "$RELEASE/migration-paths.txt"
  tar -tf 02-instructor-application.tar > "$RELEASE/application-paths.txt"
  [[ $(wc -l < "$RELEASE/migration-paths.txt") -eq 2 ]] || fail "Expected exactly two migration files"
  [[ $(wc -l < "$RELEASE/application-paths.txt") -eq 54 ]] || fail "Expected exactly 54 application files"
  printf '%s\n' \
    apps/api/database/migrations/2026_10_26_000001_add_instructor_identity_to_tenant_users_table.php \
    apps/api/database/migrations/2026_10_28_000001_add_instructor_assignment_managed_to_courses_table.php \
    > "$RELEASE/migration-paths.expected"
  cmp -s "$RELEASE/migration-paths.expected" "$RELEASE/migration-paths.txt" ||
    fail "Migration archive order or contents are incorrect"
  cat "$RELEASE/migration-paths.txt" "$RELEASE/application-paths.txt" | sort > "$RELEASE/archive-paths.sorted"
  sort "$RELEASE/manifest-paths.txt" > "$RELEASE/manifest-paths.sorted"
  cmp -s "$RELEASE/archive-paths.sorted" "$RELEASE/manifest-paths.sorted" ||
    fail "Archive contents differ from the manifest"

  if [[ -e "$EXTRACTED" ]]; then
    fail "Extraction directory already exists; preserve and inspect it before retrying"
  fi
  mkdir -m 700 "$EXTRACTED"
  (
    umask 022
    tar -xf "$INCOMING/01-instructor-migrations.tar" -C "$EXTRACTED"
    tar -xf "$INCOMING/02-instructor-application.tar" -C "$EXTRACTED"
  )
  [[ $(find "$EXTRACTED" -type f | wc -l) -eq 56 ]] || fail "Unexpected extracted file count"
  find "$EXTRACTED/apps" -type d -exec chmod 755 {} +
  find "$EXTRACTED/apps" -type f -exec chmod 644 {} +

  printf 'ARTIFACTS_VALID base=%s source=%s paths=56 migrations=2 application=54\n' "$base" "$source"
}

check_production_state() {
  local phase="${1:-pre}"
  [[ "$(git -C "$PROJECT" rev-parse HEAD)" == "$EXPECTED_BASE" ]] ||
    fail "Server checkout moved from expected base"

  local protected
  if [[ "$phase" == pre ]]; then
    git -C "$PROJECT" status --short --untracked-files=all > "$RELEASE/server-dirty.status"
    awk 'substr($0,1,2) != " M" && substr($0,1,2) != "??" {exit 1} {print substr($0,4)}' "$RELEASE/server-dirty.status" |
      sort > "$RELEASE/server-dirty.txt" || fail "Server dirty-file state includes staged, deleted, or untracked changes"
    printf '%s\n' "${PROTECTED_PATHS[@]}" > "$RELEASE/protected-expected.txt"
    local migration_path migration_name migration_rows
    for migration_path in "${MIGRATION_PATHS[@]}"; do
      migration_name="${migration_path##*/}"
      migration_name="${migration_name%.php}"
      migration_rows=$(migration_count "$migration_name")
      if [[ -e "$PROJECT/$migration_path" ]]; then
        cmp -s "$EXTRACTED/$migration_path" "$PROJECT/$migration_path" ||
          fail "Existing migration source differs from the release: $migration_path"
        [[ "$migration_rows" == 1 ]] ||
          fail "Migration source exists without exactly one applied database record: $migration_name"
        printf '%s\n' "$migration_path" >> "$RELEASE/protected-expected.txt"
      else
        [[ "$migration_rows" == 0 ]] ||
          fail "Migration is recorded as applied but its source file is missing: $migration_name"
      fi
    done
    sort -o "$RELEASE/protected-expected.txt" "$RELEASE/protected-expected.txt"
    diff -u "$RELEASE/protected-expected.txt" "$RELEASE/server-dirty.txt" ||
      fail "Server dirty-file set changed; refusing deployment"
  else
    (cd "$PROJECT" && sha256sum -c "$SNAPSHOT/protected.sha256") ||
      fail "Protected server files or env.ts changed during deployment"
  fi

  protected=$(cd "$API" && php -r '
    require "vendor/autoload.php";
    $app=require "bootstrap/app.php";
    $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
    $db=\Illuminate\Support\Facades\DB::connection();
    if ($db->getDatabaseName() !== "teachify") { fwrite(STDERR,"wrong production database\n"); exit(2); }
    $rows=$db->table("tenants")->get(["feature_flags"]);
    $enabled=0;
    foreach($rows as $row) {
      $flags=is_array($row->feature_flags) ? $row->feature_flags : json_decode((string)$row->feature_flags,true);
      if (is_array($flags) && filter_var($flags["has_instructors"] ?? false,FILTER_VALIDATE_BOOLEAN)) $enabled++;
    }
    echo count($rows)." ".$enabled;
  ')
  [[ "$protected" == "6 0" ]] || fail "Expected six tenants with Instructor flags all disabled; got: $protected"
  printf 'TENANT_FLAGS_OFF tenants=%s\n' "${protected%% *}"

  [[ "$(curl -k -sS -o /dev/null -m 10 -w '%{http_code}' --resolve api.teachify.tech:443:127.0.0.1 https://api.teachify.tech/up)" == 200 ]] ||
    fail "Nginx-routed API health check failed"
  [[ "$(curl -sS -o /dev/null -m 10 -w '%{http_code}' http://127.0.0.1:3000/)" == 200 ]] ||
    fail "Local web health check failed"
  [[ "$(sed -n '108s/^[[:space:]]*//p' "$WEB/src/config/env.ts")" == 'return `${protocol}//${hostname}`;' ]] ||
    fail "Required env.ts line 108 same-origin fix changed"
}

test_rollback_sandbox() {
  local sandbox="$RELEASE/rollback-test" path
  [[ ! -e "$sandbox" ]] || fail "Rollback test directory already exists; preserve and inspect it"
  mkdir -m 700 "$sandbox" "$sandbox/snapshot" "$sandbox/tree"
  : > "$sandbox/present-paths.txt"
  : > "$sandbox/absent-paths.txt"
  cd "$PROJECT"
  while IFS= read -r path; do
    if [[ -f "$path" ]]; then
      printf '%s\n' "$path" >> "$sandbox/present-paths.txt"
      mkdir -p "$sandbox/snapshot/$(dirname "$path")" "$sandbox/tree/$(dirname "$path")"
      cp -a "$path" "$sandbox/snapshot/$path"
      cp -a "$path" "$sandbox/tree/$path"
    else
      printf '%s\n' "$path" >> "$sandbox/absent-paths.txt"
    fi
  done < "$RELEASE/manifest-paths.txt"
  for path in "${PROTECTED_PATHS[@]}" apps/web/src/config/env.ts; do
    [[ -f "$path" ]] || fail "Protected path missing in rollback test: $path"
    mkdir -p "$sandbox/tree/$(dirname "$path")"
    cp -a "$path" "$sandbox/tree/$path"
  done
  (cd "$sandbox/tree" && sha256sum "${PROTECTED_PATHS[@]}" apps/web/src/config/env.ts) > "$sandbox/protected.sha256"

  while IFS= read -r path; do
    mkdir -p "$sandbox/tree/$(dirname "$path")"
    cp -a "$EXTRACTED/$path" "$sandbox/tree/$path"
  done < "$RELEASE/manifest-paths.txt"
  while IFS= read -r path; do
    [[ "$path" == */database/migrations/* ]] && continue
    mkdir -p "$sandbox/tree/$(dirname "$path")"
    cp -a "$sandbox/snapshot/$path" "$sandbox/tree/$path"
  done < "$sandbox/present-paths.txt"
  while IFS= read -r path; do
    [[ "$path" == */database/migrations/* ]] && continue
    rm -f -- "$sandbox/tree/$path"
  done < "$sandbox/absent-paths.txt"
  (cd "$sandbox/tree" && sha256sum -c "$sandbox/protected.sha256")

  while IFS= read -r path; do
    [[ "$path" == */database/migrations/* ]] && continue
    if [[ -f "$PROJECT/$path" ]]; then
      cmp -s "$PROJECT/$path" "$sandbox/tree/$path" || fail "Rollback simulation mismatch: $path"
    else
      [[ ! -e "$sandbox/tree/$path" ]] || fail "Rollback simulation retained new file: $path"
    fi
  done < "$RELEASE/manifest-paths.txt"
  rm -rf -- "$sandbox"
  printf '%s\n' "ROLLBACK_SANDBOX=PASS; protected files and env.ts unchanged"
}

build_staged_web() {
  local build="$RELEASE/build-$$"
  [[ ! -e "$build" ]] || fail "Staged build directory already exists"
  mkdir -m 700 -p "$build/web"
  rsync -a --exclude='node_modules' --exclude='.next' "$WEB/" "$build/web/"
  [[ -d "$WEB/node_modules" ]] || fail "Live web node_modules is unavailable"
  ln -s "$WEB/node_modules" "$build/web/node_modules"

  while IFS= read -r path; do
    [[ "$path" == apps/web/* ]] || continue
    local relative="${path#apps/web/}"
    mkdir -p "$build/web/$(dirname "$relative")"
    cp -a "$EXTRACTED/$path" "$build/web/$relative"
  done < "$RELEASE/manifest-paths.txt"

  (cd "$build/web" && npm run build -- --webpack) > "$RELEASE/staged-web-build.log" 2>&1 ||
    fail "Staged web build failed; inspect the private release log"
  [[ -s "$build/web/.next/BUILD_ID" ]] || fail "Staged Next.js build did not produce BUILD_ID"
  printf '%s\n' "STAGED_WEB_BUILD=PASS"
}

smoke_staged_web() {
  local build="$RELEASE/build-$$" attempt code
  if ss -ltn | grep -q ':3900 '; then
    fail "Private staging smoke-test port 3900 is already in use"
  fi
  (
    cd "$build/web"
    exec env PORT=3900 HOSTNAME=127.0.0.1 \
      node "$WEB/node_modules/next/dist/bin/next" start --hostname 127.0.0.1 --port 3900
  ) > "$RELEASE/staged-web-start.log" 2>&1 &
  STAGED_SERVER_PID=$!
  for attempt in {1..45}; do
    code=$(curl -sS -o /dev/null -m 5 -w '%{http_code}' http://127.0.0.1:3900/ 2>/dev/null || true)
    if [[ "$code" == 200 ]]; then
      kill "$STAGED_SERVER_PID"
      wait "$STAGED_SERVER_PID" 2>/dev/null || true
      STAGED_SERVER_PID=
      printf '%s\n' "STAGED_WEB_SMOKE=PASS"
      return 0
    fi
    sleep 1
  done
  fail "Isolated staged web server did not return HTTP 200; inspect private release log"
}

snapshot_live() {
  local stamp snapshot path
  stamp=$(date -u +%Y%m%dT%H%M%SZ)
  snapshot="$ROLLBACK_ROOT/live-$stamp"
  mkdir -m 700 "$snapshot" "$snapshot/files"
  : > "$snapshot/present-paths.txt"
  : > "$snapshot/absent-paths.txt"

  cd "$PROJECT"
  while IFS= read -r path; do
    if [[ -f "$path" ]]; then
      printf '%s\n' "$path" >> "$snapshot/present-paths.txt"
      mkdir -p "$snapshot/files/$(dirname "$path")"
      cp -a "$path" "$snapshot/files/$path"
    else
      printf '%s\n' "$path" >> "$snapshot/absent-paths.txt"
    fi
  done < "$RELEASE/manifest-paths.txt"

  [[ -d "$WEB/.next" ]] || fail "Current web build is missing"
  cp -a "$WEB/.next" "$snapshot/web-next"
  for path in "${PROTECTED_PATHS[@]}" apps/web/src/config/env.ts; do
    [[ -f "$PROJECT/$path" ]] || fail "Protected file missing: $path"
  done
  (cd "$PROJECT" && sha256sum "${PROTECTED_PATHS[@]}" apps/web/src/config/env.ts) > "$snapshot/protected.sha256"
  printf '%s\n' "$snapshot"
}

verify_migration_applied() {
  local name="$1" count
  count=$(migration_count "$name")
  [[ "$count" == 1 ]] || fail "Migration not recorded as applied: $name"
}

restore_files() {
  local snapshot="$1" path temp restore_status=0
  set +e
  cd "$PROJECT"
  while IFS= read -r path; do
    [[ "$path" == */database/migrations/* ]] && continue
    mkdir -p "$(dirname "$path")"
    temp="$PROJECT/$path.instructor-rollback.$$"
    cp -a "$snapshot/files/$path" "$temp" && mv -f "$temp" "$PROJECT/$path" || restore_status=1
  done < "$snapshot/present-paths.txt"
  while IFS= read -r path; do
    [[ "$path" == */database/migrations/* ]] && continue
    rm -f -- "$PROJECT/$path" || restore_status=1
  done < "$snapshot/absent-paths.txt"
  rm -rf -- "$WEB/.next" || restore_status=1
  cp -a "$snapshot/web-next" "$WEB/.next" || restore_status=1
  (cd "$PROJECT" && sha256sum -c "$snapshot/protected.sha256") || restore_status=1
  set -e
  return "$restore_status"
}

deploy_release() {
  [[ "${RESTORE_VERIFIED:-}" == YES ]] ||
    fail "Set RESTORE_VERIFIED=YES only after the isolated database restore was independently verified"
  [[ "${MAINTENANCE_WINDOW:-}" == YES ]] ||
    fail "Set MAINTENANCE_WINDOW=YES only for the approved release window"
  [[ -f "$BACKUP" && -f "$BACKUP_SHA" ]] || fail "Verified production backup files are missing"
  cd "$(dirname "$BACKUP")"
  sha256sum -c "$(basename "$BACKUP_SHA")"
  gzip -t "$BACKUP"

  check_production_state pre
  test_rollback_sandbox
  build_staged_web
  smoke_staged_web

  local identity assignment path dest temp identity_state assignment_state
  identity=2026_10_26_000001_add_instructor_identity_to_tenant_users_table
  assignment=2026_10_28_000001_add_instructor_assignment_managed_to_courses_table
  identity_state=pending
  assignment_state=pending
  for path in "$identity" "$assignment"; do
    dest="$API/database/migrations/$path.php"
    if [[ -e "$dest" ]]; then
      cmp -s "$EXTRACTED/apps/api/database/migrations/$path.php" "$dest" ||
        fail "Existing migration source differs from the release: $path"
      [[ $(migration_count "$path") == 1 ]] ||
        fail "Existing migration source has an unexpected database state: $path"
      if [[ "$path" == "$identity" ]]; then identity_state=applied; else assignment_state=applied; fi
    else
      [[ $(migration_count "$path") == 0 ]] ||
        fail "Migration is recorded as applied but its source file is missing: $path"
    fi
  done
  [[ "$identity_state" == "$assignment_state" ]] ||
    fail "Only one Instructor migration is applied; refusing an automatic retry"
  SNAPSHOT=$(snapshot_live)

  if [[ "$identity_state" == pending ]]; then
    for path in "$identity" "$assignment"; do
      dest="$API/database/migrations/$path.php"
      temp="$dest.instructor-release.$$"
      TEMP_PATHS+=("$temp")
      cp -a "$EXTRACTED/apps/api/database/migrations/$path.php" "$temp"
      mv -f "$temp" "$dest"
    done

    cd "$API"
    php artisan migrate --force --path="database/migrations/${identity}.php" \
      > "$RELEASE/migration-identity.log" 2>&1 ||
      fail "Identity migration command failed; inspect its private release log"
    verify_migration_applied "$identity"
    php artisan migrate --force --path="database/migrations/${assignment}.php" \
      > "$RELEASE/migration-assignment.log" 2>&1 ||
      fail "Assignment migration command failed; inspect its private release log"
    verify_migration_applied "$assignment"
  else
    printf '%s\n' "BOTH_MIGRATIONS=ALREADY_APPLIED; source files match release"
  fi
  chmod 644 "$API/database/migrations/${identity}.php" "$API/database/migrations/${assignment}.php"

  cd "$PROJECT"
  OVERLAY_STARTED=1
  umask 022
  while IFS= read -r path; do
    [[ "$path" == */database/migrations/* ]] && continue
    dest="$PROJECT/$path"
    mkdir -p "$(dirname "$dest")"
    temp="$dest.instructor-release.$$"
    TEMP_PATHS+=("$temp")
    cp -a "$EXTRACTED/$path" "$temp"
    mv -f "$temp" "$dest"
  done < "$RELEASE/manifest-paths.txt"
  chmod 755 "$API/app/Http/Controllers/Api/v1/Instructor" "$API/app/Services/Instructors"
  while IFS= read -r path; do
    [[ "$path" == apps/api/* ]] || continue
    local mode
    mode=$(stat -c %a "$PROJECT/$path")
    [[ $((8#$mode & 4)) -ne 0 ]] || fail "PHP-FPM cannot read release file: $path"
  done < "$RELEASE/manifest-paths.txt"
  umask 077

  (cd "$API" && php artisan route:clear)
  mv "$WEB/.next" "$SNAPSHOT/web-next.previous"
  mv "$RELEASE/build-$$/web/.next" "$WEB/.next"

  for path in teachify-frontend teachify-queue teachify-queue-bunny teachify-queue-grading teachify-queue-usage teachify-scheduler; do
    pm2 restart "$path"
  done
  local attempt healthy=0 web_code=000 api_code=000
  for attempt in {1..18}; do
    web_code=$(curl -sS -o /dev/null -m 10 -w '%{http_code}' http://127.0.0.1:3000/ 2>/dev/null || true)
    api_code=$(curl -k -sS -o /dev/null -m 10 -w '%{http_code}' --resolve api.teachify.tech:443:127.0.0.1 https://api.teachify.tech/up 2>/dev/null || true)
    if [[ "$web_code" == 200 && "$api_code" == 200 ]]; then
      healthy=1
      break
    fi
    [[ "$attempt" -lt 18 ]] && sleep 5
  done
  printf 'POST_DEPLOY_HEALTH web=%s api=%s attempts=%s\n' "$web_code" "$api_code" "$attempt"
  [[ "$healthy" -eq 1 ]] || fail "API/web health checks did not recover within 90 seconds"
  check_production_state post
  verify_migration_applied "$identity"
  verify_migration_applied "$assignment"

  OVERLAY_STARTED=0
  rm -rf -- "$RELEASE/build-$$"
  printf 'DEPLOY_COMPLETE release=%s snapshot=%s flags=OFF\n' "$EXPECTED_SOURCE" "$SNAPSHOT"
  printf '%s\n' "CUSTOM_DOMAIN_SMOKE=NOT_RUN; Caddy is not healthy and safe production test accounts were not provided"
}

mode="${1:-}"
case "$mode" in
  verify)
    verify_artifacts
    check_production_state
    test_rollback_sandbox
    build_staged_web
    smoke_staged_web
    rm -rf -- "$EXTRACTED" "$RELEASE/build-$$"
    printf '%s\n' "VERIFY_COMPLETE; no live application or database changes"
    ;;
  deploy)
    verify_artifacts
    deploy_release
    ;;
  *)
    fail "Usage: $0 verify|deploy"
    ;;
esac
