<#
.SYNOPSIS
    Professional deployment to the Teachify production server.
    Pulls the latest 'deploy' branch from GitHub, optionally runs composer/npm/migrations,
    rebuilds the frontend, restarts PM2, and health-checks the running site.

.DESCRIPTION
    Server connection is configured below. The script requires a clean local tree and that
    your local 'deploy' is already pushed to GitHub (it verifies the exact SHA on the server).

.EXAMPLE
    .\scripts\deploy-server.ps1                 # shows plan, asks for confirmation
    .\scripts\deploy-server.ps1 -Yes            # deploy without prompt
    .\scripts\deploy-server.ps1 -NoBuild        # skip composer/migrate/frontend build
    .\scripts\deploy-server.ps1 -NoMigrate      # build but do not run DB migrations
    .\scripts\deploy-server.ps1 -NoRestart      # deploy code but do not restart PM2
    .\scripts\deploy-server.ps1 -LocalDirty      # deploy GitHub code even if local tree is dirty
#>

param(
    [switch]$Yes,
    [switch]$NoBuild,
    [switch]$NoMigrate,
    [switch]$NoRestart,
    [switch]$LocalDirty
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '_task-common.ps1')

# ---- Server configuration ----------------------------------------------------
$SshKey   = Join-Path $env:USERPROFILE '.ssh\id_ed25519_techify'
$SshUser  = 'deplo'
$SshHost  = '187.127.92.237'
$RemoteDir = '/var/www/teachify'
$Branch   = 'deploy'

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

# By default we require a clean, pushed tree. With -LocalDirty we skip those
# checks on purpose: the actual deploy is performed on the SERVER from
# origin/deploy, so local uncommitted work never reaches production.
if (-not $LocalDirty) {
    if (-not (Test-CleanTree -Path $repo)) {
        Write-Fail "Local working tree is dirty. Commit/stash it, or pass -LocalDirty to deploy what is on GitHub."
        exit 1
    }
    $ahead = & git -C $repo rev-list --count "origin/$Branch..$Branch"
    if ([int]$ahead -gt 0) {
        Write-Fail "Local '$Branch' is $ahead commit(s) ahead of origin. Push to GitHub first, or pass -LocalDirty."
        exit 1
    }
} else {
    Write-Warn2 "LocalDirty: skipping local clean/pushed checks. Deploying whatever origin/deploy currently is."
}

# The deploy is performed from origin/$Branch on the server, so the expected
# SHA must come from the LOCAL origin/$Branch ref (after a fetch), not the
# possibly-stale local $Branch checkout. This avoids false mismatches when
# finish-task has pushed but the local branch ref wasn't advanced.
& git -C $repo fetch origin $Branch | Out-Null
$localSha = (& git -C $repo rev-parse "origin/$Branch").Trim()
$doBuild    = if ($NoBuild)    { 0 } else { 1 }
$doMigrate  = if ($NoMigrate)  { 0 } else { 1 }
$doRestart  = if ($NoRestart)  { 0 } else { 1 }

# ---- Plan / confirmation -----------------------------------------------------
Write-Host ''
Write-Step "Deployment plan"
Write-Host " Target   : $SshUser@$SshHost : $RemoteDir"
Write-Host " Branch   : $Branch"
Write-Host " Local SHA: $localSha"
Write-Host " Steps    : git pull ->"
if ($doBuild -eq 1) {
    Write-Host "            maintenance mode ON -> composer install ->"
    if ($doMigrate -eq 1) { Write-Host "            db migrations -> laravel caches ->" }
    else                  { Write-Host "            (migrations SKIPPED) -> laravel caches ->" }
    Write-Host "            npm install + build frontend ->"
} else {
    Write-Host "            (build SKIPPED: code only)"
}
if ($doRestart -eq 1) { Write-Host "            pm2 restart all -> health check" }
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
REMOTE_DIR="__REMOTE_DIR__"
BRANCH="__BRANCH__"
EXPECTED="__EXPECTED__"
DO_BUILD=__DO_BUILD__
DO_MIGRATE=__DO_MIGRATE__
DO_RESTART=__DO_RESTART__

export PATH="$HOME/.config/composer/vendor/bin:/usr/local/bin:/usr/local/node/bin:/usr/local/bin:/usr/bin:$PATH"

