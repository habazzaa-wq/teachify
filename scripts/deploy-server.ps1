<#
.SYNOPSIS
    Professional deployment to the Teachify production server.
    Pulls the latest 'deploy' branch from GitHub, optionally runs composer/npm/migrations,
    rebuilds the frontend, restarts PM2, and health-checks the running site.

.DESCRIPTION
    Server connection is configured below. The deploy always uses origin/deploy from GitHub:
    local uncommitted changes are never shipped, so a dirty tree only prints a warning.
    Local commits that are not pushed are still blocked (they would deploy older code).

.EXAMPLE
    .\scripts\deploy-server.ps1                 # shows plan, asks for confirmation
    .\scripts\deploy-server.ps1 -Yes            # deploy without prompt
    .\scripts\deploy-server.ps1 -NoBuild        # skip composer/migrate/frontend build
    .\scripts\deploy-server.ps1 -NoMigrate      # build but do not run DB migrations
    .\scripts\deploy-server.ps1 -NoRestart      # deploy code but do not restart PM2
    .\scripts\deploy-server.ps1 -LocalDirty      # skip the local dirty/ahead checks entirely
#>

param(
    [switch]$Yes,
    [switch]$NoBuild,
    [switch]$NoMigrate,
    [switch]$NoRestart,
    [switch]$LocalDirty
)

# Native git/ssh write progress to stderr. With 'Stop' PowerShell turns that into
# terminating errors; explicit $LASTEXITCODE checks below are the source of truth.
$ErrorActionPreference = 'Continue'
. (Join-Path $PSScriptRoot '_task-common.ps1')

# ---- Server configuration ----------------------------------------------------
$SshKey   = Join-Path $env:USERPROFILE '.ssh\id_ed25519_techify'
$SshUser  = 'deplo'
$SshHost  = '187.127.92.237'
$RemoteDir = '/var/www/teachify'
$Branch   = 'deploy'
$SshArgs  = @('-i', $SshKey, '-o', 'StrictHostKeyChecking=no', '-o', 'ServerAliveInterval=15', '-o', 'ServerAliveCountMax=40', "$SshUser@$SshHost")

# ---- Local pre-flight --------------------------------------------------------
if (-not (Test-Path -LiteralPath $SshKey)) {
    Write-Fail "SSH key not found: $SshKey"
    exit 1
}

$repo = Get-RepoRoot
$localBranch = & git -C $repo rev-parse --abbrev-ref HEAD
if ($localBranch -ne $Branch) {
    Write-Fail "Local branch is '$localBranch', expected '$Branch'. Checkout '$Branch' first."
    exit 1
}

# The deploy is performed from origin/$Branch on the server, so the expected
# SHA must come from the LOCAL origin/$Branch ref (after a fetch), not the
# possibly-stale local $Branch checkout. This avoids false mismatches when
# finish-task has pushed but the local branch ref wasn't advanced.
& git -C $repo fetch --quiet origin $Branch | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Could not fetch origin/$Branch - aborting (a stale ref can silently ship old code)."
    exit 1
}
$localSha = (& git -C $repo rev-parse "origin/$Branch").Trim()

