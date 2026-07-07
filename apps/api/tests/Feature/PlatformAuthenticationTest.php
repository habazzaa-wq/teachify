<?php

namespace Tests\Feature;

use App\Models\PlatformAdmin;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PlatformAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_platform_admin_can_login_and_receive_token(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@platform.com',
            'password' => Hash::make('password'),
        ]);

        PlatformAdmin::factory()->create([
            'user_id' => $user->id,
            'status' => 'active',
            'role' => 'super_admin',
        ]);

        $response = $this->postJson('/api/platform/auth/login', [
            'email' => 'admin@platform.com',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.email', 'admin@platform.com')
            ->assertJsonStructure(['token', 'platform_admin']);

        $token = $response->json('token');

        $this->getJson('/api/platform/auth/me', [
            'Authorization' => 'Bearer '.$token,
        ])
            ->assertOk()
            ->assertJsonPath('platform_admin.role', 'super_admin');
    }

    public function test_tenant_user_without_platform_admin_cannot_login(): void
    {
        User::factory()->create([
            'email' => 'tenant@example.com',
            'password' => Hash::make('password'),
        ]);

        $this->postJson('/api/platform/auth/login', [
            'email' => 'tenant@example.com',
            'password' => 'password',
        ])->assertUnprocessable();
    }
}
