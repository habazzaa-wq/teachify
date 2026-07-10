<?php

namespace App\Services\Bunny;

use App\Services\Bunny\Contracts\BunnyStorageInterface;
use App\Services\Bunny\Exceptions\BunnyServiceException;
use Illuminate\Support\Str;

class BunnyStorageService implements BunnyStorageInterface
{
    public function __construct(
        private readonly BunnyClient $client,
        private readonly BunnyCacheService $cache,
    ) {
    }

    public function createFolder(string $path): array
    {
        $normalized = $this->normalizePath($path);

        $result = $this->client->storageRequest('PUT', $normalized.'/', [
            'headers' => ['Content-Type' => 'application/json'],
            'operation' => "create_folder {$normalized}",
        ]);

        $this->cache->invalidateStorage(dirname($normalized));

        return $result;
    }

    public function deleteFolder(string $path): array
    {
        $normalized = $this->normalizePath($path);

        $result = $this->client->storageRequest('DELETE', $normalized.'/', [
            'operation' => "delete_folder {$normalized}",
        ]);

        $this->cache->invalidateStorage($normalized);
        $this->cache->invalidateFolder($normalized);

        return $result;
    }

    public function renameFolder(string $oldPath, string $newPath): array
    {
        $normalizedOld = $this->normalizePath($oldPath);
        $normalizedNew = $this->normalizePath($newPath);

        $parentOld = dirname($normalizedOld);
        $parentNew = dirname($normalizedNew);

        if ($parentOld !== $parentNew) {
            $this->copyFolderRecursive($normalizedOld, $normalizedNew);
            $this->deleteFolderRecursive($normalizedOld);
        } else {
            $fileName = basename($normalizedNew);

            $result = $this->client->storageRequest('PUT', $normalizedOld."/?moveTo=/{$parentNew}/{$fileName}", [
                'headers' => ['Content-Type' => 'application/json'],
                'operation' => "rename_folder {$normalizedOld} to {$normalizedNew}",
            ]);

            $this->cache->invalidateFolder($normalizedOld);
        }

        $this->cache->invalidateFolder($normalizedNew);
        $this->cache->invalidateStorage($parentOld);

        return ['success' => true, 'old_path' => $normalizedOld, 'new_path' => $normalizedNew];
    }

    public function listFolders(string $path): array
    {
        $normalized = $this->normalizePath($path);

        return $this->cache->cacheFolder($normalized, function () use ($normalized) {
            $items = $this->client->storageRequest('GET', $normalized.'/', [
                'operation' => "list_folders {$normalized}",
            ]);

            $folders = [];
            $files = [];

            if (is_array($items)) {
                foreach ($items as $item) {
                    if (! is_array($item)) {
                        continue;
                    }

                    $entry = [
                        'name' => $item['ObjectName'] ?? $item['name'] ?? null,
                        'path' => $normalized.'/'.($item['ObjectName'] ?? $item['name'] ?? null),
                        'is_directory' => ($item['IsDirectory'] ?? false) === true || ($item['isDirectory'] ?? false) === true,
                        'size_bytes' => $item['Length'] ?? $item['size'] ?? 0,
                        'last_modified' => $item['LastChanged'] ?? $item['lastModified'] ?? null,
                        'mime_type' => $item['ContentType'] ?? $item['contentType'] ?? null,
                        'checksum' => $item['Checksum'] ?? $item['checksum'] ?? null,
                        'storage_key' => $item['Path'] ?? $item['path'] ?? null,
                    ];

                    if ($entry['is_directory']) {
                        $folders[] = $entry;
                    } else {
                        $files[] = $entry;
                    }
                }
            }

            return ['folders' => $folders, 'files' => $files];
        });
    }

    public function uploadFile(string $path, $contents, array $options = []): array
    {
        $normalized = $this->normalizePath($path);

        $headers = [
            'Content-Type' => $options['mime_type'] ?? 'application/octet-stream',
        ];

        if (isset($options['checksum'])) {
            $headers['Checksum'] = $options['checksum'];
        }

        if (isset($options['overwrite']) && ! $options['overwrite']) {
            $headers['If-None-Match'] = '*';
        }

        $result = $this->client->storageRequest('PUT', $normalized, [
            'headers' => $headers,
            'body' => is_resource($contents) ? stream_get_contents($contents) : $contents,
            'timeout' => $options['timeout'] ?? 120,
            'operation' => "upload_file {$normalized}",
        ]);

        $this->cache->invalidateStorage(dirname($normalized));

        return $result;
    }

    public function deleteFile(string $path): array
    {
        $normalized = $this->normalizePath($path);

        $result = $this->client->storageRequest('DELETE', $normalized, [
            'operation' => "delete_file {$normalized}",
        ]);

        $this->cache->invalidateStorage(dirname($normalized));

        return $result;
    }

    public function renameFile(string $oldPath, string $newPath): array
    {
        $normalizedOld = $this->normalizePath($oldPath);
        $normalizedNew = $this->normalizePath($newPath);

        $parent = dirname($normalizedNew);
        $fileName = basename($normalizedNew);

        $result = $this->client->storageRequest('PUT', $normalizedOld."/?moveTo=/{$parent}/{$fileName}", [
            'headers' => ['Content-Type' => 'application/json'],
            'operation' => "rename_file {$normalizedOld} to {$normalizedNew}",
        ]);

        $this->cache->invalidateStorage(dirname($normalizedOld));
        $this->cache->invalidateStorage($parent);

        return $result;
    }

    public function moveFile(string $source, string $destination): array
    {
        return $this->renameFile($source, $destination);
    }

