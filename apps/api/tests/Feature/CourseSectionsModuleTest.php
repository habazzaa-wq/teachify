<?php

namespace Tests\Feature;

use App\Models\Course;
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

class CourseSectionsModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_course_manager_can_create_update_and_delete_section(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $courseId = $this->createCourse($tenant, $admin, 'Section Course');

        Sanctum::actingAs($admin->user);

        $sectionId = $this->postJson("/api/v1/courses/{$courseId}/sections", [
            'title' => 'Introduction',
            'description' => 'Start here.',
            'sort_order' => 10,
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('section.title', 'Introduction')
            ->assertJsonPath('section.status', 'draft')
            ->assertJsonPath('section.is_published', false)
            ->json('section.id');

        $this->putJson("/api/v1/courses/{$courseId}/sections/{$sectionId}", [
            'title' => 'Getting Started',
            'description' => 'Updated.',
            'sort_order' => 20,
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('section.title', 'Getting Started')
            ->assertJsonPath('section.sort_order', 20);

        $this->deleteJson("/api/v1/courses/{$courseId}/sections/{$sectionId}", [], $this->tenantHeader($tenant))
            ->assertOk();

        $this->assertDatabaseMissing('course_sections', [
            'id' => $sectionId,
            'tenant_id' => $tenant->id,
        ]);
    }

    public function test_course_manager_can_reorder_sections(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $courseId = $this->createCourse($tenant, $admin, 'Reorder Course');

        Sanctum::actingAs($admin->user);

        $firstId = $this->createSection($tenant, $courseId, 'First', 1);
        $secondId = $this->createSection($tenant, $courseId, 'Second', 2);

        $this->postJson("/api/v1/courses/{$courseId}/sections/reorder", [
            'sections' => [
                ['id' => $firstId, 'sort_order' => 2],
                ['id' => $secondId, 'sort_order' => 1],
            ],
        ], $this->tenantHeader($tenant))
            ->assertOk();

        $this->assertDatabaseHas('course_sections', ['id' => $firstId, 'sort_order' => 2]);
        $this->assertDatabaseHas('course_sections', ['id' => $secondId, 'sort_order' => 1]);

        $this->getJson("/api/v1/courses/{$courseId}/sections", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('sections.0.id', $secondId)
            ->assertJsonPath('sections.1.id', $firstId);
    }

    public function test_course_manager_can_publish_and_archive_section(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $courseId = $this->createCourse($tenant, $admin, 'Lifecycle Course');

        Sanctum::actingAs($admin->user);

        $sectionId = $this->createSection($tenant, $courseId, 'Publish Me', 1);

        $this->patchJson("/api/v1/courses/{$courseId}/sections/{$sectionId}/status", [
            'status' => 'published',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('section.status', 'published')
            ->assertJsonPath('section.is_published', true);

        $this->patchJson("/api/v1/courses/{$courseId}/sections/{$sectionId}/status", [
            'status' => 'archived',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('section.status', 'archived')
            ->assertJsonPath('section.is_published', false);
    }

    public function test_student_can_only_list_published_sections_and_cannot_manage_sections(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $courseId = $this->createCourse($tenant, $admin, 'Student Visible Course');

        Course::withoutGlobalScopes()
            ->whereKey($courseId)
            ->update(['status' => 'published', 'visibility' => 'public']);

        Sanctum::actingAs($admin->user);

        $draftSectionId = $this->createSection($tenant, $courseId, 'Draft Section', 1);
        $publishedSectionId = $this->createSection($tenant, $courseId, 'Published Section', 2);

        $this->patchJson("/api/v1/courses/{$courseId}/sections/{$publishedSectionId}/status", [
            'status' => 'published',
        ], $this->tenantHeader($tenant))->assertOk();

        Sanctum::actingAs($student->user);

        $this->getJson("/api/v1/courses/{$courseId}/sections", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonFragment(['id' => $publishedSectionId])
            ->assertJsonMissing(['id' => $draftSectionId]);

        $this->postJson("/api/v1/courses/{$courseId}/sections", [
            'title' => 'Denied',
        ], $this->tenantHeader($tenant))->assertForbidden();

        $this->putJson("/api/v1/courses/{$courseId}/sections/{$publishedSectionId}", [
            'title' => 'Denied',
        ], $this->tenantHeader($tenant))->assertForbidden();

        $this->postJson("/api/v1/courses/{$courseId}/sections/reorder", [
            'sections' => [
                ['id' => $publishedSectionId, 'sort_order' => 1],
            ],
        ], $this->tenantHeader($tenant))->assertForbidden();
    }

    public function test_sections_are_tenant_and_course_isolated(): void
    {
        $firstTenant = Tenant::factory()->create();
        $secondTenant = Tenant::factory()->create();
        $firstAdmin = $this->memberWithRole($firstTenant, 'admin');
        $secondAdmin = $this->memberWithRole($secondTenant, 'admin');
        $firstCourseId = $this->createCourse($firstTenant, $firstAdmin, 'First Tenant Course');
        $secondCourseId = $this->createCourse($secondTenant, $secondAdmin, 'Second Tenant Course');

        Sanctum::actingAs($firstAdmin->user);
        $firstSectionId = $this->createSection($firstTenant, $firstCourseId, 'Foreign Section', 1);

        Sanctum::actingAs($secondAdmin->user);

        $this->getJson("/api/v1/courses/{$firstCourseId}/sections/{$firstSectionId}", $this->tenantHeader($secondTenant))
            ->assertNotFound();

        $this->getJson("/api/v1/courses/{$secondCourseId}/sections/{$firstSectionId}", $this->tenantHeader($secondTenant))
            ->assertNotFound();

        $this->postJson("/api/v1/courses/{$secondCourseId}/sections/reorder", [
            'sections' => [
                ['id' => $firstSectionId, 'sort_order' => 1],
            ],
        ], $this->tenantHeader($secondTenant))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['sections']);
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
