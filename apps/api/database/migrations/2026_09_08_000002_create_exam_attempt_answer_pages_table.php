<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase B1 — Student image-based essay answers.
 *
 * One row per photographed page of an image-mode answer. A single
 * `exam_attempt_answer` in `answer_mode = 'image_pages'` owns an ordered set of
 * these rows; each row points at one `MediaAsset` plus client-reported capture
 * metadata.
 *
 * FK behavior (matches sibling tables):
 *  - `exam_attempt_answer_id` → cascade: the parent `exam_attempt_answers`
 *    row is cascade-deleted with its attempt (see 2026_08_02_000002), so a
 *    page must never outlive its answer. Plain `constrained()` FK mirrors how
 *    `exam_attempt_answers.exam_attempt_id` references `exam_attempts`.
 *  - `media_asset_id` → cascade via the composite (id, tenant_id) FK, exactly
 *    like `media_asset_variants` / `media_asset_captions` / `media_asset_usages`
 *    / `assignment_submission_files`. MediaAssets are soft-deleted in normal
 *    operation, so Eloquent soft deletes leave the page row intact (the page's
 *    own metadata remains useful and the asset may be restored); a cascade
 *    only fires on an actual hard delete, which is the deliberate
 *    administration purge all asset children already follow. If strict audit
 *    preservation is preferred over convention, flip this to RESTRICT — see
 *    "Open questions".
 *
 * Uniqueness (enforced at DB level, not left to the app):
 *  - `(tenant_id, exam_attempt_answer_id, page_order)` — one order slot per
 *    answer; reordering is an explicit UPDATE of existing rows (B2), not an
 *    insert that silently fights the index.
 *  - `media_asset_id` — a single uploaded photo can only ever be the page of
 *    one answer; reuse/duplication of an asset across answers is rejected by
 *    the DB.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_attempt_answer_pages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exam_attempt_answer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('media_asset_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('page_order');
            $table->timestamp('captured_at')->nullable();
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->timestamps();

            $table->unique(
                ['tenant_id', 'exam_attempt_answer_id', 'page_order'],
                'exam_attempt_answer_pages_order_unique',
            );
            $table->unique('media_asset_id', 'exam_attempt_answer_pages_asset_unique');
            $table->index(['tenant_id', 'exam_attempt_answer_id'], 'exam_attempt_answer_pages_answer_index');

            $table->foreign(['media_asset_id', 'tenant_id'])
                ->references(['id', 'tenant_id'])
                ->on('media_assets')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_attempt_answer_pages');
    }
};
