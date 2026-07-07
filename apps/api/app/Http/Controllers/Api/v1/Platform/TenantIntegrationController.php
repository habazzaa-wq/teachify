<?php

namespace App\Http\Controllers\Api\v1\Platform;

use App\Http\Controllers\Controller;
use App\Models\TenantIntegration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TenantIntegrationController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'integrations' => TenantIntegration::query()
                ->where('tenant_id', currentTenant()->id)
                ->orderBy('provider')
                ->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'provider' => ['required', 'string', 'max:255'],
            'service' => ['required', 'string', 'max:255'],
            'config' => ['required', 'array'],
            'external_id' => ['nullable', 'string', 'max:255'],
        ]);

        $integration = TenantIntegration::create([
            'tenant_id' => currentTenant()->id,
            'provider' => $validated['provider'],
            'service' => $validated['service'],
            'status' => 'pending',
            'config' => $validated['config'],
            'external_id' => $validated['external_id'] ?? null,
        ]);

        return response()->json([
            'message' => 'Integration created.',
            'integration' => $integration,
        ], 201);
    }

    public function update(Request $request, TenantIntegration $tenantIntegration): JsonResponse
    {
        abort_if($tenantIntegration->tenant_id !== currentTenant()->id, 404);

        $validated = $request->validate([
            'config' => ['sometimes', 'array'],
            'status' => ['sometimes', Rule::in(['pending', 'active', 'failed', 'disconnected'])],
            'external_id' => ['nullable', 'string', 'max:255'],
        ]);

        $tenantIntegration->fill(collect($validated)->only(['config', 'status', 'external_id'])->all())->save();

        return response()->json([
            'message' => 'Integration updated.',
            'integration' => $tenantIntegration->refresh(),
        ]);
    }

    public function destroy(TenantIntegration $tenantIntegration): JsonResponse
    {
        abort_if($tenantIntegration->tenant_id !== currentTenant()->id, 404);

        $tenantIntegration->delete();

        return response()->json(['message' => 'Integration removed.']);
    }
}
