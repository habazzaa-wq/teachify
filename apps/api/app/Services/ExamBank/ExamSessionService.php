<?php

namespace App\Services\ExamBank;

use App\Models\CourseLesson;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamAttemptAnswer;
use App\Models\ExamQuestion;
use App\Models\Question;
use App\Models\User;
use App\Services\Access\AccessEvaluationService;
use App\Services\ExamBank\DTO\ExamSessionData;
use App\Services\ExamBank\DTO\ExamSessionQuestionDto;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Lifecycle of a student exam session: start, resume, autosave answers,
 * track progress + anti-cheat events and submit for grading.
 *
 * Concurrency model (P1):
 *  - Starting an exam does NOT lock the shared exam row, so many students can
 *    begin the same exam concurrently without serializing on one row. Only a
 *    user's own attempt rows are touched; the duplicate-active-attempt
 *    invariant (unique generated column on MySQL, P0) plus an application-level
 *    reload-on-duplicate-key path keep same-user starts idempotent.
 *  - Expired in-progress attempts are finalized exactly once via a claim flip
 *    to "grading" + a queued GradeExamAttemptJob, so expensive scoring never
 *    runs inside a GET/autosave request.
 *  - Submit freezes the attempt (status -> "grading") under a short attempt
 *    lock, then grades outside that lock; grading itself only ever locks the
 *    single attempt row it is scoring.
 */
class ExamSessionService
{
    private const SUPPORTED_QUESTION_TYPES = ['single_choice', 'multiple_choice', 'true_false', 'numeric', 'essay', 'short_answer'];

    /**
     * Hard caps so anti-cheat event spam can never block answer autosave or
     * blow up a row. The metadata payload is additionally size-capped.
     */
    private const MAX_ANTI_CHEAT_EVENTS_PER_REQUEST = 50;

    private const MAX_ANTI_CHEAT_METADATA_BYTES = 2048;

    public function __construct(
        private readonly AccessEvaluationService $access,
        private readonly ExamGradingService $grading,
        private readonly ExamAnswerValidator $validator,
        private readonly ExamAnswerGrader $grader,
        private readonly ExamCacheService $cache = new ExamCacheService(),
    ) {}

    public function start(User $user, CourseLesson $lesson): ExamAttempt
    {
        $exam = $lesson->exam;

        if ($exam === null || $exam->tenant_id !== currentTenant()->id) {
            throw ValidationException::withMessages([
                'exam' => ['The selected lesson has no exam.'],
            ]);
        }

        if ($exam->status !== 'published') {
            throw ValidationException::withMessages([
                'exam' => ['The exam is not published.'],
            ]);
        }

        if (! $this->access->canAccessLesson($user, $lesson)) {
            throw ValidationException::withMessages([
                'lesson' => ['The lesson is not accessible.'],
            ]);
        }

        $this->assertQuestionTypesSupported($exam);

        return DB::transaction(function () use ($user, $exam): ExamAttempt {
            // No shared exam row lock: students starting the SAME exam must not
            // serialize on one row. Only this user's own attempt rows are read
            // or written, so different users never contend with each other.

            // Reconcile an existing in-progress attempt for THIS user+exam.
            $inProgress = ExamAttempt::query()
                ->where('exam_id', $exam->id)
                ->where('user_id', $user->id)
                ->where('status', 'in_progress')
                ->lockForUpdate()
                ->first();

            if ($inProgress !== null) {
                if ($this->isExpired($inProgress)) {
                    // Finalize the stale attempt off the hot start path, then
                    // start a fresh one. A concurrent start may already have
                    // created the replacement, so re-check before inserting.
                    $this->grading->reconcileExpiredAttempt($inProgress);

                    $replacement = ExamAttempt::query()
                        ->where('exam_id', $exam->id)
                        ->where('user_id', $user->id)
                        ->where('status', 'in_progress')
                        ->latest('id')
                        ->first();

                    if ($replacement !== null) {
                        return $replacement;
                    }
                } else {
                    // Genuinely active attempt: return it (idempotent retry).
                    return $inProgress;
                }
            }

            $attemptCount = ExamAttempt::query()
                ->where('exam_id', $exam->id)
                ->where('user_id', $user->id)
                ->count();

            if ($exam->attempt_limit !== null && $attemptCount >= $exam->attempt_limit) {
                throw ValidationException::withMessages([
                    'attempt' => ['The maximum number of exam attempts has been reached.'],
                ]);
            }

            try {
                return $this->createAttempt($exam, $user, $attemptCount);
            } catch (QueryException $e) {
                // A concurrent start by the SAME user won the race and the
                // unique active-attempt guard (MySQL) rejected our insert.
                // Reload the winner instead of failing the request.
                if ($this->isDuplicateActiveAttemptKey($e)) {
                    return ExamAttempt::query()
                        ->where('exam_id', $exam->id)
                        ->where('user_id', $user->id)
                        ->where('status', 'in_progress')
                        ->latest('id')
                        ->firstOrFail();
                }

                throw $e;
            }
        });
    }

