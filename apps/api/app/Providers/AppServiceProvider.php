<?php

namespace App\Providers;

use App\Models\Category;
use App\Models\Course;
use App\Models\DiscussionPost;
use App\Models\DiscussionThread;
use App\Models\MediaAsset;
use App\Models\PlatformBunnySetting;
use App\Models\Tag;
use App\Policies\CategoryPolicy;
use App\Policies\CoursePolicy;
use App\Policies\DashboardPolicy;
use App\Policies\DiscussionPolicy;
use App\Policies\MediaLibraryPolicy;
use App\Policies\PermissionPolicy;
use App\Policies\PlatformBunnySettingPolicy;
use App\Policies\SettingsPolicy;
use App\Policies\StudentPolicy;
use App\Policies\TagPolicy;
use App\Repositories\PlatformBunnySettingRepository;
use App\Services\Audit\AuditLogService;
use App\Services\Media\MediaManager;
use App\Services\Media\Providers\BunnyStorageProvider;
use App\Services\Media\Providers\BunnyStreamProvider;
use App\Services\Platform\PlatformBunnySettingService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(MediaManager::class);
        $this->app->singleton(PlatformBunnySettingRepository::class);
        $this->app->singleton(PlatformBunnySettingService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        app(MediaManager::class)->register('bunny', app(BunnyStorageProvider::class));
        app(MediaManager::class)->registerService('bunny', 'storage', app(BunnyStorageProvider::class));
        app(MediaManager::class)->registerService('bunny', 'stream', app(BunnyStreamProvider::class));

        Gate::policy(Course::class, CoursePolicy::class);
        Gate::policy(Category::class, CategoryPolicy::class);
        Gate::policy(Tag::class, TagPolicy::class);
        Gate::policy(DiscussionThread::class, DiscussionPolicy::class);
        Gate::policy(DiscussionPost::class, DiscussionPolicy::class);
        Gate::policy(MediaAsset::class, MediaLibraryPolicy::class);
        Gate::policy(PlatformBunnySetting::class, PlatformBunnySettingPolicy::class);

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(300)->by($request->user()?->id ?: $request->ip());
        });
    }
}
