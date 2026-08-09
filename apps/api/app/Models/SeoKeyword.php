<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeoKeyword extends Model
{
    use BelongsToTenant;

    public const TYPES = ['focus', 'related', 'long_tail'];

    public const INTENTS = ['informational', 'commercial', 'transactional', 'navigational'];

    protected $fillable = [
        'tenant_id',
        'seo_content_id',
        'keyword',
        'keyword_type',
        'search_intent',
        'notes',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function seoContent(): BelongsTo
    {
        return $this->belongsTo(SeoContent::class);
    }
}
