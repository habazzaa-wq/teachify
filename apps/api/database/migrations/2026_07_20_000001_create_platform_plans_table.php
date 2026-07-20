<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('badge')->nullable();
            $table->decimal('monthly_price', 10, 2)->default(0);
            $table->decimal('yearly_price', 10, 2)->default(0);
            $table->string('currency', 10)->default('SAR');
            $table->unsignedInteger('display_order')->default(0);
            $table->boolean('trial_enabled')->default(false);
            $table->unsignedInteger('trial_days')->default(0);
            $table->boolean('recommended')->default(false);
            $table->boolean('visible')->default(true);
            $table->string('status')->default('draft')->index();
            $table->json('limits')->nullable();
            $table->json('features')->nullable();
            $table->json('video_storage')->nullable();
            $table->json('branding')->nullable();
            $table->json('integrations')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_plans');
    }
};
