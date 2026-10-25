<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

$user = User::find(12);
echo "user=" . ($user ? $user->email : 'not found') . "\n";
if (!$user) { exit; }

$token = $user->createToken('api-test')->plainTextToken;
echo "token created\n";

function req($url, $token = null) {
    $headers = [];
    if ($token) $headers[] = "Authorization: Bearer {$token}";
    $headers[] = "Accept: application/json";
    $headers[] = "Content-Type: application/json";
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 40,
        CURLOPT_HTTPHEADER => $headers,
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$code, $body];
}

echo "\n=== lesson 4 (free preview, no token) ===\n";
list($c, $b) = req('https://the-mechanist.teachify.tech/api/v1/public/courses/chemical-equilibrium/lessons/4/video');
echo "code=$c\n" . substr($b, 0, 600) . "\n";

echo "\n=== lesson 10 (enrolled user 12) ===\n";
list($c, $b) = req('https://the-mechanist.teachify.tech/api/v1/public/courses/chemical-equilibrium/lessons/10/video', $token);
echo "code=$c\n" . substr($b, 0, 1000) . "\n";

$user->tokens()->delete();
echo "\ntoken revoked\n";
