<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\PlatformAdmin;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Auth\InvitationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthenticationFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_only_with_active_tenant_membership(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create([
            'email' => 'member@example.com',
            'password' => 'password',
        ]);
        $membership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'status' => 'active',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'MEMBER@example.com',
            'password' => 'password',
        ], ['X-Tenant-ID' => (string) $tenant->id])
            ->assertOk()
            ->assertJsonPath('user.email', 'member@example.com')
            ->assertJsonPath('membership.id', $membership->id);

        $this->assertAuthenticatedAs($user);
        $this->assertNotNull($membership->refresh()->last_accessed_at);
    }

    public function test_login_rejects_suspended_membership(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create([
            'email' => 'suspended@example.com',
            'password' => 'password',
        ]);
        TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'status' => 'suspended',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'suspended@example.com',
            'password' => 'password',
        ], ['X-Tenant-ID' => (string) $tenant->id])
            ->assertUnprocessable();

        $this->assertGuest();
    }

    public function test_current_user_returns_tenant_membership_roles_and_permissions(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create();
        $membership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
        ]);
        $role = Role::factory()->create([
            'tenant_id' => $tenant->id,
            'slug' => 'admin',
        ]);
        $permission = Permission::firstOrCreate(
            ['slug' => 'users.invite'],
            ['name' => 'Users Invite', 'description' => null],
        );

        $role->permissions()->attach($permission->id);
        $membership->roles()->attach($role->id, ['tenant_id' => $tenant->id]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/auth/me', ['X-Tenant-ID' => (string) $tenant->id])
            ->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('tenant.id', $tenant->id)
            ->assertJsonPath('membership.id', $membership->id)
            ->assertJsonPath('roles.0.slug', 'admin')
            ->assertJsonPath('permissions.0.slug', 'users.invite');
    }

    public function test_invitation_creation_normalizes_email_and_prevents_duplicate_pending_invites(): void
    {
        $tenant = Tenant::factory()->create();
        $inviter = User::factory()->create();
        $membership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $inviter->id,
        ]);
        $adminRole = Role::factory()->create(['tenant_id' => $tenant->id, 'slug' => 'admin']);
        $studentRole = Role::factory()->create(['tenant_id' => $tenant->id, 'slug' => 'student']);
        $permission = Permission::firstOrCreate(
            ['slug' => 'users.invite'],
            ['name' => 'Users Invite', 'description' => null],
        );

        $adminRole->permissions()->attach($permission->id);
        $membership->roles()->attach($adminRole->id, ['tenant_id' => $tenant->id]);

        Sanctum::actingAs($inviter);

        $this->postJson('/api/v1/auth/invitations', [
            'email' => '  New.User@Example.COM ',
            'role_ids' => [$studentRole->id],
        ], ['X-Tenant-ID' => (string) $tenant->id])
            ->assertCreated()
            ->assertJsonPath('invitation.normalized_email', 'new.user@example.com');

        $this->postJson('/api/v1/auth/invitations', [
            'email' => 'new.user@example.com',
            'role_ids' => [$studentRole->id],
        ], ['X-Tenant-ID' => (string) $tenant->id])
            ->assertUnprocessable();
    }

    public function test_invitation_acceptance_creates_new_global_user_and_active_membership(): void
    {
        $tenant = Tenant::factory()->create();
        $role = Role::factory()->create(['tenant_id' => $tenant->id, 'slug' => 'student']);
        $token = app(InvitationService::class)
            ->create($tenant, 'invitee@example.com', [$role->id])['token'];

        $this->postJson('/api/v1/auth/invitations/accept', [
            'token' => $token,
            'name' => 'Invitee',
            'password' => 'password',
        ], ['X-Tenant-ID' => (string) $tenant->id])
            ->assertOk()
            ->assertJsonPath('membership.status', 'active');

        $user = User::query()->where('email', 'invitee@example.com')->firstOrFail();
        $membership = TenantUser::query()
            ->where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $this->assertTrue($membership->roles()->where('roles.slug', 'student')->exists());
        $this->assertDatabaseHas('tenant_invitations', [
            'normalized_email' => 'invitee@example.com',
            'status' => 'accepted',
        ]);
    }

    public function test_password_reset_is_global_and_invalidates_tokens(): void
    {
        Notification::fake();

        $tenant = Tenant::factory()->create();
        $user = User::factory()->create([
            'email' => 'reset@example.com',
            'password' => 'old-password',
        ]);
        $plainToken = Password::createToken($user);
        $apiToken = $user->createToken('test-token');

        $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'reset@example.com',
        ], ['X-Tenant-ID' => (string) $tenant->id])
            ->assertOk()
            ->assertJsonPath('message', 'If the account exists, a password reset link has been sent.');

        $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'reset@example.com',
            'token' => $plainToken,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ], ['X-Tenant-ID' => (string) $tenant->id])
            ->assertOk();

        $this->assertTrue(Hash::check('new-password', $user->refresh()->password));
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $apiToken->accessToken->id]);
    }

    public function test_platform_super_admin_is_global_not_a_tenant_role(): void
    {
        $user = User::factory()->create();
        PlatformAdmin::factory()->create(['user_id' => $user->id]);

        $this->assertTrue($user->isPlatformSuperAdmin());
        $this->assertSame(0, $user->memberships()->count());
    }
}