    /**
     * Start a dedicated practice attempt from a submitted source attempt.
     *
     * Only the questions the student answered incorrectly on the source attempt
     * are included, the attempt is never official, it is untimed and it is not
     * subject to the exam attempt limit. The practice engine is the exact same
     * session/grading pipeline — the subset lives on the attempt itself, so no
     * duplicate logic is introduced.
     *
     * The shared exam row is NOT locked: practice starts from different source
     * attempts / users must not convoy on one row.
     */
    public function startPractice(User $user, ExamAttempt $sourceAttempt): ExamAttempt
    {
        $this->ensureAttemptOwnedByUser($sourceAttempt, $user);

        if ($sourceAttempt->status !== 'submitted') {
            throw ValidationException::withMessages([
                'attempt' => ['A submitted attempt is required to start practice.'],
            ]);
        }

        $exam = $sourceAttempt->exam()->firstOrFail();

        if ($exam->tenant_id !== currentTenant()->id) {
            abort(404);
        }

        $this->assertQuestionTypesSupported($exam);

        $wrongQuestionIds = $sourceAttempt->answers()
            ->where('is_correct', false)
            ->get()
            ->pluck('exam_question_id')
            ->map(fn (mixed $id): string => (string) $id)
            ->values()
            ->all();

        if ($wrongQuestionIds === []) {
            throw ValidationException::withMessages([
                'attempt' => ['There are no wrong questions to practice.'],
            ]);
        }

        return DB::transaction(function () use ($user, $sourceAttempt, $exam, $wrongQuestionIds): ExamAttempt {
            return ExamAttempt::create([
                'exam_id' => $exam->id,
                'user_id' => $user->id,
                'score' => 0,
                'max_score' => 0,
                'percentage' => 0,
                'passed' => false,
                'is_official' => false,
                'is_practice' => true,
                'status' => 'in_progress',
                'started_at' => now(),
                'timer_ends_at' => null,
                'anti_cheat_events' => [],
                'practice_source_attempt_id' => $sourceAttempt->id,
                'included_exam_question_ids' => $wrongQuestionIds,
            ])->refresh();
        });
    }

    public function current(User $user, Exam $exam): ?ExamAttempt
    {
        return ExamAttempt::query()
            ->where('exam_id', $exam->id)
            ->where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->latest('id')
            ->first();
    }

    /**
     * The student's single active attempt across all exams of the current
     * tenant, when one still exists.
     *
     * An attempt only counts as "active" when:
     *  - it is still in_progress,
     *  - it was never submitted,
     *  - its timer has not expired (untimed attempts are always active), and
     *  - its exam is still published (teacher archive/close hides it).
     *
     * This is intentionally a pure read — it never grades or mutates state.
     */
    public function activeAttempt(User $user): ?ExamAttempt
    {
        return ExamAttempt::query()
            ->where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->whereNull('submitted_at')
            ->where(function ($query): void {
                $query->whereNull('timer_ends_at')->orWhere('timer_ends_at', '>', now());
            })
            ->whereHas('exam', function ($query): void {
                $query->where('status', 'published');
            })
            ->latest('id')
            ->first();
    }

