<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SeoKeywordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'tenantId' => (string) $this->tenant_id,
            'seoContentId' => $this->seo_content_id !== null ? (string) $this->seo_content_id : null,
            'keyword' => $this->keyword,
            'keywordType' => $this->keyword_type,
            'searchIntent' => $this->search_intent,
            'notes' => $this->notes,
            'sortOrder' => $this->sort_order,
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
