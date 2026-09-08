<?php

namespace Tests\Feature;

use App\Jobs\ExamBank\GenerateAnswerPageVariantsJob;
use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\ExamAttemptAnswerPage;
use App\Models\ExamQuestion;
use App\Models\MediaAsset;
use App\Models\MediaAssetVariant;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantIntegration;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Bunny\Contracts\BunnyStorageInterface;
use App\Services\ExamBank\AnswerPageVariantService;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\Support\FakeBunnyStorage;
use Tests\TestCase;

/**
 * Phase F — Background variant generation for confirmed exam answer pages.
 *
 * On confirm the upload service dispatches GenerateAnswerPageVariantsJob, which
 * reads the original from Bunny Storage, writes two NEW objects (optimized +
 * thumbnail) and records two MediaAssetVariant rows — never touching the
 * original image or its MediaAsset row.
 *
 * The only network seams are Bunny Storage meta (FakeBunnyStorage) and the
 * byte GET/PUTs the variant job performs (faked over Http), mirroring the
 * Phase C read test's `Http::fake(['storage.example.test/*' => ...])` pattern.
 */
class ExamAnswerPageVariantTest extends TestCase
{
    use RefreshDatabase;

    public function test_confirm_generates_optimized_and_thumbnail_variants(): void
    {
        [$tenant, $student, $attemptId, $examQuestionId, $pageId, $assetId] = $this->variantFixture();

        Sanctum::actingAs($student->user);
        $this->bindTenant($tenant);

        $asset = MediaAsset::query()->findOrFail($assetId);

        $variants = MediaAssetVariant::query()
            ->where('media_asset_id', $assetId)
            ->orderBy('type')
            ->get();

        $this->assertCount(2, $variants);

        $optimized = $variants->firstWhere('type', 'optimized');
        $thumbnail = $variants->firstWhere('type', 'thumbnail');

        $this->assertNotNull($optimized);
        $this->assertNotNull($thumbnail);

        foreach (['optimized', 'thumbnail'] as $type) {
            $variant = $variants->firstWhere('type', $type);
            $this->assertSame('ready', $variant->status);
            $this->assertSame('image/jpeg', $variant->mime_type);
            $this->assertSame((string) $asset->id, (string) $variant->media_asset_id);
            $this->assertStringContainsString(".{$type}.jpg", (string) $variant->storage_key);
            $this->assertNotEmpty($variant->size_bytes);
            $this->assertNotEmpty($variant->width);
            $this->assertNotEmpty($variant->height);
            $this->assertSame($asset->storage_key, $variant->metadata['source_storage_key']);
            $this->assertNotEmpty($variant->metadata['source_checksum']);
        }

        // The thumbnail must be smaller than its source bounds.
        $this->assertLessThanOrEqual(256, (int) $thumbnail->width);
        $this->assertLessThanOrEqual(256, (int) $thumbnail->height);

        // The original must have been left untouched: no PUT ever targeted the
        // original storage key, only the new variant keys.
        $originalKey = (string) $asset->storage_key;
        $puts = collect(Http::recorded())
            ->filter(fn ($pair): bool => $pair[0]->method() === 'PUT')
            ->map(fn ($pair): string => (string) $pair[0]->url());

        $this->assertTrue(
            $puts->every(fn (string $url): bool => ! str_ends_with($url, $originalKey)),
            'No PUT should target the original storage key.',
        );
        $this->assertTrue(
            $puts->contains(fn (string $url): bool => str_ends_with($url, (string) $optimized->storage_key)),
            'The optimized variant should have been PUT.',
        );
        $this->assertTrue(
            $puts->contains(fn (string $url): bool => str_ends_with($url, (string) $thumbnail->storage_key)),
            'The thumbnail variant should have been PUT.',
        );

        $this->assertSame('ready', $asset->status);
        $this->assertSame($originalKey, $asset->storage_key);
    }

