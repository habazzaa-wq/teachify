<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\v1\Platform\TenantSettingController;
use App\Http\Middleware\IdentifyTenant;
use App\Models\PlatformAdmin;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\User;
use App\Repositories\TenantRepository;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use PDOException;
use Tests\TestCase;

/**
 * Regression coverage for the tenant resolution path.
 *
 * The production cache store is "database", and IdentifyTenant resolves a
 * tenant on every single request. That made the tenant key the most contended
 * row in the application: 656 MySQL error 1213 deadlocks on the `cache` table
 * reached this repository, and surfaced to callers as 500s.
 *
 * Two properties are locked in here:
 *  1. A resolution does not write to the `cache` table when the entry is warm.
 *     The old Cache::get + Cache::add pair wrote on every miss, and a miss was
 *     common enough to deadlock under load.
 *  2. A cache that is unreachable, contended, or holding an unusable value is a
 *     miss - never a failed request.
 *
 * phpunit.xml defaults to the in-memory "array" store, which keeps objects
 * unserialized, so these tests switch to the real DatabaseStore to exercise
 * serialization and write semantics.
 */
class TenantCacheDeadlockTest extends TestCase
{
    use RefreshDatabase;

    private const DEADLOCK_MESSAGE = 'SQLSTATE[40001]: Serialization failure: 1213 Deadlock found when trying to get lock';

    protected function setUp(): void
    {
        parent::setUp();

        config(['cache.default' => 'database']);
        Cache::forgetDriver();
    }

    private function deadlock(string $query = 'insert into `cache` ...'): QueryException
    {
        return new QueryException('mysql', $query, [], new PDOException(self::DEADLOCK_MESSAGE));
    }

    public function test_cached_tenant_round_trips_as_real_tenant_instance(): void
    {
        $tenant = Tenant::factory()->create();

        Cache::put('tenant.'.$tenant->id, $tenant, 3600);

        $cached = Cache::get('tenant.'.$tenant->id);

        $this->assertInstanceOf(Tenant::class, $cached);
        $this->assertSame($tenant->id, $cached->id);
    }

