<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analytics_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('type')->index();
            $table->string('period')->index();
            $table->date('snapshot_date')->index();
            $table->jsonb('payload');
            $table->timestamp('generated_at');
            $table->timestamps();

            $table->index(['tenant_id', 'type', 'period', 'snapshot_date'], 'analytics_snapshots_scope_index');
        });

        Schema::create('course_analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('enrollments_count')->default(0);
            $table->unsignedInteger('active_learners_count')->default(0);
            $table->unsignedInteger('completed_learners_count')->default(0);
            $table->decimal('completion_rate', 5, 2)->default(0);
            $table->decimal('average_progress_percent', 5, 2)->default(0);
            $table->decimal('average_quiz_score', 5, 2)->default(0);
            $table->decimal('average_assignment_score', 5, 2)->default(0);
            $table->timestamp('generated_at');
            $table->timestamps();

            $table->unique(['tenant_id', 'course_id']);
            $table->foreign(['course_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('courses')
                ->cascadeOnDelete();
        });

        Schema::create('learner_analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_user_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('enrolled_courses_count')->default(0);
            $table->unsignedInteger('completed_courses_count')->default(0);
            $table->decimal('average_progress_percent', 5, 2)->default(0);
            $table->decimal('average_quiz_score', 5, 2)->default(0);
            $table->decimal('average_assignment_score', 5, 2)->default(0);
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamp('generated_at');
            $table->timestamps();

            $table->unique(['tenant_id', 'tenant_user_id']);
            $table->foreign(['tenant_user_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
        });

        Schema::create('quiz_analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quiz_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('attempt_count')->default(0);
            $table->unsignedInteger('unique_learners')->default(0);
            $table->decimal('average_score', 5, 2)->default(0);
            $table->decimal('pass_rate', 5, 2)->default(0);
            $table->timestamp('generated_at');
            $table->timestamps();

            $table->unique(['tenant_id', 'quiz_id']);
            $table->foreign(['quiz_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('quizzes')
                ->cascadeOnDelete();
        });

        Schema::create('assignment_analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assignment_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('submission_count')->default(0);
            $table->unsignedInteger('graded_count')->default(0);
            $table->decimal('average_score', 5, 2)->default(0);
            $table->timestamp('generated_at');
            $table->timestamps();

            $table->unique(['tenant_id', 'assignment_id']);
            $table->foreign(['assignment_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('assignments')
                ->cascadeOnDelete();
        });

        Schema::create('video_analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('media_asset_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('play_count')->default(0);
            $table->unsignedInteger('unique_viewers')->default(0);
            $table->unsignedBigInteger('watch_time_seconds')->default(0);
            $table->decimal('average_watch_time_seconds', 10, 2)->default(0);
            $table->timestamp('generated_at');
            $table->timestamps();

            $table->unique(['tenant_id', 'media_asset_id']);
            $table->foreign(['media_asset_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('media_assets')
                ->cascadeOnDelete();
        });

        Schema::create('analytics_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('job_type')->index();
            $table->string('status')->default('pending')->index();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->jsonb('metadata');
            $table->text('last_error')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'job_type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_jobs');
        Schema::dropIfExists('video_analytics');
        Schema::dropIfExists('assignment_analytics');
        Schema::dropIfExists('quiz_analytics');
        Schema::dropIfExists('learner_analytics');
        Schema::dropIfExists('course_analytics');
        Schema::dropIfExists('analytics_snapshots');
    }
};
