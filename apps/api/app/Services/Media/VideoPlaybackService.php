<?php

namespace App\Services\Media;

use App\Models\CourseEnrollment;
use App\Models\CourseLesson;
use App\Models\LessonVideo;
use App\Models\MediaAsset;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\VideoPlaybackSession;
use App\Services\Access\AccessEvaluationService;
use App\Services\Authorization\TenantAuthorizationService;
use App\Services\Learning\EnrollmentService;
use App\Services\Learning\ProgressService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class VideoPlaybackService
{
    public function __construct(
        private readonly MediaManager $manager,
        private readonly AccessEvaluationService $access,
        private readonly EnrollmentService $enrollments,
        private readonly ProgressService $progress,
        private readonly TenantAuthorizationService $authorization,
    ) {
    }

    /**
     * @return array{session: VideoPlaybackSession, playback: array<string, mixed>}
     */
    public function start(Tenant $tenant, TenantUser $membership, MediaAsset $asset): array
    {
        $lessonVideo = $this->lessonVideoForAsset($tenant, $asset);
        $lesson = $lessonVideo->lesson->loadMissing(['course', 'section', 'accessRule']);

        $this->authorizePlayback($tenant, $membership, $asset, $lesson);

        return DB::transaction(function () use ($tenant, $membership, $asset, $lesson): array {
            $session = VideoPlaybackSession::create([
                'tenant_id' => $tenant->id,
                'media_asset_id' => $asset->id,
                'tenant_user_id' => $membership->id,
                'course_id' => $lesson->course_id,
                'course_section_id' => $lesson->course_section_id,
                'course_lesson_id' => $lesson->id,
                'session_token' => Str::random(64),
                'started_at' => now(),
                'expires_at' => now()->addHours(2),
                'last_position_seconds' => 0,
                'status' => 'active',
            ])->refresh();

            return [
                'session' => $session,
                'playback' => $this->manager
                    ->providerFor($asset->provider, $asset->provider_service)
                    ->getPlaybackData($asset),
            ];
        });
    }

    public function updateProgress(Tenant $tenant, TenantUser $membership, string $token, int $positionSeconds): VideoPlaybackSession
    {
        $session = $this->activeSession($tenant, $membership, $token);
        $lesson = $session->lesson;
        $duration = (int) ($session->mediaAsset->metadata['duration_seconds'] ?? $lesson->duration_seconds ?? 0);
        $positionSeconds = max(0, $positionSeconds);

        $session->forceFill([
            'last_position_seconds' => $positionSeconds,
        ])->save();

        if ($this->authorization->hasRole($membership->user, $tenant, 'student')) {
            $percent = $duration > 0 ? (int) floor(min(100, ($positionSeconds / $duration) * 100)) : 1;
            $this->progress->updateLessonProgress($lesson, $membership, $percent);
        }

        return $session->refresh();
    }

    public function close(Tenant $tenant, TenantUser $membership, string $token): VideoPlaybackSession
    {
        $session = $this->activeSession($tenant, $membership, $token);

        $session->forceFill(['status' => 'closed'])->save();

        return $session->refresh();
    }

    private function authorizePlayback(Tenant $tenant, TenantUser $membership, MediaAsset $asset, CourseLesson $lesson): void
    {
        if ($asset->tenant_id !== $tenant->id || $asset->provider !== 'bunny' || $asset->provider_service !== 'stream' || $asset->type !== 'video') {
            throw new AuthorizationException('This video is not available.');
        }

        if ($asset->status !== 'ready') {
            throw new AuthorizationException('This video is not ready for playback.');
        }

        if ($lesson->tenant_id !== $tenant->id || $lesson->course->tenant_id !== $tenant->id || $lesson->section?->tenant_id !== $tenant->id) {
            throw new AuthorizationException('This lesson is not available.');
        }

        if ($lesson->course->status === 'archived' || $lesson->status === 'archived' || $lesson->section?->status === 'archived') {
            throw new AuthorizationException('Archived content is not available.');
        }

        if ($lesson->course->status !== 'published' || $lesson->status !== 'published' || ! $lesson->section?->is_published) {
            throw new AuthorizationException('This lesson is not published.');
        }

        if (! $this->access->canViewCourse($membership->user, $lesson->course) || ! $this->access->canAccessMedia($membership->user, $lesson)) {
            throw new AuthorizationException('This video is not available.');
        }

        if ($this->authorization->hasRole($membership->user, $tenant, 'student')) {
            $this->activeEnrollment($lesson, $membership);
        }
    }

    private function lessonVideoForAsset(Tenant $tenant, MediaAsset $asset): LessonVideo
    {
        if ($asset->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'asset' => ['The video asset is invalid for this tenant.'],
            ]);
        }

        $lessonVideo = LessonVideo::query()
            ->with(['lesson.course', 'lesson.section', 'mediaAsset'])
            ->where('tenant_id', $tenant->id)
            ->where('media_asset_id', $asset->id)
            ->first();

        if (! $lessonVideo) {
            throw ValidationException::withMessages([
                'asset' => ['The video asset is not attached to a lesson video.'],
            ]);
        }

        return $lessonVideo;
    }

    private function activeSession(Tenant $tenant, TenantUser $membership, string $token): VideoPlaybackSession
    {
        $session = VideoPlaybackSession::query()
            ->with(['lesson.course', 'lesson.section', 'mediaAsset'])
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $membership->id)
            ->where('session_token', $token)
            ->first();

        if (! $session || $session->status !== 'active') {
            throw ValidationException::withMessages([
                'session' => ['The playback session is invalid.'],
            ]);
        }

        if (now()->greaterThanOrEqualTo($session->expires_at)) {
            $session->forceFill(['status' => 'expired'])->save();

            throw ValidationException::withMessages([
                'session' => ['The playback session has expired.'],
            ]);
        }

        return $session;
    }

    private function activeEnrollment(CourseLesson $lesson, TenantUser $membership): CourseEnrollment
    {
        $enrollment = CourseEnrollment::query()
            ->where('tenant_id', $lesson->tenant_id)
            ->where('course_id', $lesson->course_id)
            ->where('tenant_user_id', $membership->id)
            ->where('status', 'active')
            ->first();

        if (! $enrollment) {
            throw new AuthorizationException('An active enrollment is required.');
        }

        return $enrollment;
    }
}
