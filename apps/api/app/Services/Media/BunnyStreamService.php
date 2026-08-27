<?php

namespace App\Services\Media;

use App\Models\Course;
use App\Models\CourseInstructor;
use App\Models\MediaAsset;
use App\Models\MediaUploadSession;
use App\Models\Tenant;
use App\Models\TenantIntegration;
use App\Models\TenantUser;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BunnyStreamService
{
    public function __construct(
        private readonly MediaLibraryService $media,
        private readonly MediaManager $manager,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     * @return array{asset: MediaAsset, session: MediaUploadSession, intent: array<string, mixed>}
     */
    public function createUploadIntent(Tenant $tenant, TenantUser $creator, array $data): array
    {
        $integration = $this->streamIntegration($tenant);
        $config = $integration->config ?? [];
        $collection = $this->collectionName($tenant, $config, $data['collection'] ?? null);
        $videoId = (string) ($data['bunny_video_id'] ?? Str::uuid());

        return DB::transaction(function () use ($tenant, $creator, $data, $collection, $videoId): array {
            $asset = $this->media->createAsset($tenant, [
                'provider' => 'bunny',
                'provider_service' => 'stream',
                'type' => 'video',
                'status' => 'pending',
                'visibility' => 'private',
                'external_id' => $videoId,
                'original_filename' => $data['original_filename'] ?? null,
                'mime_type' => $data['mime_type'] ?? 'video/mp4',
                'size_bytes' => $data['size_bytes'] ?? null,
                'metadata' => $this->normalizedMetadata([
                    'bunny_video_id' => $videoId,
                    'collection' => $collection,
                    'encoding_status' => 'Created',
                ]),
            ], $creator);

            $session = $this->media->createUploadSession($tenant, [
                'media_asset_id' => $asset->id,
                'provider' => 'bunny',
                'provider_service' => 'stream',
                'status' => 'draft',
                'expires_at' => now()->addMinutes(60),
                'metadata' => [
                    'bunny_video_id' => $videoId,
                    'asset_type' => 'video',
                    'course_id' => $data['course_id'] ?? null,
                ],
            ], $creator);

            $intent = $this->manager->providerFor('bunny', 'stream')->createUploadIntent($session);

            // Persist the resolved library_id on the asset so the public
            // playback endpoint can construct the Bunny iframe embed URL.
            if (empty($asset->bunny_library_id) && ! empty($intent['library_id'])) {
                $asset->forceFill(['bunny_library_id' => $intent['library_id']])->save();
            }

            return [
                'asset' => $asset->refresh(),
                'session' => $session->refresh(),
                'intent' => $intent,
            ];
        });
    }

    /**
     * @param array<string, mixed> $payload
     * @return array{asset: MediaAsset, session: MediaUploadSession, provider: array<string, mixed>}
     */
    public function confirmUpload(Tenant $tenant, MediaUploadSession $session, array $payload = []): array
    {
        $this->ensureStreamSession($tenant, $session);

        if (! $session->asset) {
            throw ValidationException::withMessages([
                'session' => ['The upload session is not attached to a media asset.'],
            ]);
        }

        $providerResult = $this->manager->providerFor($session->provider, $session->provider_service)
            ->confirmUpload($session, $payload);

        $asset = $this->syncAssetMetadata($session->asset, array_merge($payload, [
            'encoding_status' => $providerResult['encoding_status'] ?? $payload['encoding_status'] ?? 'Uploaded',
        ]));

        // Backfill library_id when the asset was created before it was
        // stored on the record (pre-fix uploads).
        if (empty($asset->bunny_library_id)) {
            $playback = $this->manager->providerFor('bunny', 'stream')->getPlaybackData($asset);
            if (! empty($playback['library_id'])) {
                $asset->forceFill(['bunny_library_id' => $playback['library_id']])->save();
            }
        }

        $session->forceFill(['status' => 'completed'])->save();

        return [
            'asset' => $asset->refresh(),
            'session' => $session->refresh(),
            'provider' => $providerResult,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function status(Tenant $tenant, MediaAsset $asset): array
    {
        $this->ensureStreamAsset($tenant, $asset);

        return $this->manager->providerFor($asset->provider, $asset->provider_service)->getAssetStatus($asset);
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function processWebhook(array $payload): MediaAsset
    {
        $videoId = $this->extractVideoId($payload);

        if ($videoId === null) {
            throw ValidationException::withMessages([
                'video_id' => ['The Bunny webhook payload does not identify a video.'],
            ]);
        }

        $asset = MediaAsset::withoutGlobalScopes()
            ->where('provider', 'bunny')
            ->where('provider_service', 'stream')
            ->where('type', 'video')
            ->where('external_id', $videoId)
            ->first();

        if (! $asset) {
            throw ValidationException::withMessages([
                'asset' => ['The Bunny webhook references an unknown asset.'],
            ]);
        }

        return $this->syncAssetMetadata($asset, $payload)->refresh();
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function syncAssetMetadata(MediaAsset $asset, array $payload): MediaAsset
    {
        $this->ensureBunnyStreamAsset($asset);

        $encodingStatus = $this->extractEncodingStatus($payload);
        $metadata = $this->normalizedMetadata(array_merge($asset->metadata ?? [], [
            'bunny_video_id' => $asset->external_id,
            'collection' => $payload['collection'] ?? $payload['collectionId'] ?? ($asset->metadata['collection'] ?? null),
            'duration_seconds' => $payload['duration_seconds'] ?? $payload['duration'] ?? $payload['length'] ?? ($asset->metadata['duration_seconds'] ?? null),
            'available_resolutions' => $payload['available_resolutions'] ?? $payload['availableResolutions'] ?? $payload['resolutions'] ?? ($asset->metadata['available_resolutions'] ?? []),
            'thumbnail_url' => $payload['thumbnail_url'] ?? $payload['thumbnailUrl'] ?? ($asset->metadata['thumbnail_url'] ?? null),
            'preview_url' => $payload['preview_url'] ?? $payload['previewUrl'] ?? ($asset->metadata['preview_url'] ?? null),
            'encoding_status' => $encodingStatus ?? ($asset->metadata['encoding_status'] ?? 'Created'),
        ]));

        $mappedStatus = $this->mapStatus((string) $metadata['encoding_status']);

        $asset->forceFill([
            'status' => $mappedStatus,
            'processing_status' => $mappedStatus,
            'metadata' => $metadata,
        ])->save();

        return $asset;
    }

    public function mapStatus(string|int|null $bunnyStatus): string
    {
        return match (strtolower(trim((string) $bunnyStatus))) {
            '0', 'created' => 'pending',
            '1', 'uploaded' => 'uploading',
            '2', 'processing', '3', 'transcoding' => 'processing',
            '4', 'ready', 'finished' => 'ready',
            '5', 'failed', 'error' => 'failed',
            default => 'processing',
        };
    }

    public function canCreateVideo(Tenant $tenant, TenantUser $membership, ?int $courseId = null): bool
    {
        if ($membership->roles()->whereIn('slug', ['tenant_owner', 'admin'])->exists()) {
            return true;
        }

        if (! $membership->roles()->where('slug', 'instructor')->exists() || $courseId === null) {
            return false;
        }

        $course = Course::query()
            ->where('tenant_id', $tenant->id)
            ->whereKey($courseId)
            ->first();

        if (! $course) {
            return false;
        }

        return $course->primary_instructor_tenant_user_id === $membership->id
            || CourseInstructor::query()
                ->where('tenant_id', $tenant->id)
                ->where('course_id', $course->id)
                ->where('tenant_user_id', $membership->id)
                ->exists();
    }

    private function streamIntegration(Tenant $tenant): TenantIntegration
    {
        $integration = TenantIntegration::query()
            ->where('tenant_id', $tenant->id)
            ->where('provider', 'bunny')
            ->where('service', 'stream')
            ->whereIn('status', ['pending', 'active'])
            ->first();

        if (! $integration) {
            throw ValidationException::withMessages([
                'integration' => ['Bunny Stream integration is not configured for this tenant.'],
            ]);
        }

        return $integration;
    }

    /**
     * @param array<string, mixed> $config
     */
    private function collectionName(Tenant $tenant, array $config, ?string $collection): string
    {
        $prefix = trim((string) ($config['collection_prefix'] ?? 'tenant'), '-');

        return $collection ?: "{$prefix}-{$tenant->id}";
    }

    /**
     * @param array<string, mixed> $metadata
     * @return array<string, mixed>
     */
    private function normalizedMetadata(array $metadata): array
    {
        return [
            'bunny_video_id' => $metadata['bunny_video_id'] ?? null,
            'collection' => $metadata['collection'] ?? null,
            'duration_seconds' => isset($metadata['duration_seconds']) ? (int) $metadata['duration_seconds'] : null,
            'available_resolutions' => array_values((array) ($metadata['available_resolutions'] ?? [])),
            'thumbnail_url' => $metadata['thumbnail_url'] ?? null,
            'preview_url' => $metadata['preview_url'] ?? null,
            'encoding_status' => $metadata['encoding_status'] ?? null,
        ];
    }

    private function ensureStreamSession(Tenant $tenant, MediaUploadSession $session): void
    {
        if ($session->tenant_id !== $tenant->id || $session->provider !== 'bunny' || $session->provider_service !== 'stream') {
            throw ValidationException::withMessages([
                'session' => ['The video upload session is invalid for this tenant.'],
            ]);
        }
    }

    private function ensureStreamAsset(Tenant $tenant, MediaAsset $asset): void
    {
        if ($asset->tenant_id !== $tenant->id || $asset->provider !== 'bunny' || $asset->provider_service !== 'stream' || $asset->type !== 'video') {
            throw ValidationException::withMessages([
                'asset' => ['The video asset is invalid for this tenant.'],
            ]);
        }
    }

    private function ensureBunnyStreamAsset(MediaAsset $asset): void
    {
        if ($asset->provider !== 'bunny' || $asset->provider_service !== 'stream' || $asset->type !== 'video') {
            throw ValidationException::withMessages([
                'asset' => ['The asset is not a Bunny Stream video.'],
            ]);
        }
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function extractVideoId(array $payload): ?string
    {
        $value = $payload['bunny_video_id']
            ?? $payload['video_id']
            ?? $payload['videoGuid']
            ?? $payload['VideoGuid']
            ?? $payload['guid']
            ?? null;

        return $value === null ? null : (string) $value;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function extractEncodingStatus(array $payload): string|int|null
    {
        return $payload['encoding_status']
            ?? $payload['status']
            ?? $payload['Status']
            ?? $payload['encodingStatus']
            ?? null;
    }
}
