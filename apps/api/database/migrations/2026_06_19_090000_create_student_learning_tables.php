<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_user_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('active')->index();
            $table->timestamp('enrolled_at');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->unique(['id', 'tenant_id']);
            $table->unique(['id', 'course_id', 'tenant_id']);
            $table->index(['tenant_id', 'course_id', 'tenant_user_id'], 'course_enrollments_student_index');
            $table->foreign(['course_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('courses')
                ->cascadeOnDelete();
            $table->foreign(['tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
        });

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement(
                'CREATE UNIQUE INDEX course_enrollments_one_active_unique ON course_enrollments (tenant_id, course_id, tenant_user_id) WHERE status = \'active\'',
            );
        }

        Schema::create('lesson_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_section_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_lesson_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_enrollment_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('not_started')->index();
            $table->unsignedTinyInteger('progress_percent')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('last_activity_at')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'course_enrollment_id', 'course_lesson_id'], 'lesson_progress_enrollment_lesson_unique');
            $table->index(['tenant_id', 'course_id', 'course_section_id'], 'lesson_progress_course_section_index');
            $table->foreign(['course_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('courses')
                ->cascadeOnDelete();
            $table->foreign(['course_section_id', 'course_id', 'tenant_id'])
                ->references(['id', 'course_id', 'tenant_id'])
                ->on('course_sections')
                ->cascadeOnDelete();
            $table->foreign(['course_lesson_id', 'course_section_id', 'course_id', 'tenant_id'], 'lesson_progress_lesson_hierarchy_fk')
                ->references(['id', 'course_section_id', 'course_id', 'tenant_id'])
                ->on('course_lessons')
                ->cascadeOnDelete();
            $table->foreign(['course_enrollment_id', 'course_id', 'tenant_id'], 'lesson_progress_enrollment_fk')
                ->references(['id', 'course_id', 'tenant_id'])
                ->on('course_enrollments')
                ->cascadeOnDelete();
        });

        Schema::create('course_completions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_enrollment_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('completion_percent')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'course_enrollment_id', 'course_id'], 'course_completions_enrollment_course_unique');
            $table->foreign(['course_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('courses')
                ->cascadeOnDelete();
            $table->foreign(['course_enrollment_id', 'course_id', 'tenant_id'], 'course_completions_enrollment_fk')
                ->references(['id', 'course_id', 'tenant_id'])
                ->on('course_enrollments')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_completions');
        Schema::dropIfExists('lesson_progress');
        Schema::dropIfExists('course_enrollments');
    }
};
