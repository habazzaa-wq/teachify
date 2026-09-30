<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

/**
 * The canonical platform plan catalogue.
 *
 * A tenant's plan is resolved through `tenants.platform_plan_id` (see
 * SubscriptionLimitService). `tenants.plan` is a legacy compatibility column
 * and is NOT a source of truth.
 */
class PlatformPlan extends Model
{
    /**
     * Sentinel stored in `limits` for a key that has no ceiling.
     *
     * A plain `0` is ambiguous: the legacy default table and TenantQuotaService
     * both treat `0` as "nothing allowed", while the plan UI treats `0` as a real
     * zero and uses `null` for unlimited. Storing the sentinel string keeps
     * "unlimited" distinguishable from a genuine zero without inventing a
     * numeric magic value. The plan editor keeps writing `null`; both shapes
     * normalise to unlimited when resolved.
     */
    public const UNLIMITED = 'unlimited';

    /**
     * Bounded TTL for the cached plan definition, in seconds.
     *
     * The cache is keyed per plan so a plan edit only invalidates that plan, and
     * so two tenants sharing a plan share one entry.
     */
    public const LIMITS_CACHE_TTL = 300;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'badge',
        'monthly_price',
        'yearly_price',
        'currency',
        'display_order',
        'trial_enabled',
        'trial_days',
        'recommended',
        'visible',
        'status',
        'limits',
        'features',
        'video_storage',
        'branding',
        'integrations',
    ];

    protected function casts(): array
    {
        return [
            'monthly_price' => 'decimal:2',
            'yearly_price' => 'decimal:2',
            'display_order' => 'integer',
            'trial_enabled' => 'boolean',
            'trial_days' => 'integer',
            'recommended' => 'boolean',
            'visible' => 'boolean',
            'limits' => 'array',
            'features' => 'array',
            'video_storage' => 'array',
            'branding' => 'array',
            'integrations' => 'array',
        ];
    }

    public function tenants(): HasMany
    {
        return $this->hasMany(Tenant::class);
    }

    public static function limitsCacheKey(int|string $planId): string
    {
        return "platform_plan.{$planId}.limits";
    }

    public static function forgetCachedLimits(int|string $planId): void
    {
        Cache::forget(self::limitsCacheKey($planId));
    }

    /**
     * The plan limits as a plain array, cached by plan id.
     *
     * Only scalars are stored so the value survives the database cache store,
     * whose `serializable_classes` allow-list would otherwise turn a model into
     * an incomplete class.
     *
     * @return array<string, mixed>
     */
    public function cachedLimits(): array
    {
        $cached = Cache::get(self::limitsCacheKey($this->getKey()));

        if (is_array($cached)) {
            return $cached;
        }

        $limits = is_array($this->limits) ? $this->limits : [];

        Cache::put(self::limitsCacheKey($this->getKey()), $limits, self::LIMITS_CACHE_TTL);

        return $limits;
    }

    public static function isUnlimitedValue(mixed $value): bool
    {
        return $value === null || $value === self::UNLIMITED;
    }

    protected static function booted(): void
    {
        $invalidate = fn (self $plan) => self::forgetCachedLimits($plan->getKey());

        static::saved($invalidate);
        static::deleted($invalidate);
    }
}
