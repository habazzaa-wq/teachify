<?php

namespace App\Http\Controllers\Api\v1\Platform;

use App\Http\Controllers\Controller;
use App\Models\TenantDomain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PlatformDomainController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = TenantDomain::query()
            ->with('tenant')
            ->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('domain', 'like', "%{$search}%")
                  ->orWhereHas('tenant', fn($t) => $t->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->tenant_id);
        }

        return response()->json([
            'domains' => $query->get(),
        ]);
    }

    public function show(TenantDomain $tenantDomain): JsonResponse
    {
        $tenantDomain->load('tenant');
        return response()->json(['domain' => $tenantDomain]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => ['required', 'exists:tenants,id'],
            'domain' => ['required', 'string', 'max:255', 'unique:tenant_domains,domain'],
            'type' => ['required', Rule::in(['platform_subdomain', 'custom_domain', 'wildcard'])],
            'is_primary' => ['sometimes', 'boolean'],
        ]);

        if ($validated['is_primary'] ?? false) {
            TenantDomain::where('tenant_id', $validated['tenant_id'])
                ->where('is_primary', true)
                ->update(['is_primary' => false]);
        }

        $domain = TenantDomain::create([
            'tenant_id' => $validated['tenant_id'],
            'domain' => $validated['domain'],
            'type' => $validated['type'],
            'is_primary' => $validated['is_primary'] ?? false,
            'status' => 'pending',
        ]);

        $domain->load('tenant');

        return response()->json([
            'message' => 'Domain created.',
            'domain' => $domain,
        ], 201);
    }

    public function update(Request $request, TenantDomain $tenantDomain): JsonResponse
    {
        $validated = $request->validate([
            'is_primary' => ['sometimes', 'boolean'],
            'status' => ['sometimes', Rule::in(['pending', 'dns_verified', 'active', 'failed', 'removed'])],
        ]);

        if ($validated['is_primary'] ?? false) {
            TenantDomain::where('tenant_id', $tenantDomain->tenant_id)
                ->where('is_primary', true)
                ->where('id', '!=', $tenantDomain->id)
                ->update(['is_primary' => false]);
        }

        $tenantDomain->fill(collect($validated)->only(['is_primary', 'status'])->all())->save();
        $tenantDomain->load('tenant');

        return response()->json([
            'message' => 'Domain updated.',
            'domain' => $tenantDomain->refresh(),
        ]);
    }

    public function destroy(TenantDomain $tenantDomain): JsonResponse
    {
        if ($tenantDomain->is_primary) {
            return response()->json(['message' => 'Cannot delete the primary domain.'], 422);
        }

        $tenantDomain->delete();

        return response()->json(['message' => 'Domain removed.']);
    }

    public function verify(TenantDomain $tenantDomain): JsonResponse
    {
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

    public function refreshStatus(TenantDomain $tenantDomain): JsonResponse
    {
        $tenantDomain->load('tenant');
        return response()->json(['domain' => $tenantDomain]);
    }

    public function renewSsl(TenantDomain $tenantDomain): JsonResponse
    {
        $tenantDomain->load('tenant');
        return response()->json(['domain' => $tenantDomain]);
    }

    public function bulkDelete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['exists:tenant_domains,id'],
        ]);

        TenantDomain::whereIn('id', $validated['ids'])
            ->where('is_primary', false)
            ->delete();

        return response()->json(['message' => 'Domains removed.']);
    }
}
