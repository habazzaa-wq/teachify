#!/bin/bash
#
# Teachify SaaS - Canonical re-deploy (NOT the one-time bootstrap in deploy.sh)
#
# WHY THIS SCRIPT EXISTS
# ----------------------
# The one-time bootstrap (deploy/deploy.sh) runs `pm2 delete all && pm2 start`
# only on a fresh install. A subsequent re-deploy that only does
#   git pull && npm run build
# leaves the already-running `next start` cluster (teachify-next) serving the
# OLD in-memory build forever — even though the new .next assets are on disk.
# That is exactly how a frontend fix was "deployed" but never reached browsers:
# the source commit changed, the bundle on disk changed, but the running Next.js
# process kept emitting the pre-fix JavaScript chunks.
#
# This script is the canonical, repeatable path for every re-deploy:
#   pull -> build -> RELOAD the Next process so it serves the new build.
# It also prints the exact commits so SOURCE -> BUILD -> DEPLOYED -> BROWSER
# remains auditable on the server.
#
# USAGE
#   sudo ./deploy/redeploy.sh            # deploy the currently checked-out ref
#   sudo ./deploy/redeploy.sh <rev>      # deploy a specific ref (default: HEAD)
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

echo "==> Building web bundle from $(git rev-parse --short HEAD)..."
(
  cd apps/web
  npm ci --omit=dev
  npm run build
)

echo "==> Reloading Next.js so it serves the NEW build..."
# `reload` swaps the cluster with the freshly built .next on disk. A plain
# `restart`/`start` is NOT enough -- the running process must be reloaded or it
# keeps the in-memory build from its last start.
pm2 reload teachify-next --update-env || pm2 restart teachify-next --update-env
pm2 save >/dev/null 2>&1 || true

echo "==> Verifying the running Next process is online..."
# `pm2 jlist` is machine-readable; fail loudly if the process is not 'online'.
NEXT_ONLINE="$(pm2 jlist 2>/dev/null | grep -o '"name":"teachify-next","pm2_env":[^}]*"status":"[a-z]*"' | grep -o '"status":"[a-z]*"' | head -n1 | cut -d'"' -f4)"
if [ "$NEXT_ONLINE" != "online" ]; then
  echo "error: teachify-next is not online after reload (status='$NEXT_ONLINE')." >&2
  exit 1
fi
echo "==> teachify-next: online."

echo "==> Verifying the served bundle is the NEW build..."
# The source of truth for "what the running process serves" is the .next build it
# was reloaded with. BUILD_ID is the immutable identity Next embeds in HTML and
# in every /_next/static/<BUILD_ID>/... asset path.
NEW_BUILD_ID="$(cat "$DEPLOY_DIR/apps/web/.next/BUILD_ID" 2>/dev/null || true)"
if [ -z "$NEW_BUILD_ID" ]; then
  echo "error: no .next/BUILD_ID on disk after build." >&2
  exit 1
fi
# Served HTML should reference the on-disk build id. Wait briefly for startup.
sleep 2
SERVED_REF="$(curl -fsS --max-time 15 "http://127.0.0.1:3000/" 2>/dev/null | grep -o "$NEW_BUILD_ID" | head -n1 || true)"
if [ -z "$SERVED_REF" ]; then
  echo "error: running Next did not serve a page referencing build id $NEW_BUILD_ID (stale build?)." >&2
  exit 1
fi
echo "==> Served build ID: $NEW_BUILD_ID (matches on-disk .next/BUILD_ID)."

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
echo "  Served BUILD_ID : ${NEW_BUILD_ID:-unknown} (running Next verified to serve it)"
