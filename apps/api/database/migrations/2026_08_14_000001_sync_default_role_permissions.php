<?php

use App\Support\DefaultRolePermissions;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Backfill existing tenants with the full default role->permission
     * catalog. Tenants provisioned before the media/news/seo/etc.
     * permissions existed only received a sparse subset, which broke
     * authorization (e.g. 403 "This action is unauthorized" on media).
     */
    public function up(): void
    {
        DefaultRolePermissions::syncAllTenants();
    }

    public function down(): void
    {
        // Intentionally a no-op: role/permission sync is not reversible.
    }
};
