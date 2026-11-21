<?php

namespace App\Services\ExamBank;

use App\Jobs\ExamBank\GenerateAnswerPageVariantsJob;
use App\Models\ExamAttempt;
use App\Models\ExamAttemptAnswer;
use App\Models\ExamAttemptAnswerPage;
use App\Models\ExamQuestion;
use App\Models\MediaAsset;
use App\Models\MediaUploadSession;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Media\MediaLibraryAssetService;
use App\Services\Media\MediaLibraryService;
use App\Services\Media\MediaStorage;
use App\Services\Media\StoragePathGenerator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Private, exam-attempt-scoped image uploads (Phase B2).
 *
 * The student never touches the media library consent/upload policy: the
 * acceptable file set is defined by the attempt itself. Page uploads are stored
 * on the server's configured media disk (tenant-isolated path), not on Bunny.
 *
 * Flow:
 *  - intent creates a pending `media_upload_sessions` row (no asset yet) bound
 *    to (tenant, attempt, question) and returns an internal upload URL.
 *  - the client PUTs the image bytes to that internal upload endpoint.
 *  - confirm verifies the object exists on local storage, then creates the
 *    private asset + answer page in one transaction.
 */
class ExamAnswerPageUploadService
{
    private const ESSAY_PAGE_QUESTION_TYPES = ['essay', 'short_answer'];

    private const SESSION_STATUS_PENDING = 'pending';

    private const SESSION_TTL_MINUTES = 30;

    /**
     * Intermediate page_order shift used during reordering/renumbering so the
     * per-(tenant, answer, page_order) unique index is never transiently
     * violated by an in-place swap (two-phase update, same transaction).
     */
    private const REORDER_OFFSET = 1_000_000;

    public function __construct(
        private readonly StoragePathGenerator $paths,
        private readonly MediaLibraryService $media,
        private readonly MediaStorage $storage,
        private readonly ExamGradingService $grading,
        private readonly MediaLibraryAssetService $mediaLibraryAssets,
    ) {}

    /**
     * Issue an upload intent for one photograph page of an answer.
     *
     * @param  array<string, mixed>  $data
     * @return array{session: MediaUploadSession, intent: array<string, mixed>}
     */
    public function intent(TenantUser $uploader, User $user, ExamAttempt $attempt, ExamQuestion $examQuestion, array $data): array
    {
        $attempt = $this->assertAttemptWritable($attempt, $user);
        $this->assertPageQuestion($examQuestion, $attempt);

        $tenant = currentTenant();
        $storageKey = $this->paths->generate($tenant, 'exam_attempts', $data['original_filename']);

        $session = $this->media->createUploadSession($tenant, [
            'media_asset_id' => null,
            'provider' => 'local',
            'provider_service' => 'storage',
            'status' => self::SESSION_STATUS_PENDING,
            'expires_at' => now()->addMinutes(self::SESSION_TTL_MINUTES),
            'exam_attempt_id' => $attempt->id,
            'exam_question_id' => $examQuestion->id,
            'metadata' => [
                'storage_key' => $storageKey,
                'storage_root' => 'exam_attempts',
                'purpose' => 'exam_answer_page',
                'exam_attempt_id' => (string) $attempt->id,
                'exam_question_id' => (string) $examQuestion->id,
                'expected_mime_type' => $data['mime_type'] ?? null,
                'expected_size_bytes' => $data['size_bytes'] ?? null,
                'original_filename' => $data['original_filename'] ?? null,
            ],
        ], $uploader);

        $intent = $this->buildIntent($attempt, $examQuestion, $session, $data['mime_type'] ?? null);

        return [
            'session' => $session->refresh(),
            'intent' => $intent,
        ];
    }

