<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseAccessRule;
use App\Models\CourseEnrollment;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\LessonVideo;
use App\Models\MediaAsset;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantIntegration;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PublicCourseLessonVideoTest extends TestCase
{
    use RefreshDatabase;

    public function test_enrolled_student_can_fetch_lesson_video_playback_data(): void
    {
        [$tenant, $admin, $student, $course, $section, $lesson, $asset] = $this->publicVideoFixture();
        $this->enroll($tenant, $course, $student);

        Sanctum::actingAs($student->user);

        $this->getJson(
            "/api/v1/public/courses/{$course->slug}/lessons/{$lesson->id}/video",
            $this->tenantHeader($tenant),
        )
            ->assertOk()
            ->assertJsonStructure(['data' => ['lesson', 'video']])
            ->assertJsonPath('data.lesson.id', (string) $lesson->id)
            ->assertJsonPath('data.video.video_id', 'bunny-video-'.$tenant->id)
            ->assertJsonPath('data.video.library_id', 'bunny-library-'.$tenant->id)
            ->assertJsonPath(
                'data.video.embed_url',
                'https://iframe.mediadelivery.net/embed/bunny-library-'.$tenant->id.'/bunny-video-'.$tenant->id,
            )
            ->assertJsonPath('data.video.playback_url', 'https://stream.example.test/'.$asset->external_id.'/playlist.m3u8')
            ->assertJsonPath('data.video.thumbnail_url', 'https://cdn.example.test/thumb.jpg')
            ->assertJsonPath('data.video.duration_seconds', 100)
            ->assertJsonPath('data.video.status', 'ready');
    }

    public function test_free_preview_lesson_is_available_to_guests_without_a_token(): void
    {
        [$tenant, $admin, $student, $course, $section, $lesson, $asset] = $this->publicVideoFixture();
        $lesson->forceFill(['free_preview' => true, 'visibility' => 'preview'])->save();

        $this->getJson(
            "/api/v1/public/courses/{$course->slug}/lessons/{$lesson->id}/video",
            $this->tenantHeader($tenant),
        )
            ->assertOk()
            ->assertJsonPath('data.video.status', 'ready');
    }

    public function test_locked_lesson_is_denied_for_guests_without_a_token(): void
    {
        [$tenant, $admin, $student, $course, $section, $lesson, $asset] = $this->publicVideoFixture();

        $this->getJson(
            "/api/v1/public/courses/{$course->slug}/lessons/{$lesson->id}/video",
            $this->tenantHeader($tenant),
        )
            ->assertForbidden();
    }

    public function test_non_video_lesson_is_rejected(): void
    {
        [$tenant, $admin, $student, $course, $section, $lesson, $asset] = $this->publicVideoFixture();
        $lesson->forceFill(['type' => 'text', 'lesson_type' => 'text'])->save();

        $this->getJson(
            "/api/v1/public/courses/{$course->slug}/lessons/{$lesson->id}/video",
            $this->tenantHeader($tenant),
        )
            ->assertUnprocessable();
    }

    public function test_non_public_course_is_not_found(): void
    {
        [$tenant, $admin, $student, $course, $section, $lesson, $asset] = $this->publicVideoFixture();
        $course->forceFill(['visibility' => 'enrolled_only'])->save();

        $this->getJson(
            "/api/v1/public/courses/{$course->slug}/lessons/{$lesson->id}/video",
            $this->tenantHeader($tenant),
        )
            ->assertNotFound();
    }

    public function test_cross_tenant_lesson_is_not_found(): void
    {
        [$tenant, $admin, $student, $course, $section, $lesson, $asset] = $this->publicVideoFixture();
        $otherTenant = Tenant::factory()->create();

        $this->getJson(
            "/api/v1/public/courses/{$course->slug}/lessons/{$lesson->id}/video",
            $this->tenantHeader($otherTenant),
        )
            ->assertNotFound();
    }

    /**
     * @return array{Tenant, TenantUser, TenantUser, Course, CourseSection, CourseLesson, MediaAsset}
     */
    private function publicVideoFixture(): array
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $this->createBunnyStreamIntegration($tenant);

        $course = Course::create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $admin->id,
            'title' => 'Public Playback Course',
            'slug' => 'public-playback-course-'.uniqid(),
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

        $section = CourseSection::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'title' => 'Public Playback Section',
            'sort_order' => 1,
            'status' => 'published',
            'is_published' => true,
        ]);

        $lesson = CourseLesson::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'title' => 'Public Playback Lesson',
            'slug' => 'public-playback-lesson-'.uniqid(),
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
            'external_id' => 'external-video-'.uniqid(),
            'bunny_video_id' => 'bunny-video-'.$tenant->id,
            'bunny_library_id' => 'bunny-library-'.$tenant->id,
            'metadata' => [
                'bunny_video_id' => 'bunny-video-'.$tenant->id,
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

        return [$tenant, $admin, $student, $course->refresh(), $section->refresh(), $lesson->refresh(), $asset->refresh()];
    }

    private function enroll(Tenant $tenant, Course $course, TenantUser $student): CourseEnrollment
    {
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
