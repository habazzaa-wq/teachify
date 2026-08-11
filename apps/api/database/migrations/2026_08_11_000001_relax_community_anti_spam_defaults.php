<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Relax the community anti-spam defaults so consecutive chat messages are
     * not blocked. The 5s cooldown / 30s duplicate window were too strict for
     * a live chat and made a second message fail with a 422 right after the
     * first one. New defaults: 1s cooldown, flood limit 10 per 10s, 10s
     * duplicate window.
     */
    public function up(): void
    {
        DB::table('community_settings')->update([
            'message_cooldown_seconds' => 1,
            'flood_limit' => 10,
            'duplicate_window_seconds' => 10,
        ]);
    }

    public function down(): void
    {
        DB::table('community_settings')->update([
            'message_cooldown_seconds' => 5,
            'flood_limit' => 5,
            'duplicate_window_seconds' => 30,
        ]);
    }
};
