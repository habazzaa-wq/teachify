<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_attempts', function (Blueprint $table) {
            $table->decimal('percentage', 5, 2)->nullable()->after('max_score');
            $table->boolean('is_official')->default(false)->after('passed');
            $table->boolean('is_practice')->default(false)->after('is_official');
            $table->integer('current_question_index')->nullable()->after('is_practice');
            $table->timestamp('timer_ends_at')->nullable()->after('started_at');
            $table->json('anti_cheat_events')->nullable()->after('timer_ends_at');

            $table->index(['tenant_id', 'exam_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::table('exam_attempts', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'exam_id', 'user_id']);
            $table->dropColumn(['percentage', 'is_official', 'is_practice', 'current_question_index', 'timer_ends_at', 'anti_cheat_events']);
        });
    }
};
