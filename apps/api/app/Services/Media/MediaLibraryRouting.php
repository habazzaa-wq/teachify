<?php

namespace App\Services\Media;

use Illuminate\Validation\ValidationException;

/**
 * The tenant media library is split into two physical destinations:
 *
 * - `videos` → Bunny Stream only, videos only.
 * - `media`  → the tenant's own storage disk, everything except video.
 *
 * This class is the single backend authority for that decision. Requests from
 * older clients may omit `library`; in that case we infer it from the declared
 * type / MIME / filename so no non-video asset can ever reach Bunny.
 */
class MediaLibraryRouting
{
    public const VIDEOS = 'videos';

    public const MEDIA = 'media';

    private const VIDEO_EXTENSIONS = '/\.(mp4|webm|mov|m4v|avi|mkv|ogv)$/i';

    /** Extensions that unambiguously belong to the non-video library. */
    private const NON_VIDEO_EXTENSIONS = '/\.(jpe?g|png|gif|webp|svg|avif|bmp|ico|pdf|docx?|xlsx?|csv|pptx?|txt|rtf|md|mp3|wav|ogg|aac|zip|rar|7z|tar|gz)$/i';

    /** MIME values that carry no reliable media-type signal. */
    private const GENERIC_MIMES = [
        'application/octet-stream',
        'binary/octet-stream',
        'application/binary',
    ];

    /**
     * @return array{library: string, service: string}
     */
    public static function resolve(
        ?string $library,
        ?string $service,
        string $type,
        ?string $mime = null,
        string $filename = '',
    ): array {
        if ($library !== null && ! in_array($library, [self::VIDEOS, self::MEDIA], true)) {
            throw ValidationException::withMessages([
                'library' => ['The requested media library is invalid.'],
            ]);
        }

        if (self::hasConflictingVideoSignals($type, $mime, $filename)) {
            throw ValidationException::withMessages([
                'mime_type' => ['The file MIME type conflicts with its name or declared type.'],
            ]);
        }

        $isVideo = self::isVideoCandidate($type, $mime, $filename);

        if ($library === null) {
            $library = $isVideo ? self::VIDEOS : self::MEDIA;
        }

        if ($library === self::VIDEOS) {
            // A declared `type=video` is not proof on its own: clients can set it
            // for any file. Require a real video MIME type or a video filename so
            // images/documents cannot be disguised and sent to Bunny Stream.
            $mimeIsVideo = self::mimeIsVideo($mime);
            $extensionIsVideo = self::hasVideoExtension($filename);

            if (! $mimeIsVideo && ! $extensionIsVideo) {
                throw ValidationException::withMessages([
                    'library' => ['The video library accepts video files only.'],
                ]);
            }
        }

        if ($library === self::VIDEOS && ! $isVideo) {
            throw ValidationException::withMessages([
                'library' => ['The video library accepts video files only.'],
            ]);
        }

        if ($library === self::MEDIA && $isVideo) {
            throw ValidationException::withMessages([
                'library' => ['Videos must be uploaded through the video library.'],
            ]);
        }

        $expectedService = $library === self::VIDEOS ? 'stream' : 'storage';

        if ($service !== null && ! in_array($service, ['storage', 'stream'], true)) {
            throw ValidationException::withMessages([
                'service' => ['The requested upload service is invalid.'],
            ]);
        }

        if ($service !== null && $service !== $expectedService) {
            throw ValidationException::withMessages([
                'service' => ["The selected library requires the {$expectedService} upload service."],
            ]);
        }

        return [
            'library' => $library,
            'service' => $expectedService,
        ];
    }

