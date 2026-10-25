<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\Bunny\Contracts\BunnyStreamInterface;
use App\Services\Bunny\BunnyClient;

$client = app(BunnyClient::class);
$settings = $client->settings();
echo "Platform library_id = {$settings->library_id}\n";
echo "Platform has stream creds = " . var_export($settings->hasStreamCredentials(), true) . "\n";
echo "Stream api key (masked) = " . substr((string) $settings->stream_api_key, 0, 6) . "...\n";

$videoId = '9cddee4b-a463-47e3-b151-b518e905e43d';
$libraryId = (string) $settings->library_id;

echo "\n--- Trying to fetch video {$videoId} in platform library {$libraryId} via raw request ---\n";
try {
    $raw = $client->streamRequest('GET', "library/{$libraryId}/videos/{$videoId}", ['operation' => 'test_video_lookup']);
    echo "FOUND:\n" . json_encode($raw, JSON_PRETTY_PRINT) . "\n";
} catch (\Throwable $e) {
    echo "ERROR: " . get_class($e) . ": " . $e->getMessage() . "\n";
    if (method_exists($e, 'getResponse')) {
        try { echo "BODY: " . substr((string) $e->getResponse()->getBody(), 0, 500) . "\n"; } catch (\Throwable $ignored) {}
    }
}

echo "\n--- Listing videos in library {$libraryId} ---\n";
try {
    $list = $client->streamRequest('GET', "library/{$libraryId}/videos?page=1&itemsPerPage=25", ['operation' => 'test_video_list']);
    $items = $list['items'] ?? [];
    echo "count = " . count($items) . "\n";
    foreach ($items as $v) {
        echo "  guid=" . ($v['guid'] ?? '?') . " title=" . ($v['title'] ?? '?') . " status=" . ($v['status'] ?? ($v['encodeStatus'] ?? '?')) . "\n";
    }
} catch (\Throwable $e) {
    echo "ERROR: " . get_class($e) . ": " . $e->getMessage() . "\n";
}
