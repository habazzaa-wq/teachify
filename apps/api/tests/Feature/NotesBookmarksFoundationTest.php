<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\LessonBookmark;
use App\Models\LessonNote;
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

class NotesBookmarksFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_crud_own_lesson_notes(): void
    {
        [$tenant, $admin, $student, $lesson, $asset] = $this->lessonFixture();
        $this->enroll($tenant, $lesson->course, $student);
        Sanctum::actingAs($student->user);

        $noteId = $this->postJson("/api/v1/lessons/{$lesson->id}/notes", [
            'media_asset_id' => $asset->id,
            'timestamp_seconds' => 42,
            'title' => 'Key moment',
            'body' => 'Remember this explanation.',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('note.title', 'Key moment')
            ->assertJsonPath('note.timestamp_seconds', 42)
            ->json('note.id');

        $this->getJson("/api/v1/lessons/{$lesson->id}/notes", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('notes.0.id', $noteId);

        $this->putJson("/api/v1/lessons/{$lesson->id}/notes/{$noteId}", [
            'title' => 'Updated moment',
            'body' => 'Updated note body.',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('note.title', 'Updated moment')
            ->assertJsonPath('note.body', 'Updated note body.');

        $this->deleteJson("/api/v1/lessons/{$lesson->id}/notes/{$noteId}", [], $this->tenantHeader($tenant))
            ->assertOk();

        $this->assertDatabaseMissing('lesson_notes', ['id' => $noteId]);
    }

    public function test_student_can_crud_own_lesson_bookmarks(): void
    {
        [$tenant, $admin, $student, $lesson, $asset] = $this->lessonFixture();
        $this->enroll($tenant, $lesson->course, $student);
        Sanctum::actingAs($student->user);

        $bookmarkId = $this->postJson("/api/v1/lessons/{$lesson->id}/bookmarks", [
            'media_asset_id' => $asset->id,
            'timestamp_seconds' => 88,
            'label' => 'Review later',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('bookmark.label', 'Review later')
            ->json('bookmark.id');

        $this->getJson("/api/v1/lessons/{$lesson->id}/bookmarks", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('bookmarks.0.id', $bookmarkId);

        $this->putJson("/api/v1/lessons/{$lesson->id}/bookmarks/{$bookmarkId}", [
            'timestamp_seconds' => 91,
            'label' => 'Exam review',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('bookmark.timestamp_seconds', 91)
            ->assertJsonPath('bookmark.label', 'Exam review');

        $this->deleteJson("/api/v1/lessons/{$lesson->id}/bookmarks/{$bookmarkId}", [], $this->tenantHeader($tenant))
            ->assertOk();

        $this->assertDatabaseMissing('lesson_bookmarks', ['id' => $bookmarkId]);
    }

    public function test_notes_and_bookmarks_are_student_owned(): void
    {
        [$tenant, $admin, $firstStudent, $lesson] = $this->lessonFixture();
        $secondStudent = $this->memberWithRole($tenant, 'student');
        $this->enroll($tenant, $lesson->course, $firstStudent);
        $this->enroll($tenant, $lesson->course, $secondStudent);
        $this->bindTenant($tenant);

        $note = LessonNote::create([
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $firstStudent->id,
            'course_id' => $lesson->course_id,
            'course_section_id' => $lesson->course_section_id,
            'course_lesson_id' => $lesson->id,
            'body' => 'Private note',
        ]);

        $bookmark = LessonBookmark::create([
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $firstStudent->id,
            'course_id' => $lesson->course_id,
            'course_section_id' => $lesson->course_section_id,
            'course_lesson_id' => $lesson->id,
            'label' => 'Private bookmark',
        ]);

        Sanctum::actingAs($secondStudent->user);

        $this->getJson("/api/v1/lessons/{$lesson->id}/notes", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(0, 'notes');

        $this->putJson("/api/v1/lessons/{$lesson->id}/notes/{$note->id}", [
            'body' => 'Attempted update',
        ], $this->tenantHeader($tenant))
            ->assertUnprocessable();

        $this->getJson("/api/v1/lessons/{$lesson->id}/bookmarks", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(0, 'bookmarks');

        $this->deleteJson("/api/v1/lessons/{$lesson->id}/bookmarks/{$bookmark->id}", [], $this->tenantHeader($tenant))
            ->assertUnprocessable();
    }

    public function test_tenant_isolation_is_enforced(): void
    {
        [$firstTenant, $admin, $student, $lesson] = $this->lessonFixture();
        $secondTenant = Tenant::factory()->create();
        $secondStudent = $this->memberWithRole($secondTenant, 'student');

        Sanctum::actingAs($secondStudent->user);

        $this->getJson("/api/v1/lessons/{$lesson->id}/notes", $this->tenantHeader($secondTenant))
            ->assertNotFound();

        $this->postJson("/api/v1/lessons/{$lesson->id}/bookmarks", [
            'label' => 'Cross tenant',
        ], $this->tenantHeader($secondTenant))
            ->assertNotFound();
    }

    public function test_lesson_access_is_required_and_staff_cannot_read_student_notes_by_default(): void
    {
        [$tenant, $admin, $student, $lesson] = $this->lessonFixture();

        Sanctum::actingAs($student->user);

        $this->postJson("/api/v1/lessons/{$lesson->id}/notes", [
            'body' => 'No enrollment',
        ], $this->tenantHeader($tenant))
            ->assertForbidden();

        Sanctum::actingAs($admin->user);

        $this->getJson("/api/v1/lessons/{$lesson->id}/notes", $this->tenantHeader($tenant))
            ->assertForbidden();
    }

    /**
     * @return array{Tenant, TenantUser, TenantUser, CourseLesson, MediaAsset}
     */
    private function lessonFixture(): array
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);

        $course = Course::create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $admin->id,
            'title' => 'Notes Course',
            'slug' => 'notes-course-'.uniqid(),
            'status' => 'published',
            'visibility' => 'enrolled_only',
            'pricing_type' => 'free',
        ]);

        $section = CourseSection::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'title' => 'Notes Section',
            'sort_order' => 1,
            'status' => 'published',
            'is_published' => true,
        ]);

        $lesson = CourseLesson::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'title' => 'Notes Lesson',
            'slug' => 'notes-lesson-'.uniqid(),
            'type' => 'video',
            'status' => 'published',
            'visibility' => 'enrolled_only',
            'sort_order' => 1,
            'duration_seconds' => 120,
        ]);

        $asset = MediaAsset::create([
            'tenant_id' => $tenant->id,
            'provider' => 'bunny',
            'provider_service' => 'stream',
            'type' => 'video',
            'status' => 'ready',
            'visibility' => 'private',
            'external_id' => 'video-'.uniqid(),
            'metadata' => [],
        ]);

        return [$tenant, $admin, $student, $lesson->refresh(), $asset->refresh()];
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
