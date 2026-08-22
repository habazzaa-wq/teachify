<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Retires the legacy scanned-question architecture:
 *
 *  - questions that were stored as `question_format = 'image'` keep their
 *    content visible by being converted into structured documents holding a
 *    single `legacy_image` block (the old asset CDN URL is preserved inside
 *    the document; the underlying MediaAsset row/file is NOT deleted here).
 *  - rows marked image without a usable asset degrade to plain text.
 *  - the questions table no longer references media_assets at all.
 *
 * New questions are never created in image format; imports produce
 * reconstructed structured documents only.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('questions', 'media_asset_id')) {
            $imageRows = $this->legacyImageRows();

            foreach ($imageRows as $row) {
                $document = null;

                if (! empty($row->cdn_url)) {
                    $document = [
                        'version' => 1,
                        'direction' => 'rtl',
                        'language' => 'ar',
                        'meta' => ['legacy' => 'image'],
                        'blocks' => [[
                            'type' => 'legacy_image',
                            'url' => (string) $row->cdn_url,
                        ]],
                    ];
                }

                \Illuminate\Support\Facades\DB::table('questions')
                    ->where('id', $row->id)
                    ->update([
                        'content_document' => $document !== null ? json_encode($document, JSON_UNESCAPED_UNICODE) : null,
                        'question_format' => $document !== null ? 'structured' : 'text',
                        'updated_at' => now(),
                    ]);
            }

            // Drop FK when present (older installs may lack it).
            $fkExists = collect(Schema::getForeignKeys('questions'))
                ->contains(fn (array $foreignKey): bool => in_array('media_asset_id', $foreignKey['columns'], true));

            Schema::table('questions', function (Blueprint $table) use ($fkExists): void {
                if ($fkExists) {
                    $table->dropForeign(['media_asset_id']);
                }

                $table->dropColumn('media_asset_id');
            });
        }
    }

    public function down(): void
    {
        // Legacy conversion is one-way on purpose: reconstructing which rows
        // were originally image-format from structured documents would risk
        // corrupting genuine import-based questions.
    }

    private function legacyImageRows(): iterable
    {
        return \Illuminate\Support\Facades\DB::table('questions as q')
            ->leftJoin('media_assets as m', 'm.id', '=', 'q.media_asset_id')
            ->where('q.question_format', 'image')
            ->get(['q.id', 'm.cdn_url']);
    }
};
