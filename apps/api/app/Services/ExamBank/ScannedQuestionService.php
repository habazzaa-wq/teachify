<?php

namespace App\Services\ExamBank;

use App\Models\MediaAsset;
use App\Models\Question;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Media\MediaLibraryService;
use App\Services\Media\StoragePathGenerator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ScannedQuestionService
{
    private const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    private const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private const MAX_DIMENSION = 2400;
    private const JPEG_QUALITY = 85;
    private const WHITE_THRESHOLD = 240;
    private const CONTENT_MARGIN_PX = 20;

    public function __construct(
        private readonly MediaLibraryService $mediaLibrary,
        private readonly StoragePathGenerator $pathGenerator,
    ) {}

    /**
     * @return array<string, string>
     */
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

    public function processScan(Tenant $tenant, TenantUser $uploader, Question $question, UploadedFile $file): MediaAsset
    {
        $tempPath = $file->getRealPath();
        $tempFile = $this->storeTempFile($file);

        try {
            $imageData = file_get_contents($tempFile);
            if ($imageData === false) {
                throw ValidationException::withMessages([
                    'file' => ['لا يمكن قراءة الملف المرفوع.'],
                ]);
            }

            $gdImage = $this->loadImageFromData($imageData, $file->getMimeType());
            if ($gdImage === false) {
                throw ValidationException::withMessages([
                    'file' => ['فشل في تحميل الصورة. تأكد من أن الملف غير تالف.'],
                ]);
            }

            $gdImage = $this->autoOrient($gdImage, $tempFile, $file->getMimeType());
            $gdImage = $this->cropToContent($gdImage);
            $gdImage = $this->enhanceForReadability($gdImage);
            $gdImage = $this->resizeIfTooLarge($gdImage);

            $processedData = $this->encodeToJpeg($gdImage);
            imagedestroy($gdImage);

            if ($processedData === false) {
                throw ValidationException::withMessages([
                    'file' => ['فشل في معالجة الصورة.'],
                ]);
            }

            $dimensions = @getimagesizefromstring($processedData);
            $width = $dimensions ? $dimensions[0] : null;
            $height = $dimensions ? $dimensions[1] : null;

            $filename = 'scan-' . Str::random(12) . '.jpg';
            $asset = $this->storeAsset($tenant, $uploader, $processedData, $filename, strlen($processedData), $width, $height);

            DB::transaction(function () use ($question, $asset): void {
                $question->forceFill([
                    'media_asset_id' => $asset->id,
                    'question_format' => 'image',
                ])->save();
            });

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

    public function replaceScan(Tenant $tenant, TenantUser $uploader, Question $question, UploadedFile $file): MediaAsset
    {
        $this->unlinkScan($question);

        return $this->processScan($tenant, $uploader, $question, $file);
    }

    private function storeTempFile(UploadedFile $file): string
    {
        $filename = 'scan-' . Str::random(16) . '.' . ($file->getClientOriginalExtension() ?: 'jpg');
        $path = 'scan-temp/' . $filename;

        Storage::disk('local')->put($path, file_get_contents($file->getRealPath()));

        return Storage::disk('local')->path($path);
    }

    private function loadImageFromData(string $data, string $mimeType): \GdImage|false
    {
        $gdImage = match ($mimeType) {
            'image/jpeg' => @imagecreatefromstring($data),
            'image/png' => @imagecreatefromstring($data),
            'image/webp' => @imagecreatefromstring($data),
            default => false,
        };

        return $gdImage;
    }

    private function autoOrient(\GdImage $image, string $filePath, string $mimeType): \GdImage
    {
        if ($mimeType !== 'image/jpeg') {
            return $image;
        }

        $exif = @exif_read_data($filePath);
        if ($exif === false || ! isset($exif['Orientation'])) {
            return $image;
        }

        $orientation = $exif['Orientation'];

        return match ($orientation) {
            3 => $this->rotateImage($image, 180),
            6 => $this->rotateImage($image, 270),
            8 => $this->rotateImage($image, 90),
            default => $image,
        };
    }

    private function rotateImage(\GdImage $image, int $degrees): \GdImage
    {
        $rotated = @imagerotate($image, $degrees, 0);
        imagedestroy($image);

        return $rotated ?: $image;
    }

    private function cropToContent(\GdImage $image): \GdImage
    {
        $width = imagesx($image);
        $height = imagesy($image);

        if ($width === false || $height === false) {
            return $image;
        }

        $bounds = $this->findContentBounds($image, $width, $height);

        if ($bounds === null) {
            return $image;
        }

        $cropX = max(0, $bounds['left'] - self::CONTENT_MARGIN_PX);
        $cropY = max(0, $bounds['top'] - self::CONTENT_MARGIN_PX);
        $cropWidth = min($width - $cropX, $bounds['right'] - $bounds['left'] + self::CONTENT_MARGIN_PX * 2);
        $cropHeight = min($height - $cropY, $bounds['bottom'] - $bounds['top'] + self::CONTENT_MARGIN_PX * 2);

        if ($cropWidth < 1 || $cropHeight < 1) {
            return $image;
        }

        if ($cropX === 0 && $cropY === 0 && $cropWidth === $width && $cropHeight === $height) {
            return $image;
        }

        $cropped = imagecreatetruecolor($cropWidth, $cropHeight);
        if ($cropped === false) {
            return $image;
        }

        imagecopy($cropped, $image, 0, 0, $cropX, $cropY, $cropWidth, $cropHeight);
        imagedestroy($image);

        return $cropped;
    }

    private function findContentBounds(\GdImage $image, int $width, int $height): ?array
    {
        $top = null;
        $bottom = null;
        $left = null;
        $right = null;

        $step = max(1, (int) floor(min($width, $height) / 200));

        for ($y = 0; $y < $height; $y += $step) {
            for ($x = 0; $x < $width; $x += $step) {
                $rgb = imagecolorat($image, $x, $y);
                if ($rgb === false) {
                    continue;
                }

                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;

                $brightness = (int) (($r * 0.299) + ($g * 0.587) + ($b * 0.114));

                if ($brightness < self::WHITE_THRESHOLD) {
                    if ($top === null || $y < $top) {
                        $top = $y;
                    }
                    if ($bottom === null || $y > $bottom) {
                        $bottom = $y;
                    }
                    if ($left === null || $x < $left) {
                        $left = $x;
                    }
                    if ($right === null || $x > $right) {
                        $right = $x;
                    }
                }
            }
        }

        if ($top === null || $bottom === null || $left === null || $right === null) {
            return null;
        }

        return [
            'top' => $top,
            'bottom' => $bottom,
            'left' => $left,
            'right' => $right,
        ];
    }

    private function enhanceForReadability(\GdImage $image): \GdImage
    {
        $width = imagesx($image);
        $height = imagesy($image);

        if ($width === false || $height === false) {
            return $image;
        }

        imagefilter($image, IMG_FILTER_CONTRAST, 15);
        imagefilter($image, IMG_FILTER_BRIGHTNESS, 5);

        return $image;
    }

    private function resizeIfTooLarge(\GdImage $image): \GdImage
    {
        $width = imagesx($image);
        $height = imagesy($image);

        if ($width === false || $height === false) {
            return $image;
        }

        if ($width <= self::MAX_DIMENSION && $height <= self::MAX_DIMENSION) {
            return $image;
        }

        if ($width >= $height) {
            $newWidth = self::MAX_DIMENSION;
            $newHeight = (int) round($height * (self::MAX_DIMENSION / $width));
        } else {
            $newHeight = self::MAX_DIMENSION;
            $newWidth = (int) round($width * (self::MAX_DIMENSION / $height));
        }

        if ($newWidth < 1 || $newHeight < 1) {
            return $image;
        }

        $resized = imagecreatetruecolor($newWidth, $newHeight);
        if ($resized === false) {
            return $image;
        }

        imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        imagedestroy($image);

        return $resized;
    }

    private function encodeToJpeg(\GdImage $image): string|false
    {
        ob_start();
        $success = imagejpeg($image, null, self::JPEG_QUALITY);
        $data = ob_get_clean();

        if (! $success || $data === false) {
            return false;
        }

        return $data;
    }

    private function storeAsset(Tenant $tenant, TenantUser $uploader, string $imageData, string $filename, int $sizeBytes, ?int $width, ?int $height): MediaAsset
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

        if ($bunnyReady) {
            $uploadBase = rtrim((string) ($config['upload_base_url'] ?? ''), '/');
            $uploadUrl = "{$uploadBase}/{$storageKey}";

            $response = Http::withHeaders(array_filter([
                'AccessKey' => $accessKey,
                'Content-Type' => 'image/jpeg',
            ]))->withBody($imageData, 'image/jpeg')
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
                'metadata' => [
                    'storage_root' => 'assets',
                    'scan_processed' => true,
                ],
            ], $uploader);
        }

        $localPath = "assets/" . basename($storageKey);
        Storage::disk('public')->put($localPath, $imageData);
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
            'metadata' => [
                'storage_root' => 'assets',
                'scan_processed' => true,
                'local' => true,
            ],
        ], $uploader);
    }
}
