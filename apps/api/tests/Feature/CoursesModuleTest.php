<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CoursesModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_course_with_taxonomy_instructors_and_default_settings(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $instructor = $this->memberWithRole($tenant, 'instructor');

        Sanctum::actingAs($admin->user);

        $categoryId = $this->postJson('/api/v1/categories', [
            'name' => 'Leadership',
            'slug' => 'leadership',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.id');

        $tagId = $this->postJson('/api/v1/tags', [
            'name' => 'Management',
            'slug' => 'management',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('tag.id');

        $response = $this->postJson('/api/v1/courses', [
            'title' => 'Leadership Essentials',
            'slug' => 'leadership-essentials',
            'description' => 'Manager training.',
            'visibility' => 'private',
            'pricing_type' => 'free',
            'primary_instructor_tenant_user_id' => $instructor->id,
            'category_ids' => [$categoryId],
            'tag_ids' => [$tagId],
        ], $this->tenantHeader($tenant));

        $response
            ->assertCreated()
            ->assertJsonPath('data.title', 'Leadership Essentials')
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.instructor.id', (string) $instructor->id);

        $course = Course::withoutGlobalScopes()->where('tenant_id', $tenant->id)->firstOrFail();

        $this->assertDatabaseHas('course_instructors', [
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'tenant_user_id' => $instructor->id,
            'role' => 'primary',
        ]);
        $this->assertDatabaseHas('course_categories', [
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'category_id' => $categoryId,
        ]);
        $this->assertDatabaseHas('course_tags', [
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'tag_id' => $tagId,
        ]);
        $this->assertSame(
            ['access', 'certificate', 'completion', 'enrollment', 'notifications', 'ordering'],
            $course->settings()->withoutGlobalScopes()->orderBy('group')->pluck('group')->all(),
        );
    }

    public function test_course_status_lifecycle_enforces_permissions(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $instructor = $this->memberWithRole($tenant, 'instructor');

        Sanctum::actingAs($instructor->user);

        $courseId = $this->postJson('/api/v1/courses', [
            'title' => 'Instructor Draft',
            'slug' => 'instructor-draft',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.id');

        $this->patchJson("/api/v1/courses/{$courseId}/status", [
            'status' => 'review',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.status', 'review');

        Sanctum::actingAs($admin->user);

        $this->patchJson("/api/v1/courses/{$courseId}/status", [
            'status' => 'published',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.status', 'published');
    }

    public function test_student_cannot_create_or_manage_courses(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');

        Sanctum::actingAs($admin->user);

        $courseId = $this->postJson('/api/v1/courses', [
            'title' => 'Private Draft',
            'slug' => 'private-draft',
            'visibility' => 'private',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.id');

        Sanctum::actingAs($student->user);

        $this->postJson('/api/v1/courses', [
            'title' => 'Unauthorized Course',
            'slug' => 'unauthorized-course',
        ], $this->tenantHeader($tenant))
            ->assertForbidden();

        $this->postJson('/api/v1/categories', [
            'name' => 'Unauthorized Category',
        ], $this->tenantHeader($tenant))
            ->assertForbidden();

        $this->getJson('/api/v1/courses?visibility=public&status=published', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonMissing(['id' => (string) $courseId]);
    }

    public function test_course_routes_are_tenant_isolated(): void
    {
        $firstTenant = Tenant::factory()->create();
        $secondTenant = Tenant::factory()->create();
        $firstAdmin = $this->memberWithRole($firstTenant, 'admin');
        $secondAdmin = $this->memberWithRole($secondTenant, 'admin');

        Sanctum::actingAs($firstAdmin->user);

        $foreignCategoryId = $this->postJson('/api/v1/categories', [
            'name' => 'Tenant One Category',
            'slug' => 'tenant-one-category',
        ], $this->tenantHeader($firstTenant))
            ->assertCreated()
            ->json('data.id');

        $courseId = $this->postJson('/api/v1/courses', [
            'title' => 'Tenant One Course',
            'slug' => 'tenant-one-course',
        ], $this->tenantHeader($firstTenant))
            ->assertCreated()
            ->json('data.id');

        Sanctum::actingAs($secondAdmin->user);

        $this->getJson("/api/v1/courses/{$courseId}", $this->tenantHeader($secondTenant))
            ->assertNotFound();

        $this->postJson('/api/v1/courses', [
            'title' => 'Tenant Two Course',
            'slug' => 'tenant-two-course',
            'category_ids' => [$foreignCategoryId],
        ], $this->tenantHeader($secondTenant))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['category_ids']);
    }

    public function test_admin_can_assign_instructors_and_update_course_settings(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $instructor = $this->memberWithRole($tenant, 'instructor');

        Sanctum::actingAs($admin->user);

        $courseId = $this->postJson('/api/v1/courses', [
            'title' => 'Settings Course',
            'slug' => 'settings-course',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.id');

        $this->postJson("/api/v1/courses/{$courseId}/instructors", [
            'tenant_user_id' => $instructor->id,
            'role' => 'co_instructor',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('instructor.tenant_user_id', $instructor->id);

        $this->putJson("/api/v1/courses/{$courseId}/settings/completion", [
            'values' => [
                'required_lesson_completion_percent' => 80,
            ],
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('setting.values.required_lesson_completion_percent', 80);
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

        if (! Permission::query()->where('slug', 'courses.assign_instructors')->exists()) {
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
