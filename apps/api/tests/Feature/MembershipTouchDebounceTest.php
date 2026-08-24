<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Auth\TenantMembershipService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * P0.6 coverage: last_accessed_at is telemetry, not a hot-path write — it
 * must be debounced instead of issuing one UPDATE per authenticated request.
 */
class MembershipTouchDebounceTest extends TestCase
{
    use RefreshDatabase;

    public function test_fresh_timestamp_is_not_rewritten(): void
    {
        $membership = TenantUser::factory()->create([
            'tenant_id' => Tenant::factory()->create()->id,
            'user_id' => User::factory()->create()->id,
            'status' => 'active',
            'last_accessed_at' => now(),
        ]);

        $before = $membership->fresh()->last_accessed_at;

        $this->travelTo(now()->addSeconds(10));

        app(TenantMembershipService::class)->touchLastAccessed($membership);

        $this->assertTrue(
            $before->equalTo($membership->fresh()->last_accessed_at),
            'A write happened although the stored timestamp was still fresh.',
        );
    }

    public function test_stale_timestamp_is_updated(): void
    {
        $stale = now()->subMinutes(5);
        $membership = TenantUser::factory()->create([
            'tenant_id' => Tenant::factory()->create()->id,
            'user_id' => User::factory()->create()->id,
            'status' => 'active',
            'last_accessed_at' => $stale,
        ]);

        app(TenantMembershipService::class)->touchLastAccessed($membership);

        $after = $membership->fresh()->last_accessed_at;
        $this->assertNotNull($after);
        $this->assertTrue($after->greaterThan($stale));
    }

    public function test_null_timestamp_writes_immediately(): void
    {
        $membership = TenantUser::factory()->create([
            'tenant_id' => Tenant::factory()->create()->id,
            'user_id' => User::factory()->create()->id,
            'status' => 'active',
            'last_accessed_at' => null,
        ]);

        app(TenantMembershipService::class)->touchLastAccessed($membership);

        $this->assertNotNull($membership->fresh()->last_accessed_at);
    }

    public function test_debounce_threshold_matches_default_config(): void
    {
        // Exactly at the boundary: 60s old → stale again (gt is strict).
        $boundary = now()->subSeconds(60);
        $membership = TenantUser::factory()->create([
            'tenant_id' => Tenant::factory()->create()->id,
            'user_id' => User::factory()->create()->id,
            'status' => 'active',
            'last_accessed_at' => $boundary,
        ]);

        app(TenantMembershipService::class)->touchLastAccessed($membership);

        $this->assertTrue(
            $membership->fresh()->last_accessed_at->greaterThan($boundary),
            'A timestamp exactly 60s old should be refreshed (strict > comparison).',
        );
    }
}