    public function copyFile(string $source, string $destination): array
    {
        $normalizedSource = $this->normalizePath($source);
        $normalizedDest = $this->normalizePath($destination);

        $metadata = $this->getMetadata($normalizedSource);

        $contents = $this->client->storageRequest('GET', $normalizedSource, [
            'operation' => "copy_file_read {$normalizedSource}",
            'timeout' => 120,
        ]);

        $this->uploadFile($normalizedDest, $contents['data'] ?? $contents, [
            'mime_type' => $metadata['ContentType'] ?? $metadata['content_type'] ?? null,
            'overwrite' => true,
        ]);

        $this->cache->invalidateStorage(dirname($normalizedDest));

        return ['success' => true, 'source' => $normalizedSource, 'destination' => $normalizedDest];
    }

    public function getFile(string $path): array
    {
        $normalized = $this->normalizePath($path);

        return $this->cache->cacheStorage($normalized, function () use ($normalized) {
            $metadata = $this->getMetadata($normalized);
            $publicUrl = $this->generatePublicUrl($normalized);

            return array_merge($metadata, [
                'url' => $publicUrl,
                'path' => $normalized,
            ]);
        });
    }

    public function getMetadata(string $path): array
    {
        $normalized = $this->normalizePath($path);

        return $this->client->storageRequest('HEAD', $normalized, [
            'operation' => "get_metadata {$normalized}",
        ]);
    }

    public function generatePublicUrl(string $path): string
    {
        $normalized = $this->normalizePath($path);

        return $this->client->cdnUrl($normalized);
    }

    public function generateSignedUrl(string $path, array $options = []): string
    {
        $normalized = $this->normalizePath($path);

        $expiresAt = $options['expires_at'] ?? now()->addHours(1)->timestamp;
        $pathUrl = '/'.$normalized;

        $signatureData = $this->client->settings()->signed_url_secret;

        if (! $signatureData) {
            throw new BunnyServiceException(
                'Signed URL secret is not configured.',
                'storage',
                'generate_signed_url',
            );
        }

        $hashData = $signatureData.$pathUrl.$expiresAt;
        $signature = hash('sha256', $hashData, true);
        $signatureBase64 = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        $cdnUrl = $this->client->cdnUrl($normalized);

        return $cdnUrl.'?token='.$signatureBase64.'&expires='.$expiresAt;
    }

    public function validateChecksum(string $path, string $checksum): bool
    {
        $normalized = $this->normalizePath($path);
        $metadata = $this->getMetadata($normalized);

        $remoteChecksum = $metadata['Checksum'] ?? $metadata['checksum'] ?? null;

        if ($remoteChecksum === null) {
            return false;
        }

        return hash_equals($remoteChecksum, $checksum);
    }

    public function detectDuplicate(string $checksum, ?int $sizeBytes = null): ?array
    {
        $settings = $this->client->settings();
        $rootPath = $this->normalizePath('');

        $listing = $this->listFolders($rootPath);

        foreach (($listing['files'] ?? []) as $file) {
            if (($file['checksum'] ?? null) === $checksum) {
                if ($sizeBytes !== null && ($file['size_bytes'] ?? 0) !== $sizeBytes) {
                    continue;
                }

                return $file;
            }
        }

        return null;
    }

    public function prepareChunkUpload(string $path, int $totalSize, array $options = []): array
    {
        $chunkSize = $options['chunk_size'] ?? $this->client->settings()->chunk_size ?? (5 * 1024 * 1024);
        $totalChunks = (int) ceil($totalSize / $chunkSize);

        $normalized = $this->normalizePath($path);

        return [
            'path' => $normalized,
            'total_size' => $totalSize,
            'chunk_size' => $chunkSize,
            'total_chunks' => $totalChunks,
            'method' => 'PUT',
            'upload_url' => $this->client->storageZoneUrl($normalized),
            'headers' => [
                'AccessKey' => $this->client->settings()->api_key,
                'Content-Type' => $options['mime_type'] ?? 'application/octet-stream',
            ],
        ];
    }

    public function prepareResumeUpload(string $path, array $options = []): array
    {
        $normalized = $this->normalizePath($path);
        $uploadedChunks = $options['uploaded_chunks'] ?? [];
        $totalChunks = $options['total_chunks'] ?? 0;

        $remainingChunks = array_diff(range(1, $totalChunks), $uploadedChunks);

        return [
            'path' => $normalized,
            'remaining_chunks' => array_values($remainingChunks),
            'uploaded_chunks' => $uploadedChunks,
            'upload_url' => $this->client->storageZoneUrl($normalized),
            'headers' => [
                'AccessKey' => $this->client->settings()->api_key,
            ],
        ];
    }

    public function retryFailedUpload(string $path, array $options = []): array
    {
        return $this->prepareResumeUpload($path, $options);
    }

    private function normalizePath(string $path): string
    {
        $normalized = '/'.ltrim($path, '/');

        $normalized = preg_replace('#/+#', '/', $normalized);
        $normalized = rtrim($normalized, '/');

        return $normalized === '' ? '/' : $normalized;
    }

    private function copyFolderRecursive(string $source, string $destination): void
    {
        $listing = $this->listFolders($source);

        $this->createFolder($destination);

        foreach (($listing['files'] ?? []) as $file) {
            $this->copyFile($file['path'], $destination.'/'.basename($file['path']));
        }

        foreach (($listing['folders'] ?? []) as $folder) {
            $this->copyFolderRecursive($folder['path'], $destination.'/'.basename($folder['path']));
        }
    }

    private function deleteFolderRecursive(string $path): void
    {
        $listing = $this->listFolders($path);

        foreach (($listing['files'] ?? []) as $file) {
            $this->deleteFile($file['path']);
        }

        foreach (($listing['folders'] ?? []) as $folder) {
            $this->deleteFolderRecursive($folder['path']);
        }

        $this->deleteFolder($path);
    }
}
