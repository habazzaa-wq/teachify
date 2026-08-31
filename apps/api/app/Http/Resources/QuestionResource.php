<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isImage = ($this->question_format ?? 'text') === 'image';
        $media = $this->relationLoaded('mediaAsset') ? $this->mediaAsset : null;
        $scanAsset = ($isImage && $media instanceof \App\Models\MediaAsset) ? $media : null;

        return [
            'id' => (string) $this->id,
            'uuid' => $this->uuid,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'type' => $this->type,
            'difficulty' => $this->difficulty,
            'categoryId' => $this->category_id ? (string) $this->category_id : null,
            'bankId' => $this->bank_id ? (string) $this->bank_id : null,
            'tags' => $this->tags ?? [],
            'points' => $this->points,
            'estimatedTime' => $this->estimated_time,
            'language' => $this->language,
            'status' => $this->status,
            'visibility' => $this->visibility,
            'shuffleOptions' => $this->shuffle_options,
            'explanation' => $this->explanation,
            'hint' => $this->hint,
            'content' => $this->content ?? new \stdClass(),
            'contentDocument' => $this->content_document,
            'metadata' => $this->metadata ?? new \stdClass(),
            'questionFormat' => $this->question_format ?? 'text',
            'scanAssetId' => $scanAsset ? (string) $scanAsset->id : null,
            'scanUrl' => $scanAsset ? ($scanAsset->cdn_url ?? null) : null,
            'scanProcessing' => $scanAsset ? [
                'mode' => $scanAsset->metadata['scan_mode'] ?? null,
                'fallbackUsed' => (bool) ($scanAsset->metadata['scan_fallback_used'] ?? false),
                'qualityLevel' => $scanAsset->metadata['scan_quality_level'] ?? null,
            ] : null,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => (string) $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ]),
            'creator' => $this->whenLoaded('creator', fn () => [
                'id' => (string) $this->creator->id,
                'name' => $this->creator->user?->name,
            ]),
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
            'deletedAt' => $this->deleted_at?->toIso8601String(),
        ];
    }
}