    public function test_find_by_id_returns_tenant_and_publishes_it_once_on_miss(): void
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
        $this->assertSame(1, DB::table('cache')->where('key', config('cache.prefix').'tenant.'.$tenant->id)->count());
    }

    /**
     * The core anti-deadlock property: a warm entry must produce no WRITES.
     * The read itself is expected - it is a consistent read on a unique index
     * and cannot take a gap lock - but the old Cache::get + Cache::add pair
     * issued an insert/upsert against the same hot key, and that statement is
     * what produced the 1213 deadlocks.
     */
    public function test_warm_lookup_writes_nothing_to_the_cache_table(): void
    {
        $tenant = Tenant::factory()->create();
        $repo = new TenantRepository;

        $repo->findById($tenant->id);

        DB::connection()->flushQueryLog();
        DB::connection()->enableQueryLog();

        for ($i = 0; $i < 25; $i++) {
            $repo->findById($tenant->id);
        }

        $writes = collect(DB::connection()->getQueryLog())
            ->filter(fn (array $q) => (bool) preg_match('/\b(insert|update|delete)\b/i', $q['query']));

        $this->assertCount(0, $writes, 'A warm tenant lookup must not write to the cache table.');
    }

    /**
     * A cold miss publishes with a single plain insert. The store must not be
     * asked to upsert, because INSERT ... ON DUPLICATE KEY UPDATE on a hot key
     * is the statement that produced the 1213 deadlocks.
     */
    public function test_cold_miss_publishes_with_a_plain_insert_and_no_upsert(): void
    {
        $tenant = Tenant::factory()->create();
        $repo = new TenantRepository;

        DB::connection()->flushQueryLog();
        DB::connection()->enableQueryLog();

        $repo->findById($tenant->id);

        $queries = collect(DB::connection()->getQueryLog())->pluck('query');
        $cacheWrites = $queries->filter(fn (string $q) => str_contains(strtolower($q), 'cache')
            && (bool) preg_match('/\b(insert|update|delete)\b/i', $q));

        $this->assertCount(1, $cacheWrites, 'Expected exactly one cache write on a cold miss.');
        $this->assertStringContainsString('insert', strtolower($cacheWrites->first()));
        $this->assertStringNotContainsString('on duplicate key update', strtolower($cacheWrites->first()));
        $this->assertStringNotContainsString('delete', strtolower($cacheWrites->first()));
    }

    /**
     * Regression for the production incident: a deadlock while READING the
     * cache must not become a 500.
     */
    public function test_cache_read_failure_degrades_to_a_direct_database_read(): void
    {
        $tenant = Tenant::factory()->create();

        Cache::shouldReceive('get')->andThrow($this->deadlock('select * from `cache` ...'));
        Cache::shouldReceive('put')->andThrow($this->deadlock());

        $result = (new TenantRepository)->findById($tenant->id);

        $this->assertInstanceOf(Tenant::class, $result);
        $this->assertSame($tenant->id, $result->id);
    }

    /**
     * Regression for the production incident: a deadlock while WRITING the
     * cache must not become a 500 either. The caller already holds the value,
     * so there is nothing left to fail over.
     */
    public function test_cache_write_failure_still_returns_the_resolved_tenant(): void
    {
        $tenant = Tenant::factory()->create();

        Cache::shouldReceive('get')->andReturnNull();
        Cache::shouldReceive('put')->andThrow($this->deadlock());

        $result = (new TenantRepository)->findById($tenant->id);

        $this->assertInstanceOf(Tenant::class, $result);
        $this->assertSame($tenant->id, $result->id);
    }

    public function test_deadlock_on_a_domain_lookup_degrades_instead_of_failing(): void
    {
        $tenant = Tenant::factory()->create(['status' => 'active']);
        TenantDomain::create([
            'tenant_id' => $tenant->id,
            'domain' => 'academy.test',
            'type' => 'custom',
            'status' => 'active',
        ]);

        Cache::shouldReceive('get')->andThrow($this->deadlock('select * from `cache` ...'));
        Cache::shouldReceive('put')->andThrow($this->deadlock());

        $result = (new TenantRepository)->findByDomain('ACADEMY.test');

        $this->assertInstanceOf(Tenant::class, $result);
        $this->assertSame($tenant->id, $result->id);
    }

    public function test_self_heals_when_the_key_holds_an_unserializable_value(): void
    {
        $tenant = Tenant::factory()->create();

        Cache::put('tenant.'.$tenant->id, (object) ['poisoned' => true], 3600);

        $result = (new TenantRepository)->findById($tenant->id);

        $this->assertInstanceOf(Tenant::class, $result);
        $this->assertSame($tenant->id, $result->id);
    }

    public function test_self_heals_when_the_key_holds_an_incomplete_class(): void
    {
        $tenant = Tenant::factory()->create();

        // Exactly what an allowlist change leaves behind.
        Cache::put('tenant.'.$tenant->id, \unserialize('O:8:"stdClass":0:{}'), 3600);

        $result = (new TenantRepository)->findById($tenant->id);

        $this->assertInstanceOf(Tenant::class, $result);
    }

    public function test_published_entries_use_jittered_ttl_so_workers_do_not_expire_together(): void
    {
        $tenant = Tenant::factory()->create();

        (new TenantRepository)->findById($tenant->id);

        $row = DB::table('cache')->where('key', config('cache.prefix').'tenant.'.$tenant->id)->first();

        $this->assertNotNull($row);
        $this->assertGreaterThan(0, $row->expiration - time());
        $this->assertLessThanOrEqual(3600 + 60, $row->expiration - time());
    }

    public function test_missing_tenant_returns_null_and_is_not_cached(): void
    {
        $repo = new TenantRepository;

        $this->assertNull($repo->findById(999999));

        $this->assertFalse(
            DB::table('cache')->where('key', config('cache.prefix').'tenant.999999')->exists()
        );
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

    public function test_identify_tenant_middleware_resolves_header_tenant(): void
    {
        $tenant = Tenant::factory()->create(['status' => 'active']);

        $request = Request::create('/api/v1/exams', 'GET');
        $request->headers->set('X-Tenant-ID', (string) $tenant->id);

        $middleware = $this->app->make(IdentifyTenant::class);
        $response = $middleware->handle($request, fn (Request $r) => response()->json(['ok' => true]));

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame($tenant->id, app('currentTenant')->id);
    }

    public function test_identify_tenant_middleware_serves_a_request_while_the_cache_table_deadlocks(): void
    {
        $tenant = Tenant::factory()->create(['status' => 'active']);

        Cache::shouldReceive('get')->andThrow($this->deadlock('select * from `cache` ...'));
        Cache::shouldReceive('put')->andThrow($this->deadlock());

        $request = Request::create('/api/v1/exams', 'GET');
        $request->headers->set('X-Tenant-ID', (string) $tenant->id);

        $middleware = $this->app->make(IdentifyTenant::class);
        $response = $middleware->handle($request, fn (Request $r) => response()->json(['ok' => true]));

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame($tenant->id, app('currentTenant')->id);
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

    public function test_forget_is_safe_when_the_cache_store_is_unreachable(): void
    {
        Cache::shouldReceive('forget')->andThrow($this->deadlock('delete from `cache` ...'));

        (new TenantRepository)->forget(1);

        $this->addToAssertionCount(1);
    }

    private function platformAdmin(): User
    {
        $admin = User::factory()->create();
        PlatformAdmin::factory()->create(['user_id' => $admin->id]);

        return $admin;
    }
}
