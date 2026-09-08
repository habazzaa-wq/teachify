<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\ExamAttemptAnswer;
use App\Models\ExamAttemptAnswerPage;
use App\Models\ExamQuestion;
use App\Models\MediaAsset;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantIntegration;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Bunny\Contracts\BunnyStorageInterface;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\Support\FakeBunnyStorage;
use Tests\TestCase;

/**
 * Phase D-FIX — Student-side delete and reorder of already-confirmed answer
 * pages over the real routes.
 *
 * The only seam is Bunny Storage: deletion mirrors the Media Library's own
 * soft-delete flow (Bunny object via BunnyStorageInterface::deleteFile, then a
 * soft-deleted MediaAsset row), so the interface is bound to a recording fake
 * and the queue/events are faked so the library's clean-up jobs never run
 * against the sync queue.
 */
class ExamAnswerPageManageTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_delete_a_page_and_remaining_pages_are_renumbered(): void
    {
        [$tenant, $student, $attemptId, $examQuestionId, $pageIds, $answerId, $assetIds] = $this->manageFixture(2);
        $fake = $this->sealDeletePath();

        Sanctum::actingAs($student->user);

        $data = $this->deleteJson(
            "/api/v1/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages/{$pageIds[0]}",
            [],
            $this->tenantHeader($tenant),
        )->assertOk()->json('data');

        // §2.5 response: current page list (id, page_order) + answer mode/status.
        $this->assertSame((string) $answerId, $data['answerId']);
        $this->assertSame('image_pages', $data['answerMode']);
        $this->assertSame('pending_manual_review', $data['gradingStatus']);
        $this->assertCount(1, $data['pages']);
        $this->assertSame((string) $pageIds[1], $data['pages'][0]['id']);
        $this->assertSame(0, $data['pages'][0]['pageOrder']);

        // The page row is gone and the remaining one was renumbered 0..n-1.
        $this->assertDatabaseMissing('exam_attempt_answer_pages', ['id' => $pageIds[0]]);
        $this->assertSame(0, (int) ExamAttemptAnswerPage::query()->findOrFail($pageIds[1])->page_order);

        // §4: the MediaAsset was soft-deleted and the Bunny object purge was
        // attempted through the recording interface.
        $this->assertNotNull(MediaAsset::query()->onlyTrashed()->find($assetIds[0]));
        $this->assertNull(MediaAsset::query()->find($assetIds[0]));
        $this->assertNotEmpty($fake->deleteCalls);

        // A second delete leaves the answer unanswered.
        $this->deleteJson(
            "/api/v1/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages/{$pageIds[1]}",
            [],
            $this->tenantHeader($tenant),
        )->assertOk();

        $answer = ExamAttemptAnswer::query()->findOrFail($answerId);
        $this->assertSame('text', $answer->answer_mode);
        $this->assertSame('auto_graded', $answer->grading_status);
        $this->assertNull($answer->answer);
        $this->assertNull($answer->answered_at);
        $this->assertNull($answer->is_correct);
        $this->assertSame(0, (int) $answer->earned_points);
        $this->assertSame(0, (int) ExamAttemptAnswerPage::query()->where('exam_attempt_answer_id', $answerId)->count());
    }

    public function test_deleting_the_last_page_reverts_the_answer_to_unanswered(): void
    {
        [$tenant, $student, $attemptId, $examQuestionId, $pageIds, $answerId, $assetIds] = $this->manageFixture(1);
        $this->sealDeletePath();

        Sanctum::actingAs($student->user);

        $data = $this->deleteJson(
            "/api/v1/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages/{$pageIds[0]}",
            [],
            $this->tenantHeader($tenant),
        )->assertOk()->json('data');

        $this->assertSame([], $data['pages']);
        $this->assertSame('text', $data['answerMode']);
        $this->assertSame('auto_graded', $data['gradingStatus']);

        $answer = ExamAttemptAnswer::query()->findOrFail($answerId);
        $this->assertNull($answer->answer);
        $this->assertNull($answer->answered_at);
    }

    public function test_delete_is_denied_for_another_student(): void
    {
        [$tenant, $student, $attemptId, $examQuestionId, $pageIds] = $this->manageFixture(1);
        $this->sealDeletePath();

        $otherStudent = $this->memberWithRole($tenant, 'student');
        Sanctum::actingAs($otherStudent->user);

        $this->deleteJson(
            "/api/v1/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages/{$pageIds[0]}",
            [],
            $this->tenantHeader($tenant),
        )->assertNotFound();
    }

    public function test_delete_is_rejected_after_the_attempt_is_submitted(): void
    {
        [$tenant, $student, $attemptId, $examQuestionId, $pageIds] = $this->manageFixture(1);
        $this->sealDeletePath();

        Sanctum::actingAs($student->user);
        $this->postJson("/api/v1/exam-sessions/{$attemptId}/submit", [], $this->tenantHeader($tenant))
            ->assertOk();

        $response = $this->deleteJson(
            "/api/v1/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages/{$pageIds[0]}",
            [],
            $this->tenantHeader($tenant),
        );

        // §2.3: same "still answerable" gate as upload intent/confirm — after
        // submission the attempt is not in_progress, so modify attempts 422.
        $response->assertStatus(422);
        $this->assertSame(
            'Only in-progress attempts can be modified.',
            $response->json('errors.attempt.0'),
        );
    }

    public function test_student_can_reorder_pages(): void
    {
        [$tenant, $student, $attemptId, $examQuestionId, $pageIds, $answerId] = $this->manageFixture(3);
        $this->sealDeletePath();

        Sanctum::actingAs($student->user);

        $data = $this->putJson(
            "/api/v1/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages/reorder",
            ['page_ids' => [$pageIds[2], $pageIds[0], $pageIds[1]]],
            $this->tenantHeader($tenant),
        )->assertOk()->json('data');

        $this->assertSame([
            (string) $pageIds[2],
            (string) $pageIds[0],
            (string) $pageIds[1],
        ], array_column($data['pages'], 'id'));
        $this->assertSame([0, 1, 2], array_column($data['pages'], 'pageOrder'));

        $orders = ExamAttemptAnswerPage::query()
            ->where('exam_attempt_answer_id', $answerId)
            ->orderBy('page_order')
            ->pluck('id')
            ->all();
        $this->assertSame($pageIds[2], (int) $orders[0]);
        $this->assertSame($pageIds[0], (int) $orders[1]);
        $this->assertSame($pageIds[1], (int) $orders[2]);
    }

    public function test_reorder_rejects_a_partial_or_foreign_page_list(): void
    {
        [$tenant, $student, $attemptId, $examQuestionId, $pageIds] = $this->manageFixture(2);
        $this->sealDeletePath();

        Sanctum::actingAs($student->user);

        // Partial list (drops the second page).
        $this->putJson(
            "/api/v1/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages/reorder",
            ['page_ids' => [$pageIds[0]]],
            $this->tenantHeader($tenant),
        )->assertStatus(422);

        // Foreign id mixed into the full list.
        $this->putJson(
            "/api/v1/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages/reorder",
            ['page_ids' => [$pageIds[0], 999999]],
            $this->tenantHeader($tenant),
        )->assertStatus(422);

        // Duplicate ids.
        $this->putJson(
            "/api/v1/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages/reorder",
            ['page_ids' => [$pageIds[0], $pageIds[0]]],
            $this->tenantHeader($tenant),
        )->assertStatus(422);
    }

    public function test_reorder_is_denied_for_another_student(): void
    {
        [$tenant, $student, $attemptId, $examQuestionId, $pageIds] = $this->manageFixture(2);
        $this->sealDeletePath();

        $otherStudent = $this->memberWithRole($tenant, 'student');
        Sanctum::actingAs($otherStudent->user);

        $this->putJson(
            "/api/v1/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages/reorder",
            ['page_ids' => [$pageIds[1], $pageIds[0]]],
            $this->tenantHeader($tenant),
        )->assertNotFound();
    }

    /**
     * Bind the recording Bunny fake and freeze the Media Library's delete
     * side-effects (queues + events) so they never run against the sync queue.
     */
    private function sealDeletePath(): FakeBunnyStorage
    {
        Queue::fake();
        Event::fake();

        $fake = new FakeBunnyStorage;
        $this->app->instance(BunnyStorageInterface::class, $fake);

        return $fake;
    }

    /**
     * Start an attempt and upload N pages through the real intent/confirm
     * endpoints.
     *
     * @return array{0: Tenant, 1: TenantUser, 2: int, 3: int, 4: list<int>, 5: int, 6: list<int>}
     */
    private function manageFixture(int $pageCount): array
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');

        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Manage');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $this->enrollStudent($tenant, $admin, $course, $student);

        $exam = $this->createPublishedExam($tenant, $admin);
        $questionId = $this->createQuestion($tenant, $admin, 'essay', ['prompt' => 'Solve and photograph your work.']);
        $examQuestionId = $this->attachQuestionToExam($tenant, $admin, $exam, $questionId);
        $this->attachExamToLesson($tenant, $admin, $course, $section, $lesson, $exam);

        $this->createBunnyStorageIntegration($tenant);
        $this->app->instance(BunnyStorageInterface::class, new FakeBunnyStorage);

        // Phase F: each confirm dispatches GenerateAnswerPageVariantsJob, which
        // on the sync test queue reads the original and PUTs the variants to
        // the tenant's Bunny Storage over Http. Fake that so the fixture's
        // uploads never leave the process.
        Http::fake([
            'storage.example.test/*' => Http::response($this->makeJpeg(1200, 900), 200, [
                'Content-Type' => 'image/jpeg',
            ]),
        ]);

        Sanctum::actingAs($student->user);
        $started = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');
        $attemptId = (int) $started['attempt']['id'];

        $answerId = $this->uploadPages($tenant, $student, $attemptId, $examQuestionId, $pageCount);

        $pageIds = ExamAttemptAnswerPage::query()
            ->where('exam_attempt_answer_id', $answerId)
            ->orderBy('page_order')
            ->pluck('id')
            ->map(fn ($id): int => (int) $id)
            ->all();
        $assetIds = ExamAttemptAnswerPage::query()
            ->where('exam_attempt_answer_id', $answerId)
            ->pluck('media_asset_id')
            ->map(fn ($id): int => (int) $id)
            ->all();

        return [$tenant, $student, $attemptId, $examQuestionId, $pageIds, $answerId, $assetIds];
    }

    private function uploadPages(Tenant $tenant, TenantUser $student, int $attemptId, int $examQuestionId, int $count): int
    {
        Sanctum::actingAs($student->user);

        $answerId = null;

        for ($i = 1; $i <= $count; $i++) {
            $intent = $this->postJson(
                "/api/v1/exam-sessions/{$attemptId}/answers/{$examQuestionId}/upload-intent",
                [
                    'original_filename' => "page-{$i}.jpg",
                    'mime_type' => 'image/jpeg',
                    'size_bytes' => 2048,
                ],
                $this->tenantHeader($tenant),
            )->assertCreated()->json('data');

            $confirm = $this->postJson(
                "/api/v1/exam-sessions/{$attemptId}/answers/{$examQuestionId}/pages/{$intent['session_id']}/confirm",
                [
                    'mime_type' => 'image/jpeg',
                    'size_bytes' => 2048,
                    'original_filename' => "page-{$i}.jpg",
                ],
                $this->tenantHeader($tenant),
            )->assertCreated()->json('data');

            $answerId = (int) $confirm['answer_id'];
        }

        return $answerId;
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createPublishedExam(Tenant $tenant, TenantUser $manager, array $overrides = []): int
    {
        Sanctum::actingAs($manager->user);

        $exam = $this->postJson('/api/v1/exam-bank/exams', array_merge([
            'title' => 'Manage Exam',
            'description' => 'Image answer manage exam.',
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
            'title' => "Manage {$type} question",
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
     * @return array{0:int,1:int,2:int}
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

    /**
     * @return array<string, string>
     */
    private function tenantHeader(Tenant $tenant): array
    {
        return ['X-Tenant-ID' => (string) $tenant->id];
    }

    /**
     * Real JPEG bytes for the Phase F variant job to decode. Mirrors the GD
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
