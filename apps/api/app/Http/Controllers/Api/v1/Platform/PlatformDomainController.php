<?php

namespace App\Http\Controllers\Api\v1\Platform;

use App\Http\Controllers\Controller;
use App\Models\TenantDomain;
use App\Services\Domain\DomainCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PlatformDomainController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = TenantDomain::query()
            ->with('tenant:id,name')
            ->orderBy('is_primary', 'desc')
            ->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('domain', 'like', "%{$search}%")
                    ->orWhereHas('tenant', function ($tq) use ($search) {
                        $tq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('ssl_status') && $request->input('ssl_status') !== 'all') {
            $query->where('ssl_status', $request->input('ssl_status'));
        }

        return response()->json([
            'domains' => $query->get(),
        ]);
    }

    public function show(TenantDomain $tenantDomain): JsonResponse
    {
        return response()->json([
            'domain' => $tenantDomain->load('tenant:id,name', 'verificationLogs'),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => ['required', 'integer', 'exists:tenants,id'],
            'domain' => ['required', 'string', 'max:255', 'unique:tenant_domains,domain'],
            'type' => ['required', Rule::in(['platform_subdomain', 'custom_domain', 'wildcard'])],
            'is_primary' => ['sometimes', 'boolean'],
        ]);

        if ($validated['is_primary'] ?? false) {
            TenantDomain::query()
                ->where('tenant_id', $validated['tenant_id'])
                ->where('is_primary', true)
                ->update(['is_primary' => false]);
        }

        $domain = TenantDomain::create([
            'tenant_id' => $validated['tenant_id'],
            'domain' => $validated['domain'],
            'type' => $validated['type'],
            'is_primary' => $validated['is_primary'] ?? false,
            'status' => 'pending',
            'verification_type' => 'auto',
            'verification_token' => 'teachify-' . bin2hex(random_bytes(16)),
            'expected_ip' => config('services.platform.server_ip'),
        ]);

        return response()->json([
            'message' => 'Domain added. DNS verification will start automatically.',
            'domain' => $domain->load('tenant:id,name'),
        ], 201);
    }

    public function update(Request $request, TenantDomain $tenantDomain): JsonResponse
    {
        $validated = $request->validate([
            'is_primary' => ['sometimes', 'boolean'],
        ]);

        if ($validated['is_primary'] ?? false) {
            TenantDomain::query()
                ->where('tenant_id', $tenantDomain->tenant_id)
                ->where('is_primary', true)
                ->update(['is_primary' => false]);
        }

        $tenantDomain->fill(collect($validated)->only(['is_primary'])->all())->save();

        return response()->json([
            'message' => 'Domain updated.',
            'domain' => $tenantDomain->refresh()->load('tenant:id,name'),
        ]);
    }

    public function destroy(TenantDomain $tenantDomain): JsonResponse
    {
        if ($tenantDomain->is_primary) {
            return response()->json(['message' => 'Cannot delete the primary domain.'], 422);
        }

        app(DomainCacheService::class)->invalidateDomain($tenantDomain);
        $tenantDomain->delete();

        return response()->json(['message' => 'Domain removed.']);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:tenant_domains,id'],
        ]);

        TenantDomain::whereIn('id', $validated['ids'])
            ->where('is_primary', false)
            ->delete();

        return response()->json(['message' => 'Domains deleted.']);
    }
}
