<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Models\Wallet;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StudentJourneyDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_access_dashboard_after_public_purchase(): void
    {
        $tenant = Tenant::factory()->create();
        $this->seedTenantRoles($tenant);

        $admin = $this->memberWithRole($tenant, 'admin');
        $course = $this->createPublicPaidCourse($tenant, $admin, 'Journey Course', 250);

        $registration = $this->postJson('/api/v1/public/register', [
            'name' => 'Journey Student',
            'phone' => '01099999999',
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
            ->postJson("/api/v1/public/courses/{$course->slug}/enroll", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('enrolled', true);

        $this->assertDatabaseHas('course_enrollments', [
            'course_id' => $course->id,
            'status' => 'active',
        ]);

        $response = $this->withToken($token)
            ->getJson('/api/v1/student/dashboard', $this->tenantHeader($tenant));

        $response->assertOk()
            ->assertJsonPath('data.student.name', 'Journey Student')
            ->assertJsonPath('data.stats.enrolledCoursesCount', 1);
    }

    public function test_student_role_is_assigned_on_public_registration(): void
    {
        $tenant = Tenant::factory()->create();
        $this->seedTenantRoles($tenant);

        $registration = $this->postJson('/api/v1/public/register', [
            'name' => 'Roless Student',
            'phone' => '01088888888',
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
        ], ['X-Tenant-ID' => (string) $tenant->id])
            ->assertCreated()
            ->json();

        $roleSlugs = collect($registration['roles'])->pluck('slug')->all();

        $this->assertContains('student', $roleSlugs);
    }

    public function test_tenant_owner_can_access_dashboard_after_purchase(): void
    {
        $tenant = Tenant::factory()->create();
        $this->seedTenantRoles($tenant);

        $admin = $this->memberWithRole($tenant, 'admin');
        $course = $this->createPublicPaidCourse($tenant, $admin, 'Owner Course', 250);

        $owner = $this->memberWithRole($tenant, 'tenant_owner');
        $this->assertNotContains('student', $owner->roles->pluck('slug')->all());

        Wallet::create([
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $owner->id,
            'balance' => 500,
            'currency' => 'EGP',
        ]);

        Sanctum::actingAs($owner->user);

        $this->postJson("/api/v1/public/courses/{$course->slug}/enroll", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('enrolled', true);

        $this->getJson('/api/v1/student/dashboard', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.stats.enrolledCoursesCount', 1);
    }

    private function seedTenantRoles(Tenant $tenant): void
    {
        if (! Role::query()->where('tenant_id', $tenant->id)->exists()) {
            $this->seed(IdentityAccessSeeder::class);
        }
    }

    private function createPublicPaidCourse(Tenant $tenant, TenantUser $manager, string $title, int $price): Course
    {
        $this->actingAs($manager->user);

        $id = $this->postJson('/api/v1/courses', [
            'title' => $title,
            'slug' => str($title)->slug()->toString(),
            'pricing_type' => 'one_time',
            'price_amount' => $price,
            'price_currency' => 'EGP',
        ], $this->tenantHeader($tenant))
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
