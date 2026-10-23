<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The base SEO migration already declares these columns, but databases
     * created before they were added to it are missing them. Adding them
     * idempotently keeps both fresh and existing installations in sync.
     */
    public function up(): void
    {
        if (! Schema::hasTable('seo_settings')) {
            return;
        }

        $hasGoogleVerification = Schema::hasColumn('seo_settings', 'google_verification');
        $hasBingVerification = Schema::hasColumn('seo_settings', 'bing_verification');

        if ($hasGoogleVerification && $hasBingVerification) {
            return;
        }

        Schema::table('seo_settings', function (Blueprint $table) use ($hasGoogleVerification, $hasBingVerification) {
            if (! $hasGoogleVerification) {
                $table->string('google_verification')->nullable();
            }

            if (! $hasBingVerification) {
                $table->string('bing_verification')->nullable();
            }
        });
    }

    public function down(): void
    {
        // No-op on purpose: these columns are part of the base schema on
        // fresh installs, so a rollback must not drop them.
    }
};
