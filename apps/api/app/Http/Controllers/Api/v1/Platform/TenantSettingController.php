<?php

namespace App\Http\Controllers\Api\v1\Platform;

use App\Http\Controllers\Controller;
use App\Models\TenantSetting;
use Illuminate\Support\Arr;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantSettingController extends Controller
{
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

    public function site(): JsonResponse
    {
        $values = $this->brandingValues();

        return response()->json([
            'name' => currentTenant()->name,
            'favicon' => $values['favicon'] ?? null,
            'font' => $values['font'] ?? null,
            'logo_type' => $values['logo_type'] ?? null,
            'logo_icon' => $values['logo_icon'] ?? null,
            'logo_image' => $values['logo_image'] ?? null,
            'primary_color' => $values['primary_color'] ?? null,
            'secondary_color' => $values['secondary_color'] ?? null,
        ]);
    }

    public function updateSite(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'favicon' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'font' => ['sometimes', 'nullable', 'string', 'max:191'],
            'logo_type' => ['sometimes', 'nullable', 'string', 'max:191'],
            'logo_icon' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'logo_image' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'primary_color' => ['sometimes', 'nullable', 'string', 'max:64'],
            'secondary_color' => ['sometimes', 'nullable', 'string', 'max:64'],
        ]);

        $tenant = currentTenant();

        if (array_key_exists('name', $validated)) {
            $tenant->forceFill(['name' => $validated['name']])->save();
        }

        $branding = array_merge(
            $this->brandingValues(),
            Arr::only($validated, [
                'favicon', 'font', 'logo_type', 'logo_icon', 'logo_image',
                'primary_color', 'secondary_color',
            ]),
        );

        $tenant->settings()->updateOrCreate(
            ['group' => 'branding'],
            ['values' => $branding],
        );

        $tenant->refresh();

        return response()->json(array_merge(['name' => $tenant->name], Arr::only($branding, [
            'favicon', 'font', 'logo_type', 'logo_icon', 'logo_image',
            'primary_color', 'secondary_color',
        ])));
    }

    /**
     * @return array<string, mixed>
     */
    private function brandingValues(): array
    {
        return currentTenant()->settings()
            ->where('group', 'branding')
            ->value('values') ?? [];
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
