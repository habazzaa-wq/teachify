<?php

namespace Tests\Support;

use App\Services\Bunny\Contracts\BunnyStorageInterface;

/**
 * BunnyStorageInterface fake: records every getMetadata/deleteFile call and
 * reports the object as present, so confirm flows pass their real existence
 * check and delete flows record their purge target without any network access.
 */
final class FakeBunnyStorage implements BunnyStorageInterface
{
    /** @var list<string> */
    public array $metadataCalls = [];

    /** @var list<string> */
    public array $deleteCalls = [];

    public function createFolder(string $path): array
    {
        return ['status' => 201];
    }

    public function deleteFolder(string $path): array
    {
        return ['status' => 200];
    }

    public function renameFolder(string $oldPath, string $newPath): array
    {
        return ['status' => 200];
    }

    public function listFolders(string $path): array
    {
        return ['status' => 200, 'data' => []];
    }

    public function uploadFile(string $path, $contents, array $options = []): array
    {
        return ['status' => 201];
    }

    public function deleteFile(string $path): array
    {
        $this->deleteCalls[] = $path;

        return ['status' => 200];
    }

    public function renameFile(string $oldPath, string $newPath): array
    {
        return ['status' => 200];
    }

    public function moveFile(string $source, string $destination): array
    {
        return ['status' => 200];
    }

    public function copyFile(string $source, string $destination): array
    {
        return ['status' => 200];
    }

    public function getFile(string $path): array
    {
        return ['status' => 200, 'content' => 'PNG-BYTES'];
    }

    public function getMetadata(string $path): array
    {
        $this->metadataCalls[] = $path;

        return ['status' => 200, 'headers' => ['Content-Type' => 'image/jpeg', 'Content-Length' => '2048']];
    }

    public function generatePublicUrl(string $path): string
    {
        return "https://cdn.example.test/{$path}";
    }

    public function generateSignedUrl(string $path, array $options = []): string
    {
        return "https://cdn.example.test/{$path}?token=x";
    }

    public function validateChecksum(string $path, string $checksum): bool
    {
        return true;
    }

    public function detectDuplicate(string $checksum, ?int $sizeBytes = null): ?array
    {
        return null;
    }

    public function prepareChunkUpload(string $path, int $totalSize, array $options = []): array
    {
        return ['status' => 200];
    }

    public function prepareResumeUpload(string $path, array $options = []): array
    {
        return ['status' => 200];
    }

    public function retryFailedUpload(string $path, array $options = []): array
    {
        return ['status' => 200];
    }
}
