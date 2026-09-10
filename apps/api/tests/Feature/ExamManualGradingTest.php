<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\Exam;
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
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Phase E — Teacher manual grading of essay / short_answer answers.
 *
 * Covers the grading-save endpoint, the B1 §3/§4 recalculation (transaction
 * + per-answer grade → attempt totals), and the pending-review queue list.
 *
 * ── CONCURRENCY (B1 §4) ──────────────────────────────────────────────
 * NOTE: the test database is SQLite in-memory (phpunit.xml), which serializes
 * writes at the connection level and cannot open the second connection a true
 * two-grader lock-convoy test needs. Following the exact precedent set in
 * ExamConcurrencyTest's docblock ("true lock-convoy behavior cannot be
 * reproduced here … MySQL-level lock behavior is reported as NOT VERIFIED"),
 * the concurrency tests below assert the *observable* invariant with two
 * near-simultaneous sequential saves (the way two graders would issue
 * requests), and the lock-before-read discipline is proven by CODE INSPECTION
 * instead:
 *
 *   ExamManualGradingService::gradeAnswer() acquires the ExamAttempt row lock
 *   as the FIRST statement inside the transaction, before ANY read of the
 *   attempt's score/max_score or its answers:
 *     - `ExamAttempt::query()->lockForUpdate()->find($attempt->id)` is the
 *       first DB access in the closure (service line: the `(1) Lock wraps
 *       BOTH the read …` step); the totals/answers are only read afterwards
 *       via recalculate() → `$attempt->answers()->get()`.
 *   This is the same discipline the auto-grading path already uses
 *   (`ExamGradingService::grade()`, line 32) that B1 §4.2 documents as the
 *   pattern Phase E must replicate. Because the lock wraps the read of the
 *   current state and the write of the recomputed totals, two graders on the
 *   same attempt serialize: the second transaction's lockForUpdate() blocks
 *   until the first commits, then re-reads fresh state (B1 §4.5).
 * ─────────────────────────────────────────────────────────────────────
 */
class ExamManualGradingTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_grades_an_essay_and_attempt_totals_recalculate(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $essayAnswerId, $shortAnswerId, $mcqQuestionId] = $this->gradingFixture();

        Sanctum::actingAs($admin->user);

        $response = $this->putJson("/api/v1/exam-attempts/{$attemptId}/answers/{$essayAnswerId}/grade", [
            'manual_score' => 8,
            'feedback' => 'Strong argument, minor evidence gap.',
        ], $this->tenantHeader($tenant))->assertOk()->json('data');

        // Answer shape (§2.5).
        $this->assertSame('graded', $response['answer']['gradingStatus']);
        $this->assertSame(8.0, (float) $response['answer']['manualScore']);
        $this->assertSame('Strong argument, minor evidence gap.', $response['answer']['feedback']);
        $this->assertSame((string) $admin->id, $response['answer']['gradedBy']['id']);
        $this->assertNotNull($response['answer']['gradedAt']);

        // Attempt totals after the save (B1 §3).
        $this->assertSame(18.0, (float) $response['attempt']['score']);
        $this->assertSame(30.0, (float) $response['attempt']['maxScore']);
        $this->assertSame(60.0, (float) $response['attempt']['percentage']);
        $this->assertTrue($response['attempt']['passed']);

        // Persisted answer state.
        $answer = ExamAttemptAnswer::query()->whereKey($essayAnswerId)->firstOrFail();
        $this->assertSame('graded', $answer->grading_status);
        $this->assertSame(8.0, (float) $answer->manual_score);
        $this->assertSame('Strong argument, minor evidence gap.', $answer->feedback);
        $this->assertSame($admin->id, $answer->graded_by_tenant_user_id);
        $this->assertNotNull($answer->graded_at);
    }

    public function test_regrade_replaces_previous_grade_and_recalculates(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $essayAnswerId, $shortAnswerId, $mcqQuestionId] = $this->gradingFixture();

        Sanctum::actingAs($admin->user);

        $this->putJson("/api/v1/exam-attempts/{$attemptId}/answers/{$essayAnswerId}/grade", [
            'manual_score' => 8,
            'feedback' => 'First pass.',
        ], $this->tenantHeader($tenant))->assertOk();

        // Re-grading the SAME answer is allowed (B1 §7 "Regrade").
        $response = $this->putJson("/api/v1/exam-attempts/{$attemptId}/answers/{$essayAnswerId}/grade", [
            'manual_score' => 5,
            'feedback' => 'Revised: deducting for missing citations.',
        ], $this->tenantHeader($tenant))->assertOk()->json('data');

        $this->assertSame(5.0, (float) $response['answer']['manualScore']);
        $this->assertSame('Revised: deducting for missing citations.', $response['answer']['feedback']);
        // 10 (mcq) + 5 replaced the earlier 8 -> 15/30 = 50%.
        $this->assertSame(15.0, (float) $response['attempt']['score']);
        $this->assertSame(50.0, (float) $response['attempt']['percentage']);
        $this->assertFalse($response['attempt']['passed']);
    }

    public function test_two_graders_on_different_answers_of_same_attempt_no_lost_update(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $essayAnswerId, $shortAnswerId, $mcqQuestionId] = $this->gradingFixture();

        $secondGrader = $this->memberWithRole($tenant, 'admin');

        // Grader 1 saves essay 1. Observable invariant: totals already reflect
        // this save (10 mcq + 8 essay).
        Sanctum::actingAs($admin->user);
        $first = $this->putJson("/api/v1/exam-attempts/{$attemptId}/answers/{$essayAnswerId}/grade", [
            'manual_score' => 8,
        ], $this->tenantHeader($tenant))->assertOk()->json('data');
        $this->assertSame(18.0, (float) $first['attempt']['score']);

        // Grader 2 saves the OTHER essay on the SAME attempt. The second save
        // must build on grader 1's committed result (10 + 8 + 4 = 22), not
        // clobber it back to a stale value — that is exactly the lost update
        // B1 §4 exists to prevent. On MySQL this ordering is the consequence
        // of the second transaction's lockForUpdate() blocking on the first.
        Sanctum::actingAs($secondGrader->user);
        $second = $this->putJson("/api/v1/exam-attempts/{$attemptId}/answers/{$shortAnswerId}/grade", [
            'manual_score' => 4,
        ], $this->tenantHeader($tenant))->assertOk()->json('data');

        // Final attempt state contains BOTH graders' contributions.
        $this->assertSame(22.0, (float) $second['attempt']['score']);
        $this->assertSame(73.33, (float) $second['attempt']['percentage']);
        $this->assertSame(true, $second['attempt']['passed']);

        $persisted = ExamAttempt::withoutGlobalScopes()->whereKey($attemptId)->firstOrFail();
        $this->assertSame(22.0, (float) $persisted->score);
        $this->assertSame('graded', ExamAttemptAnswer::query()->whereKey($essayAnswerId)->value('grading_status'));
        $this->assertSame('graded', ExamAttemptAnswer::query()->whereKey($shortAnswerId)->value('grading_status'));
    }

    public function test_feedback_is_optional_and_nullable(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $essayAnswerId, $shortAnswerId, $mcqQuestionId] = $this->gradingFixture();

        Sanctum::actingAs($admin->user);

        $response = $this->putJson("/api/v1/exam-attempts/{$attemptId}/answers/{$essayAnswerId}/grade", [
            'manual_score' => 10,
        ], $this->tenantHeader($tenant))->assertOk()->json('data');

        $this->assertNull($response['answer']['feedback']);
        $this->assertSame(20.0, (float) $response['attempt']['score']);
    }

    public function test_student_cannot_grade_their_own_answer(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $essayAnswerId, $shortAnswerId, $mcqQuestionId] = $this->gradingFixture();

        // Owner of the attempt is deliberately NOT authorized: grading reuses
        // ONLY the Phase C teacher leg (ExamPolicy::update on the exam), never
        // the student leg of ExamAttemptPolicy::viewPages.
        Sanctum::actingAs($student->user);

        $this->putJson("/api/v1/exam-attempts/{$attemptId}/answers/{$essayAnswerId}/grade", [
            'manual_score' => 8,
        ], $this->tenantHeader($tenant))->assertNotFound();
    }

    public function test_teacher_from_another_tenant_cannot_grade(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $essayAnswerId, $shortAnswerId, $mcqQuestionId] = $this->gradingFixture();

        $foreignTenant = Tenant::factory()->create();
        $foreignAdmin = $this->memberWithRole($foreignTenant, 'admin');
        Sanctum::actingAs($foreignAdmin->user);

        $this->putJson("/api/v1/exam-attempts/{$attemptId}/answers/{$essayAnswerId}/grade", [
            'manual_score' => 8,
        ], $this->tenantHeader($foreignTenant))->assertNotFound();
    }

    public function test_instructor_without_exam_ownership_cannot_grade(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $essayAnswerId, $shortAnswerId, $mcqQuestionId] = $this->gradingFixture();

        // Same predicate as the Phase C read test: instructor holds exams.update
        // but did NOT create this exam and is not a tenant operator, so
        // ExamPolicy::update() is false.
        $instructor = $this->memberWithRole($tenant, 'instructor');
        Sanctum::actingAs($instructor->user);

        $this->putJson("/api/v1/exam-attempts/{$attemptId}/answers/{$essayAnswerId}/grade", [
            'manual_score' => 8,
        ], $this->tenantHeader($tenant))->assertNotFound();
    }

    public function test_non_essay_answer_cannot_be_manually_graded(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $essayAnswerId, $shortAnswerId, $mcqQuestionId] = $this->gradingFixture();

        $mcqAnswerId = (int) ExamAttemptAnswer::query()
            ->where('exam_attempt_id', $attemptId)
            ->where('exam_question_id', $mcqQuestionId)
            ->value('id');

        Sanctum::actingAs($admin->user);

        $this->putJson("/api/v1/exam-attempts/{$attemptId}/answers/{$mcqAnswerId}/grade", [
            'manual_score' => 8,
        ], $this->tenantHeader($tenant))->assertUnprocessable();
    }

    public function test_auto_graded_essay_is_not_gradeable(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $essayAnswerId, $shortAnswerId, $mcqQuestionId] = $this->gradingFixture();

        // An essay whose row was never routed into the manual pipeline.
        ExamAttemptAnswer::query()->whereKey($essayAnswerId)->update(['grading_status' => 'auto_graded']);

        Sanctum::actingAs($admin->user);

        $this->putJson("/api/v1/exam-attempts/{$attemptId}/answers/{$essayAnswerId}/grade", [
            'manual_score' => 8,
        ], $this->tenantHeader($tenant))->assertUnprocessable();
    }

    public function test_cannot_grade_answer_before_attempt_is_submitted(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $essayAnswerId, $shortAnswerId, $mcqQuestionId] = $this->gradingFixture(false);

        // The student answered everything but never submitted; the essay row is
        // `pending_manual_review` and the attempt is untotaled (0/0/0).
        $beforeAttempt = ExamAttempt::query()->whereKey($attemptId)->firstOrFail();
        $beforeAnswer = ExamAttemptAnswer::query()->whereKey($essayAnswerId)->firstOrFail();

        Sanctum::actingAs($admin->user);

        $this->putJson("/api/v1/exam-attempts/{$attemptId}/answers/{$essayAnswerId}/grade", [
            'manual_score' => 8,
        ], $this->tenantHeader($tenant))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['attempt'])
            ->assertJsonPath('errors.attempt.0', 'Cannot grade an answer before the student has submitted the attempt.');

        // No DB change: the answer is untouched and the attempt totals intact
        // (an in-progress attempt has never been totaled — still 0/0/0).
        $afterAttempt = ExamAttempt::query()->whereKey($attemptId)->firstOrFail();
        $afterAnswer = ExamAttemptAnswer::query()->whereKey($essayAnswerId)->firstOrFail();

        $this->assertSame('in_progress', $afterAttempt->status);
        $this->assertSame((float) $beforeAttempt->score, (float) $afterAttempt->score);
        $this->assertSame((float) $beforeAttempt->max_score, (float) $afterAttempt->max_score);
        $this->assertSame((float) $beforeAttempt->percentage, (float) $afterAttempt->percentage);
        $this->assertSame(0.0, (float) $afterAttempt->score);
        $this->assertSame(0.0, (float) $afterAttempt->max_score);
        $this->assertSame(0.0, (float) $afterAttempt->percentage);
        $this->assertSame('pending_manual_review', $afterAnswer->grading_status);
        $this->assertSame($beforeAnswer->grading_status, $afterAnswer->grading_status);
        $this->assertNull($afterAnswer->manual_score);
    }

    public function test_grade_succeeds_after_submit_following_rejected_early_grade(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $essayAnswerId, $shortAnswerId, $mcqQuestionId] = $this->gradingFixture(false);

        Sanctum::actingAs($admin->user);

        // An early grade is rejected while the attempt is still in_progress.
        $this->putJson("/api/v1/exam-attempts/{$attemptId}/answers/{$essayAnswerId}/grade", [
            'manual_score' => 8,
        ], $this->tenantHeader($tenant))->assertUnprocessable();

        // The student then submits the attempt normally — the answer is still
        // pending manual review after the submit-time recompute.
        Sanctum::actingAs($student->user);
        $this->postJson("/api/v1/exam-sessions/{$attemptId}/submit", [], $this->tenantHeader($tenant))->assertOk();

        // Post-submit grading is not blocked by the fix.
        Sanctum::actingAs($admin->user);
        $response = $this->putJson("/api/v1/exam-attempts/{$attemptId}/answers/{$essayAnswerId}/grade", [
            'manual_score' => 8,
        ], $this->tenantHeader($tenant))->assertOk()->json('data');

        $this->assertSame(8.0, (float) $response['answer']['manualScore']);
        $this->assertSame(18.0, (float) $response['attempt']['score']);
        $this->assertSame(60.0, (float) $response['attempt']['percentage']);
    }

    public function test_teacher_grades_expired_in_progress_attempt_and_it_finalizes(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $essayAnswerId, $shortAnswerId, $mcqQuestionId] = $this->gradingFixture(false);

        // The student answered, the timer ran out, but the attempt was never
        // reconciled (student never came back) — it is stuck in "in_progress"
        // with pending answers. This used to block the teacher forever.
        ExamAttempt::query()->whereKey($attemptId)->update([
            'timer_ends_at' => now()->subMinutes(10),
        ]);

        Sanctum::actingAs($admin->user);

        $response = $this->putJson("/api/v1/exam-attempts/{$attemptId}/answers/{$essayAnswerId}/grade", [
            'manual_score' => 8,
        ], $this->tenantHeader($tenant))->assertOk()->json('data');

        $this->assertSame('graded', $response['answer']['gradingStatus']);
        $this->assertSame(18.0, (float) $response['attempt']['score']);
        $this->assertSame(60.0, (float) $response['attempt']['percentage']);

        // The attempt was finalized in the same transaction: pending queued
        // grade() work must never overwrite the teacher's award afterwards.
        $attempt = ExamAttempt::query()->whereKey($attemptId)->firstOrFail();
        $this->assertSame('submitted', $attempt->status);
        $this->assertNotNull($attempt->submitted_at);
        $this->assertGreaterThan(0, $attempt->duration_seconds);
    }

    public function test_teacher_grades_frozen_grading_attempt_and_later_job_is_a_noop(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $essayAnswerId, $shortAnswerId, $mcqQuestionId] = $this->gradingFixture(false);

        // The student submitted but grading is frozen: status "grading" (the
        // claim submit()/expiry-reconcile makes before the job grades). If the
        // GradeExamAttemptJob never ran (or crashed), the teacher was stuck.
        ExamAttempt::query()->whereKey($attemptId)->update(['status' => 'grading']);

        Sanctum::actingAs($admin->user);

        $this->putJson("/api/v1/exam-attempts/{$attemptId}/answers/{$essayAnswerId}/grade", [
            'manual_score' => 8,
        ], $this->tenantHeader($tenant))->assertOk()->json('data');

        $attempt = ExamAttempt::query()->whereKey($attemptId)->firstOrFail();
        $this->assertSame('submitted', $attempt->status);

        // The queued job would now run grade(): it must be a no-op for a
        // submitted attempt and must NOT recompute the essay as 0 points.
        app(ExamGradingService::class)->grade($attempt);

        $attempt->refresh();
        $this->assertSame('submitted', $attempt->status);
        $this->assertSame(18.0, (float) $attempt->score);
        $this->assertSame(60.0, (float) $attempt->percentage);
        $this->assertSame(8.0, (float) ExamAttemptAnswer::query()->whereKey($essayAnswerId)->value('manual_score'));
        $this->assertSame('graded', ExamAttemptAnswer::query()->whereKey($essayAnswerId)->value('grading_status'));
    }

    public function test_manual_score_validation_caps_at_question_points(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $essayAnswerId, $shortAnswerId, $mcqQuestionId] = $this->gradingFixture();

        Sanctum::actingAs($admin->user);

        // Essay max is 10 (exam question points).
        $this->putJson("/api/v1/exam-attempts/{$attemptId}/answers/{$essayAnswerId}/grade", [
            'manual_score' => 10.5,
        ], $this->tenantHeader($tenant))->assertUnprocessable()->assertJsonValidationErrors(['manual_score']);

        // Negative scores rejected.
        $this->putJson("/api/v1/exam-attempts/{$attemptId}/answers/{$essayAnswerId}/grade", [
            'manual_score' => -1,
        ], $this->tenantHeader($tenant))->assertUnprocessable()->assertJsonValidationErrors(['manual_score']);

        // Missing manual_score rejected.
        $this->putJson("/api/v1/exam-attempts/{$attemptId}/answers/{$essayAnswerId}/grade", [
            'feedback' => 'No score.',
        ], $this->tenantHeader($tenant))->assertUnprocessable()->assertJsonValidationErrors(['manual_score']);
    }

    public function test_pending_review_queue_lists_ungraded_essay_answers_only(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $essayAnswerId, $shortAnswerId, $mcqQuestionId] = $this->gradingFixture();

        Sanctum::actingAs($admin->user);

        $queue = $this->getJson("/api/v1/exams/{$exam}/grading-queue", $this->tenantHeader($tenant))
            ->assertOk()->json('data');

        // Only the two essay/short_answer answers are pending; the auto-graded
        // MCQ must not appear.
        $this->assertCount(2, $queue);
        $ids = array_column($queue, 'id');
        $this->assertContains((string) $essayAnswerId, $ids);
        $this->assertContains((string) $shortAnswerId, $ids);
        $this->assertCount(2, array_filter($queue, fn (array $item): bool => in_array($item['gradingStatus'], ['pending_manual_review', 'partially_graded'], true)));
        $this->assertSame([10, 10], array_map(fn (array $item): int => $item['points'], $queue));
        $this->assertSame((string) $student->user->id, $queue[0]['student']['id']);
        $this->assertSame((string) $attemptId, $queue[0]['examAttemptId']);
        $this->assertStringContainsString("/exam-attempts/{$attemptId}/answers/", $queue[0]['scoreUrl']);

        // After grading one essay, the queue drops it.
        $this->putJson("/api/v1/exam-attempts/{$attemptId}/answers/{$essayAnswerId}/grade", [
            'manual_score' => 8,
        ], $this->tenantHeader($tenant))->assertOk();

        $queueAfter = $this->getJson("/api/v1/exams/{$exam}/grading-queue", $this->tenantHeader($tenant))
            ->assertOk()->json('data');

        $this->assertCount(1, $queueAfter);
        $this->assertSame((string) $shortAnswerId, $queueAfter[0]['id']);
    }

    public function test_pending_review_queue_includes_partially_graded_answers(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $essayAnswerId, $shortAnswerId, $mcqQuestionId] = $this->gradingFixture();

        ExamAttemptAnswer::query()->whereKey($essayAnswerId)->update([
            'grading_status' => 'partially_graded',
            'manual_score' => 6,
        ]);

        Sanctum::actingAs($admin->user);

        $queue = $this->getJson("/api/v1/exams/{$exam}/grading-queue", $this->tenantHeader($tenant))
            ->assertOk()->json('data');

        $byId = collect($queue)->keyBy('id');
        $this->assertSame('partially_graded', $byId[(string) $essayAnswerId]['gradingStatus']);

        // A partially-graded answer is re-gradeable and its partial award counts.
        $response = $this->putJson("/api/v1/exam-attempts/{$attemptId}/answers/{$essayAnswerId}/grade", [
            'manual_score' => 9,
        ], $this->tenantHeader($tenant))->assertOk()->json('data');

        $this->assertSame(19.0, (float) $response['attempt']['score']);
    }

    public function test_queue_is_denied_for_students_and_foreign_teachers(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $essayAnswerId, $shortAnswerId, $mcqQuestionId] = $this->gradingFixture();

        Sanctum::actingAs($student->user);
        $this->getJson("/api/v1/exams/{$exam}/grading-queue", $this->tenantHeader($tenant))->assertNotFound();

        $foreignTenant = Tenant::factory()->create();
        $foreignAdmin = $this->memberWithRole($foreignTenant, 'admin');
        Sanctum::actingAs($foreignAdmin->user);
        $this->getJson("/api/v1/exams/{$exam}/grading-queue", $this->tenantHeader($foreignTenant))->assertNotFound();
    }

    public function test_grading_overview_lists_exam_with_pending_count(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $essayAnswerId, $shortAnswerId, $mcqQuestionId] = $this->gradingFixture();

        Sanctum::actingAs($admin->user);

        $overview = $this->getJson("/api/v1/exam-bank/grading/overview", $this->tenantHeader($tenant))
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $overview);
        $this->assertSame((string) $exam, $overview[0]['examId']);
        $this->assertSame('Grading Exam', $overview[0]['title']);
        $this->assertSame(2, $overview[0]['pendingCount']);

        // The auto-graded MCQ never contributes to the pending count.
        $this->putJson("/api/v1/exam-attempts/{$attemptId}/answers/{$essayAnswerId}/grade", [
            'manual_score' => 8,
        ], $this->tenantHeader($tenant))->assertOk();

        $after = $this->getJson("/api/v1/exam-bank/grading/overview", $this->tenantHeader($tenant))
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $after);
        $this->assertSame(1, $after[0]['pendingCount']);
    }

    public function test_grading_overview_is_empty_for_students(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $essayAnswerId, $shortAnswerId, $mcqQuestionId] = $this->gradingFixture();

        Sanctum::actingAs($student->user);

        $overview = $this->getJson("/api/v1/exam-bank/grading/overview", $this->tenantHeader($tenant))
            ->assertOk()
            ->json('data');

        $this->assertSame([], $overview);
    }

    public function test_unauthenticated_grade_is_denied(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $attemptId, $essayAnswerId, $shortAnswerId, $mcqQuestionId] = $this->gradingFixture();

        Auth::forgetGuards();

        $this->putJson("/api/v1/exam-attempts/{$attemptId}/answers/{$essayAnswerId}/grade", [
            'manual_score' => 8,
        ], $this->tenantHeader($tenant))->assertUnauthorized();
    }

    // ----- Fixture -----

    /**
     * Published exam with single_choice (auto, 10) + essay (10) + short_answer
     * (10); the student answered all three — the MCQ auto-scores 10 and both
     * essays stay `pending_manual_review`. With `$submit` (the default) the
     * attempt is then submitted: totals score 10, max 30, percentage 33.33,
     * passed false. With `$submit === false` the attempt is left `in_progress`
     * (same 10/30/33.33) for the pre-submission guard tests.
     *
     * @return array{0: Tenant, 1: TenantUser, 2: TenantUser, 3: int, 4: int, 5: int, 6: int, 7: int, 8: int}
     */
    private function gradingFixture(bool $submit = true): array
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');

        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Grading');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $this->enrollStudent($tenant, $admin, $course, $student);

        $exam = $this->createPublishedExam($tenant, $admin);

        $single = $this->createQuestion($tenant, $admin, 'single_choice', 10, [
            'options' => [
                ['id' => 'opt-a', 'text' => 'Correct', 'correct' => true],
                ['id' => 'opt-b', 'text' => 'Wrong', 'correct' => false],
            ],
        ]);
        $essay = $this->createQuestion($tenant, $admin, 'essay', 10, ['prompt' => 'Explain your reasoning.']);
        $short = $this->createQuestion($tenant, $admin, 'short_answer', 10, ['prompt' => 'Define the term.']);

        $singleExamQuestionId = $this->attachQuestionToExam($tenant, $admin, $exam, $single);
        $essayExamQuestionId = $this->attachQuestionToExam($tenant, $admin, $exam, $essay);
        $shortExamQuestionId = $this->attachQuestionToExam($tenant, $admin, $exam, $short);
        $this->attachExamToLesson($tenant, $admin, $course, $section, $lesson, $exam);

        Sanctum::actingAs($student->user);
        $started = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        $attemptId = (int) $started['attempt']['id'];

        $correctOption = (string) collect(Question::query()->findOrFail($single)->content['options'])->firstWhere('correct', true)['id'];

        foreach ($started['questions'] as $question) {
            $answer = $question['type'] === 'single_choice' ? [$correctOption] : 'Student text answer for grading.';
            $this->putJson(
                "/api/v1/exam-sessions/{$attemptId}/answers/{$question['examQuestionId']}",
                ['answer' => $answer],
                $this->tenantHeader($tenant),
            )->assertOk();
        }

        if ($submit) {
            $this->postJson("/api/v1/exam-sessions/{$attemptId}/submit", [], $this->tenantHeader($tenant))->assertOk();

            $this->assertSame(10.0, (float) ExamAttempt::query()->whereKey($attemptId)->value('score'));
        }

        $essayAnswerId = $this->answerId($attemptId, $essayExamQuestionId);
        $shortAnswerId = $this->answerId($attemptId, $shortExamQuestionId);

        return [$tenant, $admin, $student, $lesson, $exam, $attemptId, $essayAnswerId, $shortAnswerId, $singleExamQuestionId];
    }

    private function answerId(int $attemptId, int $examQuestionId): int
    {
        return (int) ExamAttemptAnswer::query()
            ->where('exam_attempt_id', $attemptId)
            ->where('exam_question_id', $examQuestionId)
            ->value('id');
    }

    /**
     * @param  array<string, mixed>  $content
     */
    private function createQuestion(Tenant $tenant, TenantUser $manager, string $type, int $points, array $content): int
    {
        Sanctum::actingAs($manager->user);

        return (int) $this->postJson('/api/v1/exam-bank/questions', [
            'title' => "Grading {$type} question",
            'type' => $type,
            'content' => $content,
            'points' => $points,
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
     * @param  array<string, mixed>  $overrides
     */
    private function createPublishedExam(Tenant $tenant, TenantUser $manager, array $overrides = []): int
    {
        Sanctum::actingAs($manager->user);

        $exam = $this->postJson('/api/v1/exam-bank/exams', array_merge([
            'title' => 'Grading Exam',
            'description' => 'Manual grading fixture exam.',
            'duration' => 60,
            'passing_score' => 60,
            'attempt_limit' => 3,
        ], $overrides), $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.id');

        $this->patchJson("/api/v1/exam-bank/exams/{$exam}/publish", [], $this->tenantHeader($tenant))->assertOk();

        return (int) $exam;
    }

    /**
     * @return array{0:int,1:int,2:int}
     */
    private function publishedLessonStack(Tenant $tenant, TenantUser $manager, string $title): array
    {
        Sanctum::actingAs($manager->user);

        $course = $this->postJson('/api/v1/courses', [
            'title' => "{$title} Course",
            'slug' => str("{$title} Course")->slug()->toString(),
        ], $this->tenantHeader($tenant))
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

        if (! Permission::query()->where('slug', 'exams.update')->exists()) {
            $this->fail('Exam permissions were not seeded.');
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