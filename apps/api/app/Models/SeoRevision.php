<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Append-only revision snapshot for SEO/content edits.
 * Deliberately has no updated_at column.
 */
class SeoRevision extends Model
{
    use BelongsToTenant;

    public const UPDATED_AT = null;

    protected $fillable = [
        'tenant_id',
        'seo_content_id',
        'editor_tenant_user_id',
        'action',
        'snapshot',
    ];

    protected function casts(): array
    {
        return [
            'snapshot' => 'array',
        ];
    }

    public function seoContent(): BelongsTo
    {
        return $this->belongsTo(SeoContent::class);
    }

    public function editor(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'editor_tenant_user_id');
    }
}
