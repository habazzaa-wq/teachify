<?php

namespace App\Http\Controllers\Api\v1\Auth;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Auth\AuthenticationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request, AuthenticationService $auth): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $tenant = currentTenant();

        // Tenant pre-validation
        $this->validateTenantAccess($tenant);

        $result = $auth->login($tenant, $validated['email'], $validated['password']);

        $user = $result['user'];
        $membership = $result['membership'];
        $membership->load('roles.permissions');

        $roles = $membership->roles;
        $permissions = $roles
            ->flatMap(fn ($role) => $role->permissions)
            ->unique('id')
            ->values();

        return response()->json([
            'message' => 'Authenticated.',
            'access_token' => $result['access_token']->plainTextToken,
            'refresh_token' => $result['refresh_token']->plainTextToken,
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
                'branding' => $this->getBranding($tenant),
                'platform_branding' => $this->getPlatformBranding($tenant),
            ],
            'membership' => [
                'id' => $membership->id,
                'tenant_id' => $membership->tenant_id,
                'status' => $membership->status,
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
                'can_access_dashboard' => true,
                'can_manage_courses' => $permissions->contains(fn ($p) => in_array($p->slug, ['courses.create', 'courses.update', 'courses.delete'])),
                'can_manage_users' => $permissions->contains(fn ($p) => in_array($p->slug, ['users.create', 'users.update', 'users.delete'])),
                'can_manage_settings' => $permissions->contains(fn ($p) => str_starts_with($p->slug, 'settings.')),
            ],
            'navigation' => $this->getNavigation($roles, $permissions),
        ]);
    }

    public function refresh(Request $request, AuthenticationService $auth): JsonResponse
    {
        $request->validate([
            'refresh_token' => ['required', 'string'],
        ]);

        $tenant = currentTenant();
        $this->validateTenantAccess($tenant);

        // Find the user by refresh token
        $refreshToken = \Laravel\Sanctum\PersonalAccessToken::findToken($request->input('refresh_token'));

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

        $result = $auth->refresh($user, $tenant);

        return response()->json([
            'message' => 'Token refreshed.',
            'access_token' => $result['access_token']->plainTextToken,
            'token_type' => 'Bearer',
        ]);
    }

    public function logout(Request $request, AuthenticationService $auth): JsonResponse
    {
        $auth->logout($request->user());

        return response()->json(['message' => 'Logged out.']);
    }

    private function validateTenantAccess(Tenant $tenant): void
    {
        if ($tenant->status !== 'active') {
            throw ValidationException::withMessages([
                'tenant' => ['This tenant account is disabled.'],
            ]);
        }

        // Verify domain is active
        $hostname = request()->getHost();
        if (! $tenant->matchesDomain($hostname)) {
            throw ValidationException::withMessages([
                'tenant' => ['Domain not recognized for this tenant.'],
            ]);
        }
    }

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
            'domain' => $domain?->domain ?? $tenant->slug . '.' . config('app.base_domain', 'localhost'),
        ];
    }

    /**
     * Platform-level brand colors (the "platform colors" field). Resolved
     * per-tenant and distinct from `getBranding` (tenant appearance settings)
     * which only apply to the teacher dashboard and login.
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
            [
                'key' => 'dashboard',
                'label' => 'Dashboard',
                'icon' => 'LayoutDashboard',
                'href' => '/dashboard',
                'required_permission' => null,
            ],
            [
                'key' => 'courses',
                'label' => 'Courses',
                'icon' => 'BookOpen',
                'href' => '/dashboard/courses',
                'required_permission' => 'courses.view',
            ],
            [
                'key' => 'categories',
                'label' => 'Categories',
                'icon' => 'FolderTree',
                'href' => '/dashboard/categories',
                'required_permission' => 'categories.view',
            ],
            [
                'key' => 'students',
                'label' => 'Students',
                'icon' => 'Users',
                'href' => '/dashboard/students',
                'required_permission' => 'users.view',
            ],
            [
                'key' => 'analytics',
                'label' => 'Analytics',
                'icon' => 'BarChart3',
                'href' => '/dashboard/analytics',
                'required_permission' => 'analytics.view',
            ],
            [
                'key' => 'content',
                'label' => 'Content',
                'icon' => 'FileText',
                'href' => '/dashboard/content',
                'required_permission' => 'courses.view',
            ],
            [
                'key' => 'discussions',
                'label' => 'Discussions',
                'icon' => 'MessageSquare',
                'href' => '/dashboard/discussions',
                'required_permission' => 'discussions.view',
            ],
            [
                'key' => 'certificates',
                'label' => 'Certificates',
                'icon' => 'Award',
                'href' => '/dashboard/certificates',
                'required_permission' => 'certificates.view',
            ],
            [
                'key' => 'notifications',
                'label' => 'Notifications',
                'icon' => 'Bell',
                'href' => '/dashboard/notifications',
                'required_permission' => null,
            ],
            [
                'key' => 'settings',
                'label' => 'Settings',
                'icon' => 'Settings',
                'href' => '/dashboard/settings',
                'required_permission' => 'settings.view',
            ],
            [
                'key' => 'users',
                'label' => 'Users',
                'icon' => 'UserCog',
                'href' => '/dashboard/users',
                'required_permission' => 'users.view',
            ],
            [
                'key' => 'roles',
                'label' => 'Roles',
                'icon' => 'Shield',
                'href' => '/dashboard/roles',
                'required_permission' => 'roles.view',
            ],
        ];
    }
}
