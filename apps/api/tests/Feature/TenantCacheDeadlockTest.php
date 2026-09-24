<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\v1\Platform\TenantSettingController;
use App\Http\Middleware\IdentifyTenant;
use App\Models\PlatformAdmin;
use App\Models\Tenant;
use App\Models\User;
use App\Repositories\TenantRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Regression coverage for the confirmed tenant-cache deadlock fix.
 *
 * The production cache store is "database". phpunit.xml defaults to the
 * in-memory "array" store, which keeps objects unserialized, so these tests
 * switch the default store to the real DatabaseStore over the in-memory
 * sqlite connection to exercise serialization, write-once semantics and the
 * no-churn guarantee.
 */
class TenantCacheDeadlockTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['cache.default' => 'database']);
        Cache::forgetDriver();
    }

    public function test_cached_tenant_round_trips_as_real_tenant_instance(): void
    {
        $tenant = Tenant::factory()->create();

        Cache::put('tenant.'.$tenant->id, $tenant, 3600);

        $cached = Cache::get('tenant.'.$tenant->id);

        $this->assertInstanceOf(Tenant::class, $cached);
        $this->assertSame($tenant->id, $cached->id);
    }

    public function test_non_allowlisted_serialized_classes_remain_blocked(): void
    {
        Cache::put('arbitrary.object', (object) ['foo' => 'bar'], 3600);

        $cached = Cache::get('arbitrary.object');

        $this->assertInstanceOf(\__PHP_Incomplete_Class::class, $cached);
        $this->assertNotInstanceOf(Tenant::class, $cached);
    }

    public function test_find_by_id_returns_tenant_and_stores_it_exactly_once_on_miss(): void
    {
        $tenant = Tenant::factory()->create();
        $repo = new TenantRepository;

        $result = $repo->findById($tenant->id);

        $this->assertInstanceOf(Tenant::class, $result);
        $this->assertSame($tenant->id, $result->id);

        $row = DB::table('cache')->where('key', config('cache.prefix').'tenant.'.$tenant->id)->first();
        $this->assertNotNull($row);

        $again = $repo->findById($tenant->id);
        $this->assertInstanceOf(Tenant::class, $again);
        $this->assertSame($tenant->id, $again->id);

        $this->assertSame(1, DB::table('cache')->where('key', config('cache.prefix').'tenant.'.$tenant->id)->count());
    }

    public function test_repeated_find_by_id_does_not_churn_the_cache_table(): void
    {
        $tenant = Tenant::factory()->create();
        $repo = new TenantRepository;
        $repo->findById($tenant->id);

        DB::connection()->flushQueryLog();
        DB::connection()->enableQueryLog();

        $repo->findById($tenant->id);

        $writes = collect(DB::connection()->getQueryLog())
            ->filter(fn (array $q) => (bool) preg_match('/\b(insert|update|delete)\b/i', $q['query']))
            ->filter(fn (array $q) => str_contains(strtolower($q['query']), 'cache'));

        $this->assertCount(0, $writes);
    }

    public function test_find_by_id_cache_store_uses_write_once_add_without_upsert(): void
    {
        $tenant = Tenant::factory()->create();
        $repo = new TenantRepository;

        DB::connection()->flushQueryLog();
        DB::connection()->enableQueryLog();

        $repo->findById($tenant->id);

        $queries = collect(DB::connection()->getQueryLog())->pluck('query');
        $cacheWrites = $queries->filter(fn (string $q) => str_contains(strtolower($q), 'cache')
            && (bool) preg_match('/\b(insert|update|delete)\b/i', $q));

        $this->assertTrue(
            $cacheWrites->contains(fn (string $q) => str_contains(strtolower($q), 'insert')),
            'Expected exactly one insert into the cache table on cache miss.',
        );
        $this->assertFalse(
            $cacheWrites->contains(fn (string $q) => str_contains(strtolower($q), 'on duplicate key update')),
            'Cache store must not upsert the tenant row.',
        );
        $this->assertFalse(
            $cacheWrites->contains(fn (string $q) => str_contains(strtolower($q), 'delete')),
            'Cache store must not delete the tenant row during resolution.',
        );
    }

    public function test_find_by_id_self_heals_when_tenant_key_holds_an_unreadable_value(): void
    {
        $tenant = Tenant::factory()->create();

        Cache::put('tenant.'.$tenant->id, (object) ['poisoned' => true], 3600);

        $result = (new TenantRepository)->findById($tenant->id);

        $this->assertInstanceOf(Tenant::class, $result);
        $this->assertSame($tenant->id, $result->id);
    }

    public function test_missing_tenant_returns_null_and_is_not_cached(): void
    {
        $repo = new TenantRepository;

        $this->assertNull($repo->findById(999999));

        $this->assertFalse(DB::table('cache')->where('key', config('cache.prefix').'tenant.999999')->exists());
    }

    public function test_is_active_accepts_a_tenant_instance_without_re_resolving(): void
    {
        $tenant = Tenant::factory()->create(['status' => 'active']);

        $repo = \Mockery::mock(TenantRepository::class)->makePartial();
        $repo->shouldReceive('findById')->never();

        $this->assertTrue($repo->isActive($tenant));
    }

    public function test_is_active_returns_false_for_inactive_tenant_instance_without_re_resolving(): void
    {
        $tenant = Tenant::factory()->create(['status' => 'inactive']);

        $repo = \Mockery::mock(TenantRepository::class)->makePartial();
        $repo->shouldReceive('findById')->never();

        $this->assertFalse($repo->isActive($tenant));
    }

    public function test_identify_tenant_middleware_resolves_header_tenant_and_caches_once(): void
    {
        $tenant = Tenant::factory()->create(['status' => 'active']);

        $request = Request::create('/api/v1/exams', 'GET');
        $request->headers->set('X-Tenant-ID', (string) $tenant->id);

        $middleware = $this->app->make(IdentifyTenant::class);
        $response = $middleware->handle($request, fn (Request $r) => response()->json(['ok' => true]));

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame($tenant->id, app('currentTenant')->id);
        $this->assertInstanceOf(Tenant::class, Cache::get('tenant.'.$tenant->id));
        $this->assertSame(1, DB::table('cache')->where('key', config('cache.prefix').'tenant.'.$tenant->id)->count());
    }

    public function test_identify_tenant_middleware_rejects_unknown_tenant(): void
    {
        $request = Request::create('/api/v1/exams', 'GET');
        $request->headers->set('X-Tenant-ID', '999999');

        $middleware = $this->app->make(IdentifyTenant::class);
        $response = $middleware->handle($request, fn (Request $r) => response()->json(['ok' => true]));

        $this->assertSame(404, $response->getStatusCode());
        $this->assertSame('TENANT_NOT_FOUND', $response->getData(true)['error']);
    }

    public function test_identify_tenant_middleware_rejects_inactive_tenant(): void
    {
        $tenant = Tenant::factory()->create(['status' => 'inactive']);

        $request = Request::create('/api/v1/exams', 'GET');
        $request->headers->set('X-Tenant-ID', (string) $tenant->id);

        $middleware = $this->app->make(IdentifyTenant::class);
        $response = $middleware->handle($request, fn (Request $r) => response()->json(['ok' => true]));

        $this->assertSame(404, $response->getStatusCode());
        $this->assertSame('TENANT_NOT_FOUND', $response->getData(true)['error']);
    }

    public function test_platform_tenant_update_invalidates_cached_tenant(): void
    {
        $tenant = Tenant::factory()->create(['name' => 'Original Name']);
        (new TenantRepository)->findById($tenant->id);

        $this->assertTrue(Cache::has('tenant.'.$tenant->id));

        Sanctum::actingAs($this->platformAdmin(), ['platform:access']);

        $this->putJson('/api/platform/tenants/'.$tenant->id, ['name' => 'Updated Name'])->assertOk();

        $this->assertFalse(Cache::has('tenant.'.$tenant->id));

        $fresh = (new TenantRepository)->findById($tenant->id);
        $this->assertSame('Updated Name', $fresh->name);
    }

    public function test_platform_tenant_destroy_invalidates_cached_tenant(): void
    {
        $tenant = Tenant::factory()->create();
        (new TenantRepository)->findById($tenant->id);

        $this->assertTrue(Cache::has('tenant.'.$tenant->id));

        Sanctum::actingAs($this->platformAdmin(), ['platform:access']);

        $this->deleteJson('/api/platform/tenants/'.$tenant->id)->assertOk();

        $this->assertFalse(Cache::has('tenant.'.$tenant->id));
        $this->assertNull((new TenantRepository)->findById($tenant->id));
    }

    public function test_tenant_site_name_update_invalidates_cached_tenant(): void
    {
        $tenant = Tenant::factory()->create(['name' => 'Old Site Name']);
        (new TenantRepository)->findById($tenant->id);

        $this->assertTrue(Cache::has('tenant.'.$tenant->id));

        app()->instance('currentTenant', $tenant);

        $request = Request::create('/api/v1/tenant/settings/site', 'PUT', [
            'values' => ['name' => 'New Site Name'],
        ]);

        $controller = $this->app->make(TenantSettingController::class);
        $response = $controller->updateSite($request);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertFalse(Cache::has('tenant.'.$tenant->id));

        $fresh = (new TenantRepository)->findById($tenant->id);
        $this->assertSame('New Site Name', $fresh->name);
    }

    private function platformAdmin(): User
    {
        $admin = User::factory()->create();
        PlatformAdmin::factory()->create(['user_id' => $admin->id]);

        return $admin;
    }
}
