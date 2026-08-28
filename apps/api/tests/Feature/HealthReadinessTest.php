<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Mockery;
use Tests\TestCase;

/**
 * P3 health vs readiness separation.
 *
 * Liveness stays cheap (no external dependencies). Readiness checks only the
 * database and a configured shared cache; external providers (Bunny / Vision)
 * are intentionally never probed.
 */
class HealthReadinessTest extends TestCase
{
    public function test_liveness_is_unauthenticated_and_cheap(): void
    {
        $this->getJson('/api/v1/health/live')
            ->assertOk()
            ->assertJson(['status' => 'ok']);
    }

    public function test_readiness_ok_when_dependencies_up(): void
    {
        $this->getJson('/api/v1/health/ready')
            ->assertOk()
            ->assertJson(['status' => 'ready'])
            ->assertJsonPath('checks.database', 'ok');
    }

    public function test_readiness_fails_when_database_down(): void
    {
        $conn = Mockery::mock(\Illuminate\Database\Connection::class);
        $conn->shouldReceive('getPdo')->andThrow(new \PDOException('simulated down'));
        DB::shouldReceive('connection')->andReturn($conn);

        $this->getJson('/api/v1/health/ready')
            ->assertStatus(503)
            ->assertJson(['status' => 'not_ready'])
            ->assertJsonPath('checks.database', 'unavailable');
    }

    public function test_readiness_fails_when_shared_cache_down(): void
    {
        config(['cache.default' => 'redis']);
        Cache::shouldReceive('get')->andThrow(new \Exception('cache down'));

        $this->getJson('/api/v1/health/ready')
            ->assertStatus(503)
            ->assertJsonPath('checks.cache', 'unavailable');
    }

    public function test_readiness_ignores_optional_providers(): void
    {
        $this->getJson('/api/v1/health/ready')
            ->assertOk()
            ->assertJsonMissing(['bunny', 'openai', 'vision']);
    }
}
