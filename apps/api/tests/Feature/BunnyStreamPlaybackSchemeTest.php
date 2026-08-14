<?php

namespace Tests\Feature;

use App\Models\MediaAsset;
use App\Models\PlatformBunnySetting;
use App\Models\Tenant;
use App\Models\TenantIntegration;
use App\Services\Bunny\Contracts\BunnyStreamInterface;
use App\Services\Media\MediaManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BunnyStreamPlaybackSchemeTest extends TestCase
{
    use RefreshDatabase;

    public function test_playback_fallback_does_not_double_prefix_scheme(): void
    {
        $tenant = Tenant::factory()->create();
        $this->bindTenant($tenant);
        $this->createPlatformStreamSettings('https://teachify-media.example.test/');
        $this->createStreamIntegrationWithoutCredentials($tenant);

        $this->mock(BunnyStreamInterface::class)
            ->shouldReceive('getVideoStatus')
            ->andThrow(new \RuntimeException('stream api unavailable'));

        $asset = MediaAsset::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'provider' => 'bunny',
            'provider_service' => 'stream',
            'type' => 'video',
            'status' => 'ready',
            'visibility' => 'private',
            'external_id' => 'video-playback-1',
            'metadata' => [],
        ]);

        $data = app(MediaManager::class)
            ->providerFor('bunny', 'stream')
            ->getPlaybackData($asset);

        $this->assertSame('stream', $data['provider_service']);
        $this->assertSame('video-playback-1', $data['video_id']);
        $this->assertSame(
            'https://teachify-media.example.test/video-playback-1/playlist.m3u8',
            $data['playback_url'],
        );
        $this->assertStringNotContainsString('https://https://', $data['playback_url']);
    }

    public function test_playback_fallback_still_handles_protocol_less_pull_zone(): void
    {
        $tenant = Tenant::factory()->create();
        $this->bindTenant($tenant);
        $this->createPlatformStreamSettings('platform.example.test');
        $this->createStreamIntegrationWithoutCredentials($tenant);

        $this->mock(BunnyStreamInterface::class)
            ->shouldReceive('getVideoStatus')
            ->andThrow(new \RuntimeException('stream api unavailable'));

        $asset = MediaAsset::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'provider' => 'bunny',
            'provider_service' => 'stream',
            'type' => 'video',
            'status' => 'ready',
            'visibility' => 'private',
            'external_id' => 'video-playback-2',
            'metadata' => [],
        ]);

        $data = app(MediaManager::class)
            ->providerFor('bunny', 'stream')
            ->getPlaybackData($asset);

        $this->assertSame(
            'https://platform.example.test/video-playback-2/playlist.m3u8',
            $data['playback_url'],
        );
    }

    private function createPlatformStreamSettings(string $cdnHostname): void
    {
        PlatformBunnySetting::create([
            'storage_zone_name' => 'platform-zone',
            'storage_zone_password' => 'storage-password',
            'storage_zone_region' => 'de',
            'cdn_hostname' => $cdnHostname,
            'library_id' => 'platform-lib-1',
            'api_key' => 'platform-api-key',
            'stream_api_key' => 'platform-stream-key',
            'enabled' => true,
            'connection_status' => 'connected',
            'enable_stream' => true,
        ]);
    }

    private function createStreamIntegrationWithoutCredentials(Tenant $tenant): void
    {
        TenantIntegration::create([
            'tenant_id' => $tenant->id,
            'provider' => 'bunny',
            'service' => 'stream',
            'status' => 'active',
            'config' => [
                'metadata' => ['region' => 'de'],
                'collection' => 'tenant-'.$tenant->id,
                'library_strategy' => 'platform',
            ],
        ]);
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->forgetInstance(Tenant::class);
        app()->forgetInstance('currentTenant');
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
