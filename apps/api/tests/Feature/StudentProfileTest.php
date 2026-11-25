<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\TenantSetting;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StudentProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_update_editable_profile_fields(): void
    {
        [$tenant, $user, $membership] = $this->studentMembership();

        Sanctum::actingAs($user);

        $this->putJson('/api/v1/student/profile', [
            'name' => 'Updated Student Name',
            'gender' => 'female',
            'study_type' => 'أونلاين',
            'nationality' => 'مصرية',
            'study_level' => 'الثانوية العامة',
            'governorate' => 'القاهرة',
            'city' => 'مدينة نصر',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Student Name')
            ->assertJsonPath('data.gender', 'female')
            ->assertJsonPath('data.studyType', 'أونلاين')
            ->assertJsonPath('data.nationality', 'مصرية')
            ->assertJsonPath('data.studyLevel', 'الثانوية العامة')
            ->assertJsonPath('data.governorate', 'القاهرة')
            ->assertJsonPath('data.city', 'مدينة نصر');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Student Name',
        ]);
        $this->assertDatabaseHas('tenant_users', [
            'id' => $membership->id,
            'gender' => 'female',
            'study_type' => 'أونلاين',
            'nationality' => 'مصرية',
            'study_level' => 'الثانوية العامة',
            'governorate' => 'القاهرة',
            'city' => 'مدينة نصر',
        ]);
    }

    public function test_student_cannot_change_email_phone_or_parent_phone(): void
    {
        [$tenant, $user, $membership] = $this->studentMembership();

        Sanctum::actingAs($user);

        $this->putJson('/api/v1/student/profile', [
            'name' => 'Student Name',
            'email' => 'changed@example.com',
            'phone' => '+966500000099',
            'parent_phone' => '+966500000098',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.email', 'student@example.com')
            ->assertJsonPath('data.phone', '+966500000000')
            ->assertJsonPath('data.parentPhone', '+966500000001');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'email' => 'student@example.com',
        ]);
        $this->assertDatabaseHas('tenant_users', [
            'id' => $membership->id,
            'phone' => '+966500000000',
            'parent_phone' => '+966500000001',
        ]);
    }

    public function test_parent_phone_can_only_be_set_once(): void
    {
        // Start without a guardian phone, then set it once.
        [$tenant, $user, $membership] = $this->studentMembership(parentPhone: null);
        $membership->update(['parent_phone' => null]);

        Sanctum::actingAs($user);

        $this->putJson('/api/v1/student/profile', [
            'parent_phone' => '+966500000077',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.parentPhone', '+966500000077');

        // A second attempt must be ignored even when sent explicitly.
        $this->putJson('/api/v1/student/profile', [
            'parent_phone' => '+966500000088',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.parentPhone', '+966500000077');

        $this->assertDatabaseHas('tenant_users', [
            'id' => $membership->id,
            'parent_phone' => '+966500000077',
        ]);
    }

    public function test_disabled_fields_are_ignored(): void
    {
        [$tenant, $user, $membership] = $this->studentMembership();

        TenantSetting::create([
            'tenant_id' => $tenant->id,
            'group' => 'student_fields',
            'values' => ['gender' => false, 'nationality' => false],
        ]);

        Sanctum::actingAs($user);

        $this->putJson('/api/v1/student/profile', [
            'name' => 'Student Name',
            'gender' => 'male',
            'nationality' => 'سعودية',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.name', 'Student Name')
            ->assertJsonPath('data.gender', '')
            ->assertJsonPath('data.nationality', '');

        $this->assertDatabaseHas('tenant_users', [
            'id' => $membership->id,
            'gender' => null,
            'nationality' => null,
        ]);
    }

    public function test_profile_update_requires_a_name(): void
    {
        [$tenant, $user] = $this->studentMembership();

        Sanctum::actingAs($user);

        $this->putJson('/api/v1/student/profile', ['name' => ''], $this->tenantHeader($tenant))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    /**
     * @return array{0: Tenant, 1: User, 2: TenantUser}
     */
    private function studentMembership(?string $parentPhone = '+966500000001'): array
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create([
            'name' => 'Student Name',
            'email' => 'student@example.com',
        ]);
        $membership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'status' => 'active',
            'phone' => '+966500000000',
            'parent_phone' => $parentPhone,
        ]);

        return [$tenant, $user, $membership];
    }

    /**
     * @return array<string, string>
     */
    private function tenantHeader(Tenant $tenant): array
    {
        return ['X-Tenant-ID' => (string) $tenant->id];
    }
}
