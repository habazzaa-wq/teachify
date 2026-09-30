<?php

namespace Tests\Feature;

use App\Models\PlatformAdmin;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PlatformStatsTest extends TestCase
{
    use RefreshDatabase;

    private function platformToken(): string
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

        return $this->postJson('/api/platform/auth/login', [
            'email' => 'admin@platform.com',
            'password' => 'password',
        ])->json('token');
    }

    public function test_stats_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/platform/stats')->assertUnauthorized();
    }

    public function test_stats_report_real_counts_from_the_database(): void
    {
        Tenant::factory()->count(3)->create(['status' => 'active']);
        Tenant::factory()->count(2)->create(['status' => 'suspended']);

        $token = $this->platformToken();

        $response = $this->getJson('/api/platform/stats', [
            'Authorization' => 'Bearer '.$token,
        ]);

        $response->assertOk()->assertJsonStructure([
            'counts' => [
                'tenants',
                'tenants_active',
                'tenant_domains',
                'users',
                'courses',
                'exams',
                'exam_attempts',
                'exam_attempts_pending',
            ],
            'queues' => ['backlog', 'backlog_total', 'failed'],
            'host' => ['disk_free_bytes', 'disk_total_bytes', 'uptime_seconds'],
            'php' => ['version', 'memory_limit'],
            'generated_at',
        ]);

        // Five tenants were seeded, three of them active.
        $this->assertSame(5, $response->json('counts.tenants'));
        $this->assertSame(3, $response->json('counts.tenants_active'));
    }

    public function test_stats_never_invent_a_metric_that_cannot_be_read(): void
    {
        $token = $this->platformToken();

        $response = $this->getJson('/api/platform/stats', [
            'Authorization' => 'Bearer '.$token,
        ]);

        $response->assertOk();

        // Host telemetry is Linux-only. On other platforms the fields must be
        // present and explicitly null rather than carrying a made-up number.
        foreach (['load_average', 'memory', 'uptime_seconds', 'cpu_count'] as $key) {
            $this->assertArrayHasKey($key, $response->json('host'));
        }

        $this->assertIsArray($response->json('queues.backlog'));
        $this->assertIsInt($response->json('queues.backlog_total'));
    }

    public function test_stats_expose_the_queue_backlog_so_a_stalled_queue_is_visible(): void
    {
        $token = $this->platformToken();

        $this->assertSame(0, $this->getJson('/api/platform/stats', [
            'Authorization' => 'Bearer '.$token,
        ])->json('queues.backlog_total'));

        DB::table('jobs')->insert([
            [
                'queue' => 'grading',
                'payload' => '{}',
                'attempts' => 0,
                'reserved_at' => null,
                'available_at' => now()->toDateTimeString(),
                'created_at' => now()->toDateTimeString(),
            ],
            [
                'queue' => 'grading',
                'payload' => '{}',
                'attempts' => 0,
                'reserved_at' => null,
                'available_at' => now()->toDateTimeString(),
                'created_at' => now()->toDateTimeString(),
            ],
            [
                'queue' => 'bunny',
                'payload' => '{}',
                'attempts' => 0,
                'reserved_at' => null,
                'available_at' => now()->toDateTimeString(),
                'created_at' => now()->toDateTimeString(),
            ],
        ]);

        $response = $this->getJson('/api/platform/stats', [
            'Authorization' => 'Bearer '.$token,
        ]);

        $this->assertSame(3, $response->json('queues.backlog_total'));
        $this->assertSame(2, $response->json('queues.backlog.grading'));
        $this->assertSame(1, $response->json('queues.backlog.bunny'));
    }
}
