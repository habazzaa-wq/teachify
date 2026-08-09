<?php

namespace App\Services\Media;

use App\Models\MediaAsset;
use App\Models\MediaUploadChunk;
use App\Models\MediaUploadSession;
use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Media\Providers\BunnyStorageProvider;
use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use App\Services\Bunny\BunnyCacheService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;
use RuntimeException;

/**
 * Backend transport for the resumable multipart upload pipeline.
 *
 * The browser chunk engine computes SHA-256 digests per chunk (off the main
 * thread) and streams them to this service. We store each chunk in a
 * tenant-scoped temporary disk, verify its checksum, record completion in the
 * session bitmap, and — on finalize — assemble the chunks in order (streaming,
 * never loading the whole file into memory), verify the combined digest, push
 * the assembled file to Bunny exactly as the existing provider would, then
 * purge every temporary artifact.
 */
class ResumableUploadService
{
    private const CHUNK_READ_BYTES = 65536;

    public function __construct(
        private readonly BunnyIntegrationService $bunny,
        private readonly MediaManager $manager,
        private readonly BunnyCacheService $cache,
    ) {
    }

    /**
     * Create a resumable upload session (asset + session reservation) and return
     * the backend transport descriptor the client engine should target.
     *
     * @param array<string, mixed> $data
     * @return array{session: MediaUploadSession, asset: MediaAsset, intent: array<string, mixed>}
     */
    public function createResumableIntent(
        Tenant $tenant,
        TenantUser $uploader,
        array $data,
        string $service = 'storage',
    ): array {
        // Reuses the existing Bunny integration so the asset, storage key and
        // provider intent are reserved exactly as before.
        $result = $this->bunny->createUploadIntent($tenant, $uploader, $data, $service);

        /** @var MediaUploadSession $session */
        $session = $result['session'];

        $session->forceFill([
            'upload_id' => $data['upload_id'] ?? null,
            'file_name' => $data['original_filename'] ?? null,
            'mime_type' => $data['mime_type'] ?? null,
            'size' => (int) ($data['size_bytes'] ?? 0),
            'storage_zone' => $this->resolveStorageZone($tenant, $service),
            'total_chunks' => (int) ($data['total_chunks'] ?? 0),
            'uploaded_chunks' => [],
            'completed' => false,
            'status' => 'active',
            'expires_at' => now()->addMinutes(120),
        ])->save();

        $intent = [
            'upload_url' => "media-library/upload/resumable/{$session->id}/chunk",
            'upload_method' => 'PUT',
            'headers' => [],
            'session_id' => $session->id,
            'total_chunks' => $session->total_chunks,
            'expires_at' => $session->expires_at?->toISOString(),
        ];

        return [
            'session' => $session->fresh(),
            'asset' => $result['asset'],
            'intent' => $intent,
        ];
    }

