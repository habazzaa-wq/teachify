<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Models\Permission;
use App\Models\Question;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\ExamBank\ExamCacheService;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Regression coverage for the audit HIGH finding: mutating an image question
 * (upload / replace / remove / delete) must invalidate the versioned published
 * exam question-set cache for exactly the exams that reference the question,
 * and student sessions already in flight must keep rendering after a question
 * is removed (soft-deleted) instead of failing.
 */
class ExamBankScanCacheInvalidationTest extends TestCase
{
    use RefreshDatabase;

    // ════════════════════════════════════════════════════════════
    //  Cache invalidation: upload / replace / remove
    // ════════════════════════════════════════════════════════════

    public function test_scan_upload_invalidates_referencing_question_set_cache(): void
    {
        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);

        $questionId = $this->createImageQuestion($tenant, $admin);
        $examId = $this->createExam($tenant, $admin);
        $this->attachQuestionToExam($tenant, $admin, $examId, $questionId);

        $before = $this->cacheVersion($tenant->id, $examId);
        $this->seedQuestionSet($tenant->id, $examId, 'stale');

        $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan", [
            'file' => new UploadedFile($this->makeJpeg(), 'a.jpg', 'image/jpeg', null, true),
        ], $this->header($tenant))->assertOk();

        // The version advanced, orphaning the stale question-set key.
        $this->assertSame($before + 1, $this->cacheVersion($tenant->id, $examId), 'upload must bump the referencing exam version');
        $this->assertNull($this->questionSet($tenant->id, $examId), 'stale question set must no longer resolve after upload');
    }

    public function test_scan_remove_invalidates_referencing_question_set_cache(): void
    {
        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);

        $questionId = $this->createImageQuestion($tenant, $admin);
        $examId = $this->createExam($tenant, $admin);
        $this->attachQuestionToExam($tenant, $admin, $examId, $questionId);

        $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan", [
            'file' => new UploadedFile($this->makeJpeg(), 'a.jpg', 'image/jpeg', null, true),
        ], $this->header($tenant))->assertOk();

        $before = $this->cacheVersion($tenant->id, $examId);
        $this->seedQuestionSet($tenant->id, $examId, 'stale');

        $this->deleteJson("/api/v1/exam-bank/questions/{$questionId}/scan", [], $this->header($tenant))->assertOk();

        $this->assertSame($before + 1, $this->cacheVersion($tenant->id, $examId), 'remove must bump the referencing exam version');
        $this->assertNull($this->questionSet($tenant->id, $examId), 'stale question set must no longer resolve after remove');
    }

    public function test_scan_mutation_bumps_only_exams_that_reference_the_question(): void
    {
        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);

        $questionA = $this->createImageQuestion($tenant, $admin);
        $questionB = $this->createImageQuestion($tenant, $admin);

        $examReferencing = $this->createExam($tenant, $admin);
        $examUnrelated = $this->createExam($tenant, $admin);
        $this->attachQuestionToExam($tenant, $admin, $examReferencing, $questionB);

        // questionA is not part of any exam yet: mutating it must not bump either exam.
        $vReferencing = $this->cacheVersion($tenant->id, $examReferencing);
        $vUnrelated = $this->cacheVersion($tenant->id, $examUnrelated);

        $this->postJson("/api/v1/exam-bank/questions/{$questionA}/scan", [
            'file' => new UploadedFile($this->makeJpeg(), 'a.jpg', 'image/jpeg', null, true),
        ], $this->header($tenant))->assertOk();

        $this->assertSame($vReferencing, $this->cacheVersion($tenant->id, $examReferencing));
        $this->assertSame($vUnrelated, $this->cacheVersion($tenant->id, $examUnrelated));

        // Link questionA and mutate it: only the referencing exam is bumped.
        $this->attachQuestionToExam($tenant, $admin, $examReferencing, $questionA);
        $vReferencing = $this->cacheVersion($tenant->id, $examReferencing);

        $this->postJson("/api/v1/exam-bank/questions/{$questionA}/scan", [
            'file' => new UploadedFile($this->makeJpeg(), 'b.jpg', 'image/jpeg', null, true),
        ], $this->header($tenant))->assertOk();

        $this->assertSame($vReferencing + 1, $this->cacheVersion($tenant->id, $examReferencing), 'referencing exam must be bumped');
        $this->assertSame($vUnrelated, $this->cacheVersion($tenant->id, $examUnrelated), 'unrelated exam must not be bumped');
    }

    public function test_scan_mutation_never_bumps_another_tenant_exam(): void
    {
        [$tenantA, $adminA] = $this->people();
        $tenantB = Tenant::factory()->create();
        $adminB = $this->memberWithRole($tenantB, 'admin');

        $this->actingAs($adminA->user);
        $questionA = $this->createImageQuestion($tenantA, $adminA);
        $examA = $this->createExam($tenantA, $adminA);
        $this->attachQuestionToExam($tenantA, $adminA, $examA, $questionA);

        $this->actingAs($adminB->user);
        $questionB = $this->createImageQuestion($tenantB, $adminB);
        $examB = $this->createExam($tenantB, $adminB);
        $this->attachQuestionToExam($tenantB, $adminB, $examB, $questionB);

        $vA = $this->cacheVersion($tenantA->id, $examA);
        $vB = $this->cacheVersion($tenantB->id, $examB);

        // Tenant A mutates its question: tenant B's cached exam must be untouched.
        $this->actingAs($adminA->user);
        $this->postJson("/api/v1/exam-bank/questions/{$questionA}/scan", [
            'file' => new UploadedFile($this->makeJpeg(), 'a.jpg', 'image/jpeg', null, true),
        ], $this->header($tenantA))->assertOk();

        $this->assertSame($vA + 1, $this->cacheVersion($tenantA->id, $examA));
        $this->assertSame($vB, $this->cacheVersion($tenantB->id, $examB), "tenant A's mutation must not touch tenant B's exam");
    }

    // ════════════════════════════════════════════════════════════
    //  Deletion: cache invalidation + in-flight session survival
    // ════════════════════════════════════════════════════════════

    public function test_delete_question_bumps_cache_and_in_flight_session_keeps_rendering(): void
    {
        Storage::fake('public');

        [$tenant, $admin, $student, $lesson, $exam, $questionId] = $this->imageSessionFixture();

        // Student starts the exam: the image question is rendered with its scan.
        Sanctum::actingAs($student->user);
        $start = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->header($tenant))
            ->assertCreated()
            ->json('data');

        $attemptId = $start['attempt']['id'];
        $imageDto = collect($start['questions'])->firstWhere('questionId', (string) $questionId);
        $this->assertNotNull($imageDto);
        $this->assertSame('image', $imageDto['questionFormat']);
        $this->assertNotNull($imageDto['scanUrl']);

        // Teacher deletes the image question mid-flight.
        $beforeDelete = $this->cacheVersion($tenant->id, $exam);
        Sanctum::actingAs($admin->user);
        $this->deleteJson("/api/v1/exam-bank/questions/{$questionId}", [], $this->header($tenant))
            ->assertOk();

        $this->assertSoftDeleted('questions', ['id' => $questionId]);
        $this->assertSame($beforeDelete + 1, $this->cacheVersion($tenant->id, $exam), 'delete must invalidate the referencing exam cache');
        $this->assertNull($this->questionSet($tenant->id, $exam), 'question set must be rebuilt after delete');
        $this->assertFalse(Cache::has("exam:{$tenant->id}:{$exam}:meta"), 'exam meta must be forgotten on delete');

        // A resumed session must rebuild the question set from the remaining rows
        // (soft-deleted question still resolvable) and keep rendering — no 500.
        Sanctum::actingAs($student->user);
        $resume = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->header($tenant))
            ->assertCreated()
            ->json('data');

        $this->assertSame($attemptId, $resume['attempt']['id'], 'the in-flight attempt is resumed');

        $imageDtoAfterDelete = collect($resume['questions'])->firstWhere('questionId', (string) $questionId);
        $this->assertNotNull($imageDtoAfterDelete, 'deleted question must still render for the open attempt');
        $this->assertSame('image', $imageDtoAfterDelete['questionFormat']);
        $this->assertNull($imageDtoAfterDelete['scanUrl'], 'disposed scan must resolve to null, never an active URL');

        // Grading the attempt after deletion must also not fail.
        $this->postJson("/api/v1/exam-sessions/{$attemptId}/submit", [], $this->header($tenant))->assertOk();
    }

    // ════════════════════════════════════════════════════════════
    //  Upload hardening
    // ════════════════════════════════════════════════════════════

    public function test_upload_rejects_image_exceeding_pixel_budget(): void
    {
        config(['scanner.max_pixels' => 1000]);

        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);
        $questionId = $this->createImageQuestion($tenant, $admin);

        // 200x100 = 20,000 px > 1,000 budget ceiling: clean 422, no attachment.
        $response = $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan", [
            'file' => new UploadedFile($this->makeJpeg(200, 100), 'a.jpg', 'image/jpeg', null, true),
        ], $this->header($tenant));

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('file');
        $this->assertNull(Question::withoutGlobalScopes()->find($questionId)->media_asset_id);
    }

    public function test_update_normalizes_image_format_without_asset_to_text(): void
    {
        [$tenant, $admin] = $this->people();
        $this->actingAs($admin->user);
        $questionId = $this->createImageQuestion($tenant, $admin);

        // No media asset attached (this particular question never got a scan):
        // requesting image format alone must not persist image-with-null-asset.
        $updated = $this->patchJson("/api/v1/exam-bank/questions/{$questionId}", [
            'title' => 'Image question without a scan',
            'question_format' => 'image',
        ], $this->header($tenant))->assertOk()->json('data');

        $this->assertSame('text', $updated['questionFormat'], 'image format without an asset must demote to text');
        $this->assertNull($updated['scanUrl']);
        $this->assertNull($updated['scanAssetId']);
    }

    // ════════════════════════════════════════════════════════════
    //  Fixtures
    // ════════════════════════════════════════════════════════════

    private function people(): array
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');

        return [$tenant, $admin, $student];
    }

    private function header(Tenant $tenant): array
    {
        return ['X-Tenant-ID' => (string) $tenant->id];
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

    private function createImageQuestion(Tenant $tenant, TenantUser $admin): int
    {
        Sanctum::actingAs($admin->user);

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
        ], $this->header($tenant))->assertCreated()->json('data.id');
    }

    private function createExam(Tenant $tenant, TenantUser $manager): int
    {
        Sanctum::actingAs($manager->user);

        $exam = $this->postJson('/api/v1/exam-bank/exams', [
            'title' => 'Cache Invalidation Exam',
            'description' => 'Exam description.',
            'duration' => 60,
            'passing_score' => 60,
            'attempt_limit' => 3,
        ], $this->header($tenant))->assertCreated()->json('data.id');

        return (int) $exam;
    }

    private function attachQuestionToExam(Tenant $tenant, TenantUser $manager, int $exam, int $questionId): int
    {
        Sanctum::actingAs($manager->user);

        $this->postJson("/api/v1/exam-bank/exams/{$exam}/questions", [
            'question_id' => $questionId,
        ], $this->header($tenant))->assertOk();

        return (int) ExamQuestion::query()
            ->withoutGlobalScopes()
            ->where('exam_id', $exam)
            ->where('question_id', $questionId)
            ->value('id');
    }

    /**
     * Full published-course + exam + enrolled-student stack hosting a single
     * image question, mirroring ExamSessionFoundationTest's fixture.
     *
     * @return array{0: Tenant, 1: TenantUser, 2: TenantUser, 3: int, 4: int, 5: int}
     */
    private function imageSessionFixture(): array
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');

        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Image Session');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $this->enrollStudent($tenant, $admin, $course, $student);

        Sanctum::actingAs($admin->user);
        $exam = (int) $this->postJson('/api/v1/exam-bank/exams', [
            'title' => 'Image Session Exam',
            'description' => 'Exam description.',
            'duration' => 30,
            'passing_score' => 60,
            'attempt_limit' => 3,
        ], $this->header($tenant))->assertCreated()->json('data.id');
        $this->patchJson("/api/v1/exam-bank/exams/{$exam}/publish", [], $this->header($tenant))->assertOk();

        $questionId = $this->createImageQuestion($tenant, $admin);
        $this->attachQuestionToExam($tenant, $admin, $exam, $questionId);

        // Attach a real scan so the student session renders an actual image URL.
        $this->postJson("/api/v1/exam-bank/questions/{$questionId}/scan", [
            'file' => new UploadedFile($this->makeJpeg(), 'q.jpg', 'image/jpeg', null, true),
        ], $this->header($tenant))->assertOk();

        $this->putJson("/api/v1/courses/{$course}/sections/{$section}/lessons/{$lesson}", [
            'exam_id' => $exam,
        ], $this->header($tenant))->assertOk();

        return [$tenant, $admin, $student, $lesson, $exam, $questionId];
    }

    /**
     * @return array{0: int, 1: int, 2: int}
     */
    private function publishedLessonStack(Tenant $tenant, TenantUser $manager, string $title): array
    {
        Sanctum::actingAs($manager->user);

        $course = (int) $this->postJson('/api/v1/courses', [
            'title' => "{$title} Course",
            'slug' => str("{$title} Course")->slug()->toString(),
        ], $this->header($tenant))->assertCreated()->json('data.id');
        Course::withoutGlobalScopes()->whereKey($course)->update(['status' => 'published', 'visibility' => 'public']);

        $section = (int) $this->postJson("/api/v1/courses/{$course}/sections", [
            'title' => "{$title} Section",
            'sort_order' => 1,
        ], $this->header($tenant))->assertCreated()->json('data.id');
        CourseSection::withoutGlobalScopes()->whereKey($section)->update(['status' => 'published', 'is_published' => true]);

        $lesson = (int) $this->postJson("/api/v1/courses/{$course}/sections/{$section}/lessons", [
            'title' => "{$title} Lesson",
            'slug' => str("{$title} Lesson")->slug()->toString(),
            'lesson_type' => 'exam',
            'visibility' => 'private',
        ], $this->header($tenant))->assertCreated()->json('data.id');
        CourseLesson::withoutGlobalScopes()->whereKey($lesson)->update(['status' => 'published']);

        return [$course, $section, $lesson];
    }

    private function setCourseAccess(Tenant $tenant, TenantUser $admin, int $course, string $mode): void
    {
        Sanctum::actingAs($admin->user);
        $this->putJson("/api/v1/courses/{$course}/access", [
            'access_mode' => $mode,
        ], $this->header($tenant))->assertOk();
    }

    private function enrollStudent(Tenant $tenant, TenantUser $admin, int $course, TenantUser $student): int
    {
        Sanctum::actingAs($admin->user);

        return $this->postJson("/api/v1/courses/{$course}/enrollments", [
            'tenant_user_id' => $student->id,
        ], $this->header($tenant))->assertCreated()->json('enrollment.id');
    }

    private function makeJpeg(int $w = 800, int $h = 600): string
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required');
        }
        $path = tempnam(sys_get_temp_dir(), 'img').'.jpg';
        $im = imagecreatetruecolor($w, $h);
        imagefill($im, 0, 0, imagecolorallocate($im, 255, 255, 255));
        for ($i = 0; $i < 4000; $i++) {
            $c = imagecolorallocate($im, random_int(0, 255), random_int(0, 255), random_int(0, 255));
            imagesetpixel($im, random_int(0, $w - 1), random_int(0, $h - 1), $c);
        }
        $text = imagecolorallocate($im, 20, 20, 20);
        imagestring($im, 5, 40, 40, 'Sample question text for the teacher', $text);
        imagejpeg($im, $path, 90);
        imagedestroy($im);

        return $path;
    }

    // ════════════════════════════════════════════════════════════
    //  Cache helpers
    // ════════════════════════════════════════════════════════════

    private function cacheVersion(int $tenantId, int $examId): int
    {
        return (int) Cache::get("exam:{$tenantId}:{$examId}:v", 0);
    }

    private function seedQuestionSet(int $tenantId, int $examId, string $subsetKey): void
    {
        app(ExamCacheService::class)->setQuestionSet($tenantId, $examId, $subsetKey, false, ['stale' => true]);
    }

    private function questionSet(int $tenantId, int $examId): mixed
    {
        return app(ExamCacheService::class)->questionSet($tenantId, $examId, '', false);
    }
}