    /**
     * Receive raw image bytes for a pending upload session and store them on the
     * local media disk. This replaces direct client->Bunny uploads for exam
     * answer pages while keeping the same intent/confirm lifecycle.
     *
     * @return array{session: MediaUploadSession, storage_key: string, size_bytes: int}
     */
    public function storeUploadedFile(User $user, ExamAttempt $attempt, ExamQuestion $examQuestion, MediaUploadSession $session, string $contents, ?string $mimeType = null): array
    {
        $attempt = $this->assertAttemptWritable($attempt, $user);
        $this->assertPageQuestion($examQuestion, $attempt);
        $session = $this->resolvePendingSession($attempt, $examQuestion, $session);

        $storageKey = (string) ($session->metadata['storage_key'] ?? '');
        if ($storageKey === '') {
            throw ValidationException::withMessages([
                'session' => ['The upload session has no storage key.'],
            ]);
        }

        if ($contents === '') {
            throw ValidationException::withMessages([
                'file' => ['The uploaded file is empty.'],
            ]);
        }

        $disk = $this->storage->diskName();
        Storage::disk($disk)->put($storageKey, $contents);

        $size = Storage::disk($disk)->size($storageKey);
        $metadata = $session->metadata ?? [];
        $metadata['stored_at'] = now()->toIso8601String();
        $metadata['stored_size_bytes'] = $size;
        if ($mimeType !== null && $mimeType !== '') {
            $metadata['stored_mime_type'] = $mimeType;
        }

        $session->forceFill([
            'metadata' => $metadata,
            'file_name' => $metadata['original_filename'] ?? $session->file_name,
            'mime_type' => $mimeType ?: ($session->mime_type ?? $metadata['expected_mime_type'] ?? null),
            'size' => $size,
        ])->save();

        return [
            'session' => $session->refresh(),
            'storage_key' => $storageKey,
            'size_bytes' => (int) $size,
        ];
    }

    /**
     * Confirm an uploaded page: verify it exists on local storage, then
     * atomically create the private asset, upsert the answer row and insert the page.
     *
     * @param  array<string, mixed>  $payload
     * @return array{asset: MediaAsset, answer: ExamAttemptAnswer, page: ExamAttemptAnswerPage, session: MediaUploadSession, verified: bool}
     */
    public function confirm(User $user, ExamAttempt $attempt, ExamQuestion $examQuestion, MediaUploadSession $session, array $payload): array
    {
        $attempt = $this->assertAttemptWritable($attempt, $user);
        $this->assertPageQuestion($examQuestion, $attempt);
        $session = $this->resolvePendingSession($attempt, $examQuestion, $session);

        $this->assertStored((string) ($session->metadata['storage_key'] ?? ''));

        $tenant = currentTenant();
        $uploader = currentTenantUser();

        try {
            $result = DB::transaction(function () use (
                $tenant, $uploader, $attempt, $examQuestion, $session, $payload,
            ): array {
                $answer = $this->upsertAnswer($tenant, $attempt, $examQuestion);

                $pageOrder = ((int) $answer->pages()->max('page_order')) + 1;
                $storageKey = (string) ($session->metadata['storage_key'] ?? '');

                $asset = $this->media->createAsset($tenant, [
                    'provider' => 'local',
                    'provider_service' => 'storage',
                    'type' => 'image',
                    'status' => 'ready',
                    'visibility' => 'private',
                    'storage_key' => $storageKey,
                    'cdn_url' => $this->storage->url($storageKey),
                    'original_filename' => $payload['original_filename'] ?? $session->file_name ?? ($session->metadata['original_filename'] ?? null),
                    'mime_type' => $payload['mime_type'] ?? $session->mime_type ?? ($session->metadata['stored_mime_type'] ?? null),
                    'size_bytes' => $payload['size_bytes'] ?? $session->size ?? ($session->metadata['stored_size_bytes'] ?? null),
                    'width' => $payload['width'] ?? null,
                    'height' => $payload['height'] ?? null,
                    'metadata' => [
                        'storage_root' => 'exam_attempts',
                        'purpose' => 'exam_answer_page',
                        'exam_attempt_id' => (string) $attempt->id,
                        'exam_question_id' => (string) $examQuestion->id,
                        'upload_session_id' => (string) $session->id,
                    ],
                ], $uploader);

                $page = $answer->pages()->create([
                    'tenant_id' => $tenant->id,
                    'media_asset_id' => $asset->id,
                    'page_order' => $pageOrder,
                    'captured_at' => $payload['captured_at'] ?? now(),
                    'width' => $payload['width'] ?? null,
                    'height' => $payload['height'] ?? null,
                ]);

                $session->forceFill([
                    'media_asset_id' => $asset->id,
                    'status' => 'completed',
                ])->save();

                return [
                    'asset' => $asset->refresh(),
                    'answer' => $answer->refresh(),
                    'page' => $page->refresh(),
                    'session' => $session->refresh(),
                    'verified' => true,
                ];
            });
        } catch (QueryException $e) {
            if ($e->getCode() === '23000') {
                throw ValidationException::withMessages([
                    'page' => ['This page could not be saved. Please retry the upload.'],
                ]);
            }

            throw $e;
        }

        $this->dispatchVariantGeneration($tenant, $result['asset']);

        return $result;
    }

