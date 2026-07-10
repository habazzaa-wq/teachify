<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('media_assets', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('original_filename');
            $table->string('language')->nullable()->after('description');
            $table->string('poster_url')->nullable()->after('preview_url');
            $table->string('transcoding_status')->nullable()->after('processing_status');
            $table->unsignedTinyInteger('processing_progress')->default(0)->after('transcoding_status');
        });
    }

    public function down(): void
    {
        Schema::table('media_assets', function (Blueprint $table) {
            $table->dropColumn([
                'slug',
                'language',
                'poster_url',
                'transcoding_status',
                'processing_progress',
            ]);
        });
    }
};
