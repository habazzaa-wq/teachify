<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase B1 — Student image-based essay answers + manual teacher grading.
 *
 * Extends `exam_attempt_answers` so an answer can say:
 *   - HOW it was captured (`answer_mode`: text vs image pages)
 *   - WHERE it stands in the grading lifecycle (`grading_status`)
 *   - WHAT a teacher awarded (`manual_score`, `feedback`) and WHO/WHEN
 *     (`graded_by_tenant_user_id`, `graded_at`).
 *
 * Every existing row is a text-mode auto-graded answer: `answer_mode = 'text'`
 * and `grading_status = 'auto_graded'` are the non-null defaults, so existing
 * MCQ/session data is untouched by this migration. The columns are additive —
 * no query in the current grading path reads them, so nothing changes for
 * non-essay questions (see ExamGradingService::grade() which only ever touches
 * `answer`, `is_correct`, `earned_points`).
 *
 * The "essay must never default to incorrect/zero" invariant is enforced by
 * the Phase B2 save path (ExamSessionService::saveAnswer), not by this
 * migration: the new columns are the contract that lets B2 record essays as
 * `pending_manual_review` with a NULL `is_correct`. This migration only adds
 * the storage for that contract with defaults that preserve current behavior.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_attempt_answers', function (Blueprint $table) {
            $table->string('answer_mode', 24)->default('text')->after('answer');
            $table->string('grading_status', 32)->default('auto_graded')->after('answer_mode');
            $table->decimal('manual_score', 7, 2)->nullable()->after('earned_points');
            $table->text('feedback')->nullable()->after('manual_score');
            $table->foreignId('graded_by_tenant_user_id')
                ->nullable()
                ->after('feedback')
                ->constrained('tenant_users')
                ->nullOnDelete();
            $table->timestamp('graded_at')->nullable()->after('graded_by_tenant_user_id');
        });
    }

    public function down(): void
    {
        Schema::table('exam_attempt_answers', function (Blueprint $table) {
            $table->dropForeign(['graded_by_tenant_user_id']);
            $table->dropColumn([
                'answer_mode',
                'grading_status',
                'manual_score',
                'feedback',
                'graded_by_tenant_user_id',
                'graded_at',
            ]);
        });
    }
};
