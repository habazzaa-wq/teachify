<?php

namespace App\Providers;

use App\Models\Permission;
use App\Models\Role;
use App\Models\TenantUser;
use App\Policies\DashboardPolicy;
use App\Policies\PermissionPolicy;
use App\Policies\RolePolicy;
use App\Policies\SettingsPolicy;
use App\Policies\StudentPolicy;
use App\Policies\TenantUserPolicy;
use App\Services\Authorization\AuthorizationService;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Role::class => RolePolicy::class,
        TenantUser::class => TenantUserPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        $this->registerDynamicGates();

        Gate::define('permissions.manage', function ($user) {
            return app(AuthorizationService::class)->hasPermission($user, 'permissions.manage');
        });

        Gate::define('analytics.view', function ($user) {
            return app(AuthorizationService::class)->hasPermission($user, 'analytics.view');
        });
    }

    private function registerDynamicGates(): void
    {
        try {
            $permissions = Permission::query()->pluck('slug');

            foreach ($permissions as $slug) {
                Gate::define($slug, function ($user) use ($slug) {
                    return app(AuthorizationService::class)->hasPermission($user, $slug);
                });
            }
        } catch (\Throwable $e) {
            return;
        }
    }
}
