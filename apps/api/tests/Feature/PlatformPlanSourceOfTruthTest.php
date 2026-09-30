<?php

namespace Tests\Feature;

use App\Models\PlatformAdmin;
use App\Models\PlatformPlan;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Usage\SubscriptionLimitService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Regression coverage for the plan source-of-truth foundation.
 *
 * `platform_plans` is the canonical plan catalogue and
 * `tenants.platform_plan_id` is the tenant's assigned plan. `tenants.plan` is
 * legacy compatibility data and must never override an assigned plan.
 */
class PlatformPlanSourceOfTruthTest extends TestCase
{
    use RefreshDatabase;

    private function platformAdmin(): User
    {
        $admin = User::factory()->create();
        PlatformAdmin::factory()->create(['user_id' => $admin->id]);

        return $admin;
    }

    private function asPlatformAdmin(): User
    {
        $admin = $this->platformAdmin();
        Sanctum::actingAs($admin, ['platform:access']);

        return $admin;
    }

    /**
     * @param  array<string, mixed>  $limits
     */
    private function plan(array $limits = [], array $overrides = []): PlatformPlan
    {
        return PlatformPlan::create(array_merge([
            'name' => 'Plan '.fake()->unique()->numberBetween(1, 999999),
            'slug' => 'plan-'.fake()->unique()->slug(2),
            'status' => 'active',
            'limits' => $limits,
        ], $overrides));
    }

    public function test_tenant_with_assigned_platform_plan_resolves_limits_from_the_plan(): void
    {
        $plan = $this->plan([
            'storage' => 5 * 1024 ** 3,
            'bandwidth' => 7 * 1024 ** 3,
            'videos' => 42,
        ]);

        $tenant = Tenant::factory()->create(['platform_plan_id' => $plan->id]);

        $limits = app(SubscriptionLimitService::class);

        $this->assertSame(5 * 1024 ** 3, $limits->getStorageLimit($tenant->id));
        $this->assertSame(7 * 1024 ** 3, $limits->getBandwidthLimit($tenant->id));
        $this->assertSame(42, $limits->getVideoCountLimit($tenant->id));
    }

    public function test_tenant_without_platform_plan_falls_back_to_default_limits(): void
    {
        $tenant = Tenant::factory()->create(['platform_plan_id' => null]);

        $this->assertDatabaseHas('tenants', ['id' => $tenant->id, 'platform_plan_id' => null]);

        $limits = app(SubscriptionLimitService::class);

        $this->assertSame(1073741824, $limits->getStorageLimit($tenant->id));
        $this->assertSame(100, $limits->getVideoCountLimit($tenant->id));
        $this->assertSame(10000, $limits->getViewsLimit($tenant->id));
    }

    public function test_legacy_tenants_with_plan_json_still_resolve_default_limits(): void
    {
        $tenant = Tenant::factory()->create([
            'platform_plan_id' => null,
            'plan' => ['name' => 'Legacy', 'limits' => ['storage' => 999, 'videos' => 999]],
        ]);

        $limits = app(SubscriptionLimitService::class);

        $this->assertSame(1073741824, $limits->getStorageLimit($tenant->id));
        $this->assertSame(100, $limits->getVideoCountLimit($tenant->id));
    }

    public function test_tenants_plan_json_does_not_override_an_assigned_platform_plan(): void
    {
        $plan = $this->plan(['storage' => 2048, 'videos' => 11]);

        $tenant = Tenant::factory()->create([
            'platform_plan_id' => $plan->id,
            'plan' => ['name' => 'Legacy', 'limits' => ['storage' => 999999, 'videos' => 999999]],
        ]);

        $limits = app(SubscriptionLimitService::class);

        $this->assertSame(2048, $limits->getStorageLimit($tenant->id));
        $this->assertSame(11, $limits->getVideoCountLimit($tenant->id));
    }

    public function test_enforced_keys_without_a_plan_counterpart_keep_their_defaults(): void
    {
        $plan = $this->plan(['storage' => 2048, 'bandwidth' => 4096, 'videos' => 5]);

        $tenant = Tenant::factory()->create(['platform_plan_id' => $plan->id]);

        $limits = app(SubscriptionLimitService::class);

        $this->assertSame(10000, $limits->getViewsLimit($tenant->id));
        $this->assertSame(1000, $limits->getUploadLimit($tenant->id));
        $this->assertSame(100000, $limits->getRequestLimit($tenant->id));
        $this->assertSame(500, $limits->getFolderLimit($tenant->id));
        $this->assertSame(50, $limits->getCollectionLimit($tenant->id));
    }

