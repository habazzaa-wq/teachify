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
            'examId' => $this->exam_id ? (string) $this->exam_id : null,
            'courseSessionId' => $this->course_session_id ? (string) $this->course_session_id : null,
            'courseSession' => $this->when($this->relationLoaded('courseSession') && $this->courseSession, fn () => [
                'id' => (string) $this->courseSession->id,
                'title' => $this->courseSession->title,
                'description' => $this->courseSession->description,
                'sessionType' => $this->courseSession->session_type,
                'status' => $this->courseSession->status,
                'startsAtUtc' => $this->courseSession->starts_at_utc?->toIso8601String(),
                'endsAtUtc' => $this->courseSession->ends_at_utc?->toIso8601String(),
                'timezone' => $this->courseSession->timezone,
                'meetingUrl' => $this->courseSession->meeting_url,
                'locationName' => $this->courseSession->location_name,
                'locationAddress' => $this->courseSession->location_address,
            ]),
            'filesCount' => $this->files_count
                ?? ($this->relationLoaded('files') ? $this->files->count() : $this->files()->count()),
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
