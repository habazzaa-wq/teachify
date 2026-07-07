<?php

namespace Tests\Feature;

use App\Contracts\Media\MediaProvider;
use App\Models\Course;
use App\Models\MediaAsset;
use App\Models\MediaAssetVariant;
use App\Models\MediaUploadSession;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Media\MediaLibraryService;
use App\Services\Media\MediaManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class MediaFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_media_asset_creation_with_collection_assignment_variants_and_captions(): void
    {
        $tenant = Tenant::factory()->create();
        $creator = TenantUser::factory()->create(['tenant_id' => $tenant->id]);
        $this->bindTenant($tenant);

        $media = app(MediaLibraryService::class);
        $collection = $media->createCollection($tenant, [
            'name' => 'Lesson Videos',
            'slug' => 'lesson-videos',
            'purpose' => 'lesson-videos',
        ]);

        $asset = $media->createAsset($tenant, [
            'media_collection_id' => $collection->id,
            'provider' => 'bunny',
            'provider_service' => 'stream',
            'type' => 'video',
            'status' => 'processing',
            'visibility' => 'private',
            'storage_key' => 'tenants/'.$tenant->id.'/lessons/intro.mp4',
            'external_id' => 'provider-video-id',
            'original_filename' => 'intro.mp4',
            'mime_type' => 'video/mp4',
            'size_bytes' => 123456,
            'checksum' => 'sha256:test',
            'metadata' => ['source' => 'test'],
        ], $creator);

        $variant = $media->createVariant($asset, [
            'type' => 'thumbnail',
            'status' => 'ready',
            'storage_key' => 'tenants/'.$tenant->id.'/lessons/thumb.jpg',
            'mime_type' => 'image/jpeg',
            'width' => 1280,
            'height' => 720,
        ]);

        $caption = $media->createCaption($asset, [
            'language' => 'en',
            'label' => 'English',
            'format' => 'vtt',
            'status' => 'ready',
            'storage_key' => 'tenants/'.$tenant->id.'/captions/intro.vtt',
            'is_default' => true,
        ]);

        $this->assertSame($collection->id, $asset->media_collection_id);
        $this->assertSame($creator->id, $asset->created_by_tenant_user_id);
        $this->assertSame('thumbnail', $variant->type);
        $this->assertSame('vtt', $caption->format);
        $this->assertTrue($asset->collection()->is($collection));
        $this->assertSame(1, $asset->variants()->count());
        $this->assertSame(1, $asset->captions()->count());
    }

    public function test_media_usage_linking_supports_asset_reuse(): void
    {
        $tenant = Tenant::factory()->create();
        $this->bindTenant($tenant);
        $media = app(MediaLibraryService::class);
        $asset = $this->createAsset($tenant, $media);
        $firstCourse = Course::create([
            'title' => 'First Usage Course',
            'slug' => 'first-usage-course',
            'status' => 'draft',
            'visibility' => 'private',
            'pricing_type' => 'free',
        ]);
        $secondCourse = Course::create([
            'title' => 'Second Usage Course',
            'slug' => 'second-usage-course',
            'status' => 'draft',
            'visibility' => 'private',
            'pricing_type' => 'free',
        ]);

        $firstUsage = $media->linkUsage($asset, $firstCourse, 'thumbnail');
        $secondUsage = $media->linkUsage($asset, $secondCourse, 'thumbnail');

        $this->assertNotSame($firstUsage->id, $secondUsage->id);
        $this->assertSame(2, $asset->usages()->count());
    }

    public function test_upload_session_lifecycle_is_tracked_without_upload_logic(): void
    {
        $tenant = Tenant::factory()->create();
        $creator = TenantUser::factory()->create(['tenant_id' => $tenant->id]);
        $this->bindTenant($tenant);

        $media = app(MediaLibraryService::class);
        $asset = $this->createAsset($tenant, $media);

        $session = $media->createUploadSession($tenant, [
            'media_asset_id' => $asset->id,
            'provider' => 'bunny',
            'provider_service' => 'storage',
            'expires_at' => now()->addHour(),
            'metadata' => ['mode' => 'future-direct-upload'],
        ], $creator);

        $this->assertSame('draft', $session->status);
        $this->assertSame($asset->id, $session->media_asset_id);

        $session = $media->updateUploadSessionStatus($session, 'uploading');
        $this->assertSame('uploading', $session->status);

        $session = $media->updateUploadSessionStatus($session, 'completed');
        $this->assertSame('completed', $session->status);
    }

    public function test_media_records_are_tenant_isolated(): void
    {
        $firstTenant = Tenant::factory()->create();
        $secondTenant = Tenant::factory()->create();
        $media = app(MediaLibraryService::class);

        $this->bindTenant($firstTenant);
        $firstCollection = $media->createCollection($firstTenant, [
            'name' => 'First Collection',
            'purpose' => 'lesson-videos',
        ]);
        $asset = $this->createAsset($firstTenant, $media);
        $course = Course::create([
            'title' => 'Media Isolation Course',
            'slug' => 'media-isolation-course',
            'status' => 'draft',
            'visibility' => 'private',
            'pricing_type' => 'free',
        ]);

        $this->bindTenant($secondTenant);

        $this->assertSame(0, MediaAsset::query()->whereKey($asset->id)->count());

        try {
            $media->createAsset($secondTenant, [
                'media_collection_id' => $firstCollection->id,
                'provider' => 'bunny',
                'provider_service' => 'storage',
                'type' => 'document',
            ]);
            $this->fail('Expected cross-tenant collection assignment to fail.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('media_collection_id', $exception->errors());
        }

        try {
            $media->linkUsage($asset, $course, 'thumbnail');
            $this->fail('Expected cross-tenant usage assignment to fail.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('media_asset', $exception->errors());
        }
    }

    public function test_provider_abstraction_registration(): void
    {
        $manager = app(MediaManager::class);

        $this->assertFalse($manager->hasProvider('fake'));

        $manager->register('fake', new FakeMediaProvider());

        $this->assertTrue($manager->hasProvider('fake'));
        $this->assertInstanceOf(MediaProvider::class, $manager->provider('fake'));
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->forgetInstance(Tenant::class);
        app()->forgetInstance('currentTenant');
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }

    private function createAsset(Tenant $tenant, MediaLibraryService $media): MediaAsset
    {
        return $media->createAsset($tenant, [
            'provider' => 'bunny',
            'provider_service' => 'storage',
            'type' => 'document',
            'status' => 'ready',
            'visibility' => 'private',
            'storage_key' => 'tenants/'.$tenant->id.'/assets/file.pdf',
            'original_filename' => 'file.pdf',
            'mime_type' => 'application/pdf',
            'metadata' => [],
        ]);
    }
}

class FakeMediaProvider implements MediaProvider
{
    public function createUploadIntent(MediaUploadSession $session, array $options = []): array
    {
        return ['session_id' => $session->id, 'options' => $options];
    }

    public function confirmUpload(MediaUploadSession $session, array $payload = []): array
    {
        return ['session_id' => $session->id, 'payload' => $payload];
    }

    public function getAssetStatus(MediaAsset $asset): array
    {
        return ['asset_id' => $asset->id, 'status' => $asset->status];
    }

    public function createSignedReadUrl(MediaAsset $asset, array $options = []): array
    {
        return ['asset_id' => $asset->id, 'url' => 'https://example.test/signed'];
    }

    public function deleteAsset(MediaAsset $asset): array
    {
        return ['asset_id' => $asset->id, 'deleted' => true];
    }

    public function createVariant(MediaAsset $asset, string $type, array $options = []): MediaAssetVariant|array
    {
        return ['asset_id' => $asset->id, 'type' => $type, 'options' => $options];
    }

    public function getPlaybackData(MediaAsset $asset): array
    {
        return ['asset_id' => $asset->id, 'playback' => []];
    }
}
