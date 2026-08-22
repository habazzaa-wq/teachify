<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            if (! Schema::hasColumn('questions', 'content_document')) {
                // Structured (imported/reconstructed) question document.
                // Versioned JSON block list, independent of the answer payload
                // stored in `content`. Null for plain text questions and for
                // legacy image-format rows.
                $table->json('content_document')->nullable()->after('content');
            }
        });
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            if (Schema::hasColumn('questions', 'content_document')) {
                $table->dropColumn('content_document');
            }
        });
    }
};
