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

class PublicCourseLessonFileController extends Controller
{
    public function __construct(
        private readonly AccessEvaluationService $access,
        private readonly MediaManager $manager,
    ) {}

    /**
     * Resolve the downloadable/openable files for a lesson on a public course page.
     *
     * Enrolled students, tenant staff and free-preview lessons are allowed.
     * The response exposes only playback-safe fields and a public/open URL —
     * never storage credentials.
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
            ->with(['course.accessRule', 'section', 'accessRule', 'files.mediaAsset'])
            ->where('tenant_id', $tenant->id)
            ->where('course_id', $course->id)
            ->where('id', $lessonId)
            ->firstOrFail();

        $this->authorizeAccess($lesson, $this->resolveUser());

        $files = $lesson->files
            ->sortBy('sort_order')
            ->values()
            ->filter(fn ($file) => $file->mediaAsset !== null)
            ->map(function ($file): array {
                /** @var MediaAsset $asset */
                $asset = $file->mediaAsset;

                $url = $asset->cdn_url;
                if (! $url) {
                    $url = $this->manager
                        ->providerFor($asset->provider, 'storage')
                        ->createSignedReadUrl($asset)['url'] ?? null;
                }

                return [
                    'id' => (string) $file->id,
                    'title' => $file->title ?: ($asset->original_filename ?: $asset->title),
                    'description' => $file->description,
                    'downloadEnabled' => $file->download_enabled,
                    'fileName' => $asset->original_filename ?: $asset->title,
                    'mimeType' => $asset->mime_type,
                    'extension' => $asset->extension,
                    'sizeBytes' => $asset->size_bytes,
                    'type' => $asset->type,
                    'url' => $url,
                ];
            })
            ->values()
            ->all();

        return response()->json([
            'data' => [
                'lesson' => [
                    'id' => (string) $lesson->id,
                    'title' => $lesson->title,
                    'slug' => $lesson->slug,
                    'lessonType' => $lesson->lesson_type ?? $lesson->type,
                    'filesCount' => count($files),
                ],
                'files' => $files,
            ],
        ]);
    }

    private function authorizeAccess(CourseLesson $lesson, ?User $user): void
    {
        if (! $user) {
            abort_unless($this->isFreePreview($lesson), 403, 'هذا الملف متاح للمشتركين فقط.');

            return;
        }

        if ($this->access->canAccessMedia($user, $lesson)) {
            return;
        }

        abort_unless($this->isFreePreview($lesson), 403, 'هذا الملف متاح للمشتركين فقط.');
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
