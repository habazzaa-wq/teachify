<?php

namespace Tests\Feature;

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
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ExamSessionFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_start_an_exam_session(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $response = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated();

        $attemptId = $response->json('data.attempt.id');
        $this->assertNotNull($attemptId);
        $this->assertSame('in_progress', $response->json('data.attempt.status'));
        $this->assertTrue($response->json('data.attempt.isOfficial'));
        $this->assertFalse($response->json('data.attempt.isPractice'));
        $this->assertSame(3, count($response->json('data.questions')));
        $this->assertNotNull($response->json('data.attempt.timerEndsAt'));
        $this->assertGreaterThan(0, $response->json('data.attempt.remainingSeconds'));
        $this->assertSame((string) $exam, $response->json('data.attempt.examId'));

        $first = $response->json('data.questions.0');
        $this->assertSame((string) $links[0], $first['examQuestionId']);
        $this->assertFalse($first['answered']);
        $this->assertNull($first['answer']);

        $this->assertDatabaseHas('exam_attempts', [
            'id' => $attemptId,
            'exam_id' => $exam,
            'user_id' => $student->user->id,
            'status' => 'in_progress',
            'is_official' => true,
        ]);
    }

    public function test_start_resumes_existing_in_progress_attempt(): void
    {
        [$tenant, $admin, $student, $lesson] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $first = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.attempt.id');

        $second = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.attempt.id');

        $this->assertSame($first, $second);
        $this->assertSame(1, ExamAttempt::query()->where('exam_id', $this->latestExam($tenant))->count());
    }

    public function test_session_does_not_leak_correct_answers(): void
    {
        [$tenant, $admin, $student, $lesson] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $questions = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.questions');

        foreach ($questions as $question) {
            $content = $question['content'] ?? [];
            $this->assertArrayNotHasKey('correct', $content);

            foreach ($content['options'] ?? [] as $option) {
                $this->assertArrayNotHasKey('correct', $option);
                $this->assertArrayNotHasKey('explanation', $option);
            }
        }
    }

    public function test_student_can_save_and_update_an_answer(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $attempt = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        $single = $attempt['questions'][0];
        $correctOption = $this->correctOptionFor($tenant, $exam, $single['questionId']);

        $this->putJson(
            "/api/v1/exam-sessions/{$attempt['attempt']['id']}/answers/{$single['examQuestionId']}",
            ['answer' => [$correctOption]],
            $this->tenantHeader($tenant),
        )->assertOk();

        $this->assertDatabaseHas('exam_attempt_answers', [
            'exam_attempt_id' => $attempt['attempt']['id'],
            'exam_question_id' => $single['examQuestionId'],
            'is_correct' => true,
        ]);

        $wrongOption = $this->wrongOptionFor($tenant, $exam, $single['questionId']);
        $this->putJson(
            "/api/v1/exam-sessions/{$attempt['attempt']['id']}/answers/{$single['examQuestionId']}",
            ['answer' => [$wrongOption]],
            $this->tenantHeader($tenant),
        )->assertOk();

        $answer = ExamAttemptAnswer::query()
            ->where('exam_attempt_id', $attempt['attempt']['id'])
            ->where('exam_question_id', $single['examQuestionId'])
            ->firstOrFail();

        $this->assertSame([$wrongOption], $answer->answer);
        $this->assertFalse($answer->is_correct);
    }

    public function test_saving_an_invalid_answer_is_rejected(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $attempt = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        $single = $attempt['questions'][0];
        $wrongOption = $this->wrongOptionFor($tenant, $exam, $single['questionId']);

        // Single choice questions must select exactly one option.
        $this->putJson(
            "/api/v1/exam-sessions/{$attempt['attempt']['id']}/answers/{$single['examQuestionId']}",
            ['answer' => [$wrongOption, 'ghost-option']],
            $this->tenantHeader($tenant),
        )->assertUnprocessable();

        $this->putJson(
            "/api/v1/exam-sessions/{$attempt['attempt']['id']}/answers/{$single['examQuestionId']}",
            ['answer' => []],
            $this->tenantHeader($tenant),
        )->assertUnprocessable();

        // True/false questions only accept "true" or "false".
        $trueFalse = $attempt['questions'][2];
        $this->putJson(
            "/api/v1/exam-sessions/{$attempt['attempt']['id']}/answers/{$trueFalse['examQuestionId']}",
            ['answer' => 'maybe'],
            $this->tenantHeader($tenant),
        )->assertUnprocessable();
    }

    public function test_student_can_save_progress_and_anti_cheat_events(): void
    {
        [$tenant, $admin, $student, $lesson] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $attempt = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        $this->putJson("/api/v1/exam-sessions/{$attempt['attempt']['id']}/progress", [
            'current_question_index' => 1,
            'events' => [
                ['type' => 'window_blur', 'occurred_at' => now()->toIso8601String()],
                ['type' => 'tab_hidden'],
            ],
        ], $this->tenantHeader($tenant))->assertOk();

        $this->assertDatabaseHas('exam_attempts', [
            'id' => $attempt['attempt']['id'],
            'current_question_index' => 1,
        ]);

        $events = ExamAntiCheatEvent::query()
            ->where('exam_attempt_id', $attempt['attempt']['id'])
            ->orderBy('id')
            ->get();

        $this->assertCount(2, $events);
        $this->assertSame('window_blur', $events[0]->event_type);
        $this->assertSame('tab_hidden', $events[1]->event_type);
    }

    public function test_submit_grades_the_attempt_and_marks_it_official(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        $this->answerCorrectly($tenant, $exam, $data, $links);

        $response = $this->postJson("/api/v1/exam-sessions/{$data['attempt']['id']}/submit", [], $this->tenantHeader($tenant))
            ->assertOk();

        $this->assertSame('submitted', $response->json('data.attempt.status'));
        $this->assertSame(3.0, (float) $response->json('data.attempt.score'));
        $this->assertSame(3.0, (float) $response->json('data.attempt.maxScore'));
        $this->assertSame(100.0, (float) $response->json('data.attempt.percentage'));
        $this->assertTrue($response->json('data.attempt.passed'));
        $this->assertTrue($response->json('data.attempt.isOfficial'));
        $this->assertNotNull($response->json('data.attempt.submittedAt'));
        $this->assertNotNull($response->json('data.attempt.durationSeconds'));
    }

    public function test_exam_with_numeric_questions_can_start_and_is_graded_with_tolerance(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Numeric Fixture');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $this->enrollStudent($tenant, $admin, $course, $student);
        $exam = $this->createPublishedExam($tenant, $admin, [
            'title' => 'Numeric Exam',
            'duration' => 30,
            'passing_score' => 60,
        ]);

        $numeric = $this->createQuestion($tenant, $admin, 'numeric', [
            'correct' => 6,
            'tolerance' => 1,
        ]);
        $this->attachQuestionToExam($tenant, $admin, $exam, $numeric);
        $this->attachExamToLesson($tenant, $admin, $course, $section, $lesson, $exam);

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        $this->assertCount(1, $data['questions']);
        $this->assertSame('numeric', $data['questions'][0]['type']);
        $this->assertArrayNotHasKey('correct', $data['questions'][0]['content']);

        $question = $data['questions'][0];

        $this->putJson(
            "/api/v1/exam-sessions/{$data['attempt']['id']}/answers/{$question['examQuestionId']}",
            ['answer' => 'abc'],
            $this->tenantHeader($tenant),
        )->assertUnprocessable();

        $this->putJson(
            "/api/v1/exam-sessions/{$data['attempt']['id']}/answers/{$question['examQuestionId']}",
            ['answer' => '5.5'],
            $this->tenantHeader($tenant),
        )->assertOk();

        $saved = ExamAttemptAnswer::query()
            ->where('exam_attempt_id', $data['attempt']['id'])
            ->where('exam_question_id', $question['examQuestionId'])
            ->firstOrFail();

        $this->assertSame('5.5', $saved->answer);
        $this->assertTrue($saved->is_correct);

        $this->putJson(
            "/api/v1/exam-sessions/{$data['attempt']['id']}/answers/{$question['examQuestionId']}",
            ['answer' => '8'],
            $this->tenantHeader($tenant),
        )->assertOk();

        $saved->refresh();
        $this->assertFalse($saved->is_correct);

        $this->putJson(
            "/api/v1/exam-sessions/{$data['attempt']['id']}/answers/{$question['examQuestionId']}",
            ['answer' => '6'],
            $this->tenantHeader($tenant),
        )->assertOk();

        $response = $this->postJson("/api/v1/exam-sessions/{$data['attempt']['id']}/submit", [], $this->tenantHeader($tenant))
            ->assertOk();

        $this->assertSame('submitted', $response->json('data.attempt.status'));
        $this->assertSame(1.0, (float) $response->json('data.attempt.score'));
        $this->assertSame(1.0, (float) $response->json('data.attempt.maxScore'));
        $this->assertSame('6', $response->json('data.questions.0.content.correct'));
    }

    public function test_numeric_question_with_ui_answer_key_schema_is_graded_with_tolerance(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Numeric UI Fixture');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $this->enrollStudent($tenant, $admin, $course, $student);
        $exam = $this->createPublishedExam($tenant, $admin, [
            'title' => 'Numeric UI Exam',
            'duration' => 30,
            'passing_score' => 60,
        ]);

        $numeric = $this->createQuestion($tenant, $admin, 'numeric', [
            'answer' => 6,
            'unit' => 'm/s',
            'tolerance' => 1,
        ]);
        $this->attachQuestionToExam($tenant, $admin, $exam, $numeric);
        $this->attachExamToLesson($tenant, $admin, $course, $section, $lesson, $exam);

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        $question = $data['questions'][0];
        $this->assertSame('numeric', $question['type']);
        $this->assertSame(1, $question['content']['tolerance']);
        $this->assertArrayNotHasKey('correct', $question['content']);

        $this->putJson(
            "/api/v1/exam-sessions/{$data['attempt']['id']}/answers/{$question['examQuestionId']}",
            ['answer' => '5.5'],
            $this->tenantHeader($tenant),
        )->assertOk();

        $saved = ExamAttemptAnswer::query()
            ->where('exam_attempt_id', $data['attempt']['id'])
            ->where('exam_question_id', $question['examQuestionId'])
            ->firstOrFail();

        $this->assertTrue($saved->is_correct);

        $this->putJson(
            "/api/v1/exam-sessions/{$data['attempt']['id']}/answers/{$question['examQuestionId']}",
            ['answer' => '8'],
            $this->tenantHeader($tenant),
        )->assertOk();

        $saved->refresh();
        $this->assertFalse($saved->is_correct);

        $this->putJson(
            "/api/v1/exam-sessions/{$data['attempt']['id']}/answers/{$question['examQuestionId']}",
            ['answer' => '6'],
            $this->tenantHeader($tenant),
        )->assertOk();

        $response = $this->postJson("/api/v1/exam-sessions/{$data['attempt']['id']}/submit", [], $this->tenantHeader($tenant))
            ->assertOk();

        $this->assertSame(1.0, (float) $response->json('data.attempt.score'));
        $this->assertSame('6', $response->json('data.questions.0.content.correct'));
    }

    public function test_partial_submission_is_scored_accordingly(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        // Only answer the first question correctly.
        $single = $data['questions'][0];
        $correctOption = $this->correctOptionFor($tenant, $exam, $single['questionId']);
        $this->putJson(
            "/api/v1/exam-sessions/{$data['attempt']['id']}/answers/{$single['examQuestionId']}",
            ['answer' => [$correctOption]],
            $this->tenantHeader($tenant),
        )->assertOk();

        $response = $this->postJson("/api/v1/exam-sessions/{$data['attempt']['id']}/submit", [], $this->tenantHeader($tenant))
            ->assertOk();

        $this->assertSame(1.0, (float) $response->json('data.attempt.score'));
        $this->assertSame(33.33, round((float) $response->json('data.attempt.percentage'), 2));
        $this->assertFalse($response->json('data.attempt.passed'));
    }

    public function test_second_attempt_is_marked_practice(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);

        $first = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');
        $this->postJson("/api/v1/exam-sessions/{$first['attempt']['id']}/submit", [], $this->tenantHeader($tenant))->assertOk();

        $second = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        $this->assertFalse($second['attempt']['isOfficial']);
        $this->assertTrue($second['attempt']['isPractice']);
    }

    public function test_attempt_limit_is_enforced_on_start(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture(1);

        Sanctum::actingAs($student->user);

        $first = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');
        $this->postJson("/api/v1/exam-sessions/{$first['attempt']['id']}/submit", [], $this->tenantHeader($tenant))->assertOk();

        $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['attempt']);
    }

    public function test_expired_attempt_is_auto_submitted_on_load(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        ExamAttempt::withoutGlobalScopes()
            ->whereKey($data['attempt']['id'])
            ->update(['timer_ends_at' => now()->subMinutes(5)]);

        $response = $this->getJson("/api/v1/exam-sessions/{$data['attempt']['id']}", $this->tenantHeader($tenant))
            ->assertOk();

        $this->assertSame('submitted', $response->json('data.attempt.status'));
        $this->assertSame(0.0, (float) $response->json('data.attempt.score'));
    }

    public function test_submitted_session_reveals_correct_answers_when_allowed(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        $this->answerCorrectly($tenant, $exam, $data, $links);
        $this->postJson("/api/v1/exam-sessions/{$data['attempt']['id']}/submit", [], $this->tenantHeader($tenant))->assertOk();

        $questions = $this->getJson("/api/v1/exam-sessions/{$data['attempt']['id']}", $this->tenantHeader($tenant))
            ->assertOk()
            ->json('data.questions');

        $single = collect($questions)->firstWhere('type', 'single_choice');
        $correctOption = collect($single['content']['options'])->firstWhere('correct', true);

        $this->assertSame('opt-a', $correctOption['id']);
        $this->assertTrue($single['isCorrect']);

        $trueFalse = collect($questions)->firstWhere('type', 'true_false');
        $this->assertSame('true', $trueFalse['content']['correct']);
        $this->assertTrue($trueFalse['isCorrect']);
    }

    public function test_current_endpoint_returns_null_then_the_attempt(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);

        $this->getJson("/api/v1/lessons/{$lesson}/exam-sessions/current", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data', null);

        $attempt = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.attempt.id');

        $this->getJson("/api/v1/lessons/{$lesson}/exam-sessions/current", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data.attempt.id', $attempt);
    }

    public function test_active_attempt_returns_null_when_none_running(): void
    {
        [$tenant, $admin, $student, $lesson] = $this->sessionFixture();

        Sanctum::actingAs($student->user);

        $this->getJson('/api/v1/exams/active-attempt', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data', null);
    }

    public function test_active_attempt_returns_the_running_attempt_with_exam_title(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $attempt = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.attempt.id');

        $response = $this->getJson('/api/v1/exams/active-attempt', $this->tenantHeader($tenant))
            ->assertOk();

        $this->assertSame($attempt, $response->json('data.id'));
        $this->assertSame('in_progress', $response->json('data.status'));
        $this->assertSame((string) $exam, $response->json('data.examId'));
        $this->assertSame('Session Exam', $response->json('data.exam.title'));
        $this->assertNotNull($response->json('data.timerEndsAt'));
        $this->assertGreaterThan(0, $response->json('data.remainingSeconds'));
    }

    public function test_active_attempt_is_isolated_per_user_and_tenant(): void
    {
        [$tenant, $admin, $student, $lesson] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated();

        // Another student of the same tenant has no active attempt.
        $otherStudent = $this->memberWithRole($tenant, 'student');
        Sanctum::actingAs($otherStudent->user);
        $this->getJson('/api/v1/exams/active-attempt', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data', null);
    }

    public function test_active_attempt_hides_submitted_attempt(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $attempt = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.attempt.id');

        $this->postJson("/api/v1/exam-sessions/{$attempt}/submit", [], $this->tenantHeader($tenant))->assertOk();

        $this->getJson('/api/v1/exams/active-attempt', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data', null);
    }

    public function test_active_attempt_hides_attempt_with_expired_timer(): void
    {
        [$tenant, $admin, $student, $lesson] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $attempt = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.attempt.id');

        ExamAttempt::withoutGlobalScopes()
            ->whereKey($attempt)
            ->update(['timer_ends_at' => now()->subMinutes(5)]);

        $this->getJson('/api/v1/exams/active-attempt', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data', null);
    }

    public function test_active_attempt_hides_attempt_when_exam_is_not_published(): void
    {
        [$tenant, $admin, $student, $lesson, $exam] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated();

        // Teacher closes the exam.
        Sanctum::actingAs($admin->user);
        $this->patchJson("/api/v1/exam-bank/exams/{$exam}/archive", [], $this->tenantHeader($tenant))->assertOk();

        Sanctum::actingAs($student->user);
        $this->getJson('/api/v1/exams/active-attempt', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('data', null);
    }

    public function test_session_is_owner_and_tenant_isolated(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $attempt = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.attempt.id');

        // Another student from the same tenant cannot access the attempt.
        $otherStudent = $this->memberWithRole($tenant, 'student');
        Sanctum::actingAs($otherStudent->user);
        $this->getJson("/api/v1/exam-sessions/{$attempt}", $this->tenantHeader($tenant))->assertNotFound();

        // A user from another tenant cannot start a session on this lesson.
        $foreignTenant = Tenant::factory()->create();
        $foreignStudent = $this->memberWithRole($foreignTenant, 'student');
        Sanctum::actingAs($foreignStudent->user);
        $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($foreignTenant))
            ->assertNotFound();
    }

    public function test_double_submit_is_idempotent(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        $this->answerCorrectly($tenant, $exam, $data, $links);

        $first = $this->postJson("/api/v1/exam-sessions/{$data['attempt']['id']}/submit", [], $this->tenantHeader($tenant))
            ->assertOk()
            ->json('data.attempt');

        $second = $this->postJson("/api/v1/exam-sessions/{$data['attempt']['id']}/submit", [], $this->tenantHeader($tenant))
            ->assertOk()
            ->json('data.attempt');

        $this->assertSame('submitted', $second['status']);
        $this->assertSame($first['score'], $second['score']);
        $this->assertSame($first['maxScore'], $second['maxScore']);
        $this->assertSame($first['percentage'], $second['percentage']);
        $this->assertSame($first['submittedAt'], $second['submittedAt']);
        $this->assertSame($first['durationSeconds'], $second['durationSeconds']);

        $this->assertSame(3, ExamAttemptAnswer::query()
            ->where('exam_attempt_id', $data['attempt']['id'])
            ->count());
    }

    public function test_answer_save_is_rejected_after_submission(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        $this->postJson("/api/v1/exam-sessions/{$data['attempt']['id']}/submit", [], $this->tenantHeader($tenant))
            ->assertOk();

        $single = $data['questions'][0];
        $correctOption = $this->correctOptionFor($tenant, $exam, $single['questionId']);

        $this->putJson(
            "/api/v1/exam-sessions/{$data['attempt']['id']}/answers/{$single['examQuestionId']}",
            ['answer' => [$correctOption]],
            $this->tenantHeader($tenant),
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['attempt']);

        $this->assertDatabaseMissing('exam_attempt_answers', [
            'exam_attempt_id' => $data['attempt']['id'],
            'exam_question_id' => $single['examQuestionId'],
        ]);
    }

    public function test_progress_save_is_rejected_after_submission(): void
    {
        [$tenant, $admin, $student, $lesson] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        $this->postJson("/api/v1/exam-sessions/{$data['attempt']['id']}/submit", [], $this->tenantHeader($tenant))
            ->assertOk();

        $this->putJson("/api/v1/exam-sessions/{$data['attempt']['id']}/progress", [
            'current_question_index' => 1,
            'events' => [['type' => 'window_blur']],
        ], $this->tenantHeader($tenant))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['attempt']);

        $this->assertDatabaseMissing('exam_attempts', [
            'id' => $data['attempt']['id'],
            'current_question_index' => 1,
        ]);

        $this->assertSame(0, ExamAntiCheatEvent::query()
            ->where('exam_attempt_id', $data['attempt']['id'])
            ->count());
    }

    public function test_answer_save_after_expiry_auto_submits_and_rejects(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        ExamAttempt::withoutGlobalScopes()
            ->whereKey($data['attempt']['id'])
            ->update(['timer_ends_at' => now()->subMinutes(5)]);

        $single = $data['questions'][0];
        $correctOption = $this->correctOptionFor($tenant, $exam, $single['questionId']);

        $this->putJson(
            "/api/v1/exam-sessions/{$data['attempt']['id']}/answers/{$single['examQuestionId']}",
            ['answer' => [$correctOption]],
            $this->tenantHeader($tenant),
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['exam']);

        $this->assertDatabaseHas('exam_attempts', [
            'id' => $data['attempt']['id'],
            'status' => 'submitted',
        ]);
    }

    public function test_progress_save_after_expiry_auto_submits_and_rejects(): void
    {
        [$tenant, $admin, $student, $lesson] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        ExamAttempt::withoutGlobalScopes()
            ->whereKey($data['attempt']['id'])
            ->update(['timer_ends_at' => now()->subMinutes(5)]);

        $this->putJson("/api/v1/exam-sessions/{$data['attempt']['id']}/progress", [
            'current_question_index' => 2,
            'events' => [['type' => 'window_blur']],
        ], $this->tenantHeader($tenant))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['exam']);

        $this->assertDatabaseHas('exam_attempts', [
            'id' => $data['attempt']['id'],
            'status' => 'submitted',
        ]);
    }

    public function test_start_after_expiry_finalizes_and_creates_a_single_new_attempt(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        ExamAttempt::withoutGlobalScopes()
            ->whereKey($data['attempt']['id'])
            ->update(['timer_ends_at' => now()->subMinutes(5)]);

        $second = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.attempt');

        $this->assertNotSame($data['attempt']['id'], $second['id']);
        $this->assertSame('in_progress', $second['status']);

        $this->assertDatabaseHas('exam_attempts', [
            'id' => $data['attempt']['id'],
            'status' => 'submitted',
        ]);

        $this->assertSame(1, ExamAttempt::query()
            ->where('exam_id', $exam)
            ->where('status', 'in_progress')
            ->count());
    }

    public function test_current_attempt_is_never_a_duplicate(): void
    {
        [$tenant, $admin, $student, $lesson] = $this->sessionFixture();

        Sanctum::actingAs($student->user);

        $attemptId = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.attempt.id');

        $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.attempt.id');

        $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.attempt.id');

        $this->assertSame(1, ExamAttempt::query()
            ->where('status', 'in_progress')
            ->count());

        $this->assertSame(
            $attemptId,
            $this->getJson("/api/v1/lessons/{$lesson}/exam-sessions/current", $this->tenantHeader($tenant))
                ->assertOk()
                ->json('data.attempt.id'),
        );
    }

    public function test_submitted_session_cannot_be_modified_by_another_student(): void
    {
        [$tenant, $admin, $student, $lesson] = $this->sessionFixture();

        Sanctum::actingAs($student->user);
        $attempt = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.attempt.id');

        $otherStudent = $this->memberWithRole($tenant, 'student');
        Sanctum::actingAs($otherStudent->user);

        $this->postJson("/api/v1/exam-sessions/{$attempt}/submit", [], $this->tenantHeader($tenant))
            ->assertNotFound();
        $this->putJson("/api/v1/exam-sessions/{$attempt}/progress", [
            'current_question_index' => 1,
        ], $this->tenantHeader($tenant))->assertNotFound();
    }

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

        return [$tenant, $admin, $student, $lesson, $exam, $links];
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
