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

    public function put(string $path, $contents): bool
    {
        return Storage::disk($this->diskName())->put($path, $contents);
    }

    public function url(string $path): string
    {
        return Storage::disk($this->diskName())->url($path);
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
