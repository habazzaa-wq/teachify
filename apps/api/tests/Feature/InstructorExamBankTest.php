<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamAttemptAnswer;
use App\Models\ExamQuestion;
use App\Models\Question;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InstructorExamBankTest extends TestCase
{
    use RefreshDatabase;

    public function test_instructor_can_review_and_grade_only_answers_from_their_own_exams(): void
    {
        $tenant = Tenant::factory()->create([
            'feature_flags' => ['has_instructors' => true],
        ]);
        $role = Role::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Instructor',
            'slug' => 'instructor',
        ]);
        [$instructor, $membership] = $this->createInstructor($tenant, $role);
        [, $otherMembership] = $this->createInstructor($tenant, $role);
        $ownExam = $this->createExam($tenant, $membership, 'Own grading exam');
        $otherExam = $this->createExam($tenant, $otherMembership, 'Other grading exam');
        $student = User::factory()->create();
        $headers = [
            'Authorization' => 'Bearer '.$instructor->createToken('instructor_access_token', [
                'instructor:access',
                'instructor:tenant:'.$tenant->id,
            ])->plainTextToken,
            'X-Tenant-ID' => (string) $tenant->id,
        ];

        $answers = [];
        foreach ([
            [$ownExam, $membership, 'My answer'],
            [$otherExam, $otherMembership, 'Other answer'],
        ] as [$exam, $creator, $title]) {
            $question = $this->createQuestion($tenant, $creator, $title);
            $question->update(['type' => 'essay']);
            $examQuestion = ExamQuestion::query()->create([
                'tenant_id' => $tenant->id,
                'created_by_tenant_user_id' => $creator->id,
                'exam_id' => $exam->id,
                'question_id' => $question->id,
                'points' => 10,
            ]);
            $attempt = ExamAttempt::query()->create([
                'tenant_id' => $tenant->id,
                'exam_id' => $exam->id,
                'user_id' => $student->id,
                'status' => 'submitted',
                'submitted_at' => now(),
            ]);
            $answer = ExamAttemptAnswer::query()->create([
                'tenant_id' => $tenant->id,
                'exam_attempt_id' => $attempt->id,
                'exam_question_id' => $examQuestion->id,
                'question_id' => $question->id,
                'answer' => ['text' => 'Student response'],
                'answer_mode' => 'text',
                'grading_status' => 'pending_manual_review',
                'answered_at' => now(),
            ]);
            $answers[] = [$attempt, $examQuestion, $answer];
        }

        [$ownAttempt, $ownExamQuestion, $ownAnswer] = $answers[0];
        [$otherAttempt, $otherExamQuestion, $otherAnswer] = $answers[1];

        $this->getJson('/api/v1/instructor/grading/overview', $headers)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.examId', (string) $ownExam->id)
            ->assertJsonPath('data.0.pendingCount', 1);

        $this->getJson("/api/v1/instructor/exam-bank/exams/{$ownExam->id}/grading-queue", $headers)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', (string) $ownAnswer->id);

        $this->getJson("/api/v1/instructor/exam-bank/exams/{$otherExam->id}/grading-queue", $headers)
            ->assertNotFound();

        $this->getJson(
            "/api/v1/instructor/exam-bank/exam-attempts/{$ownAttempt->id}/answers/{$ownExamQuestion->id}/pages",
            $headers,
        )->assertOk()->assertJsonPath('data.answerId', (string) $ownAnswer->id);

        $this->getJson(
            "/api/v1/instructor/exam-bank/exam-attempts/{$otherAttempt->id}/answers/{$otherExamQuestion->id}/pages",
            $headers,
        )->assertNotFound();

        $this->putJson(
            "/api/v1/instructor/grading/exam-attempts/{$ownAttempt->id}/answers/{$ownAnswer->id}",
            ['manual_score' => 8, 'feedback' => 'Well done'],
            $headers,
        )->assertOk()
            ->assertJsonPath('data.answer.gradingStatus', 'graded')
            ->assertJsonPath('data.answer.gradedBy.id', (string) $membership->id)
            ->assertJsonStructure(['data' => ['answer' => ['gradedAt']]]);

        $this->putJson(
            "/api/v1/instructor/grading/exam-attempts/{$otherAttempt->id}/answers/{$otherAnswer->id}",
            ['manual_score' => 8, 'feedback' => 'Unauthorized'],
            $headers,
        )->assertNotFound();
    }

    public function test_instructor_exam_bank_only_lists_and_manages_their_own_exams_and_questions(): void
    {
        $tenant = Tenant::factory()->create([
            'feature_flags' => ['has_instructors' => true],
        ]);
        $role = Role::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Instructor',
            'slug' => 'instructor',
        ]);
        [$instructor, $membership] = $this->createInstructor($tenant, $role);
        [, $otherMembership] = $this->createInstructor($tenant, $role);
        $ownExam = $this->createExam($tenant, $membership, 'My exam');
        $otherExam = $this->createExam($tenant, $otherMembership, 'Other exam');
        $ownQuestion = $this->createQuestion($tenant, $membership, 'My question');
        $otherQuestion = $this->createQuestion($tenant, $otherMembership, 'Other question');
        $token = $instructor->createToken('instructor_access_token', [
            'instructor:access',
            'instructor:tenant:'.$tenant->id,
        ])->plainTextToken;
        $headers = [
            'Authorization' => 'Bearer '.$token,
            'X-Tenant-ID' => (string) $tenant->id,
        ];

        $this->getJson('/api/v1/instructor/exam-bank/exams', $headers)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'My exam');

        $this->getJson('/api/v1/instructor/exam-bank/exams/metrics', $headers)
            ->assertOk()
            ->assertJsonPath('data.total', 1);

        $this->getJson('/api/v1/instructor/exam-bank/exams/'.$otherExam->id, $headers)
            ->assertForbidden();

        $this->getJson('/api/v1/instructor/exam-bank/questions', $headers)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'My question');

        $this->getJson('/api/v1/instructor/exam-bank/questions/'.$otherQuestion->id, $headers)
            ->assertForbidden();

        $this->postJson('/api/v1/instructor/exam-bank/exams/'.$ownExam->id.'/questions', [
            'question_id' => $ownQuestion->id,
        ], $headers)->assertOk();

        $this->postJson('/api/v1/instructor/exam-bank/exams/'.$ownExam->id.'/questions', [
            'question_id' => $otherQuestion->id,
        ], $headers)->assertNotFound();

        $this->postJson('/api/v1/instructor/exam-bank/exams/bulk/delete', [
            'ids' => [$ownExam->id, $otherExam->id],
        ], $headers)->assertOk();

        $this->assertSoftDeleted('exams', ['id' => $ownExam->id]);
        $this->assertDatabaseHas('exams', ['id' => $otherExam->id, 'deleted_at' => null]);
    }

    public function test_instructor_can_create_an_exam_owned_by_their_membership(): void
    {
        $tenant = Tenant::factory()->create([
            'feature_flags' => ['has_instructors' => true],
        ]);
        $role = Role::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Instructor',
            'slug' => 'instructor',
        ]);
        [$instructor, $membership] = $this->createInstructor($tenant, $role);
        $token = $instructor->createToken('instructor_access_token', [
            'instructor:access',
            'instructor:tenant:'.$tenant->id,
        ])->plainTextToken;

        $this->postJson('/api/v1/instructor/exam-bank/exams', [
            'title' => 'Created from instructor workspace',
        ], [
            'Authorization' => 'Bearer '.$token,
            'X-Tenant-ID' => (string) $tenant->id,
        ])->assertCreated()
            ->assertJsonPath('data.title', 'Created from instructor workspace');

        $this->assertDatabaseHas('exams', [
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $membership->id,
            'title' => 'Created from instructor workspace',
        ]);
    }

    private function createInstructor(Tenant $tenant, Role $role): array
    {
        $user = User::factory()->create();
        $membership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'is_instructor' => true,
            'must_change_password' => false,
        ]);
        $membership->roles()->attach($role, ['tenant_id' => $tenant->id]);

        return [$user, $membership];
    }

    private function createExam(Tenant $tenant, TenantUser $creator, string $title): Exam
    {
        return Exam::query()->create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $creator->id,
            'title' => $title,
            'slug' => str_replace(' ', '-', strtolower($title)).'-'.$creator->id,
            'status' => 'draft',
            'visibility' => 'private',
        ]);
    }

    private function createQuestion(Tenant $tenant, TenantUser $creator, string $title): Question
    {
        return Question::query()->create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $creator->id,
            'title' => $title,
            'slug' => str_replace(' ', '-', strtolower($title)).'-'.$creator->id,
            'type' => 'single_choice',
            'status' => 'draft',
            'visibility' => 'private',
        ]);
    }
}
