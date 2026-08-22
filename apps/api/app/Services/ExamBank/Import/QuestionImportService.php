<?php

namespace App\Services\ExamBank\Import;

use App\Jobs\ExamBank\ProcessQuestionImportJob;
use App\Models\QuestionImport;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Tenant-facing orchestration for the question import lifecycle:
 * upload → queued extraction → ready document → consumed by a question,
 * with retry/delete and scheduled cleanup of abandoned imports.
 */
class QuestionImportService
{
    public function __construct(
        private readonly ImportFileStorage $fileStorage,
    ) {}

    /**
     * Validates and stores an uploaded source image, then queues extraction.
     *
     * @return QuestionImport pending import (job dispatched)
     *
     * @throws ValidationException
     */
    public function create(Tenant $tenant, TenantUser $creator, UploadedFile $file, string $mode = 'auto'): QuestionImport
    {
        $this->validateUpload($file);
        $mode = in_array($mode, ['auto','vision','local'], true) ? $mode : 'auto';

        $uuid = (string) Str::uuid();
        $binary = (string) file_get_contents($file->getRealPath());

        if ($binary === '') {
            throw ValidationException::withMessages([
                'file' => ['لا يمكن قراءة الملف المرفوع.'],
            ]);
        }

        // Reject non-image payloads early (magic bytes, not just client mime).
        if (@getimagesizefromstring($binary) === false) {
            throw ValidationException::withMessages([
                'file' => ['الملف المرفوع ليس صورة صالحة.'],
            ]);
        }

        $import = DB::transaction(function () use ($tenant, $creator, $uuid, $file, $binary, $mode): QuestionImport {
            /** @var QuestionImport $import */
            $import = QuestionImport::query()->create([
                'tenant_id' => $tenant->id,
                'created_by_tenant_user_id' => $creator->id,
                'uuid' => $uuid,
                'status' => QuestionImport::STATUS_PENDING,
                'requested_mode' => $mode,
                'source' => [
                    'original_name' => $file->getClientOriginalName(),
                    'mime' => $file->getMimeType(),
                    'size' => $file->getSize(),
                ],
            ]);

            $this->fileStorage->store($tenant->id, $uuid, $binary);

            return $import;
        });

        ProcessQuestionImportJob::dispatch($import);

        return $import;
    }

    /**
     * Status payload for polling: stages always; document only when ready.
     *
     * @return array<string, mixed>
     */
    public function statusPayload(QuestionImport $import): array
    {
        return [
            'id' => $import->uuid,
            'status' => $import->status,
            'requestedMode' => $import->requested_mode ?? 'auto',
            'usedMode' => $import->used_mode,
            'fallbackUsed' => (bool) $import->fallback_used,
            'fallbackReason' => $import->fallback_reason,
            'strategy' => $import->strategy ?? $import->used_mode,
            'attempts' => $import->attempts,
            'stages' => $this->stagesWithDefaults($import),
            'document' => $import->isReady() ? $import->document : null,
            'error' => $import->error,
            'source' => $import->source,
            'created_at' => $import->created_at?->toIso8601String(),
            'finished_at' => $import->finished_at?->toIso8601String(),
        ];
    }

    /**
     * Re-queues a failed import from scratch.
     *
     * @throws ValidationException
     */
    public function retry(QuestionImport $import): QuestionImport
    {
        if (! $import->isFailed()) {
            throw ValidationException::withMessages([
                'import' => ['يمكن إعادة المحاولة فقط للاستيرادات الفاشلة.'],
            ]);
        }

        if (! $this->fileStorage->exists($import)) {
            throw ValidationException::withMessages([
                'import' => ['ملف المصدر لم يعد موجوداً. ارفع الصورة من جديد.'],
            ]);
        }

        $import->forceFill([
            'status' => QuestionImport::STATUS_PENDING,
            'stages' => null,
            'document' => null,
            'error' => null,
            'finished_at' => null,
        ])->save();

        ProcessQuestionImportJob::dispatch($import->refresh());

        return $import;
    }

