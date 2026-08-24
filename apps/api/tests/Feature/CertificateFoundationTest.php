<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\AssignmentResult;
use App\Models\Course;
use App\Models\CourseCompletion;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\IssuedCertificate;
use App\Models\Permission;
use App\Models\Quiz;
use App\Models\QuizResult;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Certificates\CertificateIssuanceService;
use App\Services\Learning\CompletionService;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CertificateFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_template_creation_lifecycle_and_rule_configuration(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        [$course] = $this->publishedLessonStack($tenant, $admin, 'Certificate Rules');

        Sanctum::actingAs($admin->user);

        $template = $this->postJson('/api/v1/certificates/templates', [
            'name' => 'Completion Certificate',
            'slug' => 'completion-certificate',
            'template_data' => ['layout' => 'classic'],
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('template.status', 'draft')
            ->json('template.id');

        $this->patchJson("/api/v1/certificates/templates/{$template}/status", [
            'status' => 'active',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('template.status', 'active');

        $this->putJson("/api/v1/courses/{$course}/certificate-rule", [
            'certificate_template_id' => $template,
            'enabled' => true,
            'require_course_completion' => true,
            'require_quiz_pass' => true,
            'require_assignment_pass' => false,
            'minimum_completion_percentage' => 90,
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('rule.enabled', true)
            ->assertJsonPath('rule.minimum_completion_percentage', 90);

        $this->patchJson("/api/v1/certificates/templates/{$template}/status", [
            'status' => 'archived',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('template.status', 'archived');
    }

    public function test_completion_issues_certificate_once_and_student_can_view_and_verify(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Certificate Issue');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $template = $this->activeTemplate($tenant, $admin);
        $this->certificateRule($tenant, $admin, $course, $template);
        $this->enrollStudent($tenant, $admin, $course, $student);

        Sanctum::actingAs($student->user);
        $this->postJson("/api/v1/lessons/{$lesson}/progress/complete", [], $this->tenantHeader($tenant))
            ->assertOk();

        $certificate = IssuedCertificate::query()->firstOrFail();

        $this->assertStringStartsWith('CERT-'.now()->format('Y').'-', $certificate->certificate_number);
        $this->assertDatabaseCount('issued_certificates', 1);

        app(CertificateIssuanceService::class)->evaluateAndIssue(CourseCompletion::query()->firstOrFail());
        $this->assertDatabaseCount('issued_certificates', 1);

        $this->getJson('/api/v1/certificates/me', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('certificates.0.id', $certificate->id);

        $code = $certificate->verification()->firstOrFail()->verification_code;

        $this->getJson("/api/v1/certificates/verify/{$code}")
            ->assertOk()
            ->assertJsonPath('valid', true)
            ->assertJsonPath('course_title', 'Certificate Issue Course')
            ->assertJsonPath('learner_display_name', $student->user->name)
            ->assertJsonMissing(['tenant_id' => $tenant->id]);
    }

    public function test_quiz_and_assignment_requirements_block_until_passed(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [$course, , $lesson] = $this->publishedLessonStack($tenant, $admin, 'Certificate Eligibility');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $template = $this->activeTemplate($tenant, $admin);
        $this->certificateRule($tenant, $admin, $course, $template, [
            'require_quiz_pass' => true,
            'require_assignment_pass' => true,
        ]);
        $enrollment = $this->enrollStudent($tenant, $admin, $course, $student);
        $quiz = $this->publishedQuiz($tenant, $course, $lesson);
        $assignment = $this->publishedAssignment($tenant, $course, $lesson);

        Sanctum::actingAs($student->user);
        $this->postJson("/api/v1/lessons/{$lesson}/progress/complete", [], $this->tenantHeader($tenant))
            ->assertOk();

        $this->assertDatabaseCount('issued_certificates', 0);

        QuizResult::withoutEvents(fn () => QuizResult::create([
            'tenant_id' => $tenant->id,
            'quiz_id' => $quiz,
            'tenant_user_id' => $student->id,
            'best_score' => 100,
            'passed' => true,
            'completed_at' => now(),
        ]));
        AssignmentResult::withoutEvents(fn () => AssignmentResult::create([
            'tenant_id' => $tenant->id,
            'assignment_id' => $assignment,
            'tenant_user_id' => $student->id,
            'score' => 100,
            'passed' => true,
            'feedback' => 'Passed.',
            'graded_by_tenant_user_id' => $admin->id,
            'graded_at' => now(),
        ]));

        app(CompletionService::class)->synchronize(\App\Models\CourseEnrollment::query()->findOrFail($enrollment));

        $this->assertDatabaseCount('issued_certificates', 1);
    }

    public function test_revocation_preserves_certificate_and_verification_reports_revoked(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [, , $lesson] = $this->publishedLessonStack($tenant, $admin, 'Certificate Revoke');
        $certificate = $this->issuedCertificateThroughCompletion($tenant, $admin, $student, $lesson);
        $code = $certificate->verification()->firstOrFail()->verification_code;

        Sanctum::actingAs($admin->user);
        $this->postJson("/api/v1/certificates/{$certificate->id}/revoke", [], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('certificate.status', 'revoked');

        $this->assertDatabaseHas('issued_certificates', [
            'id' => $certificate->id,
            'status' => 'revoked',
        ]);

        $this->getJson("/api/v1/certificates/verify/{$code}")
            ->assertOk()
            ->assertJsonPath('valid', false)
            ->assertJsonPath('certificate_status', 'revoked');
    }

    public function test_student_instructor_and_tenant_visibility_are_enforced(): void
    {
        $firstTenant = Tenant::factory()->create();
        $secondTenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($firstTenant, 'admin');
        $instructor = $this->memberWithRole($firstTenant, 'instructor');
        $otherInstructor = $this->memberWithRole($firstTenant, 'instructor');
        $student = $this->memberWithRole($firstTenant, 'student');
        $otherStudent = $this->memberWithRole($firstTenant, 'student');
        $secondAdmin = $this->memberWithRole($secondTenant, 'admin');
        [$course, , $lesson] = $this->publishedLessonStack($firstTenant, $admin, 'Certificate Visibility', $instructor);
        $certificate = $this->issuedCertificateThroughCompletion($firstTenant, $admin, $student, $lesson, $course);

        Sanctum::actingAs($student->user);
        $this->getJson('/api/v1/certificates/me', $this->tenantHeader($firstTenant))
            ->assertOk()
            ->assertJsonPath('certificates.0.id', $certificate->id);

        Sanctum::actingAs($otherStudent->user);
        $this->getJson('/api/v1/certificates/me', $this->tenantHeader($firstTenant))
            ->assertOk()
            ->assertJsonPath('certificates', []);

        Sanctum::actingAs($instructor->user);
        $this->getJson('/api/v1/certificates', $this->tenantHeader($firstTenant))
            ->assertOk()
            ->assertJsonPath('certificates.data.0.id', $certificate->id);

        Sanctum::actingAs($otherInstructor->user);
        $this->getJson('/api/v1/certificates', $this->tenantHeader($firstTenant))
            ->assertOk()
            ->assertJsonPath('certificates.data', []);

        Sanctum::actingAs($secondAdmin->user);
        $this->postJson("/api/v1/certificates/{$certificate->id}/revoke", [], $this->tenantHeader($secondTenant))
            ->assertNotFound();
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
            'lesson_type' => 'text',
            'visibility' => 'private',
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.id');

        CourseLesson::withoutGlobalScopes()->whereKey($lesson)->update(['status' => 'published']);

        return [$course, $section, $lesson];
    }

    private function activeTemplate(Tenant $tenant, TenantUser $admin): int
    {
        Sanctum::actingAs($admin->user);

        $template = $this->postJson('/api/v1/certificates/templates', [
            'name' => 'Course Certificate',
            'slug' => 'course-certificate-'.uniqid(),
            'template_data' => ['version' => 1],
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('template.id');

        $this->patchJson("/api/v1/certificates/templates/{$template}/status", [
            'status' => 'active',
        ], $this->tenantHeader($tenant))->assertOk();

        return $template;
    }

    /**
     * @param array<string, mixed> $overrides
     */
    private function certificateRule(Tenant $tenant, TenantUser $admin, int $course, int $template, array $overrides = []): void
    {
        Sanctum::actingAs($admin->user);

        $this->putJson("/api/v1/courses/{$course}/certificate-rule", array_merge([
            'certificate_template_id' => $template,
            'enabled' => true,
            'require_course_completion' => true,
            'minimum_completion_percentage' => 100,
        ], $overrides), $this->tenantHeader($tenant))->assertOk();
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

    private function issuedCertificateThroughCompletion(
        Tenant $tenant,
        TenantUser $admin,
        TenantUser $student,
        int $lesson,
        ?int $courseId = null,
    ): IssuedCertificate {
        $lessonModel = CourseLesson::withoutGlobalScopes()->findOrFail($lesson);
        $course = $courseId ?? $lessonModel->course_id;
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $template = $this->activeTemplate($tenant, $admin);
        $this->certificateRule($tenant, $admin, $course, $template);
        $this->enrollStudent($tenant, $admin, $course, $student);

        Sanctum::actingAs($student->user);
        $this->postJson("/api/v1/lessons/{$lesson}/progress/complete", [], $this->tenantHeader($tenant))
            ->assertOk();

        return IssuedCertificate::query()->firstOrFail();
    }

    private function publishedQuiz(Tenant $tenant, int $course, int $lesson): int
    {
        return (int) Quiz::withoutEvents(fn () => Quiz::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course,
            'course_section_id' => CourseLesson::withoutGlobalScopes()->findOrFail($lesson)->course_section_id,
            'course_lesson_id' => $lesson,
            'title' => 'Certificate Quiz',
            'passing_score' => 70,
            'max_attempts' => 1,
            'shuffle_questions' => false,
            'shuffle_answers' => false,
            'show_correct_answers' => false,
            'status' => 'published',
        ]))->id;
    }

    private function publishedAssignment(Tenant $tenant, int $course, int $lesson): int
    {
        return (int) \App\Models\Assignment::withoutEvents(fn () => \App\Models\Assignment::create([
            'tenant_id' => $tenant->id,
            'course_id' => $course,
            'course_section_id' => CourseLesson::withoutGlobalScopes()->findOrFail($lesson)->course_section_id,
            'course_lesson_id' => $lesson,
            'title' => 'Certificate Assignment',
            'max_score' => 100,
            'allow_late_submission' => false,
            'status' => 'published',
        ]))->id;
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
