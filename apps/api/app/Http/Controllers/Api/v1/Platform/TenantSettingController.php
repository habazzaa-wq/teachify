<?php

namespace App\Http\Controllers\Api\v1\Platform;

use App\Http\Controllers\Controller;
use App\Models\TenantSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TenantSettingController extends Controller
{
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
        $allowedGroups = ['profile', 'branding', 'locale', 'notifications', 'enrollment', 'video', 'storage', 'setup', 'homepage'];

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
        $allowedGroups = ['profile', 'branding', 'locale', 'notifications', 'enrollment', 'video', 'storage', 'setup', 'homepage'];

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
