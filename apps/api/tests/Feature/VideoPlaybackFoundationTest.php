<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseAccessRule;
use App\Models\CourseEnrollment;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\LessonAccessRule;
use App\Models\LessonProgress;
use App\Models\LessonVideo;
use App\Models\MediaAsset;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantIntegration;
use App\Models\TenantUser;
use App\Models\User;
use App\Models\VideoPlaybackSession;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VideoPlaybackFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_enrolled_student_can_start_playback_and_receive_metadata(): void
    {
        [$tenant, $admin, $student, $asset] = $this->playbackFixture();
        $this->enroll($tenant, $asset->lessonVideos()->first()->lesson->course, $student);

        Sanctum::actingAs($student->user);

        $this->postJson("/api/v1/videos/{$asset->id}/play", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonStructure(['playback_session_token', 'playback', 'expires_at'])
            ->assertJsonPath('playback.video_id', $asset->external_id)
            ->assertJsonPath('playback.playback_url', 'https://stream.example.test/'.$asset->external_id.'/playlist.m3u8')
            ->assertJsonPath('playback.thumbnail_url', 'https://cdn.example.test/thumb.jpg')
            ->assertJsonPath('playback.duration_seconds', 100);

        $this->assertDatabaseHas('video_playback_sessions', [
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $student->id,
            'media_asset_id' => $asset->id,
            'status' => 'active',
        ]);
    }

    public function test_instructor_and_tenant_owner_can_start_playback_for_manageable_course(): void
    {
        [$tenant, $admin, $student, $asset, $course] = $this->playbackFixture();
        $instructor = $this->memberWithRole($tenant, 'instructor');
        $owner = $this->memberWithRole($tenant, 'tenant_owner');
        $this->bindTenant($tenant);
        $course->forceFill(['primary_instructor_tenant_user_id' => $instructor->id])->save();

        Sanctum::actingAs($instructor->user);
        $this->postJson("/api/v1/videos/{$asset->id}/play", [], $this->tenantHeader($tenant))
            ->assertCreated();

        Sanctum::actingAs($owner->user);
        $this->postJson("/api/v1/videos/{$asset->id}/play", [], $this->tenantHeader($tenant))
            ->assertCreated();
    }

    public function test_student_playback_requires_active_enrollment(): void
    {
        [$tenant, $admin, $student, $asset] = $this->playbackFixture();

        Sanctum::actingAs($student->user);

        $this->postJson("/api/v1/videos/{$asset->id}/play", [], $this->tenantHeader($tenant))
            ->assertForbidden();
    }

    public function test_access_rules_are_enforced_for_playback(): void
    {
        [$tenant, $admin, $student, $asset, $course, $section, $lesson] = $this->playbackFixture();
        $this->enroll($tenant, $course, $student);
        $this->bindTenant($tenant);
        LessonAccessRule::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'course_lesson_id' => $lesson->id,
            'access_mode' => 'scheduled',
            'available_from' => now()->addDay(),
            'available_until' => null,
            'prerequisite_lesson_id' => null,
            'metadata' => [],
        ]);

        Sanctum::actingAs($student->user);

        $this->postJson("/api/v1/videos/{$asset->id}/play", [], $this->tenantHeader($tenant))
            ->assertForbidden();
    }

    public function test_unpublished_and_archived_content_is_denied(): void
    {
        [$tenant, $admin, $student, $asset, $course, $section, $lesson] = $this->playbackFixture();
        $this->enroll($tenant, $course, $student);
        $this->bindTenant($tenant);

        $lesson->forceFill(['status' => 'draft'])->save();
        Sanctum::actingAs($student->user);
        $this->postJson("/api/v1/videos/{$asset->id}/play", [], $this->tenantHeader($tenant))
            ->assertForbidden();

        $lesson->forceFill(['status' => 'published'])->save();
        $course->forceFill(['status' => 'archived'])->save();
        $this->postJson("/api/v1/videos/{$asset->id}/play", [], $this->tenantHeader($tenant))
            ->assertForbidden();
    }

    public function test_cross_tenant_asset_playback_is_denied(): void
    {
        [$firstTenant, $admin, $student, $asset] = $this->playbackFixture();
        $secondTenant = Tenant::factory()->create();
        $secondAdmin = $this->memberWithRole($secondTenant, 'admin');

        Sanctum::actingAs($secondAdmin->user);

        $this->postJson("/api/v1/videos/{$asset->id}/play", [], $this->tenantHeader($secondTenant))
            ->assertNotFound();
    }

    public function test_session_expiration_and_close_prevent_reuse(): void
    {
        [$tenant, $admin, $student, $asset, $course] = $this->playbackFixture();
        $this->enroll($tenant, $course, $student);
        Sanctum::actingAs($student->user);

        $token = $this->postJson("/api/v1/videos/{$asset->id}/play", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('playback_session_token');

        VideoPlaybackSession::query()
            ->where('session_token', $token)
            ->update(['expires_at' => now()->subMinute()]);

        $this->postJson("/api/v1/videos/playback/{$token}/progress", [
            'position_seconds' => 10,
        ], $this->tenantHeader($tenant))
            ->assertUnprocessable();

        $token = $this->postJson("/api/v1/videos/{$asset->id}/play", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('playback_session_token');

        $this->postJson("/api/v1/videos/playback/{$token}/close", [], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('playback_session.status', 'closed');

        $this->postJson("/api/v1/videos/playback/{$token}/progress", [
            'position_seconds' => 10,
        ], $this->tenantHeader($tenant))
            ->assertUnprocessable();
    }

    public function test_progress_updates_synchronize_lesson_progress_and_completion(): void
    {
        [$tenant, $admin, $student, $asset, $course, $section, $lesson] = $this->playbackFixture();
        $enrollment = $this->enroll($tenant, $course, $student);
        Sanctum::actingAs($student->user);

        $token = $this->postJson("/api/v1/videos/{$asset->id}/play", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('playback_session_token');

        $this->postJson("/api/v1/videos/playback/{$token}/progress", [
            'position_seconds' => 100,
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('playback_session.last_position_seconds', 100);

        $this->assertDatabaseHas('lesson_progress', [
            'tenant_id' => $tenant->id,
            'course_lesson_id' => $lesson->id,
            'course_enrollment_id' => $enrollment->id,
            'status' => 'completed',
            'progress_percent' => 100,
        ]);

        $this->assertDatabaseHas('course_completions', [
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'course_enrollment_id' => $enrollment->id,
            'completion_percent' => 100,
        ]);
    }

    /**
     * @return array{Tenant, TenantUser, TenantUser, MediaAsset, Course, CourseSection, CourseLesson}
     */
    private function playbackFixture(): array
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $this->createBunnyStreamIntegration($tenant);
        $this->bindTenant($tenant);

        $course = Course::create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $admin->id,
            'title' => 'Playback Course',
            'slug' => 'playback-course-'.uniqid(),
            'status' => 'published',
            'visibility' => 'enrolled_only',
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

        $section = CourseSection::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'title' => 'Playback Section',
            'sort_order' => 1,
            'status' => 'published',
            'is_published' => true,
        ]);

        $lesson = CourseLesson::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'title' => 'Playback Lesson',
            'slug' => 'playback-lesson-'.uniqid(),
            'type' => 'video',
            'status' => 'published',
            'visibility' => 'enrolled_only',
            'sort_order' => 1,
            'duration_seconds' => 100,
        ]);

        $asset = MediaAsset::create([
            'tenant_id' => $tenant->id,
            'provider' => 'bunny',
            'provider_service' => 'stream',
            'type' => 'video',
            'status' => 'ready',
            'visibility' => 'private',
            'external_id' => 'video-'.uniqid(),
            'metadata' => [
                'bunny_video_id' => 'video',
                'collection' => 'tenant-'.$tenant->id,
                'duration_seconds' => 100,
                'available_resolutions' => ['720p', '1080p'],
                'thumbnail_url' => 'https://cdn.example.test/thumb.jpg',
                'preview_url' => null,
                'encoding_status' => 'Ready',
            ],
        ]);

        LessonVideo::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'course_lesson_id' => $lesson->id,
            'media_asset_id' => $asset->id,
            'processing_status' => 'ready',
            'playback_policy' => 'private',
            'metadata' => [],
        ]);

        return [$tenant, $admin, $student, $asset->refresh(), $course->refresh(), $section->refresh(), $lesson->refresh()];
    }

    private function enroll(Tenant $tenant, Course $course, TenantUser $student): CourseEnrollment
    {
        $this->bindTenant($tenant);

        return CourseEnrollment::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'tenant_user_id' => $student->id,
            'status' => 'active',
            'enrolled_at' => now(),
            'started_at' => now(),
            'metadata' => [],
        ])->refresh();
    }

    private function createBunnyStreamIntegration(Tenant $tenant): void
    {
        TenantIntegration::create([
            'tenant_id' => $tenant->id,
            'provider' => 'bunny',
            'service' => 'stream',
            'status' => 'active',
            'config' => [
                'library_id' => 'library-'.$tenant->id,
                'collection_prefix' => 'tenant',
                'pull_zone' => 'stream.example.test',
                'api_region' => 'video',
                'status' => 'active',
            ],
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

        if (! Permission::query()->where('slug', 'enrollments.view')->exists()) {
            $this->fail('Learning permissions were not seeded.');
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
