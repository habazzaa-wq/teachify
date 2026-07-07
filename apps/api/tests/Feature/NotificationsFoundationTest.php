<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Notification;
use App\Models\NotificationTemplate;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Learning\EnrollmentService;
use App\Services\Notifications\NotificationEventService;
use App\Services\Notifications\NotificationService;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationsFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_list_read_and_archive_own_notifications(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);

        $notification = app(NotificationService::class)->create(
            $tenant,
            $student,
            'course.enrolled',
            'Course enrolled',
            'You were enrolled.',
            ['course_id' => 10],
        );

        Sanctum::actingAs($student->user);

        $this->getJson('/api/v1/notifications', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('notifications.0.id', $notification->id);

        $this->getJson('/api/v1/notifications/unread', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(1, 'notifications');

        $this->patchJson("/api/v1/notifications/{$notification->id}/read", [], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('notification.status', 'read');

        $this->patchJson("/api/v1/notifications/{$notification->id}/archive", [], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('notification.status', 'archived');

        $this->assertDatabaseHas('notification_deliveries', [
            'tenant_id' => $tenant->id,
            'notification_id' => $notification->id,
            'channel' => 'in_app',
            'status' => 'delivered',
        ]);
    }

    public function test_notification_ownership_and_tenant_isolation_are_enforced(): void
    {
        $firstTenant = Tenant::factory()->create();
        $secondTenant = Tenant::factory()->create();
        $firstStudent = $this->memberWithRole($firstTenant, 'student');
        $secondStudent = $this->memberWithRole($firstTenant, 'student');
        $secondAdmin = $this->memberWithRole($secondTenant, 'admin');
        $this->bindTenant($firstTenant);

        $notification = app(NotificationService::class)->create(
            $firstTenant,
            $firstStudent,
            'assignment.graded',
            'Assignment graded',
            'Your assignment was graded.',
        );

        Sanctum::actingAs($secondStudent->user);

        $this->getJson('/api/v1/notifications', $this->tenantHeader($firstTenant))
            ->assertOk()
            ->assertJsonCount(0, 'notifications');

        $this->patchJson("/api/v1/notifications/{$notification->id}/read", [], $this->tenantHeader($firstTenant))
            ->assertForbidden();

        Sanctum::actingAs($secondAdmin->user);

        $this->patchJson("/api/v1/notifications/{$notification->id}/read", [], $this->tenantHeader($secondTenant))
            ->assertNotFound();
    }

    public function test_user_can_manage_own_notification_preferences(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');

        Sanctum::actingAs($student->user);

        $this->putJson('/api/v1/notification-preferences', [
            'preferences' => [
                [
                    'notification_type' => 'quiz.passed',
                    'in_app_enabled' => false,
                    'email_enabled' => true,
                ],
            ],
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('preferences.0.notification_type', 'quiz.passed')
            ->assertJsonPath('preferences.0.in_app_enabled', false)
            ->assertJsonPath('preferences.0.email_enabled', true);

        $this->getJson('/api/v1/notification-preferences', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('preferences.0.notification_type', 'quiz.passed');

        $this->bindTenant($tenant);
        $notification = app(NotificationService::class)->create(
            $tenant,
            $student,
            'quiz.passed',
            'Quiz passed',
            'You passed.',
        );

        $this->assertNull($notification);
    }

    public function test_owner_and_admin_can_manage_templates_but_students_cannot(): void
    {
        $tenant = Tenant::factory()->create();
        $owner = $this->memberWithRole($tenant, 'tenant_owner');
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');

        Sanctum::actingAs($owner->user);

        $templateId = $this->postJson('/api/v1/notification-templates', [
            'slug' => 'course_enrolled',
            'name' => 'Course enrolled',
            'channel' => 'in_app',
            'subject' => 'Welcome to {{ course_title }}',
            'body' => 'You are enrolled in {{ course_title }}.',
            'variables' => ['course_title'],
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('template.slug', 'course_enrolled')
            ->json('template.id');

        Sanctum::actingAs($admin->user);

        $this->putJson("/api/v1/notification-templates/{$templateId}", [
            'name' => 'Updated course enrolled',
            'is_active' => true,
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('template.name', 'Updated course enrolled');

        $this->getJson('/api/v1/notification-templates', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('templates.0.id', $templateId);

        Sanctum::actingAs($student->user);

        $this->postJson('/api/v1/notification-templates', [
            'slug' => 'blocked',
            'name' => 'Blocked',
            'channel' => 'in_app',
            'body' => 'Blocked',
        ], $this->tenantHeader($tenant))
            ->assertForbidden();
    }

    public function test_notification_events_are_idempotent_and_strip_sensitive_payload_fields(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);

        NotificationTemplate::create([
            'tenant_id' => $tenant->id,
            'slug' => 'course_enrolled',
            'name' => 'Course enrolled',
            'channel' => 'in_app',
            'subject' => 'Course {{ course_title }}',
            'body' => 'Enrollment ready for {{ course_title }}.',
            'variables' => ['course_title'],
            'is_system' => false,
            'is_active' => true,
        ]);

        $events = app(NotificationEventService::class);
        $events->record($tenant, 'course.enrolled', 'course-enrolled-1', [
            'tenant_user_id' => $student->id,
            'course_id' => 44,
            'course_title' => 'Foundations',
            'token' => 'secret',
            'email' => 'learner@example.test',
        ]);
        $events->record($tenant, 'course.enrolled', 'course-enrolled-1', [
            'tenant_user_id' => $student->id,
            'course_id' => 44,
        ]);

        $this->assertDatabaseCount('notification_events', 1);
        $this->assertDatabaseCount('notifications', 1);

        $event = \App\Models\NotificationEvent::query()->firstOrFail();
        $this->assertArrayNotHasKey('token', $event->payload);
        $this->assertArrayNotHasKey('email', $event->payload);

        $this->assertDatabaseHas('notifications', [
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $student->id,
            'type' => 'course.enrolled',
            'title' => 'Course Foundations',
        ]);
    }

    public function test_enrollment_emits_notification_event_without_new_workflow(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $course = $this->course($tenant, $admin);
        $this->bindTenant($tenant);

        app(EnrollmentService::class)->enrollStudent($tenant, $course, $student);

        $this->assertDatabaseHas('notification_events', [
            'tenant_id' => $tenant->id,
            'event_type' => 'course.enrolled',
            'event_key' => 'course-enrollment-1',
        ]);

        $this->assertDatabaseHas('notifications', [
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $student->id,
            'type' => 'course.enrolled',
        ]);
    }

    private function course(Tenant $tenant, TenantUser $creator): Course
    {
        $this->bindTenant($tenant);

        return Course::create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $creator->id,
            'title' => 'Notification Course',
            'slug' => 'notification-course-'.uniqid(),
            'status' => 'published',
            'visibility' => 'enrolled_only',
            'pricing_type' => 'free',
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
