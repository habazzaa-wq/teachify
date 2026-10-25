<?php
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tenant = \App\Models\Tenant::find(1);
app()->instance('currentTenant', $tenant);

$sid = (int) ($_GET['sid'] ?? 65);
$session = \App\Models\MediaUploadSession::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)->find($sid);
if (! $session) { header('Content-Type: application/json'); echo json_encode(['error' => 'no session '.$sid]); return; }

$svc = $app->make(\App\Services\Media\ResumableUploadService::class);
try {
    $req = new \Illuminate\Http\Request();
    $result = $svc->finalize($req, $session);
    $asset = $result['asset'];
    header('Content-Type: application/json');
    echo json_encode([
        'ok' => true,
        'asset' => $asset ? [
            'id' => $asset->id,
            'external_id' => $asset->external_id,
            'bunny_library_id' => $asset->bunny_library_id,
            'status' => $asset->status,
            'processing_status' => $asset->processing_status,
        ] : null,
    ]);
} catch (\Throwable $e) {
    header('Content-Type: application/json');
    echo json_encode(['ok' => false, 'error' => get_class($e).': '.$e->getMessage()]);
}
