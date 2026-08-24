<?php

namespace App\Services\ExamBank\Import;

use App\Models\QuestionImport;
use Illuminate\Support\Facades\Storage;

/**
 * Lifecycle of the temporary source image of a question import.
 *
 * New imports persist raw bytes under a tenant-scoped path on a configurable
 * storage disk (default "local", swappable to S3-compatible disks later):
 *
 *   question-imports/{tenant_id}/{uuid}.{ext}
 *
 * The question_imports.source JSON records {"disk": ..., "path": ...} next to
 * the original upload metadata, while source_bytes stays NULL. Historical
 * rows created before this change carry base64 bytes in source_bytes and no
 * disk/path keys; every read path falls back to those transparently until the
 * column is retired.
 *
 * This keeps web nodes stateless (no local scratch dependency between the
 * upload request and the queue worker) without storing multi-megabyte blobs
 * inside MySQL.
 */
class ImportFileStorage
{
    /**
     * Default disk constant kept for backwards compatibility (tests and call
     * sites reference ImportFileStorage::DISK).
     */
    public const DISK = 'local';

    public function store(QuestionImport $import, string $binary): void
    {
        $disk = $this->disk();
        $path = $this->pathFor($import);

        Storage::disk($disk)->put($path, $binary);

        $source = $import->source ?? [];
        $source['disk'] = $disk;
        $source['path'] = $path;

        $import->forceFill(['source' => $source])->save();
    }

    public function exists(QuestionImport $import): bool
    {
        if (($path = $this->storedPath($import)) !== null) {
            return Storage::disk($this->storedDisk($import))->exists($path);
        }

        // Legacy rows: bytes live (base64-encoded) on the row itself.
        return ! empty($import->getRawOriginal('source_bytes'));
    }

    public function read(QuestionImport $import): ?string
    {
        if (($path = $this->storedPath($import)) !== null) {
            $contents = Storage::disk($this->storedDisk($import))->get($path);

            return $contents === false ? null : $contents;
        }

        if (empty($import->getRawOriginal('source_bytes'))) {
            return null;
        }

        $decoded = base64_decode((string) $import->getRawOriginal('source_bytes'), true);

        return is_string($decoded) ? $decoded : null;
    }

    /**
     * Materializes the source bytes into a real file so CLI tools
     * (Tesseract) and Vision providers can read them.
     */
    public function absolutePath(QuestionImport $import): ?string
    {
        $bytes = $this->read($import);
        if ($bytes === null) {
            return null;
        }

        $path = sys_get_temp_dir().DIRECTORY_SEPARATOR.'qi_'.$import->uuid.'.'.$this->extensionFor($bytes);
        file_put_contents($path, $bytes);

        return $path;
    }

    public function delete(QuestionImport $import): void
    {
        if (($path = $this->storedPath($import)) !== null) {
            Storage::disk($this->storedDisk($import))->delete($path);
        }

        // Strip storage metadata plus any legacy payload so the database row
        // (and every in-memory instance after save()'s original-sync) reflects
        // deletion.
        $source = collect($import->source ?? [])->except(['disk', 'path'])->all();

        $import->forceFill([
            'source' => $source,
            'source_bytes' => null,
        ])->save();
    }

    private function disk(): string
    {
        return (string) config('question-import.storage.disk', self::DISK);
    }

    private function pathFor(QuestionImport $import): string
    {
        return 'question-imports/'.$import->tenant_id.'/'.$import->uuid.'.bin';
    }

    private function storedPath(QuestionImport $import): ?string
    {
        $path = $import->source['path'] ?? null;

        return is_string($path) && $path !== '' ? $path : null;
    }

    private function storedDisk(QuestionImport $import): string
    {
        $disk = $import->source['disk'] ?? null;

        return is_string($disk) && $disk !== '' ? $disk : $this->disk();
    }

    private function extensionFor(string $bytes): string
    {
        $head = substr($bytes, 0, 8);
        if (str_starts_with($head, "\xFF\xD8\xFF")) {
            return 'jpg';
        }
        if (str_starts_with($head, "\x89PNG\r\n\x1A\n")) {
            return 'png';
        }
        if (substr($bytes, 0, 4) === 'RIFF' && substr($bytes, 8, 4) === 'WEBP') {
            return 'webp';
        }

        return 'bin';
    }
}
