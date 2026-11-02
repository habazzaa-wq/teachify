<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tenant_users', function (Blueprint $table): void {
            $table->string('first_name', 100)->nullable();
            $table->string('last_name', 100)->nullable();
            $table->text('bio')->nullable();
            $table->string('expertise', 255)->nullable();
            $table->unsignedTinyInteger('experience_years')->nullable();
            $table->string('website_url', 2048)->nullable();
            $table->string('linkedin_url', 2048)->nullable();
            $table->string('youtube_url', 2048)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('tenant_users', function (Blueprint $table): void {
            $table->dropColumn([
                'first_name',
                'last_name',
                'bio',
                'expertise',
                'experience_years',
                'website_url',
                'linkedin_url',
                'youtube_url',
            ]);
        });
    }
};
