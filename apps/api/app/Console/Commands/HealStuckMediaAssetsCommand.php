<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class HealStuckMediaAssetsCommand extends Command
{
    protected $signature = 'media:heal-stuck {--dry-run : Preview without updating}';
    protected $description = 'Mark stuck image/document assets as ready to remove perpetual processing loader';

    public function handle(): int
    {
        $q = DB::table('media_assets')
            ->whereIn('processing_status', ['pending', 'uploading', 'processing'])
            ->where('type', '!=', 'video')
            ->where(function ($w) {
                $w->whereNotNull('cdn_url')->orWhere('created_at', '<', now()->subMinutes(5));
            });

        $count = $q->count();
        if ($this->option('dry-run')) {
            $this->info("Would heal {$count} stuck assets.");
            return 0;
        }
        $updated = DB::table('media_assets')
            ->whereIn('processing_status', ['pending', 'uploading', 'processing'])
            ->where('type', '!=', 'video')
            ->where(function ($w) {
                $w->whereNotNull('cdn_url')->orWhere('created_at', '<', now()->subMinutes(5));
            })
            ->update([
                'status' => 'ready',
                'processing_status' => 'ready',
                'processing_progress' => 100,
                'updated_at' => now(),
            ]);
        $this->info("Healed {$updated} stuck assets.");
        return 0;
    }
}
