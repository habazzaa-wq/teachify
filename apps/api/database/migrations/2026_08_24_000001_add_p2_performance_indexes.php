<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * P2 performance indexes. Every index here supports a concrete, paginated or
 * aggregated query introduced/confirmed during the P2 audit:
 *
 *  - notifications(tenant_user_id, created_at): the paginated notification feed
 *    (NotificationService::list) filters by recipient and orders by created_at.
 *  - course_sections(course_id): the per-student "total lessons" aggregate
 *    filters course_sections by course_id.
 *  - course_lessons(course_section_id): the same aggregate joins lessons onto
 *    their section by course_section_id.
 *
 * No tenant isolation is weakened: every query remains tenant-scoped by the
 * global TenantScope / explicit tenant_id predicates; these indexes only speed
 * up the existing predicates.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['tenant_user_id', 'created_at'], 'notifications_recipient_created_index');
        });

        Schema::table('course_sections', function (Blueprint $table) {
            $table->index(['course_id'], 'course_sections_course_id_index');
        });

        Schema::table('course_lessons', function (Blueprint $table) {
            $table->index(['course_section_id'], 'course_lessons_section_id_index');
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('notifications_recipient_created_index');
        });

        Schema::table('course_sections', function (Blueprint $table) {
            $table->dropIndex('course_sections_course_id_index');
        });

        Schema::table('course_lessons', function (Blueprint $table) {
            $table->dropIndex('course_lessons_section_id_index');
        });
    }
};
