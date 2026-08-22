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
use App\Services\ExamBank\Import\QuestionDocumentValidator;
use App\Services\ExamBank\Import\Vision\VisionDocumentNormalizer;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VisionImportIntegrationTest extends TestCase
{
    use RefreshDatabase;

    private function enableVision(string $endpoint = 'https://api.openai.test/v1/chat/completions'): void
    {
        config(['question-import.vision.enabled' => true]);
        config(['question-import.vision.endpoint' => $endpoint]);
        config(['question-import.vision.api_key' => 'test-key-123']);
        config(['question-import.vision.model' => 'gpt-4o-mini']);
        config(['question-import.vision.timeout' => 5]);
        config(['question-import.vision.daily_limit' => 50]);
        config(['question-import.vision.rate_limit' => 10]);
    }

    private function disableVision(): void
    {
        config(['question-import.vision.enabled' => false]);
        config(['question-import.vision.endpoint' => '']);
        config(['question-import.vision.api_key' => '']);
    }

    public function test_vision_mode_fails_clearly_when_provider_unavailable(): void
    {
        $this->disableVision();
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes(), 'vision');

        app(ImportExtractionPipeline::class)->run($import);
        $import->refresh();
        $this->assertSame(QuestionImport::STATUS_FAILED, $import->status);
        $this->assertSame('vision_unavailable', $import->error['code']);
        $this->assertFalse((bool) $import->fallback_used);
        $this->assertTrue(app(ImportFileStorage::class)->exists($import));
    }

    public function test_auto_falls_back_to_local_when_vision_unavailable(): void
    {
        $this->disableVision();
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes(), 'auto');
        $this->bindLocalSuccess($import);

        app(ImportExtractionPipeline::class)->run($import);
        $import->refresh();
        $this->assertSame(QuestionImport::STATUS_READY, $import->status);
        $this->assertSame('local', $import->used_mode);
        $this->assertTrue((bool) $import->fallback_used);
        $this->assertSame('vision_unavailable', $import->fallback_reason);
    }

    public function test_explicit_vision_never_silently_falls_back_on_provider_error(): void
    {
        $this->enableVision();
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes(), 'vision');
        Http::fake(fn() => Http::response(['error' => 'server'], 500));

        app(ImportExtractionPipeline::class)->run($import);
        $import->refresh();
        $this->assertSame(QuestionImport::STATUS_FAILED, $import->status);
        $this->assertFalse((bool) $import->fallback_used);
        $this->assertNotSame('local', $import->used_mode);
    }

    public function test_auto_falls_back_to_local_on_provider_500(): void
    {
        $this->enableVision();
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes(), 'auto');
        Http::fake(fn() => Http::response(['error' => 'fail'], 500));
        $this->bindLocalSuccess($import);

        app(ImportExtractionPipeline::class)->run($import);
        $import->refresh();
        $this->assertSame(QuestionImport::STATUS_READY, $import->status);
        $this->assertSame('local', $import->used_mode);
        $this->assertTrue((bool) $import->fallback_used);
        $this->assertSame('vision_provider_error', $import->fallback_reason);
    }

    public function test_mocked_successful_vision_response_is_normalized_validated_and_persisted(): void
    {
        $this->enableVision();
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes(), 'vision');
        $payload = $this->sampleVisionPayload();
        Http::fake(fn() => Http::response(['choices' => [['message' => ['content' => json_encode($payload)]]]], 200));

        app(ImportExtractionPipeline::class)->run($import);
        $import->refresh();
        $this->assertSame(QuestionImport::STATUS_READY, $import->status);
        $this->assertSame('vision', $import->used_mode);
        $this->assertFalse((bool) $import->fallback_used);
        $doc = $import->document;
        $this->assertSame(1, $doc['version']);
        $this->assertSame('rtl', $doc['direction']);
        $this->assertSame('mixed', $doc['language']);
        $types = array_column($doc['blocks'], 'type');
        $this->assertContains('paragraph', $types);
        $this->assertContains('heading', $types);
        $this->assertContains('math', $types);
        $this->assertContains('table', $types);
        $this->assertContains('chemical_equation', $types);
        $this->assertContains('diagram', $types);
        $this->assertContains('unresolved_visual', $types);
        $errors = app(QuestionDocumentValidator::class)->validate($doc);
        $this->assertSame([], $errors);
        $question = Question::query()->create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $admin->id,
            'uuid' => (string) Str::uuid(),
            'title' => 'اختبار رؤية',
            'slug' => 'vision-test-'.Str::random(6),
            'type' => 'single_choice',
            'question_format' => 'structured',
            'content_document' => $doc,
        ]);
        $this->assertNotNull($question->id);
        $fetched = Question::query()->find($question->id);
        $this->assertSame($doc['blocks'][0]['type'], $fetched->content_document['blocks'][0]['type']);
    }

    public function test_vision_provider_invalid_json_fails_and_auto_fallback(): void
    {
        $this->enableVision();
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $importVision = $this->makeImport($tenant, $admin, $this->pngBytes(), 'vision');
        Http::fake(fn() => Http::response(['choices' => [['message' => ['content' => 'not json {{{']]]], 200));
        app(ImportExtractionPipeline::class)->run($importVision);
        $this->assertSame(QuestionImport::STATUS_FAILED, $importVision->refresh()->status);
        $this->assertFalse((bool) $importVision->refresh()->fallback_used);

        $importAuto = $this->makeImport($tenant, $admin, $this->pngBytes(), 'auto');
        Http::fake(fn() => Http::response(['choices' => [['message' => ['content' => 'not json {{{']]]], 200));
        $this->bindLocalSuccess($importAuto);
        app(ImportExtractionPipeline::class)->run($importAuto);
        $importAuto->refresh();
        $this->assertSame(QuestionImport::STATUS_READY, $importAuto->status);
        $this->assertSame('local', $importAuto->used_mode);
    }

    public function test_provider_429_fails_vision_and_is_rate_limited_in_auto(): void
    {
        $this->enableVision();
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes(), 'vision');
        Http::fake(fn() => Http::response(['error' => 'rate'], 429));
        app(ImportExtractionPipeline::class)->run($import);
        $import->refresh();
        $this->assertSame(QuestionImport::STATUS_FAILED, $import->status);
        $this->assertSame('vision_provider_rate_limited', $import->error['code']);
        $this->assertFalse((bool) $import->fallback_used);
        $this->assertSame('vision', $import->strategy);

        $auto = $this->makeImport($tenant, $admin, $this->pngBytes(), 'auto');
        Http::fake(fn() => Http::response(['error' => 'rate'], 429));
        app(ImportExtractionPipeline::class)->run($auto);
        $auto->refresh();
        $this->assertSame(QuestionImport::STATUS_FAILED, $auto->status);
        $this->assertSame('vision_provider_rate_limited', $auto->error['code']);
        $this->assertFalse((bool) $auto->fallback_used);
        $this->assertSame('vision_provider_rate_limited', $auto->fallback_reason);
    }

    public function test_provider_429_auto_does_not_leak_source_file(): void
    {
        $this->enableVision();
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $auto = $this->makeImport($tenant, $admin, $this->pngBytes(), 'auto');
        Http::fake(fn() => Http::response(['error' => 'rate'], 429));
        app(ImportExtractionPipeline::class)->run($auto);
        $this->assertTrue(app(\App\Services\ExamBank\Import\ImportFileStorage::class)->exists($auto));
    }

    public function test_vision_429_preserves_requested_mode(): void
    {
        $this->enableVision();
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes(), 'vision');
        Http::fake(fn() => Http::response(['error' => 'rate'], 429));
        app(ImportExtractionPipeline::class)->run($import);
        $import->refresh();
        $this->assertSame('vision', $import->requested_mode);
        $this->assertSame('vision', $import->used_mode);
    }

    public function test_auto_429_preserves_requested_mode(): void
    {
        $this->enableVision();
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $auto = $this->makeImport($tenant, $admin, $this->pngBytes(), 'auto');
        Http::fake(fn() => Http::response(['error' => 'rate'], 429));
        app(ImportExtractionPipeline::class)->run($auto);
        $auto->refresh();
        $this->assertSame('auto', $auto->requested_mode);
        $this->assertFalse((bool) $auto->fallback_used);
    }

    public function test_invalid_svg_is_sanitized_to_unresolved(): void
    {
        $raw = [
            'version' => 1, 'direction' => 'rtl', 'language' => 'ar',
            'blocks' => [['type' => 'diagram', 'format' => 'svg', 'svg' => '<svg><script>alert(1)</script></svg>']],
        ];
        $doc = app(VisionDocumentNormalizer::class)->normalize($raw);
        $this->assertSame('unresolved_visual', $doc['blocks'][0]['type']);
        $this->assertSame([], app(QuestionDocumentValidator::class)->validate($doc));
    }

    public function test_unbalanced_latex_is_rejected_by_validator(): void
    {
        $doc = ['version' => 1, 'direction' => 'rtl', 'language' => 'ar', 'blocks' => [['type' => 'math', 'latex' => '\\frac{1}{2', 'display' => true]]];
        $errors = app(QuestionDocumentValidator::class)->validate($doc);
        $this->assertNotEmpty($errors);
        $this->assertStringContainsString('أقواس', $errors[0]);
    }

    public function test_heading_with_runs_persists(): void
    {
        $doc = ['version' => 1, 'direction' => 'rtl', 'language' => 'ar', 'blocks' => [['type' => 'heading', 'level' => 2, 'runs' => [['kind' => 'text', 'text' => 'السؤال الأول'], ['kind' => 'inline_math', 'latex' => 'x^2']]]]];
        $this->assertSame([], app(QuestionDocumentValidator::class)->validate($doc));
        $norm = app(VisionDocumentNormalizer::class)->normalize($doc);
        $this->assertSame('heading', $norm['blocks'][0]['type']);
    }

    public function test_math_block_persistence(): void
    {
        $doc = ['version' => 1, 'direction' => 'rtl', 'language' => 'mixed', 'blocks' => [['type' => 'math', 'latex' => 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}', 'display' => true]]];
        $this->assertSame([], app(QuestionDocumentValidator::class)->validate($doc));
    }

    public function test_chemical_equation_persistence(): void
    {
        $doc = ['version' => 1, 'direction' => 'ltr', 'language' => 'en', 'blocks' => [['type' => 'chemical_equation', 'content' => '2H_2 + O_2 \\rightarrow 2H_2O']]];
        $this->assertSame([], app(QuestionDocumentValidator::class)->validate($doc));
    }

    public function test_table_block_persistence(): void
    {
        $doc = ['version' => 1, 'direction' => 'rtl', 'language' => 'ar', 'blocks' => [['type' => 'table', 'rows' => [['العنصر', 'القيمة'], ['أ', '1'], ['ب', '2']], 'headerRow' => true]]];
        $this->assertSame([], app(QuestionDocumentValidator::class)->validate($doc));
    }

    public function test_unresolved_visual_preserved(): void
    {
        $doc = ['version' => 1, 'direction' => 'rtl', 'language' => 'ar', 'blocks' => [['type' => 'unresolved_visual', 'reason' => 'complex_or_unclear_diagram', 'description' => 'مثلث ABC']]];
        $this->assertSame([], app(QuestionDocumentValidator::class)->validate($doc));
    }

    public function test_mark_consumed_deletes_source_file(): void
    {
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes(), 'auto');
        $import->forceFill(['status' => QuestionImport::STATUS_READY, 'document' => ['version' => 1, 'direction' => 'rtl', 'language' => 'ar', 'blocks' => [['type' => 'paragraph', 'runs' => [['kind' => 'text', 'text' => 'نص']]]]]])->save();
        $this->assertTrue(app(ImportFileStorage::class)->exists($import));
        app(\App\Services\ExamBank\Import\QuestionImportService::class)->markConsumed($import);
        $this->assertFalse(app(ImportFileStorage::class)->exists($import));
        $this->assertSame(QuestionImport::STATUS_CONSUMED, $import->refresh()->status);
    }

    public function test_import_id_question_creation_marks_consumed(): void
    {
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes(), 'auto');
        $import->forceFill(['status' => QuestionImport::STATUS_READY, 'document' => ['version' => 1, 'direction' => 'rtl', 'language' => 'ar', 'blocks' => [['type' => 'paragraph', 'runs' => [['kind' => 'text', 'text' => 'نص']]]]]])->save();
        Sanctum::actingAs($admin->user);
        $doc = ['version' => 1, 'direction' => 'rtl', 'language' => 'ar', 'blocks' => [['type' => 'paragraph', 'runs' => [['kind' => 'text', 'text' => 'سؤال من الاستيراد']]]]];
        $this->postJson('/api/v1/exam-bank/questions', [
            'type' => 'single_choice',
            'question_format' => 'structured',
            'content_document' => json_encode($doc, JSON_UNESCAPED_UNICODE),
            'import_id' => $import->uuid,
        ], $this->tenantHeader($tenant))->assertCreated();
        $this->assertSame(QuestionImport::STATUS_CONSUMED, $import->refresh()->status);
        $this->assertFalse(app(ImportFileStorage::class)->exists($import));
        $q = Question::query()->where('tenant_id', $tenant->id)->latest('id')->first();
        $this->assertSame('structured', $q->question_format);
    }

    public function test_tenant_isolation_for_import_show(): void
    {
        Storage::fake(ImportFileStorage::DISK);
        [$t1, $admin1] = $this->tenantWithAdmin();
        [$t2, $admin2] = $this->tenantWithAdmin();
        $imp = $this->makeImport($t1, $admin1, $this->pngBytes());
        Sanctum::actingAs($admin2->user);
        $this->getJson("/api/v1/exam-bank/question-imports/{$imp->uuid}", $this->tenantHeader($t2))->assertNotFound();
        Sanctum::actingAs($admin1->user);
        $this->getJson("/api/v1/exam-bank/question-imports/{$imp->uuid}", $this->tenantHeader($t1))->assertOk();
    }

    public function test_rate_limit_enforced(): void
    {
        $this->enableVision();
        Storage::fake(ImportFileStorage::DISK);
        Cache::flush();
        [$tenant, $admin] = $this->tenantWithAdmin();
        config(['question-import.vision.rate_limit' => 1]);
        Cache::put("vision_rate:{$tenant->id}", 1, now()->addMinute());
        $import = $this->makeImport($tenant, $admin, $this->pngBytes(), 'vision');
        app(ImportExtractionPipeline::class)->run($import);
        $import->refresh();
        $this->assertSame(QuestionImport::STATUS_FAILED, $import->status);
        $this->assertSame('vision_rate_limited', $import->error['code']);
    }

    public function test_daily_limit_enforced(): void
    {
        $this->enableVision();
        Storage::fake(ImportFileStorage::DISK);
        Cache::flush();
        [$tenant, $admin] = $this->tenantWithAdmin();
        config(['question-import.vision.daily_limit' => 1]);
        Cache::put("vision_daily:{$tenant->id}:".now()->format('Y-m-d'), 1, now()->endOfDay());
        $import = $this->makeImport($tenant, $admin, $this->pngBytes(), 'vision');
        app(ImportExtractionPipeline::class)->run($import);
        $this->assertSame('vision_daily_limit', $import->refresh()->error['code']);
    }

    public function test_health_endpoint_does_not_expose_secrets(): void
    {
        $this->enableVision('https://api.example.com/v1/chat/completions');
        [$tenant, $admin] = $this->tenantWithAdmin();
        Sanctum::actingAs($admin->user);
        $res = $this->getJson('/api/v1/exam-bank/question-imports/health', $this->tenantHeader($tenant))->assertOk();
        $data = $res->json('data');
        $this->assertArrayHasKey('enabled', $data);
        $this->assertArrayHasKey('configured', $data);
        $this->assertArrayHasKey('model', $data);
        $this->assertArrayNotHasKey('api_key', $data);
        $this->assertArrayNotHasKey('apiKey', $data);
        $body = json_encode($res->json());
        $this->assertStringNotContainsString('test-key', $body);
    }

    public function test_markdown_fences_are_stripped_from_vision_response(): void
    {
        $this->enableVision();
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes(), 'vision');
        $payload = $this->sampleVisionPayload();
        $fenced = "```json\n".json_encode($payload)."\n```";
        Http::fake(fn() => Http::response(['choices' => [['message' => ['content' => $fenced]]]], 200));
        app(ImportExtractionPipeline::class)->run($import);
        $this->assertSame(QuestionImport::STATUS_READY, $import->refresh()->status);
    }

    public function test_vision_stages_are_recorded(): void
    {
        $this->enableVision();
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes(), 'vision');
        Http::fake(fn() => Http::response(['choices' => [['message' => ['content' => json_encode($this->sampleVisionPayload())]]]], 200));
        app(ImportExtractionPipeline::class)->run($import);
        $import->refresh();
        $keys = array_column($import->stages, 'key');
        $this->assertContains('vision_request', $keys);
        $this->assertContains('vision_parse', $keys);
        $this->assertContains('vision_validate', $keys);
    }

    public function test_auto_rate_limit_does_not_fallback(): void
    {
        $this->enableVision();
        Storage::fake(ImportFileStorage::DISK);
        Cache::flush();
        [$tenant, $admin] = $this->tenantWithAdmin();
        config(['question-import.vision.rate_limit' => 1]);
        Cache::put("vision_rate:{$tenant->id}", 1, now()->addMinute());
        $import = $this->makeImport($tenant, $admin, $this->pngBytes(), 'auto');
        app(ImportExtractionPipeline::class)->run($import);
        $import->refresh();
        $this->assertSame(QuestionImport::STATUS_FAILED, $import->status);
        $this->assertSame('vision_rate_limited', $import->error['code']);
        $this->assertFalse((bool) $import->fallback_used);
        $this->assertSame('auto', $import->requested_mode);
    }

    public function test_auto_daily_limit_does_not_fallback(): void
    {
        $this->enableVision();
        Storage::fake(ImportFileStorage::DISK);
        Cache::flush();
        [$tenant, $admin] = $this->tenantWithAdmin();
        config(['question-import.vision.daily_limit' => 1]);
        Cache::put("vision_daily:{$tenant->id}:".now()->format('Y-m-d'), 1, now()->endOfDay());
        $import = $this->makeImport($tenant, $admin, $this->pngBytes(), 'auto');
        app(ImportExtractionPipeline::class)->run($import);
        $import->refresh();
        $this->assertSame(QuestionImport::STATUS_FAILED, $import->status);
        $this->assertSame('vision_daily_limit', $import->error['code']);
        $this->assertFalse((bool) $import->fallback_used);
    }

    public function test_auto_timeout_falls_back_to_local(): void
    {
        $this->enableVision();
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes(), 'auto');
        Http::fake(function () { throw new \Illuminate\Http\Client\ConnectionException('timeout'); });
        $this->bindLocalSuccess($import);
        app(ImportExtractionPipeline::class)->run($import);
        $import->refresh();
        $this->assertSame(QuestionImport::STATUS_READY, $import->status);
        $this->assertSame('local', $import->used_mode);
        $this->assertTrue((bool) $import->fallback_used);
    }

    public function test_explicit_vision_timeout_fails_without_fallback(): void
    {
        $this->enableVision();
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes(), 'vision');
        Http::fake(function () { throw new \Illuminate\Http\Client\ConnectionException('timeout'); });
        app(ImportExtractionPipeline::class)->run($import);
        $import->refresh();
        $this->assertSame(QuestionImport::STATUS_FAILED, $import->status);
        $this->assertFalse((bool) $import->fallback_used);
    }

    public function test_local_mode_never_calls_vision(): void
    {
        $this->enableVision();
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes(), 'local');
        Http::fake(fn() => Http::response(['error'=>'should not be called'], 500));
        $this->bindLocalSuccess($import);
        app(ImportExtractionPipeline::class)->run($import);
        $import->refresh();
        $this->assertSame(QuestionImport::STATUS_READY, $import->status);
        $this->assertSame('local', $import->used_mode);
        $this->assertFalse((bool) $import->fallback_used);
        Http::assertNothingSent();
    }

    public function test_auto_invalid_json_fallback_persists_metadata(): void
    {
        $this->enableVision();
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes(), 'auto');
        Http::fake(fn() => Http::response(['choices'=>[['message'=>['content'=>'not json']]]],200));
        $this->bindLocalSuccess($import);
        app(ImportExtractionPipeline::class)->run($import);
        $import->refresh();
        $this->assertSame(QuestionImport::STATUS_READY, $import->status);
        $this->assertSame('auto', $import->requested_mode);
        $this->assertSame('local', $import->used_mode);
        $this->assertTrue((bool) $import->fallback_used);
        $this->assertSame('vision_invalid_response', $import->fallback_reason);
    }

    public function test_explicit_vision_invalid_json_fails(): void
    {
        $this->enableVision();
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes(), 'vision');
        Http::fake(fn() => Http::response(['choices'=>[['message'=>['content'=>'{bad json']]]],200));
        app(ImportExtractionPipeline::class)->run($import);
        $import->refresh();
        $this->assertSame(QuestionImport::STATUS_FAILED, $import->status);
        $this->assertFalse((bool) $import->fallback_used);
        $this->assertSame('vision', $import->requested_mode);
    }

    public function test_expired_import_cleanup_deletes_file(): void
    {
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes(), 'auto', QuestionImport::STATUS_READY);
        $import->forceFill(['created_at'=>now()->subDays(10)])->save();
        $this->assertTrue(app(ImportFileStorage::class)->exists($import));
        $count = app(\App\Services\ExamBank\Import\QuestionImportService::class)->cleanupAbandoned();
        $this->assertSame(1, $count);
        $this->assertFalse(app(ImportFileStorage::class)->exists($import));
        $this->assertNull(QuestionImport::query()->find($import->id));
    }

    public function test_import_deletion_removes_file(): void
    {
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes(), 'auto', QuestionImport::STATUS_FAILED);
        $this->assertTrue(app(ImportFileStorage::class)->exists($import));
        app(\App\Services\ExamBank\Import\QuestionImportService::class)->delete($import);
        $this->assertFalse(app(ImportFileStorage::class)->exists($import));
    }

    public function test_retry_requires_source_file(): void
    {
        Storage::fake(ImportFileStorage::DISK);
        [$tenant, $admin] = $this->tenantWithAdmin();
        $import = $this->makeImport($tenant, $admin, $this->pngBytes(), 'auto', QuestionImport::STATUS_FAILED);
        app(ImportFileStorage::class)->delete($import);
        Sanctum::actingAs($admin->user);
        $this->postJson("/api/v1/exam-bank/question-imports/{$import->uuid}/retry", [], $this->tenantHeader($tenant))->assertStatus(422);
    }

    private function sampleVisionPayload(): array
    {
        return [
            'version' => 1,
            'direction' => 'rtl',
            'language' => 'mixed',
            'blocks' => [
                ['type' => 'paragraph', 'runs' => [['kind' => 'text', 'text' => 'أوجد قيمة x في المعادلة التالية:']]],
                ['type' => 'heading', 'level' => 2, 'runs' => [['kind' => 'text', 'text' => 'السؤال الأول']]],
                ['type' => 'math', 'latex' => 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}', 'display' => true],
                ['type' => 'table', 'rows' => [['العنصر', 'القيمة'], ['أ', '1']], 'headerRow' => true],
                ['type' => 'chemical_equation', 'content' => '2H_2 + O_2 \\rightarrow 2H_2O'],
                ['type' => 'diagram', 'format' => 'svg', 'svg' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke="black" fill="none"/></svg>'],
                ['type' => 'unresolved_visual', 'reason' => 'complex_or_unclear_diagram', 'description' => 'رسم هندسي معقد لمثلث ABC'],
            ],
        ];
    }

    private function bindLocalSuccess(QuestionImport $import, bool $allowSecondCall = false): void
    {
        $engine = \Mockery::mock(\App\Services\ExamBank\Import\Ocr\TesseractEngine::class);
        $engine->shouldReceive('available')->andReturn(true);
        $words = [new \App\Services\ExamBank\Import\Ocr\OcrWord('نص', 10, 10, 20, 10, 90)];
        $set = new \App\Services\ExamBank\Import\Ocr\OcrWordSet($words, 90, 200, 100);
        $count = $allowSecondCall ? 2 : 1;
        $engine->shouldReceive('recognizeFile')->times($count)->andReturn($set);
        $this->instance(\App\Services\ExamBank\Import\Ocr\TesseractEngine::class, $engine);
    }

    private function pngBytes(int $w = 200, int $h = 100): string
    {
        $im = imagecreatetruecolor($w, $h);
        $white = imagecolorallocate($im, 255, 255, 255);
        imagefilledrectangle($im, 0, 0, $w - 1, $h - 1, $white);
        ob_start(); imagepng($im); $b = (string) ob_get_clean(); imagedestroy($im);
        return $b;
    }

    private function makeImport(Tenant $tenant, TenantUser $creator, string $bytes, string $mode = 'auto', string $status = QuestionImport::STATUS_PENDING): QuestionImport
    {
        $imp = QuestionImport::query()->create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $creator->id,
            'uuid' => (string) Str::uuid(),
            'status' => $status,
            'requested_mode' => $mode,
            'source' => ['original_name' => 'page.png', 'mime' => 'image/png', 'size' => strlen($bytes)],
        ]);
        app(ImportFileStorage::class)->store($imp, $bytes);
        return $imp;
    }

    private function tenantWithAdmin(): array
    {
        $tenant = Tenant::factory()->create();
        return [$tenant, $this->memberWithRole($tenant, 'admin')];
    }

    private function memberWithRole(Tenant $tenant, string $slug): TenantUser
    {
        if (! Role::query()->where('tenant_id', $tenant->id)->exists()) $this->seed(IdentityAccessSeeder::class);
        $m = TenantUser::factory()->create(['tenant_id' => $tenant->id, 'user_id' => User::factory()->create()->id, 'status' => 'active']);
        $role = Role::query()->where('tenant_id', $tenant->id)->where('slug', $slug)->firstOrFail();
        $m->roles()->attach($role->id, ['tenant_id' => $tenant->id]);
        return $m->load('user');
    }

    private function tenantHeader(Tenant $tenant): array { return ['X-Tenant-ID' => (string) $tenant->id]; }
}
