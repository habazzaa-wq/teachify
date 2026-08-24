<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\QuestionImport;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\ExamBank\Import\ImportFileStorage;
use App\Services\ExamBank\Import\QuestionImportService;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * P0.3 coverage: import source bytes live on a filesystem disk (not inside
 * MySQL), legacy base64 rows stay readable, deletion clears both worlds, and
 * the scheduled reaper runs without an HTTP tenant context.
 */
class ImportFileStorageTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_writes_tenant_scoped_file_and_metadata(): void
    {
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeBareImport($tenant, $admin);

        $bytes = $this->pngBytes();
        app(ImportFileStorage::class)->store($import, $bytes);

        $import->refresh();

        $path = 'question-imports/'.$tenant->id.'/'.$import->uuid.'.bin';
        Storage::disk(ImportFileStorage::DISK)->assertExists($path);
        $this->assertSame($path, $import->source['path']);
        $this->assertSame(ImportFileStorage::DISK, $import->source['disk']);

        // New rows must never carry megabytes of base64 inside MySQL.
        $rawRow = \DB::table('question_imports')->where('id', $import->id)->first();
        $this->assertNull($rawRow->source_bytes);
    }

    public function test_read_round_trips_bytes_from_storage(): void
    {
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $bytes = $this->pngBytes());

        $storage = app(ImportFileStorage::class);

        $this->assertTrue($storage->exists($import));
        $this->assertSame($bytes, $storage->read($import));
    }

    public function test_legacy_rows_fall_back_to_base64_column(): void
    {
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeLegacyImport($tenant, $admin, $bytes = $this->pngBytes());

        $storage = app(ImportFileStorage::class);

        $this->assertTrue($storage->exists($import));
        $this->assertSame($bytes, $storage->read($import));

        // Legacy absolutePath materialization still works for OCR/Vision.
        $absolute = $storage->absolutePath($import);
        $this->assertNotNull($absolute);
        $this->assertFileExists($absolute);
        $this->assertSame($bytes, (string) file_get_contents($absolute));
    }

    public function test_delete_removes_file_and_clears_both_storage_shapes(): void
    {
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $storage = app(ImportFileStorage::class);

        // Modern shape.
        $modern = $this->makeImport($tenant, $admin, $this->pngBytes());
        $path = 'question-imports/'.$tenant->id.'/'.$modern->uuid.'.bin';
        $storage->delete($modern);
        Storage::disk(ImportFileStorage::DISK)->assertMissing($path);
        $fresh = $modern->refresh();
        $this->assertNull($fresh->source['path'] ?? null);
        $this->assertNull($fresh->getRawOriginal('source_bytes'));

        // Legacy shape.
        $legacy = $this->makeLegacyImport($tenant, $admin, $this->pngBytes());
        $storage->delete($legacy);
        $legacyFresh = $legacy->refresh();
        $this->assertNull($legacyFresh->getRawOriginal('source_bytes'));
        $this->assertFalse($storage->exists($legacyFresh));
    }

    public function test_status_payload_hides_internal_storage_coordinates(): void
    {
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes());

        $payload = app(QuestionImportService::class)->statusPayload($import);

        $this->assertArrayNotHasKey('disk', $payload['source']);
        $this->assertArrayNotHasKey('path', $payload['source']);
        $this->assertSame('page.png', $payload['source']['original_name']);
    }

    public function test_cleanup_abandoned_runs_without_http_tenant_context(): void
    {
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();

        $stale = $this->makeImport($tenant, $admin, $this->pngBytes());
        $stale->forceFill(['created_at' => now()->subDays(30)])->save();

        $recent = $this->makeImport($tenant, $admin, $this->pngBytes());

        // Console/scheduler context: deliberately NO currentTenant binding.
        // This crashed with "Tenant context is missing." before P0.
        $deleted = app(QuestionImportService::class)->cleanupAbandoned();

        $this->assertSame(1, $deleted);
        Storage::disk(ImportFileStorage::DISK)->assertMissing(
            'question-imports/'.$tenant->id.'/'.$stale->uuid.'.bin',
        );
        $this->assertFalse(app(ImportFileStorage::class)->exists($stale));
        $this->assertTrue(app(ImportFileStorage::class)->exists($recent));
    }

    private function pngBytes(int $width = 200, int $height = 100): string
    {
        $image = imagecreatetruecolor($width, $height);
        $white = imagecolorallocate($image, 255, 255, 255);
        imagefilledrectangle($image, 0, 0, $width - 1, $height - 1, $white);

        ob_start();
        imagepng($image);
        $bytes = (string) ob_get_clean();

        imagedestroy($image);

        return $bytes;
    }

    private function makeBareImport(Tenant $tenant, TenantUser $creator): QuestionImport
    {
        return QuestionImport::query()->create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $creator->id,
            'uuid' => (string) Str::uuid(),
            'status' => QuestionImport::STATUS_PENDING,
            'source' => [
                'original_name' => 'page.png',
                'mime' => 'image/png',
                'size' => 0,
            ],
        ]);
    }

    private function makeImport(Tenant $tenant, TenantUser $creator, string $bytes): QuestionImport
    {
        $import = QuestionImport::query()->create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $creator->id,
            'uuid' => (string) Str::uuid(),
            'status' => QuestionImport::STATUS_PENDING,
            'source' => [
                'original_name' => 'page.png',
                'mime' => 'image/png',
                'size' => strlen($bytes),
            ],
        ]);

        app(ImportFileStorage::class)->store($import, $bytes);

        return $import;
    }

    /** Pre-P0.3 row shape: bytes live base64-encoded on the row itself. */
    private function makeLegacyImport(Tenant $tenant, TenantUser $creator, string $bytes): QuestionImport
    {
        return QuestionImport::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $creator->id,
            'uuid' => (string) Str::uuid(),
            'status' => QuestionImport::STATUS_PENDING,
            'source' => [
                'original_name' => 'page.png',
                'mime' => 'image/png',
                'size' => strlen($bytes),
            ],
            'source_bytes' => base64_encode($bytes),
        ]);
    }

    /** @return array{0: Tenant, 1: TenantUser} */
    private function tenantWithAdmin(): array
    {
        $tenant = Tenant::factory()->create();

        return [$tenant, $this->memberWithRole($tenant, 'admin')];
    }

    private function memberWithRole(Tenant $tenant, string $roleSlug): TenantUser
    {
        if (! Role::query()->where('tenant_id', $tenant->id)->exists()) {
            $this->seed(IdentityAccessSeeder::class);
        }

        if (! Permission::query()->where('slug', 'questions.create')->exists()) {
            $this->fail('Question permissions were not seeded.');
        }

        $membership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => User::factory()->create()->id,
            'status' => 'active',
        ]);

        $role = Role::query()
            ->where('tenant_id', $tenant->id)
            ->where('slug', $roleSlug)
            ->firstOrFail();

        $membership->roles()->attach($role->id, ['tenant_id' => $tenant->id]);

        return $membership->load('user');
    }
}
