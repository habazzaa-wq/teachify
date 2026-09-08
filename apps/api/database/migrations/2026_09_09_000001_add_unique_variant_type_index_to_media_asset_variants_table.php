<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Enforce at the database level that one asset has at most one variant per
     * type. The Phase F idempotency guard in AnswerPageVariantService was
     * code-level only; under concurrent queue workers a lost race could have
     * produced duplicate (tenant_id, media_asset_id, type) rows.
     *
     * The existing plain composite index on those columns
     * (create_media_asset_variants:27) is intentionally left in place: on MySQL
     * it is the index backing the tenant_id foreign key (tenant_id is its
     * leading column), and dropping it raises error 1553 unless that FK is
     * dropped and re-added too. Keeping the redundant plain index is the
     * portable alternative to FK surgery; the UNIQUE index below enforces the
     * constraint and serves the same lookups.
     */
    public function up(): void
    {
        Schema::table('media_asset_variants', function (Blueprint $table) {
            $table->unique(['tenant_id', 'media_asset_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::table('media_asset_variants', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'media_asset_id', 'type']);
        });
    }
};
