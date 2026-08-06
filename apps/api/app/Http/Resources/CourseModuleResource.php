<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseModuleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'tenantId' => (string) $this->tenant_id,
            'courseId' => (string) $this->course_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'order' => $this->order,
            'status' => $this->status,
            'published' => $this->is_published,
            'featured' => $this->featured,
            'estimatedDuration' => $this->estimated_duration,
            'color' => $this->color,
            'icon' => $this->icon,
            'notes' => $this->notes,
            'sectionsCount' => $this->sections_count
                ?? ($this->relationLoaded('sections') ? $this->sections->count() : $this->sections()->count()),
            'sections' => CourseSectionResource::collection($this->whenLoaded('sections')),
            'publishedAt' => $this->published_at?->toIso8601String(),
            'course' => $this->when($this->relationLoaded('course'), fn () => [
                'id' => (string) $this->course->id,
                'title' => $this->course->title,
                'slug' => $this->course->slug,
            ]),
            'createdAt' => $this->created_at->toIso8601String(),
            'updatedAt' => $this->updated_at->toIso8601String(),
            'deletedAt' => $this->deleted_at?->toIso8601String(),
        ];
    }
}
