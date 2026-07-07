<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoAnalytics extends Model
{
    use BelongsToTenant;

    protected $table = 'video_analytics';

    protected $fillable = [
        'tenant_id',
        'media_asset_id',
        'play_count',
        'unique_viewers',
        'watch_time_seconds',
        'average_watch_time_seconds',
        'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'play_count' => 'integer',
            'unique_viewers' => 'integer',
            'watch_time_seconds' => 'integer',
            'average_watch_time_seconds' => 'float',
            'generated_at' => 'datetime',
        ];
    }

    public function mediaAsset(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class);
    }
}
