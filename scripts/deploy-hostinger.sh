#!/bin/bash

# =============================================================================
# Teachify Platform - Laravel API Deployment Script for Hostinger
# =============================================================================

set -e

echo "🚀 Starting Teachify API deployment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
DEPLOY_DIR="${1:-$HOME/public_html/api}"
REPO_URL="https://github.com/habazzaa-wq/teachify.git"
BRANCH="deploy"

# =============================================================================
# Step 1: Check prerequisites
# =============================================================================
echo -e "\n${YELLOW}Step 1: Checking prerequisites...${NC}"

# Check PHP
if ! command -v php &> /dev/null; then
    echo -e "${RED}❌ PHP is not installed. Please install PHP 8.3+ first.${NC}"
    exit 1
fi

PHP_VERSION=$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;')
echo -e "${GREEN}✓ PHP $PHP_VERSION detected${NC}"

# Check Composer
if ! command -v composer &> /dev/null; then
    echo -e "${RED}❌ Composer is not installed. Please install Composer first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Composer detected${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 20+ first.${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js $NODE_VERSION detected${NC}"

# =============================================================================
# Step 2: Clone/Update repository
# =============================================================================
echo -e "\n${YELLOW}Step 2: Cloning/updating repository...${NC}"

if [ -d "$DEPLOY_DIR/.git" ]; then
    echo "Repository exists, pulling latest changes..."
    cd "$DEPLOY_DIR"
    git pull origin "$BRANCH"
else
    echo "Cloning repository..."
    git clone -b "$BRANCH" "$REPO_URL" "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
fi

# =============================================================================
# Step 3: Install PHP dependencies
# =============================================================================
echo -e "\n${YELLOW}Step 3: Installing PHP dependencies...${NC}"
composer install --optimize-autoloader --no-dev --no-interaction

# =============================================================================
# Step 4: Setup environment
# =============================================================================
echo -e "\n${YELLOW}Step 4: Setting up environment...${NC}"

if [ ! -f ".env" ]; then
    echo "Creating .env from .env.production..."
    cp .env.production .env
    
    # Generate APP_KEY
    echo "Generating application key..."
    php artisan key:generate --force
    
    echo -e "${YELLOW}⚠️  Please edit .env file and set your database credentials!${NC}"
    echo -e "${YELLOW}   Run: nano $DEPLOY_DIR/.env${NC}"
else
    echo ".env file already exists, skipping..."
fi

# =============================================================================
# Step 5: Install Node dependencies and build assets
# =============================================================================
echo -e "\n${YELLOW}Step 5: Building frontend assets...${NC}"

if [ ! -d "node_modules" ]; then
    npm install --production=false
fi

npm run build

# =============================================================================
# Step 6: Setup database
# =============================================================================
echo -e "\n${YELLOW}Step 6: Running database migrations...${NC}"

read -p "Do you want to run migrations? (y/n): " RUN_MIGRATIONS
if [ "$RUN_MIGRATIONS" = "y" ]; then
    php artisan migrate --force
    
    read -p "Do you want to run seeders? (y/n): " RUN_SEEDERS
    if [ "$RUN_SEEDERS" = "y" ]; then
        php artisan db:seed --class=IdentityAccessSeeder --force
        php artisan db:seed --class=SuperAdminUserSeeder --force
    fi
fi

# =============================================================================
# Step 7: Cache configuration
# =============================================================================
echo -e "\n${YELLOW}Step 7: Caching configuration...${NC}"
php artisan config:cache
php artisan route:cache
php artisan view:cache

# =============================================================================
# Step 8: Create storage link
# =============================================================================
echo -e "\n${YELLOW}Step 8: Creating storage link...${NC}"
php artisan storage:link --force

# =============================================================================
# Step 9: Set permissions
# =============================================================================
echo -e "\n${YELLOW}Step 9: Setting permissions...${NC}"
chmod -R 755 storage
chmod -R 755 bootstrap/cache

# =============================================================================
# Step 10: Create .htaccess for Laravel
# =============================================================================
echo -e "\n${YELLOW}Step 10: Creating .htaccess...${NC}"

cat > public/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
EOF

# =============================================================================
# Step 11: Create .htaccess for API root (to route to public/)
# =============================================================================
cat > .htaccess << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
EOF

# =============================================================================
# Done!
# =============================================================================
echo -e "\n${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Edit .env file: ${GREEN}nano $DEPLOY_DIR/.env${NC}"
echo -e "2. Set your database credentials in .env"
echo -e "3. Run migrations if you haven't: ${GREEN}php artisan migrate --force${NC}"
echo -e "4. Test your API: ${GREEN}curl https://teachify.tech/api/diag/ping${NC}"
echo -e "\n${YELLOW}Optional:${NC}"
echo -e "1. Setup Cron Job for Scheduler:"
echo -e "   ${GREEN}* * * * * cd $DEPLOY_DIR && php artisan schedule:run >> /dev/null 2>&1${NC}"
echo -e "2. Setup Queue Worker (if supported):"
echo -e "   ${GREEN}php artisan queue:work --tries=3 --stop-when-empty${NC}"
