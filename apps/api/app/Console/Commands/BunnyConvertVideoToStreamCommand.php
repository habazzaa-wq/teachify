<?php

namespace App\Console\Commands;

use App\Models\MediaAsset;
use App\Services\Bunny\BunnyCacheService;
use App\Services\Bunny\BunnyClient;
use App\Services\Bunny\Contracts\BunnyStreamInterface;
use App\Services\Media\MediaManager;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class BunnyConvertVideoToStreamCommand extends Command
{
    protected $signature = 'bunny:convert-video-to-stream {assetId : MediaAsset id of the Bunny Storage video to convert}';

    protected $description = 'Re-encode a Bunny Storage MP4 asset into the Bunny Stream library so lessons use the professional player';

    private const MAX_POLL_SECONDS = 1800;

    private const POLL_INTERVAL_SECONDS = 15;

    public function handle(MediaManager $manager): int
    {
        $asset = MediaAsset::withoutGlobalScopes()
            ->find($this->argument('assetId'));

        if (! $asset) {
            $this->error("MediaAsset {$this->argument('assetId')} was not found.");

            return self::FAILURE;
        }

        if ($asset->provider !== 'bunny' || $asset->provider_service !== 'storage' || $asset->type !== 'video') {
            $this->error("Asset {$asset->id} is not a Bunny Storage video (provider={$asset->provider}, service={$asset->provider_service}, type={$asset->type}).");

            return self::FAILURE;
        }

        if ($asset->status !== 'ready') {
            $this->error("Asset {$asset->id} is not ready (status={$asset->status}). Re-run once the source video is ready.");

            return self::FAILURE;
        }

        if (filled($asset->bunny_video_id) || filled($asset->bunny_library_id)) {
            $this->warn("Asset {$asset->id} already has a Bunny Stream reference; skipping.");

            return self::SUCCESS;
        }

        /** @var BunnyStreamInterface $stream */
        $stream = app(BunnyStreamInterface::class);
        $client = app(BunnyClient::class);
        $settings = $client->settings();

        if (! $settings->hasStreamCredentials()) {
            $this->error('Bunny Stream credentials are not configured on the platform settings.');

            return self::FAILURE;
        }

        $libraryId = (string) $settings->library_id;
        $apiKey = $settings->stream_api_key;

        $this->info("Converting asset {$asset->id} ({$asset->original_filename}) to Bunny Stream library {$libraryId}.");

        $sourceUrl = $asset->cdn_url;
        if (! $sourceUrl) {
            $signed = $manager->providerFor('bunny', 'storage')->createSignedReadUrl($asset);
            $sourceUrl = $signed['url'] ?? null;
        }

        if (! $sourceUrl) {
            $this->error('Could not resolve a source URL for the asset.');

            return self::FAILURE;
        }

        $tempPath = rtrim(sys_get_temp_dir(), '/\\').'/bunny_convert_'.uniqid('', true).'.mp4';

        try {
            $this->line("Downloading source from {$sourceUrl} ...");

            $download = Http::timeout(600)
                ->withOptions(['connect_timeout' => 30])
                ->sink($tempPath)
                ->get($sourceUrl);

            if (! $download->successful()) {
                $this->error("Failed to download the source video (status {$download->status()}).");

                return self::FAILURE;
            }

            $this->line('Creating the Bunny Stream video ...');

            $created = $stream->createVideo($asset->title ?: $asset->original_filename ?: 'Untitled video');
            $videoId = (string) ($created['video_id'] ?? '');

            if (! $videoId) {
                $this->error('Bunny Stream did not return a video id.');

                return self::FAILURE;
            }

            $this->line("Uploading source to Bunny Stream video {$videoId} ...");

            $uploadUrl = $client->streamBaseUrl($settings->storage_zone_region)
                .'/library/'.$libraryId.'/videos/'.$videoId;

            $response = Http::timeout(1800)
                ->withOptions(['connect_timeout' => 30])
                ->send('PUT', $uploadUrl, [
                    'headers' => [
                        'AccessKey' => $apiKey,
                        'Content-Type' => $asset->mime_type ?: 'video/mp4',
                    ],
                    'body' => fopen($tempPath, 'rb'),
                ]);

            if (! $response->successful()) {
                $this->error("Failed to upload the video to Bunny Stream (status {$response->status()}).");
                $this->cleanupCreatedVideo($stream, $videoId);

                return self::FAILURE;
            }

            $this->line('Waiting for Bunny Stream encoding to complete ...');

            $status = $this->waitForEncoding($stream, $videoId);

            if ($status === null) {
                $this->error('Timed out waiting for Bunny Stream encoding. The video will finish in the background.');
                $this->line("Video id: {$videoId}");

                return self::FAILURE;
            }

            if ($status['status'] === 'failed') {
                $this->error('Bunny Stream reported a failed encoding.');
                $this->cleanupCreatedVideo($stream, $videoId);

                return self::FAILURE;
            }

            $this->updateAsset($asset, $videoId, $libraryId, $sourceUrl, $status);

            $this->info("Asset {$asset->id} converted successfully. Video id: {$videoId}");

            return self::SUCCESS;
        } finally {
            if (is_file($tempPath)) {
                @unlink($tempPath);
            }
        }
    }

    /**
     * @return array<string, mixed>|null
     */
    private function waitForEncoding(BunnyStreamInterface $stream, string $videoId): ?array
    {
        $cache = app(BunnyCacheService::class);
        $deadline = now()->addSeconds(self::MAX_POLL_SECONDS);

        while (now()->lessThan($deadline)) {
            $cache->forget("video:{$videoId}");
            $status = $stream->getVideoStatus($videoId);

            if ($status['status'] === 'ready' || $status['status'] === 'failed') {
                return $status;
            }

            $this->line(sprintf(
                '  encoding status: %s (%s)',
                $status['status'],
                $status['encoding_status'] ?? 'unknown',
            ));

            sleep(self::POLL_INTERVAL_SECONDS);
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $status
     */
    private function updateAsset(
        MediaAsset $asset,
        string $videoId,
        string $libraryId,
        string $sourceUrl,
        array $status,
    ): void {
        $metadata = array_merge($asset->metadata ?? [], [
            'bunny_video_id' => $videoId,
            'bunny_library_id' => $libraryId,
            'upload_service' => 'stream',
            'encoding_status' => 'Ready',
            'duration_seconds' => $status['duration'] ?? ($asset->metadata['duration_seconds'] ?? null),
            'available_resolutions' => $status['resolutions'] ?? [],
            'thumbnail_url' => $status['thumbnail_url'] ?? ($asset->metadata['thumbnail_url'] ?? null),
            'preview_url' => $status['preview_url'] ?? ($asset->metadata['preview_url'] ?? null),
            'stream_source_url' => $status['playback_url'] ?? null,
            'storage_source_url' => $sourceUrl,
        ]);

        $asset->forceFill([
            'provider_service' => 'stream',
            'external_id' => $videoId,
            'bunny_video_id' => $videoId,
            'bunny_library_id' => $libraryId,
            'bunny_stream_url' => $status['playback_url'] ?? null,
            'thumbnail_url' => $status['thumbnail_url'] ?? $asset->thumbnail_url,
            'duration' => $status['duration'] ?? $asset->duration,
            'status' => 'ready',
            'processing_status' => 'ready',
            'metadata' => $metadata,
        ])->save();
    }

    private function cleanupCreatedVideo(BunnyStreamInterface $stream, string $videoId): void
    {
        try {
            $stream->deleteVideo($videoId);
            $this->line("Deleted orphaned Bunny Stream video {$videoId}.");
        } catch (RuntimeException $e) {
            $this->warn("Could not clean up video {$videoId}: {$e->getMessage()}");
        }
    }
}
