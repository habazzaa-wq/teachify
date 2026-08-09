<?php

namespace App\Http\Resources;

use App\Models\MediaAsset;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public-facing representation of a published SEO content record.
 * Only rendered for published, indexable, non-archived records — the
 * controller guarantees that before this resource is ever used.
 */
class PublicSeoContentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'contentType' => $this->content_type,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'content' => $this->content,
            'contentFormat' => $this->content_format,
            'publicPath' => $this->publicPath(),
            'author' => $this->whenLoaded('author', fn () => $this->author ? $this->author->user?->name ?? null : null),
            'seo' => [
                'title' => $this->seo_title,
                'description' => $this->seo_description,
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
            'faqs' => $this->whenLoaded('faqs', fn () => $this->faqs
                ->filter(fn ($faq) => (bool) $faq->is_published)
                ->map(fn ($faq) => [
                    'id' => (string) $faq->id,
                    'question' => $faq->question,
                    'answer' => $faq->answer,
                ])),
            'publishedAt' => $this->published_at?->toISOString(),
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
            'width' => $asset->width,
            'height' => $asset->height,
            'mimeType' => $asset->mime_type,
        ];
    }
}
