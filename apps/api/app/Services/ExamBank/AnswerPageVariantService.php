<?php

namespace App\Services\ExamBank;

use App\Models\MediaAsset;
use App\Models\MediaAssetVariant;
use App\Services\Media\MediaLibraryService;
use App\Services\Media\MediaStorage;
use App\Services\Media\Providers\BunnyStorageProvider;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;
use RuntimeException;

/**
 * Background generation of optimized + thumbnail variants for one confirmed
 * exam answer page (Phase F).
 *
 * The original image and its MediaAsset row are never written by this service:
 * the byte flow is a read of the original storage key followed by writes to NEW
 * variant-only keys (`{dir}/{stem}.{type}.jpg`) and new MediaAssetVariant rows.
 *
 * Variants are stored on the same storage backend as the original asset:
 * local tenant-isolated disk for local/storage assets, Bunny storage for legacy
 * Bunny assets.
 */
class AnswerPageVariantService
{
    public function __construct(
        private readonly MediaLibraryService $media,
        private readonly MediaStorage $storage,
        private readonly BunnyStorageProvider $bunnyStorage,
    ) {}

    /**
     * Generate (or confirm already-generated) variants for one asset.
     */
    public function generateForAsset(int $tenantId, int $assetId): void
    {
        $asset = MediaAsset::withoutGlobalScopes()
            ->where('id', $assetId)
            ->where('tenant_id', $tenantId)
            ->first();

        if ($asset === null || ! $this->isProcessable($asset)) {
            return;
        }

        $original = $this->fetchOriginal($asset);
        $sourceChecksum = hash('sha256', $original);

        $source = $this->decode($original);

        try {
            foreach ($this->variants() as $type => $spec) {
                if ($this->hasVariant($asset, $type)) {
                    continue;
                }

                try {
                    $this->storeVariant($tenantId, $asset, $type, $spec, $source, $sourceChecksum);
                } catch (QueryException $e) {
                    if ($this->isUniqueViolation($e) && $this->hasVariant($asset, $type)) {
                        continue;
                    }

                    throw $e;
                }
            }
        } finally {
            imagedestroy($source);
        }
    }

    private function fetchOriginal(MediaAsset $asset): string
    {
        $storageKey = (string) $asset->storage_key;
        if ($storageKey === '') {
            throw new RuntimeException('Answer page asset has no storage key.');
        }

        if ($this->isLocalAsset($asset)) {
            $disk = $this->storage->diskName();
            $fs = Storage::disk($disk);
            if (! $fs->exists($storageKey) && $disk !== 'public' && Storage::disk('public')->exists($storageKey)) {
                $fs = Storage::disk('public');
            }

            if (! $fs->exists($storageKey)) {
                throw new RuntimeException('Answer page file was not found on local storage.');
            }

            $bytes = $fs->get($storageKey);
            if (! is_string($bytes) || $bytes === '') {
                throw new RuntimeException('Answer page file could not be read from local storage.');
            }

            return $bytes;
        }

        $config = $this->bunnyStorage->configForTenant((int) $asset->tenant_id);
        $url = rtrim((string) ($config['upload_base_url'] ?? ''), '/')
            .'/'.ltrim($storageKey, '/');

        $response = Http::timeout(60)
            ->withHeaders([
                'AccessKey' => $config['client_upload_key'] ?? null,
            ])
            ->get($url);

        if (! $response->successful()) {
            throw new RuntimeException("Answer page fetch from storage failed (HTTP {$response->status()}).");
        }

        return $response->body();
    }

    /**
     * @param  array{max_dimension: int, jpeg_quality: int}  $spec
     */
    private function storeVariant(
        int $tenantId,
        MediaAsset $asset,
        string $type,
        array $spec,
        \GdImage $source,
        string $sourceChecksum,
    ): void {
        [$bytes, $width, $height] = $this->makeVariant($source, $spec['max_dimension'], $spec['jpeg_quality']);

        $storageKey = $this->variantStorageKey($asset, $type);

        $this->uploadVariant($asset, $storageKey, $bytes);

        $this->media->createVariant($asset, [
            'type' => $type,
            'status' => 'ready',
            'storage_key' => $storageKey,
            'mime_type' => 'image/jpeg',
            'size_bytes' => strlen($bytes),
            'width' => $width,
            'height' => $height,
            'metadata' => [
                'source' => 'exam_answer_page_variant',
                'tenant_id' => (string) $tenantId,
                'source_storage_key' => $asset->storage_key,
                'source_checksum' => $sourceChecksum,
                'format' => 'jpeg',
            ],
        ]);
    }

    private function uploadVariant(MediaAsset $asset, string $storageKey, string $bytes): void
    {
        if ($this->isLocalAsset($asset)) {
            Storage::disk($this->storage->diskName())->put($storageKey, $bytes);

            return;
        }

        $config = $this->bunnyStorage->configForTenant((int) $asset->tenant_id);
        $url = rtrim((string) ($config['upload_base_url'] ?? ''), '/')
            .'/'.ltrim($storageKey, '/');

        $response = Http::timeout(120)
            ->withHeaders([
                'AccessKey' => $config['client_upload_key'] ?? null,
                'Content-Type' => 'image/jpeg',
            ])
            ->withBody($bytes, 'image/jpeg')
            ->put($url);

        if (! $response->successful()) {
            throw new RuntimeException("Variant upload to storage failed (HTTP {$response->status()}).");
        }
    }