    public function test_get_all_limits_reports_every_enforced_key_from_the_plan(): void
    {
        $plan = $this->plan(['storage' => 1, 'bandwidth' => 2, 'videos' => 3]);
        $tenant = Tenant::factory()->create(['platform_plan_id' => $plan->id]);

        $all = app(SubscriptionLimitService::class)->getAllLimits($tenant->id);

        $this->assertSame(
            ['storage', 'bandwidth', 'views', 'videos', 'uploads', 'requests', 'folders', 'collections'],
            array_keys($all),
        );
        $this->assertSame(1, $all['storage']);
        $this->assertSame(2, $all['bandwidth']);
        $this->assertSame(3, $all['videos']);
    }

    public function test_unlimited_sentinel_is_distinguishable_from_a_zero_limit(): void
    {
        $plan = $this->plan([
            'storage' => PlatformPlan::UNLIMITED,
            'bandwidth' => 0,
        ]);

        $tenant = Tenant::factory()->create(['platform_plan_id' => $plan->id]);

        $limits = app(SubscriptionLimitService::class);

        $this->assertTrue($limits->isUnlimited($tenant->id, 'storage'));
        $this->assertNull($limits->getLimitValue($tenant->id, 'storage'));

        $this->assertFalse($limits->isUnlimited($tenant->id, 'bandwidth'));
        $this->assertSame(0, $limits->getLimitValue($tenant->id, 'bandwidth'));
    }

    public function test_null_in_plan_limits_is_treated_as_unlimited(): void
    {
        $plan = $this->plan(['videos' => null]);
        $tenant = Tenant::factory()->create(['platform_plan_id' => $plan->id]);

        $limits = app(SubscriptionLimitService::class);

        $this->assertTrue($limits->isUnlimited($tenant->id, 'videos'));
        $this->assertNull($limits->getLimitValue($tenant->id, 'videos'));
    }

    public function test_a_key_absent_from_the_plan_is_neither_defined_nor_unlimited(): void
    {
        $plan = $this->plan(['storage' => 4096]);
        $tenant = Tenant::factory()->create(['platform_plan_id' => $plan->id]);

        $limits = app(SubscriptionLimitService::class);

        $this->assertFalse($limits->isUnlimited($tenant->id, 'videos'));
        $this->assertNull($limits->getLimitValue($tenant->id, 'videos'));
        $this->assertSame(100, $limits->getVideoCountLimit($tenant->id));
    }

    public function test_platform_plan_assignment_persists_through_the_platform_api(): void
    {
        $this->asPlatformAdmin();

        $plan = $this->plan(['storage' => 8192]);
        $tenant = Tenant::factory()->create(['platform_plan_id' => null]);

        $this->putJson("/api/platform/tenants/{$tenant->id}", ['platform_plan_id' => $plan->id])
            ->assertOk()
            ->assertJsonPath('tenant.platformPlanId', (string) $plan->id)
            ->assertJsonPath('tenant.platformPlan.id', (string) $plan->id)
            ->assertJsonPath('tenant.platformPlan.name', $plan->name);

        $this->assertDatabaseHas('tenants', [
            'id' => $tenant->id,
            'platform_plan_id' => $plan->id,
        ]);
    }

    public function test_invalid_platform_plan_assignment_is_rejected(): void
    {
        $this->asPlatformAdmin();

        $tenant = Tenant::factory()->create(['platform_plan_id' => null]);

        $this->putJson("/api/platform/tenants/{$tenant->id}", ['platform_plan_id' => 999999])
            ->assertStatus(422)
            ->assertJsonValidationErrors('platform_plan_id');

        $this->assertDatabaseHas('tenants', ['id' => $tenant->id, 'platform_plan_id' => null]);
    }

    public function test_platform_plan_can_be_unassigned(): void
    {
        $this->asPlatformAdmin();

        $plan = $this->plan();
        $tenant = Tenant::factory()->create(['platform_plan_id' => $plan->id]);

        $this->putJson("/api/platform/tenants/{$tenant->id}", ['platform_plan_id' => null])->assertOk();

        $this->assertDatabaseHas('tenants', ['id' => $tenant->id, 'platform_plan_id' => null]);
    }

