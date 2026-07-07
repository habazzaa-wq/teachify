<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media_asset_captions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('media_asset_id')->constrained()->cascadeOnDelete();
            $table->string('language', 16);
            $table->string('label')->nullable();
            $table->string('format')->index();
            $table->string('storage_key')->nullable();
            $table->string('status')->default('pending')->index();
            $table->boolean('is_default')->default(false);
            $table->jsonb('metadata');
            $table->timestamps();

            $table->index(['tenant_id', 'media_asset_id', 'language']);
            $table->foreign(['media_asset_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('media_assets')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_asset_captions');
    }
};