    private function isProcessable(MediaAsset $asset): bool
    {
        $isSupportedProvider = ($asset->provider === 'local' && $asset->provider_service === 'storage')
            || ($asset->provider === 'bunny' && $asset->provider_service === 'storage');

        return $isSupportedProvider
            && $asset->status === 'ready'
            && $asset->type === 'image'
            && filled($asset->storage_key);
    }

    private function isLocalAsset(MediaAsset $asset): bool
    {
        return $asset->provider === 'local' && $asset->provider_service === 'storage';
    }

    private function hasVariant(MediaAsset $asset, string $type): bool
    {
        return MediaAssetVariant::query()
            ->where('tenant_id', $asset->tenant_id)
            ->where('media_asset_id', $asset->id)
            ->where('type', $type)
            ->exists();
    }

    private function isUniqueViolation(QueryException $e): bool
    {
        $code = (string) $e->getCode();
        $message = strtolower($e->getMessage());

        return $code === '23000'
            || $code === '23505'
            || str_contains($message, 'unique constraint failed')
            || str_contains($message, 'duplicate entry')
            || str_contains($message, 'duplicate key');
    }

    private function variantStorageKey(MediaAsset $asset, string $type): string
    {
        return dirname((string) $asset->storage_key)
            .'/'.pathinfo((string) $asset->storage_key, PATHINFO_FILENAME)
            .'.'.$type.'.jpg';
    }

    /**
     * @return array<string, array{max_dimension: int, jpeg_quality: int}>
     */
    private function variants(): array
    {
        return [
            'optimized' => [
                'max_dimension' => max(512, (int) config('exam_answer_pages.optimized_max_dimension', 2000)),
                'jpeg_quality' => min(95, max(60, (int) config('exam_answer_pages.optimized_jpeg_quality', 85))),
            ],
            'thumbnail' => [
                'max_dimension' => max(64, (int) config('exam_answer_pages.thumbnail_max_dimension', 256)),
                'jpeg_quality' => min(95, max(50, (int) config('exam_answer_pages.thumbnail_jpeg_quality', 75))),
            ],
        ];
    }

    private function decode(string $bytes): \GdImage
    {
        $src = @imagecreatefromstring($bytes);
        if ($src === false) {
            throw new InvalidArgumentException('Unable to decode the answer page image.');
        }

        if (! imageistruecolor($src)) {
            $truecolor = imagecreatetruecolor(imagesx($src), imagesy($src));
            imagecopy($truecolor, $src, 0, 0, 0, 0, imagesx($src), imagesy($src));
            imagedestroy($src);
            $src = $truecolor;
        }

        if ($this->hasMeaningfulAlpha($src)) {
            $flat = imagecreatetruecolor(imagesx($src), imagesy($src));
            imagealphablending($flat, true);
            imagefill($flat, 0, 0, imagecolorallocate($flat, 255, 255, 255));
            imagecopy($flat, $src, 0, 0, 0, 0, imagesx($src), imagesy($src));
            imagedestroy($src);
            $src = $flat;
        }

        return $src;
    }

    private function hasMeaningfulAlpha(\GdImage $img): bool
    {
        $w = imagesx($img);
        $h = imagesy($img);
        $step = max(1, (int) floor(min($w, $h) / 128));

        for ($y = 0; $y < $h; $y += $step) {
            for ($x = 0; $x < $w; $x += $step) {
                $rgba = imagecolorat($img, $x, $y);
                if ((($rgba >> 24) & 0x7F) > 8) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * @return array{0: string, 1: int, 2: int} [bytes, width, height]
     */
    private function makeVariant(\GdImage $source, int $maxDimension, int $quality): array
    {
        $w = imagesx($source);
        $h = imagesy($source);

        if ($w > $maxDimension || $h > $maxDimension) {
            $scale = max($w, $h) > 0 ? $maxDimension / max($w, $h) : 1.0;
            $newW = max(1, (int) round($w * $scale));
            $newH = max(1, (int) round($h * $scale));

            $resized = imagecreatetruecolor($newW, $newH);
            imagefill($resized, 0, 0, imagecolorallocate($resized, 255, 255, 255));
            imagecopyresampled($resized, $source, 0, 0, 0, 0, $newW, $newH, $w, $h);

            $bytes = $this->encodeJpeg($resized, $quality);
            imagedestroy($resized);

            return [$bytes, $newW, $newH];
        }

        return [$this->encodeJpeg($source, $quality), $w, $h];
    }

    private function encodeJpeg(\GdImage $image, int $quality): string
    {
        ob_start();
        $success = imagejpeg($image, null, $quality);
        $data = ob_get_clean();

        if (! $success || $data === false || strlen($data) < 128) {
            throw new RuntimeException('JPEG encoding failed.');
        }

        return $data;
    }
}