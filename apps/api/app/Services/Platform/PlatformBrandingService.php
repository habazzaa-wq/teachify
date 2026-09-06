<?php

namespace App\Services\Platform;

use App\Models\PlatformBranding;

/**
 * Single source of truth for a tenant's platform brand colors (the "platform
 * colors" field). Stored per-tenant (one `platform_branding` row per tenant) so
 * both authenticated responses (auth/me, current user) and the anonymous public
 * by-domain endpoint return that tenant's own branding — never another
 * tenant's.
 *
 * All calls must pass an explicit tenant id; there is deliberately no fallback
 * to a shared global row, which was the source of cross-tenant branding leaks.
 */
class PlatformBrandingService
{
    /** Snakize the incoming validated payload to the table columns. */
    private const MAP = [
        'name' => 'name',
        'logo' => 'logo',
        'favicon' => 'favicon',
        'primary_color' => 'primary_color',
        'secondary_color' => 'secondary_color',
        'accent_color' => 'accent_color',
        'font' => 'font',
        'logo_type' => 'logo_type',
        'logo_icon' => 'logo_icon',
        'logo_image' => 'logo_image',
        'dark_logo' => 'dark_logo',
        'light_logo' => 'light_logo',
    ];

    /**
     * Resolve a tenant's platform branding as the camelCase shape consumed by
     * the frontend (primaryColor / secondaryColor / logo / favicon / ...).
     * Unset values are returned as null so the frontend falls back to its own
     * configured defaults (#D87B63 / #FFB50E).
     *
     * @param  int  $tenantId  The tenant owning the branding.
     */
    public function resolve(int $tenantId): array
    {
        $row = PlatformBranding::query()->where('tenant_id', $tenantId)->first();

        $values = $row?->only(array_values(self::MAP)) ?? [];

        return $this->shape($values);
    }

    /**
     * Persist a tenant's platform branding and return the resolved shape.
     *
     * @param  array<string, mixed>  $validated
     */
    public function update(int $tenantId, array $validated): array
    {
        $mapped = [];
        foreach (self::MAP as $input => $column) {
            if (array_key_exists($input, $validated)) {
                $mapped[$column] = $validated[$input];
            }
        }

        $row = PlatformBranding::query()->updateOrCreate(['tenant_id' => $tenantId], $mapped);

        return $this->shape($row->only(array_values(self::MAP)));
    }

    /**
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    private function shape(array $values): array
    {
        return [
            'name' => $values['name'] ?? null,
            'logo' => $values['logo'] ?? null,
            'favicon' => $values['favicon'] ?? null,
            'primaryColor' => $values['primary_color'] ?? null,
            'secondaryColor' => $values['secondary_color'] ?? null,
            'accentColor' => $values['accent_color'] ?? null,
            'font' => $values['font'] ?? null,
            'logoType' => $values['logo_type'] ?? null,
            'logoIcon' => $values['logo_icon'] ?? null,
            'logoImage' => $values['logo_image'] ?? null,
            'darkLogo' => $values['dark_logo'] ?? null,
            'lightLogo' => $values['light_logo'] ?? null,
        ];
    }
}
