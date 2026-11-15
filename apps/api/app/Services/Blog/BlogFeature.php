<?php

namespace App\Services\Blog;

use App\Models\Tenant;

class BlogFeature
{
    public function isEnabled(Tenant $tenant): bool
    {
        return (bool) ($tenant->feature_flags['has_blog'] ?? false);
    }

    public function ensureEnabled(Tenant $tenant): void
    {
        abort_unless($this->isEnabled($tenant), 404, 'Blog is not enabled for this tenant.');
    }
}
