<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SeoContent extends Model
{
    use BelongsToTenant, SoftDeletes;

    public const CONTENT_TYPES = [
        'article',
        'guide',
        'faq_collection',
        'custom_page',
        'course',
        'stage',
        'subject',
        'category',
    ];

    public const STATUSES = [
        'draft',
        'review',
        'published',
        'archived',
    ];

    protected $fillable = [
        'tenant_id',
        'seoable_type',
        'seoable_id',
        'content_type',
        'title',
        'slug',
        'status',
        'indexable',
        'in_sitemap',
        'excerpt',
        'content',
        'content_format',
        'author_tenant_user_id',
        'seo_title',
        'seo_description',
        'focus_keyword',
        'secondary_keywords',
        'canonical_url',
        'og_title',
        'og_description',
        'twitter_title',
        'twitter_description',
        'featured_image_asset_id',
        'og_image_asset_id',
        'twitter_image_asset_id',
        'structured_data_type',
        'published_at',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'secondary_keywords' => 'array',
            'indexable' => 'boolean',
            'in_sitemap' => 'boolean',
            'published_at' => 'datetime',
            'archived_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    // ── Relations ────────────────────────────────────────────────────────────

    public function seoable(): MorphTo
    {
        return $this->morphTo();
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'author_tenant_user_id');
    }

    public function featuredImage(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'featured_image_asset_id');
    }

    public function ogImage(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'og_image_asset_id');
    }

    public function twitterImage(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'twitter_image_asset_id');
    }

    public function faqs(): HasMany
    {
        return $this->hasMany(SeoFaq::class)->orderBy('sort_order');
    }

    public function keywords(): HasMany
    {
        return $this->hasMany(SeoKeyword::class)->orderBy('sort_order');
    }

    public function links(): HasMany
    {
        return $this->hasMany(SeoContentLink::class)->orderBy('sort_order');
    }

    public function revisions(): HasMany
    {
        return $this->hasMany(SeoRevision::class);
    }

    // ── Scopes ──────────────────────────────────────────────────────────────

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')
            ->whereNotNull('published_at')
            ->whereNull('archived_at');
    }

    public function scopeIndexable(Builder $query): Builder
    {
        return $query->where('indexable', true);
    }

    public function scopeSitemapEligible(Builder $query): Builder
    {
        return $query->published()->indexable()->where('in_sitemap', true);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    public function isPublished(): bool
    {
        return $this->status === 'published'
            && $this->published_at !== null
            && $this->archived_at === null;
    }

    /**
     * Draft, review and archived content must never be listed in a sitemap
     * or exposed on public routes.
     */
    public function isSitemapEligible(): bool
    {
        return $this->isPublished() && $this->indexable && $this->in_sitemap;
    }

    /**
     * Public URL path for this content record, or null when the type does not
     * have a dedicated public route. Entity-linked records (course/stage/...)
     * are rendered by their own existing public pages.
     */
    public function publicPath(): ?string
    {
        return match ($this->content_type) {
            'article', 'faq_collection' => "/articles/{$this->slug}",
            'guide' => "/guides/{$this->slug}",
            default => null,
        };
    }

    /**
     * Best available human title: explicit SEO title, then content title.
     */
    public function displayTitle(): string
    {
        return $this->seo_title ?: $this->title;
    }
}
