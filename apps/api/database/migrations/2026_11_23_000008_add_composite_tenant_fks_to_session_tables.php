<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->assertNoCrossTenantReferences();

        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        // MySQL cannot SET NULL on these composite FKs: tenant_id is NOT NULL.
        // Drop the single-column SET NULL FKs and use RESTRICT on the composite
        // ones (tenant_users uses soft deletes, so normal deletes never hit this).
        Schema::table('course_sessions', function (Blueprint $table) {
            $table->dropForeign('course_sessions_created_by_tenant_user_id_foreign');
            $table->dropForeign('course_sessions_instructor_tenant_user_id_foreign');
            $table->foreign(['created_by_tenant_user_id', 'tenant_id'], 'course_sessions_creator_tenant_fk')
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->restrictOnDelete();
            $table->foreign(['instructor_tenant_user_id', 'tenant_id'], 'course_sessions_instructor_tenant_fk')
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->restrictOnDelete();
        });

        Schema::table('session_attendance', function (Blueprint $table) {
            $table->dropForeign('session_attendance_marked_by_tenant_user_id_foreign');
            $table->foreign(['marked_by_tenant_user_id', 'tenant_id'], 'session_attendance_marker_tenant_fk')
                ->references(['id', 'tenant_id'])
                ->on('tenant_users')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('session_attendance', function (Blueprint $table) {
            $table->dropForeign('session_attendance_marker_tenant_fk');
            $table->foreign('marked_by_tenant_user_id', 'session_attendance_marked_by_tenant_user_id_foreign')
                ->references('id')->on('tenant_users')->nullOnDelete();
        });

        Schema::table('course_sessions', function (Blueprint $table) {
            $table->dropForeign('course_sessions_instructor_tenant_fk');
            $table->dropForeign('course_sessions_creator_tenant_fk');
            $table->foreign('created_by_tenant_user_id', 'course_sessions_created_by_tenant_user_id_foreign')
                ->references('id')->on('tenant_users')->nullOnDelete();
            $table->foreign('instructor_tenant_user_id', 'course_sessions_instructor_tenant_user_id_foreign')
                ->references('id')->on('tenant_users')->nullOnDelete();
        });
    }

    private function assertNoCrossTenantReferences(): void
    {
        $violations = [];

        $creatorViolations = DB::table('course_sessions')
            ->join('tenant_users', 'tenant_users.id', '=', 'course_sessions.created_by_tenant_user_id')
            ->whereColumn('tenant_users.tenant_id', '!=', 'course_sessions.tenant_id')
            ->count();
        if ($creatorViolations > 0) {
            $violations[] = "course_sessions.created_by_tenant_user_id: {$creatorViolations}";
        }

        $instructorViolations = DB::table('course_sessions')
            ->join('tenant_users', 'tenant_users.id', '=', 'course_sessions.instructor_tenant_user_id')
            ->whereColumn('tenant_users.tenant_id', '!=', 'course_sessions.tenant_id')
            ->count();
        if ($instructorViolations > 0) {
            $violations[] = "course_sessions.instructor_tenant_user_id: {$instructorViolations}";
        }

        $markerViolations = DB::table('session_attendance')
            ->join('tenant_users', 'tenant_users.id', '=', 'session_attendance.marked_by_tenant_user_id')
            ->whereColumn('tenant_users.tenant_id', '!=', 'session_attendance.tenant_id')
            ->count();
        if ($markerViolations > 0) {
            $violations[] = "session_attendance.marked_by_tenant_user_id: {$markerViolations}";
        }

        if ($violations !== []) {
            throw new \RuntimeException('Cross-tenant session references detected: '.implode(', ', $violations));
        }
    }
};
