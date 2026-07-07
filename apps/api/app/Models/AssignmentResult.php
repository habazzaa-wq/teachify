<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssignmentResult extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'assignment_id',
        'tenant_user_id',
        'score',
        'passed',
        'feedback',
        'graded_by_tenant_user_id',
        'graded_at',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'integer',
            'passed' => 'boolean',
            'graded_at' => 'datetime',
        ];
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(Assignment::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'tenant_user_id');
    }

    public function grader(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'graded_by_tenant_user_id');
    }
}
