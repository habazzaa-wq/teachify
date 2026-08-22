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
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Lifecycle of a student exam session: start, resume, autosave answers,
 * track progress + anti-cheat events and submit for grading.
 *
 * Every write operation runs inside a database transaction and serializes on
 * the affected attempt row (or the exam row for start) using pessimistic
 * locks, so concurrent requests from multiple tabs cannot corrupt state.
 */
class ExamSessionService
{
    private const SUPPORTED_QUESTION_TYPES = ['single_choice', 'multiple_choice', 'true_false', 'numeric', 'essay', 'short_answer'];

    public function __construct(
        private readonly AccessEvaluationService $access,
        private readonly ExamGradingService $grading,
        private readonly ExamAnswerValidator $validator,
        private readonly ExamAnswerGrader $grader,
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
            // Serialize concurrent start requests per exam so that only one
            // active attempt can ever exist for a user.
            $exam = Exam::query()->lockForUpdate()->findOrFail($exam->id);

            $attempts = ExamAttempt::query()
                ->where('exam_id', $exam->id)
                ->where('user_id', $user->id)
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            $inProgress = $attempts->firstWhere('status', 'in_progress');

            if ($inProgress !== null) {
                if ($this->isExpired($inProgress)) {
                    $this->grading->grade($inProgress);
                } else {
                    return $inProgress;
                }
            }

            $attemptCount = $attempts->count();

            if ($exam->attempt_limit !== null && $attemptCount >= $exam->attempt_limit) {
                throw ValidationException::withMessages([
                    'attempt' => ['The maximum number of exam attempts has been reached.'],
                ]);
            }

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
            // Serialize concurrent practice starts on the exam row, mirroring start().
            Exam::query()->lockForUpdate()->findOrFail($exam->id);

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

        if ($attempt->status === 'in_progress' && $this->isExpired($attempt)) {
            $attempt = $this->grading->grade($attempt);
        }

        $exam = $attempt->exam()->firstOrFail();
        $examQuestions = $this->grading->questionsForAttempt($attempt, $exam);
        $answers = $attempt->answers()->get()->keyBy('exam_question_id');
        $revealCorrect = $attempt->status === 'submitted' && $exam->show_correct_answers;

        $questions = $examQuestions
            ->map(function (ExamQuestion $examQuestion) use ($answers, $revealCorrect): ExamSessionQuestionDto {
                $question = $examQuestion->question;
                $saved = $answers->get($examQuestion->id);
                $isCorrect = null;

                if ($saved !== null && $revealCorrect) {
                    $isCorrect = $this->grader->grade($question, $saved->answer);
                }

                $scanUrl = null;
                if ($question->question_format === 'image' && $question->media_asset_id) {
                    $scan = $question->scan;
                    $scanUrl = $scan?->cdn_url;
                }

                return new ExamSessionQuestionDto(
                    examQuestionId: (int) $examQuestion->id,
                    questionId: (int) $question->id,
                    type: $question->type,
                    title: $question->title,
                    description: $question->description,
                    points: $examQuestion->points ?? $question->points ?? 0,
                    order: (int) $examQuestion->order,
                    section: $examQuestion->section,
                    content: $this->sanitizeContent($question, $revealCorrect),
                    answer: $saved?->answer,
                    answered: $saved !== null,
                    isCorrect: $isCorrect,
                    questionFormat: $question->question_format ?? 'text',
                    scanUrl: $scanUrl,
                );
            })
            ->all();

        return new ExamSessionData(
            attempt: $this->serializeAttempt($attempt, $exam),
            questions: $questions,
        );
    }

    /**
     * @param  array<int, string>|string  $answer
     */
    public function saveAnswer(User $user, ExamAttempt $attempt, ExamQuestion $examQuestion, array|string $answer): ExamAttemptAnswer
    {
        // Expiry depends only on the immutable timer and server time, so it is
        // evaluated before taking the write lock. Finalizing grades in its own
        // committed transaction and then rejects the write.
        if ($attempt->status === 'in_progress' && $this->isExpired($attempt)) {
            $this->grading->grade($attempt);

            throw ValidationException::withMessages([
                'exam' => ['The exam time has expired. Your attempt was submitted automatically.'],
            ]);
        }

        return DB::transaction(function () use ($user, $attempt, $examQuestion, $answer): ExamAttemptAnswer {
            $attempt = $this->lockAttempt($attempt, $user);
            $this->ensureAttemptOwnedByUser($attempt, $user);
            $this->ensureInProgress($attempt);
            $this->assertQuestionBelongsToAttempt($attempt, $examQuestion);

            $normalized = $this->validator->validate($examQuestion->question, $answer);
            $isCorrect = $this->grader->grade($examQuestion->question, $normalized);
            $points = max(0, (int) ($examQuestion->points ?? $examQuestion->question?->points ?? 0));

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
            $this->grading->grade($attempt);

            throw ValidationException::withMessages([
                'exam' => ['The exam time has expired. Your attempt was submitted automatically.'],
            ]);
        }

        return DB::transaction(function () use ($user, $attempt, $data): ExamAttempt {
            $attempt = $this->lockAttempt($attempt, $user);
            $this->ensureAttemptOwnedByUser($attempt, $user);
            $this->ensureInProgress($attempt);

            $events = $data['events'] ?? [];

            if ($events !== []) {
                $attempt->antiCheatEvents()->createMany(array_map(
                    fn (array $event): array => [
                        'event_type' => $event['type'],
                        'occurred_at' => $event['occurred_at'] ?? now(),
                        'metadata' => $event['meta'] ?? null,
                    ],
                    $events,
                ));
            }

            if ($events !== [] || array_key_exists('current_question_index', $data)) {
                $attempt->forceFill([
                    'current_question_index' => $data['current_question_index'] ?? $attempt->current_question_index,
                ])->save();
            }

            return $attempt->refresh();
        });
    }

    public function submit(User $user, ExamAttempt $attempt): ExamAttempt
    {
        return DB::transaction(function () use ($user, $attempt): ExamAttempt {
            $attempt = $this->lockAttempt($attempt, $user);
            $this->ensureAttemptOwnedByUser($attempt, $user);

            if ($attempt->status === 'submitted') {
                return $attempt;
            }

            $this->ensureInProgress($attempt);

            return $this->grading->grade($attempt);
        });
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
            'exam' => [
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
            ],
        ];
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
