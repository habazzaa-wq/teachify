<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tenantId = 6; // hazem.academy.test
$tenant = \App\Models\Tenant::find($tenantId);

echo "=== Tenant: {$tenant->name} (ID: {$tenant->id}) ===\n\n";

// Get ALL tenant users and their roles
$memberships = \App\Models\TenantUser::where('tenant_id', $tenantId)
    ->with('roles.permissions')
    ->get();

echo "Total memberships: " . count($memberships) . "\n\n";

foreach ($memberships as $m) {
    $user = $m->user;
    echo "User: {$user->name} (email: {$user->email}, user_id: {$m->user_id})\n";
    echo "  Membership status: {$m->status}\n";
    echo "  Roles: " . $m->roles->pluck('name', 'slug')->toJson() . "\n";
    
    $allPerms = $m->roles->flatMap->permissions->pluck('slug')->unique()->sort()->values()->all();
    echo "  All permissions (" . count($allPerms) . "): " . implode(', ', $allPerms) . "\n";
    echo "  Has media.upload: " . (in_array('media.upload', $allPerms) ? 'YES' : 'NO') . "\n";
    echo "\n";
}
