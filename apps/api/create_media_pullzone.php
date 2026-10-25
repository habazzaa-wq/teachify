<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$s = \App\Models\PlatformBunnySetting::first();
$apiKey = $s->api_key;

$body = json_encode([
    'Name' => 'teachify-media',
    'OriginUrl' => '',
    'StorageZoneId' => 1746174,
]);

$ch = curl_init('https://api.bunny.net/pullzone');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 40,
    CURLOPT_CUSTOMREQUEST => 'POST',
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_HTTPHEADER => [
        "AccessKey: {$apiKey}",
        'Content-Type: application/json',
    ],
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);

echo "code=$code err=$err\n";
echo substr($resp, 0, 1500) . "\n";

if ($code == 201 || $code == 200) {
    $zone = json_decode($resp, true);
    echo "\nNEW PULL ZONE:\n";
    echo "id={$zone['Id']} name={$zone['Name']}\n";
    foreach (($zone['Hostnames'] ?? []) as $h) {
        echo "hostname={$h['Value']}\n";
    }
}
