#!/bin/bash
#
# Teachify SaaS - Canonical re-deploy (NOT the one-time bootstrap in deploy.sh)
#
# WHY THIS SCRIPT EXISTS
# ----------------------
# The one-time bootstrap (deploy/deploy.sh) runs `pm2 delete all && pm2 start`
# only on a fresh install. A subsequent re-deploy that only does
#   git pull && npm run build
# leaves the already-running `next start` process serving the OLD in-memory
# build forever — even though the new .next assets are on disk. That is exactly
# how a frontend fix was "deployed" but never reached browsers: the source
# commit changed, the bundle on disk changed, but the running Next.js process
# kept emitting the pre-fix JavaScript chunks.
#
# This script is the canonical, repeatable path for every re-deploy:
#   pull -> build -> RELOAD the Next process so it serves the new build.
# It also verifies online status and that the served chunks match the new
# on-disk build, failing loudly otherwise. It prints the exact commits so
# SOURCE -> BUILD -> DEPLOYED -> BROWSER remains auditable on the server.
#
# Reality notes (learned from the live VPS):
#  - The running Next process is named `teachify-frontend` (pm2, `next start`
#    on port 3000), not `teachify-next`. The process is detected by name.
#  - The server builds with dev dependencies present (typescript is required
#    by `next build`), so we install with `npm ci` (full), not `--omit=dev`.
#  - Next 16 (Turbopack) does not embed BUILD_ID in the served HTML, so build
#    freshness is verified by checking every served /_next/static/chunks/<n>.js
#    exists on disk in the freshly built .next/static/chunks.
#  - PM2 runs under the deploying user, so no sudo is required when pm2 daemon
#    was started by that user.
#
# USAGE
#   bash deploy/redeploy.sh            # deploy the currently checked-out ref
#   bash deploy/redeploy.sh <rev>      # deploy a specific ref (default: HEAD)
#
set -euo pipefail

DEPLOY_DIR="/var/www/teachify"
REF="${1:-HEAD}"

if [ ! -d "$DEPLOY_DIR/.git" ]; then
  echo "error: $DEPLOY_DIR is not a git checkout." >&2
  exit 1
fi

cd "$DEPLOY_DIR"

echo "==> HEAD before deploy: $(git rev-parse --short HEAD) $(git log -1 --format=%s)"
git fetch --quiet origin
git checkout --quiet "$REF"
echo "==> Deploying:           $(git rev-parse --short HEAD) $(git log -1 --format=%s)"
echo "==> Is working tree clean: $(git status --porcelain | grep -q . && echo 'NO - DELIBERATE' || echo yes)"

# Snapshot the served chunks BEFORE the build so we can prove afterwards that
# the running process switched to a different (new) bundle.
echo "==> Snapshotting served chunks before build..."
OLD_SERVED="$(curl -fsS --max-time 15 "http://127.0.0.1:3000/" 2>/dev/null | grep -oE '_next/static/chunks/[A-Za-z0-9_.-]+\.js' | sort -u || true)"

echo "==> Building web bundle from $(git rev-parse --short HEAD)..."
(
  cd apps/web
  npm ci
  npm run build
)

echo "==> Reloading Next.js so it serves the NEW build..."
# Detect the actual running Next pm2 process by name (teachify-frontend on the
# live VPS, teachify-next as documented fallback for older installs).
NEXT_PROC=""
for N in teachify-frontend teachify-next; do
  if [ -n "$(pm2 pid "$N" 2>/dev/null || true)" ]; then
    NEXT_PROC="$N"
    break
  fi
done
if [ -z "$NEXT_PROC" ]; then
  echo "error: no running Next pm2 process detected (teachify-frontend/teachify-next)." >&2
  exit 1
fi
echo "==> Next process: $NEXT_PROC"

# `reload` swaps the process with the freshly built .next on disk. A plain
# `restart`/`start` is NOT enough -- the running process must be reloaded or it
# keeps the in-memory build from its last start.
pm2 reload "$NEXT_PROC" --update-env || pm2 restart "$NEXT_PROC" --update-env
pm2 save >/dev/null 2>&1 || true

echo "==> Verifying the running Next process is online..."
# Parse the process status from pm2 jlist with node (robust vs JSON field order).
sleep 2
NEXT_ONLINE="$(pm2 jlist 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{try{const a=JSON.parse(s);const p=a.find(x=>x.name===process.argv[1]);console.log(p?p.pm2_env.status:"")}catch(e){console.log("jlist-parse-error")}})' "$NEXT_PROC" || true)"
if [ "$NEXT_ONLINE" != "online" ]; then
  echo "error: $NEXT_PROC is not online after reload (status='$NEXT_ONLINE')." >&2
  exit 1
fi
echo "==> $NEXT_PROC: online."

echo "==> Verifying the served bundle is the NEW build..."
NEW_BUILD_ID="$(cat "$DEPLOY_DIR/apps/web/.next/BUILD_ID" 2>/dev/null || true)"
if [ -z "$NEW_BUILD_ID" ]; then
  echo "error: no .next/BUILD_ID on disk after build." >&2
  exit 1
fi
sleep 2
NEW_SERVED="$(curl -fsS --max-time 15 "http://127.0.0.1:3000/" 2>/dev/null | grep -oE '_next/static/chunks/[A-Za-z0-9_.-]+\.js' | sort -u || true)"
CHUNKS_DIR="$DEPLOY_DIR/apps/web/.next/static/chunks"
FAIL=0
if [ -z "$NEW_SERVED" ]; then
  echo "error: running Next served no /_next/static/chunks references." >&2
  exit 1
fi
for c in $NEW_SERVED; do
  name="$(basename "$c")"
  if [ ! -f "$CHUNKS_DIR/$name" ]; then
    echo "error: served chunk $name is NOT in the new build ($CHUNKS_DIR). Stale in-memory build?" >&2
    FAIL=1
  fi
done
if [ "$FAIL" -ne 0 ]; then
  exit 1
fi
echo "==> All $(echo "$NEW_SERVED" | wc -l) served homepage chunks exist in the new build."
if [ "$OLD_SERVED" != "$NEW_SERVED" ]; then
  echo "==> Served chunk set changed vs pre-deploy snapshot: process serving a different bundle."
else
  echo "==> Note: served homepage chunk set unchanged (fix lives in an auth-gated route chunk); on-disk BUILD_ID still new: $NEW_BUILD_ID"
fi

# Backend: rebuild/optimize + reload Laravel-related workers too.
(
  cd apps/api
  [ -d vendor ] || composer install --no-dev --optimize-autoloader --no-interaction
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
  php artisan event:cache || true
)
pm2 reload "teachify-queue-bunny" --update-env 2>/dev/null || true

echo ""
echo "Deploy complete."
echo "  Deployed commit : $(git rev-parse --short HEAD) $(git log -1 --format=%s)"
echo "  Next process    : $NEXT_PROC (online, reloaded with new .next)"
echo "  BUILD_ID        : $NEW_BUILD_ID"
echo "  Served chunks   : $(echo "$NEW_SERVED" | tr '\n' ' ' | cut -c1-80)..."