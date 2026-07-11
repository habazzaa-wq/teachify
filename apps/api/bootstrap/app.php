<?php

use App\Providers\AuthServiceProvider;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withProviders([
        AuthServiceProvider::class,
    ])
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withCommands([
        __DIR__.'/../app/Console/Commands',
    ])
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        $middleware->validateCsrfTokens(except: [
            'api/platform/*',
            'api/v1/tenant/auth/login',
            'api/v1/tenant/auth/forgot-password',
            'api/v1/tenant/auth/reset-password',
        ]);
        $middleware->throttleApi();
        $middleware->api(prepend: [
            \App\Http\Middleware\IdentifyTenant::class,
        ]);
        $middleware->alias([
            'tenant.membership' => \App\Http\Middleware\EnsureActiveTenantMembership::class,
            'platform.admin' => \App\Http\Middleware\EnsurePlatformSuperAdmin::class,
            'platform.token' => \App\Http\Middleware\EnsurePlatformToken::class,
            'permission' => \App\Http\Middleware\PermissionMiddleware::class,
            'any-permission' => \App\Http\Middleware\AnyPermissionMiddleware::class,
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'any-role' => \App\Http\Middleware\AnyRoleMiddleware::class,
            'upload.quota' => \App\Http\Middleware\UploadQuotaMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
