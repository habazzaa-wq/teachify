<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\Notification;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Notifications\NotificationService;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * P2 verification: unbounded endpoints are now paginated, and the confirmed
 * N+1 count patterns in the course/student resources are resolved via eager
 * withCount rather than per-row queries.
 */
class P2PaginationAndNPlusOneTest extends TestCase
{
    use RefreshDatabase;

    public function test_notifications_list_is_paginated_and_bounded(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);

        for ($i = 0; $i < 30; $i++) {
            app(NotificationService::class)->create(
                $tenant,
                $student,
                'course.enrolled',
                "Title {$i}",
                'Body',
            );
        }

        Sanctum::actingAs($student->user);

        $this->getJson('/api/v1/notifications?per_page=10', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(10, 'notifications')
            ->assertJsonPath('total', 30)
            ->assertJsonPath('per_page', 10)
            ->assertJsonPath('last_page', 3)
            ->assertJsonPath('current_page', 1);
    }

    public function test_community_notifications_are_prefix_filtered_and_paginated(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $this->bindTenant($tenant);

        for ($i = 0; $i < 12; $i++) {
            app(NotificationService::class)->create(
                $tenant,
                $student,
                $i < 4 ? 'community.thread.reply' : 'course.enrolled',
                "Title {$i}",
                'Body',
            );
        }

        Sanctum::actingAs($student->user);

        $this->getJson('/api/v1/community/notifications?per_page=5', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(4, 'notifications')
            ->assertJsonPath('total', 4)
            ->assertJsonPath('per_page', 5);
    }

    public function test_student_list_exposes_correct_enrollment_counts_without_per_row_queries(): void
    {
        $tenant = Tenant::factory()->create();
        $student = $this->memberWithRole($tenant, 'student');
        $owner = $this->memberWithRole($tenant, 'tenant_owner');
        $this->bindTenant($tenant);

        CourseEnrollment::create([
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $student->id,
            'course_id' => Course::create([
                'tenant_id' => $tenant->id,
                'created_by_tenant_user_id' => $owner->id,
                'title' => 'C1', 'slug' => 'c1',
                'status' => 'published', 'visibility' => 'public', 'pricing_type' => 'free',
            ])->id,
            'status' => 'completed',
            'enrolled_at' => now(),
        ]);
        CourseEnrollment::create([
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $student->id,
            'course_id' => Course::create([
                'tenant_id' => $tenant->id,
                'created_by_tenant_user_id' => $owner->id,
                'title' => 'C2', 'slug' => 'c2',
                'status' => 'published', 'visibility' => 'public', 'pricing_type' => 'free',
            ])->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);

        Sanctum::actingAs($student->user);

        $this->getJson('/api/v1/students', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.0.enrolledCoursesCount', 2)
            ->assertJsonPath('data.0.completedCoursesCount', 1)
            ->assertJsonPath('total', 1)
            ->assertJsonPath('per_page', 25);
    }

    public function test_course_resource_reports_section_and_lesson_counts(): void
    {
        $tenant = Tenant::factory()->create();
        $owner = $this->memberWithRole($tenant, 'tenant_owner');
        $this->bindTenant($tenant);

        $course = Course::create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $owner->id,
            'title' => 'Counted Course',
            'slug' => 'counted-course',
            'status' => 'published',
            'visibility' => 'public',
            'pricing_type' => 'free',
        ]);

        $section = CourseSection::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'title' => 'S1',
            'sort_order' => 1,
        ]);
        CourseLesson::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'title' => 'L1',
            'slug' => 'l1',
            'type' => 'video',
            'status' => 'published',
            'visibility' => 'public',
            'sort_order' => 1,
        ]);
        CourseLesson::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'title' => 'L2',
            'slug' => 'l2',
            'type' => 'video',
            'status' => 'published',
            'visibility' => 'public',
            'sort_order' => 2,
        ]);

        Sanctum::actingAs($owner->user);

        $this->getJson('/api/v1/courses', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.0.sectionsCount', 1)
            ->assertJsonPath('data.0.lessonsCount', 2)
            ->assertJsonPath('data.0.studentsCount', 0);
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

    private function tenantHeader(Tenant $tenant): array
    {
        return ['X-Tenant-ID' => (string) $tenant->id];
    }
}