MAINT_OK=0
bring_up() { if [ "$MAINT_OK" = "1" ]; then echo "==> Bringing app back up"; cd "$REMOTE_DIR/apps/api" && php artisan up || true; fi }
trap bring_up EXIT

cd "$REMOTE_DIR"
echo "==> Server: $(hostname) | dir $REMOTE_DIR"

echo "==> Fetching origin/$BRANCH"
git fetch origin "$BRANCH"
GOT=$(git rev-parse "origin/$BRANCH")
if [ "$GOT" != "$EXPECTED" ]; then
  echo "DEPLOY_FAILED: remote origin/$BRANCH ($GOT) != expected ($EXPECTED). Push to GitHub first."
  exit 1
fi

echo "==> Fast-forward to origin/$BRANCH"
git merge --ff-only "origin/$BRANCH"

if [ "$DO_BUILD" = "1" ]; then
  cd "$REMOTE_DIR/apps/api"
  echo "==> Maintenance mode ON"
  php artisan down || true
  MAINT_OK=1

  echo "==> Composer install (api)"
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

  echo "==> Build frontend (web)"
  cd "$REMOTE_DIR/apps/web"
  npm install
  npm run build
fi

if [ "$DO_RESTART" = "1" ]; then
  echo "==> Restarting PM2 processes"
  pm2 restart all
fi

# Bring the app out of maintenance BEFORE the health check so we probe a live site.
bring_up

# Next.js needs a few seconds to boot after pm2 restart, so retry the probe.
HEALTH=000
for h in $(seq 1 15); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000" || true)
  if [ "$CODE" = "200" ]; then HEALTH=$CODE; break; fi
  sleep 3
done
echo "HEALTH=$HEALTH"
echo "DEPLOY_OK sha=$GOT"
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

$SshArgs = @('-i', $SshKey, '-o', 'StrictHostKeyChecking=no', '-o', 'ServerAliveInterval=15', '-o', 'ServerAliveCountMax=40', "$SshUser@$SshHost")
$remoteScript = '/tmp/deploy_teachify.sh'
$remoteLog    = '/tmp/deploy_teachify.log'

# Upload the bash payload to the server, then run it DETACHED (setsid) so that a
# local SSH disconnect or a flaky connection cannot kill the long `npm run build`
# and leave the app stuck in maintenance mode. We then stream the log file.
Write-Step "Uploading deploy script to server ..."
$payload | & ssh @SshArgs "cat > $remoteScript"
if ($LASTEXITCODE -ne 0) { Write-Fail "Could not upload deploy script."; exit 1 }

Write-Step "Launching detached deployment on $SshUser@$SshHost ..."
& ssh @SshArgs "setsid bash $remoteScript > $remoteLog 2>&1 < /dev/null & echo LAunched_PID=`$!"
if ($LASTEXITCODE -ne 0) { Write-Fail "Could not launch the deployment."; exit 1 }

Write-Step "Deployment running (detached). Streaming server log ..."
$start = 1
$result = $null
for ($i = 0; $i -lt 180; $i++) {
    Start-Sleep -Seconds 10
    $raw = & ssh @SshArgs "tail -n +$start $remoteLog" 2>$null
    $lines = @($raw) | ForEach-Object { $_ -split "`n" } | Where-Object { $_.Trim() -ne '' }
    if ($lines.Count -gt 0) {
        $lines | ForEach-Object { Write-Host $_ }
        $start += $lines.Count
    }
    $marker = (& ssh @SshArgs "grep -E 'DEPLOY_OK|DEPLOY_FAILED' $remoteLog | tail -1" 2>$null)
    if ($marker -match 'DEPLOY_OK')      { $result = 'OK';     break }
    if ($marker -match 'DEPLOY_FAILED')  { $result = 'FAILED'; break }
    # Remote process exited without a result marker -> fail loudly so the user can recover.
    $alive = (& ssh @SshArgs "pgrep -f '$remoteScript' >/dev/null && echo yes || echo no" 2>$null)
    if ($alive -eq 'no' -and $i -gt 2) {
        Write-Fail "Remote deployment process exited without a result marker (see $remoteLog)."
        $result = 'FAILED'
        break
    }
}

if ($result -eq 'OK') {
    Write-Host ''
    Write-Step "Deployment finished successfully."
    exit 0
} else {
    Write-Fail "Deployment failed on the server (see log above). If the app is stuck in maintenance mode, run on the server: cd /var/www/teachify/apps/api && php artisan up"
    exit 1
}
