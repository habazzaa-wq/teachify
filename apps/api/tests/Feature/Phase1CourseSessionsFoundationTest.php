<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseSession;
use App\Models\CourseSessionEnrollment;
use App\Models\Notification;
use App\Models\NotificationDelivery;
use App\Models\NotificationPreference;
use App\Models\Permission;
use App\Models\Role;
use App\Models\ScheduledNotificationDispatch;
use App\Models\SessionAttendance;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\TenantWhatsAppIntegration;
use App\Models\User;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class Phase1CourseSessionsFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_existing_and_new_courses_default_to_recorded_only_and_support_blended(): void
    {
        $tenant = Tenant::factory()->create();
        $creator = $this->memberWithRole($tenant, 'admin');
        $this->bindTenant($tenant);

        $course = Course::create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $creator->id,
            'title' => 'Recorded Course',
            'slug' => 'recorded-course',
            'status' => 'draft',
            'visibility' => 'private',
            'pricing_type' => 'free',
        ])->refresh();

        $this->assertSame('recorded_only', $course->delivery_mode);

        $blended = Course::create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $creator->id,
            'title' => 'Blended Course',
            'slug' => 'blended-course',
            'status' => 'draft',
            'visibility' => 'private',
            'pricing_type' => 'free',
            'delivery_mode' => 'blended',
        ])->refresh();

        $this->assertSame('blended', $blended->delivery_mode);
    }

    public function test_course_sessions_persist_valid_types_statuses_relationships_and_utc_fields(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $instructor = $this->memberWithRole($tenant, 'instructor');
        $course = $this->createCourse($tenant, $admin, ['delivery_mode' => 'blended']);
        $this->bindTenant($tenant);

        $session = CourseSession::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'created_by_tenant_user_id' => $admin->id,
            'instructor_tenant_user_id' => $instructor->id,
            'title' => 'Field Session',
            'session_type' => 'field',
            'status' => 'scheduled',
            'starts_at_utc' => '2026-12-01 07:00:00',
            'ends_at_utc' => '2026-12-01 10:00:00',
            'timezone' => 'Africa/Cairo',
            'location_name' => 'Site A',
        ])->refresh();

        $this->assertSame($tenant->id, $session->tenant_id);
        $this->assertSame($course->id, $session->course_id);
        $this->assertSame($instructor->id, $session->instructor_tenant_user_id);
        $this->assertSame('field', $session->session_type);
        $this->assertSame('scheduled', $session->status);
        $this->assertSame('Africa/Cairo', $session->timezone);
        $this->assertSame('2026-12-01T07:00:00+00:00', $session->starts_at_utc?->toIso8601String());
        $this->assertSame('2026-12-01T10:00:00+00:00', $session->ends_at_utc?->toIso8601String());
        $this->assertTrue($course->sessions()->whereKey($session->id)->exists());
        $this->assertSame($course->id, $session->course->id);

        foreach (['live', 'field', 'offline'] as $type) {
            $this->assertContains($type, CourseSession::SESSION_TYPES);
        }
        foreach (['draft', 'scheduled', 'cancelled', 'completed'] as $status) {
            $this->assertContains($status, CourseSession::STATUSES);
        }
    }

    public function test_session_enrollment_requires_valid_course_enrollment_is_unique_and_allows_historical_sessions(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $course = $this->createCourse($tenant, $admin, ['delivery_mode' => 'blended']);
        $this->bindTenant($tenant);

        $session = CourseSession::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'title' => 'Past Session',
            'session_type' => 'offline',
            'status' => 'completed',
            'starts_at_utc' => '2020-01-01 08:00:00',
            'ends_at_utc' => '2020-01-01 10:00:00',
            'timezone' => 'Africa/Cairo',
        ]);
        $secondSession = $this->createSession($tenant, $course, $admin, [
            'title' => 'Second Session',
            'session_type' => 'live',
        ]);

        $enrollment = CourseEnrollment::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'tenant_user_id' => $student->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);

        $sessionEnrollment = CourseSessionEnrollment::create([
            'tenant_id' => $tenant->id,
            'course_session_id' => $session->id,
            'course_enrollment_id' => $enrollment->id,
            'tenant_user_id' => $student->id,
            'status' => 'enrolled',
            'enrolled_at' => now(),
        ]);
        $secondEnrollment = CourseSessionEnrollment::create([
            'tenant_id' => $tenant->id,
            'course_session_id' => $secondSession->id,
            'course_enrollment_id' => $enrollment->id,
            'tenant_user_id' => $student->id,
            'status' => 'enrolled',
            'enrolled_at' => now(),
        ]);

        $this->assertSame($enrollment->id, $sessionEnrollment->courseEnrollment->id);
        $this->assertSame($student->id, $sessionEnrollment->student->id);
        $this->assertSame($session->id, $sessionEnrollment->session->id);
        $this->assertTrue($enrollment->sessionEnrollments()->whereKey($sessionEnrollment->id)->exists());
        $this->assertTrue($enrollment->sessionEnrollments()->whereKey($secondEnrollment->id)->exists());

        $this->expectException(QueryException::class);
        CourseSessionEnrollment::create([
            'tenant_id' => $tenant->id,
            'course_session_id' => $session->id,
            'course_enrollment_id' => $enrollment->id,
            'tenant_user_id' => $student->id,
            'status' => 'enrolled',
            'enrolled_at' => now(),
        ]);
    }

    public function test_attendance_supports_approved_statuses_pending_without_marker_and_uniqueness(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $course = $this->createCourse($tenant, $admin, ['delivery_mode' => 'blended']);
        $this->bindTenant($tenant);
        $session = $this->createSession($tenant, $course, $admin);
        $enrollment = $this->createEnrollment($tenant, $course, $student);
        $sessionEnrollment = $this->createSessionEnrollment($tenant, $session, $enrollment, $student);

        $attendance = SessionAttendance::create([
            'tenant_id' => $tenant->id,
            'course_session_id' => $session->id,
            'course_session_enrollment_id' => $sessionEnrollment->id,
            'tenant_user_id' => $student->id,
            'status' => 'pending',
        ])->refresh();

        $this->assertSame('pending', $attendance->status);
        $this->assertNull($attendance->marked_by_tenant_user_id);
        $this->assertNull($attendance->marked_at);

        $attendance->update([
            'status' => 'present',
            'marked_by_tenant_user_id' => $admin->id,
            'marked_at' => '2026-12-01 09:00:00',
            'note' => 'On time',
        ]);
        $attendance->refresh();

        $this->assertSame('present', $attendance->status);
        $this->assertSame($admin->id, $attendance->marked_by_tenant_user_id);
        $this->assertNotNull($attendance->marked_at);
        $this->assertSame(['pending', 'present', 'absent', 'late', 'excused'], SessionAttendance::STATUSES);
        $this->assertDatabaseMissing('course_completions', ['course_enrollment_id' => $enrollment->id]);
        $this->assertDatabaseMissing('issued_certificates', ['course_enrollment_id' => $enrollment->id]);

        $this->expectException(QueryException::class);
        SessionAttendance::create([
            'tenant_id' => $tenant->id,
            'course_session_id' => $session->id,
            'course_session_enrollment_id' => $sessionEnrollment->id,
            'tenant_user_id' => $student->id,
            'status' => 'late',
        ]);
    }

    public function test_policies_enforce_session_and_attendance_authorization(): void
    {
        $tenant = Tenant::factory()->create();
        $otherTenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $assignedInstructor = $this->memberWithRole($tenant, 'instructor');
        $unassignedInstructor = $this->memberWithRole($tenant, 'instructor');
        $student = $this->memberWithRole($tenant, 'student');
        $otherAdmin = $this->memberWithRole($otherTenant, 'admin');
        $course = $this->createCourse($tenant, $admin, ['delivery_mode' => 'blended']);
        $this->bindTenant($tenant);

        $session = CourseSession::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'instructor_tenant_user_id' => $assignedInstructor->id,
            'title' => 'Policy Session',
            'session_type' => 'live',
            'status' => 'scheduled',
            'starts_at_utc' => now()->addDay(),
            'ends_at_utc' => now()->addDay()->addHour(),
            'timezone' => 'Africa/Cairo',
        ]);

        $enrollment = $this->createEnrollment($tenant, $course, $student);
        $sessionEnrollment = $this->createSessionEnrollment($tenant, $session, $enrollment, $student);
        $attendance = SessionAttendance::create([
            'tenant_id' => $tenant->id,
            'course_session_id' => $session->id,
            'course_session_enrollment_id' => $sessionEnrollment->id,
            'tenant_user_id' => $student->id,
            'status' => 'pending',
        ]);

        $this->assertTrue(Gate::forUser($admin->user)->allows('update', $session));
        $this->assertTrue(Gate::forUser($admin->user)->allows('update', $attendance));
        $this->assertTrue(Gate::forUser($assignedInstructor->user)->allows('update', $attendance));
        $this->assertFalse(Gate::forUser($unassignedInstructor->user)->allows('update', $attendance));
        $this->assertFalse(Gate::forUser($student->user)->allows('update', $session));
        $this->assertFalse(Gate::forUser($student->user)->allows('update', $attendance));

        $this->bindTenant($otherTenant);
        $this->assertFalse(Gate::forUser($otherAdmin->user)->allows('view', $session));
        $this->assertFalse(Gate::forUser($otherAdmin->user)->allows('view', $attendance));
    }

    public function test_whatsapp_integration_is_tenant_scoped_encrypted_and_hidden_from_serialization(): void
    {
        $tenant = Tenant::factory()->create();
        $otherTenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $otherAdmin = $this->memberWithRole($otherTenant, 'admin');
        $this->bindTenant($tenant);

        $integration = TenantWhatsAppIntegration::create([
            'tenant_id' => $tenant->id,
            'provider' => 'meta_whatsapp_cloud_api',
            'is_enabled' => true,
            'phone_number_id' => '123456789',
            'business_account_id' => '987654321',
            'access_token_encrypted' => 'secret-access-token',
            'webhook_verify_token_encrypted' => 'verify-token',
            'app_secret_encrypted' => 'app-secret',
            'sender_display_phone' => '+201000000000',
            'status' => 'active',
        ])->refresh();

        $this->assertSame($tenant->id, $integration->tenant_id);
        $this->assertSame('secret-access-token', $integration->access_token_encrypted);

        $raw = DB::table('tenant_whatsapp_integrations')->where('id', $integration->id)->first();
        $this->assertNotSame('secret-access-token', $raw->access_token_encrypted);
        $this->assertNotSame('verify-token', $raw->webhook_verify_token_encrypted);
        $this->assertNotSame('app-secret', $raw->app_secret_encrypted);

        $serialized = $integration->toArray();
        $this->assertArrayNotHasKey('access_token_encrypted', $serialized);
        $this->assertArrayNotHasKey('webhook_verify_token_encrypted', $serialized);
        $this->assertArrayNotHasKey('app_secret_encrypted', $serialized);

        $this->assertTrue(Gate::forUser($admin->user)->allows('view', $integration));
        $this->assertFalse(Gate::forUser($student->user)->allows('view', $integration));

        $this->bindTenant($otherTenant);
        $this->assertFalse(Gate::forUser($otherAdmin->user)->allows('view', $integration));

        $this->expectException(QueryException::class);
        TenantWhatsAppIntegration::create([
            'tenant_id' => $tenant->id,
            'provider' => 'meta_whatsapp_cloud_api',
        ]);
    }

    public function test_notification_schema_extensions_preserve_behavior_and_support_dedupe(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);

        $preference = NotificationPreference::create([
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $student->id,
            'notification_type' => 'session.reminder',
            'in_app_enabled' => true,
            'email_enabled' => false,
        ])->refresh();

        $this->assertFalse($preference->whatsapp_enabled);

        $notification = Notification::create([
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $student->id,
            'type' => 'session.reminder',
            'title' => 'Reminder',
            'body' => 'Session starts soon',
            'status' => 'unread',
            'data' => [],
        ]);

        $delivery = NotificationDelivery::create([
            'tenant_id' => $tenant->id,
            'notification_id' => $notification->id,
            'channel' => 'whatsapp',
            'provider' => 'meta_whatsapp_cloud_api',
            'provider_message_id' => 'wamid.123',
            'status' => 'pending',
            'dedupe_key' => 'session:1:24h:user:1',
        ])->refresh();

        $this->assertSame('meta_whatsapp_cloud_api', $delivery->provider);
        $this->assertSame('wamid.123', $delivery->provider_message_id);

        $session = $this->createSession($tenant, $this->createCourse($tenant, $this->memberWithRole($tenant, 'admin'), ['delivery_mode' => 'blended']), $this->memberWithRole($tenant, 'admin'));
        ScheduledNotificationDispatch::create([
            'tenant_id' => $tenant->id,
            'course_session_id' => $session->id,
            'tenant_user_id' => $student->id,
            'reminder_type' => '24h',
            'scheduled_for_utc' => now()->addDay(),
            'session_starts_at_utc_snapshot' => now()->addDays(2),
            'status' => 'pending',
            'dedupe_key' => 'dispatch:session:1:24h:user:1',
        ]);

        $this->expectException(QueryException::class);
        ScheduledNotificationDispatch::create([
            'tenant_id' => $tenant->id,
            'course_session_id' => $session->id,
            'tenant_user_id' => $student->id,
            'reminder_type' => '24h',
            'scheduled_for_utc' => now()->addDay(),
            'session_starts_at_utc_snapshot' => now()->addDays(2),
            'status' => 'pending',
            'dedupe_key' => 'dispatch:session:1:24h:user:1',
        ]);
    }

    public function test_student_cannot_view_draft_session_but_admin_and_assigned_instructor_can(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $assignedInstructor = $this->memberWithRole($tenant, 'instructor');
        $student = $this->memberWithRole($tenant, 'student');
        $course = $this->createCourse($tenant, $admin, ['delivery_mode' => 'blended']);
        $this->bindTenant($tenant);

        $draft = CourseSession::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'instructor_tenant_user_id' => $assignedInstructor->id,
            'title' => 'Draft Session',
            'session_type' => 'live',
            'status' => 'draft',
            'starts_at_utc' => now()->addDay(),
            'ends_at_utc' => now()->addDay()->addHour(),
            'timezone' => 'Africa/Cairo',
        ]);

        $enrollment = $this->createEnrollment($tenant, $course, $student);
        $this->createSessionEnrollment($tenant, $draft, $enrollment, $student);

        $this->assertFalse(Gate::forUser($student->user)->allows('view', $draft));
        $this->assertTrue(Gate::forUser($admin->user)->allows('view', $draft));
        $this->assertTrue(Gate::forUser($assignedInstructor->user)->allows('view', $draft));
    }

    public function test_student_cannot_access_another_students_attendance_record(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $studentA = $this->memberWithRole($tenant, 'student');
        $studentB = $this->memberWithRole($tenant, 'student');
        $course = $this->createCourse($tenant, $admin, ['delivery_mode' => 'blended']);
        $this->bindTenant($tenant);
        $session = $this->createSession($tenant, $course, $admin);
        $enrollmentA = $this->createEnrollment($tenant, $course, $studentA);
        $enrollmentB = $this->createEnrollment($tenant, $course, $studentB);
        $sessionEnrollmentA = $this->createSessionEnrollment($tenant, $session, $enrollmentA, $studentA);
        $this->createSessionEnrollment($tenant, $session, $enrollmentB, $studentB);

        $attendanceA = SessionAttendance::create([
            'tenant_id' => $tenant->id,
            'course_session_id' => $session->id,
            'course_session_enrollment_id' => $sessionEnrollmentA->id,
            'tenant_user_id' => $studentA->id,
            'status' => 'pending',
        ]);

        $this->assertTrue(Gate::forUser($studentA->user)->allows('view', $attendanceA));
        $this->assertFalse(Gate::forUser($studentB->user)->allows('view', $attendanceA));
    }

    public function test_whatsapp_integration_secrets_are_hidden_from_json_serialization(): void
    {
        $tenant = Tenant::factory()->create();
        $this->bindTenant($tenant);

        $integration = TenantWhatsAppIntegration::create([
            'tenant_id' => $tenant->id,
            'provider' => 'meta_whatsapp_cloud_api',
            'is_enabled' => true,
            'access_token_encrypted' => 'secret-access-token',
            'webhook_verify_token_encrypted' => 'verify-token',
            'app_secret_encrypted' => 'app-secret',
        ])->refresh();

        $json = $integration->toJson();
        $this->assertStringNotContainsString('secret-access-token', $json);
        $this->assertStringNotContainsString('verify-token', $json);
        $this->assertStringNotContainsString('app-secret', $json);
    }

    private function createCourse(Tenant $tenant, TenantUser $creator, array $attributes = []): Course
    {
        $this->bindTenant($tenant);

        return Course::create(array_merge([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $creator->id,
            'title' => 'Course '.uniqid(),
            'slug' => 'course-'.uniqid(),
            'status' => 'draft',
            'visibility' => 'private',
            'pricing_type' => 'free',
        ], $attributes))->refresh();
    }

    private function createSession(Tenant $tenant, Course $course, TenantUser $creator, array $attributes = []): CourseSession
    {
        $this->bindTenant($tenant);

        return CourseSession::create(array_merge([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'created_by_tenant_user_id' => $creator->id,
            'title' => 'Session '.uniqid(),
            'session_type' => 'live',
            'status' => 'scheduled',
            'starts_at_utc' => now()->addDay(),
            'ends_at_utc' => now()->addDay()->addHour(),
            'timezone' => 'Africa/Cairo',
        ], $attributes))->refresh();
    }

    private function createEnrollment(Tenant $tenant, Course $course, TenantUser $student): CourseEnrollment
    {
        $this->bindTenant($tenant);

        return CourseEnrollment::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'tenant_user_id' => $student->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ])->refresh();
    }

    private function createSessionEnrollment(Tenant $tenant, CourseSession $session, CourseEnrollment $enrollment, TenantUser $student): CourseSessionEnrollment
    {
        $this->bindTenant($tenant);

        return CourseSessionEnrollment::create([
            'tenant_id' => $tenant->id,
            'course_session_id' => $session->id,
            'course_enrollment_id' => $enrollment->id,
            'tenant_user_id' => $student->id,
            'status' => 'enrolled',
            'enrolled_at' => now(),
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

        if ($roleSlug === 'instructor') {
            $membership->update(['is_instructor' => true]);
        }

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
}
