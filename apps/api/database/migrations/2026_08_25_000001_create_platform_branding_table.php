<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Platform branding (the "platform colors" field) is GLOBAL to the whole
     * platform, not per-tenant. The logged-out public site resolves a tenant by
     * domain (tenant_domains) which is frequently a different tenant than the
     * one a teacher manages, so per-tenant storage could never show the same
     * colors to anonymous visitors. A single global row fixes that.
     */
    public function up(): void
    {
        Schema::create('platform_branding', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('logo')->nullable();
            $table->string('favicon')->nullable();
            $table->string('primary_color')->nullable();
            $table->string('secondary_color')->nullable();
            $table->string('accent_color')->nullable();
            $table->string('font')->nullable();
            $table->string('logo_type')->nullable();
            $table->string('logo_icon')->nullable();
            $table->string('logo_image')->nullable();
            $table->string('dark_logo')->nullable();
            $table->string('light_logo')->nullable();
            $table->timestamps();
        });

        // Seed the single global row (id = 1) so readers always find one.
        DB::table('platform_branding')->insert([
            'id' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_branding');
    }
};
