<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CommunityCategory extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'slug',
        'name',
        'description',
        'icon',
        'sort_order',
        'is_default',
        'allows_questions',
        'moderator_only',
        'status',
        'created_by_tenant_user_id',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'allows_questions' => 'boolean',
            'moderator_only' => 'boolean',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'created_by_tenant_user_id');
    }

    public function channels(): HasMany
    {
        return $this->hasMany(CommunityChannel::class, 'category_id');
    }

    public function isArchived(): bool
    {
        return $this->status === 'archived';
    }
}