    private function dispatchVariantGeneration(Tenant $tenant, MediaAsset $asset): void
    {
        try {
            GenerateAnswerPageVariantsJob::dispatch($tenant->id, $asset->id);
        } catch (Throwable $e) {
            Log::warning('exam-answer-page.variant_generation_failed', [
                'tenant_id' => $tenant->id,
                'asset_id' => $asset->id,
                'error' => $e->getMessage(),
            ]);
        } finally {
            app()->instance('currentTenant', $tenant);
            app()->instance(Tenant::class, $tenant);
        }
    }

    /**
     * Delete one already-confirmed page (Phase D-FIX, §2).
     *
     * @return array{answerId: string, answerMode: string, gradingStatus: string, pages: array<int, array{id: string, pageOrder: int}>}
     */
    public function deletePage(User $user, ExamAttempt $attempt, ExamQuestion $examQuestion, ExamAttemptAnswerPage $page): array
    {
        $attempt = $this->assertAttemptWritable($attempt, $user);
        $this->assertPageQuestion($examQuestion, $attempt);

        $tenant = currentTenant();
        $answer = $this->answerFor($attempt, $examQuestion);

        if ($answer === null || $page->exam_attempt_answer_id !== $answer->id) {
            abort(404);
        }

        return DB::transaction(function () use ($tenant, $answer, $page): array {
            if ($page->mediaAsset !== null) {
                $this->mediaLibraryAssets->softDelete($tenant, $page->mediaAsset);
            }

            $page->delete();

            $remaining = $answer->pages()->orderBy('page_order')->get();
            $this->assignSequentialPageOrder($remaining);

            if ($remaining->isEmpty()) {
                $this->resetAnswerToUnanswered($answer);
            }

            return $this->pageListPayload($answer, $remaining);
        });
    }

