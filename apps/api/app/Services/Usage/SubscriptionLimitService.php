<?php

namespace App\Services\Usage;

use App\Models\PlatformPlan;
use App\Models\Tenant;

/**
 * Resolves the effective plan limits for a tenant.
 *
 * Resolution order:
 *   1. the tenant's `platform_plan_id`
 *   2. that `PlatformPlan`'s `limits`, read through a bounded per-plan cache
 *   3. `defaultLimit()` when the tenant has no assigned plan
 *
 * `tenants.plan` is a legacy compatibility column and is deliberately NOT
 * consulted: it is NULL for provisioned tenants and would otherwise be a
 * second, competing source of truth.
 */
class SubscriptionLimitService
{
    /**
     * The limit keys runtime enforcement actually reads, in the order they are
     * reported by getAllLimits().
     */
    public const ENFORCED_LIMIT_KEYS = [
        'storage',
        'bandwidth',
        'views',
        'videos',
        'uploads',
        'requests',
        'folders',
        'collections',
    ];

    /**
     * Runtime limit key => `platform_plans.limits` key.
     *
     * Only unambiguous pairs are mapped. `storage` and `bandwidth` are byte
     * counts, matching tenant_usage and the default table below; `videos` is a
     * plain count. Every other enforced key has no counterpart in the plan
     * vocabulary and deliberately keeps its default.
     */
    private const PLAN_LIMIT_KEYS = [
        'storage' => 'storage',
        'bandwidth' => 'bandwidth',
        'videos' => 'videos',
    ];

    public function getStorageLimit(int $tenantId): int
    {
        return $this->getLimit($tenantId, 'storage');
    }

    public function getBandwidthLimit(int $tenantId): int
    {
        return $this->getLimit($tenantId, 'bandwidth');
    }

    public function getViewsLimit(int $tenantId): int
    {
        return $this->getLimit($tenantId, 'views');
    }

    public function getVideoCountLimit(int $tenantId): int
    {
        return $this->getLimit($tenantId, 'videos');
    }

    public function getUploadLimit(int $tenantId): int
    {
        return $this->getLimit($tenantId, 'uploads');
    }

    public function getRequestLimit(int $tenantId): int
    {
        return $this->getLimit($tenantId, 'requests');
    }

    public function getFolderLimit(int $tenantId): int
    {
        return $this->getLimit($tenantId, 'folders');
    }

    public function getCollectionLimit(int $tenantId): int
    {
        return $this->getLimit($tenantId, 'collections');
    }

    /**
     * A finite limit, for callers that cannot express "unlimited".
     *
     * An unlimited key resolves to 0 here, which keeps the historical behaviour
     * of this method for every existing caller. Callers that need to tell
     * "unlimited" apart from a genuine zero must use getLimitValue().
     */
    public function getLimit(int $tenantId, string $key): int
    {
        $limits = $this->resolveLimits($tenantId);

        return $this->limitFrom($limits, $key);
    }

    /**
     * The plan's own value for a key, or null when the key is not defined by
     * the assigned plan. Callers decide what an undefined key means; this
     * service deliberately does not fall back to a default here.
     */
    public function getLimitValue(int $tenantId, string $key): ?int
    {
        [$present, $value] = $this->planValue($tenantId, $key);

        if (! $present || PlatformPlan::isUnlimitedValue($value)) {
            return null;
        }

        return is_numeric($value) ? (int) $value : null;
    }

    /**
     * True when the assigned plan declares this key as unlimited.
     *
     * Distinct from getLimitValue() returning null, which also means "the plan
     * does not define this key".
     */
    public function isUnlimited(int $tenantId, string $key): bool
    {
        [$present, $value] = $this->planValue($tenantId, $key);

        return $present && PlatformPlan::isUnlimitedValue($value);
    }

    /**
     * @return array<string, int>
     */
    public function getAllLimits(int $tenantId): array
    {
        $limits = $this->resolveLimits($tenantId);

        $resolved = [];

        foreach (self::ENFORCED_LIMIT_KEYS as $key) {
            $resolved[$key] = $this->limitFrom($limits, $key);
        }

        return $resolved;
    }

    /**
     * The canonical plan limits for a tenant, or an empty array when the tenant
     * has no assigned plan.
     *
     * @return array<string, mixed>
     */
    private function resolveLimits(int $tenantId): array
    {
        $planId = $this->resolvePlanId($tenantId);

        if ($planId === null) {
            return [];
        }

        $plan = PlatformPlan::query()->find($planId);

        return $plan?->cachedLimits() ?? [];
    }

    private function resolvePlanId(int $tenantId): ?int
    {
        $tenant = app()->bound('currentTenant') ? app('currentTenant') : null;

        if ($tenant instanceof Tenant && (int) $tenant->getKey() === $tenantId) {
            return $tenant->platform_plan_id !== null
                ? (int) $tenant->platform_plan_id
                : null;
        }

        $id = Tenant::query()->whereKey($tenantId)->value('platform_plan_id');

        return $id !== null ? (int) $id : null;
    }

    /**
     * Whether the assigned plan defines a runtime key at all, and its raw value.
     *
     * Keeping "absent" separate from "declared as null" is what lets the plan
     * editor use `null` for unlimited while a plan that simply omits a key still
     * falls back to the default limit.
     *
     * @return array{0: bool, 1: mixed}
     */
    private function planValue(int $tenantId, string $key): array
    {
        $planKey = self::PLAN_LIMIT_KEYS[$key] ?? null;

        if ($planKey === null) {
            return [false, null];
        }

        $limits = $this->resolveLimits($tenantId);

        return array_key_exists($planKey, $limits) ? [true, $limits[$planKey]] : [false, null];
    }

    /**
     * @param  array<string, mixed>  $limits
     */
    private function limitFrom(array $limits, string $key): int
    {
        $planKey = self::PLAN_LIMIT_KEYS[$key] ?? null;

        if ($planKey === null || ! array_key_exists($planKey, $limits)) {
            return $this->defaultLimit($key);
        }

        $value = $limits[$planKey];

        if (PlatformPlan::isUnlimitedValue($value)) {
            return 0;
        }

        return is_numeric($value) ? (int) $value : $this->defaultLimit($key);
    }

    private function defaultLimit(string $key): int
    {
        $defaults = [
            'storage' => 1073741824,
            'bandwidth' => 1073741824,
            'views' => 10000,
            'videos' => 100,
            'uploads' => 1000,
            'requests' => 100000,
            'folders' => 500,
            'collections' => 50,
        ];

        return $defaults[$key] ?? 0;
    }
}
