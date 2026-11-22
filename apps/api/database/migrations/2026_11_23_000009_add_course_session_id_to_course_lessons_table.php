<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_lessons', function (Blueprint $table) {
            $table->foreignId('course_session_id')->nullable()->after('exam_id')->constrained('course_sessions')->nullOnDelete();
            $table->index(['tenant_id', 'course_session_id'], 'course_lessons_tenant_session_idx');
        });
    }

    public function down(): void
    {
        Schema::table('course_lessons', function (Blueprint $table) {
            $table->dropIndex('course_lessons_tenant_session_idx');
            $table->dropConstrainedForeignId('course_session_id');
        });
    }
};
