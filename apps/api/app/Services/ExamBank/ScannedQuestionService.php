<?php

namespace App\Services\ExamBank;

use App\Models\MediaAsset;
use App\Models\Question;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\ExamBank\Scan\DocumentScanProcessor;
use App\Services\ExamBank\Scan\ScanResult;
use App\Services\Media\MediaLibraryService;
use App\Services\Media\MediaStorage;
use App\Services\Media\StoragePathGenerator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ScannedQuestionService
{
    private const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    private const MAX_FILE_SIZE = 10 * 1024 * 1024;

    public function __construct(
        private readonly MediaLibraryService $mediaLibrary,
        private readonly StoragePathGenerator $pathGenerator,
        private readonly DocumentScanProcessor $processor,
        private readonly QuestionService $questions,
        private readonly MediaStorage $mediaStorage = new MediaStorage,
    ) {}

    public function validateUpload(UploadedFile $file): array
    {
        $errors = [];

        if (! in_array($file->getMimeType(), self::ALLOWED_MIME_TYPES, true)) {
            $errors['file'] = 'نوع الملف غير مدعوم. يُسمح فقط بصيغ JPEG و PNG و WebP.';

            return $errors;
        }

        if ($file->getSize() > self::MAX_FILE_SIZE) {
            $errors['file'] = 'حجم الملف يتجاوز الحد الأقصى المسموح (10 ميجابايت).';

            return $errors;
        }

        $contents = file_get_contents($file->getRealPath());
        if ($contents === false) {
            $errors['file'] = 'لا يمكن قراءة الملف المرفوع.';

            return $errors;
        }

        $imageInfo = @getimagesizefromstring($contents);
        if ($imageInfo === false) {
            $errors['file'] = 'الملف المرفوع ليس صورة صالحة.';

            return $errors;
        }

        // Pixel-budget ceiling: reject images whose pixel count would force the
        // processor to decode more than the configured maximum. Rejected before
        // any full GD decode to avoid decompression bombs.
        $maxPixels = (int) config('scanner.max_pixels', 25000000);
        $pixelCount = (int) ($imageInfo[0] ?? 0) * (int) ($imageInfo[1] ?? 0);
        if ($maxPixels > 0 && $pixelCount > $maxPixels) {
            $errors['file'] = 'دقة الصورة تتجاوز الحد الأقصى المسموح. يرجى استخدام صورة أصغر.';

            return $errors;
        }

        return $errors;
    }

    public function processScan(Tenant $tenant, TenantUser $uploader, Question $question, UploadedFile $file, string $mode = 'auto'): MediaAsset
    {
        $errors = $this->validateUpload($file);
        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        $tempFile = $this->storeTempFile($file);

        try {
            $imageData = file_get_contents($tempFile);
            if ($imageData === false) {
                throw ValidationException::withMessages([
                    'file' => ['لا يمكن قراءة الملف المرفوع.'],
                ]);
            }

            $exifOrientation = $this->readExifOrientation($tempFile, $file->getMimeType());

            $result = $this->processor->process($imageData, $mode, $exifOrientation);

            $dimensions = @getimagesizefromstring($result->bytes);
            $width = $dimensions ? $dimensions[0] : null;
            $height = $dimensions ? $dimensions[1] : null;

            $filename = 'scan-'.Str::random(12).'.'.$result->extension;
            $asset = $this->storeAsset($tenant, $uploader, $result, $filename, strlen($result->bytes), $width, $height);

            $previousAssetId = $question->media_asset_id;

            DB::transaction(function () use ($question, $asset): void {
                $question->forceFill([
                    'media_asset_id' => $asset->id,
                    'question_format' => 'image',
                ])->save();
            });

            if ($previousAssetId !== null && $previousAssetId !== $asset->id) {
                $oldAsset = MediaAsset::find($previousAssetId);
                if ($oldAsset) {
                    $this->disposeAsset($oldAsset);
                }
            }

            // The question's rendered content changed (new scan): invalidate the
            // published exam question-set cache now that the mutation committed.
            $this->questions->bumpExamsForQuestion($question);

            return $asset->refresh();
        } finally {
            if (file_exists($tempFile)) {
                @unlink($tempFile);
            }
        }
    }

    public function unlinkScan(Question $question): void
    {
        if ($question->media_asset_id === null) {
            return;
        }

        $asset = MediaAsset::find($question->media_asset_id);

        DB::transaction(function () use ($question, $asset): void {
            $question->forceFill([
                'media_asset_id' => null,
                'question_format' => 'text',
            ])->save();

            if ($asset) {
                $asset->forceFill(['status' => 'deleted'])->save();
            }
        });

        if ($asset) {
            $this->disposeAsset($asset);
        }

        // The question's rendered content changed (scan removed): invalidate the
        // published exam question-set cache now that the mutation committed.
        $this->questions->bumpExamsForQuestion($question);
    }

    public function replaceScan(Tenant $tenant, TenantUser $uploader, Question $question, UploadedFile $file, string $mode = 'auto'): MediaAsset
    {
        return $this->processScan($tenant, $uploader, $question, $file, $mode);
    }

    /**
     * Purge the attached scan binary when its question is deleted.
     *
     * Only new-style scan assets (a tenant-namespaced local storage key that
     * this flow owns) are disposed, so legacy image assets referenced purely
     * by a remote `cdn_url` (or a legacy non-namespaced key) are never touched.
     * The media row is soft-deleted and its storage purged, mirroring the
     * replace/remove path, so old references degrade gracefully instead of
     * 404ing and no new binary is leaked.
     */
    public function disposeForDeletedQuestion(Question $question): void
    {
        if ($question->media_asset_id === null) {
            return;
        }

        $asset = MediaAsset::find($question->media_asset_id);

        if ($asset === null || $asset->trashed() || $asset->storage_key === null) {
            return;
        }

        $namespace = "tenants/{$question->tenant_id}/assets/";
        if (! str_starts_with((string) $asset->storage_key, $namespace)) {
            return;
        }

        $this->disposeAsset($asset);
    }

    // ════════════════════════════════════════════════════════════
    //  EXIF
    // ════════════════════════════════════════════════════════════

    private function readExifOrientation(string $filePath, string $mimeType): ?int
    {
        if ($mimeType !== 'image/jpeg') {
            return null;
        }

        $exif = @exif_read_data($filePath);
        if ($exif === false || ! isset($exif['Orientation'])) {
            return null;
        }

        $orientation = (int) $exif['Orientation'];

        return in_array($orientation, [3, 6, 8], true) ? $orientation : null;
    }

    // ════════════════════════════════════════════════════════════
    //  Disposal
    // ════════════════════════════════════════════════════════════

    /**
     * Marks the scan asset as deleted and removes its stored file. The asset
     * row is kept (soft-deleted) so past attempts keep a resolvable URL long
     * enough for any in-flight review to render; the object is purged from
     * media storage so replaced/removed scans never leak disk space.
     *
     * Idempotent: a soft-deleted asset with a cleared storage key is skipped.
     */
    private function disposeAsset(MediaAsset $asset): void
    {
        if ($asset->trashed() || $asset->storage_key === null) {
            return;
        }

        if ($asset->provider === 'local') {
            $this->mediaStorage->delete($asset->storage_key);

            // Legacy safety: scans written before tenant-scoped paths stripped
            // the tenant prefix and lived at "assets/{basename}". Also purge
            // that location so replaced/removed legacy scans do not leak.
            $legacyPath = 'assets/'.basename((string) $asset->storage_key);
            if ($legacyPath !== $asset->storage_key) {
                $this->mediaStorage->delete($legacyPath);
            }
        } else {
            Log::channel('bunny')->warning('Scan asset disposal disabled for remote provider', [
                'asset_id' => $asset->id,
                'provider' => $asset->provider,
                'storage_key' => $asset->storage_key,
            ]);
        }

        $asset->forceFill([
            'status' => 'deleted',
            'storage_key' => null,
            'cdn_url' => null,
        ])->save();
        $asset->delete();
    }

    // ════════════════════════════════════════════════════════════
    //  Temp Storage
    // ════════════════════════════════════════════════════════════

    private function storeTempFile(UploadedFile $file): string
    {
        $filename = 'scan-'.Str::random(16).'.'.($file->getClientOriginalExtension() ?: 'jpg');
        $path = 'scan-temp/'.$filename;

        Storage::disk('local')->put($path, file_get_contents($file->getRealPath()));

        return Storage::disk('local')->path($path);
    }

    // ════════════════════════════════════════════════════════════
    //  Storage
    // ════════════════════════════════════════════════════════════

    private function storeAsset(Tenant $tenant, TenantUser $uploader, ScanResult $result, string $filename, int $sizeBytes, ?int $width, ?int $height): MediaAsset
    {
        $storageKey = $this->pathGenerator->generate($tenant, 'assets', $filename);

        $mimeType = $result->mimeType;

        $metadata = [
            'storage_root' => 'assets',
            'scan_processed' => true,
            'scan_mode' => $result->mode,
            'scan_original_preserved' => $result->originalPreserved,
            'scan_fallback_used' => $result->fallbackUsed,
            'scan_quality_level' => $result->quality['level'],
            'scan_stages' => $result->stages,
        ];

        if ($result->fallbackUsed && $result->fallbackReason) {
            $metadata['scan_fallback_reason'] = $result->fallbackReason;
        }

        $this->mediaStorage->put($storageKey, $result->bytes);
        $cdnUrl = $this->mediaStorage->url($storageKey);

        return $this->mediaLibrary->createAsset($tenant, [
            'provider' => 'local',
            'provider_service' => 'storage',
            'type' => 'image',
            'status' => 'ready',
            'visibility' => 'private',
            'storage_key' => $storageKey,
            'original_filename' => basename($storageKey),
            'mime_type' => $mimeType,
            'size_bytes' => $sizeBytes,
            'cdn_url' => $cdnUrl,
            'width' => $width,
            'height' => $height,
            'checksum' => hash('sha256', $result->bytes),
            'metadata' => array_merge($metadata, ['local' => true]),
        ], $uploader);
    }
}
