#!/bin/bash

# =============================================================================
# Teachify Platform - Tenant Setup Script for Hazem
# =============================================================================

set -e

echo "🚀 Setting up Hazem's tenant..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
API_DIR="${1:-$HOME/public_html/api}"

# =============================================================================
# Step 1: Check if Laravel is installed
# =============================================================================
echo -e "\n${YELLOW}Step 1: Checking Laravel installation...${NC}"

if [ ! -f "$API_DIR/artisan" ]; then
    echo -e "${RED}❌ Laravel not found in $API_DIR${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Laravel found${NC}"

# =============================================================================
# Step 2: Create Tenant
# =============================================================================
echo -e "\n${YELLOW}Step 2: Creating Hazem's tenant...${NC}"

cd "$API_DIR"

php artisan tinker --execute="
\$tenant = \App\Models\Tenant::firstOrCreate(
    ['slug' => 'hazem'],
    [
        'name' => 'حازم - The Mechanist',
        'status' => 'active',
        'description' => 'أكاديمية حازم - The Mechanist Academy',
        'phone' => '',
        'timezone' => 'Asia/Riyadh',
        'language' => 'ar',
        'currency' => 'SAR',
    ]
);
echo 'Tenant created/found with ID: ' . \$tenant->id . PHP_EOL;
"

# =============================================================================
# Step 3: Add Domain
# =============================================================================
echo -e "\n${YELLOW}Step 3: Adding the-mechanist.com domain...${NC}"

php artisan tinker --execute="
\$tenant = \App\Models\Tenant::where('slug', 'hazem')->first();
\$domain = \App\Models\TenantDomain::firstOrCreate(
    ['domain' => 'the-mechanist.com'],
    [
        'tenant_id' => \$tenant->id,
        'type' => 'custom_domain',
        'status' => 'active',
        'is_primary' => true,
        'verified_at' => now(),
        'ssl_status' => 'active',
    ]
);
echo 'Domain added: ' . \$domain->domain . PHP_EOL;
"

# =============================================================================
# Step 4: Create Roles
# =============================================================================
echo -e "\n${YELLOW}Step 4: Creating roles...${NC}"

php artisan tinker --execute="
\$tenant = \App\Models\Tenant::where('slug', 'hazem')->first();
\$roles = ['tenant_owner', 'admin', 'instructor', 'student'];
foreach (\$roles as \$roleName) {
    \App\Models\Role::firstOrCreate(
        ['tenant_id' => \$tenant->id, 'slug' => \$roleName],
        ['name' => \$roleName]
    );
}
echo 'Roles created!' . PHP_EOL;
"

# =============================================================================
# Step 5: Create Owner User
# =============================================================================
echo -e "\n${YELLOW}Step 5: Creating owner user...${NC}"

php artisan tinker --execute="
\$tenant = \App\Models\Tenant::where('slug', 'hazem')->first();

\$owner = \App\Models\User::firstOrCreate(
    ['email' => 'hazem@the-mechanist.com'],
    [
        'name' => 'Hazem',
        'password' => bcrypt('password'),
        'locale' => 'ar',
        'timezone' => 'Asia/Riyadh',
    ]
);

\$membership = \App\Models\TenantUser::firstOrCreate(
    ['tenant_id' => \$tenant->id, 'user_id' => \$owner->id],
    [
        'status' => 'active',
        'joined_at' => now(),
    ]
);

\$ownerRole = \App\Models\Role::where('tenant_id', \$tenant->id)
    ->where('slug', 'tenant_owner')
    ->first();

if (\$ownerRole && !\$membership->roles->contains(\$ownerRole->id)) {
    \$membership->roles()->attach(\$ownerRole->id);
}

echo 'Owner user created: hazem@the-mechanist.com' . PHP_EOL;
echo 'Default password: password' . PHP_EOL;
"

# =============================================================================
# Step 6: Create Settings
# =============================================================================
echo -e "\n${YELLOW}Step 6: Creating tenant settings...${NC}"

php artisan tinker --execute="
\$tenant = \App\Models\Tenant::where('slug', 'hazem')->first();

\$settings = [
    ['group' => 'profile', 'values' => json_encode(['name' => 'حازم - The Mechanist'])],
    ['group' => 'branding', 'values' => json_encode(['primary_color' => '#3B82F6'])],
    ['group' => 'locale', 'values' => json_encode(['language' => 'ar', 'timezone' => 'Asia/Riyadh'])],
    ['group' => 'notifications', 'values' => json_encode(['email_enabled' => true])],
    ['group' => 'enrollment', 'values' => json_encode(['auto_approve' => false])],
    ['group' => 'video', 'values' => json_encode([])],
    ['group' => 'storage', 'values' => json_encode([])],
    ['group' => 'setup', 'values' => json_encode(['completed' => false])],
];

foreach (\$settings as \$setting) {
    \App\Models\TenantSetting::firstOrCreate(
        ['tenant_id' => \$tenant->id, 'group' => \$setting['group']],
        ['values' => \$setting['values']]
    );
}
echo 'Settings created!' . PHP_EOL;
"

# =============================================================================
# Done!
# =============================================================================
echo -e "\n${GREEN}✅ Hazem's tenant setup completed!${NC}"
echo -e "\n${YELLOW}Login credentials:${NC}"
echo -e "Email: ${GREEN}hazem@the-mechanist.com${NC}"
echo -e "Password: ${GREEN}password${NC}"
echo -e "\n${YELLOW}Domain:${NC}"
echo -e "URL: ${GREEN}https://the-mechanist.com${NC}"
echo -e "\n${YELLOW}⚠️  Remember to change the default password after first login!${NC}"
