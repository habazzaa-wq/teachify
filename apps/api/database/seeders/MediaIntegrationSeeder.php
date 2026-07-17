<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\LessonFile;
use App\Models\LessonVideo;
use App\Models\MediaAsset;
use App\Models\MediaAssetUsage;
use App\Models\Tenant;
use App\Models\TenantDomain;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class MediaIntegrationSeeder extends Seeder
{
    private Tenant $tenant;

    private int $coursesWithImages = 0;

    private int $lessonsWithVideos = 0;

    private int $resourcesLinked = 0;

    private int $skippedLessons = 0;

    private int $videoAssetsUsed = 0;

    private int $imageAssetsUsed = 0;

    private int $pdfUsed = 0;

    private int $docxUsed = 0;

    private int $pptxUsed = 0;

    private int $zipUsed = 0;

    private int $audioUsed = 0;

    private int $usagesTracked = 0;

    /** @var Collection<int, MediaAsset> */
    private Collection $videos;

    /** @var Collection<int, MediaAsset> */
    private Collection $images;

    /** @var Collection<int, MediaAsset> */
    private Collection $resources;

    /** @var Collection<int, MediaAsset> */
    private Collection $pdfs;

    /** @var Collection<int, MediaAsset> */
    private Collection $docx;

    /** @var Collection<int, MediaAsset> */
    private Collection $pptx;

    /** @var Collection<int, MediaAsset> */
    private Collection $zips;

    /** @var Collection<int, MediaAsset> */
    private Collection $audio;

    public function run(): void
    {
        $startTime = microtime(true);

        $this->resolveTenant();

        $this->loadMediaAssets();

        $this->assignCourseImages();

        $this->assignLessonVideos();

        $this->assignLessonResources();

        $elapsed = round(microtime(true) - $startTime, 2);

        $unusedMedia = $this->countUnusedMediaAssets();

        $this->command->info('');
        $this->command->info('───────────────────────────────────────────');
        $this->command->info('  Media Integration Complete');
        $this->command->info('───────────────────────────────────────────');
        $this->command->info("  Courses With Images     : {$this->coursesWithImages}");
        $this->command->info("  Lessons With Videos     : {$this->lessonsWithVideos}");
        $this->command->info("  Resources Linked        : {$this->resourcesLinked}");
        $this->command->info("  Video Assets Used       : {$this->videoAssetsUsed}");
        $this->command->info("  Image Assets Used       : {$this->imageAssetsUsed}");
        $this->command->info("  PDF Used                : {$this->pdfUsed}");
        $this->command->info("  DOCX Used               : {$this->docxUsed}");
        $this->command->info("  PPTX Used               : {$this->pptxUsed}");
        $this->command->info("  ZIP Used                : {$this->zipUsed}");
        $this->command->info("  Audio Used              : {$this->audioUsed}");
        $this->command->info("  Skipped Lessons         : {$this->skippedLessons}");
        $this->command->info("  Unused Media Assets     : {$unusedMedia}");
        $this->command->info("  Execution Time          : {$elapsed}s");
        $this->command->info('───────────────────────────────────────────');
    }

    private function resolveTenant(): void
    {
        $domain = TenantDomain::where('domain', 'hazem.academy.test')
            ->where('status', 'active')
            ->first();
        $this->tenant = $domain?->tenant ?? Tenant::firstOrFail();

        app()->instance(Tenant::class, $this->tenant);
        app()->instance('currentTenant', $this->tenant);
    }

    private function loadMediaAssets(): void
    {
        $base = MediaAsset::query()
            ->where('tenant_id', $this->tenant->id)
            ->where('status', 'ready')
            ->whereNull('archived_at');

        $this->videos = (clone $base)->where('type', 'video')->get();
        $this->images = (clone $base)->where('type', 'image')->get();

        $allResources = (clone $base)
            ->whereNotIn('type', ['video', 'image', 'caption', 'thumbnail'])
            ->get();

        $this->pdfs = $allResources->filter(fn (MediaAsset $a) => $this->isPdf($a));
        $this->docx = $allResources->filter(fn (MediaAsset $a) => $this->isDocx($a));
        $this->pptx = $allResources->filter(fn (MediaAsset $a) => $this->isPptx($a));
        $this->zips = $allResources->filter(fn (MediaAsset $a) => $this->isZip($a));
        $this->audio = $allResources->filter(fn (MediaAsset $a) => $this->isAudio($a));

        $this->resources = $allResources->filter(fn (MediaAsset $a) => $this->isPdf($a) || $this->isDocx($a) || $this->isPptx($a)
            || $this->isZip($a) || $this->isAudio($a) || $a->type === 'image'
        )->values();

        $this->command->info("  Loaded: {$this->videos->count()} videos, {$this->images->count()} images, {$this->resources->count()} resources");
    }

    // ═══════════════════════════════════════════════════
    // COURSE IMAGES
    // ═══════════════════════════════════════════════════

    private function assignCourseImages(): void
    {
        if ($this->images->isEmpty()) {
            $this->command->warn('  Skipped: No image assets available for course images');

            return;
        }

        $courses = Course::where('tenant_id', $this->tenant->id)->get();

        $imageIndex = 0;
        $imageCount = $this->images->count();

        foreach ($courses as $course) {
            if ($course->thumbnail_path && $course->cover_image_path) {
                continue;
            }

            $image = $this->images[$imageIndex % $imageCount];
            $path = $image->cdn_url ?: $image->storage_key;

            if (! $path) {
                $imageIndex++;

                continue;
            }

            $updates = [];
            if (! $course->thumbnail_path) {
                $updates['thumbnail_path'] = $path;
            }
            if (! $course->cover_image_path) {
                $updates['cover_image_path'] = $path;
            }

            if ($updates) {
                $course->forceFill($updates)->save();
                $this->coursesWithImages++;
                $this->imageAssetsUsed++;

                $this->trackUsage($image, $course, 'course_image');
            }

            $imageIndex++;
        }
    }

    // ═══════════════════════════════════════════════════
    // LESSON VIDEOS
    // ═══════════════════════════════════════════════════

    private function assignLessonVideos(): void
    {
        if ($this->videos->isEmpty()) {
            $this->command->warn('  Skipped: No video assets available for lesson videos');

            return;
        }

        $lessons = CourseLesson::where('tenant_id', $this->tenant->id)->get();
        $videoCount = $this->videos->count();

        foreach ($lessons as $lessonIndex => $lesson) {
            $existing = LessonVideo::where('tenant_id', $this->tenant->id)
                ->where('course_lesson_id', $lesson->id)
                ->exists();

            if ($existing) {
                $this->lessonsWithVideos++;

                continue;
            }

            $video = $this->videos[$lessonIndex % $videoCount];

            LessonVideo::create([
                'tenant_id' => $this->tenant->id,
                'course_id' => $lesson->course_id,
                'course_section_id' => $lesson->course_section_id,
                'course_lesson_id' => $lesson->id,
                'media_asset_id' => $video->id,
                'processing_status' => 'completed',
                'playback_policy' => 'private',
            ]);

            $this->lessonsWithVideos++;
            $this->videoAssetsUsed++;

            $this->trackUsage($video, $lesson, 'lesson_video');
        }
    }

    // ═══════════════════════════════════════════════════
    // LESSON RESOURCES
    // ═══════════════════════════════════════════════════

    private function assignLessonResources(): void
    {
        if ($this->resources->isEmpty()) {
            $this->command->warn('  Skipped: No resource assets available for lesson files');

            return;
        }

        $lessons = CourseLesson::where('tenant_id', $this->tenant->id)->get();
        $resourceCount = $this->resources->count();

        $globalOffset = 0;

        foreach ($lessons as $lesson) {
            $existingCount = LessonFile::where('tenant_id', $this->tenant->id)
                ->where('course_lesson_id', $lesson->id)
                ->count();

            if ($existingCount > 0) {
                $this->skippedLessons++;

                continue;
            }

            $resourceCountForLesson = $this->randomResourceCount();
            $attachedAssetIds = [];
            $filesCreated = 0;

            for ($i = 0; $i < $resourceCountForLesson; $i++) {
                $assetIndex = ($globalOffset + $i) % $resourceCount;
                $asset = $this->resources[$assetIndex];

                if (in_array($asset->id, $attachedAssetIds, true)) {
                    continue;
                }

                LessonFile::create([
                    'tenant_id' => $this->tenant->id,
                    'course_id' => $lesson->course_id,
                    'course_section_id' => $lesson->course_section_id,
                    'course_lesson_id' => $lesson->id,
                    'media_asset_id' => $asset->id,
                    'title' => $asset->original_name ?: $asset->title ?: $asset->slug,
                    'description' => null,
                    'download_enabled' => true,
                    'sort_order' => $filesCreated,
                ]);

                $attachedAssetIds[] = $asset->id;
                $filesCreated++;
                $this->resourcesLinked++;

                $this->trackFileUsage($asset);

                $this->trackUsage($asset, $lesson, 'lesson_resource');
            }

            $globalOffset += $resourceCountForLesson;
        }
    }

    // ═══════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════

    private function randomResourceCount(): int
    {
        return rand(2, 5);
    }

    private function isPdf(MediaAsset $asset): bool
    {
        return $asset->type === 'pdf'
            || str_contains(strtolower((string) $asset->mime_type), 'pdf')
            || strtolower((string) $asset->extension) === 'pdf';
    }

    private function isDocx(MediaAsset $asset): bool
    {
        return str_contains(strtolower((string) $asset->mime_type), 'wordprocessingml')
            || strtolower((string) $asset->extension) === 'docx'
            || strtolower((string) $asset->extension) === 'doc';
    }

    private function isPptx(MediaAsset $asset): bool
    {
        return str_contains(strtolower((string) $asset->mime_type), 'presentationml')
            || strtolower((string) $asset->extension) === 'pptx'
            || strtolower((string) $asset->extension) === 'ppt';
    }

    private function isZip(MediaAsset $asset): bool
    {
        return $asset->type === 'archive'
            || str_contains(strtolower((string) $asset->mime_type), 'zip')
            || strtolower((string) $asset->extension) === 'zip';
    }

    private function isAudio(MediaAsset $asset): bool
    {
        return $asset->type === 'audio'
            || str_contains(strtolower((string) $asset->mime_type), 'audio');
    }

    private function trackFileUsage(MediaAsset $asset): void
    {
        if ($this->isPdf($asset)) {
            $this->pdfUsed++;
        } elseif ($this->isDocx($asset)) {
            $this->docxUsed++;
        } elseif ($this->isPptx($asset)) {
            $this->pptxUsed++;
        } elseif ($this->isZip($asset)) {
            $this->zipUsed++;
        } elseif ($this->isAudio($asset)) {
            $this->audioUsed++;
        } elseif ($asset->type === 'image') {
            $this->imageAssetsUsed++;
        }
    }

    private function trackUsage(MediaAsset $asset, $model, string $purpose): void
    {
        MediaAssetUsage::updateOrCreate(
            [
                'tenant_id' => $this->tenant->id,
                'media_asset_id' => $asset->id,
                'usable_type' => $model::class,
                'usable_id' => $model->getKey(),
                'purpose' => $purpose,
            ],
            [
                'sort_order' => 0,
                'metadata' => [],
            ]
        );

        $this->usagesTracked++;
    }

    private function countUnusedMediaAssets(): int
    {
        $usedAssetIds = MediaAssetUsage::where('tenant_id', $this->tenant->id)
            ->pluck('media_asset_id')
            ->unique()
            ->all();

        return MediaAsset::where('tenant_id', $this->tenant->id)
            ->where('status', 'ready')
            ->whereNull('archived_at')
            ->whereNotIn('id', $usedAssetIds)
            ->count();
    }
}
