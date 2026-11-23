<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\AssignmentResult;
use App\Models\CertificateApplication;
use App\Models\CertificateTemplate;
use App\Models\Course;
use App\Models\CourseCertificateRule;
use App\Models\CourseEnrollment;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\ExamAttempt;
use App\Models\IssuedCertificate;
use App\Models\Permission;
use App\Models\Quiz;
use App\Models\QuizResult;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Learning\CompletionService;
use Database\Seeders\IdentityAccessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
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

    public function test_student_can_apply_approve_view_and_verify_certificate(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [$course, $section, $lesson] = $this->publishedLessonStack($tenant, $admin, 'Certificate Issue');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $template = $this->activeTemplate($tenant, $admin);
        $this->certificateRule($tenant, $admin, $course, $template);
        $enrollment = $this->enrollStudent($tenant, $admin, $course, $student);

        Sanctum::actingAs($student->user);
        $this->postJson("/api/v1/lessons/{$lesson}/progress/complete", [], $this->tenantHeader($tenant))
            ->assertOk();

        $this->getJson("/api/v1/enrollments/{$enrollment}/certificate-eligibility", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('can_apply', true)
            ->assertJsonPath('completion_met', true);

        $applicationId = $this->postJson('/api/v1/certificates/applications', [
            'enrollment_id' => $enrollment,
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('application.status', 'pending')
            ->json('application.id');

        $this->assertDatabaseCount('issued_certificates', 0);

        Sanctum::actingAs($admin->user);
        $this->postJson("/api/v1/certificates/applications/{$applicationId}/approve", [
            'issue_and_send' => true,
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('application.status', 'issued');

        $certificate = IssuedCertificate::query()->firstOrFail();

        $this->assertStringStartsWith('CERT-'.now()->format('Y').'-', $certificate->certificate_number);
        $this->assertStringStartsWith('REF-'.now()->format('Y').'-', (string) $certificate->reference_number);
        $this->assertDatabaseCount('issued_certificates', 1);

        $this->postJson("/api/v1/certificates/applications/{$applicationId}/issue", [], $this->tenantHeader($tenant))
            ->assertOk();
        $this->assertDatabaseCount('issued_certificates', 1);

        Sanctum::actingAs($student->user);
        $this->getJson('/api/v1/certificates/me', $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('certificates.0.id', $certificate->id);

        $code = $certificate->verification()->firstOrFail()->verification_code;

        $this->getJson("/api/v1/certificates/verify/{$code}")
            ->assertOk()
            ->assertJsonPath('valid', true)
            ->assertJsonPath('course_title', 'Certificate Issue Course')
            ->assertJsonPath('learner_display_name', $student->user->name)
            ->assertJsonPath('snapshot.certificate_number', $certificate->certificate_number)
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

        $this->getJson("/api/v1/enrollments/{$enrollment}/certificate-eligibility", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('can_apply', false)
            ->assertJsonPath('legacy_requirements_met', false);

        $this->postJson('/api/v1/certificates/applications', [
            'enrollment_id' => $enrollment,
        ], $this->tenantHeader($tenant))->assertUnprocessable();

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

        app(CompletionService::class)->synchronize(CourseEnrollment::query()->findOrFail($enrollment));

        Sanctum::actingAs($student->user);
        $applicationId = $this->postJson('/api/v1/certificates/applications', [
            'enrollment_id' => $enrollment,
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('application.id');

        Sanctum::actingAs($admin->user);
        $this->postJson("/api/v1/certificates/applications/{$applicationId}/approve", [
            'issue_and_send' => true,
        ], $this->tenantHeader($tenant))->assertOk();

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

    public function test_rule_supports_multiple_requirements_and_validates_each_type(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        [$course] = $this->publishedLessonStack($tenant, $admin, 'Certificate Requirements');
        $template = $this->activeTemplate($tenant, $admin);
        $exam = $this->createExam($tenant, $admin, ['title' => 'Certificate Bank Exam']);

        Sanctum::actingAs($admin->user);

        $payload = [
            'certificate_template_id' => $template,
            'enabled' => true,
            'require_course_completion' => true,
            'minimum_completion_percentage' => 100,
            'requirements' => [
                [
                    'type' => 'exam_bank',
                    'title' => 'Bank exam',
                    'exam_id' => $exam,
                    'required_score' => 80,
                    'sort_order' => 0,
                ],
                [
                    'type' => 'exam_link',
                    'title' => 'External exam',
                    'exam_link' => 'https://example.com/exam',
                    'sort_order' => 1,
                ],
                [
                    'type' => 'project',
                    'title' => 'Final project',
                    'sort_order' => 2,
                ],
            ],
        ];

        $response = $this->putJson("/api/v1/courses/{$course}/certificate-rule", $payload, $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonCount(3, 'rule.requirements');

        $requirements = $response->json('rule.requirements');
        $this->assertSame('exam_bank', $requirements[0]['type']);
        $this->assertSame(80, (int) $requirements[0]['required_score']);
        $this->assertSame($exam, (int) $requirements[0]['exam_id']);
        $this->assertSame('exam_link', $requirements[1]['type']);
        $this->assertSame('project', $requirements[2]['type']);
        $this->assertDatabaseCount('course_certificate_requirements', 3);

        $this->putJson("/api/v1/courses/{$course}/certificate-rule", array_merge($payload, [
            'requirements' => [['type' => 'exam_bank', 'exam_id' => $exam]],
        ]), $this->tenantHeader($tenant))->assertUnprocessable();

        $this->putJson("/api/v1/courses/{$course}/certificate-rule", array_merge($payload, [
            'requirements' => [['type' => 'exam_bank', 'exam_id' => $exam, 'required_score' => 101]],
        ]), $this->tenantHeader($tenant))->assertUnprocessable();

        $this->putJson("/api/v1/courses/{$course}/certificate-rule", array_merge($payload, [
            'requirements' => [['type' => 'exam_link', 'exam_link' => 'not-a-url']],
        ]), $this->tenantHeader($tenant))->assertUnprocessable();

        $this->putJson("/api/v1/courses/{$course}/certificate-rule", array_merge($payload, [
            'requirements' => [['type' => 'interview']],
        ]), $this->tenantHeader($tenant))->assertUnprocessable();

        $this->assertDatabaseCount('course_certificate_requirements', 3);

        $updated = $this->putJson("/api/v1/courses/{$course}/certificate-rule", array_merge($payload, [
            'requirements' => [
                [
                    'id' => $requirements[0]['id'],
                    'type' => 'exam_bank',
                    'exam_id' => $exam,
                    'required_score' => 85,
                    'sort_order' => 0,
                ],
                [
                    'id' => $requirements[2]['id'],
                    'type' => 'project',
                    'title' => 'Final project',
                    'sort_order' => 2,
                ],
            ],
        ]), $this->tenantHeader($tenant))
            ->assertOk()
            ->json('rule.requirements');

        $this->assertCount(2, $updated);
        $this->assertSame($requirements[0]['id'], $updated[0]['id']);
        $this->assertSame($requirements[2]['id'], $updated[1]['id']);
        $this->assertDatabaseCount('course_certificate_requirements', 2);
    }

    public function test_bank_exam_score_and_project_link_drive_manual_certificate_flow(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [$course, , $lesson] = $this->publishedLessonStack($tenant, $admin, 'Assessment Certificate');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $template = $this->activeTemplate($tenant, $admin);
        $exam = $this->createExam($tenant, $admin, ['title' => 'Certificate Assessment']);
        $this->certificateRule($tenant, $admin, $course, $template, [
            'requirements' => [
                [
                    'type' => 'exam_bank',
                    'title' => 'Bank exam',
                    'exam_id' => $exam,
                    'required_score' => 80,
                ],
                [
                    'type' => 'project',
                    'title' => 'Final project',
                ],
            ],
        ]);
        $enrollment = $this->enrollStudent($tenant, $admin, $course, $student);

        Sanctum::actingAs($student->user);
        $this->postJson("/api/v1/lessons/{$lesson}/progress/complete", [], $this->tenantHeader($tenant))
            ->assertOk();

        $evaluation = $this->getJson("/api/v1/enrollments/{$enrollment}/certificate-eligibility", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('can_apply', false)
            ->json();

        $bankRequirementId = collect($evaluation['requirements'])->firstWhere('type', 'exam_bank')['id'];
        $projectRequirementId = collect($evaluation['requirements'])->firstWhere('type', 'project')['id'];

        $this->postJson('/api/v1/certificates/applications', [
            'enrollment_id' => $enrollment,
        ], $this->tenantHeader($tenant))->assertUnprocessable();

        ExamAttempt::create([
            'tenant_id' => $tenant->id,
            'exam_id' => $exam,
            'user_id' => $student->user_id,
            'score' => 79,
            'max_score' => 100,
            'percentage' => 79,
            'passed' => false,
            'status' => 'submitted',
            'started_at' => now(),
            'submitted_at' => now(),
        ]);

        $this->getJson("/api/v1/enrollments/{$enrollment}/certificate-eligibility", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('can_apply', false);

        ExamAttempt::create([
            'tenant_id' => $tenant->id,
            'exam_id' => $exam,
            'user_id' => $student->user_id,
            'score' => 85,
            'max_score' => 100,
            'percentage' => 85,
            'passed' => true,
            'status' => 'submitted',
            'started_at' => now(),
            'submitted_at' => now(),
        ]);

        $this->getJson("/api/v1/enrollments/{$enrollment}/certificate-eligibility", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('can_apply', false)
            ->assertJsonPath('requirements.0.met', true)
            ->assertJsonPath('requirements.1.met', false);

        $this->postJson('/api/v1/certificates/applications', [
            'enrollment_id' => $enrollment,
        ], $this->tenantHeader($tenant))->assertUnprocessable();

        $applicationId = $this->postJson('/api/v1/certificates/applications', [
            'enrollment_id' => $enrollment,
            'submissions' => [
                (string) $projectRequirementId => 'https://example.com/final-project',
            ],
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->assertJsonPath('application.status', 'pending')
            ->assertJsonPath("application.submissions.{$projectRequirementId}", 'https://example.com/final-project')
            ->json('application.id');

        Sanctum::actingAs($admin->user);
        $this->postJson("/api/v1/certificates/applications/{$applicationId}/approve", [
            'issue_and_send' => true,
            'requirement_reviews' => [
                (string) $projectRequirementId => [
                    'status' => 'approved',
                    'note' => 'Project verified.',
                ],
            ],
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('application.status', 'issued')
            ->assertJsonPath("application.requirement_reviews.{$projectRequirementId}.status", 'approved');

        $certificate = IssuedCertificate::query()->firstOrFail();
        $this->assertCount(2, $certificate->snapshot_data['requirements']);
        $this->assertSame((int) $bankRequirementId, (int) $certificate->snapshot_data['requirements'][0]['id']);
        $this->assertDatabaseCount('issued_certificates', 1);
    }

    public function test_rejected_requirement_review_prevents_issuance(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [$course, , $lesson] = $this->publishedLessonStack($tenant, $admin, 'Manual Review Certificate');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $template = $this->activeTemplate($tenant, $admin);
        $this->certificateRule($tenant, $admin, $course, $template, [
            'requirements' => [['type' => 'exam_link', 'title' => 'External exam']],
        ]);
        $enrollment = $this->enrollStudent($tenant, $admin, $course, $student);

        Sanctum::actingAs($student->user);
        $this->postJson("/api/v1/lessons/{$lesson}/progress/complete", [], $this->tenantHeader($tenant))
            ->assertOk();

        $eligibility = $this->getJson("/api/v1/enrollments/{$enrollment}/certificate-eligibility", $this->tenantHeader($tenant))
            ->assertOk()
            ->json();
        $requirementId = $eligibility['requirements'][0]['id'];

        $applicationId = $this->postJson('/api/v1/certificates/applications', [
            'enrollment_id' => $enrollment,
            'submissions' => [(string) $requirementId => 'https://example.com/external-exam'],
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('application.id');

        Sanctum::actingAs($admin->user);
        $this->postJson("/api/v1/certificates/applications/{$applicationId}/approve", [
            'issue_and_send' => true,
            'requirement_reviews' => [
                (string) $requirementId => [
                    'status' => 'rejected',
                    'note' => 'External result cannot be verified.',
                ],
            ],
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('application.status', 'rejected')
            ->assertJsonPath("application.requirement_reviews.{$requirementId}.status", 'rejected');

        $this->assertDatabaseCount('issued_certificates', 0);

        Sanctum::actingAs($student->user);
        $this->getJson("/api/v1/enrollments/{$enrollment}/certificate-eligibility", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('can_apply', true)
            ->assertJsonPath('latest_application', 'rejected');
    }

    public function test_rejected_application_can_be_resubmitted_with_a_new_link(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        [$course, , $lesson] = $this->publishedLessonStack($tenant, $admin, 'Resubmit Certificate');
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $template = $this->activeTemplate($tenant, $admin);
        $this->certificateRule($tenant, $admin, $course, $template, [
            'requirements' => [['type' => 'project', 'title' => 'Final project']],
        ]);
        $enrollment = $this->enrollStudent($tenant, $admin, $course, $student);

        Sanctum::actingAs($student->user);
        $this->postJson("/api/v1/lessons/{$lesson}/progress/complete", [], $this->tenantHeader($tenant))
            ->assertOk();

        $eligibility = $this->getJson("/api/v1/enrollments/{$enrollment}/certificate-eligibility", $this->tenantHeader($tenant))
            ->assertOk()
            ->json();
        $requirementId = $eligibility['requirements'][0]['id'];

        $firstApplicationId = $this->postJson('/api/v1/certificates/applications', [
            'enrollment_id' => $enrollment,
            'submissions' => [(string) $requirementId => 'https://example.com/draft'],
        ], $this->tenantHeader($tenant))->assertCreated()->json('application.id');

        Sanctum::actingAs($admin->user);
        $this->postJson("/api/v1/certificates/applications/{$firstApplicationId}/reject", [
            'admin_note' => 'Link is not public.',
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('application.status', 'rejected');

        Sanctum::actingAs($student->user);
        $this->getJson("/api/v1/enrollments/{$enrollment}/certificate-eligibility", $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('can_apply', true)
            ->assertJsonPath('latest_application', 'rejected');

        $secondApplicationId = $this->postJson('/api/v1/certificates/applications', [
            'enrollment_id' => $enrollment,
            'submissions' => [(string) $requirementId => 'https://example.com/final'],
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('application.id');

        $this->assertNotSame($firstApplicationId, $secondApplicationId);
        $this->assertDatabaseCount('certificate_applications', 2);

        $applications = $this->getJson('/api/v1/certificates/applications/me', $this->tenantHeader($tenant))
            ->assertOk()
            ->json('applications');
        $this->assertSame($secondApplicationId, (int) $applications[0]['id']);
        $this->assertSame('https://example.com/final', $applications[0]['submissions'][(string) $requirementId]);
        $this->assertSame('rejected', CertificateApplication::query()->findOrFail($firstApplicationId)->status);

        Sanctum::actingAs($admin->user);
        $this->postJson("/api/v1/certificates/applications/{$secondApplicationId}/approve", [
            'issue_and_send' => true,
        ], $this->tenantHeader($tenant))
            ->assertOk()
            ->assertJsonPath('application.status', 'issued');

        $this->assertDatabaseCount('issued_certificates', 1);
    }

    public function test_verification_uses_immutable_issuance_snapshot(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $instructor = $this->memberWithRole($tenant, 'instructor');
        [$course, , $lesson] = $this->publishedLessonStack($tenant, $admin, 'Snapshot Course', $instructor);
        $certificate = $this->issuedCertificateThroughCompletion($tenant, $admin, $student, $lesson, $course);
        $code = $certificate->verification()->firstOrFail()->verification_code;
        $originalInstructorName = $instructor->user->name;

        $this->getJson("/api/v1/certificates/verify/{$code}")
            ->assertOk()
            ->assertJsonPath('course_title', 'Snapshot Course Course')
            ->assertJsonPath('instructor_name', $originalInstructorName)
            ->assertJsonPath('snapshot.design.version', 1);

        Course::withoutGlobalScopes()->whereKey($course)->update(['title' => 'Renamed Course']);
        $instructor->user->update(['name' => 'Renamed Instructor']);
        CertificateTemplate::withoutGlobalScopes()
            ->whereKey($certificate->certificate_template_id)
            ->update(['template_data' => ['version' => 999]]);
        CourseCertificateRule::withoutGlobalScopes()
            ->where('course_id', $course)
            ->update(['manager_signature_name' => 'Renamed Manager']);

        $this->getJson("/api/v1/certificates/verify/{$code}")
            ->assertOk()
            ->assertJsonPath('course_title', 'Snapshot Course Course')
            ->assertJsonPath('instructor_name', $originalInstructorName)
            ->assertJsonPath('snapshot.design.version', 1)
            ->assertJsonPath('snapshot.manager_signature_name', null);

        $this->assertSame('Renamed Course', Course::withoutGlobalScopes()->findOrFail($course)->title);
    }

    public function test_instructor_certificate_routes_are_scoped_to_owned_courses(): void
    {
        $tenant = Tenant::factory()->create(['feature_flags' => ['has_instructors' => true]]);
        $admin = $this->memberWithRole($tenant, 'admin');
        $student = $this->memberWithRole($tenant, 'student');
        $instructor = $this->instructorMembership($tenant);
        $otherInstructor = $this->instructorMembership($tenant);

        [$ownedCourse, , $ownedLesson] = $this->publishedLessonStack($tenant, $admin, 'Owned Certificates', $instructor);
        [$otherCourse, , $otherLesson] = $this->publishedLessonStack($tenant, $admin, 'Other Certificates', $otherInstructor);
        $ownedApplication = $this->pendingApplication($tenant, $admin, $ownedCourse, $ownedLesson, $student);
        $otherApplication = $this->pendingApplication($tenant, $admin, $otherCourse, $otherLesson, $student);

        $ownedToken = $instructor->user->createToken(
            'instructor_access_token',
            ['instructor:access', 'instructor:tenant:'.$tenant->id],
        )->plainTextToken;
        $otherToken = $otherInstructor->user->createToken(
            'instructor_access_token',
            ['instructor:access', 'instructor:tenant:'.$tenant->id],
        )->plainTextToken;

        Auth::guard('sanctum')->forgetUser();

        $headers = [
            'X-Tenant-ID' => (string) $tenant->id,
            'Authorization' => 'Bearer '.$ownedToken,
        ];

        $visibleIds = collect($this->getJson('/api/v1/instructor/certificates/applications', $headers)
            ->assertOk()
            ->json('applications.data'))
            ->pluck('id')
            ->all();
        $this->assertContains($ownedApplication, $visibleIds);
        $this->assertNotContains($otherApplication, $visibleIds);

        $this->getJson("/api/v1/instructor/courses/{$ownedCourse}/certificate-rule", $headers)->assertOk();

        $this->getJson("/api/v1/instructor/courses/{$otherCourse}/certificate-rule", $headers)
            ->assertForbidden();

        $this->postJson("/api/v1/instructor/certificates/applications/{$otherApplication}/approve", [
            'issue_and_send' => true,
        ], $headers)->assertForbidden();

        Auth::guard('sanctum')->forgetUser();

        $this->postJson("/api/v1/instructor/certificates/applications/{$ownedApplication}/approve", [
            'issue_and_send' => true,
        ], array_merge($headers, ['Authorization' => 'Bearer '.$otherToken]))
            ->assertForbidden();

        Auth::guard('sanctum')->forgetUser();

        $this->postJson("/api/v1/instructor/certificates/applications/{$ownedApplication}/approve", [
            'issue_and_send' => true,
        ], $headers)
            ->assertOk()
            ->assertJsonPath('application.status', 'issued');

        $this->assertDatabaseHas('certificate_applications', [
            'id' => $ownedApplication,
            'status' => 'issued',
        ]);
        $this->assertDatabaseHas('certificate_applications', [
            'id' => $otherApplication,
            'status' => 'pending',
        ]);
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
     * @param  array<string, mixed>  $overrides
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
        $enrollment = $this->enrollStudent($tenant, $admin, $course, $student);

        Sanctum::actingAs($student->user);
        $this->postJson("/api/v1/lessons/{$lesson}/progress/complete", [], $this->tenantHeader($tenant))
            ->assertOk();

        $applicationId = $this->postJson('/api/v1/certificates/applications', [
            'enrollment_id' => $enrollment,
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('application.id');

        Sanctum::actingAs($admin->user);
        $this->postJson("/api/v1/certificates/applications/{$applicationId}/approve", [
            'issue_and_send' => true,
        ], $this->tenantHeader($tenant))
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
        return (int) Assignment::withoutEvents(fn () => Assignment::create([
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

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createExam(Tenant $tenant, TenantUser $manager, array $overrides = []): int
    {
        Sanctum::actingAs($manager->user);

        return (int) $this->postJson('/api/v1/exam-bank/exams', array_merge([
            'title' => 'Certificate Exam',
            'description' => 'Certificate exam description.',
            'duration' => 60,
            'passing_score' => 60,
            'attempt_limit' => 1,
            'question_count' => 10,
        ], $overrides), $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('data.id');
    }

    private function pendingApplication(
        Tenant $tenant,
        TenantUser $admin,
        int $course,
        int $lesson,
        TenantUser $student,
    ): int {
        $this->setCourseAccess($tenant, $admin, $course, 'enrolled_only');
        $template = $this->activeTemplate($tenant, $admin);
        $this->certificateRule($tenant, $admin, $course, $template);
        $enrollment = $this->enrollStudent($tenant, $admin, $course, $student);

        Sanctum::actingAs($student->user);
        $this->postJson("/api/v1/lessons/{$lesson}/progress/complete", [], $this->tenantHeader($tenant))
            ->assertOk();

        return (int) $this->postJson('/api/v1/certificates/applications', [
            'enrollment_id' => $enrollment,
        ], $this->tenantHeader($tenant))
            ->assertCreated()
            ->json('application.id');
    }

    private function instructorMembership(Tenant $tenant): TenantUser
    {
        $membership = $this->memberWithRole($tenant, 'instructor');
        $membership->forceFill([
            'is_instructor' => true,
            'must_change_password' => false,
            'status' => 'active',
        ])->save();

        return $membership->load('user', 'roles');
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
