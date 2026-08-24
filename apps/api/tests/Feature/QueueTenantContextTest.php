<?php

namespace Tests\Feature;

use App\Jobs\ExamBank\ProcessQuestionImportJob;
use App\Models\Permission;
use App\Models\QuestionImport;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Queue\Middleware\SetTenantContext;
use App\Services\ExamBank\Import\ImportExtractionPipeline;
use App\Services\ExamBank\Import\ImportFileStorage;
use App\Services\ExamBank\Import\Ocr\OcrWord;
use App\Services\ExamBank\Import\Ocr\OcrWordSet;
use App\Services\ExamBank\Import\Ocr\TesseractEngine;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Tests\TestCase;

/**
 * P0.1 regression coverage: queued jobs must establish (and release) their
 * own tenant context, carry primitive ids only, and fail loudly when the
 * tenant vanished between dispatch and processing.
 */
class QueueTenantContextTest extends TestCase
{
    use RefreshDatabase;

    public function test_middleware_binds_tenant_for_job_and_releases_afterwards(): void
    {
        [$tenant] = $this->tenantWithAdmin();

        $middleware = new SetTenantContext($tenant->id);

        $seenInside = null;
        $middleware->handle(new \stdClass(), function () use (&$seenInside): void {
            $seenInside = currentTenant();
        });

        $this->assertTrue($tenant->is($seenInside));

        // Long-lived worker safety: the binding must not leak into the next job.
        $this->expectException(\RuntimeException::class);
        currentTenant();
    }

    public function test_missing_tenant_fails_loudly_instead_of_running_unscoped(): void
    {
        $middleware = new SetTenantContext(999999);

        $ran = false;
        try {
            $middleware->handle(new \stdClass(), function () use (&$ran): void {
                $ran = true;
            });
            $this->fail('Expected RuntimeException for a missing tenant.');
        } catch (\RuntimeException $exception) {
            $this->assertStringContainsString('999999', $exception->getMessage());
        }

        $this->assertFalse($ran, 'Job body must not run without tenant context.');
    }

    public function test_upload_dispatches_job_with_primitive_ids_on_imports_queue(): void
    {
        Queue::fake();
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();

        Sanctum::actingAs($admin->user);
        $this->postJson(
            '/api/v1/exam-bank/question-imports',
            ['file' => UploadedFile::fake()->image('page.png', 200, 100), 'mode' => 'local'],
            $this->tenantHeader($tenant),
        )->assertStatus(202);

        Queue::assertPushed(ProcessQuestionImportJob::class, function (ProcessQuestionImportJob $job) use ($tenant): bool {
            return $job->queue === 'imports'
                && $job->tenantId === $tenant->id
                && is_int($job->importId);
        });
    }

    public function test_handle_resolves_scoped_import_and_records_processing(): void
    {
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes());

        // ImportExtractionPipeline is final: exercise the real one through a
        // mocked Tesseract engine (same pattern as QuestionImportFoundationTest).
        $engine = Mockery::mock(TesseractEngine::class);
        $engine->shouldReceive('available')->andReturnTrue();
        $engine->shouldReceive('recognizeFile')->once()->andReturn(
            new OcrWordSet([
                new OcrWord('الجمع', 40.0, 40.0, 40.0, 14.0, 88.0),
                new OcrWord('ناتج', 95.0, 40.0, 45.0, 14.0, 90.0),
            ], 90.0, 200, 100),
        );
        $this->instance(TesseractEngine::class, $engine);

        $job = new ProcessQuestionImportJob($tenant->id, $import->id);

        app()->instance('currentTenant', $tenant);
        try {
            $job->handle(app(ImportExtractionPipeline::class));
        } finally {
            app()->forgetInstance('currentTenant');
        }

        $import->refresh();

        $this->assertSame(QuestionImport::STATUS_READY, $import->status);
        $this->assertSame(1, $import->attempts);
        $this->assertNotNull($import->processing_started_at);
        $this->assertNotNull($import->document);
    }

    public function test_handle_skips_imports_from_other_tenants(): void
    {
        Storage::fake(ImportFileStorage::DISK);
        [$tenantA] = $this->tenantWithAdmin();
        [$tenantB, $adminB] = $this->tenantWithAdmin();
        $foreignImport = $this->makeImport($tenantB, $adminB, $this->pngBytes());

        $engine = Mockery::mock(TesseractEngine::class);
        $engine->shouldReceive('available')->andReturnTrue();
        $engine->shouldReceive('recognizeFile')->never();
        $this->instance(TesseractEngine::class, $engine);

        $job = new ProcessQuestionImportJob($tenantA->id, $foreignImport->id);

        // Tenant A's worker context cannot see tenant B's scoped row, so the
        // job body returns before touching the import or the pipeline.
        app()->instance('currentTenant', $tenantA);
        try {
            $job->handle(app(ImportExtractionPipeline::class));
        } finally {
            app()->forgetInstance('currentTenant');
        }

        $fresh = $foreignImport->refresh();
        $this->assertSame(QuestionImport::STATUS_PENDING, $fresh->status);
        $this->assertSame(0, $fresh->attempts);
    }

    public function test_failed_marks_import_failed_without_tenant_context(): void
    {
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes());

        // failed() runs outside the middleware chain — no binding here on
        // purpose, mirroring the real failed() hook environment.
        (new ProcessQuestionImportJob($tenant->id, $import->id))
            ->failed(new \RuntimeException('boom'));

        $fresh = QuestionImport::withoutGlobalScopes()->find($import->id);

        $this->assertSame(QuestionImport::STATUS_FAILED, $fresh->status);
        $this->assertSame('worker_failed', $fresh->error['code']);
        $this->assertNotNull($fresh->finished_at);
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

    private function makeImport(
        Tenant $tenant,
        TenantUser $creator,
        string $bytes,
        string $status = QuestionImport::STATUS_PENDING,
    ): QuestionImport {
        $import = QuestionImport::query()->create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $creator->id,
            'uuid' => (string) Str::uuid(),
            'status' => $status,
            'source' => [
                'original_name' => 'page.png',
                'mime' => 'image/png',
                'size' => strlen($bytes),
            ],
        ]);

        app(ImportFileStorage::class)->store($import, $bytes);

        return $import;
    }

    /** @return array{0: Tenant, 1: TenantUser} */
    private function tenantWithAdmin(): array
    {
        $tenant = Tenant::factory()->create();

        return [$tenant, $this->memberWithRole($tenant, 'admin')];
    }

    private function memberWithRole(Tenant $tenant, string $roleSlug): TenantUser
    {
        $this->seedTenantPermissions($tenant);

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

    private function seedTenantPermissions(Tenant $tenant): void
    {
        if (Role::query()->where('tenant_id', $tenant->id)->exists()) {
            return;
        }

        $this->seed(IdentityAccessSeeder::class);

        if (! Permission::query()->where('slug', 'questions.create')->exists()) {
            $this->fail('Question permissions were not seeded.');
        }
    }

    /**
     * @return array<string, string>
     */
    private function tenantHeader(Tenant $tenant): array
    {
        return ['X-Tenant-ID' => (string) $tenant->id];
    }
}
