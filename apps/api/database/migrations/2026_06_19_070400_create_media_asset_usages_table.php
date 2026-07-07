<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media_asset_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('media_asset_id')->constrained()->cascadeOnDelete();
            $table->string('usable_type');
            $table->unsignedBigInteger('usable_id');
            $table->string('purpose')->index();
            $table->unsignedInteger('sort_order')->default(0);
            $table->jsonb('metadata');
            $table->timestamps();

            $table->unique(['tenant_id', 'media_asset_id', 'usable_type', 'usable_id', 'purpose'], 'media_usage_unique');
            $table->index(['tenant_id', 'usable_type', 'usable_id']);
            $table->foreign(['media_asset_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('media_assets')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_asset_usages');
    }
};
