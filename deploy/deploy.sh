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
PHP_VERSION="8.3"

echo "=== Teachify SaaS Deployment ==="
echo ""

# ── 1. System packages ──
echo "[1/14] Installing system packages..."
apt-get update -y
apt-get install -y software-properties-common curl git unzip \
  nginx certbot python3-certbot-nginx \
  mysql-server \
  php${PHP_VERSION}-fpm php${PHP_VERSION}-mysql php${PHP_VERSION}-mbstring \
  php${PHP_VERSION}-xml php${PHP_VERSION}-curl php${PHP_VERSION}-zip \
  php${PHP_VERSION}-bcmath php${PHP_VERSION}-gd php${PHP_VERSION}-imagick \
  php${PHP_VERSION}-redis php${PHP_VERSION}-opcache \
  nodejs npm

# Ensure Node 20+ LTS
if ! command -v nvm &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# ── 2. MySQL setup ──
echo "[2/14] Setting up MySQL..."
mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL

# ── 3. Clone repository ──
echo "[3/14] Cloning repository..."
if [ ! -d "$DEPLOY_DIR" ]; then
  git clone "$REPO_URL" "$DEPLOY_DIR"
fi
cd "$DEPLOY_DIR"

# ── 4. Create directory structure ──
echo "[4/14] Creating directories..."
mkdir -p "$DEPLOY_DIR"/logs
mkdir -p "$DEPLOY_DIR"/apps/api/storage/logs
mkdir -p "$DEPLOY_DIR"/apps/api/storage/framework/{cache,sessions,views}
mkdir -p "$DEPLOY_DIR"/apps/api/storage/app/{public,private,uploads}
mkdir -p "$DEPLOY_DIR"/apps/api/bootstrap/cache
mkdir -p "$DEPLOY_DIR"/apps/web/public
mkdir -p "$DEPLOY_DIR"/certbot/.well-known/acme-challenge

# ── 5. Backend dependencies ──
echo "[5/14] Installing PHP dependencies..."
cd "$DEPLOY_DIR/apps/api"
composer install --no-dev --optimize-autoloader --no-interaction

# ── 6. Frontend dependencies ──
echo "[6/14] Installing Node dependencies..."
cd "$DEPLOY_DIR/apps/web"
npm ci --omit=dev

# ── 7. Configure environment ──
echo "[7/14] Configuring environment..."
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
echo "[8/14] Running migrations..."
php artisan migrate --force

# ── 9. Seed super admin ──
echo "[9/14] Seeding super admin..."
php artisan db:seed --class=SuperAdminUserSeeder --force

# ── 10. Laravel optimization ──
echo "[10/14] Optimizing Laravel..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
php artisan icons:cache 2>/dev/null || true
php artisan storage:link --force 2>/dev/null || true

# Fix permissions
chown -R www-data:www-data "$DEPLOY_DIR"
chmod -R 775 "$DEPLOY_DIR/apps/api/storage"
chmod -R 775 "$DEPLOY_DIR/apps/api/bootstrap/cache"
chmod -R 775 "$DEPLOY_DIR/logs"

# ── 11. Build frontend ──
echo "[11/14] Building Next.js..."
cd "$DEPLOY_DIR/apps/web"
npm run build

# ── 12. Configure PM2 ──
echo "[12/14] Starting PM2 processes..."
cd "$DEPLOY_DIR"
pm2 delete all 2>/dev/null || true
pm2 start deploy/pm2/ecosystem.config.js
pm2 save

# ── 13. Configure Nginx ──
echo "[13/14] Configuring Nginx..."
cp "$DEPLOY_DIR/deploy/nginx/teachify.conf" /etc/nginx/sites-available/teachify
ln -sf /etc/nginx/sites-available/teachify /etc/nginx/sites-enabled/teachify
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ── 14. SSL certificate ──
echo "[14/14] Obtaining SSL certificate..."
certbot certonly --webroot -w "$DEPLOY_DIR/certbot" \
  -d "$DOMAIN" -d "www.$DOMAIN" \
  --non-interactive --agree-tos --email "admin@$DOMAIN"

# Reload nginx with SSL
systemctl reload nginx

# ── Setup automatic renewal ──
echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'" | crontab -

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
