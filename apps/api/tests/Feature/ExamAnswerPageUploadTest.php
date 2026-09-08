<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\ExamAttemptAnswer;
use App\Models\ExamAttemptAnswerPage;
use App\Models\ExamQuestion;
use App\Models\MediaAsset;
use App\Models\MediaUploadSession;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantIntegration;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Bunny\Contracts\BunnyStorageInterface;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\Support\FakeBunnyStorage;
use Tests\TestCase;

/**
 * Phase B2 — Student image page uploads (intent -> confirm) over the real
 * routes. The only seam is Bunny Storage: the intent/confirm flow resolves the
 * tenant's integration row, but the confirm's object-existence metadata lookup
 * is routed through a fake BunnyStorageInterface while the client's direct PUT
 * never happens in a server-side test.
 *
 * The confirm route segment is the MediaUploadSession id returned by the
 * intent (…/pages/{session}/confirm) — this test pins that contract so a bad
 * route binding cannot silently regress the upload flow.
 */
class ExamAnswerPageUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_intent_and_confirm_a_page(): void
    {
        [$tenant, $admin, $student, $lesson, $attemptId, $examQuestionId] = $this->uploadFixture();

        $fake = new FakeBunnyStorage;
        $this->app->instance(BunnyStorageInterface::class, $fake);

        Sanctum::actingAs($student->user);

        $intentResponse = $this->postJson(
            "/api/v1/exam-sessions/{$attemptId}/answers/{$examQuestionId}/upload-intent",
            [
                'original_filename' => 'page-1.jpg',
                'mime_type' => 'image/jpeg',
                'size_bytes' => 2048,
            ],
            $this->tenantHeader($tenant),
        );

        if ($intentResponse->status() !== 201) {
            file_put_contents(sys_get_temp_dir().'/intent-body.json', (string) $intentResponse->getContent());
            throw new \Exception('INTENT_NOT_201 status='.$intentResponse->status().' attempt='.$attemptId.' question='.$examQuestionId.' lesson='.$lesson);
        }

        $intent = $intentResponse->json('data');

        $this->assertNotEmpty($intent['session_id']);
        $this->assertSame('PUT', $intent['upload_method']);
        $this->assertStringContainsString('upload_base_url' !== '' ? 'storage.example.test' : 'storage.example.test', $intent['upload_url']);
        $this->assertArrayHasKey('AccessKey', $intent['headers']);

        // Phase F: confirm now dispatches GenerateAnswerPageVariantsJob, which
        // on the sync test queue reads the original and PUTs the variants to
        // the tenant's Bunny Storage over Http. Fake that so the job never
        // leaves the process.
        Http::fake([
            'storage.example.test/*' => Http::response($this->makeJpeg(1200, 900), 200, [
                'Content-Type' => 'image/jpeg',
            ]),
        ]);

        $confirm = $this->postJson(
            "/api/v1/exam-sessions/{$attemptId}/answers/{$examQuestionId}/pages/{$intent['session_id']}/confirm",
            [
                'captured_at' => '2026-09-08T12:00:00+00:00',
                'width' => 800,
                'height' => 600,
                'size_bytes' => 2048,
                'mime_type' => 'image/jpeg',
                'original_filename' => 'page-1.jpg',
            ],
            $this->tenantHeader($tenant),
        )
            ->assertCreated()
            ->json('data');

        $this->assertNotEmpty($confirm['page_id']);
        $this->assertSame(1, $confirm['page_order']);
        $this->assertSame($attemptId, MediaUploadSession::query()->findOrFail($intent['session_id'])->exam_attempt_id);
        $this->assertSame('pending_manual_review', $confirm['grading_status']);

        $answer = ExamAttemptAnswer::query()
            ->where('tenant_id', $tenant->id)
            ->where('exam_attempt_id', $attemptId)
            ->where('exam_question_id', $examQuestionId)
            ->firstOrFail();

        $this->assertSame('image_pages', $answer->answer_mode);
        $this->assertSame('pending_manual_review', $answer->grading_status);

        $page = ExamAttemptAnswerPage::query()->where('exam_attempt_answer_id', $answer->id)->sole();
        $this->assertSame(1, (int) $page->page_order);
        $this->assertSame(800, (int) $page->width);

        $this->assertNotNull($page->media_asset_id);
        $asset = MediaAsset::query()->findOrFail($page->media_asset_id);
        $this->assertSame('ready', $asset->status);
        $this->assertSame('private', $asset->visibility);
        $this->assertSame('image/jpeg', $asset->mime_type);

        $session = MediaUploadSession::query()->findOrFail($intent['session_id']);
        $this->assertSame('completed', $session->status);
        $this->assertSame($asset->id, $session->media_asset_id);

        // The storage verification ran against the session's real storage key.
        $this->assertNotEmpty($fake->metadataCalls);
        $this->assertStringContainsString('exam_attempts', $fake->metadataCalls[0]);
    }

    public function test_confirm_with_an_unknown_session_returns_404(): void
    {
        [$tenant, $admin, $student, $lesson, $attemptId, $examQuestionId] = $this->uploadFixture();

        $this->app->instance(BunnyStorageInterface::class, new FakeBunnyStorage);

        Sanctum::actingAs($student->user);

        $this->postJson(
            "/api/v1/exam-sessions/{$attemptId}/answers/{$examQuestionId}/pages/999999/confirm",
            ['mime_type' => 'image/jpeg'],
            $this->tenantHeader($tenant),
        )->assertNotFound();
    }

    public function test_confirm_is_denied_for_another_student(): void
    {
        [$tenant, $admin, $student, $lesson, $attemptId, $examQuestionId] = $this->uploadFixture();

        $this->app->instance(BunnyStorageInterface::class, new FakeBunnyStorage);

        Sanctum::actingAs($student->user);

        $intent = $this->postJson(
            "/api/v1/exam-sessions/{$attemptId}/answers/{$examQuestionId}/upload-intent",
            ['original_filename' => 'page-1.jpg', 'mime_type' => 'image/jpeg', 'size_bytes' => 2048],
            $this->tenantHeader($tenant),
        )
            ->assertCreated()
            ->json('data');

        $otherStudent = $this->memberWithRole($tenant, 'student');
        Sanctum::actingAs($otherStudent->user);

        $this->postJson(
            "/api/v1/exam-sessions/{$attemptId}/answers/{$examQuestionId}/pages/{$intent['session_id']}/confirm",
            ['mime_type' => 'image/jpeg'],
            $this->tenantHeader($tenant),
        )->assertNotFound();
    }

    /**
     * @return array{0: Tenant, 1: TenantUser, 2: TenantUser, 3: int, 4: int, 5: int}
     */
    private function uploadFixture(): array
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');

        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Upload');
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
     * @param  array<string, mixed>  $overrides
     */
    private function createPublishedExam(Tenant $tenant, TenantUser $manager, array $overrides = []): int
    {
        Sanctum::actingAs($manager->user);

        $exam = $this->postJson('/api/v1/exam-bank/exams', array_merge([
            'title' => 'Upload Exam',
            'description' => 'Image answer upload exam.',
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
            'title' => "Upload {$type} question",
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
