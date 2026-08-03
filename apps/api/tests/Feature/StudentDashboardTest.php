<?php

namespace Tests\Feature;

use App\Models\CertificateTemplate;
use App\Models\Course;
use App\Models\CourseCompletion;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\IssuedCertificate;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StudentDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_dashboard_returns_aggregated_learning_data(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');

        [$courseId, $sectionId, $lessonId] = $this->publishedLessonStack($tenant, $admin, 'Completed Dashboard Course');
        $enrollmentId = $this->enrollStudent($tenant, $admin, $courseId, $student);

        [$secondCourseId] = $this->publishedLessonStack($tenant, $admin, 'In Progress Dashboard Course');
        $this->enrollStudent($tenant, $admin, $secondCourseId, $student);

        $exam = $this->createPublishedExam($tenant, $admin, [
            'title' => 'Dashboard Exam',
            'duration' => 45,
            'passing_score' => 60,
            'attempt_limit' => 3,
            'question_count' => 10,
        ]);
        $this->attachExamToLesson($tenant, $admin, $courseId, $sectionId, $lessonId, $exam);

        ExamAttempt::create([
            'tenant_id' => $tenant->id,
            'exam_id' => $exam,
            'user_id' => $student->user->id,
            'score' => 80,
            'max_score' => 100,
            'percentage' => 80,
            'passed' => true,
            'is_official' => true,
            'is_practice' => false,
            'status' => 'submitted',
            'started_at' => now()->subDay(),
            'submitted_at' => now()->subDay(),
        ]);

        ExamAttempt::create([
            'tenant_id' => $tenant->id,
            'exam_id' => $exam,
            'user_id' => $student->user->id,
            'score' => 0,
            'max_score' => 100,
            'percentage' => 0,
            'passed' => false,
            'is_official' => true,
            'is_practice' => false,
            'status' => 'in_progress',
            'started_at' => now(),
            'timer_ends_at' => now()->addHours(2),
        ]);

        $completion = CourseCompletion::create([
            'tenant_id' => $tenant->id,
            'course_id' => $courseId,
            'course_enrollment_id' => $enrollmentId,
            'completion_percent' => 100,
            'completed_at' => now(),
        ]);

        $template = CertificateTemplate::create([
            'tenant_id' => $tenant->id,
            'name' => 'Course Certificate',
            'slug' => 'course-certificate',
            'status' => 'active',
            'template_data' => [],
        ]);

        IssuedCertificate::create([
            'tenant_id' => $tenant->id,
            'course_id' => $courseId,
            'course_completion_id' => $completion->id,
            'tenant_user_id' => $student->id,
            'certificate_template_id' => $template->id,
            'certificate_number' => 'CERT-'.Str::upper(Str::random(10)),
            'issued_at' => now(),
            'status' => 'issued',
            'metadata' => [],
        ]);

        Course::withoutGlobalScopes()->whereKey($courseId)->update(['end_date' => now()->addDays(5)]);

        Sanctum::actingAs($student->user);
        $response = $this->getJson('/api/v1/student/dashboard', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.student.name', $student->user->name)
            ->assertJsonPath('data.student.email', $student->user->email);

        $this->assertSame(2, $response->json('data.stats.enrolledCoursesCount'));
        $this->assertSame(1, $response->json('data.stats.completedCoursesCount'));
        $this->assertSame(50, $response->json('data.stats.averageProgressPercent'));
        $this->assertSame(80, $response->json('data.stats.averageExamScorePercent'));
        $this->assertSame(1, $response->json('data.stats.certificatesCount'));
        $this->assertSame(1, $response->json('data.stats.attemptsCount'));
        $this->assertSame(1, $response->json('data.stats.passedAttemptsCount'));
        $this->assertGreaterThanOrEqual(2, $response->json('data.stats.activeDaysCount'));
        $this->assertGreaterThanOrEqual(1, $response->json('data.stats.currentStreakDays'));

        $continueLearning = $response->json('data.continueLearning');
        $this->assertCount(1, $continueLearning);
        $this->assertSame('In Progress Dashboard Course Course', $continueLearning[0]['courseTitle']);
        $this->assertSame(0, $continueLearning[0]['progressPercent']);

        $this->assertCount(1, $response->json('data.recentAttempts'));
        $this->assertSame('Dashboard Exam', $response->json('data.recentAttempts.0.examTitle'));
        $this->assertSame('Completed Dashboard Course Course', $response->json('data.recentAttempts.0.courseTitle'));
        $this->assertSame(80, $response->json('data.recentAttempts.0.percentage'));

        $taskTypes = collect($response->json('data.upcomingTasks'))->pluck('type');
        $this->assertTrue($taskTypes->contains('exam'));
        $this->assertTrue($taskTypes->contains('course'));

        $timelineTypes = collect($response->json('data.timeline'))->pluck('type');
        $this->assertTrue($timelineTypes->contains('course_enrolled'));
        $this->assertTrue($timelineTypes->contains('exam_passed'));
        $this->assertTrue($timelineTypes->contains('course_completed'));
        $this->assertTrue($timelineTypes->contains('certificate_issued'));

        $achievementTypes = collect($response->json('data.achievements'))->pluck('type');
        $this->assertTrue($achievementTypes->contains('exam_passed'));
        $this->assertTrue($achievementTypes->contains('course_completed'));
        $this->assertTrue($achievementTypes->contains('certificate'));

        $calendarItems = collect($response->json('data.calendar'))
            ->flatMap(fn (array $day): array => $day['items'])
            ->pluck('type');
        $this->assertTrue($calendarItems->contains('exam_due'));
        $this->assertTrue($calendarItems->contains('course_ends'));
    }

    public function test_active_member_can_access_their_own_dashboard(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');

        Sanctum::actingAs($admin->user);
        $this->getJson('/api/v1/student/dashboard', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.student.name', $admin->user->name)
            ->assertJsonPath('data.stats.enrolledCoursesCount', 0);
    }

    public function test_dashboard_returns_empty_state_for_student_without_activity(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');

        Sanctum::actingAs($student->user);
        $response = $this->getJson('/api/v1/student/dashboard', $this->tenantHeader($tenant))
            ->assertOk();

        $this->assertSame(0, $response->json('data.stats.enrolledCoursesCount'));
        $this->assertSame([], $response->json('data.continueLearning'));
        $this->assertSame([], $response->json('data.recentAttempts'));
        $this->assertSame([], $response->json('data.upcomingTasks'));
        $this->assertSame([], $response->json('data.timeline'));
        $this->assertSame([], $response->json('data.achievements'));
        $this->assertSame([], $response->json('data.calendar'));
    }

    public function test_dashboard_is_tenant_isolated(): void
    {
        $firstTenant = Tenant::factory()->create();
        $secondTenant = Tenant::factory()->create();
        $student = $this->memberWithRole($firstTenant, 'student');

        Sanctum::actingAs($student->user);
        $this->getJson('/api/v1/student/dashboard', $this->tenantHeader($secondTenant))
            ->assertForbidden();
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
            'lesson_type' => 'video',
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
    private function createPublishedExam(Tenant $tenant, TenantUser $manager, array $overrides = []): int
    {
        Sanctum::actingAs($manager->user);

        $exam = $this->postJson('/api/v1/exam-bank/exams', array_merge([
            'title' => 'Lesson Exam',
            'description' => 'Exam description.',
            'duration' => 60,
            'passing_score' => 60,
            'attempt_limit' => 1,
            'question_count' => 10,
        ], $overrides), $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.id');

        Sanctum::actingAs($manager->user);
        $this->patchJson("/api/v1/exam-bank/exams/{$exam}/publish", [], $this->tenantHeader($tenant))->assertOk();

        Exam::withoutGlobalScopes()->whereKey($exam)->update(['question_count' => $overrides['question_count'] ?? 10]);

        return $exam;
    }

    private function attachExamToLesson(Tenant $tenant, TenantUser $manager, int $course, int $section, int $lesson, int $exam): void
    {
        Sanctum::actingAs($manager->user);

        $this->putJson("/api/v1/courses/{$course}/sections/{$section}/lessons/{$lesson}", [
            'exam_id' => $exam,
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
