<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ArchiveRestoreModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_archived_section_can_be_restored_to_published(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');

        Sanctum::actingAs($admin->user);

        $courseId = $this->postJson('/api/v1/courses', [
            'title' => 'Restore Section Course',
            'slug' => 'restore-section-course',
        ], $this->tenantHeader($tenant))->assertCreated()->json('data.id');

        $sectionId = $this->postJson("/api/v1/courses/{$courseId}/sections", [
            'title' => 'Archivable Section',
            'sort_order' => 1,
        ], $this->tenantHeader($tenant))->assertCreated()->json('data.id');

        $this->patchJson("/api/v1/courses/{$courseId}/sections/{$sectionId}/archive", [], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.status', 'archived')
            ->assertJsonPath('data.published', false);

        $this->postJson("/api/v1/courses/{$courseId}/sections/{$sectionId}/restore", [], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.status', 'published')
            ->assertJsonPath('data.published', true);

        $this->assertDatabaseHas('course_sections', [
            'id' => $sectionId,
            'tenant_id' => $tenant->id,
            'status' => 'published',
            'is_published' => true,
        ]);
    }

    public function test_archived_lesson_can_be_restored_to_published(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');

        Sanctum::actingAs($admin->user);

        $courseId = $this->postJson('/api/v1/courses', [
            'title' => 'Restore Lesson Course',
            'slug' => 'restore-lesson-course',
        ], $this->tenantHeader($tenant))->assertCreated()->json('data.id');

        $sectionId = $this->postJson("/api/v1/courses/{$courseId}/sections", [
            'title' => 'Lesson Section',
            'sort_order' => 1,
        ], $this->tenantHeader($tenant))->assertCreated()->json('data.id');

        $lessonId = $this->postJson("/api/v1/courses/{$courseId}/sections/{$sectionId}/lessons", [
            'title' => 'Archivable Lesson',
            'slug' => 'archivable-lesson',
            'lesson_type' => 'video',
        ], $this->tenantHeader($tenant))->assertCreated()->json('data.id');

        $this->patchJson("/api/v1/courses/{$courseId}/sections/{$sectionId}/lessons/{$lessonId}/archive", [], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.status', 'archived');

        $this->postJson("/api/v1/courses/{$courseId}/sections/{$sectionId}/lessons/{$lessonId}/restore", [], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.status', 'published');

        $this->assertDatabaseHas('course_lessons', [
            'id' => $lessonId,
            'tenant_id' => $tenant->id,
            'status' => 'published',
        ]);
    }

    public function test_archived_exam_can_be_restored_to_published(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');

        Sanctum::actingAs($admin->user);

        $examId = $this->postJson('/api/v1/exam-bank/exams', [
            'title' => 'Archivable Exam',
            'description' => 'Exam description.',
            'duration' => 60,
            'passing_score' => 60,
            'attempt_limit' => 1,
            'question_count' => 10,
        ], $this->tenantHeader($tenant))->assertCreated()->json('data.id');

        $this->patchJson("/api/v1/exam-bank/exams/{$examId}/archive", [], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.status', 'archived');

        $this->postJson("/api/v1/exam-bank/exams/{$examId}/restore", [], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.status', 'published');

        $this->assertDatabaseHas('exams', [
            'id' => $examId,
            'tenant_id' => $tenant->id,
            'status' => 'published',
            'archived_at' => null,
        ]);
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
