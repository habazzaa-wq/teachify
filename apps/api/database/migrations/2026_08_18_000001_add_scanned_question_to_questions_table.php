<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

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

        $compositeIndexExists = collect(Schema::getIndexes('questions'))
            ->contains(fn (array $index) => $index['name'] === 'questions_tenant_id_question_format_index');
        if (! $compositeIndexExists) {
            Schema::table('questions', function (Blueprint $table) {
                $table->index(['tenant_id', 'question_format']);
            });
        }

        $fkExists = collect(Schema::getForeignKeys('questions'))
            ->contains(fn (array $foreignKey) => in_array('media_asset_id', $foreignKey['columns'], true)
                && ($foreignKey['references_table'] ?? $foreignKey['on'] ?? null) === 'media_assets');
        if (! $fkExists) {
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
