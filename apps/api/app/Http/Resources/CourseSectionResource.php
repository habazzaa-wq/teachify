<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseSectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'tenantId' => (string) $this->tenant_id,
            'courseId' => (string) $this->course_id,
            'courseModuleId' => $this->course_module_id ? (string) $this->course_module_id : null,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'order' => $this->sort_order,
            'durationMinutes' => $this->duration_minutes,
            'freePreview' => $this->free_preview,
            'status' => $this->status,
            'published' => $this->is_published,
            'locked' => $this->locked,
            'featured' => $this->featured,
            'color' => $this->color,
            'icon' => $this->icon,
            'notes' => $this->notes,
            'lessonsCount' => $this->lessons_count ?? $this->lessons()->count(),
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
