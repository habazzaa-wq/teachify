<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The canonical plan assignment: `platform_plans` is the plan catalogue and
     * `tenants.platform_plan_id` is the tenant's assigned plan. Left nullable so
     * existing tenants keep running on the legacy default-limit fallback until
     * they are explicitly assigned a plan.
     *
     * The foreign key is RESTRICT on purpose: deleting a plan that is still
     * assigned to a tenant must be blocked, never cascade into deleting tenants.
     */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->foreignId('platform_plan_id')
                ->nullable()
                ->after('plan')
                ->index()
                ->constrained('platform_plans')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropForeign(['platform_plan_id']);
            $table->dropColumn('platform_plan_id');
        });
    }
};
