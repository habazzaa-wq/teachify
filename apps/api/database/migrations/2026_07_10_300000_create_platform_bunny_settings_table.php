<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_bunny_settings', function (Blueprint $table) {
            $table->id();
            $table->string('storage_zone_name')->nullable();
            $table->text('storage_zone_password')->nullable();
            $table->string('storage_zone_region')->default('de');
            $table->string('cdn_hostname')->nullable();
            $table->string('library_id')->nullable();
            $table->text('api_key')->nullable();
            $table->text('stream_api_key')->nullable();
            $table->text('signed_url_secret')->nullable();
            $table->boolean('enabled')->default(false)->index();
            $table->string('default_privacy')->default('private');
            $table->integer('default_expiration_days')->nullable();
            $table->unsignedBigInteger('max_upload_size')->nullable();
            $table->unsignedInteger('chunk_size')->nullable();
            $table->boolean('enable_stream')->default(false);
            $table->boolean('enable_cdn')->default(false);
            $table->boolean('enable_signed_urls')->default(false);
            $table->boolean('enable_transcoding')->default(false);
            $table->boolean('enable_resumable_upload')->default(false);
            $table->boolean('enable_duplicate_detection')->default(false);
            $table->boolean('enable_checksum_validation')->default(false);
            $table->unsignedInteger('default_thumbnail_time')->default(0);
            $table->string('connection_status')->default('disconnected')->index();
            $table->text('last_error')->nullable();
            $table->timestamp('last_verified_at')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_bunny_settings');
    }
};
