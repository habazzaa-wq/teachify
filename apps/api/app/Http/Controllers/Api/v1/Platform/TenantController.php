<?php

namespace App\Http\Controllers\Api\v1\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\CreateTenantRequest;
use App\Http\Resources\TenantResource;
use App\Models\Tenant;
use App\Services\Platform\TenantCreationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TenantController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $tenants = Tenant::query()
            ->with(['domains' => fn ($query) => $query->where('is_primary', true)])
            ->latest()
            ->paginate(25);

        return TenantResource::collection($tenants);
    }

    public function store(CreateTenantRequest $request, TenantCreationService $tenants): JsonResponse
    {
        $result = $tenants->create($request->validated(), $request->user());

        return response()->json([
            'message' => 'Tenant provisioned.',
            'tenant' => new TenantResource($result['tenant']),
            'owner' => [
                'id' => $result['owner']->id,
                'name' => $result['owner']->name,
                'email' => $result['owner']->email,
            ],
            'membership' => [
                'id' => $result['membership']->id,
                'tenant_id' => $result['membership']->tenant_id,
                'user_id' => $result['membership']->user_id,
                'status' => $result['membership']->status,
            ],
        ], 201);
    }

    public function show(Tenant $tenant): JsonResponse
    {
        $tenant->load([
            'domains',
            'settings',
            'integrations',
            'provisioningSteps',
            'memberships.user',
            'roles.permissions',
        ]);

        return response()->json([
            'tenant' => new TenantResource($tenant),
            'domains' => $tenant->domains,
            'settings' => $tenant->settings,
            'integrations' => $tenant->integrations,
            'provisioning_steps' => $tenant->provisioningSteps,
            'memberships' => $tenant->memberships,
            'roles' => $tenant->roles,
        ]);
    }

    public function update(Request $request, Tenant $tenant): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', 'alpha_dash:ascii', 'unique:tenants,slug,'.$tenant->id],
            'status' => ['sometimes', 'string', 'in:active,trial,suspended,archived,pending,cancelled,expired'],
            'description' => ['sometimes', 'nullable', 'string'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'timezone' => ['sometimes', 'nullable', 'string', 'max:64'],
            'language' => ['sometimes', 'nullable', 'string', 'max:8'],
            'currency' => ['sometimes', 'nullable', 'string', 'max:8'],
            'company_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'support_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'notes' => ['sometimes', 'nullable', 'string'],
            'tags' => ['sometimes', 'nullable', 'array'],
            'address' => ['sometimes', 'nullable', 'array'],
            'owner' => ['sometimes', 'nullable', 'array'],
            'owner_account' => ['sometimes', 'nullable', 'array'],
            'branding' => ['sometimes', 'nullable', 'array'],
            'limits' => ['sometimes', 'nullable', 'array'],
            'integrations_json' => ['sometimes', 'nullable', 'array'],
            'security' => ['sometimes', 'nullable', 'array'],
            'storage_json' => ['sometimes', 'nullable', 'array'],
            'domain' => ['sometimes', 'nullable', 'array'],
            'subscription' => ['sometimes', 'nullable', 'array'],
            'plan' => ['sometimes', 'nullable', 'array'],
        ]);

        // Update domain if provided
        if ($request->has('domain')) {
            $domainData = $request->input('domain');
            $primaryDomain = $tenant->domains()->where('is_primary', true)->first();

            if ($primaryDomain && isset($domainData['platformSubdomain'])) {
                $primaryDomain->update([
                    'subdomain' => $domainData['platformSubdomain'],
                    'domain' => $domainData['platformSubdomain'] . '.' . config('app.base_domain', 'localhost'),
                ]);

                // Update or create custom domain if provided
                if (isset($domainData['customDomain']) && $domainData['customDomain']) {
                    $customDomain = $tenant->domains()->where('type', 'custom')->first();
                    if ($customDomain) {
                        $customDomain->update([
                            'domain' => $domainData['customDomain'],
                        ]);
                    } else {
                        $tenant->domains()->create([
                            'domain' => $domainData['customDomain'],
                            'type' => 'custom',
                            'is_primary' => false,
                            'status' => 'active',
                        ]);
                    }
                }
            } elseif (isset($domainData['platformSubdomain'])) {
                $subdomain = $domainData['platformSubdomain'];
                $fullDomain = $subdomain . '.' . config('app.base_domain', 'localhost');
                $tenant->domains()->create([
                    'domain' => $fullDomain,
                    'subdomain' => $subdomain,
                    'type' => 'primary',
                    'is_primary' => true,
                    'status' => 'active',
                ]);
            }
        }

        // Update owner user if owner data provided
        if ($request->has('owner')) {
            $ownerData = $request->input('owner');
            $ownerMembership = $tenant->memberships()->with('user')->first();

            if ($ownerMembership && $ownerMembership->user) {
                $ownerMembership->user->update([
                    'name' => $ownerData['name'] ?? $ownerMembership->user->name,
                    'email' => $ownerData['email'] ?? $ownerMembership->user->email,
                ]);
            }
        }

        // Update owner password if provided
        if ($request->has('owner_account')) {
            $ownerAccountData = $request->input('owner_account');
            $ownerMembership = $tenant->memberships()->with('user')->first();

            if ($ownerMembership && $ownerMembership->user && !empty($ownerAccountData['password'])) {
                $ownerMembership->user->update([
                    'password' => bcrypt($ownerAccountData['password']),
                ]);
            }
        }

        $tenant->update($validated);
        $tenant->load(['domains']);

        return response()->json([
            'tenant' => new TenantResource($tenant),
        ]);
    }

    public function destroy(Tenant $tenant): JsonResponse
    {
        $tenant->delete();

        return response()->json(['message' => 'Tenant deleted.']);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:tenants,id'],
        ]);

        Tenant::whereIn('id', $validated['ids'])->delete();

        return response()->json(['message' => 'Tenants deleted.']);
    }
}