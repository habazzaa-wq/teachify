<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeoFaq extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'seo_content_id',
        'question',
        'answer',
        'sort_order',
        'is_published',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_published' => 'boolean',
        ];
    }

    public function seoContent(): BelongsTo
    {
        return $this->belongsTo(SeoContent::class);
    }
}
