<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\CourseInstructor;
use App\Models\CourseLesson;
use App\Models\CourseSection;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\Instructors\InstructorFeature;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InstructorCourseAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_instructors_can_only_edit_and_publish_courses_currently_assigned_to_them(): void
    {
        [$tenant, $adminMembership, $instructorMembership, $instructor, $instructorToken] = $this->courseFixture();
        $headers = [
            'X-Tenant-ID' => (string) $tenant->id,
            'Authorization' => 'Bearer '.$instructorToken,
        ];
        $assignedCourse = $this->course($tenant, $adminMembership, $instructorMembership);
        $createdButUnassignedCourse = $this->course($tenant, $instructorMembership, null);
        CourseInstructor::query()->create([
            'tenant_id' => $tenant->id,
            'course_id' => $createdButUnassignedCourse->id,
            'tenant_user_id' => $instructorMembership->id,
            'role' => 'co_instructor',
        ]);
        $this->assertFalse($createdButUnassignedCourse->fresh()->instructor_assignment_managed);

        $this->withHeaders($headers)
            ->getJson('/api/v1/instructor/courses')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->withHeaders($headers)
            ->putJson('/api/v1/instructor/courses/'.$createdButUnassignedCourse->id, [
                'title' => 'Unauthorized edit',
            ])
            ->assertForbidden();

        $this->withHeaders($headers)
            ->putJson('/api/v1/instructor/courses/'.$assignedCourse->id, [
                'title' => 'Updated by Instructor',
            ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Updated by Instructor');

        $this->withHeaders($headers)
            ->putJson('/api/v1/instructor/courses/'.$assignedCourse->id, [
                'visibility' => 'public',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('visibility');

        $this->withHeaders($headers)
            ->patchJson('/api/v1/instructor/courses/'.$assignedCourse->id.'/publish')
            ->assertOk()
            ->assertJsonPath('data.status', 'published');

        $created = $this->withHeaders($headers)
            ->postJson('/api/v1/instructor/courses', [
                'title' => 'Created by Instructor',
                'slug' => 'created-by-instructor',
            ])
            ->assertCreated()
            ->json('data.id');
        $this->assertDatabaseHas('courses', [
            'id' => $created,
            'created_by_tenant_user_id' => $instructorMembership->id,
            'primary_instructor_tenant_user_id' => $instructorMembership->id,
        ]);

        $this->withHeaders($headers)
            ->deleteJson('/api/v1/courses/'.$assignedCourse->id)
            ->assertForbidden();
    }

    public function test_instructor_course_access_cannot_cross_tenant_through_a_foreign_membership_or_pivot(): void
    {
        [$tenantA, $adminMembership, $instructorMembership, $instructor, $instructorToken] = $this->courseFixture();
        $tenantB = Tenant::factory()->create([
            'feature_flags' => ['has_instructors' => true],
        ]);
        $tenantBPrimaryInstructor = $this->instructorMembership($tenantB);
        $instructorMembershipB = TenantUser::factory()->create([
            'tenant_id' => $tenantB->id,
            'user_id' => $instructor->id,
            'status' => 'active',
            'is_instructor' => true,
            'must_change_password' => false,
        ]);
        $instructorRoleB = Role::query()->firstOrCreate(
            ['tenant_id' => $tenantB->id, 'slug' => 'instructor'],
            ['name' => 'Instructor'],
        );
        $this->grant($instructorRoleB, ['courses.view', 'courses.update', 'modules.view', 'modules.update']);
        $instructorMembershipB->roles()->attach($instructorRoleB, ['tenant_id' => $tenantB->id]);

        $assignedCourseA = $this->course($tenantA, $adminMembership, $instructorMembership);
        $foreignCourse = $this->course($tenantB, $tenantBPrimaryInstructor, $tenantBPrimaryInstructor);
        $assignedModuleA = \App\Models\CourseModule::query()->create([
            'tenant_id' => $tenantA->id,
            'course_id' => $assignedCourseA->id,
            'title' => 'Tenant A module',
            'slug' => 'tenant-a-module',
            'order' => 0,
        ]);
        $foreignModule = \App\Models\CourseModule::query()->create([
            'tenant_id' => $tenantB->id,
            'course_id' => $foreignCourse->id,
            'title' => 'Tenant B module',
            'slug' => 'tenant-b-module',
            'order' => 0,
        ]);
        CourseInstructor::query()->create([
            'tenant_id' => $tenantB->id,
            'course_id' => $foreignCourse->id,
            'tenant_user_id' => $instructorMembershipB->id,
            'role' => 'co_instructor',
        ]);

        $headersA = [
            'X-Tenant-ID' => (string) $tenantA->id,
            'Authorization' => 'Bearer '.$instructorToken,
        ];
        $headersB = [
            'X-Tenant-ID' => (string) $tenantB->id,
            'Authorization' => 'Bearer '.$instructorToken,
        ];
        $crossTenantRefreshToken = $instructor->createToken(
            'instructor_refresh_token',
            ['instructor:refresh', 'instructor:tenant:'.$tenantA->id],
        )->plainTextToken;

        $this->withHeaders($headersA)
            ->getJson('/api/v1/instructor/courses/'.$assignedCourseA->id.'/modules')
            ->assertOk();
        $this->withHeaders($headersA)
            ->putJson('/api/v1/instructor/courses/'.$assignedCourseA->id.'/modules/'.$assignedModuleA->id, [
                'title' => 'Tenant A module updated',
            ])
            ->assertOk();

        $this->withHeaders($headersA)
            ->getJson('/api/v1/instructor/courses/'.$foreignCourse->id.'/modules')
            ->assertNotFound();
        $this->withHeaders($headersA)
            ->putJson('/api/v1/instructor/courses/'.$foreignCourse->id.'/modules/'.$foreignModule->id, [
                'title' => 'Unauthorized cross-tenant edit',
            ])
            ->assertNotFound();

        $this->withHeaders($headersB)
            ->getJson('/api/v1/instructor/courses/'.$foreignCourse->id.'/modules')
            ->assertForbidden();
        $this->withHeaders($headersB)
            ->putJson('/api/v1/instructor/courses/'.$foreignCourse->id.'/modules/'.$foreignModule->id, [
                'title' => 'Unauthorized pivot edit',
            ])
            ->assertForbidden();
        $this->postJson('/api/v1/instructor/auth/refresh', [
            'refresh_token' => $crossTenantRefreshToken,
        ], ['X-Tenant-ID' => (string) $tenantB->id])->assertUnauthorized();

        $this->assertDatabaseHas('courses', [
            'id' => $foreignCourse->id,
            'tenant_id' => $tenantB->id,
            'title' => $foreignCourse->title,
        ]);
        $this->assertDatabaseHas('course_modules', [
            'id' => $foreignModule->id,
            'tenant_id' => $tenantB->id,
            'title' => 'Tenant B module',
        ]);
        $this->assertDatabaseHas('course_modules', [
            'id' => $assignedModuleA->id,
            'tenant_id' => $tenantA->id,
            'title' => 'Tenant A module updated',
        ]);
    }

    public function test_admin_reassignment_and_unassignment_take_effect_on_the_next_request(): void
    {
        [$tenant, $adminMembership, $instructorMembership, $instructor, $instructorToken, $admin] = $this->courseFixture();
        $headers = [
            'X-Tenant-ID' => (string) $tenant->id,
            'Authorization' => 'Bearer '.$instructorToken,
        ];
        $course = $this->course($tenant, $adminMembership, $instructorMembership);
        CourseInstructor::query()->create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'tenant_user_id' => $instructorMembership->id,
            'role' => 'primary',
        ]);
        $secondInstructor = $this->instructorMembership($tenant);
        $secondInstructorToken = $secondInstructor->user->createToken(
            'instructor_access_token',
            ['instructor:access', 'instructor:tenant:'.$tenant->id],
        )->plainTextToken;
        $unrelatedCourse = $this->course($tenant, $secondInstructor, $instructorMembership);
        CourseInstructor::query()->create([
            'tenant_id' => $tenant->id,
            'course_id' => $unrelatedCourse->id,
            'tenant_user_id' => $instructorMembership->id,
            'role' => 'primary',
        ]);

        Sanctum::actingAs($admin);
        $this->putJson('/api/v1/courses/'.$course->id.'/instructor', [
            'tenant_user_id' => $secondInstructor->id,
        ], ['X-Tenant-ID' => (string) $tenant->id])->assertOk();

        $this->assertTrue($course->fresh()->instructor_assignment_managed);
        $this->assertDatabaseMissing('course_instructors', [
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'tenant_user_id' => $instructorMembership->id,
            'role' => 'primary',
        ]);
        $this->assertDatabaseHas('course_instructors', [
            'tenant_id' => $tenant->id,
            'course_id' => $unrelatedCourse->id,
            'tenant_user_id' => $instructorMembership->id,
            'role' => 'primary',
        ]);

        $this->app['auth']->forgetGuards();
        $this->withHeaders($headers)
            ->putJson('/api/v1/instructor/courses/'.$course->id, ['title' => 'Old assignee denied'])
            ->assertForbidden();

        $reassignedCourse = Course::query()->create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $adminMembership->id,
            'primary_instructor_tenant_user_id' => $instructorMembership->id,
            'title' => 'Course assigned after reassignment',
            'slug' => 'course-assigned-after-reassignment',
            'status' => 'draft',
        ]);
        $module = \App\Models\CourseModule::query()->create([
            'tenant_id' => $tenant->id,
            'course_id' => $reassignedCourse->id,
            'title' => 'Reassigned module',
            'slug' => 'reassigned-module',
            'order' => 0,
        ]);

        $this->withHeaders($headers)
            ->putJson('/api/v1/instructor/courses/'.$reassignedCourse->id, ['title' => 'New assignment'])
            ->assertOk();
        $this->withHeaders($headers)
            ->putJson('/api/v1/instructor/courses/'.$reassignedCourse->id.'/modules/'.$module->id, [
                'title' => 'Updated by reassigned Instructor',
            ])
            ->assertOk();

        $secondHeaders = [
            'X-Tenant-ID' => (string) $tenant->id,
            'Authorization' => 'Bearer '.$secondInstructorToken,
        ];
        $this->app['auth']->forgetGuards();
        $this->withHeaders($secondHeaders)
            ->putJson('/api/v1/instructor/courses/'.$course->id, ['title' => 'Updated by new primary'])
            ->assertOk();

        Sanctum::actingAs($admin);
        $this->putJson('/api/v1/courses/'.$course->id.'/instructor', [
            'tenant_user_id' => null,
        ], ['X-Tenant-ID' => (string) $tenant->id])->assertOk();
        $this->assertTrue($course->fresh()->instructor_assignment_managed);

        $this->app['auth']->forgetGuards();
        $this->withHeaders($headers)
            ->putJson('/api/v1/instructor/courses/'.$course->id, ['title' => 'Unassigned edit denied'])
            ->assertForbidden();
        $this->withHeaders($secondHeaders)
            ->putJson('/api/v1/instructor/courses/'.$course->id, ['title' => 'Unassigned edit denied'])
            ->assertForbidden();

        $this->assertSame($adminMembership->id, $course->fresh()->created_by_tenant_user_id);
        $this->assertNull($course->fresh()->primary_instructor_tenant_user_id);

        Sanctum::actingAs($admin);
        $this->deleteJson('/api/v1/courses/'.$course->id, [
            'X-Tenant-ID' => (string) $tenant->id,
        ])->assertOk();
        $this->assertSoftDeleted('courses', ['id' => $course->id]);
    }

    public function test_primary_pivot_assignment_uses_the_primary_field_and_cannot_diverge(): void
    {
        [$tenant, , $former, , $formerToken, $admin] = $this->courseFixture();
        $current = $this->instructorMembership($tenant);
        $currentToken = $current->user->createToken(
            'instructor_access_token',
            ['instructor:access', 'instructor:tenant:'.$tenant->id],
        )->plainTextToken;
        $course = $this->course($tenant, $former, $former);
        $adminHeaders = ['X-Tenant-ID' => (string) $tenant->id];

        Sanctum::actingAs($admin);
        $this->postJson('/api/v1/courses/'.$course->id.'/instructors', [
            'tenant_user_id' => $current->id,
            'role' => 'primary',
        ], $adminHeaders)->assertCreated();

        $this->assertSame($current->id, $course->fresh()->primary_instructor_tenant_user_id);
        $this->assertTrue($course->fresh()->instructor_assignment_managed);
        $this->assertDatabaseHas('course_instructors', [
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'tenant_user_id' => $current->id,
            'role' => 'primary',
        ]);

        $this->postJson('/api/v1/courses/'.$course->id.'/instructors', [
            'tenant_user_id' => $former->id,
            'role' => 'co_instructor',
        ], $adminHeaders)->assertCreated();

        $this->postJson('/api/v1/courses/'.$course->id.'/instructors', [
            'tenant_user_id' => $current->id,
            'role' => 'co_instructor',
        ], $adminHeaders)->assertUnprocessable();
        $currentPivot = CourseInstructor::query()
            ->where('tenant_id', $tenant->id)
            ->where('course_id', $course->id)
            ->where('tenant_user_id', $current->id)
            ->firstOrFail();
        $this->deleteJson(
            '/api/v1/courses/'.$course->id.'/instructors/'.$currentPivot->id,
            [],
            $adminHeaders,
        )->assertUnprocessable();
        $this->assertSame($current->id, $course->fresh()->primary_instructor_tenant_user_id);

        $this->app['auth']->forgetGuards();
        $formerHeaders = [
            'X-Tenant-ID' => (string) $tenant->id,
            'Authorization' => 'Bearer '.$formerToken,
        ];
        $currentHeaders = [
            'X-Tenant-ID' => (string) $tenant->id,
            'Authorization' => 'Bearer '.$currentToken,
        ];
        $this->withHeaders($formerHeaders)
            ->putJson('/api/v1/instructor/courses/'.$course->id, ['title' => 'Former creator denied'])
            ->assertForbidden();
        $this->app['auth']->forgetGuards();
        $this->withHeaders($currentHeaders)
            ->putJson('/api/v1/instructor/courses/'.$course->id, ['title' => 'Current primary allowed'])
            ->assertOk();

        $this->app['auth']->forgetGuards();
        Sanctum::actingAs($admin);
        $this->putJson('/api/v1/courses/'.$course->id.'/instructor', [
            'tenant_user_id' => null,
        ], $adminHeaders)->assertOk();
        $this->assertNull($course->fresh()->primary_instructor_tenant_user_id);
        $this->assertTrue($course->fresh()->instructor_assignment_managed);

        $this->app['auth']->forgetGuards();
        $this->withHeaders($currentHeaders)
            ->putJson('/api/v1/instructor/courses/'.$course->id, ['title' => 'Unassigned edit denied'])
            ->assertForbidden();
        Sanctum::actingAs($admin);
        $this->putJson('/api/v1/courses/'.$course->id, ['title' => 'Tenant Admin remains authorized'], $adminHeaders)
            ->assertOk();
    }

    public function test_unassigned_creator_and_legacy_pivot_cannot_edit_or_grade_assignments(): void
    {
        [$tenant, $adminMembership, $instructorMembership, , $instructorToken, $admin] = $this->courseFixture();
        $course = $this->course($tenant, $instructorMembership, $instructorMembership);
        CourseInstructor::query()->create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'tenant_user_id' => $instructorMembership->id,
            'role' => 'co_instructor',
        ]);
        $currentInstructor = $this->instructorMembership($tenant);
        $currentInstructorToken = $currentInstructor->user->createToken(
            'instructor_access_token',
            ['instructor:access', 'instructor:tenant:'.$tenant->id],
        )->plainTextToken;
        $module = \App\Models\CourseModule::query()->create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'title' => 'Restricted module',
            'slug' => 'restricted-module',
            'order' => 0,
        ]);
        $section = CourseSection::query()->create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'title' => 'Previously Assigned Section',
            'slug' => 'previously-assigned-section',
            'sort_order' => 0,
        ]);
        $lesson = CourseLesson::query()->create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'title' => 'Assignment Lesson',
            'slug' => 'assignment-lesson',
            'type' => 'text',
            'lesson_type' => 'assignment',
            'status' => 'published',
            'visibility' => 'private',
            'sort_order' => 0,
        ]);
        $assignment = Assignment::query()->create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'course_lesson_id' => $lesson->id,
            'title' => 'Existing Assignment',
            'max_score' => 10,
            'status' => 'published',
        ]);
        $studentMembership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => User::factory()->create()->id,
            'status' => 'active',
        ]);
        $submission = AssignmentSubmission::query()->create([
            'tenant_id' => $tenant->id,
            'assignment_id' => $assignment->id,
            'tenant_user_id' => $studentMembership->id,
            'status' => 'submitted',
        ]);
        $headers = [
            'X-Tenant-ID' => (string) $tenant->id,
            'Authorization' => 'Bearer '.$instructorToken,
        ];

        Sanctum::actingAs($admin);
        $adminHeaders = ['X-Tenant-ID' => (string) $tenant->id];
        $this->putJson("/api/v1/courses/{$course->id}/instructor", [
            'tenant_user_id' => $currentInstructor->id,
        ], $adminHeaders)->assertOk();
        $this->assertDatabaseHas('course_instructors', [
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'tenant_user_id' => $instructorMembership->id,
            'role' => 'co_instructor',
        ]);

        $currentHeaders = [
            'X-Tenant-ID' => (string) $tenant->id,
            'Authorization' => 'Bearer '.$currentInstructorToken,
        ];
        $this->app['auth']->forgetGuards();
        $this->withHeaders($currentHeaders)
            ->putJson("/api/v1/instructor/courses/{$course->id}", ['title' => 'Current primary edit'])
            ->assertOk();
        $this->withHeaders($currentHeaders)
            ->putJson("/api/v1/instructor/courses/{$course->id}/modules/{$module->id}", [
                'title' => 'Current primary module edit',
            ])
            ->assertOk();
        $this->withHeaders($currentHeaders)
            ->putJson("/api/v1/instructor/courses/{$course->id}/sections/{$section->id}/lessons/{$lesson->id}/assignment", [
                'title' => 'Current primary assignment edit',
            ])
            ->assertOk();
        $this->withHeaders($currentHeaders)
            ->putJson("/api/v1/instructor/assignments/{$assignment->id}/submissions/{$submission->id}/grade", [
                'score' => 8,
            ])
            ->assertOk();

        $this->app['auth']->forgetGuards();
        $this->withHeaders($headers)
            ->putJson("/api/v1/instructor/courses/{$course->id}", [
                'title' => 'Unauthorized edit',
            ])
            ->assertForbidden();

        $this->withHeaders($headers)
            ->putJson("/api/v1/instructor/courses/{$course->id}/modules/{$module->id}", [
                'title' => 'Unauthorized nested edit',
            ])
            ->assertForbidden();

        $this->withHeaders($headers)
            ->putJson("/api/v1/instructor/courses/{$course->id}/sections/{$section->id}/lessons/{$lesson->id}/assignment", [
                'title' => 'Unauthorized edit',
            ])
            ->assertForbidden();

        $this->withHeaders($headers)
            ->putJson("/api/v1/courses/{$course->id}/sections/{$section->id}/lessons/{$lesson->id}/assignment", [
                'title' => 'Unauthorized edit',
            ])
            ->assertForbidden();

        $this->withHeaders($headers)
            ->putJson("/api/v1/instructor/assignments/{$assignment->id}/submissions/{$submission->id}/grade", [
                'score' => 8,
            ])
            ->assertForbidden();

        $this->withHeaders($headers)
            ->getJson("/api/v1/lessons/{$lesson->id}/access")
            ->assertForbidden();

        $this->withHeaders($headers)
            ->getJson('/api/v1/media-library/assets')
            ->assertForbidden();

        $this->withHeaders($headers)
            ->getJson('/api/v1/exam-bank/banks')
            ->assertForbidden();

        Sanctum::actingAs($admin);
        $this->putJson("/api/v1/courses/{$course->id}/instructor", [
            'tenant_user_id' => null,
        ], $adminHeaders)->assertOk();
        $this->assertNull($course->fresh()->primary_instructor_tenant_user_id);

        $this->app['auth']->forgetGuards();
        foreach ([$headers, $currentHeaders] as $instructorHeaders) {
            $this->withHeaders($instructorHeaders)
                ->putJson("/api/v1/instructor/courses/{$course->id}", ['title' => 'Unassigned edit'])
                ->assertForbidden();
            $this->withHeaders($instructorHeaders)
                ->putJson("/api/v1/instructor/courses/{$course->id}/modules/{$module->id}", [
                    'title' => 'Unassigned module edit',
                ])
                ->assertForbidden();
            $this->withHeaders($instructorHeaders)
                ->putJson("/api/v1/instructor/courses/{$course->id}/sections/{$section->id}/lessons/{$lesson->id}/assignment", [
                    'title' => 'Unassigned assignment edit',
                ])
                ->assertForbidden();
            $this->withHeaders($instructorHeaders)
                ->putJson("/api/v1/instructor/assignments/{$assignment->id}/submissions/{$submission->id}/grade", [
                    'score' => 8,
                ])
                ->assertForbidden();
        }

        Sanctum::actingAs($admin);
        $this->putJson("/api/v1/courses/{$course->id}", ['title' => 'Admin still manages course'], $adminHeaders)
            ->assertOk();

        $this->assertSame($instructorMembership->id, $course->fresh()->created_by_tenant_user_id);
        $this->assertNull($course->fresh()->primary_instructor_tenant_user_id);
        $this->assertSame(1, $course->instructors()->where('tenant_user_id', $instructorMembership->id)->count());
    }

    public function test_feature_disabled_explicit_reassignment_revokes_legacy_instructor_access(): void
    {
        $tenant = Tenant::factory()->create(['feature_flags' => ['has_instructors' => false]]);
        $admin = User::factory()->create();
        $adminMembership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $admin->id,
            'status' => 'active',
        ]);
        $adminRole = Role::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Tenant Owner',
            'slug' => 'tenant_owner',
        ]);
        $this->grant($adminRole, ['courses.update', 'courses.assign_instructors', 'modules.update']);
        $adminMembership->roles()->attach($adminRole, ['tenant_id' => $tenant->id]);

        $former = $this->legacyInstructorMembership($tenant);
        $current = $this->legacyInstructorMembership($tenant);
        $course = $this->course($tenant, $former, $former);
        CourseInstructor::query()->create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'tenant_user_id' => $former->id,
            'role' => 'co_instructor',
        ]);
        $module = \App\Models\CourseModule::query()->create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'title' => 'Legacy Instructor module',
            'slug' => 'legacy-instructor-module',
            'order' => 0,
        ]);
        $section = CourseSection::query()->create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'title' => 'Legacy Instructor section',
            'slug' => 'legacy-instructor-section',
            'sort_order' => 0,
        ]);
        $lesson = CourseLesson::query()->create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'title' => 'Legacy assignment lesson',
            'slug' => 'legacy-assignment-lesson-disabled',
            'type' => 'text',
            'lesson_type' => 'assignment',
            'status' => 'published',
            'visibility' => 'private',
            'sort_order' => 0,
        ]);
        $assignment = Assignment::query()->create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'course_lesson_id' => $lesson->id,
            'title' => 'Legacy assignment',
            'max_score' => 10,
            'status' => 'published',
        ]);
        $studentMembership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => User::factory()->create()->id,
            'status' => 'active',
        ]);
        $submission = AssignmentSubmission::query()->create([
            'tenant_id' => $tenant->id,
            'assignment_id' => $assignment->id,
            'tenant_user_id' => $studentMembership->id,
            'status' => 'submitted',
        ]);
        $formerHeaders = ['X-Tenant-ID' => (string) $tenant->id];
        $currentHeaders = ['X-Tenant-ID' => (string) $tenant->id];

        Sanctum::actingAs($admin);
        $this->putJson("/api/v1/courses/{$course->id}/instructor", [
            'tenant_user_id' => $current->id,
        ], $formerHeaders)->assertOk();
        $this->assertTrue($course->fresh()->instructor_assignment_managed);
        $this->assertDatabaseHas('course_instructors', [
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'tenant_user_id' => $former->id,
            'role' => 'co_instructor',
        ]);

        $this->app['auth']->forgetGuards();
        Sanctum::actingAs($former->user, ['access:api']);
        $this->putJson("/api/v1/courses/{$course->id}", ['title' => 'Former creator denied'], $formerHeaders)
            ->assertForbidden();
        $this->putJson("/api/v1/courses/{$course->id}/modules/{$module->id}", [
            'title' => 'Former instructor denied',
        ], $formerHeaders)->assertForbidden();
        $this->putJson("/api/v1/courses/{$course->id}/sections/{$section->id}/lessons/{$lesson->id}/assignment", [
            'title' => 'Former instructor denied',
        ], $formerHeaders)->assertForbidden();
        $this->postJson("/api/v1/assignments/{$assignment->id}/submissions/{$submission->id}/grade", [
            'score' => 8,
        ], $formerHeaders)->assertForbidden();

        $this->app['auth']->forgetGuards();
        Sanctum::actingAs($current->user, ['access:api']);
        $this->putJson("/api/v1/courses/{$course->id}", ['title' => 'Current primary access'], $currentHeaders)
            ->assertOk();
        $this->putJson("/api/v1/courses/{$course->id}/modules/{$module->id}", [
            'title' => 'Current primary module access',
        ], $currentHeaders)->assertOk();
        $this->putJson("/api/v1/courses/{$course->id}/sections/{$section->id}/lessons/{$lesson->id}/assignment", [
            'title' => 'Current primary assignment access',
        ], $currentHeaders)->assertOk();
        $this->postJson("/api/v1/assignments/{$assignment->id}/submissions/{$submission->id}/grade", [
            'score' => 8,
        ], $currentHeaders)->assertOk();

        $this->app['auth']->forgetGuards();
        Sanctum::actingAs($admin);
        $this->putJson("/api/v1/courses/{$course->id}/instructor", ['tenant_user_id' => null], $formerHeaders)
            ->assertOk();
        $this->putJson("/api/v1/courses/{$course->id}", ['title' => 'Admin course access'], $formerHeaders)
            ->assertOk();

        $this->app['auth']->forgetGuards();
        Sanctum::actingAs($former->user, ['access:api']);
        $this->putJson("/api/v1/courses/{$course->id}", ['title' => 'Unassigned former denied'], $formerHeaders)
            ->assertForbidden();
        $this->putJson("/api/v1/courses/{$course->id}/modules/{$module->id}", [
            'title' => 'Unassigned former denied',
        ], $formerHeaders)->assertForbidden();
        $this->putJson("/api/v1/courses/{$course->id}/sections/{$section->id}/lessons/{$lesson->id}/assignment", [
            'title' => 'Unassigned former denied',
        ], $formerHeaders)->assertForbidden();
        $this->postJson("/api/v1/assignments/{$assignment->id}/submissions/{$submission->id}/grade", [
            'score' => 8,
        ], $formerHeaders)->assertForbidden();

        $this->app['auth']->forgetGuards();
        Sanctum::actingAs($current->user, ['access:api']);
        $this->putJson("/api/v1/courses/{$course->id}", ['title' => 'Unassigned current denied'], $currentHeaders)
            ->assertForbidden();
        $this->putJson("/api/v1/courses/{$course->id}/modules/{$module->id}", [
            'title' => 'Unassigned current denied',
        ], $currentHeaders)->assertForbidden();
        $this->putJson("/api/v1/courses/{$course->id}/sections/{$section->id}/lessons/{$lesson->id}/assignment", [
            'title' => 'Unassigned current denied',
        ], $currentHeaders)->assertForbidden();
        $this->postJson("/api/v1/assignments/{$assignment->id}/submissions/{$submission->id}/grade", [
            'score' => 8,
        ], $currentHeaders)->assertForbidden();
    }

    public function test_feature_disabled_course_authorization_preserves_creator_access_but_never_grants_instructor_course_deletion(): void
    {
        $tenant = Tenant::factory()->create(['feature_flags' => ['has_instructors' => false]]);
        $user = User::factory()->create();
        $membership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
        ]);
        $role = Role::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Legacy Instructor',
            'slug' => 'instructor',
        ]);
        $this->grant($role, ['courses.update', 'courses.delete']);
        $membership->roles()->attach($role, ['tenant_id' => $tenant->id]);
        $course = $this->course($tenant, $membership, null);
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
        Sanctum::actingAs($user, ['access:api']);

        $policy = app(\App\Policies\CoursePolicy::class);
        $this->assertTrue($policy->update($user, $course));
        $this->assertFalse($policy->delete($user, $course));
        $this->assertFalse(app(InstructorFeature::class)->isEnabled($tenant));
    }

    public function test_feature_disabled_legacy_instructor_creator_routes_remain_unchanged(): void
    {
        $tenant = Tenant::factory()->create(['feature_flags' => ['has_instructors' => false]]);
        $user = User::factory()->create();
        $membership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
        ]);
        $role = Role::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Legacy Instructor',
            'slug' => 'instructor',
        ]);
        $this->grant($role, ['courses.update', 'modules.update']);
        $membership->roles()->attach($role, ['tenant_id' => $tenant->id]);
        $course = $this->course($tenant, $membership, null);
        $module = \App\Models\CourseModule::query()->create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'title' => 'Legacy module',
            'slug' => 'legacy-module',
            'order' => 0,
        ]);
        $section = CourseSection::query()->create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'title' => 'Legacy section',
            'slug' => 'legacy-section',
            'sort_order' => 0,
        ]);
        $lesson = CourseLesson::query()->create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'title' => 'Legacy assignment lesson',
            'slug' => 'legacy-assignment-lesson',
            'type' => 'text',
            'lesson_type' => 'assignment',
            'status' => 'published',
            'visibility' => 'private',
            'sort_order' => 0,
        ]);
        $assignment = Assignment::query()->create([
            'tenant_id' => $tenant->id,
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'course_lesson_id' => $lesson->id,
            'title' => 'Legacy assignment',
            'max_score' => 10,
            'status' => 'published',
        ]);
        $studentMembership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => User::factory()->create()->id,
            'status' => 'active',
        ]);
        $submission = AssignmentSubmission::query()->create([
            'tenant_id' => $tenant->id,
            'assignment_id' => $assignment->id,
            'tenant_user_id' => $studentMembership->id,
            'status' => 'submitted',
        ]);
        Sanctum::actingAs($user, ['access:api']);
        $headers = ['X-Tenant-ID' => (string) $tenant->id];

        $this->withHeaders($headers)
            ->putJson('/api/v1/courses/'.$course->id, ['title' => 'Legacy course edit'])
            ->assertOk();
        $this->withHeaders($headers)
            ->putJson('/api/v1/courses/'.$course->id.'/modules/'.$module->id, ['title' => 'Legacy nested edit'])
            ->assertOk();
        $this->withHeaders($headers)
            ->putJson("/api/v1/courses/{$course->id}/sections/{$section->id}/lessons/{$lesson->id}/assignment", [
                'title' => 'Legacy assignment edit',
            ])
            ->assertOk();
        $this->withHeaders($headers)
            ->postJson("/api/v1/assignments/{$assignment->id}/submissions/{$submission->id}/grade", [
                'score' => 8,
            ])
            ->assertOk();
    }

    public function test_course_content_routes_require_current_assignment_and_validate_nested_hierarchy(): void
    {
        [$tenant, $adminMembership, $instructorMembership, $instructor, $instructorToken, $admin] = $this->courseFixture();
        $this->grant($instructorMembership->roles()->first(), [
            'modules.view', 'modules.create', 'modules.update', 'modules.reorder',
            'sections.view', 'sections.create', 'sections.update', 'sections.reorder',
            'lessons.view', 'lessons.create', 'lessons.update', 'lessons.reorder',
        ]);
        $headers = [
            'X-Tenant-ID' => (string) $tenant->id,
            'Authorization' => 'Bearer '.$instructorToken,
        ];
        $assignedCourse = $this->course($tenant, $adminMembership, $instructorMembership);
        $otherCourse = $this->course($tenant, $adminMembership, null);
        $foreignSection = CourseSection::query()->create([
            'tenant_id' => $tenant->id,
            'course_id' => $otherCourse->id,
            'title' => 'Foreign section',
            'slug' => 'foreign-section',
            'sort_order' => 0,
        ]);
        $assignedSection = CourseSection::query()->create([
            'tenant_id' => $tenant->id,
            'course_id' => $assignedCourse->id,
            'title' => 'Assigned section',
            'slug' => 'assigned-section',
            'sort_order' => 0,
        ]);
        $foreignModule = \App\Models\CourseModule::query()->create([
            'tenant_id' => $tenant->id,
            'course_id' => $otherCourse->id,
            'title' => 'Foreign module',
            'slug' => 'foreign-module',
            'order' => 0,
        ]);

        $moduleId = $this->withHeaders($headers)
            ->postJson('/api/v1/instructor/courses/'.$assignedCourse->id.'/modules', [
                'title' => 'Assigned module',
            ])
            ->assertCreated()
            ->json('data.id');

        $this->withHeaders($headers)
            ->postJson('/api/v1/instructor/courses/'.$otherCourse->id.'/modules', [
                'title' => 'Unassigned module',
            ])
            ->assertForbidden();

        $this->withHeaders($headers)
            ->postJson('/api/v1/instructor/courses/'.$assignedCourse->id.'/sections', [
                'title' => 'Invalid module section',
                'course_module_id' => $foreignModule->id,
            ])
            ->assertUnprocessable();

        $this->withHeaders($headers)
            ->postJson('/api/v1/instructor/courses/'.$assignedCourse->id.'/sections/'.$assignedSection->id.'/move', [
                'course_module_id' => $foreignModule->id,
            ])
            ->assertUnprocessable();

        $this->withHeaders($headers)
            ->postJson('/api/v1/instructor/courses/'.$assignedCourse->id.'/sections/'.$foreignSection->id.'/lessons', [
                'title' => 'Cross-course lesson',
                'lesson_type' => 'text',
            ])
            ->assertNotFound();

        $this->withHeaders($headers)
            ->postJson('/api/v1/instructor/courses/'.$assignedCourse->id.'/sections/'.$assignedSection->id.'/lessons', [
                'title' => 'Shared exam lesson',
                'lesson_type' => 'exam',
            ])
            ->assertUnprocessable();

        $this->withHeaders($headers)
            ->postJson('/api/v1/instructor/courses/'.$assignedCourse->id.'/sections/'.$assignedSection->id.'/lessons', [
                'title' => 'Linked exam lesson',
                'lesson_type' => 'text',
                'exam_id' => 999,
            ])
            ->assertUnprocessable();

        $this->withHeaders($headers)
            ->postJson('/api/v1/instructor/courses/'.$assignedCourse->id.'/sections/'.$assignedSection->id.'/lock')
            ->assertNotFound();

        $this->withHeaders($headers)
            ->postJson('/api/v1/instructor/courses/'.$assignedCourse->id.'/sections/'.$assignedSection->id.'/lessons/1/free-preview')
            ->assertNotFound();

        $this->withHeaders($headers)
            ->putJson('/api/v1/instructor/courses/'.$assignedCourse->id.'/modules/'.$moduleId, [
                'title' => 'Updated assigned module',
            ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Updated assigned module');

        $this->withHeaders($headers)
            ->deleteJson('/api/v1/instructor/courses/'.$assignedCourse->id.'/modules/'.$moduleId)
            ->assertOk();
        $this->assertSoftDeleted('course_modules', ['id' => $moduleId]);

        Sanctum::actingAs($admin);
        $this->putJson('/api/v1/courses/'.$assignedCourse->id.'/instructor', [
            'tenant_user_id' => null,
        ], ['X-Tenant-ID' => (string) $tenant->id])->assertOk();

        $this->app['auth']->forgetGuards();
        $this->withHeaders($headers)
            ->getJson('/api/v1/instructor/courses/'.$assignedCourse->id.'/modules')
            ->assertForbidden();
    }

    /**
     * @return array{Tenant, TenantUser, TenantUser, User, string, User}
     */
    private function courseFixture(): array
    {
        $tenant = Tenant::factory()->create([
            'feature_flags' => ['has_instructors' => true],
        ]);
        $admin = User::factory()->create();
        $adminMembership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $admin->id,
        ]);
        $adminRole = Role::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Tenant Owner',
            'slug' => 'tenant_owner',
        ]);
        $this->grant($adminRole, [
            'courses.view',
            'courses.create',
            'courses.update',
            'courses.publish',
            'courses.delete',
            'courses.assign_instructors',
        ]);
        $adminMembership->roles()->attach($adminRole, ['tenant_id' => $tenant->id]);

        $instructorMembership = $this->instructorMembership($tenant);
        $instructor = $instructorMembership->user;
        $token = $instructor->createToken(
            'instructor_access_token',
            ['instructor:access', 'instructor:tenant:'.$tenant->id],
        );

        return [$tenant, $adminMembership, $instructorMembership, $instructor, $token->plainTextToken, $admin];
    }

    private function instructorMembership(Tenant $tenant): TenantUser
    {
        $user = User::factory()->create();
        $membership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'is_instructor' => true,
            'must_change_password' => false,
        ]);
        $role = Role::query()->firstOrCreate(
            ['tenant_id' => $tenant->id, 'slug' => 'instructor'],
            ['name' => 'Instructor'],
        );
        $this->grant($role, [
            'courses.view', 'courses.create', 'courses.update',
            'modules.view', 'modules.create', 'modules.update', 'modules.reorder',
            'sections.view', 'sections.create', 'sections.update', 'sections.reorder',
            'lessons.view', 'lessons.create', 'lessons.update', 'lessons.reorder',
        ]);
        $membership->roles()->attach($role, ['tenant_id' => $tenant->id]);

        return $membership;
    }

    private function legacyInstructorMembership(Tenant $tenant): TenantUser
    {
        $user = User::factory()->create();
        $membership = TenantUser::factory()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'status' => 'active',
            'is_instructor' => false,
        ]);
        $role = Role::query()->firstOrCreate(
            ['tenant_id' => $tenant->id, 'slug' => 'instructor'],
            ['name' => 'Legacy Instructor'],
        );
        $this->grant($role, [
            'courses.view',
            'courses.create',
            'courses.update',
            'modules.view',
            'modules.update',
            'sections.update',
            'lessons.update',
        ]);
        $membership->roles()->attach($role, ['tenant_id' => $tenant->id]);

        return $membership;
    }

    private function course(Tenant $tenant, TenantUser $creator, ?TenantUser $primary): Course
    {
        return Course::query()->create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $creator->id,
            'primary_instructor_tenant_user_id' => $primary?->id,
            'title' => 'Course '.$tenant->id.'-'.$creator->id.'-'.($primary?->id ?? 'none'),
            'slug' => 'course-'.$tenant->id.'-'.$creator->id.'-'.($primary?->id ?? 'none'),
            'status' => 'draft',
        ]);
    }

    /**
     * @param  list<string>  $slugs
     */
    private function grant(Role $role, array $slugs): void
    {
        $permissions = collect($slugs)->map(fn (string $slug) => Permission::query()->firstOrCreate(
            ['slug' => $slug],
            ['name' => str_replace('.', ' ', $slug)],
        ));
        $role->permissions()->syncWithoutDetaching($permissions->pluck('id')->all());
    }
}
