<?php

namespace App\Services\Media;

use App\Models\Tenant;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class StoragePathGenerator
{
    private const ROOTS = [
        'assets',
        'courses',
        'lessons',
        'branding',
        'imports',
        'exports',
    ];

    public function generate(Tenant $tenant, string $root, string $filename): string
    {
        if (! in_array($root, self::ROOTS, true)) {
            throw ValidationException::withMessages([
                'storage_root' => ['The selected storage root is invalid.'],
            ]);
        }

        $extension = pathinfo($filename, PATHINFO_EXTENSION);
        $baseName = pathinfo($filename, PATHINFO_FILENAME);
        $safeBaseName = Str::slug($baseName) ?: 'file';
        $suffix = Str::lower(Str::random(12));
        $safeFilename = $safeBaseName.'-'.$suffix.($extension ? '.'.Str::lower($extension) : '');

        return "tenants/{$tenant->id}/{$root}/{$safeFilename}";
    }

    /**
     * @return list<string>
     */
    public function roots(): array
    {
        return self::ROOTS;
    }
}