    /**
     * Bulk reorder of an answer's already-confirmed pages (Phase D-FIX, §3).
     *
     * @param  array<int, int>  $pageIds
     * @return array{answerId: string, answerMode: string, gradingStatus: string, pages: array<int, array{id: string, pageOrder: int}>}
     */
    public function reorder(User $user, ExamAttempt $attempt, ExamQuestion $examQuestion, array $pageIds): array
    {
        $attempt = $this->assertAttemptWritable($attempt, $user);
        $this->assertPageQuestion($examQuestion, $attempt);

        $answer = $this->answerFor($attempt, $examQuestion);

        if ($answer === null) {
            abort(404);
        }

        $submittedIds = array_map('intval', $pageIds);
        $currentIds = $answer->pages()
            ->orderBy('page_order')
            ->pluck('id')
            ->map(fn ($id): int => (int) $id)
            ->all();

        if ($this->setsDiffer($submittedIds, $currentIds)) {
            throw ValidationException::withMessages([
                'page_ids' => ['The page list must contain exactly every uploaded page for this answer, in the desired order.'],
            ]);
        }

        return DB::transaction(function () use ($answer, $submittedIds): array {
            $byId = $answer->pages()->orderBy('page_order')->get()
                ->keyBy(fn (ExamAttemptAnswerPage $page): int => (int) $page->id);

            foreach ($byId as $page) {
                $page->forceFill(['page_order' => (int) $page->page_order + self::REORDER_OFFSET])->save();
            }

            foreach ($submittedIds as $index => $pageId) {
                $byId[$pageId]->forceFill(['page_order' => $index])->save();
            }

            return $this->pageListPayload($answer, $answer->pages()->orderBy('page_order')->get());
        });
    }

    private function setsDiffer(array $submittedIds, array $currentIds): bool
    {
        $submitted = $submittedIds;
        $current = $currentIds;

        sort($submitted);
        sort($current);

        return $submitted !== $current;
    }

    /**
     * @param  Collection<int, ExamAttemptAnswerPage>  $pages
     */
    private function assignSequentialPageOrder(Collection $pages): void
    {
        $pages->values()->each(function (ExamAttemptAnswerPage $page): void {
            $page->forceFill(['page_order' => (int) $page->page_order + self::REORDER_OFFSET])->save();
        });

        $pages->values()->each(function (ExamAttemptAnswerPage $page, int $index): void {
            $page->forceFill(['page_order' => $index])->save();
        });
    }

    private function resetAnswerToUnanswered(ExamAttemptAnswer $answer): void
    {
        $answer->forceFill([
            'answer' => null,
            'answer_mode' => 'text',
            'grading_status' => 'auto_graded',
            'is_correct' => null,
            'earned_points' => 0,
            'manual_score' => null,
            'feedback' => null,
            'graded_by_tenant_user_id' => null,
            'graded_at' => null,
            'answered_at' => null,
        ])->save();
    }

    private function answerFor(ExamAttempt $attempt, ExamQuestion $examQuestion): ?ExamAttemptAnswer
    {
        return ExamAttemptAnswer::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('exam_attempt_id', $attempt->id)
            ->where('exam_question_id', $examQuestion->id)
            ->first();
    }

    /**
     * @param  Collection<int, ExamAttemptAnswerPage>  $pages
     * @return array{answerId: string, answerMode: string, gradingStatus: string, pages: array<int, array{id: string, pageOrder: int}>}
     */
    private function pageListPayload(ExamAttemptAnswer $answer, Collection $pages): array
    {
        return [
            'answerId' => (string) $answer->id,
            'answerMode' => $answer->answer_mode,
            'gradingStatus' => $answer->grading_status,
            'pages' => $pages->map(fn (ExamAttemptAnswerPage $page): array => [
                'id' => (string) $page->id,
                'pageOrder' => (int) $page->page_order,
            ])->values()->all(),
        ];
    }

    private function upsertAnswer(Tenant $tenant, ExamAttempt $attempt, ExamQuestion $examQuestion): ExamAttemptAnswer
    {
        $answer = ExamAttemptAnswer::query()
            ->where('tenant_id', $tenant->id)
            ->where('exam_attempt_id', $attempt->id)
            ->where('exam_question_id', $examQuestion->id)
            ->first();

        $now = now();

        if ($answer === null) {
            return ExamAttemptAnswer::create([
                'tenant_id' => $tenant->id,
                'exam_attempt_id' => $attempt->id,
                'exam_question_id' => $examQuestion->id,
                'question_id' => $examQuestion->question_id,
                'answer' => null,
                'answer_mode' => 'image_pages',
                'grading_status' => 'pending_manual_review',
                'is_correct' => null,
                'earned_points' => 0,
                'answered_at' => $now,
            ]);
        }

        $answer->forceFill([
            'answer_mode' => 'image_pages',
            'grading_status' => 'pending_manual_review',
            'earned_points' => 0,
            'answered_at' => $now,
        ])->save();

        return $answer;
    }

