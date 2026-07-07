<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonVideo extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'course_id',
        'course_section_id',
        'course_lesson_id',
        'media_asset_id',
        'thumbnail_media_asset_id',
        'processing_status',
        'playback_policy',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(CourseLesson::class, 'course_lesson_id');
    }

    public function mediaAsset(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class);
    }

    public function thumbnailMediaAsset(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'thumbnail_media_asset_id');
    }
}
