<?php

namespace Tests\Feature;

use App\Jobs\ExamBank\GradeExamAttemptJob;
use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\Exam;
use App\Models\ExamAntiCheatEvent;
use App\Models\ExamAttempt;
use App\Models\ExamAttemptAnswer;
use App\Models\ExamQuestion;
use App\Models\Permission;
use App\Models\Question;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\ExamBank\ExamGradingService;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * P1 concurrency / contention regression suite for the exam engine.
 *
 * NOTE: the test database is SQLite, which serializes writes at the
 * connection level, so true lock-convoy behavior cannot be reproduced here.
 * These tests assert the *observable* invariants (idempotency, single active
 * attempt, claim-once grading, tenant isolation) produced by the P1 design.
 * MySQL-level lock behavior is reported as NOT VERIFIED.
 */
class ExamConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    public function test_same_user_starting_twice_is_idempotent(): void
    {
        [$tenant, $admin, $student, $lesson] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $first = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()->json('data.attempt.id');
        $second = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()->json('data.attempt.id');

        $this->assertSame($first, $second);
        $this->assertSame(1, ExamAttempt::query()->where('exam_id', $this->latestExam($tenant))->count());
    }

    public function test_different_users_start_same_exam_without_shared_lock_conflict(): void
    {
        [$tenant, $admin, $studentA, $lesson, $exam, $links, $course] = $this->sessionFixture();

        $studentB = $this->memberWithRole($tenant, 'student');
        $this->enrollStudent($tenant, $admin, $course, $studentB);

        Sanctum::actingAs($studentA->user);
        $a = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()->json('data.attempt.id');

        Sanctum::actingAs($studentB->user);
        $b = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()->json('data.attempt.id');

        $this->assertNotSame($a, $b);
        // Each user gets exactly one active attempt; no convoy, no collision.
        $this->assertSame(1, ExamAttempt::query()->where('id', $a)->where('user_id', $studentA->user->id)->count());
        $this->assertSame(1, ExamAttempt::query()->where('id', $b)->where('user_id', $studentB->user->id)->count());
        $this->assertSame(2, ExamAttempt::query()->where('exam_id', $exam)->where('status', 'in_progress')->count());
    }

    public function test_duplicate_active_attempt_remains_impossible_for_same_user(): void
    {
        [$tenant, $admin, $student, $lesson] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated();
        $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated();
        $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated();

        $ids = ExamAttempt::query()
            ->where('exam_id', $this->latestExam($tenant))
            ->where('user_id', $student->user->id)
            ->where('status', 'in_progress')
            ->pluck('id');

        $this->assertCount(1, $ids, 'Exactly one active attempt must exist for the user.');
    }

    public function test_existing_submitted_attempt_allows_a_new_start(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $first = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()->json('data.attempt.id');
        $this->postJson("/api/v1/exam-sessions/{$first}/submit", [], $this->tenantHeader($tenant))->assertOk();

        $second = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()->json('data.attempt.id');

        $this->assertNotSame($first, $second);
        $this->assertSame('in_progress', ExamAttempt::query()->where('id', $second)->value('status'));
    }

    public function test_read_path_expired_attempt_is_claimed_and_queued_not_graded_inline(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()->json('data');

        ExamAttempt::withoutGlobalScopes()
            ->whereKey($data['attempt']['id'])
            ->update(['timer_ends_at' => now()->subMinutes(5)]);

        Queue::fake();

        $this->getJson("/api/v1/exam-sessions/{$data['attempt']['id']}", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.attempt.status', 'grading');

        // Grading was moved to the queue, not performed inline on the GET.
        Queue::assertPushed(GradeExamAttemptJob::class, 1);
    }

    public function test_concurrent_expiration_checks_enqueue_grading_only_once(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()->json('data');

        ExamAttempt::withoutGlobalScopes()
            ->whereKey($data['attempt']['id'])
            ->update(['timer_ends_at' => now()->subMinutes(5)]);

        Queue::fake();

        // Two simultaneous refreshes of the same expired attempt.
        $this->getJson("/api/v1/exam-sessions/{$data['attempt']['id']}", $this->tenantHeader($tenant))->assertOk();
        $this->getJson("/api/v1/exam-sessions/{$data['attempt']['id']}", $this->tenantHeader($tenant))->assertOk();

        // Claim-once guarantees a single grading job, never a duplicate.
        Queue::assertPushed(GradeExamAttemptJob::class, 1);
    }

    public function test_grading_job_finalizes_attempt_and_is_idempotent(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()->json('data');
        $this->answerCorrectly($tenant, $exam, $data, $links);

        ExamAttempt::withoutGlobalScopes()
            ->whereKey($data['attempt']['id'])
            ->update(['timer_ends_at' => now()->subMinutes(5), 'status' => 'grading']);

        $job = new GradeExamAttemptJob($tenant->id, (int) $data['attempt']['id']);

        $job->handle($this->app->make(ExamGradingService::class));
        $this->assertSame('submitted', ExamAttempt::withoutGlobalScopes()->whereKey($data['attempt']['id'])->value('status'));
        $this->assertSame(100.0, (float) ExamAttempt::withoutGlobalScopes()->whereKey($data['attempt']['id'])->value('percentage'));

        // Re-running must not double-grade or error.
        $job->handle($this->app->make(ExamGradingService::class));
        $this->assertSame('submitted', ExamAttempt::withoutGlobalScopes()->whereKey($data['attempt']['id'])->value('status'));
    }

    public function test_grading_job_release_freeze_on_failure(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()->json('data');

        ExamAttempt::withoutGlobalScopes()
            ->whereKey($data['attempt']['id'])
            ->update(['status' => 'grading']);

        $job = new GradeExamAttemptJob($tenant->id, (int) $data['attempt']['id']);
        $job->failed(new \RuntimeException('boom'));

        $this->assertSame('in_progress', ExamAttempt::withoutGlobalScopes()->whereKey($data['attempt']['id'])->value('status'));
    }

    public function test_submit_once_and_idempotent_twice(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()->json('data');
        $this->answerCorrectly($tenant, $exam, $data, $links);

        $first = $this->postJson("/api/v1/exam-sessions/{$data['attempt']['id']}/submit", [], $this->tenantHeader($tenant))
            ->assertOk()->json('data.attempt');
        $second = $this->postJson("/api/v1/exam-sessions/{$data['attempt']['id']}/submit", [], $this->tenantHeader($tenant))
            ->assertOk()->json('data.attempt');

        $this->assertSame('submitted', $second['status']);
        $this->assertSame($first['submittedAt'], $second['submittedAt']);
        $this->assertSame($first['score'], $second['score']);
        $this->assertSame((float) $first['score'], 3.0);
    }

    public function test_repeated_autosave_same_answer_is_idempotent(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()->json('data');
        $single = $data['questions'][0];
        $correct = $this->correctOptionFor($tenant, $exam, $single['questionId']);

        $this->putJson("/api/v1/exam-sessions/{$data['attempt']['id']}/answers/{$single['examQuestionId']}", ['answer' => [$correct]], $this->tenantHeader($tenant))->assertOk();
        $this->putJson("/api/v1/exam-sessions/{$data['attempt']['id']}/answers/{$single['examQuestionId']}", ['answer' => [$correct]], $this->tenantHeader($tenant))->assertOk();
        $this->putJson("/api/v1/exam-sessions/{$data['attempt']['id']}/answers/{$single['examQuestionId']}", ['answer' => [$correct]], $this->tenantHeader($tenant))->assertOk();

        $this->assertSame(1, ExamAttemptAnswer::query()->where('exam_attempt_id', $data['attempt']['id'])->count());
        $this->assertTrue(ExamAttemptAnswer::query()->where('exam_attempt_id', $data['attempt']['id'])->value('is_correct'));
    }

    public function test_concurrent_autosave_different_questions(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()->json('data');

        $this->putJson("/api/v1/exam-sessions/{$data['attempt']['id']}/answers/{$data['questions'][0]['examQuestionId']}", ['answer' => [$this->correctOptionFor($tenant, $exam, $data['questions'][0]['questionId'])]], $this->tenantHeader($tenant))->assertOk();
        $this->putJson("/api/v1/exam-sessions/{$data['attempt']['id']}/answers/{$data['questions'][1]['examQuestionId']}", ['answer' => $this->correctOptionsFor($tenant, $exam, $data['questions'][1]['questionId'])], $this->tenantHeader($tenant))->assertOk();

        $this->assertSame(2, ExamAttemptAnswer::query()->where('exam_attempt_id', $data['attempt']['id'])->count());
    }

    public function test_autosave_after_submit_is_rejected(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()->json('data');
        $this->postJson("/api/v1/exam-sessions/{$data['attempt']['id']}/submit", [], $this->tenantHeader($tenant))->assertOk();

        $this->putJson("/api/v1/exam-sessions/{$data['attempt']['id']}/answers/{$data['questions'][0]['examQuestionId']}", ['answer' => [$this->correctOptionFor($tenant, $exam, $data['questions'][0]['questionId'])]], $this->tenantHeader($tenant))
            ->assertUnprocessable();
    }

    public function test_expired_attempt_autosave_is_rejected_and_finalized(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()->json('data');

        ExamAttempt::withoutGlobalScopes()
            ->whereKey($data['attempt']['id'])
            ->update(['timer_ends_at' => now()->subMinutes(5)]);

        $this->putJson("/api/v1/exam-sessions/{$data['attempt']['id']}/answers/{$data['questions'][0]['examQuestionId']}", ['answer' => [$this->correctOptionFor($tenant, $exam, $data['questions'][0]['questionId'])]], $this->tenantHeader($tenant))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['exam']);

        $this->assertSame('submitted', ExamAttempt::withoutGlobalScopes()->whereKey($data['attempt']['id'])->value('status'));
    }

    public function test_anti_cheat_events_stored_without_holding_attempt_lock_long(): void
    {
        [$tenant, $admin, $student, $lesson] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()->json('data');

        $this->putJson("/api/v1/exam-sessions/{$data['attempt']['id']}/progress", [
            'current_question_index' => 1,
            'events' => [
                ['type' => 'window_blur', 'occurred_at' => now()->toIso8601String()],
                ['type' => 'tab_hidden'],
            ],
        ], $this->tenantHeader($tenant))->assertOk();

        $this->assertSame(2, ExamAntiCheatEvent::query()->where('exam_attempt_id', $data['attempt']['id'])->count());
    }

    public function test_oversized_anti_cheat_payload_is_truncated(): void
    {
        [$tenant, $admin, $student, $lesson] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()->json('data');

        $huge = ['note' => str_repeat('x', 5000)];
        $this->putJson("/api/v1/exam-sessions/{$data['attempt']['id']}/progress", [
            'current_question_index' => 1,
            'events' => [['type' => 'window_blur', 'meta' => $huge]],
        ], $this->tenantHeader($tenant))->assertOk();

        $event = ExamAntiCheatEvent::query()->where('exam_attempt_id', $data['attempt']['id'])->firstOrFail();
        $this->assertArrayHasKey('truncated', $event->metadata);
    }

    public function test_cross_tenant_attempt_is_rejected(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $attempt = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()->json('data.attempt.id');

        $foreign = Tenant::factory()->create();
        $foreignStudent = $this->memberWithRole($foreign, 'student');
        Sanctum::actingAs($foreignStudent->user);

        $this->putJson("/api/v1/exam-sessions/{$attempt}/progress", [
            'current_question_index' => 1,
            'events' => [['type' => 'window_blur']],
        ], $this->tenantHeader($foreign))->assertNotFound();

        $this->assertSame(0, ExamAntiCheatEvent::query()->where('exam_attempt_id', $attempt)->count());
    }

    // ----- Fixture (mirrors ExamSessionFoundationTest) -----

    /**
     * @return array{0:Tenant,1:TenantUser,2:TenantUser,3:int,4:int,5:list<int>}
     */
    private function sessionFixture(int $attemptLimit = 3): array
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Session Fixture');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $this->enrollStudent($tenant, $admin, $course, $student);
        $exam = $this->createPublishedExam($tenant, $admin, [
            'title' => 'Session Exam',
            'duration' => 30,
            'passing_score' => 60,
            'attempt_limit' => $attemptLimit,
        ]);

        $single = $this->createQuestion($tenant, $admin, 'single_choice', [
            'options' => [
                ['id' => 'opt-a', 'text' => 'Correct', 'correct' => true],
                ['id' => 'opt-b', 'text' => 'Wrong', 'correct' => false],
            ],
        ]);
        $multiple = $this->createQuestion($tenant, $admin, 'multiple_choice', [
            'options' => [
                ['id' => 'opt-x', 'text' => 'X', 'correct' => true],
                ['id' => 'opt-y', 'text' => 'Y', 'correct' => true],
                ['id' => 'opt-z', 'text' => 'Z', 'correct' => false],
            ],
        ]);
        $trueFalse = $this->createQuestion($tenant, $admin, 'true_false', ['correct' => 'true']);

        $links = [];
        foreach ([$single, $multiple, $trueFalse] as $questionId) {
            $links[] = $this->attachQuestionToExam($tenant, $admin, $exam, $questionId);
        }

        $this->attachExamToLesson($tenant, $admin, $course, $section, $lesson, $exam);

        return [$tenant, $admin, $student, $lesson, $exam, $links, $course];
    }

    /**
     * @param  array<string, mixed>  $content
     */
    private function createQuestion(Tenant $tenant, TenantUser $manager, string $type, array $content): int
    {
        Sanctum::actingAs($manager->user);

        return (int) $this->postJson('/api/v1/exam-bank/questions', [
            'title' => "Session {$type} question",
            'type' => $type,
            'content' => $content,
            'points' => 1,
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.id');
    }

    private function attachQuestionToExam(Tenant $tenant, TenantUser $manager, int $exam, int $questionId): int
    {
        Sanctum::actingAs($manager->user);

        $this->postJson("/api/v1/exam-bank/exams/{$exam}/questions", [
            'question_id' => $questionId,
        ], $this->tenantHeader($tenant))->assertOk();

        return (int) ExamQuestion::query()
            ->withoutGlobalScopes()
            ->where('exam_id', $exam)
            ->where('question_id', $questionId)
            ->value('id');
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  list<int>  $links
     */
    private function answerCorrectly(Tenant $tenant, int $exam, array $data, array $links): void
    {
        $questions = collect($data['questions']);

        foreach ($questions as $question) {
            $answer = match ($question['type']) {
                'single_choice' => [$this->correctOptionFor($tenant, $exam, $question['questionId'])],
                'multiple_choice' => $this->correctOptionsFor($tenant, $exam, $question['questionId']),
                'true_false' => 'true',
                default => null,
            };

            if ($answer === null) {
                continue;
            }

            $this->putJson(
                "/api/v1/exam-sessions/{$data['attempt']['id']}/answers/{$question['examQuestionId']}",
                ['answer' => $answer],
                $this->tenantHeader($tenant),
            )->assertOk();
        }
    }

    private function correctOptionFor(Tenant $tenant, int $exam, int $questionId): string
    {
        $question = Question::query()->findOrFail($questionId);

        return (string) collect($question->content['options'] ?? [])->firstWhere('correct', true)['id'];
    }

    private function wrongOptionFor(Tenant $tenant, int $exam, int $questionId): string
    {
        $question = Question::query()->findOrFail($questionId);

        return (string) collect($question->content['options'] ?? [])->firstWhere('correct', false)['id'];
    }

    /**
     * @return list<string>
     */
    private function correctOptionsFor(Tenant $tenant, int $exam, int $questionId): array
    {
        $question = Question::query()->findOrFail($questionId);

        return collect($question->content['options'] ?? [])
            ->where('correct', true)
            ->pluck('id')
            ->map(fn (mixed $id): string => (string) $id)
            ->values()
            ->all();
    }

    private function latestExam(Tenant $tenant): int
    {
        return (int) Exam::query()->latest('id')->value('id');
    }

    /**
     * @return array{0:int,1:int,2:int}
     */
    private function publishedLessonStack(
        Tenant $tenant,
        TenantUser $manager,
        string $title,
        ?TenantUser $primaryInstructor = null,
    ): array {
        Sanctum::actingAs($manager->user);

        $payload = [
            'title' => "{$title} Course",
            'slug' => str("{$title} Course")->slug()->toString(),
        ];

        if ($primaryInstructor) {
            $payload['primary_instructor_tenant_user_id'] = $primaryInstructor->id;
        }

        $course = $this->postJson('/api/v1/courses', $payload, $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.id');

        Course::withoutGlobalScopes()->whereKey($course)->update(['status' => 'published', 'visibility' => 'public']);

        $section = $this->postJson("/api/v1/courses/{$course}/sections", [
            'title' => "{$title} Section",
            'sort_order' => 1,
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.id');

        CourseSection::withoutGlobalScopes()->whereKey($section)->update(['status' => 'published', 'is_published' => true]);

        $lesson = $this->postJson("/api/v1/courses/{$course}/sections/{$section}/lessons", [
            'title' => "{$title} Lesson",
            'slug' => str("{$title} Lesson")->slug()->toString(),
            'lesson_type' => 'exam',
            'visibility' => 'private',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.id');

        CourseLesson::withoutGlobalScopes()->whereKey($lesson)->update(['status' => 'published']);

        return [$course, $section, $lesson];
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createPublishedExam(Tenant $tenant, TenantUser $manager, array $overrides = []): int
    {
        Sanctum::actingAs($manager->user);

        $exam = $this->postJson('/api/v1/exam-bank/exams', array_merge([
            'title' => 'Lesson Exam',
            'description' => 'Exam description.',
            'duration' => 60,
            'passing_score' => 60,
            'attempt_limit' => 1,
        ], $overrides), $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.id');

        $this->patchJson("/api/v1/exam-bank/exams/{$exam}/publish", [], $this->tenantHeader($tenant))->assertOk();

        return (int) $exam;
    }

    private function attachExamToLesson(
        Tenant $tenant,
        TenantUser $manager,
        int $course,
        int $section,
        int $lesson,
        int $exam,
    ): void {
        Sanctum::actingAs($manager->user);

        $this->putJson("/api/v1/courses/{$course}/sections/{$section}/lessons/{$lesson}", [
            'exam_id' => $exam,
        ], $this->tenantHeader($tenant))->assertOk();
    }

    private function setCourseAccess(Tenant $tenant, TenantUser $admin, int $course, string $mode): void
    {
        Sanctum::actingAs($admin->user);

        $this->putJson("/api/v1/courses/{$course}/access", [
            'access_mode' => $mode,
        ], $this->tenantHeader($tenant))->assertOk();
    }

    private function enrollStudent(Tenant $tenant, TenantUser $admin, int $course, TenantUser $student): int
    {
        Sanctum::actingAs($admin->user);

        return $this->postJson("/api/v1/courses/{$course}/enrollments", [
            'tenant_user_id' => $student->id,
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('enrollment.id');
    }

    private function memberWithRole(Tenant $tenant, string $roleSlug): TenantUser
    {
        $this->seedTenantPermissions($tenant);

        $membership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => User::factory()->create()->id,
            'status' => 'active',
        ]);

        $role = Role::query()
            ->where('tenant_id', $tenant->id)
            ->where('slug', $roleSlug)
            ->firstOrFail();

        $membership->roles()->attach($role->id, ['tenant_id' => $tenant->id]);

        return $membership->load('user');
    }

    private function seedTenantPermissions(Tenant $tenant): void
    {
        if (Role::query()->where('tenant_id', $tenant->id)->exists()) {
            return;
        }

        $this->seed(IdentityAccessSeeder::class);

        if (! Permission::query()->where('slug', 'courses.update')->exists()) {
            $this->fail('Course permissions were not seeded.');
        }
    }

    /**
     * @return array<string, string>
     */
    private function tenantHeader(Tenant $tenant): array
    {
        return ['X-Tenant-ID' => (string) $tenant->id];
    }
}
