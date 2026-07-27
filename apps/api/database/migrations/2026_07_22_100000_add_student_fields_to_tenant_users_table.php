<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_users', function (Blueprint $table) {
            $table->string('parent_phone', 50)->nullable()->after('phone');
            $table->string('nationality', 100)->nullable()->after('parent_phone');
            $table->string('study_level', 100)->nullable()->after('nationality');
            $table->string('governorate', 100)->nullable()->after('study_level');
            $table->string('city', 100)->nullable()->after('governorate');
        });
    }

    public function down(): void
    {
        Schema::table('tenant_users', function (Blueprint $table) {
            $table->dropColumn([
                'parent_phone',
                'nationality',
                'study_level',
                'governorate',
                'city',
            ]);
        });
    }
};
