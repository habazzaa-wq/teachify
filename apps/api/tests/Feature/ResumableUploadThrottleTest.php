<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * P0.4 coverage: the resumable chunk endpoint must be rate limited through
 * its own generous bucket instead of being fully exempt from throttling.
 */
class ResumableUploadThrottleTest extends TestCase
{
    use RefreshDatabase;

    public function test_chunk_route_uses_dedicated_limiter(): void
    {
        $chunkRoute = collect(Route::getRoutes())->first(
            fn ($route): bool => str_contains($route->uri(), 'upload/resumable/{session}/chunk')
                && in_array('PUT', $route->methods(), true),
        );

        $this->assertNotNull($chunkRoute, 'Chunk route not found.');

        $middleware = $chunkRoute->gatherMiddleware();
        $this->assertContains('throttle:resumable-upload', $middleware);
    }

    public function test_limiter_allows_sustained_upload_burst_then_blocks(): void
    {
        $userId = User::factory()->create()->id;

        /** @var \Closure $factory */
        $factory = RateLimiter::limiter('resumable-upload');
        $this->assertNotNull($factory, 'resumable-upload limiter not registered.');

        $request = Request::create('/upload/resumable/s/chunk', 'PUT');
        $request->setUserResolver(fn () => User::query()->find($userId));

        /** @var Limit|list<Limit> $resolved */
        $resolved = $factory($request);
        $limits = is_array($resolved) ? $resolved : [$resolved];

        $this->assertCount(1, $limits);
        $this->assertSame(600, $limits[0]->maxAttempts);
        $this->assertSame('resumable:'.$userId, $limits[0]->key);

        // Exhaust the bucket: exactly maxAttempts attempts pass, then blocked.
        for ($i = 0; $i < 600; $i++) {
            $this->assertTrue(RateLimiter::attempt('resumable-upload', 600, fn () => true), "attempt {$i} should pass");
        }

        RateLimiter::attempt('resumable-upload', 600, fn () => true);

        $this->assertTrue(RateLimiter::tooManyAttempts('resumable-upload', 600));
    }

    public function test_different_users_have_independent_buckets(): void
    {
        User::factory()->count(2)->create();

        /** @var \Closure $factory */
        $factory = RateLimiter::limiter('resumable-upload');

        $keyFor = fn (int $id): string => $factory(
            tap(Request::create('/', 'PUT'), fn (Request $r) => $r->setUserResolver(fn () => User::query()->find($id))),
        )->key;

        $this->assertNotSame($keyFor(User::query()->min('id')), $keyFor(User::query()->max('id')));
    }
}
