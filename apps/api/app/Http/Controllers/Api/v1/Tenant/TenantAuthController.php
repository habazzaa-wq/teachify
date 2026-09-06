<?php

namespace App\Http\Controllers\Api\v1\Tenant;

use App\Events\Auth\LoginFailed;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\ChangePasswordRequest;
use App\Http\Requests\Tenant\TenantLoginRequest;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Repositories\TenantRepository;
use App\Services\Auth\AuthenticationService;
use App\Services\Auth\PasswordResetService;
use App\Services\Auth\TenantMembershipService;
use App\Services\Security\AuditLogger;
use App\Services\Support\EmailNormalizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class TenantAuthController extends Controller
{
    public function __construct(
        private readonly EmailNormalizer $emails,
        private readonly TenantMembershipService $memberships,
        private readonly AuditLogger $audit,
        private readonly TenantRepository $tenants,
    ) {
    }

    public function login(TenantLoginRequest $request, AuthenticationService $auth): JsonResponse
    {
        $tenant = $this->resolveTenant($request);
        $this->validateTenantAccess($tenant);

        $remember = $request->boolean('remember', false);

        $identifier = $request->input('email') ?? $request->input('phone') ?? '';

        $result = $auth->login($tenant, $identifier, $request->input('password'));

        // Re-apply remember me preference
        Auth::login($result['user'], $remember);

        $membership = $result['membership']->load('roles.permissions');

        return $this->authenticatedResponse(
            $result['user'],
            $tenant,
            $membership,
            $result['access_token']->plainTextToken,
            $result['refresh_token']->plainTextToken,
        );
    }

    private function resolveTenant(Request $request): Tenant
    {
        // 1. Try explicit tenant ID (sent after login / for authenticated requests)
        $tenantId = trim((string) $request->header('X-Tenant-ID', ''));
        if ($tenantId !== '') {
            $tenant = $this->tenants->findById($tenantId);
            if ($tenant) {
                return $tenant;
            }
        }

        // 2. Try explicit tenant domain hint (sent by frontend during login)
        $domainHint = trim((string) $request->header('X-Tenant-Domain', ''));
        if ($domainHint !== '') {
            $tenant = $this->tenants->findByDomain($domainHint);
            if ($tenant) {
                return $tenant;
            }
        }

        // 3. Try X-Forwarded-Host (proxy environment)
        $forwardedHost = trim((string) $request->header('X-Forwarded-Host', ''));
        if ($forwardedHost !== '') {
            $tenant = $this->tenants->findByHostname($forwardedHost);
            if ($tenant) {
                return $tenant;
            }
        }

        // 4. Fall back to the request Host header
        $hostname = $request->getHost();
        $tenant = $this->tenants->findByHostname($hostname);
        if ($tenant) {
            return $tenant;
        }

        throw ValidationException::withMessages([
            'tenant' => ['Unable to identify the academy. Please check the URL.'],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenant = currentTenant();
        $membership = app('currentTenantMembership')->load('roles.permissions');

        return $this->authenticatedResponse($user, $tenant, $membership);
    }

    public function logout(Request $request, AuthenticationService $auth): JsonResponse
    {
        $auth->logout($request->user());

        return response()->json(['message' => 'Logged out.']);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! Hash::check($request->input('current_password'), $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['كلمة المرور الحالية غير صحيحة.'],
            ]);
        }

        $user->password = Hash::make($request->input('password'));
        $user->save();

        // Revoke all other sessions, keep the current one signed in.
        $currentToken = $request->user()->currentAccessToken();
        if ($currentToken) {
            $user->tokens()->whereKeyNot($currentToken->id)->delete();
        }

        $this->audit->record('password_changed', [
            'tenant_id' => currentTenant()->id,
            'user_id' => $user->id,
        ]);

        return response()->json([
            'message' => 'تم تغيير كلمة المرور بنجاح.',
        ]);
    }

    public function refresh(Request $request, AuthenticationService $auth): JsonResponse
    {
        $request->validate([
            'refresh_token' => ['required', 'string'],
        ]);

        $tenant = $this->resolveTenant($request);
        $refreshToken = PersonalAccessToken::findToken($request->input('refresh_token'));

        if (! $refreshToken || $refreshToken->name !== 'refresh_token') {
            return response()->json(['message' => 'Invalid refresh token.'], 401);
        }

        if ($refreshToken->expires_at && $refreshToken->expires_at->isPast()) {
            return response()->json(['message' => 'Refresh token expired.'], 401);
        }

        $user = $refreshToken->tokenable;

        if (! $user) {
            return response()->json(['message' => 'User not found.'], 401);
        }

        $membership = $this->memberships->activeMembership($user, $tenant);

        if (! $membership) {
            return response()->json(['message' => 'No active membership found.'], 403);
        }

        $user->tokens()
            ->where('name', 'access_token')
            ->where('expires_at', '<', now())
            ->delete();

        $accessToken = $user->createToken('access_token', ['access:api'], now()->addHours(24));
        $this->memberships->touchLastAccessed($membership);

        return response()->json([
            'message' => 'Token refreshed.',
            'access_token' => $accessToken->plainTextToken,
            'token_type' => 'Bearer',
        ]);
    }

    public function forgotPassword(Request $request, PasswordResetService $passwords): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $tenant = $this->resolveTenant($request);
        $normalizedEmail = $this->emails->normalize($validated['email']);

        $user = User::query()->where('email', $normalizedEmail)->first();

        if ($user) {
            $membership = $this->memberships->activeMembership($user, $tenant);

            if ($membership) {
                $passwords->sendResetLink($normalizedEmail);
                $this->audit->record('password_reset_requested', [
                    'tenant_id' => $tenant->id,
                    'user_id' => $user->id,
                ]);
            }
        }

        return response()->json([
            'message' => 'If the account exists, a password reset link has been sent.',
        ]);
    }

    public function resetPassword(Request $request, PasswordResetService $passwords): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $status = $passwords->reset(
            $validated['email'],
            $validated['token'],
            $validated['password'],
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => ['Unable to reset password.'],
            ]);
        }

        return response()->json(['message' => 'Password reset successfully.']);
    }

    private function validateTenantAccess(Tenant $tenant): void
    {
        if ($tenant->status !== 'active') {
            throw ValidationException::withMessages([
                'tenant' => ['This tenant account is inactive.'],
            ]);
        }

        // When the tenant was explicitly resolved from a request header
        // (X-Tenant-ID or X-Tenant-Domain), skip the hostname check.
        // The hostname can be 'localhost' behind a proxy, which would
        // never match a real tenant domain.
        if (
            request()->header('X-Tenant-ID') ||
            request()->header('X-Tenant-Domain') ||
            request()->header('X-Forwarded-Host')
        ) {
            return;
        }

        $hostname = request()->getHost();
        if (! $tenant->matchesDomain($hostname)) {
            throw ValidationException::withMessages([
                'tenant' => ['Domain not recognized for this tenant.'],
            ]);
        }
    }

    private function authenticatedResponse(
        User $user,
        Tenant $tenant,
        mixed $membership,
        ?string $accessToken = null,
        ?string $refreshToken = null,
    ): JsonResponse {
        $roles = $membership->roles;
        $permissions = $roles
            ->flatMap(fn ($role) => $role->permissions)
            ->unique('id')
            ->values();

        // Only staff memberships (owner/admin/instructor) may enter the tenant
        // control panel. Student accounts get no dashboard access.
        $canAccessDashboard = $roles->contains(fn ($role) => in_array($role->slug, ['tenant_owner', 'admin', 'instructor']));

        $response = [
            'message' => 'Authenticated.',
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_platform_super_admin' => $user->isPlatformSuperAdmin(),
            ],
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'status' => $tenant->status,
                'domain' => $tenant->getDefaultDomain(),
                // Teacher appearance (control-panel colors) — read from the
                // `branding` settings group so the saved colors survive a reload.
                'branding' => $this->getBranding($tenant),
                // Platform brand colors (public-site theme).
                'platform_branding' => $this->getPlatformBranding($tenant),
            ],
            'membership' => [
                'id' => $membership->id,
                'tenant_id' => $membership->tenant_id,
                'status' => $membership->status,
                'joined_at' => $membership->joined_at,
                'last_accessed_at' => $membership->last_accessed_at,
            ],
            'roles' => $roles->map(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
            ])->values(),
            'permissions' => $permissions->map(fn ($permission) => [
                'id' => $permission->id,
                'name' => $permission->name,
                'slug' => $permission->slug,
            ])->values(),
            'abilities' => [
                'can_access_dashboard' => $canAccessDashboard,
                'can_manage_courses' => $permissions->contains(fn ($p) => in_array($p->slug, ['courses.create', 'courses.update', 'courses.delete'])),
                'can_manage_users' => $permissions->contains(fn ($p) => in_array($p->slug, ['users.create', 'users.update', 'users.delete'])),
                'can_manage_settings' => $permissions->contains(fn ($p) => str_starts_with($p->slug, 'settings.')),
            ],
            'navigation' => $this->getNavigation($roles, $permissions),
            'subscription' => $tenant->subscription,
            'plan' => $tenant->plan,
            'feature_flags' => $tenant->feature_flags,
        ];

        if ($accessToken) {
            $response['access_token'] = $accessToken;
            $response['refresh_token'] = $refreshToken;
        }

        return response()->json($response);
    }

    /**
     * Teacher appearance settings (control-panel colors). Sourced from the
     * `branding` settings group so the values saved through the appearance page
     * (PUT /settings/site) are returned here on every bootstrap/reload.
     *
     * @return array<string, mixed>
     */
    private function getBranding(Tenant $tenant): array
    {
        $setting = $tenant->settings()->where('group', 'branding')->first();
        $values = $setting?->values ?? [];
        $domain = $tenant->getPrimaryDomain();

        return [
            'logo' => $values['logo'] ?? null,
            'favicon' => $values['favicon'] ?? null,
            'primary_color' => $values['primary_color'] ?? null,
            'secondary_color' => $values['secondary_color'] ?? null,
            'accent_color' => $values['accent_color'] ?? null,
            'font' => $values['font'] ?? null,
            'dark_logo' => $values['dark_logo'] ?? null,
            'light_logo' => $values['light_logo'] ?? null,
            'logo_type' => $values['logo_type'] ?? null,
            'logo_icon' => $values['logo_icon'] ?? null,
            'logo_image' => $values['logo_image'] ?? null,
            'domain' => $domain?->domain ?? $tenant->slug . '.' . config('app.base_domain', 'localhost'),
        ];
    }

    /**
     * Platform-level brand colors (the "platform colors" field). Resolved
     * per-tenant so the logged-in tenant always sees its own branding. Distinct
     * from `getBranding` (tenant appearance settings) which only apply to the
     * teacher dashboard and login.
     *
     * @return array<string, mixed>
     */
    private function getPlatformBranding(Tenant $tenant): array
    {
        return (new \App\Services\Platform\PlatformBrandingService())->resolve($tenant->id);
    }

    private function getNavigation($roles, $permissions): array
    {
        return [
            ['key' => 'dashboard', 'label' => 'Dashboard', 'icon' => 'LayoutDashboard', 'href' => '/dashboard', 'required_permission' => null],
            ['key' => 'courses', 'label' => 'Courses', 'icon' => 'BookOpen', 'href' => '/dashboard/courses', 'required_permission' => 'courses.view'],
            ['key' => 'categories', 'label' => 'Categories', 'icon' => 'FolderTree', 'href' => '/dashboard/categories', 'required_permission' => 'categories.view'],
            ['key' => 'students', 'label' => 'Students', 'icon' => 'Users', 'href' => '/dashboard/students', 'required_permission' => 'users.view'],
            ['key' => 'analytics', 'label' => 'Analytics', 'icon' => 'BarChart3', 'href' => '/dashboard/analytics', 'required_permission' => 'analytics.view'],
            ['key' => 'content', 'label' => 'Content', 'icon' => 'FileText', 'href' => '/dashboard/content', 'required_permission' => 'courses.view'],
            ['key' => 'discussions', 'label' => 'Discussions', 'icon' => 'MessageSquare', 'href' => '/dashboard/discussions', 'required_permission' => 'discussions.view'],
            ['key' => 'certificates', 'label' => 'Certificates', 'icon' => 'Award', 'href' => '/dashboard/certificates', 'required_permission' => 'certificates.view'],
            ['key' => 'notifications', 'label' => 'Notifications', 'icon' => 'Bell', 'href' => '/dashboard/notifications', 'required_permission' => null],
            ['key' => 'settings', 'label' => 'Settings', 'icon' => 'Settings', 'href' => '/dashboard/settings', 'required_permission' => 'settings.view'],
            ['key' => 'users', 'label' => 'Users', 'icon' => 'UserCog', 'href' => '/dashboard/users', 'required_permission' => 'users.view'],
            ['key' => 'roles', 'label' => 'Roles', 'icon' => 'Shield', 'href' => '/dashboard/roles', 'required_permission' => 'roles.view'],
        ];
    }
}
