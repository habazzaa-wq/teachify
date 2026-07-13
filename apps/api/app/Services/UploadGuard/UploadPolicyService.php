<?php

namespace App\Services\UploadGuard;

use App\Models\Tenant;
use App\Services\UploadGuard\Exceptions\PlanRequiredException;
use App\Services\UploadGuard\Exceptions\SubscriptionExpiredException;
use Illuminate\Support\Facades\Log;

class UploadPolicyService
{
    public function ensureTenantCanUpload(Tenant $tenant): void
    {
        $this->ensureTenantNotSuspended($tenant);
        $this->ensurePlatformNotInMaintenance();
        $this->ensureSubscriptionActive($tenant);
    }

    public function isTenantActive(Tenant $tenant): bool
    {
        return $tenant->status === 'active';
    }

    public function isSubscriptionActive(Tenant $tenant): bool
    {
        $subscription = $tenant->subscription ?? [];

        if (empty($subscription)) {
            return true;
        }

        $status = $subscription['status'] ?? null;

        if ($status === null) {
            return true;
        }

        if ($status === 'cancelled' || $status === 'expired') {
            $endsAt = $subscription['ends_at'] ?? null;
            if ($endsAt && now()->isBefore($endsAt)) {
                return true;
            }
            return false;
        }

        return $status === 'active' || $status === 'trialing';
    }

    public function hasPlan(Tenant $tenant): bool
    {
        $plan = $tenant->plan ?? [];
        if (! empty($plan) && isset($plan['name'])) {
            return true;
        }

        $subscription = $tenant->subscription ?? [];
        if (! empty($subscription['planId']) || ! empty($subscription['plan_name'])) {
            return true;
        }

        return false;
    }

    public function isPlatformInMaintenance(): bool
    {
        return (bool) config('platform.maintenance', false);
    }

    public function getSubscriptionDetails(Tenant $tenant): array
    {
        $subscription = $tenant->subscription ?? [];

        return [
            'status' => $subscription['status'] ?? 'none',
            'plan_name' => ($tenant->plan ?? [])['name'] ?? null,
            'ends_at' => $subscription['ends_at'] ?? null,
            'is_active' => $this->isSubscriptionActive($tenant),
            'has_plan' => $this->hasPlan($tenant),
        ];
    }

    private function ensureTenantNotSuspended(Tenant $tenant): void
    {
        if ($tenant->status !== 'active') {
            Log::channel('usage')->warning('Upload blocked: tenant not active', [
                'tenant_id' => $tenant->id,
                'tenant_status' => $tenant->status,
            ]);

            throw new \RuntimeException(
                'This organization account is not active. Please contact support.',
                403,
            );
        }
    }

    private function ensurePlatformNotInMaintenance(): void
    {
        if ($this->isPlatformInMaintenance()) {
            Log::channel('usage')->warning('Upload blocked: platform maintenance', [
                'maintenance' => true,
            ]);

            throw new \RuntimeException(
                'The platform is currently under maintenance. Please try again later.',
                503,
            );
        }
    }

    private function ensureSubscriptionActive(Tenant $tenant): void
    {
        if (! $this->isSubscriptionActive($tenant)) {
            Log::channel('usage')->warning('Upload blocked: subscription expired', [
                'tenant_id' => $tenant->id,
                'subscription' => $tenant->subscription ?? null,
            ]);

            throw new SubscriptionExpiredException();
        }
    }

    private function ensurePlanExists(Tenant $tenant): void
    {
        if (! $this->hasPlan($tenant)) {
            Log::channel('usage')->warning('Upload blocked: no plan', [
                'tenant_id' => $tenant->id,
                'plan' => $tenant->plan ?? null,
            ]);

            throw new PlanRequiredException();
        }
    }
}
