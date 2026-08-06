<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseAccessRule;
use App\Models\CourseLesson;
use App\Models\CourseModule;
use App\Models\CourseSection;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicCourseModulesTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_modules_only_include_published_content(): void
    {
        [$tenant, $course, $publishedModule, $publishedSection, $unpublishedModule, $draftSection, $publishedLesson, $draftLesson] = $this->modulesFixture();

        $this->getJson(
            "/api/v1/public/courses/{$course->slug}/modules",
            $this->tenantHeader($tenant),
        )
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', (string) $publishedModule->id)
            ->assertJsonPath('data.0.title', $publishedModule->title)
            ->assertJsonCount(1, 'data.0.sections')
            ->assertJsonPath('data.0.sections.0.id', (string) $publishedSection->id)
            ->assertJsonCount(1, 'data.0.sections.0.lessons')
            ->assertJsonPath('data.0.sections.0.lessons.0.id', (string) $publishedLesson->id)
            ->assertJsonMissing(['id' => $unpublishedModule->id])
            ->assertJsonMissing(['id' => $draftSection->id])
            ->assertJsonMissing(['id' => $draftLesson->id]);
    }

    /**
     * @return array{Tenant, Course, CourseModule, CourseSection, CourseModule, CourseSection, CourseLesson, CourseLesson}
     */
    private function modulesFixture(): array
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');

        $course = Course::create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $admin->id,
            'title' => 'Public Modules Course',
            'slug' => 'public-modules-course-'.uniqid(),
            'status' => 'published',
            'visibility' => 'public',
            'pricing_type' => 'free',
        ]);

        CourseAccessRule::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'access_mode' => 'enrolled_only',
            'requires_approval' => false,
            'allow_self_enrollment' => false,
            'invite_only' => false,
            'metadata' => [],
        ]);

        $publishedModule = CourseModule::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'title' => 'Published Module',
            'slug' => 'published-module-'.uniqid(),
            'order' => 1,
            'status' => 'published',
            'is_published' => true,
        ]);

        $unpublishedModule = CourseModule::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'title' => 'Draft Module',
            'slug' => 'draft-module-'.uniqid(),
            'order' => 2,
            'status' => 'draft',
            'is_published' => false,
        ]);

        $publishedSection = CourseSection::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'course_module_id' => $publishedModule->id,
            'title' => 'Published Section',
            'sort_order' => 1,
            'status' => 'published',
            'is_published' => true,
        ]);

        $draftSection = CourseSection::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'course_module_id' => $publishedModule->id,
            'title' => 'Draft Section',
            'sort_order' => 2,
            'status' => 'draft',
            'is_published' => false,
        ]);

        $publishedLesson = CourseLesson::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'course_section_id' => $publishedSection->id,
            'title' => 'Published Lesson',
            'slug' => 'published-lesson-'.uniqid(),
            'type' => 'video',
            'status' => 'published',
            'visibility' => 'enrolled_only',
            'sort_order' => 1,
        ]);

        $draftLesson = CourseLesson::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'course_section_id' => $publishedSection->id,
            'title' => 'Draft Lesson',
            'slug' => 'draft-lesson-'.uniqid(),
            'type' => 'video',
            'status' => 'draft',
            'visibility' => 'enrolled_only',
            'sort_order' => 2,
        ]);

        return [
            $tenant,
            $course->refresh(),
            $publishedModule->refresh(),
            $publishedSection->refresh(),
            $unpublishedModule->refresh(),
            $draftSection->refresh(),
            $publishedLesson->refresh(),
            $draftLesson->refresh(),
        ];
    }

    private function memberWithRole(Tenant $tenant, string $roleSlug): TenantUser
    {
        if (! Role::query()->where('tenant_id', $tenant->id)->exists()) {
            $this->seed(IdentityAccessSeeder::class);
        }

        $this->assertTrue(Permission::query()->where('slug', 'enrollments.view')->exists());

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

    /**
     * @return array<string, string>
     */
    private function tenantHeader(Tenant $tenant): array
    {
        return ['X-Tenant-ID' => (string) $tenant->id];
    }
}