# Local uncommitted work is never deployed: the server pulls origin/$Branch.
# A dirty tree is therefore only a warning (listing what will be skipped).
# Unpushed commits ARE blocked by default, because deploying would silently
# ship an older commit than the one checked out here.
if (-not $LocalDirty) {
    $dirty = @(& git -C $repo status --porcelain)
    if ($dirty.Count -gt 0) {
        Write-Warn2 "Local working tree has $($dirty.Count) uncommitted change(s) - these will NOT be deployed."
        $dirty | Select-Object -First 10 | ForEach-Object { Write-Host "     $_" -ForegroundColor DarkGray }
        if ($dirty.Count -gt 10) { Write-Host "     ... and $($dirty.Count - 10) more" -ForegroundColor DarkGray }
        Write-Warn2 "Deploying origin/$Branch ($localSha) only. Commit/push your work to include it."
    }
    $ahead = & git -C $repo rev-list --count "origin/$Branch..$Branch"
    if ([int]$ahead -gt 0) {
        Write-Fail "Local '$Branch' is $ahead commit(s) ahead of origin/$Branch. Push to GitHub first, or pass -LocalDirty."
        exit 1
    }

    # The classic "deployment finished but the page didn't change" trap: task
    # work is still sitting on a local branch because finish-task was never run.
    # Deploying origin/$Branch then correctly reports "Nothing changed".
    $wtPath = $null
    $activeTasks = @()
    foreach ($line in (& git -C $repo worktree list --porcelain)) {
        if ($line -match '^worktree (.+)$') { $wtPath = $matches[1] }
        elseif ($line -match '^branch refs/heads/(.+)$') {
            $b = $matches[1]
            if ($b -ne $Branch -and $wtPath -and (Test-Path -LiteralPath $wtPath)) { $activeTasks += $b }
        }
    }
    $unshipped = @()
    foreach ($b in $activeTasks) {
        & git -C $repo merge-base --is-ancestor $b "origin/$Branch" 2>$null
        if ($LASTEXITCODE -ne 0) { $unshipped += $b }
    }
    if ($unshipped.Count -gt 0) {
        Write-Warn2 "$($unshipped.Count) active task branch(es) are NOT in origin/${Branch}: $(($unshipped | Select-Object -First 3) -join ', ')"
        Write-Warn2 "If you expected that work live, run: .\scripts\finish-task.ps1 <name>   THEN deploy again."
    }
} else {
    Write-Warn2 "LocalDirty: skipping local clean/pushed checks. Deploying whatever origin/$Branch currently is."
}
$doBuild    = if ($NoBuild)    { 0 } else { 1 }
$doMigrate  = if ($NoMigrate)  { 0 } else { 1 }
$doRestart  = if ($NoRestart)  { 0 } else { 1 }

# ---- Plan / confirmation -----------------------------------------------------
Write-Host ''
Write-Step "Deployment plan"
Write-Host " Target   : $SshUser@$SshHost : $RemoteDir"
Write-Host " Branch   : $Branch"
Write-Host " Local SHA: $localSha"
$serverSha = ((& ssh @SshArgs "git -C $RemoteDir rev-parse HEAD" 2>$null) | Select-Object -Last 1).Trim()
if (-not $serverSha -or $serverSha -notmatch '^[0-9a-f]{40}$') {
    Write-Fail "Could not read a valid HEAD from $SshUser@${SshHost}:${RemoteDir} - refusing to deploy blind."
    exit 1
}
if ($serverSha -eq $localSha) {
    Write-Warn2 "Server already at $localSha - deploy will be a no-op if GitHub has not moved since this check."
} else {
    Write-Host " Server   : $serverSha -> $localSha"
    # If the server already has a NEWER commit, our local origin/$Branch ref is
    # stale (the fetch above failed). Deploying then reports success but ships
    # nothing - the exact "deployment finished but page didn't change" trap.
    & git -C $repo cat-file -e "$serverSha" 2>$null
    if ($LASTEXITCODE -eq 0) {
        & git -C $repo merge-base --is-ancestor $localSha $serverSha 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Fail "Server ($serverSha) is AHEAD of local origin/$Branch ($localSha): local ref is stale."
            Write-Warn2 "Run: git -C '$repo' fetch origin $Branch    then retry the deploy."
            exit 1
        }
    }
}
Write-Host " Steps    : git ff ->"
if ($doBuild -eq 1) {
    Write-Host "            ZERO DOWNTIME (no maintenance mode) ->"
    if ($doMigrate -eq 1) { Write-Host "            conditional: composer/migrate/caches only if backend changed ->" }
    else                  { Write-Host "            conditional: composer/caches only if backend changed (migrations SKIPPED) ->" }
    Write-Host "            conditional: npm build only if frontend changed ->"
} else {
    Write-Host "            (build SKIPPED: code only)"
}
if ($doRestart -eq 1) { Write-Host "            restart only changed PM2 processes -> health check" }
else                  { Write-Host "            (pm2 restart SKIPPED)" }
Write-Host ''

