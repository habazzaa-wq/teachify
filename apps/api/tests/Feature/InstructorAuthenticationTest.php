<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantInvitation;
use App\Models\TenantUser;
use App\Models\User;
use App\Repositories\TenantRepository;
use App\Services\Auth\InvitationService;
use App\Services\Auth\AuthenticationService;
use App\Services\Instructors\InstructorAccountService;
use App\Services\Tenant\TenantUserService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\Sanctum;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class InstructorAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_admin_can_provision_an_exclusive_instructor_identity(): void
    {
        [$tenant, $admin] = $this->tenantWithAdmin();
        $headers = ['X-Tenant-ID' => (string) $tenant->id];
        Sanctum::actingAs($admin);

        $this->postJson('/api/v1/instructors', [
            'name' => 'New Instructor',
            'email' => 'instructor@example.test',
        ], $headers)
            ->assertCreated()
            ->assertJsonPath('data.name', 'New Instructor')
            ->assertJsonPath('data.email', 'instructor@example.test')
            ->assertJsonStructure(['temporary_password']);

        $user = User::query()->where('email', 'instructor@example.test')->firstOrFail();
        $membership = TenantUser::query()->where('user_id', $user->id)->firstOrFail();
        $this->assertTrue($membership->is_instructor);
        $this->assertTrue($membership->must_change_password);
        $this->assertSame(['instructor'], $membership->roles()->pluck('slug')->all());
        $this->assertSame(1, TenantUser::query()->where('user_id', $user->id)->count());

        $otherTenant = Tenant::factory()->create();
        $existingUser = User::factory()->create(['email' => 'member@example.test']);
        TenantUser::factory()->create([
            'tenant_id' => $otherTenant->id,
            'user_id' => $existingUser->id,
        ]);

        $this->postJson('/api/v1/instructors', [
            'name' => 'Existing Member',
            'email' => $existingUser->email,
        ], $headers)->assertUnprocessable();

        $this->assertSame(1, TenantUser::query()->where('user_id', $existingUser->id)->count());
    }

    public function test_instructor_login_forces_password_change_and_isolated_token_context(): void
    {
        $tenant = $this->instructorTenant();
        $result = app(InstructorAccountService::class)->create($tenant, 'Instructor', 'instructor@example.test');
        $headers = ['X-Tenant-ID' => (string) $tenant->id];

        $login = $this->postJson('/api/v1/instructor/auth/login', [
            'email' => 'instructor@example.test',
            'password' => $result['temporary_password'],
        ], $headers)
            ->assertOk()
            ->assertJsonPath('must_change_password', true)
            ->assertJsonPath('refresh_token', null);

        $loginData = $login->json();
        $this->assertArrayNotHasKey('password', $loginData['user']);
        $restrictedToken = $loginData['access_token'];

        $this->withHeaders($headers + ['Authorization' => 'Bearer '.$restrictedToken])
            ->getJson('/api/v1/instructor/auth/me')
            ->assertForbidden()
            ->assertJsonPath('error', 'PASSWORD_CHANGE_REQUIRED');

        $this->withHeaders($headers + ['Authorization' => 'Bearer '.$restrictedToken])
            ->getJson('/api/v1/auth/me')
            ->assertForbidden();

        $this->postJson('/api/v1/auth/login', [
            'email' => 'instructor@example.test',
            'password' => $result['temporary_password'],
        ], $headers)->assertUnprocessable();

        $change = $this->withHeaders($headers + ['Authorization' => 'Bearer '.$restrictedToken])
            ->postJson('/api/v1/instructor/auth/change-password', [
                'password' => 'permanent-password',
                'password_confirmation' => 'permanent-password',
            ])
            ->assertOk()
            ->assertJsonPath('must_change_password', false);

        $this->assertNull(PersonalAccessToken::findToken($restrictedToken));
        $this->app['auth']->forgetGuards();
        $this->withHeaders($headers + ['Authorization' => 'Bearer '.$restrictedToken])
            ->getJson('/api/v1/instructor/auth/me')
            ->assertUnauthorized();

        $accessToken = $change->json('access_token');
        $this->withHeaders($headers + ['Authorization' => 'Bearer '.$accessToken])
            ->getJson('/api/v1/instructor/auth/me')
            ->assertOk()
            ->assertJsonPath('membership.must_change_password', false);

        $this->postJson('/api/v1/instructor/auth/refresh', [
            'refresh_token' => $change->json('refresh_token'),
        ], $headers)->assertOk()->assertJsonStructure(['access_token']);

        $instructor = User::query()->where('email', 'instructor@example.test')->firstOrFail();
        $expiredRefreshToken = $instructor->createToken(
            'instructor_refresh_token',
            ['instructor:refresh', 'instructor:tenant:'.$tenant->id],
            now()->subMinute(),
        )->plainTextToken;
        $this->postJson('/api/v1/instructor/auth/refresh', [
            'refresh_token' => $expiredRefreshToken,
        ], $headers)->assertUnauthorized();

        $nonExpiringRefreshToken = $instructor->createToken(
            'instructor_refresh_token',
            ['instructor:refresh', 'instructor:tenant:'.$tenant->id],
        )->plainTextToken;
        $this->postJson('/api/v1/instructor/auth/refresh', [
            'refresh_token' => $nonExpiringRefreshToken,
        ], $headers)->assertUnauthorized();

        $tenant->forceFill(['feature_flags' => ['has_instructors' => false]])->save();
        app(TenantRepository::class)->forget($tenant->id);
        $this->postJson('/api/v1/instructor/auth/refresh', [
            'refresh_token' => $change->json('refresh_token'),
        ], $headers)->assertNotFound();
        $this->postJson('/api/v1/instructor/auth/login', [
            'email' => 'instructor@example.test',
            'password' => 'permanent-password',
        ], $headers)->assertNotFound();
    }

    public function test_generic_membership_paths_cannot_create_or_upgrade_instructor_accounts(): void
    {
        [$tenant, $admin] = $this->tenantWithAdmin();
        $headers = ['X-Tenant-ID' => (string) $tenant->id];
        $instructorRole = Role::query()
            ->where('tenant_id', $tenant->id)
            ->where('slug', 'instructor')
            ->firstOrFail();
        $ordinaryRole = Role::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Course Manager',
            'slug' => 'course-manager',
        ]);
        $ordinaryUser = User::factory()->create();
        $ordinaryMembership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $ordinaryUser->id,
        ]);
        $ordinaryMembership->roles()->attach($ordinaryRole, ['tenant_id' => $tenant->id]);

        Sanctum::actingAs($admin);
        $this->postJson('/api/v1/users', [
            'name' => 'Generic Instructor',
            'email' => 'generic-instructor@example.test',
            'password' => 'password123',
            'role_ids' => [$instructorRole->id],
        ], $headers)->assertUnprocessable();
        $this->assertDatabaseMissing('users', ['email' => 'generic-instructor@example.test']);

        $this->putJson('/api/v1/users/'.$ordinaryMembership->id, [
            'name' => 'Must Not Be Updated',
            'role_ids' => [$instructorRole->id],
        ], $headers)->assertUnprocessable();
        $this->assertSame($ordinaryUser->name, $ordinaryUser->fresh()->name);

        try {
            app(InvitationService::class)->create($tenant, 'invited@example.test', [$instructorRole->id], $admin);
            $this->fail('The invitation flow accepted the Instructor role.');
        } catch (ValidationException) {
            $this->assertDatabaseMissing('tenant_invitations', [
                'tenant_id' => $tenant->id,
                'normalized_email' => 'invited@example.test',
            ]);
        }
    }

    public function test_restoring_an_instructor_membership_checks_single_tenant_invariant_before_restore(): void
    {
        $tenant = $this->instructorTenant();
        $user = User::factory()->create();
        $deletedMembership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'is_instructor' => true,
        ]);
        $deletedMembership->delete();
        TenantUser::factory()->create([
            'tenant_id' => Tenant::factory()->create()->id,
            'user_id' => $user->id,
        ]);
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);

        try {
            app(TenantUserService::class)->restore($deletedMembership->id);
            $this->fail('A second tenant membership was restored for this instructor.');
        } catch (ValidationException) {
            $this->assertSoftDeleted('tenant_users', ['id' => $deletedMembership->id]);
        }
    }

    public function test_legacy_instructor_role_keeps_existing_login_behavior_when_feature_is_disabled(): void
    {
        $tenant = Tenant::factory()->create(['feature_flags' => ['has_instructors' => false]]);
        $user = User::factory()->create(['email' => 'legacy-instructor@example.test']);
        $membership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'is_instructor' => false,
        ]);
        $role = Role::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Instructor',
            'slug' => 'instructor',
        ]);
        $membership->roles()->attach($role, ['tenant_id' => $tenant->id]);

        $result = app(AuthenticationService::class)->login($tenant, $user->email, 'password');

        $this->assertSame('access_token', $result['access_token']->accessToken->name);
    }

    public function test_invitation_acceptance_cannot_add_an_existing_instructor_to_another_tenant(): void
    {
        $instructorTenant = $this->instructorTenant();
        $instructor = User::factory()->create(['email' => 'instructor@example.test']);
        $membership = TenantUser::factory()->create([
            'tenant_id' => $instructorTenant->id,
            'user_id' => $instructor->id,
            'is_instructor' => true,
            'must_change_password' => true,
        ]);
        $instructorRole = Role::query()
            ->where('tenant_id', $instructorTenant->id)
            ->where('slug', 'instructor')
            ->firstOrFail();
        $membership->roles()->attach($instructorRole, ['tenant_id' => $instructorTenant->id]);

        $targetTenant = Tenant::factory()->create();
        $studentRole = Role::factory()->create([
            'tenant_id' => $targetTenant->id,
            'name' => 'Student',
            'slug' => 'student',
        ]);
        $token = 'instructor-cross-tenant-invitation-token';
        $invitation = TenantInvitation::factory()->withToken($token)->create([
            'tenant_id' => $targetTenant->id,
            'email' => $instructor->email,
            'normalized_email' => $instructor->email,
        ]);
        $invitation->roles()->attach($studentRole, ['tenant_id' => $targetTenant->id]);

        try {
            app(InvitationService::class)->accept(
                $targetTenant,
                $token,
                authenticatedUser: $instructor,
            );
            $this->fail('Instructor membership was accepted in a second tenant.');
        } catch (ValidationException) {
            $this->assertSame(1, TenantUser::withTrashed()->where('user_id', $instructor->id)->count());
        }
    }

    /**
     * @return array{Tenant, User}
     */
    private function tenantWithAdmin(): array
    {
        $tenant = $this->instructorTenant();
        $admin = User::factory()->create();
        $membership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $admin->id,
        ]);
        $role = Role::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Tenant Admin',
            'slug' => 'tenant_owner',
        ]);
        $permission = \App\Models\Permission::query()->firstOrCreate(
            ['slug' => 'users.manage'],
            ['name' => 'Manage Users'],
        );
        $role->permissions()->attach($permission);
        $membership->roles()->attach($role, ['tenant_id' => $tenant->id]);

        return [$tenant, $admin];
    }

    private function instructorTenant(): Tenant
    {
        $tenant = Tenant::factory()->create([
            'feature_flags' => ['has_instructors' => true],
        ]);
        Role::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Instructor',
            'slug' => 'instructor',
        ]);

        return $tenant;
    }
}
