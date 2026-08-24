<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\MediaAsset;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AssignmentFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_instructor_can_create_and_publish_assignment(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $instructor = $this->memberWithRole($tenant, 'instructor');
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Assignment Creation', $instructor);

        $assignment = $this->createAssignment($tenant, $instructor, $course, $section, $lesson, [
            'title' => 'Foundation Assignment',
            'instructions' => 'Submit a short response.',
            'max_score' => 20,
        ]);

        $this->patchJson("/api/v1/courses/{$course}/sections/{$section}/lessons/{$lesson}/assignment/status", [
            'status' => 'published',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('assignment.status', 'published');

        $this->assertDatabaseHas('assignments', [
            'id' => $assignment,
            'tenant_id' => $tenant->id,
            'course_lesson_id' => $lesson,
            'status' => 'published',
            'max_score' => 20,
        ]);
    }

    public function test_student_can_create_submission_attach_file_and_submit(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Submission Flow');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $this->enrollStudent($tenant, $admin, $course, $student);
        $assignment = $this->createPublishedAssignment($tenant, $admin, $course, $section, $lesson);
        $asset = $this->mediaAsset($tenant, $student);

        Sanctum::actingAs($student->user);

        $submission = $this->postJson("/api/v1/assignments/{$assignment}/submissions", [
            'notes' => 'Initial draft.',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('submission.status', 'draft')
            ->json('submission.id');

        $this->postJson("/api/v1/assignments/{$assignment}/submissions/{$submission}/files", [
            'media_asset_id' => $asset,
            'title' => 'Response document',
            'sort_order' => 1,
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('file.media_asset_id', $asset);

        $this->postJson("/api/v1/assignments/{$assignment}/submissions/{$submission}/submit", [], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('submission.status', 'submitted');

        $this->assertDatabaseHas('assignment_submission_files', [
            'tenant_id' => $tenant->id,
            'assignment_submission_id' => $submission,
            'media_asset_id' => $asset,
        ]);
    }

    public function test_file_attachment_validates_tenant_media_ownership(): void
    {
        $firstTenant = Tenant::factory()->create();
        $secondTenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($firstTenant, 'admin');
        $student = $this->memberWithRole($firstTenant, 'student');
        $secondStudent = $this->memberWithRole($secondTenant, 'student');
        [$course, $section, $lesson] = $this->publishedLessonStack($firstTenant, $admin, 'Media Ownership');
        $this->setCourseAccess($firstTenant, $admin, $course, 'enrolled_only');
        $this->enrollStudent($firstTenant, $admin, $course, $student);
        $assignment = $this->createPublishedAssignment($firstTenant, $admin, $course, $section, $lesson);
        $foreignAsset = $this->mediaAsset($secondTenant, $secondStudent);

        Sanctum::actingAs($student->user);

        $submission = $this->postJson("/api/v1/assignments/{$assignment}/submissions", [], $this->tenantHeader($firstTenant))
            ->assertCreated()
            ->json('submission.id');

        $this->postJson("/api/v1/assignments/{$assignment}/submissions/{$submission}/files", [
            'media_asset_id' => $foreignAsset,
        ], $this->tenantHeader($firstTenant))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['media_asset_id']);
    }

    public function test_instructor_can_grade_with_feedback_result_and_completion_sync(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $instructor = $this->memberWithRole($tenant, 'instructor');
        $student = $this->memberWithRole($tenant, 'student');
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Grading Flow', $instructor);
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $this->enrollStudent($tenant, $admin, $course, $student);
        $assignment = $this->createPublishedAssignment($tenant, $instructor, $course, $section, $lesson, [
            'max_score' => 10,
        ]);
        $submission = $this->submittedAssignment($tenant, $student, $assignment);

        Sanctum::actingAs($instructor->user);

        $this->postJson("/api/v1/assignments/{$assignment}/submissions/{$submission}/grade", [
            'score' => 8,
            'passed' => true,
            'feedback' => 'Solid work.',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('result.score', 8)
            ->assertJsonPath('result.passed', true)
            ->assertJsonPath('result.feedback', 'Solid work.');

        Sanctum::actingAs($student->user);

        $this->getJson("/api/v1/assignments/{$assignment}/results/me", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('result.score', 8)
            ->assertJsonPath('result.feedback', 'Solid work.');

        $this->assertDatabaseHas('assignment_submissions', [
            'id' => $submission,
            'status' => 'graded',
        ]);
        $this->assertDatabaseHas('course_completions', [
            'tenant_id' => $tenant->id,
            'course_id' => $course,
        ]);
    }

    public function test_student_instructor_and_tenant_isolation_rules_are_enforced(): void
    {
        $firstTenant = Tenant::factory()->create();
        $secondTenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($firstTenant, 'admin');
        $assignedInstructor = $this->memberWithRole($firstTenant, 'instructor');
        $unassignedInstructor = $this->memberWithRole($firstTenant, 'instructor');
        $student = $this->memberWithRole($firstTenant, 'student');
        $otherStudent = $this->memberWithRole($firstTenant, 'student');
        $secondAdmin = $this->memberWithRole($secondTenant, 'admin');
        [$course, $section, $lesson] = $this->publishedLessonStack($firstTenant, $admin, 'Assignment Auth', $assignedInstructor);
        $this->setCourseAccess($firstTenant, $admin, $course, 'enrolled_only');
        $this->enrollStudent($firstTenant, $admin, $course, $student);
        $assignment = $this->createPublishedAssignment($firstTenant, $admin, $course, $section, $lesson);
        $submission = $this->submittedAssignment($firstTenant, $student, $assignment);

        Sanctum::actingAs($student->user);
        $this->postJson("/api/v1/assignments/{$assignment}/submissions/{$submission}/grade", [
            'score' => 10,
        ], $this->tenantHeader($firstTenant))->assertForbidden();

        Sanctum::actingAs($otherStudent->user);
        $this->postJson("/api/v1/assignments/{$assignment}/submissions/{$submission}/submit", [], $this->tenantHeader($firstTenant))
            ->assertForbidden();

        Sanctum::actingAs($assignedInstructor->user);
        $this->putJson("/api/v1/courses/{$course}/sections/{$section}/lessons/{$lesson}/assignment", [
            'title' => 'Instructor Update',
        ], $this->tenantHeader($firstTenant))->assertOk();

        Sanctum::actingAs($unassignedInstructor->user);
        $this->putJson("/api/v1/courses/{$course}/sections/{$section}/lessons/{$lesson}/assignment", [
            'title' => 'Denied Update',
        ], $this->tenantHeader($firstTenant))->assertForbidden();

        Sanctum::actingAs($secondAdmin->user);
        $this->getJson("/api/v1/assignments/{$assignment}/results/me", $this->tenantHeader($secondTenant))
            ->assertNotFound();
    }

    public function test_draft_assignment_is_hidden_and_lesson_access_is_required(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Access Required');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $assignment = $this->createAssignment($tenant, $admin, $course, $section, $lesson);

        Sanctum::actingAs($student->user);

        $this->getJson("/api/v1/courses/{$course}/sections/{$section}/lessons/{$lesson}/assignment", $this->tenantHeader($tenant))
            ->assertNotFound();

        $this->publishAssignment($tenant, $admin, $course, $section, $lesson);

        Sanctum::actingAs($student->user);

        $this->postJson("/api/v1/assignments/{$assignment}/submissions", [], $this->tenantHeader($tenant))
            ->assertForbidden();

        $this->enrollStudent($tenant, $admin, $course, $student);
        Sanctum::actingAs($student->user);

        $this->postJson("/api/v1/assignments/{$assignment}/submissions", [], $this->tenantHeader($tenant))
            ->assertCreated();
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
            'lesson_type' => 'video',
            'visibility' => 'private',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.id');

        CourseLesson::withoutGlobalScopes()->whereKey($lesson)->update(['status' => 'published']);

        return [$course, $section, $lesson];
    }

    /**
     * @param array<string, mixed> $overrides
     */
    private function createAssignment(
        Tenant $tenant,
        TenantUser $manager,
        int $course,
        int $section,
        int $lesson,
        array $overrides = [],
    ): int {
        Sanctum::actingAs($manager->user);

        return $this->postJson("/api/v1/courses/{$course}/sections/{$section}/lessons/{$lesson}/assignment", array_merge([
            'title' => 'Lesson Assignment',
            'description' => 'Assignment description.',
            'instructions' => 'Upload your work.',
            'max_score' => 100,
        ], $overrides), $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('assignment.id');
    }

    /**
     * @param array<string, mixed> $overrides
     */
    private function createPublishedAssignment(
        Tenant $tenant,
        TenantUser $manager,
        int $course,
        int $section,
        int $lesson,
        array $overrides = [],
    ): int {
        $assignment = $this->createAssignment($tenant, $manager, $course, $section, $lesson, $overrides);
        $this->publishAssignment($tenant, $manager, $course, $section, $lesson);

        return $assignment;
    }

    private function publishAssignment(Tenant $tenant, TenantUser $manager, int $course, int $section, int $lesson): void
    {
        Sanctum::actingAs($manager->user);

        $this->patchJson("/api/v1/courses/{$course}/sections/{$section}/lessons/{$lesson}/assignment/status", [
            'status' => 'published',
        ], $this->tenantHeader($tenant))->assertOk();
    }

    private function submittedAssignment(Tenant $tenant, TenantUser $student, int $assignment): int
    {
        Sanctum::actingAs($student->user);

        $submission = $this->postJson("/api/v1/assignments/{$assignment}/submissions", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('submission.id');

        $this->postJson("/api/v1/assignments/{$assignment}/submissions/{$submission}/submit", [], $this->tenantHeader($tenant))
            ->assertOk();

        return $submission;
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

    private function mediaAsset(Tenant $tenant, TenantUser $creator): int
    {
        return (int) MediaAsset::withoutEvents(fn () => MediaAsset::create([
            'tenant_id' => $tenant->id,
            'provider' => 'local',
            'provider_service' => 'storage',
            'type' => 'document',
            'status' => 'ready',
            'visibility' => 'private',
            'storage_key' => 'tenants/'.$tenant->id.'/assignments/file.pdf',
            'original_filename' => 'file.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => 1000,
            'metadata' => [],
            'created_by_tenant_user_id' => $creator->id,
        ]))->id;
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
