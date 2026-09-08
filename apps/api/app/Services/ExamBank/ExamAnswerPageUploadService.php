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
use App\Services\Bunny\Contracts\BunnyStorageInterface;
use App\Services\Bunny\Exceptions\BunnyServiceException;
use App\Services\Media\MediaLibraryAssetService;
use App\Services\Media\MediaLibraryService;
use App\Services\Media\MediaManager;
use App\Services\Media\StoragePathGenerator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

/**
 * Private, exam-attempt-scoped image uploads (Phase B2).
 *
 * The student never touches the media library consent/upload policy: the
 * acceptable file set is defined by the attempt itself. The page upload flow
 * mirrors the generic storage intent mechanics (PUT URL + AccessKey header +
 * expiry, see BunnyStorageProvider::createUploadIntent) but:
 *  - the upload destination is scoped to `tenants/{tenant}/exam_attempts/...`
 *  - a `media_upload_sessions` row is created with NO asset yet (status
 *    `pending`, `media_asset_id` NULL) and carries the `exam_attempt_id` /
 *    `exam_question_id` binding so a session issued for attempt A cannot be
 *    confirmed against attempt B's answer,
 *  - confirm verifies the object actually landed on Bunny via a HEAD metadata
 *    request (BunnyStorageInterface::getMetadata) instead of trusting the
 *    client, then creates the private asset + answer page in one transaction.
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
        private readonly MediaManager $manager,
        private readonly BunnyStorageInterface $storage,
        private readonly ExamGradingService $grading,
        private readonly MediaLibraryAssetService $mediaLibraryAssets,
    ) {}

    /**
     * Issue a PUT intent for one photograph page of an answer.
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
            'provider' => 'bunny',
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
            ],
        ], $uploader);

        $intent = $this->buildIntent($tenant, $storageKey, $session, $data['mime_type'] ?? null);

        return [
            'session' => $session->refresh(),
            'intent' => $intent,
        ];
    }

    /**
     * Confirm an uploaded page: verify it exists on Bunny, then atomically
     * create the private asset, upsert the answer row and insert the page.
     *
     * @param  array<string, mixed>  $payload
     * @return array{asset: MediaAsset, answer: ExamAttemptAnswer, page: ExamAttemptAnswerPage, session: MediaUploadSession, verified: bool}
     */
    public function confirm(User $user, ExamAttempt $attempt, ExamQuestion $examQuestion, MediaUploadSession $session, array $payload): array
    {
        $attempt = $this->assertAttemptWritable($attempt, $user);
        $this->assertPageQuestion($examQuestion, $attempt);

        // Binding enforcement: the session row itself must point at this exact
        // (tenant, attempt, question), be un-consumed (status pending) and be
        // unexpired. The tenant predicate is the explicit half of the check;
        // the TenantScope global scope applies as well.
        $session = MediaUploadSession::query()
            ->whereKey($session->id)
            ->where('tenant_id', currentTenant()->id)
            ->where('exam_attempt_id', $attempt->id)
            ->where('exam_question_id', $examQuestion->id)
            ->where('status', self::SESSION_STATUS_PENDING)
            ->where(function ($query): void {
                $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->first();

        if ($session === null) {
            abort(404);
        }

        $this->assertStored((string) ($session->metadata['storage_key'] ?? ''));

        $tenant = currentTenant();
        $uploader = currentTenantUser();

        try {
            $result = DB::transaction(function () use (
                $tenant, $uploader, $attempt, $examQuestion, $session, $payload,
            ): array {
                $answer = $this->upsertAnswer($tenant, $attempt, $examQuestion);

                $pageOrder = ((int) $answer->pages()->max('page_order')) + 1;

                $asset = $this->media->createAsset($tenant, [
                    'provider' => 'bunny',
                    'provider_service' => 'storage',
                    'type' => 'image',
                    'status' => 'ready',
                    'visibility' => 'private',
                    'storage_key' => (string) ($session->metadata['storage_key'] ?? ''),
                    'original_filename' => $payload['original_filename'] ?? $session->file_name,
                    'mime_type' => $payload['mime_type'] ?? null,
                    'size_bytes' => $payload['size_bytes'] ?? null,
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
            // Unique page_order / media_asset_id collision (or a lost race on
            // page creation): surface as a client retryable error, mirroring the
            // duplicate-active-attempt key handling in ExamSessionService.
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

    /**
     * Best-effort, behind-the-scenes variant generation (Phase F). Dispatched
     * only after the page transaction COMMITS, so a failure can never roll back
     * or break the student's confirm. The dispatch is wrapped so that on the
     * sync (test) queue a job failure never propagates into the confirm
     * response, and the tenant context the job's SetTenantContext middleware
     * unbinds in its finally block is restored for the remainder of the request
     * (mirroring ExamGradingService::reconcileExpiredAttempt, lines 117-126).
     */
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
     * Guards are the SAME set used by intent/confirm (reused verbatim, not
     * reinvented):
     *  - ownership + attempt-status gate: assertAttemptWritable() — tenant +
     *    owner-user match (404) then `status !== 'in_progress'` (422), the exact
     *    check upload intent/confirm run.
     *  - question binding: assertPageQuestion() — tenant + exam match, included
     *    subset, essay/short-answer type.
     *  - answer binding: the page rows are re-fetched through the answer row of
     *    THIS (tenant, attempt, question) triple and each id is verified against
     *    it, mirroring ExamAnswerPageReadService::page().
     *
     * Media cleanup mirrors MediaLibraryAssetService::softDelete() — the Media
     * Library's own delete flow (Bunny object first, then a soft-deleted local
     * MediaAsset row) — never a new/fresh behavior.
     *
     * If the deleted page was the answer's LAST one, the answer row is reverted
     * to the unanswered state (answer_mode = text / grading_status =
     * auto_graded / answer null / answered_at null), i.e. exactly the state a
     * never-answered row has — never an ambiguous "answered but empty".
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
     * Same ownership + attempt-status + question-binding gates as deletePage.
     * The submitted id list must contain EXACTLY the full current page set of
     * the resolved (tenant, attempt, question) answer — no partial reorders,
     * no foreign/extra ids, no duplicates (422 otherwise). The unique
     * (tenant, answer, page_order) index is respected via a two-phase update
     * inside the single transaction.
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
     * Renumber a page collection to 0..n-1, two-phase so the unique
     * (tenant, answer, page_order) index is never transiently violated.
     *
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

    /**
     * Revert the answer row to the never-answered state. Matches the column
     * defaults added in 2026_09_08_000001 (answer_mode = 'text',
     * grading_status = 'auto_graded') plus a cleared answer/score/grade trail.
     */
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

    /**
     * Resolve the answer row of the (tenant, attempt, question) triple.
     * Mirrors ExamAnswerPageReadService::answerFor().
     */
    private function answerFor(ExamAttempt $attempt, ExamQuestion $examQuestion): ?ExamAttemptAnswer
    {
        return ExamAttemptAnswer::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('exam_attempt_id', $attempt->id)
            ->where('exam_question_id', $examQuestion->id)
            ->first();
    }

    /**
     * §2.5 / §3 response payload: the answer's id/mode/status plus the current
     * page list (id, page_order) for the answer.
     *
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

    /**
     * Answer row lifecycle (B2): confirm auto-creates the answer row when the
     * student uploads pages before typing a text answer, keyed by the
     * (tenant, exam_attempt, exam_question) unique index. The critical
     * invariant: when the row ALREADY exists (e.g. pending_manual_review from
     * a prior page, or with a typed answer), confirm only touches the page-mode
     * contract fields — it never overwrites `answer` or `is_correct`, and
     * ExamSessionService::saveAnswer() never touches answer_mode/grading_status
     * clobbering them either (see saveAnswer() updateOrCreate values).
     */
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
     * Build the client-direct PUT intent. Mirrors
     * BunnyStorageProvider::createUploadIntent() (upload_url = upload base +
     * storage key, AccessKey header, expiry) but derives the key from the page
     * path generator instead of an asset row that does not exist yet.
     *
     * @return array<string, mixed>
     */
    private function buildIntent(Tenant $tenant, string $storageKey, MediaUploadSession $session, ?string $mimeType): array
    {
        $provider = $this->manager->providerFor('bunny', 'storage');

        try {
            $config = $provider->configForTenant($tenant->id);
        } catch (RuntimeException $e) {
            throw ValidationException::withMessages([
                'integration' => ['File uploads are not available for this tenant.'],
            ]);
        }

        return [
            'provider' => 'bunny',
            'provider_service' => 'storage',
            'method' => 'PUT',
            'upload_url' => rtrim((string) ($config['upload_base_url'] ?? ''), '/')
                .'/'.ltrim($storageKey, '/'),
            'storage_key' => $storageKey,
            'expires_at' => $session->expires_at,
            'headers' => [
                'AccessKey' => $config['client_upload_key'] ?? null,
                'Content-Type' => $mimeType ?? 'application/octet-stream',
            ],
        ];
    }

    /**
     * Real existence verification: a HEAD metadata request against the storage
     * key. The generic BunnyStorageProvider::confirmUpload() never does this (it
     * returns confirmed=true unconditionally), so this is the explicit check the
     * confirm endpoint relies on. Missing object (400/404) -> client error;
     * auth/server failures bubble as-is.
     */
    private function assertStored(string $storageKey): void
    {
        if ($storageKey === '') {
            throw ValidationException::withMessages([
                'session' => ['The upload session has no storage key.'],
            ]);
        }

        try {
            $this->storage->getMetadata($storageKey);
        } catch (BunnyServiceException $e) {
            if (in_array($e->getCode(), [400, 404, 403], true)) {
                throw ValidationException::withMessages([
                    'session' => ['The upload was not found on storage. Please upload the file again.'],
                ]);
            }

            throw $e;
        }
    }

    /**
     * Mirrors saveAnswer()'s expiry handling + ensureInProgress() +
     * ensureAttemptOwnedByUser() so page uploads share the exact same attempt
     * state contract as every other session mutation.
     */
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

    /**
     * Mirrors assertQuestionBelongsToAttempt() plus the essay-type gate: pages
     * are only meaningful for the manually graded question types.
     */
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
