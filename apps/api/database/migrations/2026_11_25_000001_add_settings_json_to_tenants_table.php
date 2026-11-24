<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tenant-level integration settings (mail, Google auth, session reminders)
     * are stored under this JSON column. Several controllers already write it,
     * but the column was never added by a migration in this repository.
     */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (! Schema::hasColumn('tenants', 'settings_json')) {
                $table->json('settings_json')->nullable()->after('storage_json');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (Schema::hasColumn('tenants', 'settings_json')) {
                $table->dropColumn('settings_json');
            }
        });
    }
};