if (-not $Yes) {
    $ans = Read-Host "Proceed with deployment? [y/N]"
    if ($ans -notmatch '^[yY]') { Write-Warn2 "Aborted by user."; exit 0 }
}

# ---- Build the remote bash payload -------------------------------------------
$payload = @'
#!/bin/bash
set -euo pipefail
# Every failure path must emit a marker so the PowerShell wrapper never has to
# guess whether the remote job succeeded (that produced the confusing
# "exited without a result marker" message).
trap 'echo "DEPLOY_FAILED: unexpected error at line $LINENO (see output above)"' ERR
REMOTE_DIR="__REMOTE_DIR__"
BRANCH="__BRANCH__"
EXPECTED="__EXPECTED__"
DO_BUILD=__DO_BUILD__
DO_MIGRATE=__DO_MIGRATE__
DO_RESTART=__DO_RESTART__

export PATH="$HOME/.config/composer/vendor/bin:/usr/local/bin:/usr/local/node/bin:/usr/local/bin:/usr/bin:$PATH"

# Serialize deployments. Re-running while a deploy is still building would
# truncate the shared log and start a second build against the same .next dir.
exec 9>/tmp/deploy_teachify.lock
if ! flock -n 9; then
  echo "DEPLOY_FAILED: another deployment is already running on this server. Wait for it to finish, then retry."
  exit 1
fi

cd "$REMOTE_DIR"
echo "==> Server: $(hostname) | dir $REMOTE_DIR"

echo "==> Fetching origin/$BRANCH"
git fetch origin "$BRANCH"
GOT=$(git rev-parse "origin/$BRANCH")
if [ "$GOT" != "$EXPECTED" ]; then
  echo "DEPLOY_FAILED: remote origin/$BRANCH ($GOT) != expected ($EXPECTED). Push to GitHub first."
  exit 1
fi

# Record the currently-deployed commit so we can skip steps that did not change.
OLD_SHA=$(git rev-parse HEAD)
echo "==> Fast-forward to origin/$BRANCH"
git merge --ff-only "origin/$BRANCH"

# CRITICAL: $GOT is the fetched GitHub ref, not the checked-out HEAD. Without
# this check a failed/no-op merge still printed DEPLOY_OK and lied to the user.
FINAL_SHA=$(git rev-parse HEAD)
if [ "$FINAL_SHA" != "$GOT" ]; then
  echo "DEPLOY_FAILED: server HEAD ($FINAL_SHA) != origin/$BRANCH ($GOT) after fast-forward"
  exit 1
fi

WEB_FILES=$(git diff --name-only "$OLD_SHA" "$FINAL_SHA" -- apps/web)
API_FILES=$(git diff --name-only "$OLD_SHA" "$FINAL_SHA" -- apps/api composer.json composer.lock)
WEB_CHANGED=$(printf '%s\n' "$WEB_FILES" | head -n1)
API_CHANGED=$(printf '%s\n' "$API_FILES" | head -n1)
WEB_COUNT=$(printf '%s\n' "$WEB_FILES" | grep -c . || true)
API_COUNT=$(printf '%s\n' "$API_FILES" | grep -c . || true)
echo "==> Deployed files: web=$WEB_COUNT api=$API_COUNT ($OLD_SHA -> $FINAL_SHA)"
if [ "$OLD_SHA" = "$FINAL_SHA" ]; then
  echo "==> NOTE: server was already at this SHA - no code changes shipped (check GitHub/push if you expected changes)."
fi

# ZERO DOWNTIME: never put the app in maintenance mode. The platform stays live
# the whole deploy; the running frontend keeps serving the old build until we
# restart it after the new build is ready.