    /**
     * Build the client upload intent. For local server storage this points to an
     * authenticated internal upload endpoint instead of an external Bunny PUT URL.
     *
     * @return array<string, mixed>
     */
    private function buildIntent(ExamAttempt $attempt, ExamQuestion $examQuestion, MediaUploadSession $session, ?string $mimeType): array
    {
        return [
            'provider' => 'local',
            'provider_service' => 'storage',
            'method' => 'PUT',
            'upload_url' => route('exam-bank.answer-pages.upload', [
                'attempt' => $attempt->id,
                'examQuestion' => $examQuestion->id,
                'session' => $session->id,
            ], false),
            'storage_key' => (string) ($session->metadata['storage_key'] ?? ''),
            'expires_at' => $session->expires_at,
            'headers' => [
                'Content-Type' => $mimeType ?? 'application/octet-stream',
            ],
        ];
    }

    private function resolvePendingSession(ExamAttempt $attempt, ExamQuestion $examQuestion, MediaUploadSession $session): MediaUploadSession
    {
        $resolved = MediaUploadSession::query()
            ->whereKey($session->id)
            ->where('tenant_id', currentTenant()->id)
            ->where('exam_attempt_id', $attempt->id)
            ->where('exam_question_id', $examQuestion->id)
            ->where('status', self::SESSION_STATUS_PENDING)
            ->where(function ($query): void {
                $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->first();

        if ($resolved === null) {
            abort(404);
        }

        return $resolved;
    }

    private function assertStored(string $storageKey): void
    {
        if ($storageKey === '') {
            throw ValidationException::withMessages([
                'session' => ['The upload session has no storage key.'],
            ]);
        }

        $disk = $this->storage->diskName();
        $exists = Storage::disk($disk)->exists($storageKey);
        if (! $exists && $disk !== 'public') {
            $exists = Storage::disk('public')->exists($storageKey);
        }

        if (! $exists) {
            throw ValidationException::withMessages([
                'session' => ['The upload was not found on storage. Please upload the file again.'],
            ]);
        }
    }

    private function assertAttemptWritable(ExamAttempt $attempt, User $user): ExamAttempt
    {
        if ($attempt->tenant_id !== currentTenant()->id || $attempt->user_id !== $user->id) {
            abort(404);
        }

        if ($attempt->status === 'in_progress'
            && $attempt->timer_ends_at !== null
            && now()->greaterThanOrEqualTo($attempt->timer_ends_at)) {
            $this->grading->reconcileExpiredAttempt($attempt);

            throw ValidationException::withMessages([
                'exam' => ['The exam time has expired. Your attempt was submitted automatically.'],
            ]);
        }

        if ($attempt->status !== 'in_progress') {
            throw ValidationException::withMessages([
                'attempt' => ['Only in-progress attempts can be modified.'],
            ]);
        }

        return $attempt;
    }

    private function assertPageQuestion(ExamQuestion $examQuestion, ExamAttempt $attempt): void
    {
        if ($examQuestion->tenant_id !== currentTenant()->id || $examQuestion->exam_id !== $attempt->exam_id) {
            abort(404);
        }

        $included = $attempt->included_exam_question_ids;

        if (is_array($included) && $included !== [] && ! in_array((string) $examQuestion->id, array_map('strval', $included), true)) {
            abort(404);
        }

        $question = $examQuestion->question()->first();

        if ($question === null || ! in_array($question->type, self::ESSAY_PAGE_QUESTION_TYPES, true)) {
            throw ValidationException::withMessages([
                'exam_question' => ['Page uploads are only supported for essay and short answer questions.'],
            ]);
        }
    }
}