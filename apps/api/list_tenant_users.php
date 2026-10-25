<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$rows = DB::table('tenant_users')->where('tenant_id', 1)->get();
foreach ($rows as $r) {
    $role = $r->role ?? 'unknown';
    echo "- tenant_user={$r->id} user_id={$r->user_id} role={$role} status={$r->status}\n";
}
