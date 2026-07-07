<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'tenantId' => (string) $this->tenant_id,
            'parentId' => $this->parent_id ? (string) $this->parent_id : null,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'thumbnail' => $this->thumbnail_path,
            'icon' => $this->icon,
            'color' => $this->color,
            'sortOrder' => $this->sort_order,
            'featured' => $this->featured,
            'active' => $this->active,
            'seo' => [
                'title' => $this->seo_title,
                'description' => $this->seo_description,
                'keywords' => $this->seo_keywords,
            ],
            'parent' => $this->whenLoaded('parent', fn () => [
                'id' => (string) $this->parent->id,
                'name' => $this->parent->name,
                'slug' => $this->parent->slug,
            ]),
            'children' => $this->whenLoaded('children', fn () => $this->children->map(fn ($c) => [
                'id' => (string) $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'sortOrder' => $c->sort_order,
                'coursesCount' => $c->courses_count ?? 0,
            ])),
            'coursesCount' => $this->courses_count ?? $this->courses()->count(),
            'createdAt' => $this->created_at->toIso8601String(),
            'updatedAt' => $this->updated_at->toIso8601String(),
            'deletedAt' => $this->deleted_at?->toIso8601String(),
        ];
    }
}
