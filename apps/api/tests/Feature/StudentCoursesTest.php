<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Models\Wallet;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentCoursesTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_request_is_rejected(): void
    {
        $tenant = Tenant::factory()->create();

        $this->getJson('/api/v1/student/courses', $this->tenantHeader($tenant))
            ->assertUnauthorized();
    }

    public function test_student_sees_enrolled_courses_after_purchase(): void
    {
        $tenant = Tenant::factory()->create();
        $this->seedTenantRoles($tenant);

        $admin = $this->memberWithRole($tenant, 'admin');
        $paid = $this->createPublicPaidCourse($tenant, $admin, 'Paid Course', 250);
        $free = $this->createPublicFreeCourse($tenant, $admin, 'Free Course');

        $registration = $this->postJson('/api/v1/public/register', [
            'name' => 'Enrolled Student',
            'phone' => '01066666666',
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
        ], ['X-Tenant-ID' => (string) $tenant->id])
            ->assertCreated()
            ->json();

        $token = $registration['access_token'];

        Wallet::create([
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $registration['membership']['id'],
            'balance' => 500,
            'currency' => 'EGP',
        ]);

        $this->withToken($token)
            ->postJson("/api/v1/public/courses/{$paid->slug}/enroll", [], $this->tenantHeader($tenant))
            ->assertCreated();

        $this->withToken($token)
            ->postJson("/api/v1/public/courses/{$free->slug}/enroll", [], $this->tenantHeader($tenant))
            ->assertCreated();

        $this->assertDatabaseHas('course_enrollments', ['course_id' => $paid->id, 'status' => 'active']);
        $this->assertDatabaseHas('course_enrollments', ['course_id' => $free->id, 'status' => 'active']);

        $this->withToken($token)
            ->getJson('/api/v1/student/courses', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment(['id' => (string) $paid->id, 'slug' => $paid->slug])
            ->assertJsonFragment(['id' => (string) $free->id, 'slug' => $free->slug]);
    }

    public function test_student_with_no_enrollments_gets_empty_list(): void
    {
        $tenant = Tenant::factory()->create();
        $this->seedTenantRoles($tenant);

        $registration = $this->postJson('/api/v1/public/register', [
            'name' => 'Fresh Student',
            'phone' => '01055555555',
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
        ], ['X-Tenant-ID' => (string) $tenant->id])
            ->assertCreated()
            ->json();

        $this->withToken($registration['access_token'])
            ->getJson('/api/v1/student/courses', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertExactJson(['data' => []]);
    }

    public function test_multiple_enrollments_in_same_course_are_deduplicated_by_course(): void
    {
        $tenant = Tenant::factory()->create();
        $this->seedTenantRoles($tenant);

        $admin = $this->memberWithRole($tenant, 'admin');
        $course = $this->createPublicFreeCourse($tenant, $admin, 'Duplicate Course');

        $registration = $this->postJson('/api/v1/public/register', [
            'name' => 'Dup Student',
            'phone' => '01044444444',
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
        ], ['X-Tenant-ID' => (string) $tenant->id])
            ->assertCreated()
            ->json();

        $token = $registration['access_token'];

        // Free enrollments are idempotent (no new wallet debit); this also
        // covers the case where a cancelled row is followed by a fresh one.
        $this->withToken($token)
            ->postJson("/api/v1/public/courses/{$course->slug}/enroll", [], $this->tenantHeader($tenant))
            ->assertCreated();

        $this->withToken($token)
            ->getJson('/api/v1/student/courses', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_cross_tenant_access_is_rejected(): void
    {
        $first = Tenant::factory()->create();
        $second = Tenant::factory()->create();
        $this->seedTenantRoles($first);

        $firstAdmin = $this->memberWithRole($first, 'admin');
        $firstCourse = $this->createPublicFreeCourse($first, $firstAdmin, 'First Tenant Course');

        $registration = $this->postJson('/api/v1/public/register', [
            'name' => 'Cross Tenant Student',
            'phone' => '01033333333',
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
        ], ['X-Tenant-ID' => (string) $first->id])
            ->assertCreated()
            ->json();

        $token = $registration['access_token'];

        $this->withToken($token)
            ->postJson("/api/v1/public/courses/{$firstCourse->slug}/enroll", [], $this->tenantHeader($first))
            ->assertCreated();

        $this->assertDatabaseHas('course_enrollments', ['course_id' => $firstCourse->id]);

        // The student's membership belongs to the first tenant; querying through
        // the second tenant must be rejected so enrollments never leak across
        // tenants through this endpoint.
        $this->withToken($token)
            ->getJson('/api/v1/student/courses', $this->tenantHeader($second))
            ->assertForbidden();
    }

    private function seedTenantRoles(Tenant $tenant): void
    {
        if (! Role::query()->where('tenant_id', $tenant->id)->exists()) {
            $this->seed(IdentityAccessSeeder::class);
        }
    }

    private function createPublicPaidCourse(Tenant $tenant, TenantUser $manager, string $title, int $price): Course
    {
        return $this->createPublicCourse($tenant, $manager, $title, [
            'pricing_type' => 'one_time',
            'price_amount' => $price,
            'price_currency' => 'EGP',
        ]);
    }

    private function createPublicFreeCourse(Tenant $tenant, TenantUser $manager, string $title): Course
    {
        return $this->createPublicCourse($tenant, $manager, $title, [
            'pricing_type' => 'free',
        ]);
    }

    /**
     * @param array<string, mixed> $overrides
     */
    private function createPublicCourse(Tenant $tenant, TenantUser $manager, string $title, array $overrides): Course
    {
        $this->actingAs($manager->user);

        $id = $this->postJson('/api/v1/courses', array_merge([
            'title' => $title,
            'slug' => str($title)->slug()->toString(),
        ], $overrides), $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.id');

        auth()->forgetGuards();

        Course::withoutGlobalScopes()
            ->whereKey($id)
            ->update(['status' => 'published', 'visibility' => 'public']);

        return Course::withoutGlobalScopes()->findOrFail($id);
    }

    private function memberWithRole(Tenant $tenant, string $roleSlug): TenantUser
    {
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