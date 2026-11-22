<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseSession;
use App\Models\CourseSessionEnrollment;
use App\Models\NotificationPreference;
use App\Models\Permission;
use App\Models\Role;
use App\Models\ScheduledNotificationDispatch;
use App\Models\SessionAttendance;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\TenantWhatsAppIntegration;
use App\Models\User;
use App\Services\Learning\EnrollmentService;
use App\Services\Sessions\CourseSessionService;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseSessionLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_reactivation_syncs_session_enrollments_and_suspension_cancels_them_without_deleting_attendance(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $course = $this->createCourse($tenant, $admin);
        $this->bindTenant($tenant);

        $session = CourseSession::create([
            'tenant_id' => $tenant->id, 'course_id' => $course->id, 'title' => 'S1', 'session_type' => 'live', 'status' => 'scheduled',
            'starts_at_utc' => now()->addDay(), 'ends_at_utc' => now()->addDay()->addHour(), 'timezone' => 'UTC', 'meeting_url' => 'https://meet.example.com/1',
        ]);

        $enrollment = app(EnrollmentService::class)->enrollStudent($tenant, $course, $student, 'active');
        $se = CourseSessionEnrollment::query()->where('course_session_id', $session->id)->where('tenant_user_id', $student->id)->firstOrFail();
        SessionAttendance::query()->where('course_session_enrollment_id', $se->id)->update(['status' => 'present']);

        app(EnrollmentService::class)->suspend($enrollment->fresh());
        $this->assertDatabaseHas('course_session_enrollments', ['id' => $se->id, 'status' => 'cancelled']);
        $this->assertDatabaseHas('session_attendance', ['course_session_enrollment_id' => $se->id, 'status' => 'present']);

        app(EnrollmentService::class)->activate($enrollment->fresh());
        $this->assertDatabaseHas('course_session_enrollments', ['id' => $se->id, 'status' => 'enrolled']);
        $this->assertDatabaseHas('session_attendance', ['course_session_enrollment_id' => $se->id, 'status' => 'present']);
    }

    public function test_schedule_cancel_and_reschedule_manage_reminder_dispatches(): void
    {
        $tenant = Tenant::factory()->create(['timezone' => 'UTC']);
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $course = $this->createCourse($tenant, $admin);
        $this->bindTenant($tenant);

        $session = CourseSession::create([
            'tenant_id' => $tenant->id, 'course_id' => $course->id, 'created_by_tenant_user_id' => $admin->id,
            'title' => 'S1', 'session_type' => 'live', 'status' => 'draft',
            'starts_at_utc' => now()->addDays(3), 'ends_at_utc' => now()->addDays(3)->addHour(), 'timezone' => 'UTC', 'meeting_url' => 'https://meet.example.com/1',
        ]);
        app(EnrollmentService::class)->enrollStudent($tenant, $course, $student, 'active');

        $service = app(CourseSessionService::class);
        $service->schedule($tenant, $session->fresh());
        $this->assertGreaterThan(0, ScheduledNotificationDispatch::query()->where('course_session_id', $session->id)->where('status', 'pending')->count());

        $service->update($tenant, $session->fresh(), [
            'title' => 'S1 updated', 'session_type' => 'live', 'starts_at_utc' => now()->addDays(4)->toIso8601String(), 'ends_at_utc' => now()->addDays(4)->addHour()->toIso8601String(), 'timezone' => 'UTC', 'meeting_url' => 'https://meet.example.com/1',
        ]);
        $this->assertDatabaseHas('scheduled_notification_dispatches', ['course_session_id' => $session->id, 'status' => 'cancelled', 'cancelled_reason' => 'rescheduled']);

        $service->cancel($tenant, $session->fresh(), 'No longer needed');
        $this->assertSame(0, ScheduledNotificationDispatch::query()->where('course_session_id', $session->id)->where('status', 'pending')->count());
    }

    public function test_whatsapp_preference_defaults_false(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $pref = NotificationPreference::create([
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $student->id,
            'notification_type' => 'session.reminder',
            'in_app_enabled' => true,
            'email_enabled' => false,
        ])->fresh();
        $this->assertFalse((bool) $pref->whatsapp_enabled);
    }

    private function createCourse(Tenant $tenant, TenantUser $creator): Course
    {
        return Course::create(['tenant_id' => $tenant->id, 'created_by_tenant_user_id' => $creator->id, 'title' => 'Course', 'slug' => 'course-'.uniqid(), 'status' => 'published', 'delivery_mode' => 'recorded_and_sessions']);
    }

    private function memberWithRole(Tenant $tenant, string $roleSlug): TenantUser
    {
        $this->seedTenantPermissions($tenant);
        $user = User::factory()->create();
        $membership = TenantUser::create(['tenant_id' => $tenant->id, 'user_id' => $user->id, 'status' => 'active']);
        $role = Role::query()->where('tenant_id', $tenant->id)->where('slug', $roleSlug)->firstOrFail();
        $membership->roles()->attach($role->id, ['tenant_id' => $tenant->id]);
        return $membership->load('user');
    }

    private function seedTenantPermissions(Tenant $tenant): void
    {
        if (Role::query()->where('tenant_id', $tenant->id)->exists()) return;
        $this->seed(IdentityAccessSeeder::class);
        if (! Permission::query()->where('slug', 'courses.view')->exists()) $this->fail('Course permissions were not seeded.');
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->forgetInstance(Tenant::class);
        app()->forgetInstance('currentTenant');
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
