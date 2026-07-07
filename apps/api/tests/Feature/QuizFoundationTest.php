<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseSection;
use App\Models\CourseLesson;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class QuizFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_instructor_can_create_quiz_questions_and_publish(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $instructor = $this->memberWithRole($tenant, 'instructor');
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Quiz Creation', $instructor);

        $quiz = $this->createQuiz($tenant, $instructor, $course, $section, $lesson, [
            'title' => 'Foundation Quiz',
            'passing_score' => 80,
            'max_attempts' => 2,
            'shuffle_questions' => true,
        ]);

        $question = $this->createQuestion($tenant, $instructor, $quiz, [
            'type' => 'single_choice',
            'question_text' => 'Which answer is correct?',
            'points' => 5,
            'options' => [
                ['option_text' => 'Correct', 'is_correct' => true],
                ['option_text' => 'Wrong', 'is_correct' => false],
            ],
        ]);

        $this->patchJson("/api/v1/courses/{$course}/sections/{$section}/lessons/{$lesson}/quiz/status", [
            'status' => 'published',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('quiz.status', 'published');

        $this->assertDatabaseHas('quizzes', [
            'id' => $quiz,
            'tenant_id' => $tenant->id,
            'course_lesson_id' => $lesson,
            'status' => 'published',
        ]);
        $this->assertDatabaseHas('quiz_questions', ['id' => $question, 'points' => 5]);
    }

    public function test_option_validation_rejects_invalid_correct_answers(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Option Validation');
        $quiz = $this->createQuiz($tenant, $admin, $course, $section, $lesson);

        $this->postJson("/api/v1/quizzes/{$quiz}/questions", [
            'type' => 'single_choice',
            'question_text' => 'Invalid single choice',
            'options' => [
                ['option_text' => 'A', 'is_correct' => true],
                ['option_text' => 'B', 'is_correct' => true],
            ],
        ], $this->tenantHeader($tenant))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['options']);
    }

    public function test_student_attempt_grading_pass_fail_result_and_attempt_limit(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Attempt Flow');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $this->enrollStudent($tenant, $admin, $course, $student);
        $quiz = $this->createPublishedQuizWithQuestion($tenant, $admin, $course, $section, $lesson, [
            'passing_score' => 50,
            'max_attempts' => 1,
        ]);
        $correctOption = $this->correctOptionForQuiz($quiz);

        Sanctum::actingAs($student->user);

        $attempt = $this->postJson("/api/v1/quizzes/{$quiz}/attempts/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonMissing(['is_correct' => true])
            ->json('attempt.id');

        $this->postJson("/api/v1/quizzes/{$quiz}/attempts/{$attempt}/submit", [
            'answers' => [
                ['quiz_question_id' => $this->firstQuestionForQuiz($quiz), 'selected_option_ids' => [$correctOption]],
            ],
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('attempt.status', 'graded')
            ->assertJsonPath('attempt.score', 100);

        $this->getJson("/api/v1/quizzes/{$quiz}/results/me", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('result.best_score', 100)
            ->assertJsonPath('result.passed', true);

        $this->postJson("/api/v1/quizzes/{$quiz}/attempts/start", [], $this->tenantHeader($tenant))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['attempt']);

        $this->assertDatabaseHas('course_completions', [
            'tenant_id' => $tenant->id,
            'course_id' => $course,
        ]);
    }

    public function test_best_score_is_preserved_after_lower_second_attempt(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Best Score');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $this->enrollStudent($tenant, $admin, $course, $student);
        $quiz = $this->createPublishedQuizWithQuestion($tenant, $admin, $course, $section, $lesson, [
            'passing_score' => 80,
            'max_attempts' => 2,
        ]);
        $question = $this->firstQuestionForQuiz($quiz);
        $correctOption = $this->correctOptionForQuiz($quiz);
        $wrongOption = $this->wrongOptionForQuiz($quiz);

        Sanctum::actingAs($student->user);

        $firstAttempt = $this->postJson("/api/v1/quizzes/{$quiz}/attempts/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('attempt.id');
        $this->postJson("/api/v1/quizzes/{$quiz}/attempts/{$firstAttempt}/submit", [
            'answers' => [['quiz_question_id' => $question, 'selected_option_ids' => [$correctOption]]],
        ], $this->tenantHeader($tenant))->assertOk();

        $secondAttempt = $this->postJson("/api/v1/quizzes/{$quiz}/attempts/start", [], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('attempt.id');
        $this->postJson("/api/v1/quizzes/{$quiz}/attempts/{$secondAttempt}/submit", [
            'answers' => [['quiz_question_id' => $question, 'selected_option_ids' => [$wrongOption]]],
        ], $this->tenantHeader($tenant))->assertOk()->assertJsonPath('attempt.score', 0);

        $this->getJson("/api/v1/quizzes/{$quiz}/results/me", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('result.best_score', 100)
            ->assertJsonPath('result.passed', true);
    }

    public function test_authorization_student_isolation_instructor_restrictions_and_tenant_isolation(): void
    {
        $firstTenant = Tenant::factory()->create();
        $secondTenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($firstTenant, 'admin');
        $assignedInstructor = $this->memberWithRole($firstTenant, 'instructor');
        $unassignedInstructor = $this->memberWithRole($firstTenant, 'instructor');
        $student = $this->memberWithRole($firstTenant, 'student');
        $otherStudent = $this->memberWithRole($firstTenant, 'student');
        $secondAdmin = $this->memberWithRole($secondTenant, 'admin');
        [$course, $section, $lesson] = $this->publishedLessonStack($firstTenant, $admin, 'Authorization', $assignedInstructor);
        $this->setCourseAccess($firstTenant, $admin, $course, 'enrolled_only');
        $this->enrollStudent($firstTenant, $admin, $course, $student);
        $quiz = $this->createPublishedQuizWithQuestion($firstTenant, $admin, $course, $section, $lesson);

        Sanctum::actingAs($student->user);
        $this->postJson("/api/v1/quizzes/{$quiz}/questions", [
            'type' => 'single_choice',
            'question_text' => 'Denied',
            'options' => [
                ['option_text' => 'A', 'is_correct' => true],
                ['option_text' => 'B', 'is_correct' => false],
            ],
        ], $this->tenantHeader($firstTenant))->assertForbidden();

        $attempt = $this->postJson("/api/v1/quizzes/{$quiz}/attempts/start", [], $this->tenantHeader($firstTenant))
            ->assertCreated()
            ->json('attempt.id');

        Sanctum::actingAs($otherStudent->user);
        $this->postJson("/api/v1/quizzes/{$quiz}/attempts/{$attempt}/submit", [
            'answers' => [
                ['quiz_question_id' => $this->firstQuestionForQuiz($quiz), 'selected_option_ids' => [$this->correctOptionForQuiz($quiz)]],
            ],
        ], $this->tenantHeader($firstTenant))->assertForbidden();

        Sanctum::actingAs($assignedInstructor->user);
        $this->putJson("/api/v1/courses/{$course}/sections/{$section}/lessons/{$lesson}/quiz", [
            'title' => 'Instructor Update',
        ], $this->tenantHeader($firstTenant))->assertOk();

        Sanctum::actingAs($unassignedInstructor->user);
        $this->putJson("/api/v1/courses/{$course}/sections/{$section}/lessons/{$lesson}/quiz", [
            'title' => 'Denied Update',
        ], $this->tenantHeader($firstTenant))->assertForbidden();

        Sanctum::actingAs($secondAdmin->user);
        $this->getJson("/api/v1/quizzes/{$quiz}/results/me", $this->tenantHeader($secondTenant))
            ->assertNotFound();
    }

    public function test_draft_quiz_is_hidden_and_lesson_access_is_required_for_attempts(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Access Integration');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $draftQuiz = $this->createQuiz($tenant, $admin, $course, $section, $lesson);

        Sanctum::actingAs($student->user);
        $this->getJson("/api/v1/courses/{$course}/sections/{$section}/lessons/{$lesson}/quiz", $this->tenantHeader($tenant))
            ->assertNotFound();

        $this->createQuestion($tenant, $admin, $draftQuiz);
        $this->publishQuiz($tenant, $admin, $course, $section, $lesson);

        Sanctum::actingAs($student->user);
        $this->postJson("/api/v1/quizzes/{$draftQuiz}/attempts/start", [], $this->tenantHeader($tenant))
            ->assertForbidden();

        $this->enrollStudent($tenant, $admin, $course, $student);
        Sanctum::actingAs($student->user);
        $this->postJson("/api/v1/quizzes/{$draftQuiz}/attempts/start", [], $this->tenantHeader($tenant))
            ->assertCreated();
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
            ->json('course.id');

        Course::withoutGlobalScopes()->whereKey($course)->update(['status' => 'published', 'visibility' => 'public']);

        $section = $this->postJson("/api/v1/courses/{$course}/sections", [
            'title' => "{$title} Section",
            'sort_order' => 1,
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('section.id');

        CourseSection::withoutGlobalScopes()->whereKey($section)->update(['status' => 'published', 'is_published' => true]);

        $lesson = $this->postJson("/api/v1/courses/{$course}/sections/{$section}/lessons", [
            'title' => "{$title} Lesson",
            'slug' => str("{$title} Lesson")->slug()->toString(),
            'type' => 'quiz',
            'visibility' => 'enrolled_only',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('lesson.id');

        CourseLesson::withoutGlobalScopes()->whereKey($lesson)->update(['status' => 'published']);

        return [$course, $section, $lesson];
    }

    /**
     * @param array<string, mixed> $overrides
     */
    private function createQuiz(Tenant $tenant, TenantUser $manager, int $course, int $section, int $lesson, array $overrides = []): int
    {
        Sanctum::actingAs($manager->user);

        return $this->postJson("/api/v1/courses/{$course}/sections/{$section}/lessons/{$lesson}/quiz", array_merge([
            'title' => 'Lesson Quiz',
            'description' => 'Quiz description.',
            'passing_score' => 70,
            'max_attempts' => 1,
        ], $overrides), $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('quiz.id');
    }

    /**
     * @param array<string, mixed> $overrides
     */
    private function createQuestion(Tenant $tenant, TenantUser $manager, int $quiz, array $overrides = []): int
    {
        Sanctum::actingAs($manager->user);

        return $this->postJson("/api/v1/quizzes/{$quiz}/questions", array_merge([
            'type' => 'single_choice',
            'question_text' => 'What is correct?',
            'points' => 1,
            'options' => [
                ['option_text' => 'Correct', 'is_correct' => true],
                ['option_text' => 'Wrong', 'is_correct' => false],
            ],
        ], $overrides), $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('question.id');
    }

    /**
     * @param array<string, mixed> $quizOverrides
     */
    private function createPublishedQuizWithQuestion(
        Tenant $tenant,
        TenantUser $manager,
        int $course,
        int $section,
        int $lesson,
        array $quizOverrides = [],
    ): int {
        $quiz = $this->createQuiz($tenant, $manager, $course, $section, $lesson, $quizOverrides);
        $this->createQuestion($tenant, $manager, $quiz);
        $this->publishQuiz($tenant, $manager, $course, $section, $lesson);

        return $quiz;
    }

    private function publishQuiz(Tenant $tenant, TenantUser $manager, int $course, int $section, int $lesson): void
    {
        Sanctum::actingAs($manager->user);

        $this->patchJson("/api/v1/courses/{$course}/sections/{$section}/lessons/{$lesson}/quiz/status", [
            'status' => 'published',
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

    private function firstQuestionForQuiz(int $quiz): int
    {
        return (int) \App\Models\QuizQuestion::query()->where('quiz_id', $quiz)->firstOrFail()->id;
    }

    private function correctOptionForQuiz(int $quiz): int
    {
        $question = \App\Models\QuizQuestion::query()->where('quiz_id', $quiz)->firstOrFail();

        return (int) $question->options()->where('is_correct', true)->firstOrFail()->id;
    }

    private function wrongOptionForQuiz(int $quiz): int
    {
        $question = \App\Models\QuizQuestion::query()->where('quiz_id', $quiz)->firstOrFail();

        return (int) $question->options()->where('is_correct', false)->firstOrFail()->id;
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