    public function test_plan_crud_requires_platform_admin(): void
    {
        $tenantUser = User::factory()->create();

        Sanctum::actingAs($tenantUser, ['*']);

        $this->getJson('/api/platform/plans')->assertStatus(403);
        $this->postJson('/api/platform/plans', ['name' => 'Sneaky'])->assertStatus(403);
    }

    public function test_plan_crud_requires_authentication(): void
    {
        $this->getJson('/api/platform/plans')->assertStatus(401);
    }

    public function test_platform_admin_can_run_plan_crud(): void
    {
        $this->asPlatformAdmin();

        $this->postJson('/api/platform/plans', [
            'name' => 'Growth',
            'limits' => ['storage' => 1024],
        ])->assertCreated()->assertJsonPath('data.name', 'Growth');

        $plan = PlatformPlan::query()->where('name', 'Growth')->firstOrFail();

        $this->getJson("/api/platform/plans/{$plan->id}")->assertOk()->assertJsonPath('data.id', $plan->id);
        $this->getJson('/api/platform/plans')->assertOk()->assertJsonPath('total', 1);
        $this->getJson('/api/platform/plans/metrics')->assertOk()->assertJsonPath('totalPlans', 1);

        $this->putJson("/api/platform/plans/{$plan->id}", ['limits' => ['storage' => 2048]])
            ->assertOk()
            ->assertJsonPath('data.limits.storage', 2048);

        $this->deleteJson("/api/platform/plans/{$plan->id}")->assertOk();

        $this->assertDatabaseMissing('platform_plans', ['id' => $plan->id]);
    }

    public function test_deleting_a_plan_assigned_to_a_tenant_is_rejected(): void
    {
        $this->asPlatformAdmin();

        $plan = $this->plan();
        Tenant::factory()->create(['platform_plan_id' => $plan->id]);

        $this->deleteJson("/api/platform/plans/{$plan->id}")
            ->assertStatus(409)
            ->assertJsonPath('assigned_tenants', 1);

        $this->assertDatabaseHas('platform_plans', ['id' => $plan->id]);
    }

    public function test_bulk_delete_skips_plans_that_are_assigned(): void
    {
        $this->asPlatformAdmin();

        $assigned = $this->plan();
        $free = $this->plan();
        Tenant::factory()->create(['platform_plan_id' => $assigned->id]);

        $this->postJson('/api/platform/plans/bulk/delete', ['ids' => [$assigned->id, $free->id]])
            ->assertStatus(409);

        $this->assertDatabaseHas('platform_plans', ['id' => $assigned->id]);
        $this->assertDatabaseHas('platform_plans', ['id' => $free->id]);
    }

    public function test_foreign_key_prevents_deleting_a_plan_that_is_still_assigned(): void
    {
        $plan = $this->plan();
        Tenant::factory()->create(['platform_plan_id' => $plan->id]);

        $this->expectException(QueryException::class);

        $plan->delete();
    }

    public function test_tenant_delete_does_not_delete_the_assigned_plan(): void
    {
        $plan = $this->plan();
        $tenant = Tenant::factory()->create(['platform_plan_id' => $plan->id]);

        $tenant->delete();

        $this->assertDatabaseHas('platform_plans', ['id' => $plan->id]);
    }

    public function test_plan_cache_is_invalidated_after_a_plan_update(): void
    {
        $plan = $this->plan(['storage' => 111]);
        $tenant = Tenant::factory()->create(['platform_plan_id' => $plan->id]);

        $limits = app(SubscriptionLimitService::class);
        $this->assertSame(111, $limits->getStorageLimit($tenant->id));
        $this->assertTrue(Cache::has(PlatformPlan::limitsCacheKey($plan->id)));

        $plan->update(['limits' => ['storage' => 222]]);

        $this->assertFalse(Cache::has(PlatformPlan::limitsCacheKey($plan->id)));
        $this->assertSame(222, $limits->getStorageLimit($tenant->id));
    }

    public function test_plan_changes_are_visible_without_a_container_or_worker_restart(): void
    {
        $plan = $this->plan(['storage' => 100]);
        $tenant = Tenant::factory()->create(['platform_plan_id' => $plan->id]);

        $limits = app(SubscriptionLimitService::class);
        $this->assertSame(100, $limits->getStorageLimit($tenant->id));

        // A completely separate "process": brand new service and model instances
        // resolve the same container, i.e. no PHP-FPM restart is involved.
        $plan->forceFill(['limits' => ['storage' => 999]])->save();

        $this->assertSame(999, app(SubscriptionLimitService::class)->getStorageLimit($tenant->id));
        $this->assertSame(999, (new SubscriptionLimitService)->getStorageLimit($tenant->id));
    }

