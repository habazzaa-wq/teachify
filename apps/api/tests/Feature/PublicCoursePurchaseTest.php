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

class PublicCoursePurchaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_purchase_a_paid_public_course_with_wallet(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $course = $this->createPublicPaidCourse($tenant, $admin, 'Premium Course', 250);

        $this->createWallet($tenant, $student, 500);

        Sanctum::actingAs($student->user);

        $this->postJson("/api/v1/public/courses/{$course->slug}/enroll", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('enrolled', true)
            ->assertJsonPath('amount', 250)
            ->assertJsonPath('balance', 250);

        $this->assertDatabaseHas('course_enrollments', [
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'tenant_user_id' => $student->id,
            'status' => 'active',
        ]);

        $this->assertDatabaseHas('wallet_transactions', [
            'tenant_id' => $tenant->id,
            'wallet_id' => Wallet::where('tenant_user_id', $student->id)->first()->id,
            'type' => 'debit',
            'amount' => 250,
        ]);

        $this->assertSame(250.0, (float) $student->fresh()->wallet->balance);
    }

    public function test_student_cannot_purchase_when_wallet_balance_is_insufficient(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $course = $this->createPublicPaidCourse($tenant, $admin, 'Expensive Course', 250);

        $this->createWallet($tenant, $student, 100);

        Sanctum::actingAs($student->user);

        $this->postJson("/api/v1/public/courses/{$course->slug}/enroll", [], $this->tenantHeader($tenant))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['balance']);

        $this->assertDatabaseCount('course_enrollments', 0);
        $this->assertDatabaseCount('wallet_transactions', 0);
        $this->assertSame(100.0, (float) $student->fresh()->wallet->balance);
    }

    public function test_student_cannot_be_charged_twice_for_the_same_course(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $course = $this->createPublicPaidCourse($tenant, $admin, 'One Time Course', 250);

        $this->createWallet($tenant, $student, 1000);

        Sanctum::actingAs($student->user);

        $this->postJson("/api/v1/public/courses/{$course->slug}/enroll", [], $this->tenantHeader($tenant))
            ->assertCreated();

        $this->postJson("/api/v1/public/courses/{$course->slug}/enroll", [], $this->tenantHeader($tenant))
            ->assertUnprocessable();

        $this->assertDatabaseCount('wallet_transactions', 1);
        $this->assertSame(750.0, (float) $student->fresh()->wallet->balance);
    }

    public function test_student_can_enroll_for_free_public_course_without_balance(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $course = $this->createPublicFreeCourse($tenant, $admin, 'Free Course');

        Sanctum::actingAs($student->user);

        $this->postJson("/api/v1/public/courses/{$course->slug}/enroll", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('amount', 0);

        $this->assertDatabaseHas('course_enrollments', [
            'course_id' => $course->id,
            'tenant_user_id' => $student->id,
            'status' => 'active',
        ]);

        $this->assertDatabaseCount('wallet_transactions', 0);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $course = $this->createPublicPaidCourse($tenant, $admin, 'Guest Course', 250);

        $this->postJson("/api/v1/public/courses/{$course->slug}/enroll", [], $this->tenantHeader($tenant))
            ->assertUnauthorized();
    }

    private function createPublicPaidCourse(Tenant $tenant, TenantUser $manager, string $title, int $price): Course
    {
        Sanctum::actingAs($manager->user);

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

        return Course::withoutGlobalScopes()
            ->findOrFail($id)
            ->forceFill(['status' => 'published', 'visibility' => 'public'])
            ->save()
            ? Course::withoutGlobalScopes()->findOrFail($id)
            : abort(500);
    }

    private function createPublicFreeCourse(Tenant $tenant, TenantUser $manager, string $title): Course
    {
        Sanctum::actingAs($manager->user);

        $id = $this->postJson('/api/v1/courses', [
            'title' => $title,
            'slug' => str($title)->slug()->toString(),
            'pricing_type' => 'free',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.id');

        auth()->forgetGuards();

        Course::withoutGlobalScopes()
            ->whereKey($id)
            ->update(['status' => 'published', 'visibility' => 'public']);

        return Course::withoutGlobalScopes()->findOrFail($id);
    }

    private function createWallet(Tenant $tenant, TenantUser $student, float $balance): Wallet
    {
        return Wallet::create([
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $student->id,
            'balance' => $balance,
            'currency' => 'EGP',
        ]);
    }

    private function memberWithRole(Tenant $tenant, string $roleSlug): TenantUser
    {
        if (! Role::query()->where('tenant_id', $tenant->id)->exists()) {
            $this->seed(IdentityAccessSeeder::class);
        }

        $this->assertTrue(Permission::query()->where('slug', 'enrollments.manage')->exists());

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
