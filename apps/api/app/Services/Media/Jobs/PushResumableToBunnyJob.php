<?php

namespace App\Services\Media\Jobs;

use App\Models\MediaAsset;
use App\Models\MediaUploadSession;
use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use App\Services\Media\ResumableUploadService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Push an already-assembled resumable upload to Bunny. Dispatched by
 * ResumableUploadService::finalize() for stream (video) uploads so the HTTP
 * request returns immediately instead of blocking on the (potentially long)
 * server-to-Bunny upload and tripping nginx/fastcgi timeouts.
 */
class PushResumableToBunnyJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 1800;

    public int $backoff = 60;

    public int $sessionId;

    public ?int $tenantId;

    public function __construct(int $sessionId, ?int $tenantId = null)
    {
        $this->sessionId = $sessionId;
        $this->tenantId = $tenantId;
    }

    public function handle(ResumableUploadService $service): void
    {
        $session = MediaUploadSession::withoutGlobalScope(TenantScope::class)
            ->find($this->sessionId);

        if (! $session || $session->completed) {
            return;
        }

        if ($this->tenantId) {
            $tenant = Tenant::find($this->tenantId);
            if ($tenant) {
                app()->instance('currentTenant', $tenant);
            }
        }

        $assembledAbs = $service->getAssembledPath($session);

        if (! is_file($assembledAbs)) {
            throw new \RuntimeException(
                "Assembled file missing for upload session {$this->sessionId}; cannot push to Bunny.",
            );
        }

        try {
            $service->pushToBunny($session, $assembledAbs);
        } catch (Throwable $e) {
            Log::error('media: resumable stream push failed', [
                'session_id' => $this->sessionId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $asset = $session->asset;
            if ($asset) {
                $asset->forceFill([
                    'status' => 'failed',
                    'processing_status' => 'failed',
                    'metadata' => array_merge($asset->metadata ?? [], [
                        'processing_error' => $e->getMessage(),
                    ]),
                ])->save();
            }

            throw $e;
        }

        // Best-effort cleanup. The queue worker runs as a different user
        // (deplo) than the php-fpm process (www-data) that created the upload
        // directory, so it may lack write permission to delete those files.
        // Never let a cleanup failure mark the (already successful) upload as
        // failed — leave orphaned chunks for the upload GC to reclaim instead.
        try {
            $service->purgeTemporaryArtifacts($session, $assembledAbs);
        } catch (Throwable $e) {
            Log::warning('media: resumable cleanup failed (non-fatal)', [
                'session_id' => $this->sessionId,
                'error' => $e->getMessage(),
            ]);
        }

        $session->forceFill(['status' => 'completed', 'completed' => true])->save();
    }
}