    /**
     * Receive a single chunk: validate session/order/checksum, persist the
     * chunk to the temporary disk and return the uploaded-chunk bitmap.
     *
     * @return array<string, mixed>
     */
    public function receiveChunk(Request $request, MediaUploadSession $session): array
    {
        $this->assertAccessible($session);

        if ($session->completed) {
            throw ValidationException::withMessages([
                'session' => ['This upload session has already been finalized.'],
            ]);
        }

        $chunkIndex = $this->parseChunkIndex($request->header('X-Chunk-Index'));
        $clientHash = (string) $request->header('X-Chunk-Hash', '');
        $contentRange = $this->parseContentRange((string) $request->header('Content-Range', ''));

        // Validate chunk order / bounds against the reserved session.
        if ($session->total_chunks > 0 && ($chunkIndex < 0 || $chunkIndex >= $session->total_chunks)) {
            throw ValidationException::withMessages([
                'chunk_index' => ["Chunk index {$chunkIndex} is out of range for this session."],
            ]);
        }

        if ($contentRange !== null) {
            if ($session->size > 0 && $contentRange['total'] !== $session->size) {
                throw ValidationException::withMessages([
                    'content_range' => ['Content-Range total does not match the session file size.'],
                ]);
            }
        }

        if ($clientHash === '') {
            throw ValidationException::withMessages([
                'chunk_hash' => ['A SHA-256 chunk checksum is required.'],
            ]);
        }

        $absPath = $this->chunkPath($session, $chunkIndex);
        File::ensureDirectoryExists(dirname($absPath));

        $computedHash = $this->streamInputToTemp($absPath, $request->getContent(true));
        $receivedBytes = filesize($absPath);

        if ($receivedBytes === false || $receivedBytes === 0) {
            File::delete($absPath);
            throw ValidationException::withMessages([
                'chunk' => ['Chunk body was empty.'],
            ]);
        }

        if ($contentRange !== null && $receivedBytes !== $contentRange['length']) {
            File::delete($absPath);
            throw ValidationException::withMessages([
                'chunk' => ['Received byte count does not match the Content-Range length.'],
            ]);
        }

        // Checksum validation (constant-time compare).
        if (! hash_equals(strtolower($computedHash), strtolower($clientHash))) {
            File::delete($absPath);
            throw ValidationException::withMessages([
                'chunk_hash' => ['Chunk checksum validation failed.'],
            ]);
        }

        DB::transaction(function () use ($session, $chunkIndex, $computedHash, $absPath, $contentRange, $receivedBytes) {
            $relative = $this->chunkRelativePath($session, $chunkIndex);
            $offset = $contentRange['start'] ?? 0;

            MediaUploadChunk::updateOrCreate(
                [
                    'media_upload_session_id' => $session->id,
                    'chunk_index' => $chunkIndex,
                ],
                [
                    'chunk_hash' => $computedHash,
                    'status' => 'uploaded',
                    'byte_offset' => $offset,
                    'byte_length' => $receivedBytes,
                    'temp_path' => $relative,
                ],
            );

            $session->markChunkUploaded($chunkIndex);
            $session->forceFill(['status' => 'active'])->save();
        });

        $session->refresh();

        return [
            'ok' => true,
            'chunk_index' => $chunkIndex,
            'received_bytes' => $receivedBytes,
            'uploaded_chunks' => $session->uploaded_chunks ?? [],
        ];
    }

    /**
     * Return the uploaded-chunk bitmap plus the next missing chunk so a client
     * can resume by uploading only what is missing.
     *
     * @return array<string, mixed>
     */
    public function resume(MediaUploadSession $session): array
    {
        $this->assertAccessible($session);

        // Use the actual chunk records from the database for the authoritative
        // bitmap, not the session's potentially stale uploaded_chunks column.
        // Parallel chunk uploads can cause lost updates on the JSON bitmap,
        // but the individual chunk rows are always correct.
        $total = $session->total_chunks;
        $uploaded = $session->chunks()
            ->where('status', 'uploaded')
            ->pluck('chunk_index')
            ->sort()
            ->values()
            ->all();

        $remaining = [];
        $nextChunk = null;
        for ($i = 0; $i < $total; $i += 1) {
            if (! in_array($i, $uploaded, true)) {
                $remaining[] = $i;
                if ($nextChunk === null) {
                    $nextChunk = $i;
                }
            }
        }

        return [
            'session_id' => $session->id,
            'completed_chunks' => $uploaded,
            'remaining_chunks' => $remaining,
            'next_chunk' => $nextChunk,
            'total_chunks' => $total,
            'completed' => $session->completed,
        ];
    }

