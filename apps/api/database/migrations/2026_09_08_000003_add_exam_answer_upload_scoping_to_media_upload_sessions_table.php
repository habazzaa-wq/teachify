<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase B2 — Private exam-attempt page uploads.
 *
 * Scopes `media_upload_sessions` to a concrete exam attempt + exam question so
 * an intent token issued for attempt A can never be confirmed against attempt
 * B's answer, regardless of what the confirm request claims (the binding is
 * enforced at the DB level, not just by the application WHERE clause).
 *
 * FK style matches `exam_attempt_answers`: each scoping column is a plain
 * `constrained()` FK on the parent's id, cascade-deleted with it. `tenant_id`
 * scoping is already enforced by every query's TenantScope global scope +
 * the explicit tenant_id predicate in the confirm lookup. Regular media
 * library upload sessions keep these columns NULL, so existing flows are
 * unaffected.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('media_upload_sessions', function (Blueprint $table) {
            $table->foreignId('exam_attempt_id')
                ->nullable()
                ->after('media_asset_id')
                ->constrained('exam_attempts')
                ->cascadeOnDelete();
            $table->foreignId('exam_question_id')
                ->nullable()
                ->after('exam_attempt_id')
                ->constrained('exam_questions')
                ->cascadeOnDelete();

            $table->index(
                ['tenant_id', 'exam_attempt_id', 'exam_question_id', 'status'],
                'media_upload_sessions_exam_binding_index',
            );
        });
    }

    public function down(): void
    {
        Schema::table('media_upload_sessions', function (Blueprint $table) {
            $table->dropIndex('media_upload_sessions_exam_binding_index');
            $table->dropForeign(['exam_attempt_id']);
            $table->dropForeign(['exam_question_id']);
            $table->dropColumn(['exam_attempt_id', 'exam_question_id']);
        });
    }
};