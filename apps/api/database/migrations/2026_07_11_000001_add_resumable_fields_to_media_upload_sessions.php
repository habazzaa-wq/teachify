<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('media_upload_sessions', function (Blueprint $table) {
            // Stable, tenant-scoped correlation id supplied by the client engine.
            $table->string('upload_id')->nullable()->after('media_asset_id');
            // Human-readable / verifiable metadata about the source file.
            $table->string('file_name')->nullable()->after('upload_id');
            $table->string('mime_type')->nullable()->after('file_name');
            $table->unsignedBigInteger('size')->default(0)->after('mime_type');
            // Bunny storage zone (storage service) or stream library id (stream service).
            $table->string('storage_zone')->nullable()->after('size');
            // Resumable pipeline bookkeeping.
            $table->unsignedInteger('total_chunks')->default(0)->after('storage_zone');
            $table->json('uploaded_chunks')->nullable()->after('total_chunks');
            $table->boolean('completed')->default(false)->after('uploaded_chunks');
            $table->string('final_file_hash')->nullable()->after('completed');
        });
    }

    public function down(): void
    {
        Schema::table('media_upload_sessions', function (Blueprint $table) {
            $table->dropColumn([
                'upload_id',
                'file_name',
                'mime_type',
                'size',
                'storage_zone',
                'total_chunks',
                'uploaded_chunks',
                'completed',
                'final_file_hash',
            ]);
        });
    }
};
