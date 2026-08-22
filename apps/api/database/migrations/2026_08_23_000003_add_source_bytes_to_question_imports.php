<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('question_imports', function (Blueprint $table) {
            // Raw source image bytes (base64) live on the row so the queued
            // extraction worker can always read them, regardless of which
            // filesystem/process handled the upload.
            $table->longText('source_bytes')->nullable()->after('source');
        });
    }

    public function down(): void
    {
        Schema::table('question_imports', function (Blueprint $table) {
            $table->dropColumn('source_bytes');
        });
    }
};