if [ "$DO_BUILD" = "1" ]; then
  if [ -n "$API_CHANGED" ]; then
    echo "==> Backend changed -> composer + migrate + caches"
    cd "$REMOTE_DIR/apps/api"
    composer install --no-dev --optimize-autoloader --no-interaction
    if [ "$DO_MIGRATE" = "1" ]; then
      echo "==> DB migrations"
      php artisan migrate --force
    fi
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    php artisan event:cache
    php artisan storage:link --force 2>/dev/null || true
  else
    echo "==> Backend unchanged -> skipping composer/migrate/caches"
  fi

  if [ -n "$WEB_CHANGED" ]; then
    echo "==> Frontend changed -> install + build (zero-downtime atomic swap)"
    cd "$REMOTE_DIR/apps/web"
    # Recover from any previously interrupted build first.
    if [ -e .next-live ]; then
      echo "==> recovering interrupted previous build"
      rm -rf .next
      mv .next-live .next
    fi
    # Park the currently-serving build aside so the live instance keeps serving
    # it during the build, and the new build writes to a fresh .next (no corruption).
    if [ -d .next ]; then mv .next .next-live; fi
    # A failed build must NOT leave the server on a newer commit with a broken
    # (or stale) build - that is what makes a later deploy look like a no-op.
    if npm install && npm run build; then
      # Activate the new build and discard the old one.
      pm2 restart teachify-frontend >/dev/null 2>&1 || true
      rm -rf .next-live
    else
      echo "==> Frontend build FAILED - restoring previous build and reverting code"
      rm -rf .next
      if [ -d .next-live ]; then mv .next-live .next; fi
      cd "$REMOTE_DIR"
      git reset --hard "$OLD_SHA"
      echo "DEPLOY_FAILED: frontend build failed (see build output above); server reverted to $OLD_SHA"
      exit 1
    fi
  else
    echo "==> Frontend unchanged -> skipping npm install/build"
  fi
else
  echo "==> Build SKIPPED (code only)"
fi

if [ "$DO_RESTART" = "1" ]; then
  if [ -n "$API_CHANGED" ]; then
    echo "==> Restarting Laravel workers (PM2)"
    pm2 restart teachify-queue teachify-reverb teachify-scheduler
  fi
  if [ -z "$WEB_CHANGED" ] && [ -z "$API_CHANGED" ]; then
    echo "==> Nothing changed -> no restart needed"
  fi
fi

# Health check: retry while Next.js boots after restart.
HEALTH=000
for h in $(seq 1 15); do
  CODE=$(curl -s -o /dev/null -m 10 -w "%{http_code}" "http://127.0.0.1:3000" || true)
  if [ "$CODE" = "200" ]; then HEALTH=$CODE; break; fi
  sleep 3
done
echo "HEALTH=$HEALTH"
if [ "$HEALTH" != "200" ]; then
  echo "DEPLOY_FAILED: health check returned $HEALTH after deploying $FINAL_SHA"
  exit 1
fi
echo "DEPLOY_SUMMARY sha=$FINAL_SHA web_files=$WEB_COUNT api_files=$API_COUNT"
echo "DEPLOY_OK sha=$FINAL_SHA"
'@

# Substitute PowerShell values into the bash template, then strip CRLF
# so bash does not choke on stray carriage returns.
$payload = $payload -replace '__REMOTE_DIR__', $RemoteDir
$payload = $payload -replace '__BRANCH__', $Branch
$payload = $payload -replace '__EXPECTED__', $localSha
$payload = $payload -replace '__DO_BUILD__', $doBuild
$payload = $payload -replace '__DO_MIGRATE__', $doMigrate
$payload = $payload -replace '__DO_RESTART__', $doRestart
$payload = $payload -replace "`r", ""

$remoteScript = '/tmp/deploy_teachify.sh'
$remoteLog    = '/tmp/deploy_teachify.log'

# Upload the bash payload to the server, then run it DETACHED (setsid) so that a
# local SSH disconnect or a flaky connection cannot kill the long `npm run build`.
# We then stream the log file.
Write-Step "Uploading deploy script to server ..."
$payload | & ssh @SshArgs "cat > $remoteScript"
if ($LASTEXITCODE -ne 0) { Write-Fail "Could not upload deploy script."; exit 1 }

