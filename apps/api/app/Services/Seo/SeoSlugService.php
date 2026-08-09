<?php

namespace App\Services\Seo;

use App\Models\SeoContent;
use Illuminate\Support\Str;

/**
 * Tenant-scoped slug generation for SEO content. Uniqueness is always
 * scoped by tenant_id — never globally across tenants.
 */
class SeoSlugService
{
    public function uniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title);
        $slug = $base !== '' ? $base : 'page';
        $candidate = $slug;
        $counter = 2;

        while ($this->exists($candidate, $ignoreId)) {
            $candidate = $slug . '-' . $counter;
            $counter++;
        }

        return $candidate;
    }

    /**
     * Ensure a user-provided slug is valid and unique within the tenant.
     * Returns the validated slug, or the generated fallback.
     */
    public function resolveSlug(string $title, ?string $requestedSlug, ?int $ignoreId = null): string
    {
        $requested = trim((string) $requestedSlug);
        if ($requested !== '') {
            $normalized = Str::slug($requested);
            if ($normalized !== '') {
                return $this->uniqueSlug($normalized, $ignoreId);
            }
        }

        return $this->uniqueSlug($title, $ignoreId);
    }

    private function exists(string $slug, ?int $ignoreId): bool
    {
        return SeoContent::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', currentTenant()->id)
            ->where('slug', $slug)
            ->when($ignoreId !== null, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();
    }
}
