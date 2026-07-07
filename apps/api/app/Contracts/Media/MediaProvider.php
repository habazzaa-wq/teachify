<?php

namespace App\Contracts\Media;

use App\Models\MediaAsset;
use App\Models\MediaAssetVariant;
use App\Models\MediaUploadSession;

interface MediaProvider
{
    /**
     * @param array<string, mixed> $options
     * @return array<string, mixed>
     */
    public function createUploadIntent(MediaUploadSession $session, array $options = []): array;

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function confirmUpload(MediaUploadSession $session, array $payload = []): array;

    /**
     * @return array<string, mixed>
     */
    public function getAssetStatus(MediaAsset $asset): array;

    /**
     * @param array<string, mixed> $options
     * @return array<string, mixed>
     */
    public function createSignedReadUrl(MediaAsset $asset, array $options = []): array;

    /**
     * @return array<string, mixed>
     */
    public function deleteAsset(MediaAsset $asset): array;

    /**
     * @param array<string, mixed> $options
     * @return array<string, mixed>
     */
    public function createVariant(MediaAsset $asset, string $type, array $options = []): MediaAssetVariant|array;

    /**
     * @return array<string, mixed>
     */
    public function getPlaybackData(MediaAsset $asset): array;
}
