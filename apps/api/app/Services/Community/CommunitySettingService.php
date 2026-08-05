<?php

namespace App\Services\Community;

use App\Models\CommunitySetting;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class CommunitySettingService
{
    /**
     * Get the settings row for a tenant, creating it with defaults when absent.
     */
    public function forTenant(Tenant $tenant): CommunitySetting
    {
        $this->bindTenant($tenant);

        return CommunitySetting::query()
            ->where('tenant_id', $tenant->id)
            ->firstOrCreate(
                ['tenant_id' => $tenant->id],
                CommunitySetting::defaultSettings(),
            );
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Tenant $tenant, array $data): CommunitySetting
    {
        $this->bindTenant($tenant);

        $settings = $this->forTenant($tenant);

        $fillable = (new CommunitySetting)->getFillable();

        $settings->forceFill(collect($data)
            ->only($fillable)
            ->all())
            ->save();

        return $settings->refresh();
    }

    public function isEnabled(Tenant $tenant): bool
    {
        return $this->forTenant($tenant)->is_enabled;
    }

    public function ensureEnabled(Tenant $tenant): void
    {
        if (! $this->isEnabled($tenant)) {
            throw new ModelNotFoundException('Community is not available for this tenant.');
        }
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
