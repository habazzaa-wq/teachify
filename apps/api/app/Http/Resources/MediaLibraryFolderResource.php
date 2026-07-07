<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MediaLibraryFolderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'parentId' => $this->parent_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'path' => $this->path,
            'sortOrder' => $this->sort_order,
            'childrenCount' => $this->when($this->relationLoaded('children'), fn () => $this->children->count()),
            'assetCount' => $this->when($this->relationLoaded('assets'), fn () => $this->assets->count()),
            'createdAt' => $this->created_at->toISOString(),
            'updatedAt' => $this->updated_at->toISOString(),
            'children' => self::collection(
                $this->whenLoaded('children', fn () => $this->children)
            ),
        ];
    }
}
