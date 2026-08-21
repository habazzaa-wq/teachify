<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\MediaAsset;
use App\Models\Permission;
use App\Models\Question;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ScanLifecycleE2EValidation extends TestCase
{
    use RefreshDatabase;

    private const REAL_SCAN = 'storage/app/scan-debug-tools/real/real_old_corrupted_output.jpg';

    private const CORRUPT_SCAN = 'storage/app/scan-debug-tools/real/vps_corrupt.jpg';

    public function test_full_lifecycle_upload_persist_answer_type_changes_student_session(): void
    {
        [$tenant, $admin, $student] = $this->people();

        Sanctum::actingAs($admin->user);
        $headers = $this->tenantHeader($tenant);

        // ── STEP 1: create image question ──
        $questionId = (int) $this->postJson('/api/v1/exam-bank/questions', [
            'question_format' => 'image',
            'type' => 'single_choice',
            'content' => [
                'options' => [
                    ['id' => 'opt-a', 'text' => 'أ', 'correct' => true],
                    ['id' => 'opt-b', 'text' => 'ب', 'correct' => false],
                ],
            ],
            'points' => 1,
        ], $headers)->assertCreated()->json('data.id');

        // ── STEP 2: upload the REAL problematic scan ──
        $upload = $this->uploadScan($tenant, $questionId, self::REAL_SCAN);
        $upload->assertOk();

        $data = $upload->json('data');
        $this->assertSame('image', $data['questionFormat']);
        $this->assertNotEmpty($data['scanUrl']);
        $this->assertNotNull($data['scanAssetId']);
        $this->assertSame('auto', $data['scanProcessing']['mode']);
        $this->assertFalse($data['scanProcessing']['fallbackUsed']);
        $this->assertNotEmpty($data['scanProcessing']['qualityLevel']);

        // ── STEP 3: MediaAsset persisted correctly ──
        $assetId = (int) $data['scanAssetId'];
        $asset = MediaAsset::query()->withoutGlobalScopes()->findOrFail($assetId);
        $this->assertSame($tenant->id, $asset->tenant_id);
        $this->assertNotNull($asset->cdn_url);
        $this->assertSame(1174, (int) $asset->width);
        $this->assertSame(1600, (int) $asset->height);

        // ── STEP 4: question points at the asset ──
        $this->assertSame($assetId, Question::query()->withoutGlobalScopes()->find($questionId)->media_asset_id);

        // ── STEP 5: refetch persists ──
        $fetched = $this->getJson("/api/v1/exam-bank/questions/{$questionId}", $headers)->assertOk();
        $this->assertSame($data['scanUrl'], $fetched->json('data.scanUrl'));
        $this->assertSame('image', $fetched->json('data.questionFormat'));

        // ── STEP 6: answer-type changes keep the attachment ──
        foreach (['multiple_choice', 'essay', 'short_answer', 'single_choice'] as $type) {
            $payload = ['type' => $type];
            if (in_array($type, ['multiple_choice', 'single_choice'], true)) {
                $payload['content'] = [
                    'options' => [
                        ['id' => 'opt-a', 'text' => 'أ', 'correct' => true],
                        ['id' => 'opt-b', 'text' => 'ب', 'correct' => false],
                    ],
                ];
            }

            $this->putJson("/api/v1/exam-bank/questions/{$questionId}", $payload, $headers)->assertOk();
            $after = $this->getJson("/api/v1/exam-bank/questions/{$questionId}", $headers)->assertOk();
            $this->assertSame($assetId, (int) $after->json('data.scanAssetId'), "type={$type} kept scan");
            $this->assertSame('image', $after->json('data.questionFormat'));
        }

        // ── STEP 7: student session exposes the same scan, no answers leak ──
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Scan Lifecycle');
        $exam = $this->createPublishedExam($tenant, $admin);
        $this->postJson("/api/v1/exam-bank/exams/{$exam}/questions", [
            'question_id' => $questionId,
        ], $headers)->assertOk();
        $this->attachExamToLesson($tenant, $admin, $course, $section, $lesson, $exam);
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $this->enrollStudent($tenant, $admin, $course, $student);
        Sanctum::actingAs($student->user);
        $session = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $headers)
            ->assertCreated()
            ->json('data');

        $first = $session['questions'][0];
        $this->assertSame((string) $questionId, $first['questionId']);
        $this->assertSame($data['scanUrl'], $first['scanUrl'] ?? null);
        $this->assertArrayNotHasKey('correct', $first['content'] ?? []);
    }

    public function test_corrupt_image_upload_is_rejected_with_validation_error(): void
    {
        [$tenant, $admin] = $this->people();
        Sanctum::actingAs($admin->user);
        $questionId = $this->createImageQuestion($tenant);

        $response = $this->uploadScan($tenant, $questionId, self::CORRUPT_SCAN);

        $response->assertStatus(422);
        $this->assertArrayHasKey('file', $response->json('errors'));
        $this->assertNull(Question::query()->withoutGlobalScopes()->find($questionId)->media_asset_id);
    }

    public function test_duplicate_upload_replaces_asset_and_cleans_old(): void
    {
        [$tenant, $admin] = $this->people();
        Sanctum::actingAs($admin->user);
        $headers = $this->tenantHeader($tenant);
        $questionId = $this->createImageQuestion($tenant);

        $firstAssetId = (int) $this->uploadScan($tenant, $questionId, self::REAL_SCAN)
            ->assertOk()->json('data.scanAssetId');
        $secondAssetId = (int) $this->uploadScan($tenant, $questionId, self::REAL_SCAN)
            ->assertOk()->json('data.scanAssetId');

        $this->assertNotSame($firstAssetId, $secondAssetId);
        $this->assertSame($secondAssetId, Question::query()->withoutGlobalScopes()->find($questionId)->media_asset_id);
        $this->assertSoftDeleted('media_assets', ['id' => $firstAssetId]);
        $this->assertDatabaseHas('media_assets', ['id' => $secondAssetId]);
    }

    public function test_remove_scan_clears_attachment_and_soft_deletes_asset(): void
    {
        [$tenant, $admin] = $this->people();
        Sanctum::actingAs($admin->user);
        $headers = $this->tenantHeader($tenant);
        $questionId = $this->createImageQuestion($tenant);

        $assetId = (int) $this->uploadScan($tenant, $questionId, self::REAL_SCAN)
            ->assertOk()->json('data.scanAssetId');

        $this->deleteJson("/api/v1/exam-bank/questions/{$questionId}/scan", [], $headers)->assertOk();

        $question = Question::query()->withoutGlobalScopes()->find($questionId);
        $this->assertNull($question->media_asset_id);
        $this->assertSame('text', $question->question_format);
        $this->assertSoftDeleted('media_assets', ['id' => $assetId]);
    }

    // ════════════════════════════════════════════════════════════
    //  Helpers
    // ════════════════════════════════════════════════════════════

    /**
     * @return array{0: Tenant, 1: TenantUser, 2: TenantUser}
     */
    private function people(): array
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');

        return [$tenant, $admin, $student];
    }

    private function createImageQuestion(Tenant $tenant): int
    {
        return (int) $this->postJson('/api/v1/exam-bank/questions', [
            'question_format' => 'image',
            'type' => 'single_choice',
            'content' => [
                'options' => [
                    ['id' => 'opt-a', 'text' => 'أ', 'correct' => true],
                    ['id' => 'opt-b', 'text' => 'ب', 'correct' => false],
                ],
            ],
            'points' => 1,
        ], $this->tenantHeader($tenant))->assertCreated()->json('data.id');
    }

    private function uploadScan(Tenant $tenant, int $questionId, string $path): \Illuminate\Testing\TestResponse
    {
        $absolute = base_path($path);
        $file = new UploadedFile($absolute, basename($path), 'image/jpeg', null, true);

        return $this->postJson(
            "/api/v1/exam-bank/questions/{$questionId}/scan",
            ['file' => $file],
            $this->tenantHeader($tenant),
        );
    }

    /**
     * @return array{0: int, 1: int, 2: int}
     */
    private function publishedLessonStack(Tenant $tenant, TenantUser $manager, string $title): array
    {
        Sanctum::actingAs($manager->user);

        $course = $this->postJson('/api/v1/courses', [
            'title' => "{$title} Course",
            'slug' => str("{$title} Course")->slug()->toString(),
        ], $this->tenantHeader($tenant))->assertCreated()->json('data.id');

        Course::withoutGlobalScopes()->whereKey($course)->update(['status' => 'published', 'visibility' => 'public']);

        $section = $this->postJson("/api/v1/courses/{$course}/sections", [
            'title' => "{$title} Section",
            'sort_order' => 1,
        ], $this->tenantHeader($tenant))->assertCreated()->json('data.id');

        CourseSection::withoutGlobalScopes()->whereKey($section)->update(['status' => 'published', 'is_published' => true]);

        $lesson = $this->postJson("/api/v1/courses/{$course}/sections/{$section}/lessons", [
            'title' => "{$title} Lesson",
            'slug' => str("{$title} Lesson")->slug()->toString(),
            'lesson_type' => 'exam',
            'visibility' => 'private',
        ], $this->tenantHeader($tenant))->assertCreated()->json('data.id');

        CourseLesson::withoutGlobalScopes()->whereKey($lesson)->update(['status' => 'published']);

        return [(int) $course, (int) $section, (int) $lesson];
    }

    private function createPublishedExam(Tenant $tenant, TenantUser $manager): int
    {
        Sanctum::actingAs($manager->user);

        $exam = $this->postJson('/api/v1/exam-bank/exams', [
            'title' => 'Scan Lifecycle Exam',
            'description' => 'Exam description.',
            'duration' => 30,
            'passing_score' => 60,
            'attempt_limit' => 3,
        ], $this->tenantHeader($tenant))->assertCreated()->json('data.id');

        $this->patchJson("/api/v1/exam-bank/exams/{$exam}/publish", [], $this->tenantHeader($tenant))->assertOk();

        return (int) $exam;
    }

    private function attachExamToLesson(Tenant $tenant, TenantUser $admin, int $course, int $section, int $lesson, int $exam): void
    {
        Sanctum::actingAs($admin->user);

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

        return (int) $this->postJson("/api/v1/courses/{$course}/enrollments", [
            'tenant_user_id' => $student->id,
        ], $this->tenantHeader($tenant))->assertCreated()->json('enrollment.id');
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

        if (! Permission::query()->where('slug', 'courses.update')->exists()) {
            $this->fail('Course permissions were not seeded.');
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
