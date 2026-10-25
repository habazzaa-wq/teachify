<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "tenants cols: " . json_encode(Schema::getColumnListing('tenants')) . "\n";
echo "tenant_domains cols: " . json_encode(Schema::getColumnListing('tenant_domains')) . "\n";
echo "users cols: " . json_encode(Schema::getColumnListing('users')) . "\n\n";

$tenants = DB::table('tenants')->select('*')->get();
foreach ($tenants as $t) {
    echo "tenant=" . $t->id . " status=" . ($t->status ?? '?') . " name=" . ($t->name ?? '?') . " data=" . json_encode($t) . "\n";
}
$domains = DB::table('tenant_domains')->select('*')->get();
foreach ($domains as $d) {
    echo "domain=" . json_encode($d) . "\n";
}
