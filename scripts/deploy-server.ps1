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
#>

param(
    [switch]$Yes,
    [switch]$NoBuild,
    [switch]$NoMigrate,
    [switch]$NoRestart
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
if (-not (Test-CleanTree -Path $repo)) {
    Write-Fail "Local working tree is dirty. Commit (or stash) everything before deploying."
    exit 1
}
$ahead = & git -C $repo rev-list --count "origin/$Branch..$Branch"
if ([int]$ahead -gt 0) {
    Write-Fail "Local '$Branch' is $ahead commit(s) ahead of origin. Push to GitHub first."
    exit 1
}

$localSha = (& git -C $repo rev-parse $Branch).Trim()
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
$payload = @"
#!/bin/bash
set -euo pipefail
REMOTE_DIR="$RemoteDir"
BRANCH="$Branch"
EXPECTED="$localSha"
DO_BUILD=$doBuild
DO_MIGRATE=$doMigrate
DO_RESTART=$doRestart

export PATH="$HOME/.config/composer/vendor/bin:/usr/local/bin:/usr/local/node/bin:/usr/local/bin:/usr/bin:$PATH"

MAINT_OK=0
trap 'if [ "$MAINT_OK" = "1" ]; then echo "==> Bringing app back up"; php artisan up || true; fi' EXIT

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
  if [ "$MAINT" = "1" ] || true; then
    cd "$REMOTE_DIR/apps/api"
    echo "==> Maintenance mode ON"
    php artisan down || true
    MAINT_OK=1
  fi

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

CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000" || true)
echo "HEALTH=$CODE"
echo "DEPLOY_OK sha=$GOT"
"@

# PowerShell strips CRLF so bash does not choke on stray carriage returns.
$payload = $payload -replace "`r", ""

$SshArgs = @('-i', $SshKey, '-o', 'StrictHostKeyChecking=no', "$SshUser@$SshHost")

Write-Step "Deploying to $SshUser@$SshHost ..."
& ssh @SshArgs "bash -s" <<< $payload
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Deployment failed on the server (see output above)."
    exit 1
}

Write-Host ''
Write-Step "Deployment finished successfully."
exit 0
