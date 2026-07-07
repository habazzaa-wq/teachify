<?php

namespace App\Services\Media;

use App\Models\MediaAsset;
use App\Models\MediaUploadSession;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BunnyIntegrationService
{
    public function __construct(
        private readonly MediaManager $manager,
    ) {
    }

    public function createUploadIntent(
        Tenant $tenant,
        TenantUser $uploader,
        array $data,
        string $service = 'storage',
    ): array {
        $integration = $this->getIntegration($tenant, $service);
        $config = $integration->config ?? [];

        $provider = $this->manager->providerFor('bunny', $service);

        $type = $data['type'] ?? 'file';
        $filename = $data['original_filename'] ?? 'untitled';
        $storageKey = $this->generateStorageKey($tenant, $type, $filename);

        if ($service === 'stream') {
            $videoId = $data['bunny_video_id'] ?? (string) Str::uuid();
        } else {
            $videoId = null;
        }

        return DB::transaction(function () use (
            $tenant, $uploader, $data, $config, $provider,
            $service, $type, $filename, $storageKey, $videoId,
        ) {
            $asset = MediaAsset::create([
                'tenant_id' => $tenant->id,
                'uploader_id' => $uploader->id,
                'folder_id' => $data['folder_id'] ?? null,
                'type' => $type,
                'source' => $data['source'] ?? 'upload',
                'provider' => 'bunny',
                'provider_service' => $service,
                'status' => 'pending',
                'processing_status' => 'uploading',
                'visibility' => $data['visibility'] ?? 'private',
                'storage_key' => $storageKey,
                'external_id' => $videoId,
                'bunny_video_id' => $videoId,
                'bunny_library_id' => $config['library_id'] ?? null,
                'bunny_storage_path' => $service === 'storage' ? $storageKey : null,
                'original_filename' => $filename,
                'original_name' => $filename,
                'title' => $data['title'] ?? null,
                'mime_type' => $data['mime_type'] ?? null,
                'extension' => pathinfo($filename, PATHINFO_EXTENSION),
                'size_bytes' => $data['size_bytes'] ?? 0,
                'checksum' => $data['checksum'] ?? null,
                'metadata' => [
                    'bunny_video_id' => $videoId,
                    'upload_service' => $service,
                    'collection' => $data['collection'] ?? null,
                ],
            ]);

            $session = MediaUploadSession::create([
                'tenant_id' => $tenant->id,
                'media_asset_id' => $asset->id,
                'created_by_tenant_user_id' => $uploader->id,
                'provider' => 'bunny',
                'provider_service' => $service,
                'status' => 'draft',
                'expires_at' => now()->addMinutes(60),
                'metadata' => [
                    'storage_key' => $storageKey,
                    'bunny_video_id' => $videoId,
                    'asset_type' => $type,
                ],
            ]);

            $intent = $provider->createUploadIntent($session, [
                'storage_key' => $storageKey,
                'video_id' => $videoId,
                'collection' => $data['collection'] ?? null,
                'original_filename' => $filename,
            ]);

            return [
                'asset' => $asset->fresh()->load(['folder', 'uploader']),
                'session' => $session->fresh(),
                'intent' => $intent,
            ];
        });
    }

    public function confirmUpload(
        Tenant $tenant,
        MediaUploadSession $session,
        array $payload = [],
    ): array {
        if ($session->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'session' => ['Invalid upload session for this tenant.'],
            ]);
        }

        $provider = $this->manager->providerFor(
            $session->provider,
            $session->provider_service,
        );

        $providerResult = $provider->confirmUpload($session, $payload);

        $asset = $session->asset;
        if ($asset) {
            $metadata = $asset->metadata ?? [];
            $updateData = [
                'status' => 'ready',
                'processing_status' => 'ready',
            ];

            if (isset($payload['duration_seconds'])) {
                $updateData['duration'] = (float) $payload['duration_seconds'];
                $metadata['duration_seconds'] = $payload['duration_seconds'];
            }
            if (isset($payload['thumbnail_url'])) {
                $updateData['thumbnail_url'] = $payload['thumbnail_url'];
                $metadata['thumbnail_url'] = $payload['thumbnail_url'];
            }
            if (isset($payload['preview_url'])) {
                $updateData['preview_url'] = $payload['preview_url'];
                $metadata['preview_url'] = $payload['preview_url'];
            }
            if (isset($payload['cdn_url'])) {
                $updateData['cdn_url'] = $payload['cdn_url'];
                $metadata['cdn_url'] = $payload['cdn_url'];
            }
            if (isset($payload['width'])) {
                $updateData['width'] = (int) $payload['width'];
            }
            if (isset($payload['height'])) {
                $updateData['height'] = (int) $payload['height'];
            }
            if (isset($payload['bunny_stream_url'])) {
                $updateData['bunny_stream_url'] = $payload['bunny_stream_url'];
            }

            $updateData['metadata'] = $metadata;
            $updateData['size_bytes'] = $payload['size_bytes'] ?? $asset->size_bytes ?? 0;

            $asset->forceFill($updateData)->save();
            $asset->refresh();
        }

        $session->forceFill(['status' => 'completed'])->save();

        return [
            'asset' => $asset?->load(['folder', 'uploader']),
            'session' => $session->fresh(),
            'provider' => $providerResult,
        ];
    }

    public function status(Tenant $tenant, MediaAsset $asset): array
    {
        if ($asset->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'asset' => ['Invalid asset for this tenant.'],
            ]);
        }

        return $this->manager->providerFor($asset->provider, $asset->provider_service)
            ->getAssetStatus($asset);
    }

    public function deleteRemote(MediaAsset $asset): void
    {
        $this->manager->providerFor($asset->provider, $asset->provider_service)
            ->deleteAsset($asset);
    }

    public function getSignedUrl(MediaAsset $asset, array $options = []): array
    {
        return $this->manager->providerFor($asset->provider, $asset->provider_service)
            ->createSignedReadUrl($asset, $options);
    }

    public function getPlaybackData(MediaAsset $asset): array
    {
        return $this->manager->providerFor($asset->provider, $asset->provider_service)
            ->getPlaybackData($asset);
    }

    public function processWebhook(array $payload): MediaAsset
    {
        $videoId = $this->extractVideoId($payload);

        if ($videoId === null) {
            throw ValidationException::withMessages([
                'video_id' => ['Webhook payload does not identify a video.'],
            ]);
        }

        $asset = MediaAsset::withoutGlobalScopes()
            ->where('provider', 'bunny')
            ->where('external_id', $videoId)
            ->first();

        if (! $asset) {
            throw ValidationException::withMessages([
                'asset' => ['Webhook references an unknown asset.'],
            ]);
        }

        $encodingStatus = $payload['encoding_status']
            ?? $payload['status']
            ?? $payload['Status']
            ?? null;

        $statusMap = [
            '0' => 'pending', 'Created' => 'pending',
            '1' => 'uploading', 'Uploaded' => 'uploading',
            '2' => 'processing', 'Processing' => 'processing',
            '3' => 'processing', 'Transcoding' => 'processing',
            '4' => 'ready', 'Ready' => 'ready', 'Finished' => 'ready',
            '5' => 'failed', 'Failed' => 'failed', 'Error' => 'failed',
        ];

        $newStatus = $statusMap[(string) $encodingStatus] ?? 'processing';
        $metadata = $asset->metadata ?? [];

        $thumbnailUrl = $payload['thumbnail_url']
            ?? $payload['thumbnailUrl']
            ?? ($asset->thumbnail_url ?? null);

        $duration = $payload['duration_seconds']
            ?? $payload['duration']
            ?? $payload['length']
            ?? ($asset->duration ?? null);

        $updateData = [
            'status' => $newStatus,
            'processing_status' => $newStatus,
            'metadata' => array_merge($metadata, [
                'encoding_status' => (string) $encodingStatus,
                'duration_seconds' => $duration,
                'thumbnail_url' => $thumbnailUrl,
                'available_resolutions' => $payload['available_resolutions']
                    ?? $payload['availableResolutions']
                    ?? $payload['resolutions']
                    ?? [],
            ]),
        ];

        if ($thumbnailUrl) {
            $updateData['thumbnail_url'] = $thumbnailUrl;
        }
        if ($duration) {
            $updateData['duration'] = (float) $duration;
        }
        if ($newStatus === 'ready') {
            $updateData['cdn_url'] = $payload['cdn_url']
                ?? $payload['cdnUrl']
                ?? $asset->cdn_url;
        }

        $asset->forceFill($updateData)->save();

        return $asset->fresh();
    }

    private function getIntegration(Tenant $tenant, string $service): \App\Models\TenantIntegration
    {
        $integration = \App\Models\TenantIntegration::query()
            ->where('tenant_id', $tenant->id)
            ->where('provider', 'bunny')
            ->where('service', $service)
            ->whereIn('status', ['pending', 'active'])
            ->first();

        if (! $integration) {
            throw ValidationException::withMessages([
                'integration' => ["Bunny {$service} integration is not configured for this tenant."],
            ]);
        }

        return $integration;
    }

    private function generateStorageKey(Tenant $tenant, string $type, string $filename): string
    {
        $ext = pathinfo($filename, PATHINFO_EXTENSION);
        $base = pathinfo($filename, PATHINFO_FILENAME);
        $safe = Str::slug($base) . '-' . Str::random(8);

        return "tenants/{$tenant->id}/media/{$type}/{$safe}.{$ext}";
    }

    private function extractVideoId(array $payload): ?string
    {
        return $payload['bunny_video_id']
            ?? $payload['video_id']
            ?? $payload['videoGuid']
            ?? $payload['VideoGuid']
            ?? $payload['guid']
            ?? null;
    }
}
