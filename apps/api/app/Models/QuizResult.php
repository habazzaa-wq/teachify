<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizResult extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'quiz_id',
        'tenant_user_id',
        'best_score',
        'passed',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'best_score' => 'integer',
            'passed' => 'boolean',
            'completed_at' => 'datetime',
        ];
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'tenant_user_id');
    }
}
