<?php

namespace App\Services\ExamBank\Import;

use App\Models\QuestionImport;
use Illuminate\Support\Facades\Storage;

/**
 * Lifecycle of the temporary source image of a question import.
 *
 * Files live on the local disk under question-imports/{tenantId}/{uuid}.bin
 * and are deleted as soon as the extracted document is finalized into a
 * question (or when the cleanup command reaps abandoned imports).
 */
class ImportFileStorage
{
    public const DISK = 'local';

    public function store(int $tenantId, string $uuid, string $binary): void
    {
        Storage::disk(self::DISK)->put($this->relativePath($tenantId, $uuid), $binary);
    }

    public function exists(QuestionImport $import): bool
    {
        return Storage::disk(self::DISK)->exists($this->relativePath($import->tenant_id, $import->uuid));
    }

    public function read(QuestionImport $import): ?string
    {
        $bytes = Storage::disk(self::DISK)->get($this->relativePath($import->tenant_id, $import->uuid));

        return is_string($bytes) ? $bytes : null;
    }

    public function absolutePath(QuestionImport $import): ?string
    {
        $relative = $this->relativePath($import->tenant_id, $import->uuid);
        $disk = Storage::disk(self::DISK);

        if (! $disk->exists($relative)) {
            return null;
        }

        return $disk->path($relative);
    }

    public function delete(QuestionImport $import): void
    {
        Storage::disk(self::DISK)->delete($this->relativePath($import->tenant_id, $import->uuid));
    }

    private function relativePath(int $tenantId, string $uuid): string
    {
        return 'question-imports/'.$tenantId.'/'.$uuid.'.bin';
    }
}
