#!/bin/bash
set -e

# ============================================
# Teachify Deploy Script
# Usage: bash /var/www/teachify/deploy.sh
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT="/var/www/teachify"
API="$PROJECT/apps/api"
WEB="$PROJECT/apps/web"

log()  { echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} $1"; }
ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
fail() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

START=$(date +%s)

# ── 1. Git Pull ──────────────────────────────
log "Pulling latest changes from deploy branch..."
cd "$PROJECT"
git pull origin deploy || fail "git pull failed"

# Detect what changed
API_CHANGED=false
WEB_CHANGED=false

if git diff --name-only HEAD@{1} HEAD 2>/dev/null | grep -q "^apps/api/"; then
  API_CHANGED=true
fi
if git diff --name-only HEAD@{1} HEAD 2>/dev/null | grep -q "^apps/web/"; then
  WEB_CHANGED=true
fi

# If can't detect (first run or squash), treat as both changed
if ! $API_CHANGED && ! $WEB_CHANGED; then
  API_CHANGED=true
  WEB_CHANGED=true
fi

echo ""
if $API_CHANGED; then ok "API changes detected"; fi
if $WEB_CHANGED; then ok "Web changes detected"; fi
echo ""

# ── 2. Fix .env.production ───────────────────
if $API_CHANGED; then
  log "Fixing .env.production values..."
  cd "$API"

  # Ensure DB_PASSWORD is quoted (handles # in password)
  if grep -q '^DB_PASSWORD=.*#' .env.production 2>/dev/null; then
    # Password contains # but is not quoted
    sed -i 's/^DB_PASSWORD=\(.*[^"]\)$/\1/' .env.production 2>/dev/null || true
    # Re-check if still unquoted with #
    if grep -q '^DB_PASSWORD=.*#' .env.production 2>/dev/null && ! grep -q '^DB_PASSWORD=".*#.*"$' .env.production 2>/dev/null; then
      sed -i '/^DB_PASSWORD=/s/^DB_PASSWORD=\(.*\)/DB_PASSWORD="\1"/' .env.production
      warn "DB_PASSWORD was unquoted with # — fixed"
    fi
  fi

  ok ".env.production checked"
fi

# ── 3. Backend (API) ─────────────────────────
if $API_CHANGED; then
  log "Setting up API..."
  cd "$API"

  log "  → composer install"
  composer install --no-dev --optimize-autoloader --no-interaction --quiet 2>/dev/null || \
    composer install --no-dev --optimize-autoloader --no-interaction
  ok "composer install done"

  log "  → artisan migrate"
  php artisan migrate --force 2>/dev/null && ok "migrations done" || warn "migrations skipped or failed"

  log "  → clearing & caching config"
  php artisan config:clear --quiet 2>/dev/null
  php artisan config:cache --quiet 2>/dev/null && ok "config cached" || warn "config cache failed"

  log "  → caching routes"
  php artisan route:cache --quiet 2>/dev/null && ok "routes cached" || warn "route cache failed"

  log "  → caching views"
  php artisan view:cache --quiet 2>/dev/null && ok "views cached" || warn "view cache failed"

  log "  → storage:link"
  php artisan storage:link --quiet 2>/dev/null && ok "storage link done" || warn "storage link already exists or failed"

  # Clear old logs (keep last 7 days)
  find "$API/storage/logs" -name "laravel-*.log" -mtime +7 -delete 2>/dev/null || true
fi

# ── 4. Frontend (Web) ────────────────────────
if $WEB_CHANGED; then
  log "Setting up Web..."
  cd "$WEB"

  log "  → npm ci"
  npm ci --omit=dev --silent 2>/dev/null || npm install --omit=dev
  ok "npm install done"

  log "  → npm run build"
  npm run build
  ok "frontend build done"
fi

# ── 5. Restart PM2 ───────────────────────────
log "Restarting PM2 processes..."
cd "$PROJECT"
pm2 restart all 2>/dev/null && ok "PM2 restarted" || warn "PM2 restart failed (might not be running)"

# ── Summary ──────────────────────────────────
END=$(date +%s)
DURATION=$((END - START))

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  Deploy completed in ${DURATION}s${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
