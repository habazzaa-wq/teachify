<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Singleton tenant-scoped SEO settings. Exactly one row per tenant.
 */
class SeoSetting extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'default_title_template',
        'default_description',
        'default_og_image_asset_id',
        'default_twitter_image_asset_id',
        'default_robots_policy',
        'sitemap_include_default',
        'organization_name',
        'organization_description',
        'social_profiles',
        'homepage_title',
        'homepage_description',
        'google_verification',
        'bing_verification',
    ];

    protected function casts(): array
    {
        return [
            'sitemap_include_default' => 'boolean',
            'social_profiles' => 'array',
        ];
    }

    public function defaultOgImage(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'default_og_image_asset_id');
    }

    public function defaultTwitterImage(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'default_twitter_image_asset_id');
    }
}
