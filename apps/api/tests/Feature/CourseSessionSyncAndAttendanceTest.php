<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseSession;
use App\Models\CourseSessionEnrollment;
use App\Models\Permission;
use App\Models\Role;
use App\Models\SessionAttendance;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Learning\EnrollmentService;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseSessionSyncAndAttendanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_enrollment_syncs_to_existing_and_future_sessions_idempotently(): void
    {
        $tenant = Tenant::factory()->create(['timezone' => 'Africa/Cairo']);
        $this->seedTenantPermissions($tenant);
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $course = $this->createCourse($tenant, $admin);
        $this->bindTenant($tenant);

        $session1 = CourseSession::create([
            'tenant_id' => $tenant->id, 'course_id' => $course->id, 'title' => 'S1', 'session_type' => 'live', 'status' => 'scheduled',
            'starts_at_utc' => now()->subDay(), 'ends_at_utc' => now()->subDay()->addHour(), 'timezone' => 'Africa/Cairo', 'meeting_url' => 'https://meet.example.com/1',
        ]);

        $enrollment = app(EnrollmentService::class)->enrollStudent($tenant, $course, $student, 'active');
        $this->assertDatabaseHas('course_session_enrollments', ['tenant_id' => $tenant->id, 'course_session_id' => $session1->id, 'tenant_user_id' => $student->id, 'status' => 'enrolled']);
        $this->assertDatabaseHas('session_attendance', ['tenant_id' => $tenant->id, 'course_session_id' => $session1->id, 'tenant_user_id' => $student->id, 'status' => 'pending']);

        app(\App\Services\Sessions\CourseSessionEnrollmentSyncService::class)->syncCourseEnrollment($enrollment->fresh());
        $this->assertSame(1, CourseSessionEnrollment::query()->where('course_session_id', $session1->id)->where('tenant_user_id', $student->id)->count());

        $session2 = CourseSession::create([
            'tenant_id' => $tenant->id, 'course_id' => $course->id, 'title' => 'S2', 'session_type' => 'offline', 'status' => 'scheduled',
            'starts_at_utc' => now()->addDay(), 'ends_at_utc' => now()->addDay()->addHour(), 'timezone' => 'Africa/Cairo', 'location_name' => 'Hall A',
        ]);
        app(\App\Services\Sessions\CourseSessionEnrollmentSyncService::class)->syncSession($session2);
        $this->assertDatabaseHas('course_session_enrollments', ['tenant_id' => $tenant->id, 'course_session_id' => $session2->id, 'tenant_user_id' => $student->id, 'status' => 'enrolled']);
    }

    public function test_attendance_marking_does_not_change_course_progress_or_completion(): void
    {
        $tenant = Tenant::factory()->create();
        $this->seedTenantPermissions($tenant);
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $course = $this->createCourse($tenant, $admin);
        $this->bindTenant($tenant);
        $session = CourseSession::create([
            'tenant_id' => $tenant->id, 'course_id' => $course->id, 'title' => 'S1', 'session_type' => 'live', 'status' => 'scheduled',
            'starts_at_utc' => now()->addDay(), 'ends_at_utc' => now()->addDay()->addHour(), 'timezone' => 'UTC', 'meeting_url' => 'https://meet.example.com/1',
        ]);
        $enrollment = CourseEnrollment::create(['tenant_id' => $tenant->id, 'course_id' => $course->id, 'tenant_user_id' => $student->id, 'status' => 'active', 'enrolled_at' => now(), 'completed_at' => null]);
        $se = CourseSessionEnrollment::create(['tenant_id' => $tenant->id, 'course_session_id' => $session->id, 'course_enrollment_id' => $enrollment->id, 'tenant_user_id' => $student->id, 'status' => 'enrolled']);
        SessionAttendance::create(['tenant_id' => $tenant->id, 'course_session_id' => $session->id, 'course_session_enrollment_id' => $se->id, 'tenant_user_id' => $student->id, 'status' => 'present', 'marked_by_tenant_user_id' => $admin->id, 'marked_at' => now()]);

        $enrollment->refresh();
        $this->assertSame('active', $enrollment->status);
        $this->assertNull($enrollment->completed_at);
        $this->assertDatabaseMissing('course_completions', ['course_enrollment_id' => $enrollment->id]);
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
        if ($roleSlug === 'instructor') $membership->update(['is_instructor' => true]);
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
