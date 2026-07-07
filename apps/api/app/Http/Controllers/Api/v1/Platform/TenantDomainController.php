<?php

namespace App\Http\Controllers\Api\v1\Platform;

use App\Http\Controllers\Controller;
use App\Models\TenantDomain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TenantDomainController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'domains' => TenantDomain::query()
                ->where('tenant_id', currentTenant()->id)
                ->orderBy('is_primary', 'desc')
                ->orderBy('created_at', 'desc')
                ->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'domain' => ['required', 'string', 'max:255', 'unique:tenant_domains,domain'],
            'type' => ['required', Rule::in(['platform_subdomain', 'custom_domain', 'wildcard'])],
            'is_primary' => ['sometimes', 'boolean'],
        ]);

        if ($validated['is_primary'] ?? false) {
            TenantDomain::query()
                ->where('tenant_id', currentTenant()->id)
                ->where('is_primary', true)
                ->update(['is_primary' => false]);
        }

        $domain = TenantDomain::create([
            'tenant_id' => currentTenant()->id,
            'domain' => $validated['domain'],
            'type' => $validated['type'],
            'is_primary' => $validated['is_primary'] ?? false,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Domain added.',
            'domain' => $domain,
        ], 201);
    }

    public function update(Request $request, TenantDomain $tenantDomain): JsonResponse
    {
        abort_if($tenantDomain->tenant_id !== currentTenant()->id, 404);

        $validated = $request->validate([
            'is_primary' => ['sometimes', 'boolean'],
            'status' => ['sometimes', Rule::in(['pending', 'active', 'failed', 'removed'])],
        ]);

        if ($validated['is_primary'] ?? false) {
            TenantDomain::query()
                ->where('tenant_id', currentTenant()->id)
                ->where('is_primary', true)
                ->update(['is_primary' => false]);
        }

        $tenantDomain->fill(collect($validated)->only(['is_primary', 'status'])->all())->save();

        return response()->json([
            'message' => 'Domain updated.',
            'domain' => $tenantDomain->refresh(),
        ]);
    }

    public function destroy(TenantDomain $tenantDomain): JsonResponse
    {
        abort_if($tenantDomain->tenant_id !== currentTenant()->id, 404);

        if ($tenantDomain->is_primary) {
            return response()->json(['message' => 'Cannot delete the primary domain.'], 422);
        }

        $tenantDomain->delete();

        return response()->json(['message' => 'Domain removed.']);
    }

    public function verify(TenantDomain $tenantDomain): JsonResponse
    {
        abort_if($tenantDomain->tenant_id !== currentTenant()->id, 404);

        $tenantDomain->forceFill([
            'verified_at' => now(),
            'status' => 'active',
            'dns_checked_at' => now(),
        ])->save();

        return response()->json([
            'message' => 'Domain verified.',
            'domain' => $tenantDomain->refresh(),
        ]);
    }
}
