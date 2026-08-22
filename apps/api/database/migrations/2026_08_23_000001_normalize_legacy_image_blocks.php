<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('questions')->whereNotNull('content_document')->cursor()->each(function ($row): void {
            $doc = json_decode($row->content_document, true);
            if (! is_array($doc) || ! isset($doc['blocks']) || ! is_array($doc['blocks'])) {
                return;
            }
            $changed = false;
            foreach ($doc['blocks'] as &$block) {
                if (($block['type'] ?? null) === 'legacy_image') {
                    $block = [
                        'type' => 'image',
                        'src' => $block['url'] ?? $block['src'] ?? '',
                        'alt' => $block['alt'] ?? null,
                        'caption' => $block['caption'] ?? null,
                    ];
                    $changed = true;
                }
            }
            unset($block);
            if ($changed) {
                DB::table('questions')->where('id', $row->id)->update([
                    'content_document' => json_encode($doc, JSON_UNESCAPED_UNICODE),
                    'updated_at' => now(),
                ]);
            }
        });
    }

    public function down(): void {}
};
