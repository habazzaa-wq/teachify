<?php

namespace Tests\Feature;

use App\Models\QuestionImport;
use App\Models\Tenant;
use App\Services\ExamBank\Import\ImportFileStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * P3 stateless storage: the question-import source bytes disk is already
 * configurable (QUESTION_IMPORT_STORAGE_DISK). This verifies a shared disk
 * keeps the bytes reachable by queue workers on any node while the local
 * default is preserved.
 */
class ImportStorageDiskTest extends TestCase
{
    use RefreshDatabase;

    public function test_default_local_disk_is_used(): void
    {
        Storage::fake(ImportFileStorage::DISK);

        $import = $this->makeImport();
        app(ImportFileStorage::class)->store($import, 'bytes');

        Storage::disk('local')->assertExists(
            'question-imports/'.$import->tenant_id.'/'.$import->uuid.'.bin',
        );
    }

    public function test_shared_disk_is_honoured(): void
    {
        config(['question-import.storage.disk' => 's3']);
        Storage::fake('s3');

        $import = $this->makeImport();
        app(ImportFileStorage::class)->store($import, 'bytes');

        Storage::disk('s3')->assertExists(
            'question-imports/'.$import->tenant_id.'/'.$import->uuid.'.bin',
        );
    }

    public function test_tenant_path_isolation_preserved_on_shared_disk(): void
    {
        config(['question-import.storage.disk' => 's3']);
        Storage::fake('s3');

        $a = $this->makeImport();
        $b = $this->makeImport();

        app(ImportFileStorage::class)->store($a, 'bytes-a');
        app(ImportFileStorage::class)->store($b, 'bytes-b');

        Storage::disk('s3')->assertExists(
            'question-imports/'.$a->tenant_id.'/'.$a->uuid.'.bin',
        );
        Storage::disk('s3')->assertExists(
            'question-imports/'.$b->tenant_id.'/'.$b->uuid.'.bin',
        );
    }

    private function makeImport(): QuestionImport
    {
        $tenant = Tenant::factory()->create();

        return QuestionImport::create([
            'tenant_id' => $tenant->id,
            'uuid' => (string) Str::uuid(),
            'status' => 'pending',
            'source' => [
                'original_name' => 'page.png',
                'mime' => 'image/png',
                'size' => 10,
            ],
        ]);
    }
}