    /**
     * Finalize: verify completeness + combined digest, assemble chunks in order
     * (streaming), push the assembled file to Bunny, then purge temp artifacts.
     *
     * @return array{session: MediaUploadSession, asset: MediaAsset|null}
     */
    public function finalize(Request $request, MediaUploadSession $session): array
    {
        $this->assertAccessible($session);

        if ($session->completed) {
            // Idempotent: a repeated finalize returns the already-finalized asset.
            return [
                'session' => $session,
                'asset' => $session->asset,
            ];
        }

        if ($session->isExpired()) {
            throw ValidationException::withMessages([
                'session' => ['This upload session has expired. Please start a new upload.'],
            ]);
        }

        $total = $session->total_chunks;
        $chunks = $session->chunks()->orderBy('chunk_index')->get();

        // Use the actual chunk records from the database rather than the
        // session's uploaded_chunks bitmap. The bitmap is prone to lost
        // updates under parallel chunk uploads (race condition), but the
        // individual chunk rows are always stored correctly (unique constraint
        // + row-level locking in receiveChunk).
        if ($total <= 0 || $chunks->count() < $total) {
            $uploadedIndices = $chunks->pluck('chunk_index')->all();
            $missing = [];
            for ($i = 0; $i < $total; $i += 1) {
                if (! in_array($i, $uploadedIndices, true)) {
                    $missing[] = $i;
                }
            }
            throw ValidationException::withMessages([
                'chunks' => ['Upload is incomplete. Missing chunks: '.implode(', ', $missing)],
            ]);
        }

        // Verify offsets are contiguous (starting at 0) and cover the full file.
        $expectedOffset = 0;
        $size = $session->size;
        foreach ($chunks as $chunk) {
            if ($chunk->byte_offset !== $expectedOffset) {
                throw ValidationException::withMessages([
                    'chunks' => ['Chunk offsets are not contiguous; the upload cannot be assembled.'],
                ]);
            }
            $expectedOffset += $chunk->byte_length;
        }
        if ($size > 0 && $expectedOffset !== $size) {
            throw ValidationException::withMessages([
                'chunks' => ['Assembled size does not match the declared file size.'],
            ]);
        }

        // Verify the combined digest matches the client-provided file hash.
        $orderedHashes = $chunks
            ->sortBy('chunk_index')
            ->map(fn (MediaUploadChunk $c) => strtolower((string) $c->chunk_hash))
            ->values()
            ->all();
        $combined = hash('sha256', implode('', $orderedHashes));

        $fileHash = $request->input('file_hash') ?? $request->input('checksum');
        if ($fileHash && ! hash_equals($combined, strtolower((string) $fileHash))) {
            throw ValidationException::withMessages([
                'checksum' => ['Final file checksum verification failed.'],
            ]);
        }

        // Duplicate detection: if an existing active asset for this tenant has
        // the same SHA-256 checksum, reuse it instead of assembling + pushing.
        $effectiveHash = $fileHash ? strtolower((string) $fileHash) : $combined;
        $existingAsset = MediaAsset::query()
            ->where('tenant_id', $session->tenant_id)
            ->where('checksum', $effectiveHash)
            ->where('status', 'ready')
            ->whereNull('deleted_at')
            ->first();

        if ($existingAsset) {
            $this->purgeTemporaryArtifacts($session);
            $session->forceFill([
                'status' => 'completed',
                'completed' => true,
                'final_file_hash' => $effectiveHash,
                'expires_at' => null,
            ])->save();

            return [
                'session' => $session->fresh(),
                'asset' => $existingAsset,
            ];
        }

        $assembledAbs = $this->assembledPath($session);
        File::ensureDirectoryExists(dirname($assembledAbs));

        // Stream chunks into the assembled file — never load the whole file.
        $out = fopen($assembledAbs, 'wb');
        if ($out === false) {
            throw new RuntimeException('Unable to open the assembly file for writing.');
        }
        try {
            foreach ($chunks as $chunk) {
                $in = fopen(Storage::disk('uploads')->path($chunk->temp_path), 'rb');
                if ($in === false) {
                    throw new RuntimeException("Missing temporary chunk #{$chunk->chunk_index}.");
                }
                stream_copy_to_stream($in, $out, $chunk->byte_length);
                fclose($in);
            }
        } finally {
            fclose($out);
        }

        try {
            $asset = $this->pushToBunny($session, $assembledAbs);
        } catch (\Throwable $e) {
            // Keep the assembled file and chunk artifacts so the caller can
            // retry finalize. purgeTemporaryArtifacts runs only on success.
            throw $e;
        }

        $this->purgeTemporaryArtifacts($session, $assembledAbs);

        $session->forceFill([
            'status' => 'completed',
            'completed' => true,
            'final_file_hash' => $fileHash ? strtolower((string) $fileHash) : $combined,
            'expires_at' => null,
        ])->save();

        // Invalidate Bunny usage cache so the storage meter reflects the new file.
        try {
            $this->cache->invalidateUsage();
            $this->cache->invalidateStorage();
        } catch (\Throwable) {
            // Cache invalidation failure is non-fatal.
        }

        return [
            'session' => $session->fresh(),
            'asset' => $asset,
        ];
    }

