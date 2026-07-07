<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Repositories\TenantRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicTenantController extends Controller
{
    public function __construct(
        private readonly TenantRepository $tenants,
    ) {}

    public function byDomain(Request $request): JsonResponse
    {
        $request->validate(['domain' => 'required|string|max:255']);

        $domain = $request->input('domain');
        $tenant = $this->tenants->findByDomain($domain);

        if (! $tenant) {
            return response()->json([
                'message' => 'Tenant not found for the given domain.',
            ], 404);
        }

        $domainRecord = $tenant->domains()
            ->where('domain', $domain)
            ->first();

        $branding = $this->resolveBranding($tenant);

        return response()->json([
            'id' => $tenant->id,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'domain' => $domainRecord?->domain ?? $domain,
            'status' => $tenant->status,
            'branding' => $branding,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function resolveBranding($tenant): array
    {
        $setting = $tenant->settings()
            ->where('group', 'branding')
            ->first();

        $values = $setting?->values ?? [];

        return [
            'logo' => $values['logo'] ?? null,
            'favicon' => $values['favicon'] ?? null,
            'primaryColor' => $values['primary_color'] ?? null,
            'secondaryColor' => $values['secondary_color'] ?? null,
            'accentColor' => $values['accent_color'] ?? null,
            'font' => $values['font'] ?? null,
            'darkLogo' => $values['dark_logo'] ?? null,
            'lightLogo' => $values['light_logo'] ?? null,
        ];
    }
}
