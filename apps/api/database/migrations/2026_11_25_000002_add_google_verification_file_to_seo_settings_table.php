<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tenants can verify their own domain in Google Search Console using the
     * HTML-file method. Only the Google-generated file name is stored; the
     * verification body is derived from it when the public route is requested.
     */
    public function up(): void
    {
        Schema::table('seo_settings', function (Blueprint $table) {
            if (! Schema::hasColumn('seo_settings', 'google_verification_file')) {
                $table->string('google_verification_file')->nullable()->after('google_verification');
            }
        });
    }

    public function down(): void
    {
        Schema::table('seo_settings', function (Blueprint $table) {
            if (Schema::hasColumn('seo_settings', 'google_verification_file')) {
                $table->dropColumn('google_verification_file');
            }
        });
    }
};
