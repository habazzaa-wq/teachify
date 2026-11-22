<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A previous deployment created this table before the composite tenant FK
        // failed. MySQL rejects SET NULL on a composite FK whose tenant_id column
        // is NOT NULL, so the table was left behind without a migration record.
        // It is brand new and empty; rebuild it, but never destroy real data.
        if (Schema::hasTable('session_attendance')) {
            if (DB::table('session_attendance')->count() > 0) {
                throw new \RuntimeException('session_attendance already contains data; refusing to rebuild it automatically.');
            }
            Schema::drop('session_attendance');
        }

        Schema::create('session_attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_session_id')->constrained()->cascadeOnDelete();
            // The relation is enforced by the composite tenant FK below. A single
            // SET NULL FK here would conflict with it on delete.
            $table->foreignId('course_session_enrollment_id')->nullable();
            $table->foreignId('tenant_user_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('pending')->index();
            $table->foreignId('marked_by_tenant_user_id')->nullable()->constrained('tenant_users')->nullOnDelete();
            $table->timestamp('marked_at')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['id', 'tenant_id']);
            $table->unique(['tenant_id', 'course_session_id', 'tenant_user_id'], 'session_attendance_unique_student');
            $table->index(['tenant_id', 'course_session_id', 'status'], 'session_attendance_tenant_session_status_idx');
            $table->index(['tenant_id', 'tenant_user_id'], 'session_attendance_tenant_student_idx');
            $table->foreign(['course_session_id', 'tenant_id'], 'session_attendance_session_fk')
                ->references(['id', 'tenant_id'])
                ->on('course_sessions')
                ->cascadeOnDelete();
            // SET NULL is impossible here: tenant_id is NOT NULL and participates
            // in the FK. Attendance belongs to the enrollment, so cascade instead.
            $table->foreign(['course_session_enrollment_id', 'tenant_id'], 'session_attendance_enrollment_fk')
                ->references(['id', 'tenant_id'])
                ->on('course_session_enrollments')
                ->cascadeOnDelete();
            $table->foreign(['tenant_user_id', 'tenant_id'], 'session_attendance_student_fk')
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_attendance');
    }
};
