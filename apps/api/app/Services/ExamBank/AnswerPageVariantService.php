<?php

namespace App\Services\ExamBank;

use App\Models\MediaAsset;
use App\Models\MediaAssetVariant;
use App\Services\Media\MediaLibraryService;
use App\Services\Media\Providers\BunnyStorageProvider;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Http;
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
 * Reuses the existing pattern seams instead of inventing new ones:
 *  - MediaAssetVariant rows are persisted through MediaLibraryService::createVariant()
 *    (app/Services/Media/MediaLibraryService.php:82).
 *  - Image work uses raw GD exactly like the exam document scanner
 *    (DocumentScanProcessor: decode/alpha-flatten = lines 424-445,
 *    bounded resize = lines 479-498, JPEG encode = lines 1991-2002). No new
 *    image-processing dependency is added.
 *  - Byte reads/writes use the SAME per-tenant Bunny Storage credential path and
 *    URL mechanics as the Phase C read endpoint (ExamAnswerPageReadController::
 *    streamAsset, lines 161-191) and the B2 upload intent (ExamAnswerPageUploadService::
 *    buildIntent, lines 449-474).
 *
 * Idempotency: before writing any variant the service checks whether a
 * MediaAssetVariant of that (tenant, asset, type) already exists and skips it —
 * a duplicate dispatch or a retry can never double-generate. The UNIQUE index
 * (tenant_id, media_asset_id, type) added in migration
 * 2026_09_09_000001 makes that guarantee database-level as well: a lost race
 * between the pre-check and the insert surfaces as a unique-constraint
 * violation, which the service catches and treats as "variant already exists"
 * rather than a job failure. Failure behavior: missing variants are simply
 * absent rows, and the Phase C read endpoint always serves the original, so a
 * processing failure never affects answer/page usability.
 */
class AnswerPageVariantService
{
    public function __construct(
        private readonly MediaLibraryService $media,
        private readonly BunnyStorageProvider $storage,
    ) {}

    /**
     * Generate (or confirm already-generated) variants for one asset. No-op for
     * missing assets and for anything that is not a ready, private Bunny Storage
     * image with a storage key — the exact guard shape the Phase C read endpoint
     * applies before streaming (ExamAnswerPageReadController::streamAsset).
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

        $config = $this->storage->configForTenant($tenantId);

        $original = $this->fetchOriginal($config, $asset);
        $sourceChecksum = hash('sha256', $original);

        $source = $this->decode($original);

        try {
            foreach ($this->variants() as $type => $spec) {
                // Idempotency guard: a duplicate dispatch / retry must never
                // produce a second variant row of the same type.
                if ($this->hasVariant($asset, $type)) {
                    continue;
                }

                try {
                    $this->storeVariant($tenantId, $asset, $type, $spec, $source, $sourceChecksum, $config);
                } catch (QueryException $e) {
                    // Lost-race recovery: a concurrent worker created the same
                    // (tenant, asset, type) row between the pre-check above and
                    // this insert (enforced by the UNIQUE index added in
                    // 2026_09_09_000001). Treat it as "variant already exists"
                    // — never a job failure. Verified the winning row is really
                    // there before swallowing the exception.
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

    /**
     * @param  array<string, mixed>  $config
     */
    private function fetchOriginal(array $config, MediaAsset $asset): string
    {
        $url = rtrim((string) ($config['upload_base_url'] ?? ''), '/')
            .'/'.ltrim((string) $asset->storage_key, '/');

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
     * @param  array<string, mixed>  $config
     */
    private function storeVariant(
        int $tenantId,
        MediaAsset $asset,
        string $type,
        array $spec,
        \GdImage $source,
        string $sourceChecksum,
        array $config,
    ): void {
        [$bytes, $width, $height] = $this->makeVariant($source, $spec['max_dimension'], $spec['jpeg_quality']);

        $storageKey = $this->variantStorageKey($asset, $type);

        $this->uploadVariant($config, $storageKey, $bytes);

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

    /**
     * @param  array<string, mixed>  $config
     */
    private function uploadVariant(array $config, string $storageKey, string $bytes): void
    {
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
        return $asset->provider === 'bunny'
            && $asset->provider_service === 'storage'
            && $asset->status === 'ready'
            && $asset->type === 'image'
            && filled($asset->storage_key);
    }

    private function hasVariant(MediaAsset $asset, string $type): bool
    {
        return MediaAssetVariant::query()
            ->where('tenant_id', $asset->tenant_id)
            ->where('media_asset_id', $asset->id)
            ->where('type', $type)
            ->exists();
    }

    /**
     * True when the query exception is a uniqueness violation on the
     * (tenant_id, media_asset_id, type) index. SQLite reports 23000, MySQL
     * reports 23000/1062, Postgres reports 23505 — checked alongside the
     * vendor message text so the behavior is connection-agnostic.
     */
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

    /**
     * Decode the original bytes, promoting palette images to truecolor and
     * flattening any alpha to white so the JPEG output never carries a black
     * backdrop. Mirrors DocumentScanProcessor::decodeAndOrient
     * (app/Services/ExamBank/Scan/DocumentScanProcessor.php:424-461) minus EXIF
     * rotation, which the answer-page upload flow never captures.
     */
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
     * Produce one variant. Bounded downscale (DocumentScanProcessor::
     * resizeWithinBounds convention, lines 479-498) followed by a JPEG encode
     * (encodeJpeg convention, lines 1991-2002). The source image is never
     * mutated or destroyed here.
     *
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

        // A 256px thumbnail can legitimately land just under the scanner's
        // 1024-byte guard, hence the smaller floor here.
        if (! $success || $data === false || strlen($data) < 128) {
            throw new RuntimeException('JPEG encoding failed.');
        }

        return $data;
    }
}
