<?php

namespace Tests\Feature;

use App\Events\Notifications\NotificationCreated;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Notification;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Courses\CourseLessonService;
use App\Services\Learning\EnrollmentService;
use App\Services\Sessions\CourseSessionService;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class ImmediateContentNotificationsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // The sync queue would otherwise run notification jobs inside the test
        // transaction, and their tenant-context middleware clears the binding
        // needed by the notification models during this same request.
        Bus::fake();
    }

    public function test_scheduled_session_immediately_notifies_enrolled_students(): void
    {
        $tenant = Tenant::factory()->create();
        $this->bindTenant($tenant);
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $course = $this->createCourse($tenant, $admin);

        app(EnrollmentService::class)->enrollStudent($tenant, $course, $student, 'active');

        Event::fake([NotificationCreated::class]);

        $session = app(CourseSessionService::class)->create($tenant, $course, $admin, [
            'title' => 'جلسة الأحد',
            'session_type' => 'live',
            'status' => 'scheduled',
            'starts_at_utc' => now()->addDays(2)->toIso8601String(),
            'ends_at_utc' => now()->addDays(2)->addHour()->toIso8601String(),
            'timezone' => 'UTC',
            'meeting_url' => 'https://meet.example.com/lesson',
        ]);

        $notification = Notification::query()
            ->where('tenant_user_id', $student->id)
            ->where('type', 'session.scheduled')
            ->firstOrFail();

        $this->assertSame('unread', $notification->status);
        $this->assertSame('تمت إضافة جلسة جديدة', $notification->title);
        $this->assertSame($session->id, $notification->data['course_session_id']);
        $this->assertDatabaseHas('notification_deliveries', [
            'notification_id' => $notification->id,
            'channel' => 'in_app',
            'status' => 'delivered',
        ]);

        Event::assertDispatched(NotificationCreated::class, function (NotificationCreated $event) use ($tenant, $student, $notification): bool {
            return $event->tenantId === $tenant->id
                && $event->membershipId === $student->id
                && $event->notification['id'] === $notification->id
                && $event->broadcastOn()->name === "private-notifications.tenant.{$tenant->id}.user.{$student->id}";
        });
    }

    public function test_publishing_external_link_immediately_notifies_enrolled_students(): void
    {
        $tenant = Tenant::factory()->create();
        $this->bindTenant($tenant);
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $course = $this->createCourse($tenant, $admin);
        $section = CourseSection::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'title' => 'المحتوى',
            'slug' => 'content',
            'sort_order' => 1,
        ]);

        app(EnrollmentService::class)->enrollStudent($tenant, $course, $student, 'active');

        Event::fake([NotificationCreated::class]);

        $lesson = app(CourseLessonService::class)->create($course, $section, [
            'title' => 'محاضرة خارجية',
            'lesson_type' => 'external',
            'external_url' => 'https://example.com/lecture',
            'status' => 'published',
        ]);

        $notification = Notification::query()
            ->where('tenant_user_id', $student->id)
            ->where('type', 'lesson.published')
            ->firstOrFail();

        $this->assertSame('unread', $notification->status);
        $this->assertSame('تمت إضافة محتوى جديد إلى دورتك', $notification->title);
        $this->assertStringContainsString('محاضرة خارجية', $notification->body);
        $this->assertSame($lesson->id, $notification->data['lesson_id']);
        $this->assertDatabaseHas('notification_deliveries', [
            'notification_id' => $notification->id,
            'channel' => 'in_app',
            'status' => 'delivered',
        ]);

        Event::assertDispatched(NotificationCreated::class, function (NotificationCreated $event) use ($tenant, $student, $notification): bool {
            return $event->membershipId === $student->id
                && $event->notification['id'] === $notification->id;
        });
    }

    public function test_draft_session_stays_silent_until_published(): void
    {
        $tenant = Tenant::factory()->create();
        $this->bindTenant($tenant);
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $course = $this->createCourse($tenant, $admin);

        app(EnrollmentService::class)->enrollStudent($tenant, $course, $student, 'active');

        $service = app(CourseSessionService::class);
        $session = $service->create($tenant, $course, $admin, [
            'title' => 'مسودة',
            'session_type' => 'live',
            'status' => 'draft',
            'starts_at_utc' => now()->addDay()->toIso8601String(),
            'ends_at_utc' => now()->addDay()->addHour()->toIso8601String(),
            'timezone' => 'UTC',
            // Drafts can be created with placeholders, but publishing needs
            // real meeting details. Provide them so the publish step succeeds.
            'meeting_url' => 'https://meet.example.com/draft',
        ]);

        $this->assertSame(0, Notification::query()
            ->where('tenant_user_id', $student->id)
            ->where('type', 'session.scheduled')
            ->count());

        Event::fake([NotificationCreated::class]);
        $service->schedule($tenant, $session->fresh());

        $this->assertSame(1, Notification::query()
            ->where('tenant_user_id', $student->id)
            ->where('type', 'session.scheduled')
            ->count());
    }

    private function createCourse(Tenant $tenant, TenantUser $creator): Course
    {
        return Course::create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $creator->id,
            'title' => 'دورة الإشعارات',
            'slug' => 'notifications-'.uniqid(),
            'status' => 'published',
            'delivery_mode' => 'recorded_and_sessions',
        ]);
    }

    private function memberWithRole(Tenant $tenant, string $roleSlug): TenantUser
    {
        if (! Role::query()->where('tenant_id', $tenant->id)->exists()) {
            $this->seed(IdentityAccessSeeder::class);
        }

        $user = User::factory()->create();
        $membership = TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'status' => 'active',
        ]);
        $role = Role::query()->where('tenant_id', $tenant->id)->where('slug', $roleSlug)->firstOrFail();
        $membership->roles()->attach($role->id, ['tenant_id' => $tenant->id]);

        return $membership->load('user');
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->forgetInstance(Tenant::class);
        app()->forgetInstance('currentTenant');
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
