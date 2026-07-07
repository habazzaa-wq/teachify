<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssignmentAnalytics extends Model
{
    use BelongsToTenant;

    protected $table = 'assignment_analytics';

    protected $fillable = [
        'tenant_id',
        'assignment_id',
        'submission_count',
        'graded_count',
        'average_score',
        'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'submission_count' => 'integer',
            'graded_count' => 'integer',
            'average_score' => 'float',
            'generated_at' => 'datetime',
        ];
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(Assignment::class);
    }
}
