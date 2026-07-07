<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('media_assets', function (Blueprint $table) {
            $table->foreignId('folder_id')->nullable()->constrained('media_folders')->nullOnDelete();
            $table->string('source')->nullable()->after('type');
            $table->string('title')->nullable()->after('original_filename');
            $table->text('description')->nullable()->after('title');
            $table->jsonb('tags')->nullable()->after('description');
            $table->string('extension')->nullable()->after('mime_type');
            $table->unsignedInteger('width')->nullable()->after('size_bytes');
            $table->unsignedInteger('height')->nullable()->after('width');
            $table->string('processing_status')->default('pending')->after('visibility');
            $table->string('bunny_library_id')->nullable()->after('external_id');
            $table->string('bunny_stream_url')->nullable()->after('bunny_library_id');
            $table->string('cdn_url')->nullable()->after('bunny_stream_url');
            $table->string('thumbnail_url')->nullable()->after('cdn_url');
            $table->string('preview_url')->nullable()->after('thumbnail_url');
            $table->timestamp('favorite_at')->nullable()->after('updated_at');
            $table->timestamp('archived_at')->nullable()->after('favorite_at');
            $table->softDeletes();

            $table->index(['tenant_id', 'folder_id']);
            $table->index(['tenant_id', 'processing_status']);
            $table->index(['tenant_id', 'favorite_at']);
            $table->index(['tenant_id', 'archived_at']);
        });
    }

    public function down(): void
    {
        Schema::table('media_assets', function (Blueprint $table) {
            $table->dropForeign(['folder_id']);
            $table->dropColumn([
                'folder_id', 'source', 'title', 'description', 'tags',
                'extension', 'width', 'height', 'processing_status',
                'bunny_library_id', 'bunny_stream_url', 'cdn_url',
                'thumbnail_url', 'preview_url', 'favorite_at', 'archived_at',
                'deleted_at',
            ]);
        });
    }
};
