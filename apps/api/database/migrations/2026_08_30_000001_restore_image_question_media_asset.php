<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Safety migration: the original 2026_08_22_000003 migration dropped the
 * `media_asset_id` column from `questions` (it retired the image-question
 * format in favour of OCR/Vision extraction). That decision was reversed, so
 * this re-adds the column + FK on any install where the column is missing.
 *
 * It only restores the schema reference; it cannot re-link assets that were
 * already detached, but it guarantees the canonical image-question path works.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('questions', 'media_asset_id')) {
            return;
        }

        Schema::table('questions', function (Blueprint $table): void {
            $table->unsignedBigInteger('media_asset_id')->nullable()->after('question_format');

            $table->foreign('media_asset_id')
                ->references('id')
                ->on('media_assets')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('questions', 'media_asset_id')) {
            return;
        }

        Schema::table('questions', function (Blueprint $table): void {
            $table->dropForeign(['media_asset_id']);
            $table->dropColumn('media_asset_id');
        });
    }
};