    public function test_multiple_tenants_can_reference_the_same_platform_plan(): void
    {
        $plan = $this->plan(['storage' => 4096]);

        $a = Tenant::factory()->create(['platform_plan_id' => $plan->id]);
        $b = Tenant::factory()->create(['platform_plan_id' => $plan->id]);

        $limits = app(SubscriptionLimitService::class);

        $this->assertSame(4096, $limits->getStorageLimit($a->id));

        $this->assertTrue(Cache::has(PlatformPlan::limitsCacheKey($plan->id)));
        $this->assertSame(
            ['storage' => 4096],
            Cache::get(PlatformPlan::limitsCacheKey($plan->id)),
            'Both tenants must share one cached plan definition.',
        );
        $this->assertSame(4096, $limits->getStorageLimit($b->id));

        $plan->update(['limits' => ['storage' => 8192]]);

        $this->assertSame(8192, $limits->getStorageLimit($a->id));
        $this->assertSame(8192, $limits->getStorageLimit($b->id));
    }

    public function test_changing_a_tenant_assignment_switches_the_resolved_plan_immediately(): void
    {
        $first = $this->plan(['storage' => 1000]);
        $second = $this->plan(['storage' => 2000]);

        $tenant = Tenant::factory()->create(['platform_plan_id' => $first->id]);

        $limits = app(SubscriptionLimitService::class);
        $this->assertSame(1000, $limits->getStorageLimit($tenant->id));

        $tenant->update(['platform_plan_id' => $second->id]);

        $this->assertSame(2000, $limits->getStorageLimit($tenant->id));

        $tenant->update(['platform_plan_id' => null]);

        $this->assertSame(1073741824, $limits->getStorageLimit($tenant->id));
    }

    public function test_tenant_resource_reports_the_canonical_plan_and_not_legacy_plan_json(): void
    {
        $this->asPlatformAdmin();

        $plan = $this->plan(['storage' => 1234, 'bandwidth' => 5678, 'videos' => 9]);
        $tenant = Tenant::factory()->create([
            'platform_plan_id' => $plan->id,
            'plan' => ['name' => 'Legacy Name', 'limits' => ['storage' => 1, 'videos' => 2]],
        ]);

        $response = $this->getJson("/api/platform/tenants/{$tenant->id}")->assertOk();

        $tenantPayload = $response->json('tenant');

        $this->assertSame((string) $plan->id, $tenantPayload['platformPlanId']);
        $this->assertSame($plan->name, $tenantPayload['platformPlan']['name']);
        $this->assertSame($plan->name, $tenantPayload['subscription']['planName']);
        $this->assertSame((string) $plan->id, $tenantPayload['subscription']['planId']);
        $this->assertSame(1234, $tenantPayload['limits']['storage']);
        $this->assertSame(5678, $tenantPayload['limits']['bandwidth']);
        $this->assertSame(9, $tenantPayload['limits']['videos']);
    }

    public function test_tenant_resource_reports_no_canonical_plan_for_a_legacy_tenant(): void
    {
        $this->asPlatformAdmin();

        $tenant = Tenant::factory()->create([
            'platform_plan_id' => null,
            'plan' => ['name' => 'Legacy Name', 'limits' => ['storage' => 77]],
        ]);

        $payload = $this->getJson("/api/platform/tenants/{$tenant->id}")->assertOk()->json('tenant');

        $this->assertNull($payload['platformPlanId']);
        $this->assertNull($payload['platformPlan']);
        $this->assertSame('Legacy Name', $payload['subscription']['planName']);
        $this->assertSame(77, $payload['limits']['storage']);
    }

    public function test_tenant_users_cannot_assign_a_platform_plan(): void
    {
        $plan = $this->plan();
        $tenant = Tenant::factory()->create();

        Sanctum::actingAs(User::factory()->create(), ['*']);

        $this->putJson("/api/platform/tenants/{$tenant->id}", ['platform_plan_id' => $plan->id])
            ->assertStatus(403);

        $this->assertDatabaseHas('tenants', ['id' => $tenant->id, 'platform_plan_id' => null]);
    }
}
