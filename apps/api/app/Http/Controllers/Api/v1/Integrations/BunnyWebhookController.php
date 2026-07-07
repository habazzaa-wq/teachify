<?php

namespace App\Http\Controllers\Api\v1\Integrations;

use App\Http\Controllers\Controller;
use App\Models\MediaAsset;
use App\Models\TenantIntegration;
use App\Services\Media\BunnyStreamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class BunnyWebhookController extends Controller
{
    public function __invoke(Request $request, BunnyStreamService $stream): JsonResponse
    {
        $asset = $this->resolveAsset($request->all());
        $this->validateSignature($request, $asset->tenant_id);

        try {
            $asset = $stream->processWebhook($request->all());
        } catch (ValidationException $exception) {
            abort(404, $exception->getMessage());
        }

        return response()->json([
            'message' => 'Bunny webhook processed.',
            'asset' => [
                'id' => $asset->id,
                'tenant_id' => $asset->tenant_id,
                'status' => $asset->status,
                'metadata' => $asset->metadata,
            ],
        ]);
    }

    private function validateSignature(Request $request, int $tenantId): void
    {
        $signature = (string) $request->header('X-Bunny-Signature', '');
        $sharedSecret = (string) $request->header('X-Bunny-Webhook-Secret', '');
        $payload = $request->getContent();

        $valid = TenantIntegration::query()
            ->where('provider', 'bunny')
            ->where('service', 'stream')
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['pending', 'active'])
            ->get()
            ->contains(function (TenantIntegration $integration) use ($signature, $sharedSecret, $payload): bool {
                $secret = (string) (($integration->config ?? [])['webhook_secret'] ?? '');

                if ($secret === '') {
                    return false;
                }

                if ($sharedSecret !== '' && hash_equals($secret, $sharedSecret)) {
                    return true;
                }

                $expected = hash_hmac('sha256', $payload, $secret);

                return $signature !== '' && hash_equals($expected, $signature);
            });

        abort_unless($valid, 401, 'Invalid Bunny webhook signature.');
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function resolveAsset(array $payload): MediaAsset
    {
        $videoId = $payload['bunny_video_id']
            ?? $payload['video_id']
            ?? $payload['videoGuid']
            ?? $payload['VideoGuid']
            ?? $payload['guid']
            ?? null;

        abort_if($videoId === null, 404, 'Unknown Bunny Stream asset.');

        $asset = MediaAsset::withoutGlobalScopes()
            ->where('provider', 'bunny')
            ->where('provider_service', 'stream')
            ->where('type', 'video')
            ->where('external_id', (string) $videoId)
            ->first();

        abort_if(! $asset, 404, 'Unknown Bunny Stream asset.');

        return $asset;
    }
}