    public function session(ExamAttempt $attempt, User $user): ExamSessionData
    {
        $this->ensureAttemptOwnedByUser($attempt, $user);

        // Cheap expiry detection; grading (if needed) is claimed + queued, so
        // this read never performs expensive synchronous scoring.
        $attempt = $this->grading->reconcileExpiredAttempt($attempt);

        $exam = $attempt->exam()->firstOrFail();
        $examQuestions = $this->grading->questionsForAttempt($attempt, $exam);
        $answers = $attempt->answers()->get()->keyBy('exam_question_id');
        $revealCorrect = $attempt->status === 'submitted' && $exam->show_correct_answers;

        // The immutable, sanitized question content is identical for every
        // session request of the same (exam, subset, reveal-correct) tuple and
        // is expensive to rebuild (it walks the question content JSON). Cache it
        // per tenant/exam so repeated start/current/show calls reuse it. Per-
        // attempt state (answers, isCorrect) is merged in from the DB below and
        // is NEVER cached.
        $subsetKey = $this->subsetKey($attempt);
        $tenantId = $exam->tenant_id;

        $immutable = $this->cache->questionSet($tenantId, $exam->id, $subsetKey, $revealCorrect);

        if ($immutable === null) {
            $immutable = $examQuestions
                ->map(fn (ExamQuestion $examQuestion): array => $this->immutableQuestionData($examQuestion, $revealCorrect))
                ->all();

            $this->cache->setQuestionSet($tenantId, $exam->id, $subsetKey, $revealCorrect, $immutable);
        }

        $questions = [];

        foreach ($immutable as $item) {
            $examQuestion = $examQuestions->firstWhere('id', $item['examQuestionId']);
            $question = $examQuestion?->question;
            $saved = $answers->get($item['examQuestionId']);

            $isCorrect = null;
            if ($saved !== null && $revealCorrect && $question !== null) {
                $isCorrect = $this->grader->grade($question, $saved->answer);
            }

            $questions[] = new ExamSessionQuestionDto(
                examQuestionId: $item['examQuestionId'],
                questionId: $item['questionId'],
                type: $item['type'],
                title: $item['title'],
                description: $item['description'],
                points: $item['points'],
                order: $item['order'],
                section: $item['section'],
                content: $item['content'],
                contentDocument: $item['contentDocument'],
                answer: $saved?->answer,
                answered: $saved !== null,
                isCorrect: $isCorrect,
                questionFormat: $item['questionFormat'],
                scanUrl: null,
            );
        }

        return new ExamSessionData(
            attempt: $this->serializeAttempt($attempt, $exam),
            questions: $questions,
        );
    }

    /**
     * Build the immutable portion of a session question DTO (everything except
     * per-attempt answer state). Safe to cache across requests.
     *
     * @return array<string, mixed>
     */
    private function immutableQuestionData(ExamQuestion $examQuestion, bool $revealCorrect): array
    {
        $question = $examQuestion->question;

        return [
            'examQuestionId' => (int) $examQuestion->id,
            'questionId' => (int) $question->id,
            'type' => $question->type,
            'title' => $question->title,
            'description' => $question->description,
            'points' => $examQuestion->points ?? $question->points ?? 0,
            'order' => (int) $examQuestion->order,
            'section' => $examQuestion->section,
            'content' => $this->sanitizeContent($question, $revealCorrect),
            'contentDocument' => $question->question_format === 'structured' ? $question->content_document : null,
            'questionFormat' => $question->question_format ?? 'text',
        ];
    }

    /**
     * Stable key for the exam-question subset an attempt renders. Practice
     * attempts restrict to a fixed set of question ids; normal attempts use "".
     */
    private function subsetKey(ExamAttempt $attempt): string
    {
        $included = $attempt->included_exam_question_ids;

        if (! is_array($included) || $included === []) {
            return '';
        }

        $ids = array_map('strval', $included);
        sort($ids);

        return implode('-', $ids);
    }

