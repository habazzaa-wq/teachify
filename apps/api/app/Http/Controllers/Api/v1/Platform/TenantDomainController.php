<?php

namespace App\Http\Controllers\Api\v1\Platform;

use App\Http\Controllers\Controller;
use App\Models\TenantDomain;
use App\Services\Domain\DomainCacheService;
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
            'verification_type' => 'auto',
            'verification_token' => 'teachify-' . bin2hex(random_bytes(16)),
            'expected_ip' => config('services.platform.server_ip'),
        ]);

        return response()->json([
            'message' => 'Domain added. DNS verification will start automatically.',
            'domain' => $domain,
            'dns_instructions' => $validated['type'] === 'custom_domain' ? [
                'type' => 'A',
                'host' => $validated['domain'],
                'value' => config('services.platform.server_ip'),
                'ttl' => 3600,
                'note' => 'You can also use a CNAME record pointing to ' . config('services.platform.domain'),
            ] : null,
        ], 201);
    }

    public function show(TenantDomain $tenantDomain): JsonResponse
    {
        abort_if($tenantDomain->tenant_id !== currentTenant()->id, 404);

        return response()->json([
            'domain' => $tenantDomain->load('verificationLogs'),
        ]);
    }

    public function status(TenantDomain $tenantDomain): JsonResponse
    {
        abort_if($tenantDomain->tenant_id !== currentTenant()->id, 404);

        $tenantDomain->refresh();

        return response()->json([
            'domain' => $tenantDomain,
            'verification' => [
                'dns_ready' => in_array($tenantDomain->status, ['dns_verified', 'active']),
                'ssl_ready' => $tenantDomain->ssl_status === 'active',
                'active' => $tenantDomain->status === 'active',
            ],
        ]);
    }

    public function update(Request $request, TenantDomain $tenantDomain): JsonResponse
    {
        abort_if($tenantDomain->tenant_id !== currentTenant()->id, 404);

        $validated = $request->validate([
            'is_primary' => ['sometimes', 'boolean'],
        ]);

        if ($validated['is_primary'] ?? false) {
            TenantDomain::query()
                ->where('tenant_id', currentTenant()->id)
                ->where('is_primary', true)
                ->update(['is_primary' => false]);
        }

        $tenantDomain->fill(collect($validated)->only(['is_primary'])->all())->save();

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

        app(DomainCacheService::class)->invalidateDomain($tenantDomain);
        $tenantDomain->delete();

        return response()->json(['message' => 'Domain removed.']);
    }
}
