<?php

namespace App\Services\Assignments;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use Illuminate\Validation\ValidationException;

class AssignmentService
{
    /**
     * @param array<string, mixed> $data
     */
    public function create(Course $course, CourseSection $section, CourseLesson $lesson, array $data): Assignment
    {
        $this->ensureLessonHierarchy($course, $section, $lesson);

        if ($lesson->assignment()->exists()) {
            throw ValidationException::withMessages([
                'assignment' => ['This lesson already has an assignment.'],
            ]);
        }

        return Assignment::create($this->payload($lesson, $data, 'draft'))->refresh();
    }

    /**
     * @param array<string, mixed> $data
     */
    public function update(Assignment $assignment, array $data): Assignment
    {
        $assignment->fill(collect($data)->only([
            'title',
            'description',
            'instructions',
            'max_score',
            'due_at',
            'allow_late_submission',
        ])->all())->save();

        return $assignment->refresh();
    }

    public function changeStatus(Assignment $assignment, string $status): Assignment
    {
        $allowed = [
            'draft' => ['published'],
            'published' => ['archived'],
            'archived' => ['draft'],
        ];

        if (! in_array($status, $allowed[$assignment->status] ?? [], true)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot transition assignment from {$assignment->status} to {$status}."],
            ]);
        }

        $assignment->forceFill(['status' => $status])->save();

        return $assignment->refresh();
    }

    public function delete(Assignment $assignment): void
    {
        $assignment->delete();
    }

    private function ensureLessonHierarchy(Course $course, CourseSection $section, CourseLesson $lesson): void
    {
        if (
            $course->tenant_id !== currentTenant()->id
            || $section->tenant_id !== $course->tenant_id
            || $lesson->tenant_id !== $course->tenant_id
            || $section->course_id !== $course->id
            || $lesson->course_id !== $course->id
            || $lesson->course_section_id !== $section->id
        ) {
            throw ValidationException::withMessages([
                'lesson' => ['The selected lesson hierarchy is invalid.'],
            ]);
        }
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function payload(CourseLesson $lesson, array $data, string $status): array
    {
        return [
            'tenant_id' => $lesson->tenant_id,
            'course_id' => $lesson->course_id,
            'course_section_id' => $lesson->course_section_id,
            'course_lesson_id' => $lesson->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'instructions' => $data['instructions'] ?? null,
            'max_score' => $data['max_score'] ?? 100,
            'due_at' => $data['due_at'] ?? null,
            'allow_late_submission' => $data['allow_late_submission'] ?? false,
            'status' => $status,
        ];
    }
}
