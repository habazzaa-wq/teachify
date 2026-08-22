#!/bin/bash
# Teachify SaaS - VPS Deployment Script
# Run as root or with sudo on fresh Ubuntu 22.04/24.04
set -euo pipefail

# ── Configuration ──
REPO_URL="https://github.com/YOUR_USERNAME/teachify.git"
DEPLOY_DIR="/var/www/teachify"
DB_NAME="teachify"
DB_USER="teachify_user"
DB_PASS="CHANGE_ME"  # Change this before running!
DOMAIN="teachify.tech"
PHP_VERSION="8.4"

echo "=== Teachify SaaS Deployment ==="
echo ""

# ── 1. System packages ──
echo "[1/13] Installing system packages..."
apt-get update -y
apt-get install -y software-properties-common curl git unzip \
  debian-keyring debian-archive-keyring apt-transport-https \
  mysql-server \
  php${PHP_VERSION}-fpm php${PHP_VERSION}-mysql php${PHP_VERSION}-mbstring \
  php${PHP_VERSION}-xml php${PHP_VERSION}-curl php${PHP_VERSION}-zip \
  php${PHP_VERSION}-bcmath php${PHP_VERSION}-gd php${PHP_VERSION}-imagick \
  php${PHP_VERSION}-redis php${PHP_VERSION}-opcache \
  nodejs npm

# Install Caddy
if ! command -v caddy &> /dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
fi

# Ensure Node 20+ LTS
if ! command -v nvm &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# ── 2. MySQL setup ──
echo "[2/13] Setting up MySQL..."
mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL

# ── 3. Clone repository ──
echo "[3/13] Cloning repository..."
if [ ! -d "$DEPLOY_DIR" ]; then
  git clone "$REPO_URL" "$DEPLOY_DIR"
fi
cd "$DEPLOY_DIR"

# ── 4. Create directory structure ──
echo "[4/13] Creating directories..."
mkdir -p "$DEPLOY_DIR"/logs
mkdir -p "$DEPLOY_DIR"/apps/api/storage/logs
mkdir -p "$DEPLOY_DIR"/apps/api/storage/framework/{cache,sessions,views}
mkdir -p "$DEPLOY_DIR"/apps/api/storage/app/{public,private,uploads}
mkdir -p "$DEPLOY_DIR"/apps/api/bootstrap/cache
mkdir -p "$DEPLOY_DIR"/apps/web/public

# ── 5. Backend dependencies ──
echo "[5/13] Installing PHP dependencies..."
cd "$DEPLOY_DIR/apps/api"
composer install --no-dev --optimize-autoloader --no-interaction

# ── 6. Frontend dependencies ──
echo "[6/13] Installing Node dependencies..."
cd "$DEPLOY_DIR/apps/web"
npm ci --omit=dev

# ── 7. Configure environment ──
echo "[7/13] Configuring environment..."
cd "$DEPLOY_DIR/apps/api"
if [ ! -f .env ]; then
  cp .env.production .env
  echo ">> Generated APP_KEY:"
  php artisan key:generate --force
fi
# Update DB credentials in .env
sed -i "s/DB_DATABASE=.*/DB_DATABASE=${DB_NAME}/" .env
sed -i "s/DB_USERNAME=.*/DB_USERNAME=${DB_USER}/" .env
sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=${DB_PASS}/" .env

# ── 8. Database migration ──
echo "[8/13] Running migrations..."
php artisan migrate --force

# ── 9. Seed super admin ──
echo "[9/13] Seeding super admin..."
php artisan db:seed --class=SuperAdminUserSeeder --force

# ── 10. Laravel optimization ──
echo "[10/13] Optimizing Laravel..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
php artisan icons:cache 2>/dev/null || true
php artisan storage:link --force 2>/dev/null || true

# Fix permissions
chown -R deplo:www-data "$DEPLOY_DIR"
chmod -R 775 "$DEPLOY_DIR/apps/api/storage"
chmod -R 775 "$DEPLOY_DIR/apps/api/bootstrap/cache"
chmod -R 775 "$DEPLOY_DIR/logs"
chmod g+s "$DEPLOY_DIR/apps/api/storage/app/uploads"

# ── 11. Build frontend ──
echo "[11/13] Building Next.js..."
cd "$DEPLOY_DIR/apps/web"
npm run build

# ── 12. Configure PM2 ──
echo "[12/13] Starting PM2 processes..."
cd "$DEPLOY_DIR"
pm2 delete all 2>/dev/null || true
pm2 start deploy/pm2/ecosystem.config.js
pm2 save

# ── 13. Configure Caddy ──
echo "[13/13] Configuring Caddy..."

# Generate CADDY_ASK_SECRET if not already set in .env
if ! grep -q '^CADDY_ASK_SECRET=.\+' "$DEPLOY_DIR/apps/api/.env" 2>/dev/null; then
  NEW_SECRET=$(openssl rand -hex 32)
  sed -i "s/^CADDY_ASK_SECRET=.*/CADDY_ASK_SECRET=${NEW_SECRET}/" "$DEPLOY_DIR/apps/api/.env"
  echo ">> Generated new CADDY_ASK_SECRET"
fi

# Read the secret for Caddy's environment
CADDY_SECRET=$(grep '^CADDY_ASK_SECRET=' "$DEPLOY_DIR/apps/api/.env" | cut -d'=' -f2-)

# Write Caddy environment file so {env.CADDY_ASK_SECRET} works in the Caddyfile
mkdir -p /etc/default
echo "CADDY_ASK_SECRET=${CADDY_SECRET}" > /etc/default/caddy
chmod 600 /etc/default/caddy

cp "$DEPLOY_DIR/deploy/Caddyfile" /etc/caddy/Caddyfile
systemctl enable caddy
systemctl restart caddy

# ── Setup automatic renewal ──
# Caddy handles SSL automatically via on-demand TLS - no certbot needed

# ── Crontab for Laravel scheduler (if not using PM2 scheduler) ──
# echo "* * * * * cd /var/www/teachify/apps/api && php artisan schedule:run >> /dev/null 2>&1" | crontab -u www-data -

echo ""
echo "=== Deployment Complete ==="
echo "Site: https://$DOMAIN"
echo "Super admin: admin@$DOMAIN (check SUPERADMIN_PASSWORD in .env)"
echo ""
echo "Next steps:"
echo "  1. Update SUPERADMIN_PASSWORD in $DEPLOY_DIR/apps/api/.env"
echo "  2. Login at https://$DOMAIN/superadmin/login"
echo "  3. Create tenants via the platform admin dashboard"
echo "  4. Custom domains will be auto-verified via scheduled jobs"
