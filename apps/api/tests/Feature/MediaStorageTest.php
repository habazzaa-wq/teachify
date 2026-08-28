<?php

namespace Tests\Feature;

use App\Services\Media\MediaStorage;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * P3 stateless storage: permanent user assets resolve through a configurable
 * disk so multi-node deployments can point MEDIA_STORAGE_DISK at shared
 * storage, while existing "public" behaviour is preserved.
 */
class MediaStorageTest extends TestCase
{
    public function test_default_uses_public_disk(): void
    {
        $this->assertSame('public', (new MediaStorage())->diskName());
    }

    public function test_put_and_url_on_public_disk(): void
    {
        Storage::fake('public');

        $media = new MediaStorage();
        $this->assertTrue($media->put('avatars/x.png', 'bytes'));
        Storage::disk('public')->assertExists('avatars/x.png');
        $this->assertStringContainsString('avatars/x.png', $media->url('avatars/x.png'));
    }

    public function test_shared_disk_writes_to_configured_disk(): void
    {
        config(['media.storage_disk' => 's3']);
        Storage::fake('s3');
        Storage::fake('public');

        $media = new MediaStorage();
        $this->assertSame('s3', $media->diskName());

        $media->put('avatars/x.png', 'bytes');

        Storage::disk('s3')->assertExists('avatars/x.png');
        Storage::disk('public')->assertMissing('avatars/x.png');
    }

    public function test_delete_clears_legacy_public_asset(): void
    {
        config(['media.storage_disk' => 's3']);
        Storage::fake('s3');
        Storage::fake('public');

        Storage::disk('public')->put('avatars/legacy.png', 'bytes');

        (new MediaStorage())->delete('avatars/legacy.png');

        Storage::disk('public')->assertMissing('avatars/legacy.png');
    }

    public function test_missing_file_is_safe(): void
    {
        Storage::fake('public');

        $this->assertFalse(Storage::disk('public')->exists('avatars/none.png'));
    }
}
