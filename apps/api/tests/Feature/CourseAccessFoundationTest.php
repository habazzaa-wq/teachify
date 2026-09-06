<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\LessonProgress;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Access\AccessEvaluationService;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CourseAccessFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_private_enrolled_only_and_public_course_visibility(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $privateCourse = $this->publishedCourse($tenant, $admin, 'Private Access Course');
        $enrolledCourse = $this->publishedCourse($tenant, $admin, 'Enrolled Access Course');
        $publicCourse = $this->publishedCourse($tenant, $admin, 'Public Access Course');

        $this->putCourseAccess($tenant, $admin, $privateCourse, ['access_mode' => 'private']);
        $this->putCourseAccess($tenant, $admin, $enrolledCourse, ['access_mode' => 'enrolled_only']);
        $this->putCourseAccess($tenant, $admin, $publicCourse, ['access_mode' => 'public']);

        Sanctum::actingAs($student->user);

        $this->getJson("/api/v1/courses/{$privateCourse}/can-access", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('can_access', false);

        $this->getJson("/api/v1/courses/{$enrolledCourse}/can-access", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('can_access', false);

        $this->enrollStudent($tenant, $admin, $enrolledCourse, $student);
        Sanctum::actingAs($student->user);

        $this->getJson("/api/v1/courses/{$enrolledCourse}/can-access", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('can_access', true);

        $this->getJson("/api/v1/courses/{$publicCourse}/can-access", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('can_access', true);
    }

    public function test_self_enrollment_and_invite_only_flags_are_evaluated(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $course = $this->publishedCourse($tenant, $admin, 'Self Enrollment Course');

        $this->putCourseAccess($tenant, $admin, $course, [
            'access_mode' => 'public',
            'allow_self_enrollment' => true,
            'invite_only' => false,
        ]);

        Sanctum::actingAs($student->user);

        $this->getJson("/api/v1/courses/{$course}/can-access", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('can_enroll', true);

        $this->putCourseAccess($tenant, $admin, $course, [
            'access_mode' => 'public',
            'allow_self_enrollment' => true,
            'invite_only' => true,
        ]);

        Sanctum::actingAs($student->user);

        $this->getJson("/api/v1/courses/{$course}/can-access", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('can_enroll', false);
    }

    public function test_lesson_inheritance_public_preview_prerequisite_scheduled_and_drip_rules(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $course = $this->publishedCourse($tenant, $admin, 'Lesson Access Course');
        $section = $this->publishedSection($tenant, $admin, $course, 'Lesson Access Section');
        $firstLesson = $this->publishedLesson($tenant, $admin, $course, $section, 'First Access Lesson');
        $secondLesson = $this->publishedLesson($tenant, $admin, $course, $section, 'Second Access Lesson');
        $previewLesson = $this->publishedLesson($tenant, $admin, $course, $section, 'Preview Access Lesson');
        $scheduledLesson = $this->publishedLesson($tenant, $admin, $course, $section, 'Scheduled Access Lesson');
        $dripLesson = $this->publishedLesson($tenant, $admin, $course, $section, 'Drip Access Lesson');

        $this->putCourseAccess($tenant, $admin, $course, ['access_mode' => 'enrolled_only']);

        Sanctum::actingAs($student->user);
        $this->getJson("/api/v1/lessons/{$firstLesson}/can-access", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('can_access', false);

        $this->putLessonAccess($tenant, $admin, $previewLesson, ['access_mode' => 'public_preview']);

        Sanctum::actingAs($student->user);
        $this->getJson("/api/v1/lessons/{$previewLesson}/can-access", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('can_access', true);

        $enrollment = $this->enrollStudent($tenant, $admin, $course, $student);

        $this->putLessonAccess($tenant, $admin, $secondLesson, [
            'access_mode' => 'enrolled_only',
            'prerequisite_lesson_id' => $firstLesson,
        ]);

        Sanctum::actingAs($student->user);
        $this->getJson("/api/v1/lessons/{$secondLesson}/can-access", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('can_access', false)
            ->assertJsonPath('reasons.0', 'prerequisite_incomplete');

        LessonProgress::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course,
            'course_section_id' => $section,
            'course_lesson_id' => $firstLesson,
            'course_enrollment_id' => $enrollment,
            'status' => 'completed',
            'progress_percent' => 100,
            'started_at' => now(),
            'completed_at' => now(),
            'last_activity_at' => now(),
        ]);

        $this->getJson("/api/v1/lessons/{$secondLesson}/can-access", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('can_access', true);

        $this->putLessonAccess($tenant, $admin, $scheduledLesson, [
            'access_mode' => 'scheduled',
            'available_from' => now()->addDay()->toISOString(),
        ]);

        Sanctum::actingAs($student->user);
        $this->getJson("/api/v1/lessons/{$scheduledLesson}/can-access", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('can_access', false)
            ->assertJsonPath('reasons.0', 'not_yet_available');

        $this->putLessonAccess($tenant, $admin, $dripLesson, [
            'access_mode' => 'drip',
            'metadata' => ['days_after_enrollment' => 3],
        ])->assertJsonPath('access.metadata.days_after_enrollment', 3);

        Sanctum::actingAs($student->user);
        $this->getJson("/api/v1/lessons/{$dripLesson}/can-access", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('can_access', true)
            ->assertJsonPath('context.metadata.days_after_enrollment', 3);
    }

    public function test_instructor_visibility_student_isolation_tenant_isolation_and_authorization_denial(): void
    {
        $firstTenant = Tenant::factory()->create();
        $secondTenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($firstTenant, 'admin');
        $instructor = $this->memberWithRole($firstTenant, 'instructor');
        $student = $this->memberWithRole($firstTenant, 'student');
        $secondAdmin = $this->memberWithRole($secondTenant, 'admin');
        $course = $this->publishedCourse($firstTenant, $admin, 'Instructor Access Course', $instructor);
        $section = $this->publishedSection($firstTenant, $admin, $course, 'Instructor Access Section');
        $lesson = $this->publishedLesson($firstTenant, $admin, $course, $section, 'Instructor Access Lesson');

        $this->putCourseAccess($firstTenant, $admin, $course, ['access_mode' => 'private']);

        Sanctum::actingAs($instructor->user);
        $this->getJson("/api/v1/courses/{$course}/can-access", $this->tenantHeader($firstTenant))
            ->assertOk()
            ->assertJsonPath('can_access', true)
            ->assertJsonPath('reasons.0', 'staff_access');

        Sanctum::actingAs($student->user);
        $this->putJson("/api/v1/courses/{$course}/access", [
            'access_mode' => 'public',
        ], $this->tenantHeader($firstTenant))->assertForbidden();

        $this->getJson("/api/v1/lessons/{$lesson}/can-access", $this->tenantHeader($firstTenant))
            ->assertOk()
            ->assertJsonPath('can_access', false);

        Sanctum::actingAs($secondAdmin->user);
        $this->getJson("/api/v1/courses/{$course}/access", $this->tenantHeader($secondTenant))
            ->assertNotFound();
    }

    public function test_access_evaluation_service_is_the_central_decision_point(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $course = $this->publishedCourse($tenant, $admin, 'Central Access Course');

        $this->putCourseAccess($tenant, $admin, $course, ['access_mode' => 'private']);

        Sanctum::actingAs($student->user);

        $service = app(AccessEvaluationService::class);
        $courseModel = Course::query()->findOrFail($course);

        $this->assertFalse($service->canViewCourse($student->user, $courseModel));

        $this->getJson("/api/v1/courses/{$course}/can-access", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('can_access', false)
            ->assertJsonPath('reasons.0', 'private_course');
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function putCourseAccess(Tenant $tenant, TenantUser $admin, int $courseId, array $payload): \Illuminate\Testing\TestResponse
    {
        Sanctum::actingAs($admin->user);

        return $this->putJson("/api/v1/courses/{$courseId}/access", $payload, $this->tenantHeader($tenant))
            ->assertOk();
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function putLessonAccess(Tenant $tenant, TenantUser $admin, int $lessonId, array $payload): \Illuminate\Testing\TestResponse
    {
        Sanctum::actingAs($admin->user);

        return $this->putJson("/api/v1/lessons/{$lessonId}/access", $payload, $this->tenantHeader($tenant))
            ->assertOk();
    }

    private function publishedCourse(
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

        $id = $this->postJson('/api/v1/courses', $payload, $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('course.id');

        Course::withoutGlobalScopes()
            ->whereKey($id)
            ->update(['status' => 'published', 'visibility' => 'public']);

        return $id;
    }

    private function publishedSection(Tenant $tenant, TenantUser $manager, int $courseId, string $title): int
    {
        Sanctum::actingAs($manager->user);

        $id = $this->postJson("/api/v1/courses/{$courseId}/sections", [
            'title' => $title,
            'sort_order' => 1,
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('section.id');

        CourseSection::withoutGlobalScopes()
            ->whereKey($id)
            ->update(['status' => 'published', 'is_published' => true]);

        return $id;
    }

    private function publishedLesson(Tenant $tenant, TenantUser $manager, int $courseId, int $sectionId, string $title): int
    {
        Sanctum::actingAs($manager->user);

        $id = $this->postJson("/api/v1/courses/{$courseId}/sections/{$sectionId}/lessons", [
            'title' => $title,
            'slug' => str($title)->slug()->toString(),
            'type' => 'text',
            'visibility' => 'enrolled_only',
            'sort_order' => 1,
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('lesson.id');

        CourseLesson::withoutGlobalScopes()
            ->whereKey($id)
            ->update(['status' => 'published']);

        return $id;
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

        if (! Permission::query()->where('slug', 'courses.manage_settings')->exists()) {
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
