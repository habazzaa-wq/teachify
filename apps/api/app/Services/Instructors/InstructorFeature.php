<?php

namespace App\Services\Instructors;

use App\Models\Tenant;

class InstructorFeature
{
    public function isEnabled(Tenant $tenant): bool
    {
        return (bool) ($tenant->feature_flags['has_instructors'] ?? false);
    }

    public function ensureEnabled(Tenant $tenant): void
    {
        abort_unless($this->isEnabled($tenant), 404, 'Instructor feature is not enabled for this tenant.');
    }
}
