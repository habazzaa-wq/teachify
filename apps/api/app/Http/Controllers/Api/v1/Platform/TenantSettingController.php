<?php

namespace App\Http\Controllers\Api\v1\Platform;

use App\Http\Controllers\Controller;
use App\Models\TenantSetting;
use App\Repositories\TenantRepository;
use App\Services\Platform\PlatformBrandingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TenantSettingController extends Controller
{
    /**
     * Platform-level brand colors. These drive every themed surface (public
     * site, tenant admin dashboard, instructor workspace and student pages)
     * through `platform_branding`. The teacher appearance editor also writes
     * the same two colors here so its choices are actually applied; the
     * `branding` settings group is kept only as a compatible copy for older
     * consumers (auth/me branding payload).
     */
    public function platform(): JsonResponse
    {
        $tenant = currentTenant();

        return response()->json([
            'branding' => $this->resolvePlatformBranding($tenant),
        ]);
    }

    /**
     * Persist the platform-level brand colors onto the current tenant's own
     * `platform_branding` row. `updateSite` (teacher appearance) writes the
     * same two columns so both editors stay in sync.
     */
    public function updatePlatformBranding(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'logo' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'favicon' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'primary_color' => ['sometimes', 'nullable', 'string', 'regex:/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/'],
            'secondary_color' => ['sometimes', 'nullable', 'string', 'regex:/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/'],
            'logo_type' => ['sometimes', 'nullable', 'string', Rule::in(['icon', 'image'])],
            'logo_icon' => ['sometimes', 'nullable', 'string', 'max:100'],
            'logo_image' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'font' => ['sometimes', 'nullable', 'string', 'max:200'],
        ]);

        $tenant = currentTenant();
        $branding = (new \App\Services\Platform\PlatformBrandingService())->update($tenant->id, $validated);

        return response()->json([
            'message' => 'Platform branding updated.',
            'branding' => $branding,
        ]);
    }

    public function site(): JsonResponse
    {
        $tenant = currentTenant();
        $branding = $tenant->settings()
            ->where('group', 'branding')
            ->first();

        $values = $branding?->values ?? [];

        return response()->json([
            'group' => 'site',
            'values' => [
                'name' => $tenant->name,
                'favicon' => $values['favicon'] ?? null,
                'logo' => $values['logo'] ?? null,
                'dark_logo' => $values['dark_logo'] ?? null,
                'light_logo' => $values['light_logo'] ?? null,
                'logo_type' => $values['logo_type'] ?? null,
                'logo_icon' => $values['logo_icon'] ?? null,
                'logo_image' => $values['logo_image'] ?? null,
                'font' => $values['font'] ?? null,
                'primary_color' => $values['primary_color'] ?? null,
                'secondary_color' => $values['secondary_color'] ?? null,
            ],
        ]);
    }

    public function updateSite(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'values' => ['required', 'array'],
            'values.name' => ['sometimes', 'string', 'max:255'],
            'values.favicon' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'values.logo' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'values.dark_logo' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'values.light_logo' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'values.logo_type' => ['sometimes', 'nullable', 'string', Rule::in(['icon', 'image'])],
            'values.logo_icon' => ['sometimes', 'nullable', 'string', 'max:100'],
            'values.logo_image' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'values.font' => ['sometimes', 'nullable', 'string', 'max:200'],
            'values.primary_color' => ['sometimes', 'nullable', 'string', 'regex:/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/'],
            'values.secondary_color' => ['sometimes', 'nullable', 'string', 'regex:/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/'],
        ]);

        $tenant = currentTenant();
        $values = $validated['values'];

        if (array_key_exists('name', $values)) {
            $tenant->update(['name' => trim((string) $values['name'])]);
            app(TenantRepository::class)->forget($tenant->id);
        }

        $brandingKeys = ['favicon', 'logo', 'dark_logo', 'light_logo', 'logo_type', 'logo_icon', 'logo_image', 'font', 'primary_color', 'secondary_color'];
        $brandingValues = array_intersect_key($values, array_flip($brandingKeys));

        if (! empty($brandingValues)) {
            $existing = $tenant->settings()
                ->where('group', 'branding')
                ->first();

            $merged = array_merge($existing?->values ?? [], $brandingValues);

            TenantSetting::updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'group' => 'branding',
                ],
                ['values' => $merged],
            );
        }

        // The appearance editor must change the real runtime theme, not just a
        // settings row that nothing reads. Mirror the two colors onto the
        // platform_branding row consumed by every themed shell (admin,
        // instructor, student, public site). Null resets fall back to the
        // platform defaults in the frontend theme generator.
        $platformColors = array_intersect_key($values, array_flip(['primary_color', 'secondary_color']));
        if ($platformColors !== []) {
            app(PlatformBrandingService::class)->update($tenant->id, $platformColors);
        }

        $tenant->refresh();
        $branding = $tenant->settings()
            ->where('group', 'branding')
            ->first();
        $brandingValues = $branding?->values ?? [];

        return response()->json([
            'message' => 'Site settings updated.',
            'group' => 'site',
            'values' => [
                'name' => $tenant->name,
                'favicon' => $brandingValues['favicon'] ?? null,
                'logo' => $brandingValues['logo'] ?? null,
                'dark_logo' => $brandingValues['dark_logo'] ?? null,
                'light_logo' => $brandingValues['light_logo'] ?? null,
                'logo_type' => $brandingValues['logo_type'] ?? null,
                'logo_icon' => $brandingValues['logo_icon'] ?? null,
                'logo_image' => $brandingValues['logo_image'] ?? null,
                'font' => $brandingValues['font'] ?? null,
                'primary_color' => $brandingValues['primary_color'] ?? null,
                'secondary_color' => $brandingValues['secondary_color'] ?? null,
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function resolvePlatformBranding(\App\Models\Tenant $tenant): array
    {
        return (new \App\Services\Platform\PlatformBrandingService())->resolve($tenant->id);
    }

    public function index(): JsonResponse
    {
        return response()->json([
            'settings' => TenantSetting::query()
                ->where('tenant_id', currentTenant()->id)
                ->get()
                ->keyBy('group')
                ->map(fn (TenantSetting $s) => $s->values),
        ]);
    }

    public function update(Request $request, string $group): JsonResponse
    {
        $allowedGroups = ['profile', 'branding', 'locale', 'notifications', 'enrollment', 'video', 'storage', 'setup', 'homepage', 'legal', 'footer', 'about'];

        if (! in_array($group, $allowedGroups, true)) {
            return response()->json(['message' => 'Invalid settings group.'], 422);
        }

        $validated = $request->validate([
            'values' => ['required', 'array'],
        ]);

        $existing = TenantSetting::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('group', $group)
            ->first();

        $merged = array_merge($existing?->values ?? [], $validated['values']);

        $setting = TenantSetting::updateOrCreate(
            [
                'tenant_id' => currentTenant()->id,
                'group' => $group,
            ],
            ['values' => $merged],
        );

        return response()->json([
            'message' => 'Settings updated.',
            'group' => $group,
            'values' => $setting->values,
        ]);
    }

    public function show(string $group): JsonResponse
    {
        $allowedGroups = ['profile', 'branding', 'locale', 'notifications', 'enrollment', 'video', 'storage', 'setup', 'homepage', 'legal', 'footer', 'about'];

        if (! in_array($group, $allowedGroups, true)) {
            return response()->json(['message' => 'Invalid settings group.'], 422);
        }

        $setting = TenantSetting::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('group', $group)
            ->first();

        return response()->json([
            'group' => $group,
            'values' => $setting?->values ?? [],
        ]);
    }
}
