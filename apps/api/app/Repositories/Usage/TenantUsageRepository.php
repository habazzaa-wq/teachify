<?php

namespace App\Repositories\Usage;

use App\Models\Usage\TenantUsage;
use Illuminate\Support\Collection;

class TenantUsageRepository
{
    public function getByTenantId(int $tenantId): ?TenantUsage
    {
        return TenantUsage::query()->where('tenant_id', $tenantId)->first();
    }

    public function getOrNew(int $tenantId): TenantUsage
    {
        return TenantUsage::query()->firstOrNew(
            ['tenant_id' => $tenantId],
            $this->defaultAttributes()
        );
    }

    public function save(TenantUsage $usage): TenantUsage
    {
        $usage->timestamps = true;
        $usage->save();
        return $usage->fresh();
    }

    public function updateOrCreate(int $tenantId, array $data): TenantUsage
    {
        return TenantUsage::query()->updateOrCreate(
            ['tenant_id' => $tenantId],
            $data
        )->fresh();
    }

    public function incrementUsage(int $tenantId, array $fields): void
    {
        $usage = $this->getOrNew($tenantId);

        foreach ($fields as $field => $value) {
            if (is_numeric($value)) {
                $usage->increment($field, $value);
            }
        }
    }

    public function allWithUsage(): \Illuminate\Database\Eloquent\Collection
    {
        return TenantUsage::query()
            ->select(['tenant_id', 'storage_bytes', 'bandwidth_bytes', 'views', 'requests', 'last_synced_at'])
            ->where('last_synced_at', '!=', null)
            ->orderBy('tenant_id')
            ->get();
    }

    public function getTenantsNeedingSync(int $syncIntervalMinutes): Collection
    {
        $threshold = now()->subMinutes($syncIntervalMinutes);
        return TenantUsage::query()
            ->whereNull('last_synced_at')
            ->orWhere('last_synced_at', '<', $threshold)
            ->pluck('tenant_id');
    }

    private function defaultAttributes(): array
    {
        return [
            'storage_bytes' => 0,
            'bandwidth_bytes' => 0,
            'stream_bandwidth_bytes' => 0,
            'cdn_bandwidth_bytes' => 0,
            'requests' => 0,
            'views' => 0,
            'uploaded_files' => 0,
            'uploaded_videos' => 0,
            'collections' => 0,
            'folders' => 0,
            'last_synced_at' => null,
        ];
    }
}
