<?php

namespace App\Services\Platform;

use App\Models\PlatformBranding;

/**
 * Single source of truth for the platform-wide brand colors (the "platform
 * colors" field). Stored in one global row (id = 1) so both authenticated
 * responses (auth/me, current user) and the anonymous public by-domain
 * endpoint return the exact same branding regardless of which tenant/domain
 * is being resolved.
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
     * Resolve the global platform branding as the camelCase shape consumed by
     * the frontend (primaryColor / secondaryColor / logo / favicon / ...).
     * Unset values are returned as null so the frontend falls back to its own
     * configured defaults (#D87B63 / #FFB50E).
     */
    public function resolve(): array
    {
        $row = PlatformBranding::query()->find(1);

        $values = $row?->only(array_values(self::MAP)) ?? [];

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

    /**
     * Persist the global platform branding and return the resolved shape.
     */
    public function update(array $validated): array
    {
        $mapped = [];
        foreach (self::MAP as $input => $column) {
            if (array_key_exists($input, $validated)) {
                $mapped[$column] = $validated[$input];
            }
        }

        $row = PlatformBranding::query()->updateOrCreate(['id' => 1], $mapped);

        return $this->resolve();
    }
}
