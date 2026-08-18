<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->string('question_format')->default('text')->index()->after('visibility');
            $table->unsignedBigInteger('media_asset_id')->nullable()->after('question_format');

            $table->index(['tenant_id', 'question_format']);
            $table->foreign('media_asset_id')->references('id')->on('media_assets')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropForeign(['media_asset_id']);
            $table->dropIndex(['tenant_id', 'question_format']);
            $table->dropColumn(['question_format', 'media_asset_id']);
        });
    }
};
