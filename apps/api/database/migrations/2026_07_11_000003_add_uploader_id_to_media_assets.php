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
            $table->string('bunny_video_id')->nullable()->after('external_id');
            $table->string('bunny_storage_path')->nullable()->after('bunny_video_id');
            $table->string('original_name')->nullable()->after('original_filename');
            $table->unsignedBigInteger('size')->nullable()->after('size_bytes');
            $table->unsignedInteger('duration')->nullable()->after('height');
        });
    }

    public function down(): void
    {
        Schema::table('media_assets', function (Blueprint $table) {
            $table->dropForeign(['uploader_id']);
            $table->dropColumn([
                'uploader_id', 'bunny_video_id', 'bunny_storage_path',
                'original_name', 'size', 'duration',
            ]);
        });
    }
};
