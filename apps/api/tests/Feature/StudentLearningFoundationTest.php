<?php

namespace Tests\Feature;

use App\Models\CourseEnrollment;
use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StudentLearningFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_enroll_student_and_duplicate_active_enrollment_is_prevented(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $courseId = $this->createCourse($tenant, $admin, 'Enrollment Course');

        Sanctum::actingAs($admin->user);

        $enrollmentId = $this->postJson("/api/v1/courses/{$courseId}/enrollments", [
            'tenant_user_id' => $student->id,
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('enrollment.status', 'active')
            ->assertJsonPath('enrollment.tenant_user_id', $student->id)
            ->json('enrollment.id');

        $this->postJson("/api/v1/courses/{$courseId}/enrollments", [
            'tenant_user_id' => $student->id,
        ], $this->tenantHeader($tenant))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['tenant_user_id']);

        $this->assertDatabaseHas('course_enrollments', [
            'id' => $enrollmentId,
            'tenant_id' => $tenant->id,
            'course_id' => $courseId,
            'tenant_user_id' => $student->id,
            'status' => 'active',
        ]);
    }

    public function test_enrollment_status_transitions_are_controlled(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $courseId = $this->createCourse($tenant, $admin, 'Status Course');
        $enrollmentId = $this->enrollStudent($tenant, $admin, $courseId, $student);

        Sanctum::actingAs($admin->user);

        $this->patchJson("/api/v1/enrollments/{$enrollmentId}/status", [
            'status' => 'suspended',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('enrollment.status', 'suspended');

        $this->patchJson("/api/v1/enrollments/{$enrollmentId}/status", [
            'status' => 'active',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('enrollment.status', 'active');

        $this->patchJson("/api/v1/enrollments/{$enrollmentId}/status", [
            'status' => 'completed',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('enrollment.status', 'completed');

        $this->patchJson("/api/v1/enrollments/{$enrollmentId}/status", [
            'status' => 'active',
        ], $this->tenantHeader($tenant))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);
    }

    public function test_student_can_create_update_and_complete_own_lesson_progress(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $courseId = $this->createCourse($tenant, $admin, 'Progress Course');
        $sectionId = $this->createSection($tenant, $admin, $courseId, 'Progress Section');
        $firstLessonId = $this->createLesson($tenant, $admin, $courseId, $sectionId, 'First Progress Lesson');
        $secondLessonId = $this->createLesson($tenant, $admin, $courseId, $sectionId, 'Second Progress Lesson');
        $enrollmentId = $this->enrollStudent($tenant, $admin, $courseId, $student);

        Sanctum::actingAs($student->user);

        $this->postJson("/api/v1/lessons/{$firstLessonId}/progress/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('progress.status', 'in_progress');

        $this->postJson("/api/v1/lessons/{$firstLessonId}/progress/update", [
            'progress_percent' => 40,
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('progress.progress_percent', 40)
            ->assertJsonPath('progress.status', 'in_progress');

        $this->postJson("/api/v1/lessons/{$firstLessonId}/progress/complete", [], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('progress.progress_percent', 100)
            ->assertJsonPath('progress.status', 'completed');

        $this->getJson("/api/v1/enrollments/{$enrollmentId}/completion", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('completion.completion_percent', 50);

        $this->postJson("/api/v1/lessons/{$secondLessonId}/progress/complete", [], $this->tenantHeader($tenant))
            ->assertOk();

        $this->getJson("/api/v1/enrollments/{$enrollmentId}/completion", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('completion.completion_percent', 100);

        $this->assertDatabaseHas('course_enrollments', [
            'id' => $enrollmentId,
            'status' => 'completed',
        ]);
    }

    public function test_instructor_can_view_assigned_course_enrollments_and_student_progress(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $instructor = $this->memberWithRole($tenant, 'instructor');
        $student = $this->memberWithRole($tenant, 'student');
        $courseId = $this->createCourse($tenant, $admin, 'Instructor Visibility Course', $instructor);
        $sectionId = $this->createSection($tenant, $admin, $courseId, 'Instructor Section');
        $lessonId = $this->createLesson($tenant, $admin, $courseId, $sectionId, 'Instructor Lesson');
        $enrollmentId = $this->enrollStudent($tenant, $admin, $courseId, $student);

        Sanctum::actingAs($student->user);
        $this->postJson("/api/v1/lessons/{$lessonId}/progress/complete", [], $this->tenantHeader($tenant))->assertOk();

        Sanctum::actingAs($instructor->user);

        $this->getJson('/api/v1/enrollments', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonFragment(['id' => $enrollmentId]);

        $this->getJson("/api/v1/enrollments/{$enrollmentId}/progress", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('progress.0.status', 'completed');
    }

    public function test_students_are_isolated_from_other_students_progress(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $firstStudent = $this->memberWithRole($tenant, 'student');
        $secondStudent = $this->memberWithRole($tenant, 'student');
        $courseId = $this->createCourse($tenant, $admin, 'Student Isolation Course');
        $firstEnrollmentId = $this->enrollStudent($tenant, $admin, $courseId, $firstStudent);
        $secondEnrollmentId = $this->enrollStudent($tenant, $admin, $courseId, $secondStudent);

        Sanctum::actingAs($firstStudent->user);

        $this->getJson("/api/v1/enrollments/{$firstEnrollmentId}/progress", $this->tenantHeader($tenant))
            ->assertOk();

        $this->getJson("/api/v1/enrollments/{$secondEnrollmentId}/progress", $this->tenantHeader($tenant))
            ->assertForbidden();
    }

    public function test_learning_routes_are_tenant_isolated(): void
    {
        $firstTenant = Tenant::factory()->create();
        $secondTenant = Tenant::factory()->create();
        $firstAdmin = $this->memberWithRole($firstTenant, 'admin');
        $secondAdmin = $this->memberWithRole($secondTenant, 'admin');
        $student = $this->memberWithRole($firstTenant, 'student');
        $courseId = $this->createCourse($firstTenant, $firstAdmin, 'Tenant One Learning Course');
        $enrollmentId = $this->enrollStudent($firstTenant, $firstAdmin, $courseId, $student);

        Sanctum::actingAs($secondAdmin->user);

        $this->getJson("/api/v1/enrollments/{$enrollmentId}", $this->tenantHeader($secondTenant))
            ->assertNotFound();

        $this->postJson("/api/v1/courses/{$courseId}/enrollments", [
            'tenant_user_id' => $secondAdmin->id,
        ], $this->tenantHeader($secondTenant))
            ->assertNotFound();
    }

    public function test_unauthorized_users_cannot_manage_enrollments_or_progress(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $instructor = $this->memberWithRole($tenant, 'instructor');
        $student = $this->memberWithRole($tenant, 'student');
        $courseId = $this->createCourse($tenant, $admin, 'Authorization Course');
        $sectionId = $this->createSection($tenant, $admin, $courseId, 'Authorization Section');
        $lessonId = $this->createLesson($tenant, $admin, $courseId, $sectionId, 'Authorization Lesson');
        $enrollmentId = $this->enrollStudent($tenant, $admin, $courseId, $student);

        Sanctum::actingAs($student->user);

        $this->postJson("/api/v1/courses/{$courseId}/enrollments", [
            'tenant_user_id' => $student->id,
        ], $this->tenantHeader($tenant))->assertForbidden();

        $this->patchJson("/api/v1/enrollments/{$enrollmentId}/status", [
            'status' => 'suspended',
        ], $this->tenantHeader($tenant))->assertForbidden();

        Sanctum::actingAs($instructor->user);

        $this->postJson("/api/v1/lessons/{$lessonId}/progress/start", [], $this->tenantHeader($tenant))
            ->assertForbidden();
    }

    private function createCourse(
        Tenant $tenant,
        TenantUser $manager,
        string $title,
        ?TenantUser $primaryInstructor = null,
    ): int {
        Sanctum::actingAs($manager->user);

        $payload = [
            'title' => $title,
            'slug' => str($title)->slug()->toString(),
        ];

        if ($primaryInstructor) {
            $payload['primary_instructor_tenant_user_id'] = $primaryInstructor->id;
        }

        return $this->postJson('/api/v1/courses', $payload, $this->tenantHeader($tenant))
            ->assertCreated()
            ->tap(function ($response): void {
                Course::withoutGlobalScopes()
                    ->whereKey($response->json('course.id'))
                    ->update(['status' => 'published', 'visibility' => 'enrolled_only']);
            })
            ->json('course.id');
    }

    private function createSection(Tenant $tenant, TenantUser $manager, int $courseId, string $title): int
    {
        Sanctum::actingAs($manager->user);

        return $this->postJson("/api/v1/courses/{$courseId}/sections", [
            'title' => $title,
            'sort_order' => 1,
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->tap(function ($response): void {
                CourseSection::withoutGlobalScopes()
                    ->whereKey($response->json('section.id'))
                    ->update(['status' => 'published', 'is_published' => true]);
            })
            ->json('section.id');
    }

    private function createLesson(
        Tenant $tenant,
        TenantUser $manager,
        int $courseId,
        int $sectionId,
        string $title,
    ): int {
        Sanctum::actingAs($manager->user);

        return $this->postJson("/api/v1/courses/{$courseId}/sections/{$sectionId}/lessons", [
            'title' => $title,
            'slug' => str($title)->slug()->toString(),
            'type' => 'text',
            'visibility' => 'enrolled_only',
            'sort_order' => 1,
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->tap(function ($response): void {
                CourseLesson::withoutGlobalScopes()
                    ->whereKey($response->json('lesson.id'))
                    ->update(['status' => 'published']);
            })
            ->json('lesson.id');
    }

    private function enrollStudent(Tenant $tenant, TenantUser $admin, int $courseId, TenantUser $student): int
    {
        Sanctum::actingAs($admin->user);

        return $this->postJson("/api/v1/courses/{$courseId}/enrollments", [
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

        if (! Permission::query()->where('slug', 'enrollments.manage')->exists()) {
            $this->fail('Enrollment permissions were not seeded.');
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
