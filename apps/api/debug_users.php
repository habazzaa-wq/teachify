<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\TenantUser;

echo "=== ALL USERS ===" . PHP_EOL;
foreach (User::all() as $u) {
    echo "ID: {$u->id} | Name: {$u->name} | Email: {$u->email}" . PHP_EOL;
}

echo PHP_EOL . "=== ALL TENANT_USERS (memberships) ===" . PHP_EOL;
$tenants = TenantUser::with(['user', 'tenant', 'roles'])->get();
foreach ($tenants as $tu) {
    $userName = $tu->user ? $tu->user->name : 'N/A';
    $userEmail = $tu->user ? $tu->user->email : 'N/A';
    $tenantName = $tu->tenant ? $tu->tenant->name : 'N/A';
    $roles = $tu->roles->pluck('name')->implode(', ');
    echo "TenantUser ID: {$tu->id} | User: {$userName} ({$userEmail}) | Tenant: {$tenantName} | Status: {$tu->status} | Roles: {$roles}" . PHP_EOL;
}

echo PHP_EOL . "=== HAZEM TENANT (ID 6) MEMBERSHIPS ===" . PHP_EOL;
$memberships = TenantUser::where('tenant_id', 6)->with(['user', 'roles'])->get();
foreach ($memberships as $tu) {
    $userName = $tu->user ? $tu->user->name : 'N/A';
    $userEmail = $tu->user ? $tu->user->email : 'N/A';
    $roles = $tu->roles->pluck('name')->implode(', ');
    $avatar = $tu->avatar ?? 'null';
    echo "TenantUser ID: {$tu->id} | UserID: {$tu->user_id} | User: {$userName} ({$userEmail}) | Status: {$tu->status} | Roles: {$roles} | Avatar: {$avatar}" . PHP_EOL;
}
