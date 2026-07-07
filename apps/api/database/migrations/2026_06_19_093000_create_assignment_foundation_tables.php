<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_section_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_lesson_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->text('instructions')->nullable();
            $table->unsignedSmallInteger('max_score')->default(100);
            $table->timestamp('due_at')->nullable();
            $table->boolean('allow_late_submission')->default(false);
            $table->string('status')->default('draft')->index();
            $table->timestamps();

            $table->unique(['tenant_id', 'course_lesson_id']);
            $table->unique(['id', 'tenant_id']);
            $table->foreign(['course_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('courses')
                ->cascadeOnDelete();
            $table->foreign(['course_section_id', 'course_id', 'tenant_id'])
                ->references(['id', 'course_id', 'tenant_id'])
                ->on('course_sections')
                ->cascadeOnDelete();
            $table->foreign(['course_lesson_id', 'course_section_id', 'course_id', 'tenant_id'], 'assignments_lesson_hierarchy_fk')
                ->references(['id', 'course_section_id', 'course_id', 'tenant_id'])
                ->on('course_lessons')
                ->cascadeOnDelete();
        });

        Schema::create('assignment_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assignment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->string('status')->default('draft')->index();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['id', 'tenant_id']);
            $table->unique(['tenant_id', 'assignment_id', 'tenant_user_id'], 'assignment_submissions_student_unique');
            $table->foreign(['assignment_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('assignments')
                ->cascadeOnDelete();
            $table->foreign(['tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
        });

        Schema::create('assignment_submission_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assignment_submission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('media_asset_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['tenant_id', 'assignment_submission_id', 'media_asset_id'], 'assignment_submission_files_unique');
            $table->foreign(['assignment_submission_id', 'tenant_id'], 'asf_submission_fk')
                ->references(['id', 'tenant_id'])
                ->on('assignment_submissions')
                ->cascadeOnDelete();
            $table->foreign(['media_asset_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('media_assets')
                ->cascadeOnDelete();
        });

        Schema::create('assignment_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assignment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_user_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('score');
            $table->boolean('passed')->default(false);
            $table->text('feedback')->nullable();
            $table->foreignId('graded_by_tenant_user_id')->nullable()->constrained('tenant_users')->nullOnDelete();
            $table->timestamp('graded_at');
            $table->timestamps();

            $table->unique(['tenant_id', 'assignment_id', 'tenant_user_id'], 'assignment_results_student_unique');
            $table->foreign(['assignment_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('assignments')
                ->cascadeOnDelete();
            $table->foreign(['tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignment_results');
        Schema::dropIfExists('assignment_submission_files');
        Schema::dropIfExists('assignment_submissions');
        Schema::dropIfExists('assignments');
    }
};
