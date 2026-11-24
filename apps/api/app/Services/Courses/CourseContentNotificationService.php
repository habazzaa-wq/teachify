<?php

namespace App\Services\Courses;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseLesson;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Notifications\NotificationEventService;

/**
 * Notifies enrolled students as soon as new published course content lands
 * (external links, videos, resources, ...).
 */
class CourseContentNotificationService
{
    public function __construct(private readonly NotificationEventService $events)
    {
    }

    public function notifyPublished(Course $course, CourseLesson $lesson): void
    {
        if ($lesson->status !== 'published') {
            return;
        }

        $tenant = Tenant::query()->whereKey($course->tenant_id)->first();
        if (! $tenant) {
            return;
        }

        $recipientIds = CourseEnrollment::query()
            ->where('tenant_id', $tenant->id)
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->pluck('tenant_user_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if ($recipientIds === []) {
            return;
        }

        $recipients = TenantUser::query()
            ->where('tenant_id', $tenant->id)
            ->whereIn('id', $recipientIds)
            ->where('status', 'active')
            ->get();

        $title = 'تمت إضافة محتوى جديد إلى دورتك';
        $body = trim(($course->title ? $course->title.' - ' : '').($lesson->title ?? ''));

        foreach ($recipients as $recipient) {
            $this->events->record($tenant, 'lesson.published', implode(':', [
                'lesson.published',
                'lesson', $lesson->id,
                'course', $course->id,
                'user', $recipient->id,
                'published', $lesson->published_at?->timestamp ?? $lesson->updated_at?->timestamp ?? now()->timestamp,
            ]), [
                'tenant_user_id' => $recipient->id,
                'course_id' => $course->id,
                'course_slug' => $course->slug,
                'course_title' => $course->title,
                'lesson_id' => $lesson->id,
                'lesson_title' => $lesson->title,
                'lesson_type' => $lesson->lesson_type ?? $lesson->type,
                'title' => $title,
                'body' => $body,
            ]);
        }
    }
}
