<?php

namespace Tests\Feature;

use App\Models\MediaAsset;
use App\Models\MediaUploadChunk;
use App\Models\MediaUploadSession;
use App\Models\Tenant;
use App\Models\TenantIntegration;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Media\ResumableUploadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ResumableUploadTest extends TestCase
{
    use RefreshDatabase;

    private function createBunnyStorageIntegration(Tenant $tenant): void
    {
        TenantIntegration::create([
            'tenant_id' => $tenant->id,
            'provider' => 'bunny',
            'service' => 'storage',
            'status' => 'active',
            'external_id' => null,
            'config' => [
                'storage_zone_name' => 'zone-'.$tenant->id,
                'cdn_base_url' => 'https://cdn.example.test',
                'client_upload_key' => 'upload-key',
                'password' => 'secret',
                'status' => 'active',
            ],
        ]);
    }

    private function memberWithRole(Tenant $tenant, string $roleSlug): TenantUser
    {
        $this->seedTenantPermissions($tenant);

        $membership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => User::factory()->create()->id,
            'status' => 'active',
        ]);

        $role = \App\Models\Role::query()
            ->where('tenant_id', $tenant->id)
            ->where('slug', $roleSlug)
            ->firstOrFail();

        $membership->roles()->attach($role->id, ['tenant_id' => $tenant->id]);

        return $membership->load('user');
    }

    private function seedTenantPermissions(Tenant $tenant): void
    {
        if (\App\Models\Role::query()->where('tenant_id', $tenant->id)->exists()) {
            return;
        }

        $this->seed(\Database\Seeders\IdentityAccessSeeder::class);
    }

    private function tenantHeader(Tenant $tenant): array
    {
        return ['X-Tenant-ID' => (string) $tenant->id];
    }

    private function createTenant(): Tenant
    {
        $tenant = Tenant::factory()->create(['status' => 'active']);
        $tenant->forceFill(['plan' => ['name' => 'Test Plan', 'limits' => []]])->save();

        \App\Models\Usage\TenantUsage::create([
            'tenant_id' => $tenant->id,
            'storage_bytes' => 0,
            'bandwidth_bytes' => 0,
            'stream_bandwidth_bytes' => 0,
            'cdn_bandwidth_bytes' => 0,
            'requests' => 0,
            'views' => 0,
            'uploaded_files' => 0,
            'uploaded_videos' => 0,
            'collections' => 0,
            'folders' => 0,
        ]);

        return $tenant;
    }

    /**
     * Compute the combined file digest the same way the client engine does:
     * SHA-256 over the concatenation of the per-chunk SHA-256 hex strings.
     *
     * @param array<int, string> $chunkHashes
     */
    private function combinedHash(array $chunkHashes): string
    {
        ksort($chunkHashes);

        return hash('sha256', implode('', $chunkHashes));
    }

    private function putChunk(Tenant $tenant, MediaUploadSession $session, int $index, string $bytes, string $hash): \Illuminate\Testing\TestResponse
    {
        $total = strlen($bytes);
        $start = 0;
        $end = $total - 1;
        $fileSize = $session->size;

        $headers = array_merge($this->tenantHeader($tenant), [
            'X-Chunk-Index' => (string) $index,
            'X-Chunk-Hash' => $hash,
            'Content-Type' => 'application/octet-stream',
            'Content-Range' => "bytes {$start}-{$end}/{$fileSize}",
        ]);

        return $this->call(
            'PUT',
            "/api/v1/media-library/upload/resumable/{$session->id}/chunk",
            [],
            [],
            [],
            $this->transformHeadersToServerVars($headers),
            $bytes,
        );
    }

    public function test_resumable_pipeline_assembles_verifies_and_cleans_up(): void
    {
        Storage::fake('uploads');

        $tenant = $this->createTenant();
        $this->createBunnyStorageIntegration($tenant);
        $member = $this->memberWithRole($tenant, 'tenant_owner');
        Sanctum::actingAs($member->user);

        $content = random_bytes(2500);
        $chunk0 = substr($content, 0, 1500);
        $chunk1 = substr($content, 1500, 1000);
        $hash0 = hash('sha256', $chunk0);
        $hash1 = hash('sha256', $chunk1);
        $fileHash = $this->combinedHash([0 => $hash0, 1 => $hash1]);

        $intent = $this->postJson('/api/v1/media-library/upload/resumable/intent', [
            'type' => 'file',
            'original_filename' => 'sample.bin',
            'mime_type' => 'application/octet-stream',
            'size_bytes' => 2500,
            'total_chunks' => 2,
        ], $this->tenantHeader($tenant));

        $intent->assertCreated();
        $sessionId = $intent->json('data.session_id');
        $session = MediaUploadSession::findOrFail($sessionId);

        // Upload the two chunks.
        $this->putChunk($tenant, $session, 0, $chunk0, $hash0)->assertOk();
        $this->putChunk($tenant, $session, 1, $chunk1, $hash1)->assertOk();

        // Resume reflects a fully uploaded session.
        $resume = $this->getJson(
            "/api/v1/media-library/upload/resumable/{$sessionId}/resume",
            $this->tenantHeader($tenant),
        );
        $resume->assertOk();
        $resume->assertJsonPath('data.completed_chunks', [0, 1]);
        $resume->assertJsonPath('data.remaining_chunks', []);
        $resume->assertJsonPath('data.next_chunk', null);

        // Finalize: stub the Bunny push so we never touch the network.
        $service = ResumableUploadService::partialMock();
        $service->shouldAllowMockingProtectedMethods();
        $service->shouldReceive('pushToBunny')->andReturnUsing(function (MediaUploadSession $s, string $path) {
            $asset = $s->asset;
            $asset->forceFill([
                'status' => 'ready',
                'processing_status' => 'ready',
                'storage_key' => "tenants/{$s->tenant_id}/sample.bin",
                'external_id' => 'fake-ext',
            ])->save();

            return $asset;
        });

        $finalize = $this->postJson(
            "/api/v1/media-library/upload/resumable/{$sessionId}/finalize",
            ['file_hash' => $fileHash],
            $this->tenantHeader($tenant),
        );
        $finalize->assertOk();
        $finalize->assertJsonPath('data.asset.status', 'ready');

        // Chunks and their temporary files are gone; the session is complete.
        $this->assertDatabaseHas('media_upload_sessions', [
            'id' => $sessionId,
            'completed' => true,
            'status' => 'completed',
        ]);
        $this->assertSame(0, MediaUploadChunk::where('media_upload_session_id', $sessionId)->count());
        Storage::disk('uploads')->assertMissing("{$tenant->id}/{$sessionId}/chunks/0.part");
        Storage::disk('uploads')->assertMissing("{$tenant->id}/{$sessionId}/chunks/1.part");
    }

    public function test_resume_returns_only_missing_chunks_on_recovery(): void
    {
        Storage::fake('uploads');

        $tenant = $this->createTenant();
        $this->createBunnyStorageIntegration($tenant);
        $member = $this->memberWithRole($tenant, 'tenant_owner');
        Sanctum::actingAs($member->user);

        $chunk0 = random_bytes(1500);
        $hash0 = hash('sha256', $chunk0);

        $sessionId = $this->postJson('/api/v1/media-library/upload/resumable/intent', [
            'type' => 'file',
            'original_filename' => 'recovered.bin',
            'mime_type' => 'application/octet-stream',
            'size_bytes' => 2500,
            'total_chunks' => 2,
        ], $this->tenantHeader($tenant))->json('data.session_id');

        $session = MediaUploadSession::findOrFail($sessionId);
        $this->putChunk($tenant, $session, 0, $chunk0, $hash0)->assertOk();

        $resume = $this->getJson(
            "/api/v1/media-library/upload/resumable/{$sessionId}/resume",
            $this->tenantHeader($tenant),
        );

        $resume->assertJsonPath('data.completed_chunks', [0]);
        $resume->assertJsonPath('data.remaining_chunks', [1]);
        $resume->assertJsonPath('data.next_chunk', 1);
    }

    public function test_finalize_rejects_checksum_mismatch(): void
    {
        Storage::fake('uploads');

        $tenant = $this->createTenant();
        $this->createBunnyStorageIntegration($tenant);
        $member = $this->memberWithRole($tenant, 'tenant_owner');
        Sanctum::actingAs($member->user);

        $chunk0 = random_bytes(1500);
        $chunk1 = random_bytes(1000);
        $hash0 = hash('sha256', $chunk0);
        $hash1 = hash('sha256', $chunk1);

        $sessionId = $this->postJson('/api/v1/media-library/upload/resumable/intent', [
            'type' => 'file',
            'original_filename' => 'bad.bin',
            'mime_type' => 'application/octet-stream',
            'size_bytes' => 2500,
            'total_chunks' => 2,
        ], $this->tenantHeader($tenant))->json('data.session_id');

        $session = MediaUploadSession::findOrFail($sessionId);
        $this->putChunk($tenant, $session, 0, $chunk0, $hash0)->assertOk();
        $this->putChunk($tenant, $session, 1, $chunk1, $hash1)->assertOk();

        $this->postJson(
            "/api/v1/media-library/upload/resumable/{$sessionId}/finalize",
            ['file_hash' => str_repeat('a', 64)],
            $this->tenantHeader($tenant),
        )->assertStatus(422);

        // Session stays incomplete and the chunks remain for a retry.
        $this->assertDatabaseHas('media_upload_sessions', ['id' => $sessionId, 'completed' => false]);
        $this->assertSame(2, MediaUploadChunk::where('media_upload_session_id', $sessionId)->count());
    }

    public function test_chunk_checksum_mismatch_is_rejected(): void
    {
        Storage::fake('uploads');

        $tenant = $this->createTenant();
        $this->createBunnyStorageIntegration($tenant);
        $member = $this->memberWithRole($tenant, 'tenant_owner');
        Sanctum::actingAs($member->user);

        $chunk0 = random_bytes(1500);

        $sessionId = $this->postJson('/api/v1/media-library/upload/resumable/intent', [
            'type' => 'file',
            'original_filename' => 'corrupt.bin',
            'mime_type' => 'application/octet-stream',
            'size_bytes' => 2500,
            'total_chunks' => 2,
        ], $this->tenantHeader($tenant))->json('data.session_id');

        $session = MediaUploadSession::findOrFail($sessionId);
        $this->putChunk($tenant, $session, 0, $chunk0, str_repeat('f', 64))->assertStatus(422);

        $this->assertSame(0, MediaUploadChunk::where('media_upload_session_id', $sessionId)->count());
    }

    public function test_garbage_collect_purges_abandoned_session_and_draft_asset(): void
    {
        Storage::fake('uploads');

        $tenant = $this->createTenant();
        $this->createBunnyStorageIntegration($tenant);
        $member = $this->memberWithRole($tenant, 'tenant_owner');
        Sanctum::actingAs($member->user);

        $sessionId = $this->postJson('/api/v1/media-library/upload/resumable/intent', [
            'type' => 'file',
            'original_filename' => 'abandoned.bin',
            'mime_type' => 'application/octet-stream',
            'size_bytes' => 2500,
            'total_chunks' => 2,
        ], $this->tenantHeader($tenant))->json('data.session_id');

        $session = MediaUploadSession::findOrFail($sessionId);
        $assetId = $session->asset_id;

        // Simulate an abandoned, long-expired session.
        MediaUploadSession::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)
            ->where('id', $sessionId)
            ->update(['expires_at' => now()->subDay(), 'updated_at' => now()->subDay()]);

        $purged = app(ResumableUploadService::class)->garbageCollect();
        $this->assertGreaterThanOrEqual(1, $purged);

        $this->assertDatabaseMissing('media_upload_sessions', ['id' => $sessionId]);
        $this->assertDatabaseMissing('media_assets', ['id' => $assetId]);
        Storage::disk('uploads')->assertMissing("{$tenant->id}/{$sessionId}/chunks");
    }
}
