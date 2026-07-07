<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_section_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_lesson_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedTinyInteger('passing_score')->default(70);
            $table->unsignedSmallInteger('max_attempts')->default(1);
            $table->unsignedSmallInteger('time_limit_minutes')->nullable();
            $table->boolean('shuffle_questions')->default(false);
            $table->boolean('shuffle_answers')->default(false);
            $table->boolean('show_correct_answers')->default(false);
            $table->string('status')->default('draft')->index();
            $table->timestamps();

            $table->unique(['tenant_id', 'course_lesson_id']);
            $table->unique(['id', 'tenant_id']);
            $table->unique(['id', 'course_id', 'tenant_id']);
            $table->foreign(['course_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('courses')
                ->cascadeOnDelete();
            $table->foreign(['course_section_id', 'course_id', 'tenant_id'])
                ->references(['id', 'course_id', 'tenant_id'])
                ->on('course_sections')
                ->cascadeOnDelete();
            $table->foreign(['course_lesson_id', 'course_section_id', 'course_id', 'tenant_id'], 'quizzes_lesson_hierarchy_fk')
                ->references(['id', 'course_section_id', 'course_id', 'tenant_id'])
                ->on('course_lessons')
                ->cascadeOnDelete();
        });

        Schema::create('quiz_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quiz_id')->constrained()->cascadeOnDelete();
            $table->string('type')->index();
            $table->text('question_text');
            $table->unsignedSmallInteger('points')->default(1);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['id', 'tenant_id']);
            $table->unique(['id', 'quiz_id', 'tenant_id']);
            $table->index(['tenant_id', 'quiz_id', 'sort_order']);
            $table->foreign(['quiz_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('quizzes')
                ->cascadeOnDelete();
        });

        Schema::create('quiz_question_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quiz_question_id')->constrained()->cascadeOnDelete();
            $table->text('option_text');
            $table->boolean('is_correct')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['tenant_id', 'quiz_question_id', 'sort_order'], 'quiz_options_scope_order_index');
            $table->foreign(['quiz_question_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('quiz_questions')
                ->cascadeOnDelete();
        });

        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quiz_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('started_at');
            $table->timestamp('submitted_at')->nullable();
            $table->string('status')->default('in_progress')->index();
            $table->unsignedTinyInteger('score')->nullable();
            $table->timestamps();

            $table->unique(['id', 'tenant_id']);
            $table->unique(['id', 'quiz_id', 'tenant_id']);
            $table->index(['tenant_id', 'quiz_id', 'tenant_user_id'], 'quiz_attempts_student_index');
            $table->foreign(['quiz_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('quizzes')
                ->cascadeOnDelete();
            $table->foreign(['tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
        });

        Schema::create('quiz_attempt_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quiz_attempt_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quiz_question_id')->constrained()->cascadeOnDelete();
            $table->jsonb('selected_option_ids');
            $table->boolean('is_correct')->default(false);
            $table->unsignedSmallInteger('earned_points')->default(0);
            $table->timestamps();

            $table->unique(['tenant_id', 'quiz_attempt_id', 'quiz_question_id'], 'quiz_attempt_answers_unique');
            $table->foreign(['quiz_attempt_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('quiz_attempts')
                ->cascadeOnDelete();
            $table->foreign(['quiz_question_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('quiz_questions')
                ->cascadeOnDelete();
        });

        Schema::create('quiz_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quiz_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_user_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('best_score')->default(0);
            $table->boolean('passed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'quiz_id', 'tenant_user_id']);
            $table->foreign(['quiz_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('quizzes')
                ->cascadeOnDelete();
            $table->foreign(['tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_results');
        Schema::dropIfExists('quiz_attempt_answers');
        Schema::dropIfExists('quiz_attempts');
        Schema::dropIfExists('quiz_question_options');
        Schema::dropIfExists('quiz_questions');
        Schema::dropIfExists('quizzes');
    }
};
