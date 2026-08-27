<?php

namespace App\Services\Bunny;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class BunnyCacheService
{
    private const PREFIX = 'bunny:';

    private const TRACKED_PREFIX = 'bunny:tracked:';

    private const TTL_SHORT = 60;

    private const TTL_MEDIUM = 300;

    private const TTL_LONG = 3600;

    private const TTL_STORAGE = 900;

    private const TTL_USAGE = 300;

    private const TTL_VIDEO = 600;

    private const TTL_FOLDER = 300;

    private const TRACK_TTL = 86400;

    /**
     * @param callable $callback
     * @return mixed
     */
    public function remember(string $key, int $ttl, callable $callback)
    {
        $cacheKey = self::PREFIX . $key;

        return Cache::remember($cacheKey, $ttl, function () use ($callback, $key) {
            Log::channel('bunny')->debug('Bunny cache miss', ['key' => $key]);

            return $callback();
        });
    }

    public function get(string $key): mixed
    {
        return Cache::get(self::PREFIX . $key);
    }

    public function put(string $key, mixed $value, int $ttl = self::TTL_MEDIUM): bool
    {
        $cacheKey = self::PREFIX . $key;
        $this->trackKey($key);

        return Cache::put($cacheKey, $value, $ttl);
    }

    public function forget(string $key): bool
    {
        return Cache::forget(self::PREFIX . $key);
    }

    public function cacheStorage(string $path, callable $callback): mixed
    {
        return $this->remember("storage:{$path}", self::TTL_STORAGE, $callback);
    }

    public function cacheVideoMetadata(string $videoId, callable $callback): mixed
    {
        return $this->remember("video:{$videoId}", self::TTL_VIDEO, $callback);
    }

    public function cacheFolderMetadata(string $path, callable $callback): mixed
    {
        return $this->remember("folder:{$path}", self::TTL_FOLDER, $callback);
    }

    public function cacheUsage(string $type, callable $callback): mixed
    {
        return $this->remember("usage:{$type}", self::TTL_USAGE, $callback);
    }

    public function cacheViews(string $key, callable $callback): mixed
    {
        return $this->remember("views:{$key}", self::TTL_USAGE, $callback);
    }

    public function cacheBandwidth(string $key, callable $callback): mixed
    {
        return $this->remember("bandwidth:{$key}", self::TTL_USAGE, $callback);
    }

    public function invalidateStorage(?string $path = null): void
    {
        if ($path !== null) {
            $this->forget("storage:{$path}");
            $this->invalidateParentFolders($path);
        } else {
            $this->invalidateByPrefix('storage:');
        }

        $this->invalidateByPrefix('usage:');
    }

    public function invalidateVideo(string $videoId): void
    {
        $this->forget("video:{$videoId}");
        $this->forget("video:status:{$videoId}");
        $this->invalidateByPrefix("video:{$videoId}:");
        $this->invalidateByPrefix("video:status:{$videoId}:");
        $this->invalidateByPrefix('usage:');
    }

    public function invalidateFolder(?string $path = null): void
    {
        if ($path !== null) {
            $this->forget("folder:{$path}");
            $this->invalidateParentFolders($path);
        } else {
            $this->invalidateByPrefix('folder:');
        }
    }

    public function invalidateUsage(): void
    {
        $this->invalidateByPrefix('usage:');
        $this->invalidateByPrefix('views:');
        $this->invalidateByPrefix('bandwidth:');
    }

    public function invalidateAll(): void
    {
        $this->invalidateByPrefix('');
    }

    private function invalidateByPrefix(string $prefix): void
    {
        $trackedKeys = Cache::get(self::TRACKED_PREFIX.'keys', []) ?? [];

        $matched = array_filter($trackedKeys, fn (string $key) => str_starts_with($key, $prefix));

        foreach ($matched as $key) {
            Cache::forget(self::PREFIX . $key);
        }

        $remaining = array_diff($trackedKeys, $matched);
        Cache::put(self::TRACKED_PREFIX.'keys', array_values($remaining), self::TRACK_TTL);
    }

    private function trackKey(string $key): void
    {
        $trackedKeys = Cache::get(self::TRACKED_PREFIX.'keys', []) ?? [];

        if (! in_array($key, $trackedKeys, true)) {
            $trackedKeys[] = $key;

            if (count($trackedKeys) > 1000) {
                $trackedKeys = array_slice($trackedKeys, -500);
            }

            Cache::put(self::TRACKED_PREFIX.'keys', $trackedKeys, self::TRACK_TTL);
        }
    }

    private function invalidateParentFolders(string $path): void
    {
        $parts = explode('/', trim($path, '/'));
        array_pop($parts);

        while ($parts !== []) {
            $folderPath = implode('/', $parts);
            $this->forget("folder:{$folderPath}");
            array_pop($parts);
        }
    }
}
