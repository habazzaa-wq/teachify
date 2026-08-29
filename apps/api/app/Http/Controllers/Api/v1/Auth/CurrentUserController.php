<?php

namespace App\Http\Controllers\Api\v1\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CurrentUserController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenant = \currentTenant();
        $membership = app('currentTenantMembership')->load('roles.permissions');
        $roles = $membership->roles;
        $permissions = $roles
            ->flatMap(fn ($role) => $role->permissions)
            ->unique('id')
            ->values();

        return response()->json([
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
                'can_access_dashboard' => true,
                'can_manage_courses' => $permissions->contains(fn ($p) => in_array($p->slug, ['courses.create', 'courses.update', 'courses.delete'])),
                'can_manage_users' => $permissions->contains(fn ($p) => in_array($p->slug, ['users.create', 'users.update', 'users.delete'])),
                'can_manage_settings' => $permissions->contains(fn ($p) => str_starts_with($p->slug, 'settings.')),
            ],
            'navigation' => $this->getNavigation($roles, $permissions),
        ])->header('Cache-Control', 'no-store, no-cache, must-revalidate');
    }

    private function getBranding(\App\Models\Tenant $tenant): array
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
     * Platform-level brand colors (the "platform colors" field). Distinct from
     * `getBranding` (tenant appearance settings) which only apply to the teacher
     * dashboard and login.
     *
     * @return array<string, mixed>
     */
    private function getPlatformBranding(\App\Models\Tenant $tenant): array
    {
        return (new \App\Services\Platform\PlatformBrandingService())->resolve();
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
