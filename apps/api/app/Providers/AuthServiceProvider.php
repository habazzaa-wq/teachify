<?php

namespace App\Providers;

use App\Models\CourseSession;
use App\Models\Permission;
use App\Models\Role;
use App\Models\SessionAttendance;
use App\Models\TenantUser;
use App\Models\TenantWhatsAppIntegration;
use App\Policies\CourseSessionPolicy;
use App\Policies\RolePolicy;
use App\Policies\SessionAttendancePolicy;
use App\Policies\TenantUserPolicy;
use App\Policies\TenantWhatsAppIntegrationPolicy;
use App\Services\Authorization\AuthorizationService;
use App\Services\Authorization\PlatformAuthorizationService;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Role::class => RolePolicy::class,
        TenantUser::class => TenantUserPolicy::class,
        CourseSession::class => CourseSessionPolicy::class,
        SessionAttendance::class => SessionAttendancePolicy::class,
        TenantWhatsAppIntegration::class => TenantWhatsAppIntegrationPolicy::class,
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
        Gate::define('platform.settings.bunny', function ($user) {
            return app(PlatformAuthorizationService::class)->isPlatformSuperAdmin($user);
        });

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
