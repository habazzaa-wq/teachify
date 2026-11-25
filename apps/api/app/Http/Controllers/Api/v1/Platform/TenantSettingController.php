<?php

namespace App\Http\Controllers\Api\v1\Platform;

use App\Http\Controllers\Controller;
use App\Models\TenantSetting;
use App\Repositories\TenantRepository;
use App\Services\Platform\PlatformBrandingService;
use App\Support\StudentFields;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TenantSettingController extends Controller
{
    /**
     * Public-site brand colors (ألوان الموقع), stored in `platform_branding`.
     * These drive the public site only (.community-theme / --brand-*).
     *
     * The two color palettes are deliberately separate from the `branding`
     * settings group (ألوان المخصصة), which drives the teacher/admin/instructor
     * dashboards through `updateSite`. Never mirror one palette into the other.
     * The font in this row is the one value intentionally shared across shells.
     */
    public function platform(): JsonResponse
    {
        $tenant = currentTenant();

        return response()->json([
            'branding' => $this->resolvePlatformBranding($tenant),
        ]);
    }

    /**
     * Persist the public-site palette (ألوان الموقع) and the shared tenant font
     * onto the current tenant's own `platform_branding` row. Colors stay
     * public-site-only: `updateSite` owns the dashboard appearance palette and
     * never writes these columns. Typography is shared, so that editor mirrors
     * only the font here to keep every shell in sync.
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
        $brandingService = new PlatformBrandingService();
        $branding = $brandingService->update($tenant->id, $validated);

        // The font is shared by every shell, not dashboard-only. Keep the
        // legacy `branding` settings row in sync so auth/bootstrap and
        // by-domain payloads (which read that row) resolve the same face.
        if (array_key_exists('font', $validated)) {
            $this->mergeBrandingValues($tenant, ['font' => $validated['font']]);
        }

        // Branding is read from the cached tenant payload on every request.
        app(TenantRepository::class)->forget($tenant->id);

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
                'font' => $values['font'] ?? (new PlatformBrandingService())->resolveFont($tenant->id),
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
            $brandingValues = $this->mergeBrandingValues($tenant, $brandingValues);
        }

        // Typography is shared by every shell, so the font saved here also goes
        // to `platform_branding` (null resets return to the frontend default).
        // Colors must NOT be mirrored: this editor saves the dashboard
        // appearance palette (ألوان المخصصة), while the public-site palette
        // (ألوان الموقع) is owned exclusively by updatePlatformBranding().
        // Mirroring colors here was the reason editing one page recolored the other.
        $platformFont = array_intersect_key($values, array_flip(['font']));
        if ($platformFont !== []) {
            app(PlatformBrandingService::class)->update($tenant->id, $platformFont);
        }

        // Branding/font are read from the tenant payload on every request, so
        // drop cached tenant/domain resolution after any edit — otherwise a
        // public page can keep serving an old font.
        if ($brandingValues !== [] || array_key_exists('name', $values)) {
            app(TenantRepository::class)->forget($tenant->id);
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
                'font' => $brandingValues['font'] ?? (new PlatformBrandingService())->resolveFont($tenant->id),
                'primary_color' => $brandingValues['primary_color'] ?? null,
                'secondary_color' => $brandingValues['secondary_color'] ?? null,
            ],
        ]);
    }

    /**
     * Merge values into the tenant's `branding` settings row — the shape read
     * by auth/bootstrap and by-domain responses.
     *
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    private function mergeBrandingValues(\App\Models\Tenant $tenant, array $values): array
    {
        $existing = $tenant->settings()
            ->where('group', 'branding')
            ->first();

        $merged = array_merge($existing?->values ?? [], $values);

        TenantSetting::updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'group' => 'branding',
            ],
            ['values' => $merged],
        );

        return $merged;
    }

    /**
     * @return array<string, mixed>
     */
    private function resolvePlatformBranding(\App\Models\Tenant $tenant): array
    {
        return (new PlatformBrandingService())->resolve($tenant->id);
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
        $allowedGroups = ['profile', 'branding', 'locale', 'notifications', 'enrollment', 'video', 'storage', 'setup', 'homepage', 'legal', 'footer', 'about', 'student_fields'];

        if (! in_array($group, $allowedGroups, true)) {
            return response()->json(['message' => 'Invalid settings group.'], 422);
        }

        $validated = $request->validate(
            $group === 'student_fields'
                ? StudentFields::validationRules()
                : ['values' => ['required', 'array']],
        );

        $values = $validated['values'];
        if ($group === 'student_fields') {
            // Never persist unknown keys into the student-fields config.
            $values = array_intersect_key($values, array_flip(StudentFields::OPTIONAL));
        }

        $existing = TenantSetting::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('group', $group)
            ->first();

        $merged = array_merge($existing?->values ?? [], $values);

        $setting = TenantSetting::updateOrCreate(
            [
                'tenant_id' => currentTenant()->id,
                'group' => $group,
            ],
            ['values' => $merged],
        );

        if ($group === 'student_fields') {
            app(TenantRepository::class)->forget(currentTenant()->id);
        }

        return response()->json([
            'message' => 'Settings updated.',
            'group' => $group,
            'values' => $setting->values,
        ]);
    }

    public function show(string $group): JsonResponse
    {
        $allowedGroups = ['profile', 'branding', 'locale', 'notifications', 'enrollment', 'video', 'storage', 'setup', 'homepage', 'legal', 'footer', 'about', 'student_fields'];

        if (! in_array($group, $allowedGroups, true)) {
            return response()->json(['message' => 'Invalid settings group.'], 422);
        }

        $setting = TenantSetting::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('group', $group)
            ->first();

        return response()->json([
            'group' => $group,
            'values' => $group === 'student_fields'
                ? StudentFields::resolve(currentTenant()->id)
                : ($setting?->values ?? []),
        ]);
    }
}
