<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ExamEntryFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_enrolled_student_can_view_available_exam_entry(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Entry Available');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $this->enrollStudent($tenant, $admin, $course, $student);
        $exam = $this->createPublishedExam($tenant, $admin, [
            'title' => 'Foundation Exam',
            'description' => 'Exam description.',
            'duration' => 60,
            'passing_score' => 60,
            'attempt_limit' => 2,
            'question_count' => 20,
        ]);
        $this->attachExamToLesson($tenant, $admin, $course, $section, $lesson, $exam);

        Sanctum::actingAs($student->user);
        $response = $this->getJson("/api/v1/lessons/{$lesson}/exam-entry", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.examExists', true)
            ->assertJsonPath('data.examTitle', 'Foundation Exam')
            ->assertJsonPath('data.description', 'Exam description.')
            ->assertJsonPath('data.duration', 60)
            ->assertJsonPath('data.passingPercentage', 60)
            ->assertJsonPath('data.questionCount', 20)
            ->assertJsonPath('data.maxAttempts', 2)
            ->assertJsonPath('data.previousAttempts', 0)
            ->assertJsonPath('data.remainingAttempts', 2)
            ->assertJsonPath('data.bestScore', null)
            ->assertJsonPath('data.eligibility', 'available')
            ->assertJsonPath('data.lockedReason', null)
            ->assertJsonPath('data.canStart', true);

        $this->assertSame((string) $exam, $response->json('data.examId'));
    }

    public function test_exam_entry_tracks_attempts_remaining_and_best_score(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Entry Attempts');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $this->enrollStudent($tenant, $admin, $course, $student);
        $exam = $this->createPublishedExam($tenant, $admin, [
            'title' => 'Attempts Exam',
            'duration' => 45,
            'passing_score' => 60,
            'attempt_limit' => 3,
            'question_count' => 10,
        ]);
        $this->attachExamToLesson($tenant, $admin, $course, $section, $lesson, $exam);

        ExamAttempt::create([
            'tenant_id' => $tenant->id,
            'exam_id' => $exam,
            'user_id' => $student->user->id,
            'score' => 40,
            'max_score' => 100,
            'passed' => false,
            'status' => 'submitted',
            'started_at' => now(),
            'submitted_at' => now(),
        ]);
        ExamAttempt::create([
            'tenant_id' => $tenant->id,
            'exam_id' => $exam,
            'user_id' => $student->user->id,
            'score' => 75,
            'max_score' => 100,
            'passed' => true,
            'status' => 'submitted',
            'started_at' => now(),
            'submitted_at' => now(),
        ]);

        Sanctum::actingAs($student->user);
        $this->getJson("/api/v1/lessons/{$lesson}/exam-entry", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.previousAttempts', 2)
            ->assertJsonPath('data.remainingAttempts', 1)
            ->assertJsonPath('data.bestScore', 75)
            ->assertJsonPath('data.eligibility', 'completed')
            ->assertJsonPath('data.canStart', false);
    }

    public function test_exam_entry_is_locked_when_attempts_are_exhausted(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Entry Exhausted');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $this->enrollStudent($tenant, $admin, $course, $student);
        $exam = $this->createPublishedExam($tenant, $admin, [
            'title' => 'Exhausted Exam',
            'duration' => 30,
            'passing_score' => 60,
            'attempt_limit' => 1,
            'question_count' => 5,
        ]);
        $this->attachExamToLesson($tenant, $admin, $course, $section, $lesson, $exam);

        ExamAttempt::create([
            'tenant_id' => $tenant->id,
            'exam_id' => $exam,
            'user_id' => $student->user->id,
            'score' => 30,
            'max_score' => 100,
            'passed' => false,
            'status' => 'submitted',
            'started_at' => now(),
            'submitted_at' => now(),
        ]);

        Sanctum::actingAs($student->user);
        $this->getJson("/api/v1/lessons/{$lesson}/exam-entry", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.remainingAttempts', 0)
            ->assertJsonPath('data.eligibility', 'locked')
            ->assertJsonPath('data.lockedReason', 'max_attempts_reached')
            ->assertJsonPath('data.canStart', false);
    }

    public function test_draft_exam_is_unavailable(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Entry Draft');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $this->enrollStudent($tenant, $admin, $course, $student);
        $exam = $this->createExam($tenant, $admin, [
            'title' => 'Draft Exam',
            'duration' => 30,
            'passing_score' => 60,
            'attempt_limit' => 1,
            'question_count' => 5,
        ]);
        $this->attachExamToLesson($tenant, $admin, $course, $section, $lesson, $exam);

        Sanctum::actingAs($student->user);
        $this->getJson("/api/v1/lessons/{$lesson}/exam-entry", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.eligibility', 'unavailable')
            ->assertJsonPath('data.lockedReason', 'exam_not_published')
            ->assertJsonPath('data.canStart', false);
    }

    public function test_exam_entry_is_locked_when_lesson_is_not_accessible(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Entry Locked');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $exam = $this->createPublishedExam($tenant, $admin, [
            'title' => 'Locked Exam',
            'duration' => 30,
            'passing_score' => 60,
            'attempt_limit' => 1,
            'question_count' => 5,
        ]);
        $this->attachExamToLesson($tenant, $admin, $course, $section, $lesson, $exam);

        Sanctum::actingAs($student->user);
        $this->getJson("/api/v1/lessons/{$lesson}/exam-entry", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.eligibility', 'locked')
            ->assertJsonPath('data.lockedReason', 'lesson_locked')
            ->assertJsonPath('data.canStart', false);
    }

    public function test_exam_entry_for_lesson_without_exam_returns_exam_exists_false(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Entry None');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $this->enrollStudent($tenant, $admin, $course, $student);

        Sanctum::actingAs($student->user);
        $this->getJson("/api/v1/lessons/{$lesson}/exam-entry", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.examExists', false)
            ->assertJsonPath('data.examId', null)
            ->assertJsonPath('data.eligibility', 'unavailable')
            ->assertJsonPath('data.canStart', false);
    }

    public function test_exam_entry_is_tenant_isolated(): void
    {
        $firstTenant = Tenant::factory()->create();
        $secondTenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($firstTenant, 'admin');
        [$course, $section, $lesson] = $this->publishedLessonStack($firstTenant, $admin, 'Entry Isolation');
        $exam = $this->createPublishedExam($firstTenant, $admin, [
            'title' => 'Isolated Exam',
            'duration' => 30,
            'passing_score' => 60,
            'attempt_limit' => 1,
            'question_count' => 5,
        ]);
        $this->attachExamToLesson($firstTenant, $admin, $course, $section, $lesson, $exam);

        $secondAdmin = $this->memberWithRole($secondTenant, 'admin');
        Sanctum::actingAs($secondAdmin->user);
        $this->getJson("/api/v1/lessons/{$lesson}/exam-entry", $this->tenantHeader($secondTenant))
            ->assertNotFound();
    }

    /**
     * @return array{0:int,1:int,2:int}
     */
    private function publishedLessonStack(
        Tenant $tenant,
        TenantUser $manager,
        string $title,
        ?TenantUser $primaryInstructor = null,
    ): array {
        Sanctum::actingAs($manager->user);

        $payload = [
            'title' => "{$title} Course",
            'slug' => str("{$title} Course")->slug()->toString(),
        ];

        if ($primaryInstructor) {
            $payload['primary_instructor_tenant_user_id'] = $primaryInstructor->id;
        }

        $course = $this->postJson('/api/v1/courses', $payload, $this->tenantHeader($tenant))
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

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createExam(Tenant $tenant, TenantUser $manager, array $overrides = []): int
    {
        Sanctum::actingAs($manager->user);

        return $this->postJson('/api/v1/exam-bank/exams', array_merge([
            'title' => 'Lesson Exam',
            'description' => 'Exam description.',
            'duration' => 60,
            'passing_score' => 60,
            'attempt_limit' => 1,
            'question_count' => 10,
        ], $overrides), $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.id');
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createPublishedExam(Tenant $tenant, TenantUser $manager, array $overrides = []): int
    {
        $exam = $this->createExam($tenant, $manager, $overrides);

        Sanctum::actingAs($manager->user);
        $this->patchJson("/api/v1/exam-bank/exams/{$exam}/publish", [], $this->tenantHeader($tenant))->assertOk();

        Exam::withoutGlobalScopes()->whereKey($exam)->update(['question_count' => $overrides['question_count'] ?? 10]);

        return $exam;
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
