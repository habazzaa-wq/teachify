<?php

namespace App\Http\Controllers\Api\v1\Integrations;

use App\Http\Controllers\Controller;
use App\Repositories\TenantRepository;
use App\Services\Authorization\TenantAuthorizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;

class TenantGoogleAuthSettingsController extends Controller
{
    public function __construct(private readonly TenantRepository $tenants) {}

    public function show(Request $request): JsonResponse
    {
        $tenant = currentTenant();
        $this->authorizeAdmin($request, $tenant);

        $cfg = (array) data_get($tenant->settings_json, 'google_auth', []);

        return response()->json(['data' => $this->publicShape($tenant, $cfg)]);
    }

    public function update(Request $request): JsonResponse
    {
        $tenant = currentTenant();
        $this->authorizeAdmin($request, $tenant);

        $validated = $request->validate([
            'is_enabled' => ['sometimes', 'boolean'],
            'client_id' => ['nullable', 'string', 'max:512'],
            'client_secret' => ['nullable', 'string', 'max:4096'],
        ]);

        $settings = (array) ($tenant->settings_json ?? []);
        $cfg = (array) ($settings['google_auth'] ?? []);

        foreach (['is_enabled', 'client_id'] as $key) {
            if (array_key_exists($key, $validated)) {
                $value = $validated[$key];
                $cfg[$key] = is_string($value) ? trim($value) : $value;
            }
        }

        if (array_key_exists('client_secret', $validated)) {
            $secret = trim((string) ($validated['client_secret'] ?? ''));
            if ($secret !== '') {
                $cfg['client_secret_encrypted'] = Crypt::encryptString($secret);
                $cfg['client_secret_configured'] = true;
            }
        }

        $settings['google_auth'] = $cfg;
        $tenant->forceFill(['settings_json' => $settings])->save();

        // The public by-domain bootstrap resolves a cached Tenant instance.
        // Invalidate it here so the new client id appears on the student auth
        // forms immediately instead of after the repository's 1h cache TTL.
        $this->tenants->forget($tenant->id);

        $fresh = $tenant->fresh() ?? $tenant;

        return response()->json([
            'message' => 'Google auth settings updated.',
            'data' => $this->publicShape($fresh, (array) data_get($fresh->settings_json, 'google_auth', [])),
        ]);
    }

    private function publicShape($tenant, array $cfg): array
    {
        $clientId = trim((string) ($cfg['client_id'] ?? ''));
        $secretConfigured = !empty($cfg['client_secret_encrypted']) || !empty($cfg['client_secret_configured']);
        $enabled = array_key_exists('is_enabled', $cfg) ? (bool) $cfg['is_enabled'] : $clientId !== '';

        return [
            'tenantId' => $tenant->id,
            'isEnabled' => $enabled,
            'clientId' => $clientId,
            'clientSecretConfigured' => $secretConfigured,
            'status' => ($enabled && $clientId !== '') ? 'active' : 'inactive',
        ];
    }

    private function authorizeAdmin(Request $request, $tenant): void
    {
        $user = $request->user();
        $auth = app(TenantAuthorizationService::class);
        $ok = $user && ($auth->hasRole($user, $tenant, 'tenant_owner') || $auth->hasRole($user, $tenant, 'admin'));
        abort_unless($ok, 403, 'Forbidden.');
    }
}
