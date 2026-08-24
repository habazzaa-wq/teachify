<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\AuditLog;
use App\Models\Course;
use App\Models\Permission;
use App\Models\PlatformAdmin;
use App\Models\PlatformAuditLog;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Audit\ActivityLogService;
use App\Services\Audit\AuditLogService;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuditActivityFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_audit_service_records_events_with_before_after_changes_and_actor(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $this->bindTenant($tenant);

        $log = app(AuditLogService::class)->record(
            tenant: $tenant,
            eventType: 'course.updated',
            entityType: 'course',
            entityId: 7,
            action: 'update',
            actor: $admin,
            oldValues: ['title' => 'Old'],
            newValues: ['title' => 'New'],
            metadata: ['source' => 'web'],
        );

        $this->assertDatabaseHas('audit_logs', [
            'id' => $log->id,
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $admin->id,
            'user_id' => $admin->user_id,
            'event_type' => 'course.updated',
            'entity_type' => 'course',
            'entity_id' => 7,
            'action' => 'update',
        ]);

        $this->assertSame(['title' => 'Old'], $log->old_values);
        $this->assertSame(['title' => 'New'], $log->new_values);
    }

    public function test_audit_log_redacts_sensitive_values_before_persistence(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $this->bindTenant($tenant);

        $log = app(AuditLogService::class)->record(
            tenant: $tenant,
            eventType: 'role.assigned',
            entityType: 'role',
            entityId: 1,
            action: 'assign',
            actor: $admin,
            newValues: [
                'role' => 'admin',
                'password' => 'super-secret',
                'token' => 'abc123',
                'webhook_secret' => 'wh-secret',
                'metadata' => ['token' => 'nested'],
            ],
        );

        $this->assertSame('[redacted]', $log->new_values['password']);
        $this->assertSame('[redacted]', $log->new_values['token']);
        $this->assertSame('[redacted]', $log->new_values['webhook_secret']);
        $this->assertSame('[redacted]', $log->new_values['metadata']['token']);
    }

    public function test_activity_service_records_lightweight_events(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);

        $log = app(ActivityLogService::class)->record(
            tenant: $tenant,
            actor: $student,
            activityType: 'lesson.viewed',
            entityType: 'course_lesson',
            entityId: 42,
            metadata: ['duration' => 120],
        );

        $this->assertDatabaseHas('activity_logs', [
            'id' => $log->id,
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $student->id,
            'activity_type' => 'lesson.viewed',
            'entity_type' => 'course_lesson',
            'entity_id' => 42,
        ]);
    }

    public function test_owners_and_admins_can_view_all_tenant_audit_logs(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $this->bindTenant($tenant);

        app(AuditLogService::class)->record(
            tenant: $tenant,
            eventType: 'course.created',
            entityType: 'course',
            entityId: 1,
            action: 'create',
            actor: $admin,
        );

        Sanctum::actingAs($admin->user);

        $this->getJson('/api/v1/audit-logs', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.0.event_type', 'course.created');
    }

    public function test_students_cannot_view_audit_logs(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');

        Sanctum::actingAs($student->user);

        $this->getJson('/api/v1/audit-logs', $this->tenantHeader($tenant))->assertForbidden();
    }

    public function test_entity_history_filters_by_entity_type_and_id(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $this->bindTenant($tenant);

        app(AuditLogService::class)->record($tenant, 'course.created', 'course', 5, 'create', $admin);
        app(AuditLogService::class)->record($tenant, 'course.updated', 'course', 5, 'update', $admin);
        app(AuditLogService::class)->record($tenant, 'course.created', 'course', 9, 'create', $admin);

        Sanctum::actingAs($admin->user);

        $this->getJson('/api/v1/audit-logs/entity?entity_type=course&entity_id=5', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_students_view_only_own_activity_via_me_endpoint(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $otherStudent = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);

        app(ActivityLogService::class)->record($tenant, $student, 'lesson.viewed', 'course_lesson', 1);
        app(ActivityLogService::class)->record($tenant, $otherStudent, 'lesson.viewed', 'course_lesson', 2);

        Sanctum::actingAs($student->user);

        $this->getJson('/api/v1/activity-logs/me', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.tenant_user_id', $student->id);
    }

    public function test_audit_logs_are_cross_tenant_isolated(): void
    {
        $firstTenant = Tenant::factory()->create();
        $secondTenant = Tenant::factory()->create();
        $firstAdmin = $this->memberWithRole($firstTenant, 'admin');
        $secondAdmin = $this->memberWithRole($secondTenant, 'admin');
        $this->bindTenant($firstTenant);

        app(AuditLogService::class)->record(
            $firstTenant, 'course.created', 'course', 1, 'create', $firstAdmin,
        );

        Sanctum::actingAs($secondAdmin->user);

        // Cross-tenant listing returns only the second tenant's records (none).
        $this->getJson('/api/v1/audit-logs', $this->tenantHeader($secondTenant))
            ->assertOk()
            ->assertJsonCount(0, 'data');

        // Audit records are always scoped by tenant in the query layer.
        $this->assertSame(
            1,
            AuditLog::query()->where('tenant_id', $firstTenant->id)->count(),
        );
    }

    public function test_instructor_scope_limits_audit_logs_to_assigned_courses(): void
    {
        $tenant = Tenant::factory()->create();
        $instructor = $this->memberWithRole($tenant, 'instructor');
        $this->bindTenant($tenant);

        $assignedCourse = Course::create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $instructor->id,
            'title' => 'Assigned Course',
            'slug' => 'assigned-course',
            'status' => 'published',
            'visibility' => 'public',
            'pricing_type' => 'free',
        ]);

        app(AuditLogService::class)->record(
            $tenant, 'course.created', 'course', $assignedCourse->id, 'create', $instructor,
        );
        app(AuditLogService::class)->record(
            $tenant, 'course.created', 'course', 9999, 'create', $instructor,
        );

        Sanctum::actingAs($instructor->user);

        $this->getJson('/api/v1/audit-logs', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.entity_id', $assignedCourse->id);
    }

    public function test_audit_log_filters_by_event_type_and_actor(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $this->bindTenant($tenant);

        app(AuditLogService::class)->record($tenant, 'course.created', 'course', 1, 'create', $admin);
        app(AuditLogService::class)->record($tenant, 'quiz.created', 'quiz', 2, 'create', $admin);

        Sanctum::actingAs($admin->user);

        $this->getJson('/api/v1/audit-logs?event_type=quiz.created', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.event_type', 'quiz.created');

        $this->getJson('/api/v1/audit-logs?tenant_user_id='.$admin->id, $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_audit_logs_are_immutable(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $this->bindTenant($tenant);

        $log = app(AuditLogService::class)->record(
            $tenant, 'course.created', 'course', 1, 'create', $admin,
        );

        $this->assertNull($log->fresh()->updated_at);
        $this->assertNotNull($log->fresh()->created_at);
    }

    public function test_platform_admin_can_view_platform_audit_logs(): void
    {
        $platformUser = User::factory()->create();
        $platformAdmin = PlatformAdmin::factory()->create(['user_id' => $platformUser->id]);

        PlatformAuditLog::create([
            'platform_admin_id' => $platformAdmin->id,
            'event_type' => 'tenant.created',
            'entity_type' => 'tenant',
            'entity_id' => 1,
            'action' => 'create',
            'metadata' => ['slug' => 'acme'],
        ]);

        Sanctum::actingAs($platformUser, ['platform:access']);

        $this->getJson('/api/platform/audit-logs')
            ->assertOk()
            ->assertJsonPath('data.0.event_type', 'tenant.created');
    }

    public function test_non_platform_users_cannot_view_platform_audit_logs(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');

        Sanctum::actingAs($admin->user);

        $this->getJson('/api/platform/audit-logs')->assertForbidden();
    }

    public function test_audit_log_service_records_platform_events_without_tenant(): void
    {
        $platformUser = User::factory()->create();
        $platformAdmin = PlatformAdmin::factory()->create(['user_id' => $platformUser->id]);

        $log = app(AuditLogService::class)->recordPlatform(
            admin: $platformAdmin,
            eventType: 'tenant.suspended',
            entityType: 'tenant',
            entityId: 5,
            action: 'suspend',
            metadata: ['reason' => 'policy violation'],
        );

        $this->assertNull($log->tenant_id);
        $this->assertNull($log->tenant_user_id);
        $this->assertSame($platformUser->id, $log->user_id);
        $this->assertSame('tenant.suspended', $log->event_type);
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