    /**
     * Deletes the stored source file and the row itself.
     */
    public function delete(QuestionImport $import): void
    {
        $this->fileStorage->delete($import);
        $import->delete();
    }

    /**
     * Called when the teacher finalizes the document into a question: marks
     * the import consumed and removes the temporary source file.
     */
    public function markConsumed(QuestionImport $import): void
    {
        if (! $import->isReady()) {
            return;
        }

        $this->fileStorage->delete($import);

        $import->forceFill([
            'status' => QuestionImport::STATUS_CONSUMED,
        ])->save();
    }

    /**
     * Reaps abandoned imports past retention (never-yet-finalized uploads).
     * Scheduled replacement for CleanupAbandonedScanUploads.
     *
     * @return int deleted rows
     */
    public function cleanupAbandoned(): int
    {
        $retentionDays = max(1, (int) config('question-import.retention_days', 7));
        $cutoff = now()->subDays($retentionDays);

        $stale = QuestionImport::query()
            ->whereIn('status', [
                QuestionImport::STATUS_PENDING,
                QuestionImport::STATUS_PROCESSING,
                QuestionImport::STATUS_READY,
                QuestionImport::STATUS_FAILED,
            ])
            ->where('created_at', '<', $cutoff)
            ->get();

        foreach ($stale as $import) {
            $this->fileStorage->delete($import);
            $import->forceFill(['status' => QuestionImport::STATUS_EXPIRED])->save();
            $import->delete();
        }

        return $stale->count();
    }

    /**
     * Full stage list for the UI: known stages not yet recorded appear as
     * "pending" so progress is honest end to end.
     *
     * @return list<array<string, mixed>>
     */
    private function stagesWithDefaults(QuestionImport $import): array
    {
        $recorded = collect($import->stages ?? [])->keyBy('key');
        $payload = [];
        $requested = $import->requested_mode ?? 'auto';
        $used = $import->used_mode ?? $requested;
        $stageKeys = $requested === 'vision' || $used === 'vision' || $requested === 'auto'
            ? array_keys(ImportStageRecorder::STAGES)
            : ImportStageRecorder::LOCAL_STAGES;

        if ($requested === 'auto' && $used === 'local' && $import->fallback_used) {
            $stageKeys = array_keys(ImportStageRecorder::STAGES);
        }

        foreach ($stageKeys as $key) {
            $label = ImportStageRecorder::STAGES[$key] ?? $key;
            if ($recorded->has($key)) {
                $payload[] = $recorded->get($key);
                continue;
            }
            $payload[] = ['key'=>$key,'label'=>$label,'status'=>'pending'];
        }
        foreach ($recorded as $k=>$v) {
            if (!in_array($k, $stageKeys, true)) $payload[] = $v;
        }
        return $payload;
    }

    /**
     * @throws ValidationException
     */
    private function validateUpload(UploadedFile $file): void
    {
        $allowedMimes = (array) config('question-import.upload.allowed_mimes', ['image/jpeg', 'image/png', 'image/webp']);
        $maxSize = (int) config('question-import.upload.max_size', 10 * 1024 * 1024);

        if (! $file->isValid()) {
            throw ValidationException::withMessages([
                'file' => ['فشل رفع الملف. حاول مرة أخرى.'],
            ]);
        }

        if (! in_array($file->getMimeType(), $allowedMimes, true)) {
            throw ValidationException::withMessages([
                'file' => ['نوع الملف غير مدعوم. يُسمح فقط بصيغ JPEG و PNG و WebP.'],
            ]);
        }

        if ((int) $file->getSize() > $maxSize) {
            throw ValidationException::withMessages([
                'file' => ['حجم الملف يتجاوز الحد الأقصى المسموح ('.round($maxSize / 1048576).' ميجابايت).'],
            ]);
        }
    }
}