    /**
     * Reject obvious attempts to disguise a non-video file as a video (or the
     * reverse) by mixing a video filename with an image/document MIME type.
     */
    private static function hasConflictingVideoSignals(string $type, ?string $mime, string $filename): bool
    {
        $mime = strtolower(trim((string) $mime));
        $declared = strtolower(trim($type));
        $mimeIsVideo = self::mimeIsVideo($mime);
        $mimeIsGeneric = $mime === '' || in_array($mime, self::GENERIC_MIMES, true);
        $typeIsVideo = $declared === 'video';
        $extensionIsVideo = self::hasVideoExtension($filename);
        $extensionIsNonVideo = self::hasNonVideoExtension($filename);

        if ($mimeIsVideo) {
            return $extensionIsNonVideo
                || ($declared !== '' && $declared !== 'file' && ! $typeIsVideo);
        }

        if ($mimeIsGeneric) {
            // Missing/generic MIME still must not let a declared image or a
            // clearly non-video filename through the video boundary.
            return ($typeIsVideo && $extensionIsNonVideo)
                || ($extensionIsVideo && $declared !== '' && $declared !== 'video' && $declared !== 'file');
        }

        return $typeIsVideo || $extensionIsVideo;
    }

    public static function isVideoCandidate(string $type, ?string $mime = null, string $filename = ''): bool
    {
        return $type === 'video'
            || self::mimeIsVideo($mime)
            || self::hasVideoExtension($filename);
    }

    private static function mimeIsVideo(?string $mime): bool
    {
        return $mime !== null && str_starts_with(strtolower(trim($mime)), 'video/');
    }

    private static function hasVideoExtension(string $filename): bool
    {
        return $filename !== '' && preg_match(self::VIDEO_EXTENSIONS, $filename) === 1;
    }

    private static function hasNonVideoExtension(string $filename): bool
    {
        return $filename !== '' && preg_match(self::NON_VIDEO_EXTENSIONS, $filename) === 1;
    }

    /** Map a non-video upload to the type used by the media library UI. */
    public static function inferNonVideoType(?string $mime, string $filename = ''): string
    {
        $mime = strtolower((string) $mime);
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

        if (str_starts_with($mime, 'image/')) {
            return 'image';
        }
        if (str_starts_with($mime, 'audio/')) {
            return 'audio';
        }
        if ($mime === 'application/pdf' || $ext === 'pdf') {
            return 'pdf';
        }
        if (str_contains($mime, 'zip') || str_contains($mime, 'compressed')
            || in_array($ext, ['zip', 'rar', '7z', 'tar', 'gz'], true)) {
            return 'zip';
        }
        if (str_contains($mime, 'presentation')
            || in_array($ext, ['ppt', 'pptx', 'key'], true)) {
            return 'presentation';
        }
        if (str_contains($mime, 'spreadsheet')
            || in_array($ext, ['xls', 'xlsx', 'csv'], true)) {
            return 'spreadsheet';
        }
        if (str_starts_with($mime, 'text/')
            || str_contains($mime, 'document')
            || in_array($ext, ['doc', 'docx', 'txt', 'rtf', 'md'], true)) {
            return 'document';
        }

        return 'file';
    }

    /**
     * Guard list/filter requests so a media-library page can never ask for
     * videos (or a video-library page for images) by tweaking query strings.
     */
    public static function assertQueryMatchesLibrary(
        ?string $library,
        mixed $type = null,
        mixed $types = null,
    ): void {
        if ($library === null) {
            return;
        }

        $candidates = [];
        if (is_string($type) && $type !== '' && $type !== 'all') {
            $candidates[] = $type;
        }
        if (is_array($types)) {
            foreach ($types as $item) {
                if (is_string($item) && $item !== '') {
                    $candidates[] = $item;
                }
            }
        }

        foreach ($candidates as $candidate) {
            $isVideo = self::isVideoCandidate($candidate);
            if ($library === self::VIDEOS && ! $isVideo) {
                throw ValidationException::withMessages([
                    'library' => ['The video library accepts video files only.'],
                ]);
            }
            if ($library === self::MEDIA && $isVideo) {
                throw ValidationException::withMessages([
                    'library' => ['Videos must be uploaded through the video library.'],
                ]);
            }
        }
    }

    /**
     * Apply the library constraint to a query. Videos and non-videos never
     * appear in the same page, metrics or recent list.
     */
    public static function applyToQuery($query, ?string $library): void
    {
        if ($library === self::VIDEOS) {
            $query->where('type', 'video');
        } elseif ($library === self::MEDIA) {
            $query->where('type', '!=', 'video');
        }
    }
}
