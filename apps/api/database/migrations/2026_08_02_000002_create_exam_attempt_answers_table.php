<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_attempt_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exam_attempt_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exam_question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->json('answer')->nullable();
            $table->boolean('is_correct')->nullable();
            $table->unsignedSmallInteger('earned_points')->default(0);
            $table->timestamp('answered_at')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'exam_attempt_id', 'exam_question_id'], 'exam_attempt_answers_unique');
            $table->index(['tenant_id', 'exam_attempt_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_attempt_answers');
    }
};
