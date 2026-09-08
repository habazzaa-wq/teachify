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
use App\Models\Question;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantIntegration;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Phase C — Private read-back of exam answer pages.
 *
 * Authorization model under test:
 *  - the attempt owner reads their own pages (ExamAttemptPolicy::viewPages,
 *    same predicate as ExamAttemptPolicy::view/update/submit and
 *    ExamResultService), and every other caller — students, teachers, other
 *    tenants — is denied unless they can ALSO manage the exam via
 *    ExamPolicy::update() (tenant operator / exam creator + exams.update).
 */
class ExamAnswerPageReadTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_list_their_own_pages(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $examQuestionId] = $this->readFixture();

        Sanctum::actingAs($student->user);

        $data = $this->getJson("/api/v1/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages", $this->tenantHeader($tenant))
            ->assertOk()
            ->json('data');

        $this->assertSame((string) $attemptId, $data['attemptId']);
        $this->assertSame((string) $examQuestionId, $data['examQuestionId']);
        $this->assertSame('image_pages', $data['answerMode']);
        $this->assertSame('pending_manual_review', $data['gradingStatus']);

        $this->assertCount(2, $data['pages']);
        $this->assertSame([1, 2], array_column($data['pages'], 'pageOrder'));
        $this->assertSame('image/png', $data['pages'][0]['mimeType']);
        $this->assertSame('image/png', $data['pages'][1]['mimeType']);

        foreach ($data['pages'] as $page) {
            $this->assertArrayHasKey('id', $page);
            $this->assertArrayHasKey('capturedAt', $page);
            $this->assertArrayHasKey('url', $page);
            $this->assertStringContainsString("/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages/{$page['id']}", $page['url']);
        }

        // Student payload must not leak grading fields, storage keys or paths.
        $this->assertArrayNotHasKey('manualScore', $data);
        $this->assertArrayNotHasKey('feedback', $data);
        $this->assertArrayNotHasKey('gradedBy', $data);
        $this->assertArrayNotHasKey('gradedAt', $data);

        foreach ($data['pages'] as $page) {
            $this->assertArrayNotHasKey('storageKey', $page);
            $this->assertArrayNotHasKey('storage_key', $page);
            $this->assertArrayNotHasKey('mediaAssetId', $page);
        }
    }

    public function test_student_can_stream_a_page_but_response_is_private_and_signature_free(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $examQuestionId, $pageIds] = $this->readFixture();

        Http::fake(['storage.example.test/*' => Http::response('PNG-BYTES', 200, [
            'Content-Type' => 'image/png',
        ])]);

        Sanctum::actingAs($student->user);

        $response = $this->get("/api/v1/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages/{$pageIds[0]}", $this->tenantHeader($tenant));

        $response->assertOk()
            ->assertHeader('Content-Type', 'image/png');

        $cacheControl = (string) $response->headers->get('Cache-Control');
        $this->assertStringContainsString('no-store', $cacheControl);
        $this->assertStringContainsString('private', $cacheControl);

        $this->assertSame('PNG-BYTES', $response->getContent());
        $this->assertStringNotContainsString('signature', $response->getContent());
    }

    public function test_student_cannot_view_another_students_pages(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $examQuestionId] = $this->readFixture();

        $otherStudent = $this->memberWithRole($tenant, 'student');
        Sanctum::actingAs($otherStudent->user);

        $this->getJson("/api/v1/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages", $this->tenantHeader($tenant))
            ->assertNotFound();
    }

    public function test_page_stream_is_denied_for_another_student(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $examQuestionId, $pageIds] = $this->readFixture();

        Http::fake();

        $otherStudent = $this->memberWithRole($tenant, 'student');
        Sanctum::actingAs($otherStudent->user);

        $this->get("/api/v1/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages/{$pageIds[0]}", $this->tenantHeader($tenant))
            ->assertNotFound();
    }

    public function test_student_from_other_tenant_cannot_resolve_the_attempt(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $examQuestionId] = $this->readFixture();

        $foreignTenant = Tenant::factory()->create();
        $foreignStudent = $this->memberWithRole($foreignTenant, 'student');
        Sanctum::actingAs($foreignStudent->user);

        $this->getJson("/api/v1/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages", $this->tenantHeader($foreignTenant))
            ->assertNotFound();
    }

    public function test_teacher_can_read_pages_and_gets_the_teacher_payload(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $examQuestionId, $pageIds] = $this->readFixture();

        // Grade the answer so the teacher payload has data to reveal.
        ExamAttemptAnswer::query()
            ->where('exam_attempt_id', $attemptId)
            ->where('exam_question_id', $examQuestionId)
            ->where('tenant_id', $tenant->id)
            ->update([
                'grading_status' => 'graded',
                'manual_score' => 7,
                'feedback' => 'Good work.',
                'graded_by_tenant_user_id' => $admin->id,
                'graded_at' => now(),
            ]);

        Http::fake(['storage.example.test/*' => Http::response('PNG-BYTES', 200)]);

        Sanctum::actingAs($admin->user);

        $data = $this->getJson("/api/v1/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages", $this->tenantHeader($tenant))
            ->assertOk()
            ->json('data');

        $this->assertSame('graded', $data['gradingStatus']);
        $this->assertSame(7.0, (float) $data['manualScore']);
        $this->assertSame('Good work.', $data['feedback']);
        $this->assertSame('graded', $data['gradingStatus']);
        $this->assertSame((string) $admin->id, $data['gradedBy']['id']);
        $this->assertSame($admin->user->name, $data['gradedBy']['name']);
        $this->assertNotNull($data['gradedAt']);

        $this->assertCount(2, $data['pages']);

        $stream = $this->get("/api/v1/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages/{$pageIds[0]}", $this->tenantHeader($tenant))
            ->assertOk();

        $cacheControl = (string) $stream->headers->get('Cache-Control');
        $this->assertStringContainsString('no-store', $cacheControl);
    }

    public function test_instructor_without_exam_ownership_is_denied(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $examQuestionId, $pageIds] = $this->readFixture();

        // Instructor holds exams.update but did NOT create the exam and is not
        // a tenant operator -> ExamPolicy::update() is false -> viewPages is
        // false despite having an exam-management permission.
        $instructor = $this->memberWithRole($tenant, 'instructor');
        Sanctum::actingAs($instructor->user);

        $this->getJson("/api/v1/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages", $this->tenantHeader($tenant))
            ->assertNotFound();

        $this->get("/api/v1/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages/{$pageIds[0]}", $this->tenantHeader($tenant))
            ->assertNotFound();
    }

    public function test_teacher_from_another_tenant_is_denied_even_for_a_valid_looking_page(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $examQuestionId, $pageIds] = $this->readFixture();

        $foreignTenant = Tenant::factory()->create();
        $foreignAdmin = $this->memberWithRole($foreignTenant, 'admin');
        Sanctum::actingAs($foreignAdmin->user);

        $this->getJson("/api/v1/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages", $this->tenantHeader($foreignTenant))
            ->assertNotFound();

        $this->get("/api/v1/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages/{$pageIds[0]}", $this->tenantHeader($foreignTenant))
            ->assertNotFound();
    }

    public function test_page_belonging_to_another_question_of_the_same_attempt_is_denied(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');

        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Mixed');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $this->enrollStudent($tenant, $admin, $course, $student);

        $exam = $this->createPublishedExam($tenant, $admin);
        $firstQuestionId = $this->createQuestion($tenant, $admin, 'essay', ['prompt' => 'First prompt.']);
        $secondQuestionId = $this->createQuestion($tenant, $admin, 'essay', ['prompt' => 'Second prompt.']);
        $firstExamQuestionId = $this->attachQuestionToExam($tenant, $admin, $exam, $firstQuestionId);
        $secondExamQuestionId = $this->attachQuestionToExam($tenant, $admin, $exam, $secondQuestionId);
        $this->attachExamToLesson($tenant, $admin, $course, $section, $lesson, $exam);

        $this->createBunnyStorageIntegration($tenant);

        Sanctum::actingAs($student->user);
        $started = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        $attemptId = (int) $started['attempt']['id'];

        $firstPageIds = $this->seedPages($tenant, $admin, $attemptId, $firstExamQuestionId, $firstQuestionId);
        $secondPageIds = $this->seedPages($tenant, $admin, $attemptId, $secondExamQuestionId, $secondQuestionId);

        Http::fake();

        // A page of question B requested through question A's URL must 404 —
        // the page never resolves for that (attempt, question) pair.
        $this->getJson("/api/v1/exam-attempts/{$attemptId}/answers/{$firstExamQuestionId}/pages/{$secondPageIds[0]}", $this->tenantHeader($tenant))
            ->assertNotFound();

        // The same page through its real question's URL streams fine.
        $this->get("/api/v1/exam-attempts/{$attemptId}/answers/{$secondExamQuestionId}/pages/{$secondPageIds[0]}", $this->tenantHeader($tenant))
            ->assertOk();

        $this->assertNotSame($firstPageIds[0], $secondPageIds[0]);
    }

    public function test_unauthenticated_request_is_denied(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $examQuestionId] = $this->readFixture();

        // readFixture leaves the student authenticated on the guard; drop the
        // resolved guards so the next request resolves a fresh, token-less one.
        Auth::forgetGuards();

        $this->getJson("/api/v1/exam-attempts/{$attemptId}/answers/{$examQuestionId}/pages", $this->tenantHeader($tenant))
            ->assertUnauthorized();
    }

    /**
     * @return array{0: Tenant, 1: TenantUser, 2: TenantUser, 3: int, 4: int, 5: int, 6: int, 7?: list<int>}
     */
    private function readFixture(): array
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');

        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Pages');
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

        $pageIds = $this->seedPages($tenant, $admin, $attemptId, $examQuestionId, $questionId);

        $base = [$tenant, $admin, $student, $lesson, $exam, $attemptId, $examQuestionId];
        $base[] = $pageIds;

        return $base;
    }

    /**
     * Replicates exactly what ExamAnswerPageUploadService::confirm() writes
     * (private asset + image-mode answer + page rows) without driving Bunny.
     *
     * @return list<int>
     */
    private function seedPages(Tenant $tenant, TenantUser $admin, int $attemptId, int $examQuestionId, int $questionId): array
    {
        $answer = ExamAttemptAnswer::create([
            'tenant_id' => $tenant->id,
            'exam_attempt_id' => $attemptId,
            'exam_question_id' => $examQuestionId,
            'question_id' => $questionId,
            'answer' => null,
            'answer_mode' => 'image_pages',
            'grading_status' => 'pending_manual_review',
            'is_correct' => null,
            'earned_points' => 0,
            'answered_at' => now(),
        ]);

        $pageIds = [];

        foreach ([1, 2] as $pageOrder) {
            $asset = MediaAsset::create([
                'tenant_id' => $tenant->id,
                'provider' => 'bunny',
                'provider_service' => 'storage',
                'type' => 'image',
                'status' => 'ready',
                'visibility' => 'private',
                'storage_key' => "tenants/{$tenant->id}/exam_attempts/page-{$pageOrder}.png",
                'original_filename' => "page-{$pageOrder}.png",
                'mime_type' => 'image/png',
                'size_bytes' => 2048,
                'width' => 800,
                'height' => 600,
                'metadata' => [
                    'storage_root' => 'exam_attempts',
                    'purpose' => 'exam_answer_page',
                    'exam_attempt_id' => (string) $attemptId,
                    'exam_question_id' => (string) $examQuestionId,
                ],
                'created_by_tenant_user_id' => $admin->id,
            ]);

            $page = ExamAttemptAnswerPage::create([
                'tenant_id' => $tenant->id,
                'exam_attempt_answer_id' => $answer->id,
                'media_asset_id' => $asset->id,
                'page_order' => $pageOrder,
                'captured_at' => now(),
                'width' => 800,
                'height' => 600,
            ]);

            $pageIds[] = (int) $page->id;
        }

        return $pageIds;
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createPublishedExam(Tenant $tenant, TenantUser $manager, array $overrides = []): int
    {
        Sanctum::actingAs($manager->user);

        $exam = $this->postJson('/api/v1/exam-bank/exams', array_merge([
            'title' => 'Pages Exam',
            'description' => 'Image answer read-back exam.',
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
            'title' => "Pages {$type} question",
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
}
