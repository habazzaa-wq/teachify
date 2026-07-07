<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\LessonFile;
use App\Models\MediaAsset;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Media\MediaLibraryService;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LessonContentModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_video_content_can_be_created_with_media_asset_and_thumbnail(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        [$courseId, $sectionId, $lessonId] = $this->createLessonHierarchy($tenant, $admin, 'video');
        $videoAsset = $this->createMediaAsset($tenant, 'video');
        $thumbnailAsset = $this->createMediaAsset($tenant, 'thumbnail');

        Sanctum::actingAs($admin->user);

        $this->postJson($this->lessonPath($courseId, $sectionId, $lessonId).'/video', [
            'media_asset_id' => $videoAsset->id,
            'thumbnail_media_asset_id' => $thumbnailAsset->id,
            'processing_status' => 'processing',
            'playback_policy' => 'private',
            'metadata' => ['future_playback_id' => 'placeholder'],
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('video.media_asset_id', $videoAsset->id)
            ->assertJsonPath('video.thumbnail_media_asset_id', $thumbnailAsset->id)
            ->assertJsonPath('video.processing_status', 'processing');

        $this->assertDatabaseHas('lesson_videos', [
            'tenant_id' => $tenant->id,
            'course_lesson_id' => $lessonId,
            'media_asset_id' => $videoAsset->id,
        ]);
    }

    public function test_file_content_supports_multiple_files_and_updates_and_deletion(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        [$courseId, $sectionId, $lessonId] = $this->createLessonHierarchy($tenant, $admin, 'file');
        $firstAsset = $this->createMediaAsset($tenant, 'document');
        $secondAsset = $this->createMediaAsset($tenant, 'archive');

        Sanctum::actingAs($admin->user);

        $firstFileId = $this->postJson($this->lessonPath($courseId, $sectionId, $lessonId).'/files', [
            'media_asset_id' => $firstAsset->id,
            'title' => 'Workbook PDF',
            'description' => 'Downloadable workbook.',
            'download_enabled' => true,
            'sort_order' => 1,
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('file.title', 'Workbook PDF')
            ->json('file.id');

        $secondFileId = $this->postJson($this->lessonPath($courseId, $sectionId, $lessonId).'/files', [
            'media_asset_id' => $secondAsset->id,
            'title' => 'Resources ZIP',
            'download_enabled' => false,
            'sort_order' => 2,
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('file.id');

        $this->getJson($this->lessonPath($courseId, $sectionId, $lessonId).'/files', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('files.0.id', $firstFileId)
            ->assertJsonPath('files.1.id', $secondFileId);

        $this->patchJson($this->lessonPath($courseId, $sectionId, $lessonId)."/files/{$firstFileId}", [
            'title' => 'Updated Workbook',
            'download_enabled' => false,
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('file.title', 'Updated Workbook')
            ->assertJsonPath('file.download_enabled', false);

        $this->deleteJson($this->lessonPath($courseId, $sectionId, $lessonId)."/files/{$secondFileId}", [], $this->tenantHeader($tenant))
            ->assertOk();

        $this->assertDatabaseMissing('lesson_files', ['id' => $secondFileId]);
    }

    public function test_text_content_can_be_created_updated_and_deleted(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        [$courseId, $sectionId, $lessonId] = $this->createLessonHierarchy($tenant, $admin, 'text');

        Sanctum::actingAs($admin->user);

        $this->postJson($this->lessonPath($courseId, $sectionId, $lessonId).'/text', [
            'body' => '# Introduction',
            'format' => 'markdown',
            'metadata' => ['editor' => 'basic'],
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('text.format', 'markdown');

        $this->putJson($this->lessonPath($courseId, $sectionId, $lessonId).'/text', [
            'body' => '<h1>Introduction</h1>',
            'format' => 'html',
            'metadata' => ['editor' => 'html'],
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('text.format', 'html');

        $this->deleteJson($this->lessonPath($courseId, $sectionId, $lessonId).'/text', [], $this->tenantHeader($tenant))
            ->assertOk();

        $this->assertDatabaseMissing('lesson_texts', [
            'tenant_id' => $tenant->id,
            'course_lesson_id' => $lessonId,
        ]);
    }

    public function test_lesson_content_type_validation_is_enforced(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        [$courseId, $sectionId, $lessonId] = $this->createLessonHierarchy($tenant, $admin, 'video');

        Sanctum::actingAs($admin->user);

        $this->postJson($this->lessonPath($courseId, $sectionId, $lessonId).'/text', [
            'body' => 'Wrong content type.',
            'format' => 'markdown',
        ], $this->tenantHeader($tenant))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['type']);
    }

    public function test_students_cannot_manage_lesson_content(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [$courseId, $sectionId, $lessonId] = $this->createLessonHierarchy($tenant, $admin, 'text');

        Sanctum::actingAs($student->user);

        $this->postJson($this->lessonPath($courseId, $sectionId, $lessonId).'/text', [
            'body' => 'Denied.',
            'format' => 'markdown',
        ], $this->tenantHeader($tenant))->assertForbidden();
    }

    public function test_cross_tenant_media_asset_attachment_fails(): void
    {
        $firstTenant = Tenant::factory()->create();
        $secondTenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($firstTenant, 'admin');
        [$courseId, $sectionId, $lessonId] = $this->createLessonHierarchy($firstTenant, $admin, 'video');
        $foreignAsset = $this->createMediaAsset($secondTenant, 'video');

        Sanctum::actingAs($admin->user);

        $this->postJson($this->lessonPath($courseId, $sectionId, $lessonId).'/video', [
            'media_asset_id' => $foreignAsset->id,
        ], $this->tenantHeader($firstTenant))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['media_asset_id']);
    }

    public function test_content_hierarchy_validation_rejects_mismatched_nested_resources(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        [$courseId, $sectionId, $lessonId] = $this->createLessonHierarchy($tenant, $admin, 'file');
        $otherSectionId = $this->createSection($tenant, $courseId, 'Other Section', 2);
        $asset = $this->createMediaAsset($tenant, 'document');

        Sanctum::actingAs($admin->user);

        $fileId = $this->postJson($this->lessonPath($courseId, $sectionId, $lessonId).'/files', [
            'media_asset_id' => $asset->id,
            'title' => 'Valid File',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('file.id');

        $this->patchJson($this->lessonPath($courseId, $otherSectionId, $lessonId)."/files/{$fileId}", [
            'title' => 'Invalid hierarchy',
        ], $this->tenantHeader($tenant))
            ->assertNotFound();
    }

    private function createLessonHierarchy(Tenant $tenant, TenantUser $manager, string $lessonType): array
    {
        $courseId = $this->createCourse($tenant, $manager, ucfirst($lessonType).' Content Course');
        $sectionId = $this->createSection($tenant, $courseId, ucfirst($lessonType).' Content Section', 1);
        $lessonId = $this->createLesson($tenant, $courseId, $sectionId, ucfirst($lessonType).' Content Lesson', $lessonType);

        return [$courseId, $sectionId, $lessonId];
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

    private function createLesson(Tenant $tenant, int $courseId, int $sectionId, string $title, string $type): int
    {
        return $this->postJson("/api/v1/courses/{$courseId}/sections/{$sectionId}/lessons", [
            'title' => $title,
            'slug' => str($title)->slug()->toString(),
            'type' => $type,
            'visibility' => 'private',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('lesson.id');
    }

    private function createMediaAsset(Tenant $tenant, string $type): MediaAsset
    {
        $this->bindTenant($tenant);

        return app(MediaLibraryService::class)->createAsset($tenant, [
            'provider' => 'bunny',
            'provider_service' => $type === 'video' ? 'stream' : 'storage',
            'type' => $type,
            'status' => 'ready',
            'visibility' => 'private',
            'storage_key' => "tenants/{$tenant->id}/assets/{$type}",
            'metadata' => [],
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

    private function bindTenant(Tenant $tenant): void
    {
        app()->forgetInstance(Tenant::class);
        app()->forgetInstance('currentTenant');
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }

    private function lessonPath(int $courseId, int $sectionId, int $lessonId): string
    {
        return "/api/v1/courses/{$courseId}/sections/{$sectionId}/lessons/{$lessonId}";
    }

    /**
     * @return array<string, string>
     */
    private function tenantHeader(Tenant $tenant): array
    {
        return ['X-Tenant-ID' => (string) $tenant->id];
    }
}
