<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\DiscussionPost;
use App\Models\DiscussionThread;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Discussions\DiscussionModerationService;
use App\Services\Discussions\DiscussionThreadService;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DiscussionsFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_members_can_create_list_and_view_general_threads(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);

        Sanctum::actingAs($student->user);

        $threadId = $this->postJson('/api/v1/discussions', [
            'title' => 'Welcome thread',
            'type' => 'general',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('thread.type', 'general')
            ->assertJsonPath('thread.status', 'active')
            ->assertJsonPath('thread.is_locked', false)
            ->assertJsonPath('thread.is_pinned', false)
            ->json('thread.id');

        $this->getJson('/api/v1/discussions', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(1, 'threads')
            ->assertJsonPath('threads.0.id', $threadId);

        $this->getJson("/api/v1/discussions/{$threadId}", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('thread.title', 'Welcome thread');
    }

    public function test_members_can_post_threaded_replies_and_edit_only_their_own_posts(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $otherStudent = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);
        $thread = $this->createThread($tenant, $student, 'general');

        Sanctum::actingAs($student->user);

        $postId = $this->postJson("/api/v1/discussions/{$thread->id}/posts", [
            'body' => 'First post',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('post.status', 'active')
            ->json('post.id');

        $this->postJson("/api/v1/discussions/{$thread->id}/posts", [
            'body' => 'Reply to first',
            'parent_post_id' => $postId,
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('post.parent_post_id', $postId);

        $this->putJson("/api/v1/discussions/{$thread->id}/posts/{$postId}", [
            'body' => 'Edited body',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('post.body', 'Edited body');

        $this->assertNotNull(DiscussionPost::query()->whereKey($postId)->value('edited_at'));

        // Another student may not edit someone else's post.
        Sanctum::actingAs($otherStudent->user);

        $this->putJson("/api/v1/discussions/{$thread->id}/posts/{$postId}", [
            'body' => 'Hijacked',
        ], $this->tenantHeader($tenant))->assertForbidden();
    }

    public function test_locked_thread_blocks_new_posts_except_for_moderators(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);
        $thread = $this->createThread($tenant, $student, 'general');

        Sanctum::actingAs($admin->user);
        $this->patchJson("/api/v1/discussions/{$thread->id}/lock", [], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('thread.is_locked', true);

        Sanctum::actingAs($student->user);
        $this->postJson("/api/v1/discussions/{$thread->id}/posts", [
            'body' => 'Blocked by lock',
        ], $this->tenantHeader($tenant))->assertForbidden();

        // Moderators can still post even when locked.
        Sanctum::actingAs($admin->user);
        $this->postJson("/api/v1/discussions/{$thread->id}/posts", [
            'body' => 'Moderator note',
        ], $this->tenantHeader($tenant))->assertCreated();
    }

    public function test_archived_thread_is_read_only(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);
        $thread = $this->createThread($tenant, $student, 'general');

        Sanctum::actingAs($admin->user);
        $this->patchJson("/api/v1/discussions/{$thread->id}/archive", [], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('thread.status', 'archived');

        // Archived threads are excluded from the default listing.
        $this->getJson('/api/v1/discussions', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(0, 'threads');

        Sanctum::actingAs($student->user);
        $this->postJson("/api/v1/discussions/{$thread->id}/posts", [
            'body' => 'Blocked by archive',
        ], $this->tenantHeader($tenant))->assertForbidden();
    }

    public function test_owners_admins_pin_unpin_and_update_threads(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);
        $thread = $this->createThread($tenant, $student, 'general');

        Sanctum::actingAs($student->user);
        $this->patchJson("/api/v1/discussions/{$thread->id}/pin", [], $this->tenantHeader($tenant))
            ->assertForbidden();

        Sanctum::actingAs($admin->user);
        $this->patchJson("/api/v1/discussions/{$thread->id}/pin", [], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('thread.is_pinned', true);

        $this->patchJson("/api/v1/discussions/{$thread->id}/unpin", [], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('thread.is_pinned', false);

        $this->putJson("/api/v1/discussions/{$thread->id}", [
            'title' => 'Renamed',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('thread.title', 'Renamed');
    }

    public function test_course_thread_requires_course_visibility_access(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);
        [$course] = $this->privateCourseStack($tenant, $admin);
        $thread = $this->createThread($tenant, $admin, 'course', ['course_id' => $course->id]);

        // Student without course visibility cannot view the private course thread.
        Sanctum::actingAs($student->user);
        $this->getJson("/api/v1/discussions/{$thread->id}", $this->tenantHeader($tenant))->assertForbidden();

        // Make the course public so the student gains visibility access.
        Course::withoutGlobalScopes()->whereKey($course->id)->update(['visibility' => 'public']);

        $this->getJson("/api/v1/discussions/{$thread->id}", $this->tenantHeader($tenant))->assertOk();
    }

    public function test_lesson_thread_requires_lesson_access(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Lesson Discussion');
        $thread = $this->createThread($tenant, $admin, 'lesson', [
            'course_id' => $course,
            'course_section_id' => $section,
            'course_lesson_id' => $lesson,
        ]);

        // Admin moderator can view and post.
        Sanctum::actingAs($admin->user);
        $this->getJson("/api/v1/discussions/{$thread->id}", $this->tenantHeader($tenant))->assertOk();
    }

    public function test_moderation_hides_restores_posts_and_students_cannot_see_hidden(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);
        $thread = $this->createThread($tenant, $student, 'general');

        Sanctum::actingAs($student->user);
        $postId = $this->postJson("/api/v1/discussions/{$thread->id}/posts", [
            'body' => 'To be hidden',
        ], $this->tenantHeader($tenant))->assertCreated()->json('post.id');

        // Student sees the active post.
        $this->getJson("/api/v1/discussions/{$thread->id}/posts", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(1, 'posts');

        Sanctum::actingAs($admin->user);
        app(DiscussionModerationService::class)->hidePost($tenant, DiscussionPost::query()->whereKey($postId)->firstOrFail(), $admin);

        // Student no longer sees the hidden post.
        Sanctum::actingAs($student->user);
        $this->getJson("/api/v1/discussions/{$thread->id}/posts", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(0, 'posts');

        // Moderator still sees the hidden post.
        Sanctum::actingAs($admin->user);
        $this->getJson("/api/v1/discussions/{$thread->id}/posts", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(1, 'posts');

        app(DiscussionModerationService::class)->restorePost($tenant, DiscussionPost::query()->whereKey($postId)->firstOrFail(), $admin);

        Sanctum::actingAs($student->user);
        $this->getJson("/api/v1/discussions/{$thread->id}/posts", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(1, 'posts');
    }

    public function test_reports_protect_reporter_identity_and_only_operators_review(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);
        $thread = $this->createThread($tenant, $student, 'general');

        Sanctum::actingAs($student->user);
        $postId = $this->postJson("/api/v1/discussions/{$thread->id}/posts", [
            'body' => 'Reported content',
        ], $this->tenantHeader($tenant))->assertCreated()->json('post.id');

        $reportId = $this->postJson("/api/v1/discussions/posts/{$postId}/report", [
            'reason' => 'spam',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonMissing(['reported_by_tenant_user_id'])
            ->json('report.id');

        // Students cannot list reports.
        $this->getJson('/api/v1/discussions/reports', $this->tenantHeader($tenant))->assertForbidden();

        Sanctum::actingAs($admin->user);
        $this->getJson('/api/v1/discussions/reports', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('reports.0.id', $reportId)
            ->assertJsonPath('reports.0.status', 'pending');

        $this->patchJson("/api/v1/discussions/reports/{$reportId}/resolve", [], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('report.status', 'resolved')
            ->assertJsonPath('report.reviewed_by_tenant_user_id', $admin->id);

        // Already-reviewed reports cannot be reviewed again.
        $this->patchJson("/api/v1/discussions/reports/{$reportId}/dismiss", [], $this->tenantHeader($tenant))
            ->assertStatus(422);
    }

    public function test_cross_tenant_access_returns_404(): void
    {
        $firstTenant = Tenant::factory()->create();
        $secondTenant = Tenant::factory()->create();
        $firstStudent = $this->memberWithRole($firstTenant, 'student');
        $secondStudent = $this->memberWithRole($secondTenant, 'student');
        $this->bindTenant($firstTenant);
        $thread = $this->createThread($firstTenant, $firstStudent, 'general');

        Sanctum::actingAs($secondStudent->user);

        $this->getJson("/api/v1/discussions/{$thread->id}", $this->tenantHeader($secondTenant))
            ->assertNotFound();

        $this->postJson("/api/v1/discussions/{$thread->id}/posts", [
            'body' => 'Cross tenant',
        ], $this->tenantHeader($secondTenant))->assertNotFound();
    }

    public function test_post_creation_touches_thread_last_activity(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);
        $thread = $this->createThread($tenant, $student, 'general');
        $original = $thread->last_activity_at;

        $this->travel(5)->minutes();

        Sanctum::actingAs($student->user);
        $this->postJson("/api/v1/discussions/{$thread->id}/posts", [
            'body' => 'New activity',
        ], $this->tenantHeader($tenant))->assertCreated();

        $this->assertGreaterThan(
            $original,
            DiscussionThread::query()->whereKey($thread->id)->value('last_activity_at'),
        );
    }

    public function test_participant_tracking_records_unread_state(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);
        $thread = $this->createThread($tenant, $student, 'general');

        Sanctum::actingAs($student->user);
        $this->postJson("/api/v1/discussions/{$thread->id}/posts", [
            'body' => 'Mine',
        ], $this->tenantHeader($tenant))->assertCreated();

        $this->assertDatabaseHas('discussion_participants', [
            'tenant_id' => $tenant->id,
            'discussion_thread_id' => $thread->id,
            'tenant_user_id' => $student->id,
        ]);
    }

    private function createThread(Tenant $tenant, TenantUser $creator, string $type, array $extra = []): DiscussionThread
    {
        $this->bindTenant($tenant);

        return app(DiscussionThreadService::class)->create(
            $tenant,
            $creator,
            array_merge([
                'title' => 'Thread '.uniqid(),
                'type' => $type,
            ], $extra),
        )->refresh();
    }

    /**
     * @return array{0:int,1:int,2:int}
     */
    private function publishedLessonStack(Tenant $tenant, TenantUser $manager, string $title): array
    {
        Sanctum::actingAs($manager->user);

        $course = $this->postJson('/api/v1/courses', [
            'title' => "{$title} Course",
            'slug' => str("{$title} Course")->slug()->toString(),
        ], $this->tenantHeader($tenant))->assertCreated()->json('data.id');

        Course::withoutGlobalScopes()->whereKey($course)->update(['status' => 'published', 'visibility' => 'public']);

        $section = $this->postJson("/api/v1/courses/{$course}/sections", [
            'title' => "{$title} Section",
            'sort_order' => 1,
        ], $this->tenantHeader($tenant))->assertCreated()->json('data.id');

        CourseSection::withoutGlobalScopes()->whereKey($section)->update(['status' => 'published', 'is_published' => true]);

        $lesson = $this->postJson("/api/v1/courses/{$course}/sections/{$section}/lessons", [
            'title' => "{$title} Lesson",
            'slug' => str("{$title} Lesson")->slug()->toString(),
            'lesson_type' => 'video',
            'visibility' => 'public',
        ], $this->tenantHeader($tenant))->assertCreated()->json('data.id');

        CourseLesson::withoutGlobalScopes()->whereKey($lesson)->update(['status' => 'published']);

        $this->bindTenant($tenant);

        return [$course, $section, $lesson];
    }

    /**
     * @return array{0:Course,1:int,2:int}
     */
    private function privateCourseStack(Tenant $tenant, TenantUser $manager): array
    {
        Sanctum::actingAs($manager->user);

        $course = $this->postJson('/api/v1/courses', [
            'title' => 'Private Discussion Course',
            'slug' => str('Private Discussion Course')->slug()->toString(),
        ], $this->tenantHeader($tenant))->assertCreated()->json('data.id');

        Course::withoutGlobalScopes()->whereKey($course)->update(['status' => 'published', 'visibility' => 'private']);

        $this->bindTenant($tenant);

        return [
            Course::withoutGlobalScopes()->whereKey($course)->firstOrFail(),
            0,
            0,
        ];
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

        if (! Permission::query()->where('slug', 'courses.view')->exists()) {
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

    /**
     * @return array<string, string>
     */
    private function tenantHeader(Tenant $tenant): array
    {
        return ['X-Tenant-ID' => (string) $tenant->id];
    }
}
