<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Queue\Middleware\SetTenantContext;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * P0.1 regression coverage: queued jobs must establish (and release) their
 * own tenant context and fail loudly when the tenant vanished between
 * dispatch and processing.
 */
class QueueTenantContextTest extends TestCase
{
    use RefreshDatabase;

    public function test_middleware_binds_tenant_for_job_and_releases_afterwards(): void
    {
        [$tenant] = $this->tenantWithAdmin();

        $middleware = new SetTenantContext($tenant->id);

        $seenInside = null;
        $middleware->handle(new \stdClass(), function () use (&$seenInside): void {
            $seenInside = currentTenant();
        });

        $this->assertTrue($tenant->is($seenInside));

        // Long-lived worker safety: the binding must not leak into the next job.
        $this->expectException(\RuntimeException::class);
        currentTenant();
    }

    public function test_missing_tenant_fails_loudly_instead_of_running_unscoped(): void
    {
        $middleware = new SetTenantContext(999999);

        $ran = false;
        try {
            $middleware->handle(new \stdClass(), function () use (&$ran): void {
                $ran = true;
            });
            $this->fail('Expected RuntimeException for a missing tenant.');
        } catch (\RuntimeException $exception) {
            $this->assertStringContainsString('999999', $exception->getMessage());
        }

        $this->assertFalse($ran, 'Job body must not run without tenant context.');
    }

    /** @return array{0: Tenant, 1: TenantUser} */
    private function tenantWithAdmin(): array
    {
        $tenant = Tenant::factory()->create();

        return [$tenant, $this->memberWithRole($tenant, 'admin')];
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

        if (! Permission::query()->where('slug', 'questions.create')->exists()) {
            $this->fail('Question permissions were not seeded.');
        }
    }
}
