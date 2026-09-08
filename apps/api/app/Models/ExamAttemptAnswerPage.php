<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamAttemptAnswerPage extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'exam_attempt_answer_id',
        'media_asset_id',
        'page_order',
        'captured_at',
        'width',
        'height',
    ];

    protected function casts(): array
    {
        return [
            'page_order' => 'integer',
            'captured_at' => 'datetime',
            'width' => 'integer',
            'height' => 'integer',
        ];
    }

    public function answer(): BelongsTo
    {
        return $this->belongsTo(ExamAttemptAnswer::class, 'exam_attempt_answer_id');
    }

    public function mediaAsset(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class);
    }
}