Write-Step "Launching detached deployment on $SshUser@$SshHost ..."
& ssh @SshArgs "setsid bash $remoteScript > $remoteLog 2>&1 < /dev/null & echo LAunched_PID=`$!"
if ($LASTEXITCODE -ne 0) { Write-Fail "Could not launch the deployment."; exit 1 }

Write-Step "Deployment running (detached). Streaming server log ..."
$start = 1
$result = $null
for ($i = 0; $i -lt 120; $i++) {
    # Poll fast at first so short/no-op deploys return almost immediately.
    Start-Sleep -Seconds $(if ($i -lt 3) { 3 } else { 5 })
    $rawLines = @(& ssh @SshArgs "tail -n +$start $remoteLog" 2>$null) | ForEach-Object { $_ -split "`n" }
    if ($rawLines.Count -gt 0) {
        $rawLines | Where-Object { $_.Trim() -ne '' } | ForEach-Object { Write-Host $_ }
        # Advance by ALL returned lines (including blank ones). Counting only the
        # printed lines makes $start drift behind and re-prints old output.
        $start += $rawLines.Count
    }
    $marker = (& ssh @SshArgs "grep -E 'DEPLOY_OK|DEPLOY_FAILED' $remoteLog | tail -1" 2>$null)
    if ($marker -match 'DEPLOY_OK')      { $result = 'OK';     break }
    if ($marker -match 'DEPLOY_FAILED')  { $result = 'FAILED'; break }
    # Remote process exited without a result marker -> fail loudly so the user can recover.
    # Bracket the first letter so pgrep does not match its OWN ssh/bash command
    # line (which contains the script path) and wait forever after a silent exit.
    $alivePattern = $remoteScript -replace '/([^/])([^/]*)$', '/[$1]$2'
    $alive = (& ssh @SshArgs "pgrep -f '$alivePattern' >/dev/null && echo yes || echo no" 2>$null)
    if ($alive -eq 'no' -and $i -gt 2) {
        $tail = @(& ssh @SshArgs "tail -n 30 $remoteLog" 2>$null)
        if ($tail.Count -gt 0) { $tail | ForEach-Object { Write-Host "   $_" -ForegroundColor DarkGray } }
        Write-Fail "Remote deployment process exited without a result marker (see $remoteLog)."
        $result = 'FAILED'
        break
    }
}

if ($result -eq 'OK') {
    Write-Host ''
    $summary = ((& ssh @SshArgs "grep 'DEPLOY_SUMMARY' $remoteLog | tail -1" 2>$null) | Select-Object -Last 1).Trim()
    if ($summary) { Write-Host " $summary" -ForegroundColor DarkGray }
    # Last line of defence: re-read the actual server HEAD after the build.
    $finalServerSha = ((& ssh @SshArgs "git -C $RemoteDir rev-parse HEAD" 2>$null) | Select-Object -Last 1).Trim()
    if ($finalServerSha -ne $localSha) {
        Write-Fail "Server HEAD ($finalServerSha) != expected ($localSha) after deployment - do NOT trust the success marker."
        Write-Warn2 "Inspect: ssh $SshUser@$SshHost 'tail -n 60 $remoteLog'"
        exit 1
    }
    Write-Step "Deployment finished successfully."
    exit 0
} else {
    $tail = @(& ssh @SshArgs "tail -n 30 $remoteLog" 2>$null)
    if ($tail.Count -gt 0) { $tail | ForEach-Object { Write-Host "   $_" -ForegroundColor DarkGray } }
    Write-Fail "Deployment failed on the server. Inspect: ssh deplo@187.127.92.237 'tail -n 80 /tmp/deploy_teachify.log'. If a PM2 process is down, run: pm2 restart teachify-frontend (or the relevant worker)."
    exit 1
}
