<?php

use App\Support\DefaultRolePermissions;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Re-run the default role->permission catalog sync. The earlier
     * 2026_08_14_000001 sync ran before recharge-codes.manage and
     * payment-gateway.manage were added to the catalog, which stripped
     * them from tenant_owner/admin roles and broke wallet recharge-code
     * generation with "This action is unauthorized." Idempotent.
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
