<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Image-question architecture decision (reversed 2026-08-30):
 *
 * The original version of this migration retired the `image` question format
 * and converted every image question into a reconstructed `structured`
 * document. That OCR/Vision extraction approach was abandoned: teachers now
 * upload the question image exactly as-is and the platform stores + renders it
 * directly.
 *
 * Therefore this migration no longer drops `media_asset_id` and no longer
 * converts `image` questions. The `media_asset_id` + `question_format = image`
 * pair is the canonical image-question representation and must be preserved.
 *
 * Historical `structured` questions keep rendering through the structured
 * renderer; historical `image` questions keep rendering through the image
 * renderer. Nothing is destroyed here.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Intentionally a no-op. The scanned/image question path is supported
        // again, so the previously-planned column removal is skipped. See
        // 2026_08_30_000001_restore_image_question_media_asset.php for the
        // safety migration that re-adds the column on installs where the old
        // behaviour had already run.
    }

    public function down(): void
    {
        //
    }
};
