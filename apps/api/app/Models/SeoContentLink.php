<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeoContentLink extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'seo_content_id',
        'target_seo_content_id',
        'target_type',
        'target_id',
        'target_url',
        'anchor_text',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'target_id' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function seoContent(): BelongsTo
    {
        return $this->belongsTo(SeoContent::class);
    }

    public function targetSeoContent(): BelongsTo
    {
        return $this->belongsTo(SeoContent::class, 'target_seo_content_id');
    }
}
