<?php

namespace App\Services\Community;

use App\Models\CommunityStat;
use App\Models\Tenant;

class CommunityStatsService
{
    public function get(Tenant $tenant, string $key): int
    {
        $stat = CommunityStat::query()
            ->where('tenant_id', $tenant->id)
            ->where('key', $key)
            ->first();

        return $stat?->value ?? 0;
    }

    public function increment(Tenant $tenant, string $key, int $by = 1): int
    {
        return $this->adjust($tenant, $key, $by);
    }

    public function decrement(Tenant $tenant, string $key, int $by = 1): int
    {
        return $this->adjust($tenant, $key, -$by);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function set(Tenant $tenant, string $key, int $value, array $payload = []): int
    {
        $this->bindTenant($tenant);

        CommunityStat::query()->updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => $key],
            ['value' => $value, 'payload' => $payload, 'updated_at' => now()],
        );

        return $value;
    }

    /**
     * @return array<string, mixed>
     */
    public function snapshot(Tenant $tenant): array
    {
        return CommunityStat::query()
            ->where('tenant_id', $tenant->id)
            ->get()
            ->mapWithKeys(fn (CommunityStat $stat) => [
                $stat->key => [
                    'value' => $stat->value,
                    'payload' => $stat->payload,
                    'updated_at' => $stat->updated_at,
                ],
            ])
            ->all();
    }

    private function adjust(Tenant $tenant, string $key, int $delta): int
    {
        $this->bindTenant($tenant);

        $current = $this->get($tenant, $key);
        $next = max(0, $current + $delta);

        CommunityStat::query()->updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => $key],
            ['value' => $next, 'updated_at' => now()],
        );

        return $next;
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
