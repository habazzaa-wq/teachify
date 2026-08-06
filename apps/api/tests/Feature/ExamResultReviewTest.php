<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\ExamAttempt;
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

/**
 * Phase 3 — Results & Review endpoints: result payload, attempt history,
 * practice-from-source and the isolation guarantees around them.
 */
class ExamResultReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_result_returns_summary_statistics_and_review(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->resultFixture();

        Sanctum::actingAs($student->user);
        $data = $this->startAndAnswer($tenant, $exam, $lesson, $student);
        $this->postJson("/api/v1/exam-sessions/{$data['attempt']['id']}/submit", [], $this->tenantHeader($tenant))->assertOk();

        $result = $this->getJson("/api/v1/exam-attempts/{$data['attempt']['id']}/result", $this->tenantHeader($tenant))
            ->assertOk()
            ->json('data');

        $this->assertSame($data['attempt']['id'], $result['attempt']['id']);
        $this->assertSame('submitted', $result['attempt']['status']);
        $this->assertTrue($result['attempt']['isOfficial']);
        $this->assertSame(100.0, (float) $result['attempt']['percentage']);
        $this->assertTrue($result['attempt']['passed']);

        $this->assertSame(3, $result['statistics']['totalQuestions']);
        $this->assertSame(3, $result['statistics']['correctAnswers']);
        $this->assertSame(0, $result['statistics']['wrongAnswers']);
        $this->assertSame(0, $result['statistics']['skippedQuestions']);
        $this->assertEquals(100.0, $result['statistics']['accuracy']);
        $this->assertEquals(100.0, $result['statistics']['completionRate']);
        $this->assertSame(3.0, (float) $result['statistics']['earnedPoints']);

        $this->assertCount(3, $result['review']);
        $this->assertSame('correct', $result['review'][0]['status']);
        $this->assertTrue($result['review'][0]['isCorrect']);
        $this->assertTrue($result['review'][0]['answered']);
        $this->assertTrue($result['flags']['canReview']);
        $this->assertTrue($result['flags']['showCorrectAnswers']);
        $this->assertFalse($result['flags']['canPractice']);
        $this->assertSame('Session Course', $result['course']['title']);
    }

    public function test_partial_submission_marks_skips_and_wrongs(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->resultFixture();

        Sanctum::actingAs($student->user);
        $data = $this->startAndAnswer($tenant, $exam, $lesson, $student, allCorrect: false);
        $this->postJson("/api/v1/exam-sessions/{$data['attempt']['id']}/submit", [], $this->tenantHeader($tenant))->assertOk();

        $result = $this->getJson("/api/v1/exam-attempts/{$data['attempt']['id']}/result", $this->tenantHeader($tenant))
            ->assertOk()
            ->json('data');

        $this->assertSame(3, $result['statistics']['totalQuestions']);
        $this->assertSame(1, $result['statistics']['correctAnswers']);
        $this->assertSame(1, $result['statistics']['wrongAnswers']);
        $this->assertSame(1, $result['statistics']['skippedQuestions']);
        $this->assertEquals(50.0, $result['statistics']['accuracy']);
        $this->assertSame(66.7, round($result['statistics']['completionRate'], 1));
        $this->assertTrue($result['flags']['canPractice']);

        $statuses = collect($result['review'])->pluck('status')->all();
        $this->assertContains('correct', $statuses);
        $this->assertContains('wrong', $statuses);
        $this->assertContains('skipped', $statuses);
    }

    public function test_result_hides_correct_answers_when_exam_forbids_it(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->resultFixture(showCorrectAnswers: false);

        Sanctum::actingAs($student->user);
        $data = $this->startAndAnswer($tenant, $exam, $lesson, $student);
        $this->postJson("/api/v1/exam-sessions/{$data['attempt']['id']}/submit", [], $this->tenantHeader($tenant))->assertOk();

        $result = $this->getJson("/api/v1/exam-attempts/{$data['attempt']['id']}/result", $this->tenantHeader($tenant))
            ->assertOk()
            ->json('data');

        $this->assertFalse($result['flags']['showCorrectAnswers']);
        $this->assertFalse($result['flags']['canReview']);

        $single = collect($result['review'])->firstWhere('type', 'single_choice');
        $this->assertNull($single['correctAnswer']);
        $this->assertNull($single['explanation']);
        $this->assertArrayNotHasKey('correct', $single['content']['options'][0]);
    }

    public function test_practice_endpoint_starts_a_subset_practice_attempt(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->resultFixture();

        Sanctum::actingAs($student->user);
        $data = $this->startAndAnswer($tenant, $exam, $lesson, $student, allCorrect: false);
        $this->postJson("/api/v1/exam-sessions/{$data['attempt']['id']}/submit", [], $this->tenantHeader($tenant))->assertOk();

        $source = ExamAttempt::query()->findOrFail($data['attempt']['id']);
        $wrongIds = $source->answers()
            ->where('is_correct', false)
            ->get()
            ->pluck('exam_question_id')
            ->map(fn (mixed $id): string => (string) $id)
            ->values()
            ->all();
        $this->assertCount(1, $wrongIds);

        $practice = $this->postJson("/api/v1/exam-attempts/{$data['attempt']['id']}/practice", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        $this->assertNotSame($data['attempt']['id'], $practice['attempt']['id']);
        $this->assertFalse($practice['attempt']['isOfficial']);
        $this->assertTrue($practice['attempt']['isPractice']);
        $this->assertNull($practice['attempt']['timerEndsAt']);

        $practiceAttempt = ExamAttempt::query()->findOrFail($practice['attempt']['id']);
        $this->assertSame((string) $source->id, (string) $practiceAttempt->practice_source_attempt_id);
        $this->assertSame($wrongIds, $practiceAttempt->included_exam_question_ids);
        $this->assertSame(count($wrongIds), count($practice['questions']));
    }

    public function test_practice_from_a_perfect_attempt_is_rejected(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->resultFixture();

        Sanctum::actingAs($student->user);
        $data = $this->startAndAnswer($tenant, $exam, $lesson, $student);
        $this->postJson("/api/v1/exam-sessions/{$data['attempt']['id']}/submit", [], $this->tenantHeader($tenant))->assertOk();

        $this->postJson("/api/v1/exam-attempts/{$data['attempt']['id']}/practice", [], $this->tenantHeader($tenant))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['attempt']);
    }

    public function test_practice_attempt_reports_source_comparison(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->resultFixture();

        Sanctum::actingAs($student->user);
        $data = $this->startAndAnswer($tenant, $exam, $lesson, $student, allCorrect: false);
        $this->postJson("/api/v1/exam-sessions/{$data['attempt']['id']}/submit", [], $this->tenantHeader($tenant))->assertOk();

        $practice = $this->postJson("/api/v1/exam-attempts/{$data['attempt']['id']}/practice", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        $this->postJson("/api/v1/exam-sessions/{$practice['attempt']['id']}/submit", [], $this->tenantHeader($tenant))->assertOk();

        $result = $this->getJson("/api/v1/exam-attempts/{$practice['attempt']['id']}/result", $this->tenantHeader($tenant))
            ->assertOk()
            ->json('data');

        $this->assertSame($data['attempt']['id'], $result['practiceSource']['attemptId']);
        $this->assertSame(1.0, (float) $result['practiceSource']['score']);
        $this->assertSame(33.33, round((float) $result['practiceSource']['percentage'], 2));
    }

    public function test_history_lists_attempts_in_order(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->resultFixture();

        Sanctum::actingAs($student->user);
        $first = $this->startAndAnswer($tenant, $exam, $lesson, $student, allCorrect: false);
        $this->postJson("/api/v1/exam-sessions/{$first['attempt']['id']}/submit", [], $this->tenantHeader($tenant))->assertOk();

        $second = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');
        $this->postJson("/api/v1/exam-sessions/{$second['attempt']['id']}/submit", [], $this->tenantHeader($tenant))->assertOk();

        $history = $this->getJson("/api/v1/exams/{$exam}/attempts", $this->tenantHeader($tenant))
            ->assertOk()
            ->json('data');

        $this->assertSame((string) $exam, $history['examId']);
        $this->assertCount(2, $history['attempts']);
        $this->assertSame(1, $history['attempts'][0]['attemptNumber']);
        $this->assertTrue($history['attempts'][0]['isOfficial']);
        $this->assertSame(2, $history['attempts'][1]['attemptNumber']);
        $this->assertFalse($history['attempts'][1]['isOfficial']);
        $this->assertTrue($history['attempts'][1]['isPractice']);
    }

    public function test_result_is_isolated_to_owner_and_tenant(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->resultFixture();

        Sanctum::actingAs($student->user);
        $data = $this->startAndAnswer($tenant, $exam, $lesson, $student);
        $this->postJson("/api/v1/exam-sessions/{$data['attempt']['id']}/submit", [], $this->tenantHeader($tenant))->assertOk();

        $otherStudent = $this->memberWithRole($tenant, 'student');
        Sanctum::actingAs($otherStudent->user);
        $this->getJson("/api/v1/exam-attempts/{$data['attempt']['id']}/result", $this->tenantHeader($tenant))->assertNotFound();
        $this->postJson("/api/v1/exam-attempts/{$data['attempt']['id']}/practice", [], $this->tenantHeader($tenant))->assertNotFound();

        $foreignTenant = Tenant::factory()->create();
        $foreignStudent = $this->memberWithRole($foreignTenant, 'student');
        Sanctum::actingAs($foreignStudent->user);
        $this->getJson("/api/v1/exams/{$exam}/attempts", $this->tenantHeader($foreignTenant))->assertNotFound();
    }

    public function test_result_of_an_in_progress_attempt_is_rejected(): void
    {
        [$tenant, $admin, $student, $lesson, $exam, $links] = $this->resultFixture();

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        $this->getJson("/api/v1/exam-attempts/{$data['attempt']['id']}/result", $this->tenantHeader($tenant))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['attempt']);
    }

    public function test_result_reveals_numeric_correct_answers_in_review(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Session');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $this->enrollStudent($tenant, $admin, $course, $student);
        $exam = $this->createPublishedExam($tenant, $admin);

        $numeric = $this->createQuestion($tenant, $admin, 'numeric', ['correct' => 9, 'tolerance' => 2]);
        $this->attachQuestionToExam($tenant, $admin, $exam, $numeric);
        $this->attachExamToLesson($tenant, $admin, $course, $section, $lesson, $exam);

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        $this->putJson(
            "/api/v1/exam-sessions/{$data['attempt']['id']}/answers/{$data['questions'][0]['examQuestionId']}",
            ['answer' => '10'],
            $this->tenantHeader($tenant),
        )->assertOk();

        $this->postJson("/api/v1/exam-sessions/{$data['attempt']['id']}/submit", [], $this->tenantHeader($tenant))->assertOk();

        $result = $this->getJson("/api/v1/exam-attempts/{$data['attempt']['id']}/result", $this->tenantHeader($tenant))
            ->assertOk()
            ->json('data');

        $numericItem = collect($result['review'])->firstWhere('type', 'numeric');

        $this->assertSame('10', $numericItem['studentAnswer']);
        $this->assertSame('9', $numericItem['correctAnswer']);
        $this->assertSame('correct', $numericItem['status']);
        $this->assertSame(2, $numericItem['content']['tolerance']);
        $this->assertSame('9', $numericItem['content']['correct']);
    }

    public function test_result_reveals_numeric_answer_key_schema_in_review(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Session');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $this->enrollStudent($tenant, $admin, $course, $student);
        $exam = $this->createPublishedExam($tenant, $admin);

        $numeric = $this->createQuestion($tenant, $admin, 'numeric', [
            'answer' => 9,
            'unit' => 'cm',
            'tolerance' => 2,
        ]);
        $this->attachQuestionToExam($tenant, $admin, $exam, $numeric);
        $this->attachExamToLesson($tenant, $admin, $course, $section, $lesson, $exam);

        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        $this->putJson(
            "/api/v1/exam-sessions/{$data['attempt']['id']}/answers/{$data['questions'][0]['examQuestionId']}",
            ['answer' => '10'],
            $this->tenantHeader($tenant),
        )->assertOk();

        $this->postJson("/api/v1/exam-sessions/{$data['attempt']['id']}/submit", [], $this->tenantHeader($tenant))->assertOk();

        $result = $this->getJson("/api/v1/exam-attempts/{$data['attempt']['id']}/result", $this->tenantHeader($tenant))
            ->assertOk()
            ->json('data');

        $numericItem = collect($result['review'])->firstWhere('type', 'numeric');

        $this->assertSame('10', $numericItem['studentAnswer']);
        $this->assertSame('9', $numericItem['correctAnswer']);
        $this->assertSame('correct', $numericItem['status']);
        $this->assertSame(2, $numericItem['content']['tolerance']);
        $this->assertSame('9', $numericItem['content']['correct']);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createPublishedExam(Tenant $tenant, TenantUser $manager, array $overrides = []): int
    {
        Sanctum::actingAs($manager->user);

        $exam = $this->postJson('/api/v1/exam-bank/exams', array_merge([
            'title' => 'Results Exam',
            'description' => 'Exam description.',
            'duration' => 60,
            'passing_score' => 60,
            'attempt_limit' => 3,
            'show_results' => true,
            'show_correct_answers' => true,
            'allow_review' => true,
            'certificate_eligible' => true,
        ], $overrides), $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.id');

        $this->patchJson("/api/v1/exam-bank/exams/{$exam}/publish", [], $this->tenantHeader($tenant))->assertOk();

        return (int) $exam;
    }

    /**
     * @return array{0:Tenant,1:TenantUser,2:TenantUser,3:int,4:int,5:list<int>}
     */
    private function resultFixture(bool $showCorrectAnswers = true): array
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Session');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $this->enrollStudent($tenant, $admin, $course, $student);
        $exam = $this->createPublishedExam($tenant, $admin, [
            'show_correct_answers' => $showCorrectAnswers,
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
     * @return array{attempt: array<string, mixed>, questions: list<array<string, mixed>>}
     */
    private function startAndAnswer(
        Tenant $tenant,
        int $exam,
        int $lesson,
        TenantUser $student,
        bool $allCorrect = true,
    ): array {
        Sanctum::actingAs($student->user);
        $data = $this->postJson("/api/v1/lessons/{$lesson}/exam-sessions/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data');

        $wrongAnswered = false;

        foreach ($data['questions'] as $question) {
            if (! $allCorrect && $question['type'] === 'multiple_choice') {
                continue;
            }

            if (! $allCorrect && ! $wrongAnswered && $question['type'] === 'single_choice') {
                $answer = [$this->wrongOptionFor($question['questionId'])];
                $wrongAnswered = true;
            } else {
                $answer = match ($question['type']) {
                    'single_choice' => [$this->correctOptionFor($question['questionId'])],
                    'multiple_choice' => $this->correctOptionsFor($question['questionId']),
                    'true_false' => 'true',
                    default => null,
                };
            }

            if ($answer === null) {
                continue;
            }

            $this->putJson(
                "/api/v1/exam-sessions/{$data['attempt']['id']}/answers/{$question['examQuestionId']}",
                ['answer' => $answer],
                $this->tenantHeader($tenant),
            )->assertOk();
        }

        return $data;
    }

    /**
     * @param  array<string, mixed>  $content
     */
    private function createQuestion(Tenant $tenant, TenantUser $manager, string $type, array $content): int
    {
        Sanctum::actingAs($manager->user);

        return (int) $this->postJson('/api/v1/exam-bank/questions', [
            'title' => "Results {$type} question",
            'type' => $type,
            'content' => $content,
            'points' => 1,
            'explanation' => 'Because it is the correct choice.',
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

    private function correctOptionFor(int $questionId): string
    {
        $question = Question::query()->findOrFail($questionId);

        return (string) collect($question->content['options'] ?? [])->firstWhere('correct', true)['id'];
    }

    private function wrongOptionFor(int $questionId): string
    {
        $question = Question::query()->findOrFail($questionId);

        return (string) collect($question->content['options'] ?? [])->firstWhere('correct', false)['id'];
    }

    /**
     * @return list<string>
     */
    private function correctOptionsFor(int $questionId): array
    {
        $question = Question::query()->findOrFail($questionId);

        return collect($question->content['options'] ?? [])
            ->where('correct', true)
            ->pluck('id')
            ->map(fn (mixed $id): string => (string) $id)
            ->values()
            ->all();
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
