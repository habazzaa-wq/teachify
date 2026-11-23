<?php

namespace App\Http\Controllers\Api\v1\Integrations;

use App\Http\Controllers\Controller;
use App\Services\Authorization\TenantAuthorizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;

class TenantMailSettingsController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $tenant = currentTenant();
        $this->authorizeAdmin($request, $tenant);

        $mail = (array) data_get($tenant->settings_json, 'mail', []);
        return response()->json(['data' => $this->publicShape($tenant, $mail)]);
    }

    public function update(Request $request): JsonResponse
    {
        $tenant = currentTenant();
        $this->authorizeAdmin($request, $tenant);

        $validated = $request->validate([
            'is_enabled' => ['sometimes', 'boolean'],
            'mailer' => ['nullable', 'string', 'in:smtp,log'],
            'host' => ['nullable', 'string', 'max:255'],
            'port' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'username' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'max:4096'],
            'encryption' => ['nullable', 'string', 'in:tls,ssl,null'],
            'from_address' => ['nullable', 'email', 'max:255'],
            'from_name' => ['nullable', 'string', 'max:255'],
        ]);

        $settings = (array) ($tenant->settings_json ?? []);
        $mail = (array) ($settings['mail'] ?? []);

        foreach (['is_enabled', 'mailer', 'host', 'port', 'username', 'encryption', 'from_address', 'from_name'] as $key) {
            if (array_key_exists($key, $validated)) {
                $mail[$key] = $validated[$key];
            }
        }
        if (array_key_exists('password', $validated) && filled($validated['password'])) {
            $mail['password_encrypted'] = Crypt::encryptString($validated['password']);
            $mail['password_configured'] = true;
        }
        unset($mail['password']);

        $settings['mail'] = $mail;
        $tenant->forceFill(['settings_json' => $settings])->save();

        return response()->json([
            'message' => 'Mail settings updated.',
            'data' => $this->publicShape($tenant->fresh(), $mail),
        ]);
    }

    public function test(Request $request): JsonResponse
    {
        $tenant = currentTenant();
        $this->authorizeAdmin($request, $tenant);

        $mail = (array) data_get($tenant->settings_json, 'mail', []);
        $configured = !empty($mail['is_enabled']) && !empty($mail['host']) && !empty($mail['from_address']);
        return response()->json(['data' => ['configured' => $configured, 'status' => $configured ? 'active' : 'inactive']]);
    }

    private function publicShape($tenant, array $mail): array
    {
        return [
            'tenantId' => $tenant->id,
            'isEnabled' => (bool) ($mail['is_enabled'] ?? false),
            'mailer' => $mail['mailer'] ?? 'smtp',
            'host' => $mail['host'] ?? '',
            'port' => $mail['port'] ?? 587,
            'username' => $mail['username'] ?? '',
            'passwordConfigured' => !empty($mail['password_encrypted']) || !empty($mail['password_configured']),
            'encryption' => $mail['encryption'] ?? 'tls',
            'fromAddress' => $mail['from_address'] ?? '',
            'fromName' => $mail['from_name'] ?? '',
            'status' => (!empty($mail['is_enabled']) && !empty($mail['host'])) ? 'active' : 'inactive',
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
