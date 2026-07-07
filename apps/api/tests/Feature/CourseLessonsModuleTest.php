<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CourseLessonsModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_course_manager_can_create_update_and_delete_lesson(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $courseId = $this->createCourse($tenant, $admin, 'Lesson Course');
        $sectionId = $this->createSection($tenant, $courseId, 'Lesson Section', 1);

        Sanctum::actingAs($admin->user);

        $lessonId = $this->postJson("/api/v1/courses/{$courseId}/sections/{$sectionId}/lessons", [
            'title' => 'Intro Lesson',
            'slug' => 'intro-lesson',
            'type' => 'text',
            'visibility' => 'private',
            'sort_order' => 10,
            'duration_seconds' => 120,
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('lesson.title', 'Intro Lesson')
            ->assertJsonPath('lesson.status', 'draft')
            ->assertJsonPath('lesson.type', 'text')
            ->json('lesson.id');

        $this->putJson("/api/v1/courses/{$courseId}/sections/{$sectionId}/lessons/{$lessonId}", [
            'title' => 'Updated Intro Lesson',
            'slug' => 'updated-intro-lesson',
            'type' => 'file',
            'visibility' => 'public',
            'sort_order' => 20,
            'duration_seconds' => 180,
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('lesson.title', 'Updated Intro Lesson')
            ->assertJsonPath('lesson.slug', 'updated-intro-lesson')
            ->assertJsonPath('lesson.sort_order', 20);

        $this->deleteJson("/api/v1/courses/{$courseId}/sections/{$sectionId}/lessons/{$lessonId}", [], $this->tenantHeader($tenant))
            ->assertOk();

        $this->assertDatabaseMissing('course_lessons', [
            'id' => $lessonId,
            'tenant_id' => $tenant->id,
        ]);
    }

    public function test_course_manager_can_reorder_lessons(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $courseId = $this->createCourse($tenant, $admin, 'Lesson Reorder Course');
        $sectionId = $this->createSection($tenant, $courseId, 'Lesson Reorder Section', 1);

        Sanctum::actingAs($admin->user);

        $firstId = $this->createLesson($tenant, $courseId, $sectionId, 'First Lesson', 1);
        $secondId = $this->createLesson($tenant, $courseId, $sectionId, 'Second Lesson', 2);

        $this->postJson("/api/v1/courses/{$courseId}/sections/{$sectionId}/lessons/reorder", [
            'lessons' => [
                ['id' => $firstId, 'sort_order' => 2],
                ['id' => $secondId, 'sort_order' => 1],
            ],
        ], $this->tenantHeader($tenant))
            ->assertOk();

        $this->assertDatabaseHas('course_lessons', ['id' => $firstId, 'sort_order' => 2]);
        $this->assertDatabaseHas('course_lessons', ['id' => $secondId, 'sort_order' => 1]);

        $this->getJson("/api/v1/courses/{$courseId}/sections/{$sectionId}/lessons", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('lessons.0.id', $secondId)
            ->assertJsonPath('lessons.1.id', $firstId);
    }

    public function test_course_manager_can_move_lesson_between_sections(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $courseId = $this->createCourse($tenant, $admin, 'Move Lesson Course');
        $sourceSectionId = $this->createSection($tenant, $courseId, 'Source Section', 1);
        $targetSectionId = $this->createSection($tenant, $courseId, 'Target Section', 2);

        Sanctum::actingAs($admin->user);

        $lessonId = $this->createLesson($tenant, $courseId, $sourceSectionId, 'Movable Lesson', 1);

        $this->postJson("/api/v1/courses/{$courseId}/sections/{$sourceSectionId}/lessons/{$lessonId}/move", [
            'course_section_id' => $targetSectionId,
            'sort_order' => 5,
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('lesson.course_section_id', $targetSectionId)
            ->assertJsonPath('lesson.sort_order', 5);

        $this->assertDatabaseHas('course_lessons', [
            'id' => $lessonId,
            'course_section_id' => $targetSectionId,
            'sort_order' => 5,
        ]);
    }

    public function test_course_manager_can_publish_and_archive_lesson(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $courseId = $this->createCourse($tenant, $admin, 'Lesson Lifecycle Course');
        $sectionId = $this->createSection($tenant, $courseId, 'Lifecycle Section', 1);

        Sanctum::actingAs($admin->user);

        $lessonId = $this->createLesson($tenant, $courseId, $sectionId, 'Publish Lesson', 1);

        $this->patchJson("/api/v1/courses/{$courseId}/sections/{$sectionId}/lessons/{$lessonId}/status", [
            'status' => 'published',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('lesson.status', 'published');

        $this->patchJson("/api/v1/courses/{$courseId}/sections/{$sectionId}/lessons/{$lessonId}/status", [
            'status' => 'archived',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('lesson.status', 'archived');
    }

    public function test_student_can_only_list_published_visible_lessons_and_cannot_manage_lessons(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $courseId = $this->createCourse($tenant, $admin, 'Student Lesson Course');
        $sectionId = $this->createSection($tenant, $courseId, 'Student Lesson Section', 1);

        Course::withoutGlobalScopes()
            ->whereKey($courseId)
            ->update(['status' => 'published', 'visibility' => 'public']);

        Sanctum::actingAs($admin->user);

        $draftLessonId = $this->createLesson($tenant, $courseId, $sectionId, 'Draft Lesson', 1);
        $publishedLessonId = $this->createLesson($tenant, $courseId, $sectionId, 'Published Lesson', 2, 'public');

        $this->patchJson("/api/v1/courses/{$courseId}/sections/{$sectionId}/status", [
            'status' => 'published',
        ], $this->tenantHeader($tenant))->assertOk();

        $this->patchJson("/api/v1/courses/{$courseId}/sections/{$sectionId}/lessons/{$publishedLessonId}/status", [
            'status' => 'published',
        ], $this->tenantHeader($tenant))->assertOk();

        Sanctum::actingAs($student->user);

        $this->getJson("/api/v1/courses/{$courseId}/sections/{$sectionId}/lessons", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonFragment(['id' => $publishedLessonId])
            ->assertJsonMissing(['id' => $draftLessonId]);

        $this->postJson("/api/v1/courses/{$courseId}/sections/{$sectionId}/lessons", [
            'title' => 'Denied',
            'type' => 'text',
        ], $this->tenantHeader($tenant))->assertForbidden();

        $this->putJson("/api/v1/courses/{$courseId}/sections/{$sectionId}/lessons/{$publishedLessonId}", [
            'title' => 'Denied',
        ], $this->tenantHeader($tenant))->assertForbidden();

        $this->postJson("/api/v1/courses/{$courseId}/sections/{$sectionId}/lessons/reorder", [
            'lessons' => [
                ['id' => $publishedLessonId, 'sort_order' => 1],
            ],
        ], $this->tenantHeader($tenant))->assertForbidden();
    }

    public function test_lessons_are_tenant_course_and_section_isolated(): void
    {
        $firstTenant = Tenant::factory()->create();
        $secondTenant = Tenant::factory()->create();
        $firstAdmin = $this->memberWithRole($firstTenant, 'admin');
        $secondAdmin = $this->memberWithRole($secondTenant, 'admin');
        $firstCourseId = $this->createCourse($firstTenant, $firstAdmin, 'First Lesson Tenant Course');
        $firstSectionId = $this->createSection($firstTenant, $firstCourseId, 'First Tenant Section', 1);
        $secondCourseId = $this->createCourse($secondTenant, $secondAdmin, 'Second Lesson Tenant Course');
        $secondSectionId = $this->createSection($secondTenant, $secondCourseId, 'Second Tenant Section', 1);

        Sanctum::actingAs($firstAdmin->user);
        $firstLessonId = $this->createLesson($firstTenant, $firstCourseId, $firstSectionId, 'Foreign Lesson', 1);

        Sanctum::actingAs($secondAdmin->user);

        $this->getJson(
            "/api/v1/courses/{$firstCourseId}/sections/{$firstSectionId}/lessons/{$firstLessonId}",
            $this->tenantHeader($secondTenant),
        )->assertNotFound();

        $this->getJson(
            "/api/v1/courses/{$secondCourseId}/sections/{$secondSectionId}/lessons/{$firstLessonId}",
            $this->tenantHeader($secondTenant),
        )->assertNotFound();

        $this->postJson("/api/v1/courses/{$secondCourseId}/sections/{$secondSectionId}/lessons/reorder", [
            'lessons' => [
                ['id' => $firstLessonId, 'sort_order' => 1],
            ],
        ], $this->tenantHeader($secondTenant))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['lessons']);

        $this->postJson("/api/v1/courses/{$secondCourseId}/sections/{$secondSectionId}/lessons/{$firstLessonId}/move", [
            'course_section_id' => $secondSectionId,
        ], $this->tenantHeader($secondTenant))
            ->assertNotFound();
    }

    private function createCourse(Tenant $tenant, TenantUser $manager, string $title): int
    {
        Sanctum::actingAs($manager->user);

        return $this->postJson('/api/v1/courses', [
            'title' => $title,
            'slug' => str($title)->slug()->toString(),
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('course.id');
    }

    private function createSection(Tenant $tenant, int $courseId, string $title, int $sortOrder): int
    {
        return $this->postJson("/api/v1/courses/{$courseId}/sections", [
            'title' => $title,
            'sort_order' => $sortOrder,
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('section.id');
    }

    private function createLesson(
        Tenant $tenant,
        int $courseId,
        int $sectionId,
        string $title,
        int $sortOrder,
        string $visibility = 'private',
    ): int {
        return $this->postJson("/api/v1/courses/{$courseId}/sections/{$sectionId}/lessons", [
            'title' => $title,
            'slug' => str($title)->slug()->toString(),
            'type' => 'text',
            'visibility' => $visibility,
            'sort_order' => $sortOrder,
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('lesson.id');
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
