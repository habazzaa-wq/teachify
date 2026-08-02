<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_attempts', function (Blueprint $table) {
            $table->index(['exam_id', 'user_id', 'status'], 'exam_attempts_exam_user_status_index');
            $table->index(['tenant_id', 'timer_ends_at'], 'exam_attempts_tenant_timer_index');
        });
    }

    public function down(): void
    {
        Schema::table('exam_attempts', function (Blueprint $table) {
            $table->dropIndex('exam_attempts_exam_user_status_index');
            $table->dropIndex('exam_attempts_tenant_timer_index');
        });
    }
};
