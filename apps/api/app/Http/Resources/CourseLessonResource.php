<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseLessonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'tenantId' => (string) $this->tenant_id,
            'courseId' => (string) $this->course_id,
            'sectionId' => (string) $this->course_section_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'shortDescription' => $this->short_description,
            'description' => $this->description,
            'order' => $this->sort_order,
            'lessonType' => $this->lesson_type ?? $this->type,
            'status' => $this->status,
            'visibility' => $this->visibility,
            'durationSeconds' => $this->duration_seconds,
            'estimatedDuration' => $this->estimated_duration,
            'freePreview' => $this->free_preview,
            'downloadable' => $this->downloadable,
            'featured' => $this->featured,
            'commentsEnabled' => $this->comments_enabled,
            'notes' => $this->notes,
            'color' => $this->color,
            'icon' => $this->icon,
            'publishedAt' => $this->published_at?->toIso8601String(),
            'course' => $this->when($this->relationLoaded('course'), fn () => [
                'id' => (string) $this->course->id,
                'title' => $this->course->title,
                'slug' => $this->course->slug,
            ]),
            'section' => $this->when($this->relationLoaded('section'), fn () => [
                'id' => (string) $this->section->id,
                'title' => $this->section->title,
                'slug' => $this->section->slug,
            ]),
            'createdAt' => $this->created_at->toIso8601String(),
            'updatedAt' => $this->updated_at->toIso8601String(),
            'deletedAt' => $this->deleted_at?->toIso8601String(),
        ];
    }
}
