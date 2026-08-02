<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 3 — Results & Review.
 *
 * Links a practice attempt to the attempt it was spawned from and records the
 * exact subset of exam questions the practice attempt must contain. Regular
 * (official / natural-ordinal practice) attempts leave both fields null, so the
 * existing engine behaviour is unchanged for them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_attempts', function (Blueprint $table) {
            $table->unsignedBigInteger('practice_source_attempt_id')->nullable()->after('anti_cheat_events');
            $table->json('included_exam_question_ids')->nullable()->after('practice_source_attempt_id');

            $table->index(['practice_source_attempt_id'], 'exam_attempts_practice_source_idx');
        });
    }

    public function down(): void
    {
        Schema::table('exam_attempts', function (Blueprint $table) {
            $table->dropIndex('exam_attempts_practice_source_idx');
            $table->dropColumn(['practice_source_attempt_id', 'included_exam_question_ids']);
        });
    }
};
