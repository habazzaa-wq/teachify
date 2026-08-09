<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Models\MediaAsset;

class SeoContentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'tenantId' => (string) $this->tenant_id,
            'contentType' => $this->content_type,
            'title' => $this->title,
            'slug' => $this->slug,
            'status' => $this->status,
            'indexable' => (bool) $this->indexable,
            'inSitemap' => (bool) $this->in_sitemap,
            'excerpt' => $this->excerpt,
            'content' => $this->content,
            'contentFormat' => $this->content_format,
            'publicPath' => $this->publicPath(),
            'isPublished' => $this->isPublished(),
            'isSitemapEligible' => $this->isSitemapEligible(),
            'author' => $this->whenLoaded('author', fn () => $this->author ? [
                'id' => (string) $this->author->id,
                'name' => $this->author->user?->name ?? 'Unknown',
            ] : null),
            'seo' => [
                'title' => $this->seo_title,
                'description' => $this->seo_description,
                'focusKeyword' => $this->focus_keyword,
                'secondaryKeywords' => $this->secondary_keywords ?? [],
                'canonicalUrl' => $this->canonical_url,
                'ogTitle' => $this->og_title,
                'ogDescription' => $this->og_description,
                'twitterTitle' => $this->twitter_title,
                'twitterDescription' => $this->twitter_description,
                'structuredDataType' => $this->structured_data_type,
            ],
            'images' => [
                'featuredImage' => $this->imageData($this->featuredImage),
                'ogImage' => $this->imageData($this->ogImage),
                'twitterImage' => $this->imageData($this->twitterImage),
            ],
            'faqs' => $this->whenLoaded('faqs', fn () => $this->faqs->map(fn ($faq) => [
                'id' => (string) $faq->id,
                'question' => $faq->question,
                'answer' => $faq->answer,
                'sortOrder' => $faq->sort_order,
                'isPublished' => (bool) $faq->is_published,
            ])),
            'keywords' => $this->whenLoaded('keywords', fn () => $this->keywords->map(fn ($kw) => [
                'id' => (string) $kw->id,
                'keyword' => $kw->keyword,
                'keywordType' => $kw->keyword_type,
                'searchIntent' => $kw->search_intent,
                'notes' => $kw->notes,
                'sortOrder' => $kw->sort_order,
            ])),
            'links' => $this->whenLoaded('links', fn () => $this->links->map(fn ($link) => [
                'id' => (string) $link->id,
                'targetSeoContentId' => $link->target_seo_content_id !== null ? (string) $link->target_seo_content_id : null,
                'targetType' => $link->target_type,
                'targetId' => $link->target_id,
                'targetUrl' => $link->target_url,
                'anchorText' => $link->anchor_text,
                'sortOrder' => $link->sort_order,
            ])),
            'revisionsCount' => $this->whenCounted('revisions', fn () => (int) $this->revisions_count),
            'score' => $this->when(isset($this->resource->seoScore), fn () => $this->resource->seoScore),
            'publishedAt' => $this->published_at?->toISOString(),
            'archivedAt' => $this->archived_at?->toISOString(),
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }

    private function imageData(?MediaAsset $asset): ?array
    {
        if ($asset === null) {
            return null;
        }

        return [
            'id' => (string) $asset->id,
            'url' => $asset->cdn_url ?? $asset->thumbnail_url ?? $asset->preview_url,
            'thumbnailUrl' => $asset->thumbnail_url ?? $asset->cdn_url,
            'width' => $asset->width,
            'height' => $asset->height,
            'mimeType' => $asset->mime_type,
            'size' => (int) ($asset->size ?? $asset->size_bytes ?? 0),
            'title' => $asset->title ?? $asset->original_name,
        ];
    }
}
