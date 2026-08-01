<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TenantPhoneLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_with_phone_stored_on_tenant_membership(): void
    {
        $tenant = Tenant::factory()->create(['status' => 'active']);
        $user = User::factory()->create([
            'email' => 'student_abc@acme.local',
            'password' => Hash::make('password'),
        ]);
        TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'status' => 'active',
            'phone' => '01012345678',
        ]);

        $this->postJson('/api/v1/tenant/auth/login', [
            'phone' => '01012345678',
            'password' => 'password',
        ], ['X-Tenant-ID' => (string) $tenant->id])
            ->assertOk()
            ->assertJsonPath('user.email', $user->email);
    }

    public function test_login_with_phone_stored_on_global_user(): void
    {
        $tenant = Tenant::factory()->create(['status' => 'active']);
        $user = User::factory()->create([
            'email' => 'teacher@example.com',
            'phone' => '01123456789',
            'password' => Hash::make('password'),
        ]);
        TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'status' => 'active',
        ]);

        $this->postJson('/api/v1/tenant/auth/login', [
            'phone' => '01123456789',
            'password' => 'password',
        ], ['X-Tenant-ID' => (string) $tenant->id])
            ->assertOk()
            ->assertJsonPath('user.email', $user->email);
    }

    public function test_login_with_email_still_works(): void
    {
        $tenant = Tenant::factory()->create(['status' => 'active']);
        $user = User::factory()->create([
            'email' => 'member@example.com',
            'password' => Hash::make('password'),
        ]);
        TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'status' => 'active',
        ]);

        $this->postJson('/api/v1/tenant/auth/login', [
            'email' => 'MEMBER@example.com',
            'password' => 'password',
        ], ['X-Tenant-ID' => (string) $tenant->id])
            ->assertOk()
            ->assertJsonPath('user.email', 'member@example.com');
    }

    public function test_login_rejects_wrong_password_for_phone(): void
    {
        $tenant = Tenant::factory()->create(['status' => 'active']);
        $user = User::factory()->create([
            'email' => 'student_xyz@acme.local',
            'password' => Hash::make('password'),
        ]);
        TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'status' => 'active',
            'phone' => '01234567890',
        ]);

        $this->postJson('/api/v1/tenant/auth/login', [
            'phone' => '01234567890',
            'password' => 'wrong-password',
        ], ['X-Tenant-ID' => (string) $tenant->id])
            ->assertUnprocessable();

        $this->assertGuest();
    }
}
