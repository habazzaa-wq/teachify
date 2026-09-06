<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Make platform branding per-tenant instead of a single shared global row.
     *
     * Previously every tenant wrote/read the one global `platform_branding`
     * row (id = 1), so changing branding for one tenant silently overwrote it
     * for every other tenant. This migration:
     *  1. Adds a nullable `tenant_id` column.
     *  2. Copies the existing global row's values into every active tenant so
     *     no tenant's visible branding changes at deploy time.
     *  3. Adds a unique index on (tenant_id) so each tenant owns exactly one
     *     branding row.
     *
     * After this migration the original global row is deleted and `id` is left
     * unused — every subsequent read/write is scoped by `tenant_id`.
     */
    public function up(): void
    {
        Schema::table('platform_branding', function (Blueprint $table) {
            $table->unsignedBigInteger('tenant_id')->nullable()->after('id');
        });

        $row = DB::table('platform_branding')->where('id', 1)->first();

        if ($row) {
            $columns = [
                'name',
                'logo',
                'favicon',
                'primary_color',
                'secondary_color',
                'accent_color',
                'font',
                'logo_type',
                'logo_icon',
                'logo_image',
                'dark_logo',
                'light_logo',
            ];

            $tenantIds = \App\Models\Tenant::query()
                ->where('status', 'active')
                ->orderBy('id')
                ->pluck('id');

            foreach ($tenantIds as $tenantId) {
                $values = [];
                foreach ($columns as $column) {
                    $values[$column] = $row->{$column};
                }

                DB::table('platform_branding')->insert([
                    'tenant_id' => $tenantId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ] + $values);
            }

            // The shared global row no longer exists — branding is per-tenant.
            DB::table('platform_branding')->where('id', 1)->delete();
        }

        Schema::table('platform_branding', function (Blueprint $table) {
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->unique('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::table('platform_branding', function (Blueprint $table) {
            $table->dropUnique(['tenant_id']);
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });
    }
};