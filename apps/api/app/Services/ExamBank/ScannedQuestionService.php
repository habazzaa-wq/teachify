<?php

namespace App\Services\ExamBank;

use App\Models\MediaAsset;
use App\Models\Question;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\ExamBank\Scan\DocumentScanProcessor;
use App\Services\ExamBank\Scan\ScanResult;
use App\Services\Media\MediaLibraryService;
use App\Services\Media\StoragePathGenerator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
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

        return $errors;
    }

    public function processScan(Tenant $tenant, TenantUser $uploader, Question $question, UploadedFile $file, string $mode = 'auto'): MediaAsset
    {
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

            $filename = 'scan-' . Str::random(12) . '.jpg';
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
                    $oldAsset->forceFill(['status' => 'deleted'])->save();
                    $oldAsset->delete();
                }
            }

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
                $asset->delete();
            }
        });
    }

    public function replaceScan(Tenant $tenant, TenantUser $uploader, Question $question, UploadedFile $file, string $mode = 'auto'): MediaAsset
    {
        return $this->processScan($tenant, $uploader, $question, $file, $mode);
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
    //  Temp Storage
    // ════════════════════════════════════════════════════════════

    private function storeTempFile(UploadedFile $file): string
    {
        $filename = 'scan-' . Str::random(16) . '.' . ($file->getClientOriginalExtension() ?: 'jpg');
        $path = 'scan-temp/' . $filename;

        Storage::disk('local')->put($path, file_get_contents($file->getRealPath()));

        return Storage::disk('local')->path($path);
    }

    // ════════════════════════════════════════════════════════════
    //  Storage
    // ════════════════════════════════════════════════════════════

    private function storeAsset(Tenant $tenant, TenantUser $uploader, ScanResult $result, string $filename, int $sizeBytes, ?int $width, ?int $height): MediaAsset
    {
        $integration = \App\Models\TenantIntegration::query()
            ->where('tenant_id', $tenant->id)
            ->where('provider', 'bunny')
            ->where('service', 'storage')
            ->whereIn('status', ['pending', 'active'])
            ->first();
        $config = $integration?->config ?? [];

        $platform = \App\Models\PlatformBunnySetting::active();
        if ($platform && $platform->hasStorageCredentials()
            && (empty($config['upload_base_url']) || empty($config['client_upload_key']))) {
            $config = array_merge($platform->toProviderConfig('storage'), $config);
        }

        $cdnBaseUrl = rtrim((string) ($config['cdn_base_url'] ?? ''), '/');
        $accessKey = $config['client_upload_key'] ?? $config['password'] ?? null;
        $bunnyReady = $integration && $accessKey && ! empty($cdnBaseUrl);

        $storageKey = $this->pathGenerator->generate($tenant, 'assets', $filename);

        $metadata = [
            'storage_root' => 'assets',
            'scan_processed' => true,
            'scan_mode' => $result->mode,
            'scan_fallback_used' => $result->fallbackUsed,
            'scan_quality_level' => $result->quality['level'],
            'scan_stages' => $result->stages,
        ];

        if ($result->fallbackUsed && $result->fallbackReason) {
            $metadata['scan_fallback_reason'] = $result->fallbackReason;
        }

        if ($bunnyReady) {
            $uploadBase = rtrim((string) ($config['upload_base_url'] ?? ''), '/');
            $uploadUrl = "{$uploadBase}/{$storageKey}";

            $response = Http::withHeaders(array_filter([
                'AccessKey' => $accessKey,
                'Content-Type' => 'image/jpeg',
            ]))->withBody($result->bytes, 'image/jpeg')
                ->put($uploadUrl);

            if (! $response->successful()) {
                throw ValidationException::withMessages([
                    'file' => ['فشل في رفع الصورة إلى التخزين.'],
                ]);
            }

            $cdnUrl = "{$cdnBaseUrl}/{$storageKey}";

            return $this->mediaLibrary->createAsset($tenant, [
                'provider' => 'bunny',
                'provider_service' => 'storage',
                'type' => 'image',
                'status' => 'ready',
                'visibility' => 'private',
                'storage_key' => $storageKey,
                'original_filename' => $filename,
                'mime_type' => 'image/jpeg',
                'size_bytes' => $sizeBytes,
                'cdn_url' => $cdnUrl,
                'width' => $width,
                'height' => $height,
                'checksum' => hash('sha256', $result->bytes),
                'metadata' => $metadata,
            ], $uploader);
        }

        $localPath = "assets/" . basename($storageKey);
        Storage::disk('public')->put($localPath, $result->bytes);
        $cdnUrl = Storage::disk('public')->url($localPath);

        return $this->mediaLibrary->createAsset($tenant, [
            'provider' => 'local',
            'provider_service' => 'storage',
            'type' => 'image',
            'status' => 'ready',
            'visibility' => 'private',
            'storage_key' => $storageKey,
            'original_filename' => $filename,
            'mime_type' => 'image/jpeg',
            'size_bytes' => $sizeBytes,
            'cdn_url' => $cdnUrl,
            'width' => $width,
            'height' => $height,
            'checksum' => hash('sha256', $result->bytes),
            'metadata' => array_merge($metadata, ['local' => true]),
        ], $uploader);
    }
}
