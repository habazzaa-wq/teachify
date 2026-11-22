<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_session_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_enrollment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_user_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('enrolled')->index();
            $table->timestamp('enrolled_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->unique(['id', 'tenant_id']);
            $table->unique(['tenant_id', 'course_session_id', 'tenant_user_id'], 'course_session_enrollments_unique_student');
            $table->index(['tenant_id', 'course_enrollment_id'], 'course_session_enrollments_tenant_course_enrollment_idx');
            $table->index(['tenant_id', 'tenant_user_id', 'status'], 'course_session_enrollments_tenant_student_status_idx');
            $table->foreign(['course_session_id', 'tenant_id'], 'course_session_enrollments_session_fk')
                ->references(['id', 'tenant_id'])
                ->on('course_sessions')
                ->cascadeOnDelete();
            $table->foreign(['course_enrollment_id', 'tenant_id'], 'course_session_enrollments_enrollment_fk')
                ->references(['id', 'tenant_id'])
                ->on('course_enrollments')
                ->cascadeOnDelete();
            $table->foreign(['tenant_user_id', 'tenant_id'], 'course_session_enrollments_student_fk')
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_session_enrollments');
    }
};
