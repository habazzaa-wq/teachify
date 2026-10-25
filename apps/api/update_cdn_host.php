<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$newBase = 'https://teachify-media.b-cdn.net';

$updated = DB::table('platform_bunny_settings')
    ->where('id', 1)
    ->update([
        'cdn_hostname' => $newBase . '/',
        'updated_at' => now(),
    ]);
echo "cdn_hostname updated rows=$updated\n";

$assets = DB::table('media_assets')
    ->whereNull('deleted_at')
    ->where('provider', 'bunny')
    ->where('provider_service', 'storage')
    ->get();

$count = 0;
foreach ($assets as $a) {
    if (empty($a->storage_path) && empty($a->bunny_storage_path)) {
        echo "- id={$a->id}: skipped (no storage path)\n";
        continue;
    }
    $path = $a->bunny_storage_path ?: $a->storage_path;
    $newUrl = $newBase . '/' . ltrim($path, '/');
    DB::table('media_assets')->where('id', $a->id)->update(['cdn_url' => $newUrl, 'updated_at' => now()]);
    echo "- id={$a->id}: cdn_url => {$newUrl}\n";
    $count++;
}
echo "assets updated=$count\n";

echo "\n=== verify platform settings ===\n";
$s = DB::table('platform_bunny_settings')->where('id', 1)->first();
echo "cdn_hostname={$s->cdn_hostname}\n";