    /**
     * @param  array<int, string>|string  $answer
     */
    public function saveAnswer(User $user, ExamAttempt $attempt, ExamQuestion $examQuestion, array|string $answer): ExamAttemptAnswer
    {
        // Expiry depends only on the immutable timer and server time, so it is
        // evaluated before taking the write lock. The attempt is finalized
        // (claimed + queued) and the write is rejected.
        if ($attempt->status === 'in_progress' && $this->isExpired($attempt)) {
            $this->grading->reconcileExpiredAttempt($attempt);

            throw ValidationException::withMessages([
                'exam' => ['The exam time has expired. Your attempt was submitted automatically.'],
            ]);
        }

        // Validate + score the answer BEFORE acquiring the attempt lock so the
        // critical section only performs the idempotent upsert.
        $examQuestion->load('question');
        $normalized = $this->validator->validate($examQuestion->question, $answer);
        $isCorrect = $this->grader->grade($examQuestion->question, $normalized);
        $points = max(0, (int) ($examQuestion->points ?? $examQuestion->question?->points ?? 0));

        return DB::transaction(function () use ($user, $attempt, $examQuestion, $normalized, $isCorrect, $points): ExamAttemptAnswer {
            $attempt = $this->lockAttempt($attempt, $user);
            $this->ensureAttemptOwnedByUser($attempt, $user);
            $this->ensureInProgress($attempt);
            $this->assertQuestionBelongsToAttempt($attempt, $examQuestion);

            $saved = ExamAttemptAnswer::updateOrCreate(
                [
                    'exam_attempt_id' => $attempt->id,
                    'exam_question_id' => $examQuestion->id,
                ],
                [
                    'question_id' => $examQuestion->question_id,
                    'answer' => $normalized,
                    'is_correct' => $isCorrect,
                    'earned_points' => $isCorrect ? $points : 0,
                    'answered_at' => now(),
                ],
            );

            $saved->setRelation('attempt', $attempt);

            return $saved;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function saveProgress(User $user, ExamAttempt $attempt, array $data): ExamAttempt
    {
        if ($attempt->status === 'in_progress' && $this->isExpired($attempt)) {
            $this->grading->reconcileExpiredAttempt($attempt);

            throw ValidationException::withMessages([
                'exam' => ['The exam time has expired. Your attempt was submitted automatically.'],
            ]);
        }

        $events = $data['events'] ?? [];
        $index = $data['current_question_index'] ?? null;

        // Only hold the attempt row lock for the minimal state update;
        // append-only anti-cheat writes happen after the lock is released.
        $attempt = DB::transaction(function () use ($user, $attempt, $index): ExamAttempt {
            $attempt = $this->lockAttempt($attempt, $user);
            $this->ensureAttemptOwnedByUser($attempt, $user);
            $this->ensureInProgress($attempt);

            if ($index !== null) {
                $attempt->forceFill(['current_question_index' => $index])->save();
            }

            return $attempt->refresh();
        });

        if ($events !== [] && is_array($events)) {
            $this->recordAntiCheatEvents($attempt, $events);
        }

        return $attempt;
    }

    public function submit(User $user, ExamAttempt $attempt): ExamAttempt
    {
        // Freeze (critical transition) under a short attempt lock, then grade
        // OUTSIDE the lock so no long CPU-heavy work happens while it is held.
        $frozen = DB::transaction(function () use ($user, $attempt): ExamAttempt {
            $attempt = $this->lockAttempt($attempt, $user);
            $this->ensureAttemptOwnedByUser($attempt, $user);

            if ($attempt->status === 'submitted') {
                return $attempt;
            }

            if ($attempt->status === 'grading') {
                return $attempt;
            }

            $this->ensureInProgress($attempt);

            // Claim the grading work so a concurrent submit cannot double-grade.
            $attempt->forceFill(['status' => 'grading'])->save();

            return $attempt->refresh();
        });

        try {
            return $this->grading->grade($frozen);
        } catch (Throwable $e) {
            // Release the freeze so the student can safely retry.
            ExamAttempt::withoutGlobalScopes()
                ->where('id', $frozen->id)
                ->where('status', 'grading')
                ->update(['status' => 'in_progress']);

            throw $e;
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function recordAntiCheatEvents(ExamAttempt $attempt, array $events): void
    {
        $rows = [];

        foreach (array_slice($events, 0, self::MAX_ANTI_CHEAT_EVENTS_PER_REQUEST) as $event) {
            if (! is_array($event)) {
                continue;
            }

            $type = $event['type'] ?? null;

            if (! is_string($type) || $type === '') {
                $type = 'unknown';
            }

            $rows[] = [
                'event_type' => $type,
                'occurred_at' => $event['occurred_at'] ?? now(),
                'metadata' => $this->normalizeAntiCheatMetadata($event['meta'] ?? null),
            ];
        }

        if ($rows !== []) {
            $attempt->antiCheatEvents()->createMany($rows);
        }
    }

    /**
     * Cap the metadata payload so a single oversized event cannot balloon a row
     * or block the autosave path. Oversized payloads are recorded as truncated.
     *
     * @return array<string, mixed>|null
     */
    private function normalizeAntiCheatMetadata(mixed $meta): ?array
    {
        if ($meta === null) {
            return null;
        }

        if (! is_array($meta)) {
            return ['value' => (string) $meta];
        }

        $json = json_encode($meta, JSON_UNESCAPED_UNICODE);

        if ($json === false || strlen($json) > self::MAX_ANTI_CHEAT_METADATA_BYTES) {
            return ['truncated' => true, 'bytes' => strlen($json !== false ? $json : '')];
        }

        return $meta;
    }

    private function createAttempt(Exam $exam, User $user, int $attemptCount): ExamAttempt
    {
        return ExamAttempt::create([
            'exam_id' => $exam->id,
            'user_id' => $user->id,
            'score' => 0,
            'max_score' => 0,
            'percentage' => 0,
            'passed' => false,
            'is_official' => $attemptCount === 0,
            'is_practice' => $attemptCount > 0,
            'status' => 'in_progress',
            'started_at' => now(),
            'timer_ends_at' => $exam->duration ? now()->addMinutes($exam->duration) : null,
            'anti_cheat_events' => [],
        ])->refresh();
    }

    /**
     * Re-reads the attempt with a pessimistic write lock, guaranteeing the
     * caller observes (and serializes against) any concurrent status change.
     */
    private function lockAttempt(ExamAttempt $attempt, User $user): ExamAttempt
    {
        $locked = ExamAttempt::query()->lockForUpdate()->find($attempt->id);

        if ($locked === null || $locked->tenant_id !== currentTenant()->id || $locked->user_id !== $user->id) {
            abort(404);
        }

        return $locked;
    }

    private function isExpired(ExamAttempt $attempt): bool
    {
        return $attempt->timer_ends_at !== null && now()->greaterThanOrEqualTo($attempt->timer_ends_at);
    }

    private function isDuplicateActiveAttemptKey(QueryException $e): bool
    {
        if ($e->getCode() !== '23000') {
            return false;
        }

        return str_contains($e->getMessage(), 'exam_attempts_active_attempt_guard_unique');
    }

    private function ensureInProgress(ExamAttempt $attempt): void
    {
        if ($attempt->status !== 'in_progress') {
            throw ValidationException::withMessages([
                'attempt' => ['Only in-progress attempts can be modified.'],
            ]);
        }
    }

    private function ensureAttemptOwnedByUser(ExamAttempt $attempt, User $user): void
    {
        if ($attempt->tenant_id !== currentTenant()->id || $attempt->user_id !== $user->id) {
            abort(404);
        }
    }

    private function assertQuestionBelongsToAttempt(ExamAttempt $attempt, ExamQuestion $examQuestion): void
    {
        if ($examQuestion->tenant_id !== currentTenant()->id || $examQuestion->exam_id !== $attempt->exam_id) {
            abort(404);
        }

        $included = $attempt->included_exam_question_ids;

        if (is_array($included) && $included !== [] && ! in_array((string) $examQuestion->id, array_map('strval', $included), true)) {
            abort(404);
        }
    }

    private function assertQuestionTypesSupported(Exam $exam): void
    {
        $types = $exam->examQuestions()
            ->with('question')
            ->get()
            ->map(fn (ExamQuestion $examQuestion): ?string => $examQuestion->question?->type)
            ->filter()
            ->unique()
            ->values();

        if ($types->isEmpty()) {
            throw ValidationException::withMessages([
                'exam' => ['The exam has no questions.'],
            ]);
        }

        $unsupported = $types->reject(fn (string $type): bool => in_array($type, self::SUPPORTED_QUESTION_TYPES, true));

        if ($unsupported->isNotEmpty()) {
            throw ValidationException::withMessages([
                'exam' => ['This exam contains question types that cannot be auto-graded yet.'],
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeAttempt(ExamAttempt $attempt, Exam $exam): array
    {
        $remaining = null;

        if ($attempt->status === 'in_progress' && $attempt->timer_ends_at !== null) {
            $remaining = max(0, $attempt->timer_ends_at->getTimestamp() - now()->getTimestamp());
        }

        return [
            'id' => (string) $attempt->id,
            'examId' => (string) $exam->id,
            'status' => $attempt->status,
            'isOfficial' => $attempt->is_official,
            'isPractice' => $attempt->is_practice,
            'score' => (float) $attempt->score,
            'maxScore' => (float) $attempt->max_score,
            'percentage' => $attempt->percentage !== null ? (float) $attempt->percentage : null,
            'passed' => $attempt->passed,
            'durationSeconds' => $attempt->duration_seconds,
            'currentQuestionIndex' => $attempt->current_question_index,
            'startedAt' => $attempt->started_at?->toIso8601String(),
            'submittedAt' => $attempt->submitted_at?->toIso8601String(),
            'timerEndsAt' => $attempt->timer_ends_at?->toIso8601String(),
            'remainingSeconds' => $remaining,
            'exam' => $this->examMeta($exam),
        ];
    }

    /**
     * Static, per-(tenant, exam) metadata block. Cached with a short TTL and
     * invalidated on every exam mutation. Per-attempt fields (timer, score) are
     * NOT part of this cache.
     *
     * @return array<string, mixed>
     */
    private function examMeta(Exam $exam): array
    {
        $tenantId = $exam->tenant_id;
        $examId = $exam->id;

        $cached = $this->cache->meta($tenantId, $examId);

        if (is_array($cached)) {
            return $cached;
        }

        $meta = [
            'id' => (string) $exam->id,
            'title' => $exam->title,
            'description' => $exam->description,
            'duration' => $exam->duration,
            'passingScore' => (int) $exam->passing_score,
            'totalPoints' => (int) $exam->total_points,
            'questionCount' => (int) $exam->question_count,
            'shuffleQuestions' => $exam->shuffle_questions,
            'showResults' => $exam->show_results,
            'showCorrectAnswers' => $exam->show_correct_answers,
        ];

        $this->cache->setMeta($tenantId, $examId, $meta);

        return $meta;
    }

    /**
     * Sanitizes question content for the student payload. Correct answers are
     * stripped unless the attempt was submitted and the exam allows showing them.
     *
     * @return array<string, mixed>
     */
    private function sanitizeContent(Question $question, bool $revealCorrect = false): array
    {
        $content = $question->content ?? [];

        return match ($question->type) {
            'single_choice', 'multiple_choice' => [
                'options' => collect($content['options'] ?? [])
                    ->map(fn (array $option): array => $revealCorrect
                        ? [
                            'id' => (string) ($option['id'] ?? ''),
                            'text' => $option['text'] ?? '',
                            'correct' => (bool) ($option['correct'] ?? false),
                        ]
                        : [
                            'id' => (string) ($option['id'] ?? ''),
                            'text' => $option['text'] ?? '',
                        ])
                    ->values()
                    ->all(),
            ],
            'true_false' => $revealCorrect && isset($content['correct'])
                ? ['correct' => (string) $content['correct']]
                : [],
            'numeric' => array_filter([
                'tolerance' => (int) ($content['tolerance'] ?? 0),
                'correct' => $revealCorrect ? $this->numericCorrectValue($content) : null,
            ], fn (mixed $value): bool => $value !== null),
            'essay', 'short_answer' => [],
            default => [],
        };
    }

    /**
     * Numeric questions store their expected value under `answer` (teacher UI)
     * or `correct` (seed data).
     *
     * @param  array<string, mixed>  $content
     */
    private function numericCorrectValue(array $content): ?string
    {
        $value = $content['answer'] ?? $content['correct'] ?? null;

        return is_numeric($value) ? (string) $value : null;
    }
}
