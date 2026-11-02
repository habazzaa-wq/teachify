<?php

namespace Tests\Feature;

use App\Http\Resources\CourseResource;
use App\Models\Course;
use App\Models\Exam;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantInvitation;
use App\Models\TenantUser;
use App\Models\User;
use App\Repositories\TenantRepository;
use App\Services\Auth\AuthenticationService;
use App\Services\Auth\InvitationService;
use App\Services\Instructors\InstructorAccountService;
use App\Services\Tenant\TenantUserService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InstructorAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_transfer_instructor_content_to_another_instructor_before_removal(): void
    {
        [$tenant, $admin] = $this->tenantWithAdmin();
        $instructor = app(InstructorAccountService::class)->create($tenant, 'Leaving Instructor', 'leaving@example.test')['membership'];
        $replacement = app(InstructorAccountService::class)->create($tenant, 'Replacement Instructor', 'replacement@example.test')['membership'];
        $course = Course::create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $instructor->id,
            'primary_instructor_tenant_user_id' => $instructor->id,
            'title' => 'Transferred Course',
            'slug' => 'transferred-course',
            'status' => 'draft',
            'visibility' => 'private',
            'pricing_type' => 'free',
        ]);
        $course->instructors()->create([
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $instructor->id,
            'role' => 'primary',
            'is_visible' => true,
        ]);
        $exam = Exam::create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $instructor->id,
            'title' => 'Transferred Exam',
            'slug' => 'transferred-exam',
        ]);
        Sanctum::actingAs($admin);

        $this->deleteJson('/api/v1/instructors/'.$instructor->id, [
            'strategy' => 'transfer_to_instructor',
            'target_instructor_id' => $replacement->id,
        ], ['X-Tenant-ID' => (string) $tenant->id])->assertOk();

        $this->assertSame($replacement->id, $course->fresh()->created_by_tenant_user_id);
        $this->assertSame($replacement->id, $course->fresh()->primary_instructor_tenant_user_id);
        $this->assertSame($replacement->id, $course->fresh()->instructors()->firstOrFail()->tenant_user_id);
        $this->assertSame($replacement->id, $exam->fresh()->created_by_tenant_user_id);
        $this->assertSoftDeleted('tenant_users', ['id' => $instructor->id]);
    }

    public function test_admin_can_transfer_instructor_content_to_tenant_and_keep_public_course_attribution(): void
    {
        [$tenant, $admin] = $this->tenantWithAdmin();
        $adminMembership = TenantUser::query()->where('user_id', $admin->id)->firstOrFail();
        $instructor = app(InstructorAccountService::class)->create($tenant, 'Archived Instructor', 'archived@example.test')['membership'];
        $course = Course::create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $instructor->id,
            'primary_instructor_tenant_user_id' => $instructor->id,
            'title' => 'Preserved Course',
            'slug' => 'preserved-course',
            'status' => 'published',
            'visibility' => 'public',
            'pricing_type' => 'free',
        ]);
        $course->instructors()->create([
            'tenant_id' => $tenant->id,
            'tenant_user_id' => $instructor->id,
            'role' => 'primary',
            'is_visible' => true,
        ]);
        Sanctum::actingAs($admin);

        $this->deleteJson('/api/v1/instructors/'.$instructor->id, [
            'strategy' => 'transfer_to_tenant',
        ], ['X-Tenant-ID' => (string) $tenant->id])->assertOk();

        $course->refresh();
        $this->assertSame($adminMembership->id, $course->created_by_tenant_user_id);
        $this->assertNull($course->primary_instructor_tenant_user_id);
        $this->assertSame('Archived Instructor', $course->instructor_attribution[0]['name']);
        $this->assertSame('public', $course->visibility);
        $resource = (new CourseResource(
            Course::query()->with(['primaryInstructor.user', 'instructors.membership.user'])->findOrFail($course->id),
        ))->resolve();
        $this->assertSame('Archived Instructor', $resource['instructor']['name']);
        $this->assertContains('Archived Instructor', array_column($resource['instructors']->all(), 'name'));
    }

    public function test_admin_can_remove_instructor_content_and_preserve_shared_courses(): void
    {
        [$tenant, $admin] = $this->tenantWithAdmin();
        $instructor = app(InstructorAccountService::class)->create($tenant, 'Removed Instructor', 'removed@example.test')['membership'];
        $coInstructor = app(InstructorAccountService::class)->create($tenant, 'Co Instructor', 'co-instructor@example.test')['membership'];
        $course = Course::create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $instructor->id,
            'primary_instructor_tenant_user_id' => $instructor->id,
            'title' => 'Shared Course',
            'slug' => 'shared-course',
            'status' => 'published',
            'visibility' => 'public',
            'pricing_type' => 'free',
        ]);
        $course->instructors()->createMany([
            ['tenant_id' => $tenant->id, 'tenant_user_id' => $instructor->id, 'role' => 'primary', 'is_visible' => true],
            ['tenant_id' => $tenant->id, 'tenant_user_id' => $coInstructor->id, 'role' => 'co_instructor', 'is_visible' => true],
        ]);
        $exam = Exam::create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $instructor->id,
            'title' => 'Removed Exam',
            'slug' => 'removed-exam',
        ]);
        Sanctum::actingAs($admin);

        $this->deleteJson('/api/v1/instructors/'.$instructor->id, [
            'strategy' => 'delete_content',
        ], ['X-Tenant-ID' => (string) $tenant->id])->assertOk();

        $this->assertNull($course->fresh()->deleted_at);
        $this->assertSame($coInstructor->id, $course->fresh()->primary_instructor_tenant_user_id);
        $this->assertSoftDeleted('exams', ['id' => $exam->id]);
        $this->assertSoftDeleted('tenant_users', ['id' => $instructor->id]);
    }

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

    public function test_tenant_admin_can_manage_instructor_status_and_reset_password(): void
    {
        [$tenant, $admin] = $this->tenantWithAdmin();
        $account = app(InstructorAccountService::class)->create($tenant, 'Instructor', 'managed@example.test');
        Sanctum::actingAs($admin);
        $headers = ['X-Tenant-ID' => (string) $tenant->id];

        $this->getJson('/api/v1/instructors', $headers)
            ->assertOk()
            ->assertJsonPath('data.0.status', 'active')
            ->assertJsonPath('data.0.courses', []);
        $this->getJson('/api/v1/instructors/options', $headers)
            ->assertOk()
            ->assertJsonPath('data.0.id', $account['membership']->id);

        $oldToken = $account['membership']->user->createToken('test-token')->plainTextToken;
        $reset = $this->postJson('/api/v1/instructors/'.$account['membership']->id.'/reset-password', [], $headers)
            ->assertOk()
            ->assertJsonPath('must_change_password', true);
        $temporaryPassword = $reset->json('temporary_password');
        $this->assertNotSame($account['temporary_password'], $temporaryPassword);
        $this->assertTrue(Hash::check($temporaryPassword, $account['membership']->user->fresh()->password));
        $this->assertTrue($account['membership']->fresh()->must_change_password);
        $this->assertNull(PersonalAccessToken::findToken($oldToken));

        $this->patchJson('/api/v1/instructors/'.$account['membership']->id.'/status', [
            'status' => 'suspended',
        ], $headers)->assertOk()->assertJsonPath('data.status', 'suspended');
        $this->getJson('/api/v1/instructors', $headers)
            ->assertOk()
            ->assertJsonPath('data.0.status', 'suspended');

        $this->patchJson('/api/v1/instructors/'.$account['membership']->id.'/status', [
            'status' => 'invalid',
        ], $headers)->assertUnprocessable();
        $this->patchJson('/api/v1/instructors/999999/status', [
            'status' => 'active',
        ], $headers)->assertNotFound();
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

    public function test_instructor_can_update_tenant_profile_details_and_avatar(): void
    {
        $tenant = $this->instructorTenant();
        $account = app(InstructorAccountService::class)->create($tenant, 'Instructor', 'profile@example.test');
        $headers = ['X-Tenant-ID' => (string) $tenant->id];
        $login = $this->postJson('/api/v1/instructor/auth/login', [
            'email' => 'profile@example.test',
            'password' => $account['temporary_password'],
        ], $headers)->assertOk();
        $temporaryToken = $login->json('access_token');

        $passwordChange = $this->withHeaders($headers + ['Authorization' => 'Bearer '.$temporaryToken])
            ->postJson('/api/v1/instructor/auth/change-password', [
                'password' => 'profile-password',
                'password_confirmation' => 'profile-password',
            ])
            ->assertOk();
        $this->app['auth']->forgetGuards();
        $accessToken = $passwordChange->json('access_token');

        $this->withHeaders($headers + ['Authorization' => 'Bearer '.$accessToken])
            ->putJson('/api/v1/instructor/auth/profile', [
                'first_name' => 'Updated',
                'last_name' => 'Instructor',
                'avatar' => 'https://cdn.example.test/instructor.jpg',
                'job_title' => 'Senior Instructor',
                'department' => 'Mathematics',
                'phone' => '+201234567890',
                'bio' => 'Experienced educator focused on practical learning.',
                'expertise' => 'Applied Mathematics',
                'experience_years' => 12,
                'website_url' => 'https://example.test',
                'linkedin_url' => 'https://linkedin.com/in/example',
                'youtube_url' => 'https://youtube.com/@example',
            ])
            ->assertOk()
            ->assertJsonPath('user.name', 'Updated Instructor')
            ->assertJsonPath('membership.first_name', 'Updated')
            ->assertJsonPath('membership.last_name', 'Instructor')
            ->assertJsonPath('membership.job_title', 'Senior Instructor')
            ->assertJsonPath('membership.experience_years', 12);

        $this->assertDatabaseHas('users', [
            'id' => $account['membership']->user_id,
            'name' => 'Updated Instructor',
        ]);
        $this->assertDatabaseHas('tenant_users', [
            'id' => $account['membership']->id,
            'avatar' => 'https://cdn.example.test/instructor.jpg',
            'job_title' => 'Senior Instructor',
            'department' => 'Mathematics',
            'first_name' => 'Updated',
            'last_name' => 'Instructor',
            'phone' => '+201234567890',
            'bio' => 'Experienced educator focused on practical learning.',
            'expertise' => 'Applied Mathematics',
            'experience_years' => 12,
            'website_url' => 'https://example.test',
            'linkedin_url' => 'https://linkedin.com/in/example',
            'youtube_url' => 'https://youtube.com/@example',
        ]);
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
        $permissions = collect([
            ['slug' => 'users.manage', 'name' => 'Manage Users'],
            ['slug' => 'users.view', 'name' => 'View Users'],
            ['slug' => 'courses.assign_instructors', 'name' => 'Assign Course Instructors'],
        ])->map(fn (array $permission) => Permission::query()->firstOrCreate(
            ['slug' => $permission['slug']],
            ['name' => $permission['name']],
        ));
        $role->permissions()->attach($permissions);
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
