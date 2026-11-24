<?php

namespace App\Services\Media;

use Illuminate\Support\Facades\Storage;

/**
 * Resolves the configured disk for permanent user assets and centralises
 * put / url / delete so the storage backend is swappable for multi-node
 * deployments without touching every controller.
 *
 * Defaults to "public" to preserve the current single-server behaviour.
 * Operators set MEDIA_STORAGE_DISK to a shared disk (e.g. "s3") so any web
 * node can write and serve the asset. Existing local assets continue to be
 * served through the "public" disk symlink; only new writes honour the
 * setting, keeping backward compatibility.
 */
class MediaStorage
{
    public function diskName(): string
    {
        return (string) config('media.storage_disk', 'public');
    }

    public function put(string $path, $contents, string $visibility = 'public'): bool
    {
        return Storage::disk($this->diskName())->put($path, $contents, [
            'visibility' => $visibility,
        ]);
    }

    /**
     * Write a large upload without loading it into PHP memory. The stream is
     * closed by Laravel; pass a fresh handle for a single write.
     */
    public function putStream(string $path, $resource, string $visibility = 'public'): bool
    {
        return Storage::disk($this->diskName())->writeStream($path, $resource, [
            'visibility' => $visibility,
        ]);
    }

    public function exists(string $path): bool
    {
        return Storage::disk($this->diskName())->exists($path);
    }

    public function size(string $path): int
    {
        return (int) Storage::disk($this->diskName())->size($path);
    }

    public function url(string $path): string
    {
        // Local files must be served through the same-origin media proxy.
        // Storage::disk('public')->url() would bake APP_URL (the platform host)
        // into the value, which breaks on tenant domains and when /storage is
        // not exposed by the reverse proxy.
        if ($this->diskName() === 'public') {
            return $this->proxyUrl($path);
        }

        return Storage::disk($this->diskName())->url($path);
    }

    /** Same-origin URL served by GET /api/v1/media/serve/{path}. */
    public function proxyUrl(string $path): string
    {
        return '/api/v1/media/serve/' . ltrim($path, '/');
    }

    public function delete(string $path): void
    {
        Storage::disk($this->diskName())->delete($path);

        // Legacy safety: assets written before a disk change still live on the
        // "public" disk. Remove them there too so they don't linger on the web
        // node. This is a no-op when the configured disk already is "public".
        if ($this->diskName() !== 'public') {
            Storage::disk('public')->delete($path);
        }
    }
}