    public function test_dispatching_the_job_twice_for_the_same_page_does_not_duplicate_variants(): void
    {
        [$tenant, $student, $attemptId, $examQuestionId, $pageId, $assetId] = $this->variantFixture();

        // A duplicate dispatch (manual retry / duplicate enqueue) must not
        // create second optimized/thumbnail rows — the service checks for an
        // existing variant of each type before writing.
        GenerateAnswerPageVariantsJob::dispatch($tenant->id, (int) $assetId);

        $this->bindTenant($tenant);

        $rows = MediaAssetVariant::query()
            ->where('media_asset_id', $assetId)
            ->get();

        $this->assertCount(2, $rows);
        $this->assertSame(1, $rows->where('type', 'optimized')->count());
        $this->assertSame(1, $rows->where('type', 'thumbnail')->count());
    }

    public function test_processing_failure_never_breaks_confirm_and_the_original_stays_servable(): void
    {
        [$tenant, $student, $attemptId, $examQuestionId] = $this->uploadFixtureWithoutPage();

        $fake = new FakeBunnyStorage;
        $this->app->instance(BunnyStorageInterface::class, $fake);

        // First upstream read (the variant job's fetch of the original) 500s —
        // the failure must be contained at the dispatch site and leave the
        // confirmed page usable. Once the upstream "recovers", later reads
        // succeed. (Http::fake() MERGES stubs, so a single stateful callback is
        // used instead of re-faking mid-test.)
        $bytes = 0;
        $jpeg = '';
        Http::fake([
            'storage.example.test/*' => function () use (&$bytes, &$jpeg) {
                $bytes++;

                if ($bytes === 1) {
                    return Http::response('', 500);
                }

                if ($jpeg === '') {
                    $jpeg = $this->makeJpeg(1200, 900);
                }

                return Http::response($jpeg, 200, ['Content-Type' => 'image/jpeg']);
            },
        ]);

        [$assetId, $pageId] = $this->confirmPage($tenant, $student, $attemptId, $examQuestionId);

        $asset = MediaAsset::query()->findOrFail($assetId);
        $this->assertSame('ready', $asset->status);
        $this->assertSame(0, MediaAssetVariant::query()->where('media_asset_id', $assetId)->count());

        $page = ExamAttemptAnswerPage::query()->findOrFail($pageId);
        $this->assertNotNull($page->media_asset_id);

        Sanctum::actingAs($student->user);

        $this->getJson("/api/v1/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.pages.0.id', (string) $pageId);

        $this->get("/api/v1/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages/{$pageId}", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertHeader('Content-Type', 'image/jpeg');
    }

    public function test_variants_are_not_generated_for_assets_that_are_not_ready_storage_images(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');

        // Same shape as a confirmed page but the queued job's runnable guard
        // must skip an asset whose status is still upload-pending.
        $asset = $this->seedAsset($tenant, $admin, 'image', 'pending');

        $this->bindTenant($tenant);
        Http::fake();

        (new GenerateAnswerPageVariantsJob($tenant->id, (int) $asset->id))->handle(app(AnswerPageVariantService::class));

        $this->assertSame(0, MediaAssetVariant::query()->where('media_asset_id', $asset->id)->count());
        $this->assertSame('pending', $asset->refresh()->status);
    }

    /**
     * Task item 3 (half 1): prove the UNIQUE (tenant_id, media_asset_id, type)
     * index from migration 2026_09_09_000001 really exists and rejects a
     * duplicate variant row for the same asset+type. True cross-connection
     * concurrency cannot be exercised (shared in-memory SQLite — the same
     * limitation Phase E's concurrency test noted), so the direct duplicate
     * insert against the migrated schema is the proof.
     */
    public function test_unique_index_rejects_duplicate_variant_rows(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $asset = $this->seedAsset($tenant, $admin, 'image', 'ready');
        $this->bindTenant($tenant);

        $row = [
            'tenant_id' => $tenant->id,
            'media_asset_id' => $asset->id,
            'type' => 'optimized',
            'status' => 'ready',
            'storage_key' => "tenants/{$tenant->id}/exam_attempts/page-1.optimized.jpg",
            'mime_type' => 'image/jpeg',
            'size_bytes' => 123,
            'width' => 200,
            'height' => 150,
            'metadata' => ['source' => 'test'],
        ];

        MediaAssetVariant::query()->create($row);

        try {
            MediaAssetVariant::query()->create($row);
            $this->fail('Expected a uniqueness violation for a duplicate (tenant, asset, type) variant row.');
        } catch (QueryException $e) {
            $this->assertTrue(
                str_contains(strtolower($e->getMessage()), 'unique constraint failed')
                    || (string) $e->getCode() === '23505',
                'Was expecting a unique-constraint violation, got: '.$e->getMessage(),
            );
        }

        $this->assertSame(1, MediaAssetVariant::query()
            ->where('media_asset_id', $asset->id)
            ->where('type', 'optimized')
            ->count());
    }

    /**
     * Task item 2: the service must absorb a unique-constraint violation that
     * lands between its pre-check and its insert (the lost-race window), treat
     * it as "variant already exists", and finish the remaining variants without
     * the job failing. The race is simulated deterministically: right as the
     * service's own "optimized" row starts inserting, a competing row for the
     * same (tenant, asset, type) is committed first via a raw insert — the
     * same interleaving two queue workers would produce.
     */
    public function test_unique_violation_during_service_insert_is_treated_as_already_exists(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $asset = $this->seedAsset($tenant, $admin, 'image', 'ready');
        $this->bindTenant($tenant);
        $this->createBunnyStorageIntegration($tenant);

        Http::fake([
            'storage.example.test/*' => Http::response($this->makeJpeg(1200, 900), 200, [
                'Content-Type' => 'image/jpeg',
            ]),
        ]);

        $raced = false;
        Event::listen(
            'eloquent.creating: '.MediaAssetVariant::class,
            function ($variant) use ($tenant, $asset, &$raced): void {
                if ($raced || $variant->type !== 'optimized') {
                    return;
                }

                $raced = true;

                DB::table('media_asset_variants')->insert([
                    'tenant_id' => $tenant->id,
                    'media_asset_id' => $asset->id,
                    'type' => 'optimized',
                    'status' => 'ready',
                    'storage_key' => "tenants/{$tenant->id}/exam_attempts/page-1.optimized.jpg",
                    'mime_type' => 'image/jpeg',
                    'size_bytes' => 456,
                    'width' => 200,
                    'height' => 150,
                    'metadata' => '{"source":"race-winner"}',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            },
        );

        (new GenerateAnswerPageVariantsJob($tenant->id, (int) $asset->id))->handle(app(AnswerPageVariantService::class));

        $this->assertTrue($raced, 'The race simulation should have fired.');
        $this->assertSame(1, MediaAssetVariant::query()->where('media_asset_id', $asset->id)->where('type', 'optimized')->count());
        $this->assertSame(1, MediaAssetVariant::query()->where('media_asset_id', $asset->id)->where('type', 'thumbnail')->count());
    }

    /**
     * Same as the Phase B2 upload fixture, then drives a real confirm.
     *
     * @return array{0: Tenant, 1: TenantUser, 2: int, 3: int, 4: int, 5: int}
     */
    private function variantFixture(): array
    {
        [$tenant, $admin, $student, $lesson, $attemptId, $examQuestionId] = $this->uploadFixture();

        $this->app->instance(BunnyStorageInterface::class, new FakeBunnyStorage);

        Http::fake([
            'storage.example.test/*' => Http::response($this->makeJpeg(1200, 900), 200, [
                'Content-Type' => 'image/jpeg',
            ]),
        ]);

        [$assetId, $pageId] = $this->confirmPage($tenant, $student, $attemptId, $examQuestionId);

        return [$tenant, $student, $attemptId, $examQuestionId, $pageId, (int) $assetId];
    }

    /**
     * @return array{0: int, 1: int} asset_id, page_id
     */
    private function confirmPage(Tenant $tenant, TenantUser $student, int $attemptId, int $examQuestionId): array
    {
        Sanctum::actingAs($student->user);

        $intent = $this->postJson(
            "/api/v1/exam-sessions/{$attemptId}/answers/{$examQuestionId}/upload-intent",
            [
                'original_filename' => 'page-1.jpg',
                'mime_type' => 'image/jpeg',
                'size_bytes' => 2048,
            ],
            $this->tenantHeader($tenant),
        )->assertCreated()->json('data');

        $confirm = $this->postJson(
            "/api/v1/exam-sessions/{$attemptId}/answers/{$examQuestionId}/pages/{$intent['session_id']}/confirm",
            [
                'captured_at' => '2026-09-08T12:00:00+00:00',
                'width' => 1200,
                'height' => 900,
                'size_bytes' => 2048,
                'mime_type' => 'image/jpeg',
                'original_filename' => 'page-1.jpg',
            ],
            $this->tenantHeader($tenant),
        )->assertCreated()->json('data');

        $page = ExamAttemptAnswerPage::query()->findOrFail($confirm['page_id']);

        return [(int) $page->media_asset_id, (int) $page->id];
    }

    /**
     * @return array{0: Tenant, 1: TenantUser, 2: TenantUser, 3: int, 4: int, 5: int}
     */
    private function uploadFixture(): array
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');

        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Variant');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $this->enrollStudent($tenant, $admin, $course, $student);

        $exam = $this->createPublishedExam($tenant, $admin);
        $questionId = $this->createQuestion($tenant, $admin, 'essay', ['prompt' => 'Solve and photograph your work.']);
        $examQuestionId = $this->attachQuestionToExam($tenant, $admin, $exam, $questionId);
        $this->attachExamToLesson($tenant, $admin, $course, $section, $lesson, $exam);

        $this->createBunnyStorageIntegration($tenant);

        Sanctum::actingAs($student->user);
        $started = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        $attemptId = (int) $started['attempt']['id'];

        return [$tenant, $admin, $student, $lesson, $attemptId, $examQuestionId];
    }

    /**
     * @return array{0: Tenant, 1: TenantUser, 2: int, 3: int}
     */
    private function uploadFixtureWithoutPage(): array
    {
        [$tenant, , $student, , $attemptId, $examQuestionId] = $this->uploadFixture();

        return [$tenant, $student, $attemptId, $examQuestionId];
    }

    private function seedAsset(Tenant $tenant, TenantUser $manager, string $type, string $status): MediaAsset
    {
        return MediaAsset::create([
            'tenant_id' => $tenant->id,
            'provider' => 'bunny',
            'provider_service' => 'storage',
            'type' => $type,
            'status' => $status,
            'visibility' => 'private',
            'storage_key' => "tenants/{$tenant->id}/exam_attempts/page-1.jpg",
            'original_filename' => 'page-1.jpg',
            'mime_type' => 'image/jpeg',
            'size_bytes' => 2048,
            'metadata' => [
                'storage_root' => 'exam_attempts',
                'purpose' => 'exam_answer_page',
            ],
            'created_by_tenant_user_id' => $manager->id,
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createPublishedExam(Tenant $tenant, TenantUser $manager, array $overrides = []): int
    {
        Sanctum::actingAs($manager->user);

        $exam = $this->postJson('/api/v1/exam-bank/exams', array_merge([
            'title' => 'Variant Exam',
            'description' => 'Image answer variant exam.',
            'duration' => 60,
            'passing_score' => 60,
            'attempt_limit' => 3,
            'show_results' => true,
            'show_correct_answers' => true,
            'allow_review' => true,
            'certificate_eligible' => true,
        ], $overrides), $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.id');

        $this->patchJson("/api/v1/exam-bank/exams/{$exam}/publish", [], $this->tenantHeader($tenant))->assertOk();

        return (int) $exam;
    }

    /**
     * @param  array<string, mixed>  $content
     */
    private function createQuestion(Tenant $tenant, TenantUser $manager, string $type, array $content): int
    {
        Sanctum::actingAs($manager->user);

        return (int) $this->postJson('/api/v1/exam-bank/questions', [
            'title' => "Variant {$type} question",
            'type' => $type,
            'content' => $content,
            'points' => 10,
            'explanation' => 'Essay questions are graded manually.',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.id');
    }

    private function attachQuestionToExam(Tenant $tenant, TenantUser $manager, int $exam, int $questionId): int
    {
        Sanctum::actingAs($manager->user);

        $this->postJson("/api/v1/exam-bank/exams/{$exam}/questions", [
            'question_id' => $questionId,
        ], $this->tenantHeader($tenant))->assertOk();

        return (int) ExamQuestion::query()
            ->withoutGlobalScopes()
            ->where('exam_id', $exam)
            ->where('question_id', $questionId)
            ->value('id');
    }

    /**
     * @return array{0:int, 1:int, 2:int}
     */
    private function publishedLessonStack(Tenant $tenant, TenantUser $manager, string $title): array
    {
        Sanctum::actingAs($manager->user);

        $course = $this->postJson('/api/v1/courses', [
            'title' => "{$title} Course",
            'slug' => str("{$title} Course")->slug()->toString(),
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.id');

        Course::withoutGlobalScopes()->whereKey($course)->update(['status' => 'published', 'visibility' => 'public']);

        $section = $this->postJson("/api/v1/courses/{$course}/sections", [
            'title' => "{$title} Section",
            'sort_order' => 1,
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.id');

        CourseSection::withoutGlobalScopes()->whereKey($section)->update(['status' => 'published', 'is_published' => true]);

        $lesson = $this->postJson("/api/v1/courses/{$course}/sections/{$section}/lessons", [
            'title' => "{$title} Lesson",
            'slug' => str("{$title} Lesson")->slug()->toString(),
            'lesson_type' => 'exam',
            'visibility' => 'private',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.id');

        CourseLesson::withoutGlobalScopes()->whereKey($lesson)->update(['status' => 'published']);

        return [$course, $section, $lesson];
    }

    private function attachExamToLesson(
        Tenant $tenant,
        TenantUser $manager,
        int $course,
        int $section,
        int $lesson,
        int $exam,
    ): void {
        Sanctum::actingAs($manager->user);

        $this->putJson("/api/v1/courses/{$course}/sections/{$section}/lessons/{$lesson}", [
            'exam_id' => $exam,
        ], $this->tenantHeader($tenant))->assertOk();
    }

    private function setCourseAccess(Tenant $tenant, TenantUser $admin, int $course, string $mode): void
    {
        Sanctum::actingAs($admin->user);

        $this->putJson("/api/v1/courses/{$course}/access", [
            'access_mode' => $mode,
        ], $this->tenantHeader($tenant))->assertOk();
    }

    private function enrollStudent(Tenant $tenant, TenantUser $admin, int $course, TenantUser $student): int
    {
        Sanctum::actingAs($admin->user);

        return $this->postJson("/api/v1/courses/{$course}/enrollments", [
            'tenant_user_id' => $student->id,
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('enrollment.id');
    }

    private function createBunnyStorageIntegration(Tenant $tenant): void
    {
        TenantIntegration::create([
            'tenant_id' => $tenant->id,
            'provider' => 'bunny',
            'service' => 'storage',
            'status' => 'active',
            'external_id' => null,
            'config' => [
                'zone' => 'test-zone',
                'upload_base_url' => 'https://storage.example.test/test-zone',
                'cdn_base_url' => 'https://cdn.example.test',
                'client_upload_key' => 'test-client-key',
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

        if (! Permission::query()->where('slug', 'exams.update')->exists()) {
            $this->fail('Exam permissions were not seeded.');
        }
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->forgetInstance(Tenant::class);
        app()->forgetInstance('currentTenant');
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }

    /**
     * @return array<string, string>
     */
    private function tenantHeader(Tenant $tenant): array
    {
        return ['X-Tenant-ID' => (string) $tenant->id];
    }

    /**
     * Real JPEG bytes for the variant pipeline to decode. Mirrors the GD
     * fixture guard convention of tests/Feature/ImageQuestionFlowTest.
     */
    private function makeJpeg(int $width, int $height): string
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required');
        }

        $image = imagecreatetruecolor($width, $height);
        $white = imagecolorallocate($image, 255, 255, 255);
        $black = imagecolorallocate($image, 0, 0, 0);
        imagefill($image, 0, 0, $white);
        imageline($image, 0, 0, $width, $height, $black);

        ob_start();
        imagejpeg($image, null, 90);
        $bytes = (string) ob_get_clean();
        imagedestroy($image);

        return $bytes;
    }
}
