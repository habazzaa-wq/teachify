<?php

namespace Tests\Feature;

use App\Models\AnalyticsJob;
use App\Models\Assignment;
use App\Models\AssignmentResult;
use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\CourseCompletion;
use App\Models\CourseEnrollment;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\MediaAsset;
use App\Models\Permission;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizResult;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Models\VideoPlaybackSession;
use App\Services\Analytics\AnalyticsAggregationService;
use App\Services\Analytics\AnalyticsSnapshotService;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AnalyticsReportingFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_aggregation_generates_course_learner_quiz_assignment_and_video_records(): void
    {
        [$tenant, $admin, $student, $secondStudent, $course, $quiz, $assignment, $asset] = $this->analyticsFixture();

        app(AnalyticsAggregationService::class)->aggregateTenant($tenant);

        $this->assertDatabaseHas('course_analytics', [
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'enrollments_count' => 2,
            'active_learners_count' => 1,
            'completed_learners_count' => 1,
        ]);

        $this->assertDatabaseHas('learner_analytics', [
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $student->id,
            'enrolled_courses_count' => 1,
        ]);

        $this->assertDatabaseHas('quiz_analytics', [
            'tenant_id' => $tenant->id,
            'quiz_id' => $quiz->id,
            'attempt_count' => 2,
            'unique_learners' => 2,
        ]);

        $this->assertDatabaseHas('assignment_analytics', [
            'tenant_id' => $tenant->id,
            'assignment_id' => $assignment->id,
            'submission_count' => 2,
            'graded_count' => 2,
        ]);

        $this->assertDatabaseHas('video_analytics', [
            'tenant_id' => $tenant->id,
            'media_asset_id' => $asset->id,
            'play_count' => 2,
            'unique_viewers' => 2,
            'watch_time_seconds' => 120,
        ]);
    }

    public function test_tenant_owner_and_admin_can_view_tenant_analytics(): void
    {
        [$tenant, $admin, $student, $secondStudent, $course] = $this->analyticsFixture();
        $owner = $this->memberWithRole($tenant, 'tenant_owner');
        app(AnalyticsAggregationService::class)->aggregateTenant($tenant);

        Sanctum::actingAs($owner->user);
        $this->getJson('/api/v1/analytics/overview', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('overview.courses_count', 1)
            ->assertJsonPath('overview.enrollments_count', 2);

        Sanctum::actingAs($admin->user);
        $this->getJson('/api/v1/analytics/courses', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('courses.0.course_id', $course->id);

        $this->getJson('/api/v1/analytics/learners', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonFragment(['tenant_user_id' => $student->id])
            ->assertJsonFragment(['tenant_user_id' => $secondStudent->id]);
    }

    public function test_instructor_can_view_only_assigned_course_analytics(): void
    {
        [$tenant, $admin, $student, $secondStudent, $course] = $this->analyticsFixture();
        $instructor = $this->memberWithRole($tenant, 'instructor');
        $otherCourse = $this->createCourse($tenant, $admin, 'Other Analytics Course');
        $this->bindTenant($tenant);
        $course->forceFill(['primary_instructor_tenant_user_id' => $instructor->id])->save();
        app(AnalyticsAggregationService::class)->aggregateTenant($tenant);

        Sanctum::actingAs($instructor->user);

        $this->getJson('/api/v1/analytics/courses', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(1, 'courses')
            ->assertJsonPath('courses.0.course_id', $course->id);

        $this->getJson("/api/v1/courses/{$course->id}/analytics", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('analytics.course_id', $course->id);

        $this->getJson("/api/v1/courses/{$otherCourse->id}/analytics", $this->tenantHeader($tenant))
            ->assertForbidden();

        $this->getJson('/api/v1/analytics/overview', $this->tenantHeader($tenant))
            ->assertForbidden();
    }

    public function test_student_can_view_only_personal_learner_analytics(): void
    {
        [$tenant, $admin, $student, $secondStudent] = $this->analyticsFixture();
        app(AnalyticsAggregationService::class)->aggregateTenant($tenant);

        Sanctum::actingAs($student->user);

        $this->getJson('/api/v1/analytics/learners', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(1, 'learners')
            ->assertJsonPath('learners.0.tenant_user_id', $student->id);

        $this->getJson("/api/v1/learners/{$student->id}/analytics", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('analytics.tenant_user_id', $student->id);

        $this->getJson("/api/v1/learners/{$secondStudent->id}/analytics", $this->tenantHeader($tenant))
            ->assertForbidden();

        $this->getJson('/api/v1/analytics/overview', $this->tenantHeader($tenant))
            ->assertForbidden();
    }

    public function test_cross_tenant_analytics_access_returns_not_found(): void
    {
        [$firstTenant, $admin, $student, $secondStudent, $course] = $this->analyticsFixture();
        $secondTenant = Tenant::factory()->create();
        $secondAdmin = $this->memberWithRole($secondTenant, 'admin');
        app(AnalyticsAggregationService::class)->aggregateTenant($firstTenant);

        Sanctum::actingAs($secondAdmin->user);

        $this->getJson("/api/v1/courses/{$course->id}/analytics", $this->tenantHeader($secondTenant))
            ->assertNotFound();

        $this->getJson("/api/v1/learners/{$student->id}/analytics", $this->tenantHeader($secondTenant))
            ->assertNotFound();
    }

    public function test_snapshots_are_immutable_and_jobs_are_tenant_scoped(): void
    {
        [$tenant] = $this->analyticsFixture();
        app(AnalyticsAggregationService::class)->aggregateTenant($tenant);
        $snapshots = app(AnalyticsSnapshotService::class);
        $this->bindTenant($tenant);

        $snapshots->daily($tenant);
        $snapshots->daily($tenant);

        AnalyticsJob::create([
            'tenant_id' => $tenant->id,
            'job_type' => 'course_aggregation',
            'status' => 'finished',
            'started_at' => now()->subMinute(),
            'finished_at' => now(),
            'metadata' => ['source' => 'test'],
        ]);

        $this->assertDatabaseCount('analytics_snapshots', 2);
        $this->assertDatabaseHas('analytics_jobs', [
            'tenant_id' => $tenant->id,
            'job_type' => 'course_aggregation',
            'status' => 'finished',
        ]);
    }

    /**
     * @return array{Tenant, TenantUser, TenantUser, TenantUser, Course, Quiz, Assignment, MediaAsset}
     */
    private function analyticsFixture(): array
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $secondStudent = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);

        $course = $this->createCourse($tenant, $admin, 'Analytics Course');
        $section = CourseSection::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'title' => 'Analytics Section',
            'status' => 'published',
            'is_published' => true,
        ]);
        $lesson = CourseLesson::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'title' => 'Analytics Lesson',
            'slug' => 'analytics-lesson-'.uniqid(),
            'type' => 'video',
            'status' => 'published',
            'visibility' => 'enrolled_only',
            'sort_order' => 1,
        ]);

        $firstEnrollment = $this->enroll($tenant, $course, $student, 'active');
        $secondEnrollment = $this->enroll($tenant, $course, $secondStudent, 'completed');

        CourseCompletion::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'course_enrollment_id' => $firstEnrollment->id,
            'completion_percent' => 50,
            'completed_at' => null,
            'metadata' => [],
        ]);
        CourseCompletion::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'course_enrollment_id' => $secondEnrollment->id,
            'completion_percent' => 100,
            'completed_at' => now(),
            'metadata' => [],
        ]);

        $quiz = Quiz::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'course_lesson_id' => $lesson->id,
            'title' => 'Analytics Quiz',
            'passing_score' => 70,
            'max_attempts' => 3,
            'status' => 'published',
        ]);
        QuizAttempt::create([
            'tenant_id' => $tenant->id,
            'quiz_id' => $quiz->id,
            'tenant_user_id' => $student->id,
            'started_at' => now(),
            'submitted_at' => now(),
            'status' => 'submitted',
            'score' => 80,
        ]);
        QuizAttempt::create([
            'tenant_id' => $tenant->id,
            'quiz_id' => $quiz->id,
            'tenant_user_id' => $secondStudent->id,
            'started_at' => now(),
            'submitted_at' => now(),
            'status' => 'submitted',
            'score' => 60,
        ]);
        QuizResult::create([
            'tenant_id' => $tenant->id,
            'quiz_id' => $quiz->id,
            'tenant_user_id' => $student->id,
            'best_score' => 80,
            'passed' => true,
            'completed_at' => now(),
        ]);
        QuizResult::create([
            'tenant_id' => $tenant->id,
            'quiz_id' => $quiz->id,
            'tenant_user_id' => $secondStudent->id,
            'best_score' => 60,
            'passed' => false,
            'completed_at' => now(),
        ]);

        $assignment = Assignment::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'course_lesson_id' => $lesson->id,
            'title' => 'Analytics Assignment',
            'max_score' => 100,
            'status' => 'published',
        ]);
        foreach ([[$student, 90], [$secondStudent, 70]] as [$learner, $score]) {
            AssignmentSubmission::create([
                'tenant_id' => $tenant->id,
                'assignment_id' => $assignment->id,
                'tenant_user_id' => $learner->id,
                'submitted_at' => now(),
                'status' => 'submitted',
            ]);
            AssignmentResult::create([
                'tenant_id' => $tenant->id,
                'assignment_id' => $assignment->id,
                'tenant_user_id' => $learner->id,
                'score' => $score,
                'passed' => true,
                'graded_by_tenant_user_id' => $admin->id,
                'graded_at' => now(),
            ]);
        }

        $asset = MediaAsset::create([
            'tenant_id' => $tenant->id,
            'provider' => 'bunny',
            'provider_service' => 'stream',
            'type' => 'video',
            'status' => 'ready',
            'visibility' => 'private',
            'external_id' => 'analytics-video',
            'metadata' => [],
        ]);
        foreach ([[$student, 30], [$secondStudent, 90]] as [$viewer, $position]) {
            VideoPlaybackSession::create([
                'tenant_id' => $tenant->id,
                'media_asset_id' => $asset->id,
                'tenant_user_id' => $viewer->id,
                'course_id' => $course->id,
                'course_section_id' => $section->id,
                'course_lesson_id' => $lesson->id,
                'session_token' => uniqid('session-', true),
                'started_at' => now(),
                'expires_at' => now()->addHour(),
                'last_position_seconds' => $position,
                'status' => 'closed',
            ]);
        }

        return [$tenant, $admin, $student, $secondStudent, $course->refresh(), $quiz->refresh(), $assignment->refresh(), $asset->refresh()];
    }

    private function createCourse(Tenant $tenant, TenantUser $admin, string $title): Course
    {
        $this->bindTenant($tenant);

        return Course::create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $admin->id,
            'title' => $title,
            'slug' => str($title)->slug().'-'.uniqid(),
            'status' => 'published',
            'visibility' => 'enrolled_only',
            'pricing_type' => 'free',
        ])->refresh();
    }

    private function enroll(Tenant $tenant, Course $course, TenantUser $student, string $status): CourseEnrollment
    {
        return CourseEnrollment::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'tenant_user_id' => $student->id,
            'status' => $status,
            'enrolled_at' => now(),
            'started_at' => now(),
            'completed_at' => $status === 'completed' ? now() : null,
            'metadata' => [],
        ])->refresh();
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

        if (! Permission::query()->where('slug', 'courses.view')->exists()) {
            $this->fail('Course permissions were not seeded.');
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
}
