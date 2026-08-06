<?php

namespace App\Http\Controllers\Api\v1\Public;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\MediaAsset;
use App\Models\User;
use App\Services\Access\AccessEvaluationService;
use App\Services\Media\MediaManager;
use Illuminate\Http\JsonResponse;

class PublicCourseLessonVideoController extends Controller
{
    public function __construct(
        private readonly AccessEvaluationService $access,
        private readonly MediaManager $manager,
    ) {
    }

    /**
     * Resolve the playable video for a lesson on a public course page.
     *
     * Enrolled students, tenant staff and free-preview lessons are allowed.
     * The response intentionally exposes only playback-safe fields (Bunny
     * embed URL + HLS playback URL) — never storage credentials.
     */
    public function show(string $slug, string $lessonId): JsonResponse
    {
        $tenant = currentTenant();

        $course = Course::query()
            ->where('tenant_id', $tenant->id)
            ->where('slug', $slug)
            ->where('status', 'published')
            ->where('visibility', 'public')
            ->firstOrFail();

        $lesson = CourseLesson::query()
            ->with(['course.accessRule', 'section', 'accessRule', 'video.mediaAsset'])
            ->where('tenant_id', $tenant->id)
            ->where('course_id', $course->id)
            ->where('id', $lessonId)
            ->firstOrFail();

        abort_unless(
            in_array($lesson->lesson_type ?? $lesson->type, ['video', 'audio'], true),
            422,
            'هذا الدرس لا يحتوي على محتوى فيديو.',
        );

        $lessonVideo = $lesson->video;
        abort_unless($lessonVideo, 404, 'لا يوجد محتوى فيديو لهذا الدرس.');

        /** @var MediaAsset|null $asset */
        $asset = $lessonVideo->mediaAsset;
        abort_unless(
            $asset
                && $asset->tenant_id === $tenant->id
                && $asset->provider === 'bunny'
                && $asset->provider_service === 'stream'
                && $asset->type === 'video',
            404,
            'محتوى الفيديو غير متاح.',
        );

        abort_unless($asset->status === 'ready', 422, 'هذا الفيديو لم يكتمل تجهيزه بعد.');

        $this->authorizeWatch($lesson, $this->resolveUser());

        $playback = $this->manager
            ->providerFor($asset->provider, $asset->provider_service)
            ->getPlaybackData($asset);

        $videoId = $asset->bunny_video_id ?: $asset->external_id;
        $libraryId = $asset->bunny_library_id;

        $embedUrl = null;
        if ($libraryId && $videoId) {
            $embedUrl = 'https://iframe.mediadelivery.net/embed/'.trim((string) $libraryId, '/').'/'.trim((string) $videoId, '/');
        }

        return response()->json([
            'data' => [
                'lesson' => [
                    'id' => (string) $lesson->id,
                    'title' => $lesson->title,
                    'slug' => $lesson->slug,
                    'lessonType' => $lesson->lesson_type ?? $lesson->type,
                    'shortDescription' => $lesson->short_description,
                    'durationSeconds' => $lesson->duration_seconds,
                ],
                'video' => [
                    'provider' => 'bunny',
                    'provider_service' => 'stream',
                    'video_id' => $videoId,
                    'library_id' => $libraryId,
                    'embed_url' => $embedUrl,
                    'playback_url' => $playback['playback_url'] ?? null,
                    'thumbnail_url' => $asset->thumbnail_url
                        ?? $asset->poster_url
                        ?? ($playback['thumbnail_url'] ?? null),
                    'duration_seconds' => $asset->duration
                        ?? ($asset->metadata['duration_seconds'] ?? null)
                        ?? ($playback['duration_seconds'] ?? null),
                    'available_resolutions' => $playback['available_resolutions'] ?? [],
                    'status' => $asset->status,
                ],
            ],
        ]);
    }

    private function authorizeWatch(CourseLesson $lesson, ?User $user): void
    {
        if (! $user) {
            abort_unless($this->isFreePreview($lesson), 403, 'هذا المحتوى متاح للمشتركين فقط.');
            return;
        }

        if ($this->access->canAccessMedia($user, $lesson)) {
            return;
        }

        abort_unless($this->isFreePreview($lesson), 403, 'هذا المحتوى متاح للمشتركين فقط.');
    }

    private function isFreePreview(CourseLesson $lesson): bool
    {
        return (bool) $lesson->free_preview
            || in_array($lesson->visibility, ['preview', 'public'], true)
            || ($lesson->accessRule && $lesson->accessRule->access_mode === 'public_preview');
    }

    private function resolveUser(): ?User
    {
        /** @var User|null $user */
        $user = auth('sanctum')->user();

        return $user;
    }
}
