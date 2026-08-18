<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            if (!Schema::hasColumn('questions', 'question_format')) {
                $table->string('question_format')->default('text')->after('visibility');
            }
            if (!Schema::hasColumn('questions', 'media_asset_id')) {
                $table->unsignedBigInteger('media_asset_id')->nullable()->after('question_format');
            }
        });

        $compositeIndexExists = DB::select(
            'SHOW INDEX FROM questions WHERE Key_name = ?',
            ['questions_tenant_id_question_format_index']
        );
        if (empty($compositeIndexExists)) {
            Schema::table('questions', function (Blueprint $table) {
                $table->index(['tenant_id', 'question_format']);
            });
        }

        $fkExists = DB::select(
            'SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = ? AND COLUMN_NAME = ? AND REFERENCED_TABLE_NAME = ?',
            ['questions', 'media_asset_id', 'media_assets']
        );
        if (empty($fkExists)) {
            Schema::table('questions', function (Blueprint $table) {
                $table->foreign('media_asset_id')->references('id')->on('media_assets')->nullOnDelete();
            });
        }
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
