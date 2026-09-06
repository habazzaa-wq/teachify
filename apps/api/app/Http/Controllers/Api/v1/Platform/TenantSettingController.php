<?php

namespace App\Http\Controllers\Api\v1\Platform;

use App\Http\Controllers\Controller;
use App\Models\TenantSetting;
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
