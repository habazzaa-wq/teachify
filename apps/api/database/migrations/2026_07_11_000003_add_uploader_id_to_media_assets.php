<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('media_assets', function (Blueprint $table) {
            $table->foreignId('uploader_id')
                ->nullable()
                ->after('tenant_id')
                ->constrained('tenant_users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('media_assets', function (Blueprint $table) {
            $table->dropForeign(['uploader_id']);
            $table->dropColumn('uploader_id');
        });
    }
};
