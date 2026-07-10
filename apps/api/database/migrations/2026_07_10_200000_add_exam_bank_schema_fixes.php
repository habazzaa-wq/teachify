<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            $table->json('metadata')->nullable();
            $table->index('deleted_at');
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->foreign('category_id')->references('id')->on('question_categories')->nullOnDelete();
            $table->foreign('bank_id')->references('id')->on('question_banks')->nullOnDelete();
            $table->index('deleted_at');
        });

        Schema::table('question_banks', function (Blueprint $table) {
            $table->foreign('category_id')->references('id')->on('question_categories')->nullOnDelete();
            $table->index('deleted_at');
        });

        Schema::table('question_categories', function (Blueprint $table) {
            $table->foreign('parent_id')->references('id')->on('question_categories')->nullOnDelete();
            $table->index('deleted_at');
        });

        Schema::table('exam_attempts', function (Blueprint $table) {
            $table->foreign('exam_id')->references('id')->on('exams')->cascadeOnDelete();
            $table->index('deleted_at');
        });
    }

    public function down(): void
    {
        Schema::table('exam_attempts', function (Blueprint $table) {
            $table->dropForeign(['exam_id']);
            $table->dropIndex(['deleted_at']);
        });

        Schema::table('question_categories', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropIndex(['deleted_at']);
        });

        Schema::table('question_banks', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropIndex(['deleted_at']);
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropForeign(['bank_id']);
            $table->dropIndex(['deleted_at']);
        });

        Schema::table('exams', function (Blueprint $table) {
            $table->dropColumn('metadata');
            $table->dropIndex(['deleted_at']);
        });
    }
};
