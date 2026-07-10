<?php

namespace App\Services\Bunny\Contracts;

interface BunnyStorageInterface
{
    public function createFolder(string $path): array;

    public function deleteFolder(string $path): array;

    public function renameFolder(string $oldPath, string $newPath): array;

    public function listFolders(string $path): array;

    public function uploadFile(string $path, $contents, array $options = []): array;

    public function deleteFile(string $path): array;

    public function renameFile(string $oldPath, string $newPath): array;

    public function moveFile(string $source, string $destination): array;

    public function copyFile(string $source, string $destination): array;

    public function getFile(string $path): array;

    public function getMetadata(string $path): array;

    public function generatePublicUrl(string $path): string;

    public function generateSignedUrl(string $path, array $options = []): string;

    public function validateChecksum(string $path, string $checksum): bool;

    public function detectDuplicate(string $checksum, ?int $sizeBytes = null): ?array;

    public function prepareChunkUpload(string $path, int $totalSize, array $options = []): array;

    public function prepareResumeUpload(string $path, array $options = []): array;

    public function retryFailedUpload(string $path, array $options = []): array;
}
