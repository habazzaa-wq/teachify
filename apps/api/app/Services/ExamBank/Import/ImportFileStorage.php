<?php

namespace App\Services\ExamBank\Import;

use App\Models\QuestionImport;

/**
 * Lifecycle of the temporary source image of a question import.
 *
 * The raw image bytes are persisted on the import row itself (base64-encoded)
 * instead of on the local filesystem. This keeps the source co-located with
 * the import across web/worker boundaries: the queued extraction job always
 * reads the bytes from the database, so a missing or unreadable scratch file
 * (e.g. when the queue worker runs in a separate process/filesystem than the
 * upload request) can never abort extraction with "file missing or empty".
 */
class ImportFileStorage
{
    public const DISK = 'local';

    public function store(QuestionImport $import, string $binary): void
    {
        $import->forceFill(['source_bytes' => base64_encode($binary)])->save();
    }

    public function exists(QuestionImport $import): bool
    {
        return ! empty($import->source_bytes);
    }

    public function read(QuestionImport $import): ?string
    {
        if (empty($import->source_bytes)) {
            return null;
        }

        $decoded = base64_decode($import->source_bytes, true);

        return is_string($decoded) ? $decoded : null;
    }

    public function absolutePath(QuestionImport $import): ?string
    {
        $bytes = $this->read($import);
        if ($bytes === null) {
            return null;
        }

        $ext = 'bin';
        $head = substr($bytes, 0, 8);
        if (str_starts_with($head, "\xFF\xD8\xFF")) {
            $ext = 'jpg';
        } elseif (str_starts_with($head, "\x89PNG\r\n\x1A\n")) {
            $ext = 'png';
        } elseif (substr($bytes, 0, 4) === 'RIFF' && substr($bytes, 8, 4) === 'WEBP') {
            $ext = 'webp';
        }

        $path = sys_get_temp_dir().DIRECTORY_SEPARATOR.'qi_'.$import->uuid.'.'.$ext;
        file_put_contents($path, $bytes);

        return $path;
    }

    public function delete(QuestionImport $import): void
    {
        if (! empty($import->source_bytes)) {
            $import->forceFill(['source_bytes' => null])->save();
        }
    }
}