    /**
     * Push the assembled file to Bunny using the provider's own intent (URL +
     * AccessKey), streaming the body so large files never hit memory.
     */
    protected function pushToBunny(MediaUploadSession $session, string $assembledAbs): ?MediaAsset
    {
        $provider = $this->manager->providerFor($session->provider, $session->provider_service);
        $intent = $provider->createUploadIntent($session);

        $url = $intent['upload_url'] ?? null;
        if (! $url || ! str_starts_with((string) $url, 'http')) {
            throw new RuntimeException('Bunny upload URL is invalid.');
        }

        $headers = $intent['headers'] ?? [];
        $headers['Content-Type'] = $session->mime_type ?: 'application/octet-stream';

        $maxRetries = 3;
        $lastException = null;

        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                $client = new GuzzleClient([
                    'timeout' => 600,
                    'connect_timeout' => 30,
                    'retry' => false,
                ]);
                $response = $client->put($url, [
                    'headers' => $headers,
                    'body' => fopen($assembledAbs, 'r'),
                ]);

                if ($response->getStatusCode() < 200 || $response->getStatusCode() >= 300) {
                    throw new RuntimeException("Bunny rejected the upload (HTTP {$response->getStatusCode()}).");
                }

                $lastException = null;
                break;
            } catch (GuzzleException $e) {
                $lastException = $e;
                if ($attempt < $maxRetries) {
                    $delay = min(30, 2 * pow(2, $attempt - 1));
                    sleep($delay);
                }
            }
        }

        if ($lastException !== null) {
            throw new RuntimeException("Failed to upload to Bunny storage after {$maxRetries} attempts: {$lastException->getMessage()}");
        }

        $asset = $session->asset;
        if ($asset) {
            $cdnUrl = null;
            if ($session->provider_service === 'storage' && $provider instanceof BunnyStorageProvider) {
                $cdnUrl = $provider->createSignedReadUrl($asset)['url'] ?? null;
            }

            $asset->forceFill([
                'status' => 'ready',
                'processing_status' => 'ready',
                'size_bytes' => $session->size,
                'checksum' => $session->final_file_hash,
                'cdn_url' => $cdnUrl,
            ])->save();
            $asset->refresh();
        }

        return $asset;
    }

    /* ------------------------------------------------------------------ *
     * Garbage collection
     * ------------------------------------------------------------------ */

    /**
     * Remove expired / abandoned sessions and their temporary artifacts.
     *
     * @return int Number of sessions purged.
     */
    public function garbageCollect(int $sessionGraceMinutes = 1440, int $stuckChunkMinutes = 180): int
    {
        $purged = 0;

        $expired = MediaUploadSession::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('completed', false)
            ->whereIn('status', ['draft', 'active', 'paused', 'failed'])
            ->where(function ($q) use ($sessionGraceMinutes) {
                $q->where('expires_at', '<', now())
                    ->orWhere('updated_at', '<', now()->subMinutes($sessionGraceMinutes));
            })
            ->get();

        foreach ($expired as $session) {
            $this->purgeSession($session);
            $purged += 1;
        }

        // Chunks uploaded but never finalized and sitting longer than the
        // stuck threshold also get reclaimed.
        $stuck = MediaUploadSession::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('completed', false)
            ->where('status', 'active')
            ->whereHas('chunks', function ($q) use ($stuckChunkMinutes) {
                $q->where('updated_at', '<', now()->subMinutes($stuckChunkMinutes));
            })
            ->get();

        foreach ($stuck as $session) {
            $this->purgeSession($session);
            $purged += 1;
        }

        $this->purgeOrphanDirectories();

        return $purged;
    }

    /**
     * Delete temporary chunk files and the assembled file for a session without
     * touching the session or asset records. Used after a successful finalize
     * (and in the cleanup path when Bunny rejects the push).
     */
    public function purgeTemporaryArtifacts(MediaUploadSession $session, ?string $assembledAbs = null): void
    {
        foreach ($session->chunks as $chunk) {
            if ($chunk->temp_path) {
                Storage::disk('uploads')->delete($chunk->temp_path);
            }
        }

        $session->chunks()->delete();

        if ($assembledAbs) {
            File::delete($assembledAbs);
        }

        $dir = Storage::disk('uploads')->path("{$session->tenant_id}/{$session->id}");
        if (is_dir($dir)) {
            File::deleteDirectory($dir);
        }
    }

    public function purgeSession(MediaUploadSession $session): void
    {
        foreach ($session->chunks as $chunk) {
            if ($chunk->temp_path) {
                Storage::disk('uploads')->delete($chunk->temp_path);
            }
        }

        $assembledAbs = $this->assembledPath($session);
        File::delete($assembledAbs);

        $session->chunks()->delete();

        // Abandoned uploads leave an empty placeholder asset behind. Load the
        // asset outside the tenant scope — the GC command runs without tenant
        // context, and the scope would call currentTenant() and crash.
        $asset = MediaAsset::query()
            ->withoutGlobalScope(TenantScope::class)
            ->find($session->media_asset_id);

        if (! $session->completed && $asset) {
            $asset->delete();
        }

        $session->delete();
    }

    private function purgeOrphanDirectories(): void
    {
        $root = Storage::disk('uploads')->path('');
        if (! is_dir($root)) {
            return;
        }

        foreach (File::directories($root) as $tenantDir) {
            foreach (File::directories($tenantDir) as $sessionDir) {
                $sessionId = (int) basename($sessionDir);
                if ($sessionId > 0 && ! MediaUploadSession::query()
                    ->withoutGlobalScope(TenantScope::class)
                    ->where('id', $sessionId)
                    ->exists()) {
                    File::deleteDirectory($sessionDir);
                }
            }
        }
    }

    /* ------------------------------------------------------------------ *
     * Helpers
     * ------------------------------------------------------------------ */

    /**
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    private function assertAccessible(MediaUploadSession $session): void
    {
        $tenant = currentTenant();
        $user = currentTenantUser();

        if ($session->tenant_id !== $tenant->id) {
            abort(404, 'Upload session not found.');
        }

        if ($user && $session->created_by_tenant_user_id !== null
            && $session->created_by_tenant_user_id !== $user->id) {
            abort(403, 'You do not own this upload session.');
        }

        if ($session->isExpired() && ! $session->completed) {
            throw ValidationException::withMessages([
                'session' => ['This upload session has expired.'],
            ]);
        }
    }

    private function resolveStorageZone(Tenant $tenant, string $service): ?string
    {
        $integration = \App\Models\TenantIntegration::query()
            ->where('tenant_id', $tenant->id)
            ->where('provider', 'bunny')
            ->where('service', $service)
            ->whereIn('status', ['pending', 'active'])
            ->first();

        if (! $integration) {
            return null;
        }

        $config = $integration->config ?? [];

        return $config['zone'] ?? $config['storage_zone_name'] ?? $config['library_id'] ?? null;
    }

    private function streamInputToTemp(string $absPath, $in): string
    {
        if (! is_resource($in)) {
            throw new RuntimeException('Unable to read the chunk body.');
        }

        $out = fopen($absPath, 'wb');
        if ($out === false) {
            fclose($in);
            throw new RuntimeException('Unable to write the chunk to temporary storage.');
        }

        $ctx = hash_init('sha256');
        try {
            while (! feof($in)) {
                $buf = fread($in, self::CHUNK_READ_BYTES);
                if ($buf === '' || $buf === false) {
                    break;
                }
                hash_update($ctx, $buf);
                fwrite($out, $buf);
            }
        } finally {
            fclose($in);
            fclose($out);
        }

        return hash_final($ctx);
    }

    private function chunkRelativePath(MediaUploadSession $session, int $chunkIndex): string
    {
        return "{$session->tenant_id}/{$session->id}/chunks/{$chunkIndex}.part";
    }

    private function chunkPath(MediaUploadSession $session, int $chunkIndex): string
    {
        return Storage::disk('uploads')->path($this->chunkRelativePath($session, $chunkIndex));
    }

    private function assembledPath(MediaUploadSession $session): string
    {
        return Storage::disk('uploads')->path("{$session->tenant_id}/{$session->id}/assembled");
    }

    private function parseChunkIndex(?string $value): int
    {
        if ($value === null || $value === '' || ! is_numeric($value)) {
            throw ValidationException::withMessages([
                'chunk_index' => ['A numeric X-Chunk-Index header is required.'],
            ]);
        }

        return (int) $value;
    }

    /**
     * @return array{start: int, end: int, total: int, length: int}|null
     */
    private function parseContentRange(string $header): ?array
    {
        if ($header === '') {
            return null;
        }
        // bytes 0-999/5000
        if (! preg_match('/bytes\s+(\d+)-(\d+)\/(\d+|\*)/i', $header, $m)) {
            throw ValidationException::withMessages([
                'content_range' => ['Malformed Content-Range header.'],
            ]);
        }

        $start = (int) $m[1];
        $end = (int) $m[2];
        $total = $m[3] === '*' ? 0 : (int) $m[3];

        return [
            'start' => $start,
            'end' => $end,
            'total' => $total,
            'length' => ($end - $start + 1),
        ];
    }
}
