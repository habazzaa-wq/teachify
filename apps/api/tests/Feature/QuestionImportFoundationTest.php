<?php

namespace Tests\Feature;

use App\Jobs\ExamBank\ProcessQuestionImportJob;
use App\Models\Permission;
use App\Models\Question;
use App\Models\QuestionImport;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\ExamBank\Import\ImportExtractionPipeline;
use App\Services\ExamBank\Import\ImportFileStorage;
use App\Services\ExamBank\Import\ImportStageRecorder;
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

class QuestionImportFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_pipeline_produces_ready_document_from_ocr_words(): void
    {
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes());

        $this->bindTesseract(new OcrWordSet($this->arabicWords(), 90.0, 200, 100));

        (new ProcessQuestionImportJob($import))->handle(app(ImportExtractionPipeline::class));

        $import->refresh();

        $this->assertSame(QuestionImport::STATUS_READY, $import->status);
        $this->assertSame(1, $import->attempts);
        $this->assertNull($import->error);
        $this->assertNotNull($import->finished_at);

        $document = $import->document;
        $this->assertSame(1, $document['version']);
        $this->assertSame('rtl', $document['direction']);
        $this->assertSame('ar', $document['language']);
        $this->assertNotEmpty($document['blocks']);

        $first = $document['blocks'][0];
        $this->assertSame('paragraph', $first['type']);
        $this->assertSame('text', $first['runs'][0]['kind']);
        $this->assertArrayHasKey('ocrConfidence', $document['meta']);
        $this->assertGreaterThan(0.8, $document['meta']['ocrConfidence']);

        $recorded = collect($import->stages)->keyBy('key');
        $this->assertGreaterThanOrEqual(count(ImportStageRecorder::LOCAL_STAGES), $recorded->count());
        foreach (ImportStageRecorder::LOCAL_STAGES as $key) {
            $this->assertSame('done', $recorded[$key]['status'], "stage $key should be done");
        }

        $this->assertTrue(app(ImportFileStorage::class)->exists($import));

        $payload = app(\App\Services\ExamBank\Import\QuestionImportService::class)->statusPayload($import);
        $this->assertSame('ready', $payload['status']);
        $this->assertSame($import->uuid, $payload['id']);
        $this->assertNotNull($payload['document']);
    }

    public function test_pipeline_fails_loudly_when_ocr_is_unavailable(): void
    {
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes());

        $engine = Mockery::mock(TesseractEngine::class);
        $engine->shouldReceive('available')->andReturnFalse();
        $engine->shouldReceive('unavailabilityReason')->andReturn('محرك OCR غير مثبت على الخادم.');
        $this->instance(TesseractEngine::class, $engine);

        app(ImportExtractionPipeline::class)->run($import);

        $import->refresh();

        $this->assertSame(QuestionImport::STATUS_FAILED, $import->status);
        $this->assertNull($import->document);
        $this->assertNotNull($import->finished_at);
        $this->assertSame('ocr_unavailable', $import->error['code']);
        $this->assertSame('ocr', $import->error['stage']);

        $recorded = collect($import->stages)->keyBy('key');
        $this->assertTrue($recorded->has('ocr'), 'ocr stage should be recorded');
        $this->assertSame('skipped', $recorded['ocr']['status']);
    }

    public function test_job_does_not_reprocess_a_terminal_import(): void
    {
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = QuestionImport::query()->create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $admin->id,
            'uuid' => (string) Str::uuid(),
            'status' => QuestionImport::STATUS_CONSUMED,
            'attempts' => 1,
        ]);

        (new ProcessQuestionImportJob($import))->handle(app(ImportExtractionPipeline::class));

        $fresh = $import->refresh();
        $this->assertSame(QuestionImport::STATUS_CONSUMED, $fresh->status);
        $this->assertSame(1, $fresh->attempts);
    }

    public function test_store_creates_pending_import_and_dispatches_job(): void
    {
        Queue::fake();
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();

        Sanctum::actingAs($admin->user);
        $response = $this->postJson(
            '/api/v1/exam-bank/question-imports',
            ['file' => UploadedFile::fake()->image('page.png', 200, 100)],
            $this->tenantHeader($tenant),
        )->assertStatus(202)->assertJsonPath('data.status', QuestionImport::STATUS_PENDING);

        Queue::assertPushed(ProcessQuestionImportJob::class);

        $uuid = $response->json('data.id');
        $this->assertNotNull(QuestionImport::query()->where('uuid', $uuid)->first());
        $this->assertTrue(
            Storage::disk(ImportFileStorage::DISK)->exists("question-imports/{$tenant->id}/{$uuid}.bin"),
        );
    }

    public function test_store_rejects_non_image_payloads(): void
    {
        Queue::fake();
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();

        Sanctum::actingAs($admin->user);
        $this->postJson(
            '/api/v1/exam-bank/question-imports',
            ['file' => UploadedFile::fake()->createWithContent('page.png', str_repeat('x', 1024))],
            $this->tenantHeader($tenant),
        )->assertStatus(422);

        Queue::assertNothingPushed();
    }

    public function test_store_requires_question_create_permission(): void
    {
        Storage::fake(ImportFileStorage::DISK);
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');

        Sanctum::actingAs($student->user);
        $this->postJson(
            '/api/v1/exam-bank/question-imports',
            ['file' => UploadedFile::fake()->image('page.png')],
            $this->tenantHeader($tenant),
        )->assertForbidden();
    }

    public function test_show_is_tenant_isolated_but_available_to_owner_tenant(): void
    {
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes());
        $foreign = $this->tenantWithAdmin();

        Sanctum::actingAs($foreign[1]->user);
        $this->getJson(
            "/api/v1/exam-bank/question-imports/{$import->uuid}",
            $this->tenantHeader($foreign[0]),
        )->assertNotFound();

        Sanctum::actingAs($admin->user);
        $this->getJson(
            "/api/v1/exam-bank/question-imports/{$import->uuid}",
            $this->tenantHeader($tenant),
        )->assertOk()->assertJsonPath('data.id', $import->uuid);
    }

    public function test_retry_only_allows_failed_imports_and_redispatches(): void
    {
        Queue::fake();
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $failed = $this->makeImport($tenant, $admin, $this->pngBytes(), QuestionImport::STATUS_FAILED);
        $ready = $this->makeImport($tenant, $admin, $this->pngBytes(), QuestionImport::STATUS_READY);

        Sanctum::actingAs($admin->user);

        $this->postJson(
            "/api/v1/exam-bank/question-imports/{$ready->uuid}/retry",
            [],
            $this->tenantHeader($tenant),
        )->assertStatus(422);

        Queue::assertNothingPushed();

        $this->postJson(
            "/api/v1/exam-bank/question-imports/{$failed->uuid}/retry",
            [],
            $this->tenantHeader($tenant),
        )->assertOk()->assertJsonPath('data.status', QuestionImport::STATUS_PENDING);

        Queue::assertPushed(ProcessQuestionImportJob::class);
        $this->assertNull($failed->refresh()->stages);
        $this->assertNull($failed->refresh()->error);
    }

    public function test_destroy_removes_row_and_source_file(): void
    {
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes());

        Sanctum::actingAs($admin->user);
        $this->deleteJson(
            "/api/v1/exam-bank/question-imports/{$import->uuid}",
            [],
            $this->tenantHeader($tenant),
        )->assertOk();

        $this->assertNull(QuestionImport::query()->find($import->id));
        $this->assertFalse(app(ImportFileStorage::class)->exists($import));
    }

    public function test_validate_document_endpoint_reports_validity(): void
    {
        [$tenant, $admin] = $this->tenantWithAdmin();

        Sanctum::actingAs($admin->user);

        $valid = [
            'version' => 1,
            'direction' => 'rtl',
            'language' => 'ar',
            'blocks' => [
                ['type' => 'paragraph', 'runs' => [['kind' => 'text', 'text' => 'ما ناتج الجمع؟']]],
            ],
        ];

        $this->postJson(
            '/api/v1/exam-bank/question-imports/validate-document',
            ['document' => json_encode($valid, JSON_UNESCAPED_UNICODE)],
            $this->tenantHeader($tenant),
        )->assertOk()->assertJsonPath('data.valid', true)->assertJsonPath('data.errors', []);

        $this->postJson(
            '/api/v1/exam-bank/question-imports/validate-document',
            ['document' => json_encode(['version' => 1])],
            $this->tenantHeader($tenant),
        )->assertOk()->assertJsonPath('data.valid', false);
    }

    public function test_finalize_flow_creates_structured_question_from_document(): void
    {
        [$tenant, $admin] = $this->tenantWithAdmin();

        Sanctum::actingAs($admin->user);

        $document = [
            'version' => 1,
            'direction' => 'rtl',
            'language' => 'ar',
            'blocks' => [
                ['type' => 'paragraph', 'runs' => [['kind' => 'text', 'text' => 'ما ناتج الجمع؟']]],
            ],
        ];

        $response = $this->postJson('/api/v1/exam-bank/questions', [
            'type' => 'single_choice',
            'question_format' => 'structured',
            'title' => '',
            'content_document' => json_encode($document, JSON_UNESCAPED_UNICODE),
        ], $this->tenantHeader($tenant))->assertCreated();

        $questionId = $response->json('data.id');
        $question = Question::query()->findOrFail($questionId);

        $this->assertSame('structured', $question->question_format);
        $this->assertSame('سؤال مستورد', $question->title);
        $this->assertSame(1, $question->content_document['version']);
        $this->assertSame('paragraph', $question->content_document['blocks'][0]['type']);
    }

    public function test_clearing_the_document_downgrades_structured_format(): void
    {
        [$tenant, $admin] = $this->tenantWithAdmin();

        $question = Question::query()->create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $admin->id,
            'uuid' => (string) Str::uuid(),
            'title' => 'سؤال مُهيكل',
            'slug' => 'structured-q',
            'type' => 'single_choice',
            'question_format' => 'structured',
            'content_document' => [
                'version' => 1,
                'direction' => 'rtl',
                'language' => 'ar',
                'blocks' => [
                    ['type' => 'paragraph', 'runs' => [['kind' => 'text', 'text' => 'نص']]],
                ],
            ],
        ]);

        Sanctum::actingAs($admin->user);
        $this->putJson("/api/v1/exam-bank/questions/{$question->id}", [
            'content_document' => null,
        ], $this->tenantHeader($tenant))->assertOk();

        $question->refresh();
        $this->assertNull($question->content_document);
        $this->assertSame('text', $question->question_format);
    }

    private function bindTesseract(OcrWordSet $wordSet): void
    {
        $engine = Mockery::mock(TesseractEngine::class);
        $engine->shouldReceive('available')->andReturnTrue();
        $engine->shouldReceive('recognizeFile')->once()->andReturn($wordSet);
        $this->instance(TesseractEngine::class, $engine);
    }

    /** @return list<OcrWord> one RTL Arabic line inside a 200×100 page */
    private function arabicWords(): array
    {
        return [
            new OcrWord('الجمع', 40.0, 40.0, 40.0, 14.0, 88.0),
            new OcrWord('ناتج', 95.0, 40.0, 45.0, 14.0, 90.0),
            new OcrWord('ما', 150.0, 40.0, 30.0, 14.0, 92.0),
        ];
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

        app(ImportFileStorage::class)->store($tenant->id, $import->uuid, $bytes);

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
