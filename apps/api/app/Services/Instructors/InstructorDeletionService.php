<?php

namespace App\Services\Instructors;

use App\Models\Course;
use App\Models\CourseInstructor;
use App\Models\Exam;
use App\Models\MediaAsset;
use App\Models\MediaUploadSession;
use App\Models\Question;
use App\Models\QuestionBank;
use App\Models\QuestionCategory;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Security\AuditLogger;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InstructorDeletionService
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function remove(
        Tenant $tenant,
        TenantUser $actor,
        int $instructorId,
        string $strategy,
        ?int $targetInstructorId = null,
    ): void {
        DB::transaction(function () use ($tenant, $actor, $instructorId, $strategy, $targetInstructorId): void {
            $instructor = TenantUser::query()
                ->where('tenant_id', $tenant->id)
                ->where('is_instructor', true)
                ->whereKey($instructorId)
                ->lockForUpdate()
                ->firstOrFail();

            if ($strategy === 'transfer_to_instructor') {
                $target = TenantUser::query()
                    ->where('tenant_id', $tenant->id)
                    ->where('is_instructor', true)
                    ->where('status', 'active')
                    ->whereKey($targetInstructorId)
                    ->whereKeyNot($instructor->id)
                    ->lockForUpdate()
                    ->first();

                if (! $target) {
                    throw ValidationException::withMessages([
                        'target_instructor_id' => ['اختر مدرباً نشطاً آخر تابعاً لهذا المستأجر.'],
                    ]);
                }
            } elseif ($strategy === 'transfer_to_tenant') {
                if ($actor->tenant_id !== $tenant->id || $actor->is_instructor || $actor->trashed()) {
                    throw ValidationException::withMessages([
                        'strategy' => ['يجب تنفيذ نقل المحتوى إلى حساب إدارة المستأجر.'],
                    ]);
                }
                $target = $actor;
            } else {
                $target = null;
            }

            if ($strategy === 'delete_content') {
                $this->removeInstructorContent($tenant, $instructor, $actor);
            } else {
                $this->transferInstructorContent($tenant, $instructor, $target, $strategy === 'transfer_to_tenant');
            }

            $user = $instructor->user()->first();
            $instructor->roles()->detach();
            $instructor->forceFill([
                'is_instructor' => false,
                'status' => 'suspended',
                'must_change_password' => false,
            ])->save();
            $instructor->delete();
            $user?->tokens()->delete();

            $this->audit->record('instructor_deleted', [
                'tenant_id' => $tenant->id,
                'tenant_user_id' => $instructor->id,
                'strategy' => $strategy,
                'target_tenant_user_id' => $target?->id,
            ]);
        });
    }

    private function transferInstructorContent(
        Tenant $tenant,
        TenantUser $instructor,
        TenantUser $target,
        bool $preserveAttribution,
    ): void {
        $courses = Course::withTrashed()
            ->where('tenant_id', $tenant->id)
            ->where(function ($query) use ($instructor): void {
                $query->where('created_by_tenant_user_id', $instructor->id)
                    ->orWhere('primary_instructor_tenant_user_id', $instructor->id)
                    ->orWhereHas('instructors', fn ($assignments) => $assignments->where('tenant_user_id', $instructor->id));
            })
            ->lockForUpdate()
            ->get();

        foreach ($courses as $course) {
            $assignment = CourseInstructor::query()
                ->where('tenant_id', $tenant->id)
                ->where('course_id', $course->id)
                ->where('tenant_user_id', $instructor->id)
                ->first();

            if ($preserveAttribution) {
                $attributions = collect($course->instructor_attribution ?? []);
                $attributions->push([
                    'id' => (string) $instructor->id,
                    'name' => $instructor->user?->name ?? '',
                    'avatar' => $instructor->avatar ?? $instructor->user?->avatar,
                    'role' => $assignment?->role ?? 'primary',
                ]);
                $course->instructor_attribution = $attributions
                    ->unique(fn (array $item) => $item['id'] ?? $item['name'])
                    ->values()
                    ->all();
            }

            if ($course->created_by_tenant_user_id === $instructor->id) {
                $course->created_by_tenant_user_id = $target->id;
            }
            if ($course->primary_instructor_tenant_user_id === $instructor->id) {
                $course->primary_instructor_tenant_user_id = $preserveAttribution ? null : $target->id;
            }
            $course->save();

            if ($assignment) {
                $existingTargetAssignment = CourseInstructor::query()
                    ->where('tenant_id', $tenant->id)
                    ->where('course_id', $course->id)
                    ->where('tenant_user_id', $target->id)
                    ->first();

                if ($existingTargetAssignment) {
                    $assignment->delete();
                } else {
                    $assignment->tenant_user_id = $target->id;
                    $assignment->save();
                }
            } elseif (! $preserveAttribution && $course->primary_instructor_tenant_user_id === $target->id) {
                CourseInstructor::query()->firstOrCreate(
                    ['tenant_id' => $tenant->id, 'course_id' => $course->id, 'tenant_user_id' => $target->id],
                    ['role' => 'primary', 'is_visible' => true, 'sort_order' => 0],
                );
            }
        }

        /** @var array<class-string<Model>> $models */
        $models = [Exam::class, Question::class, QuestionBank::class, QuestionCategory::class];
        foreach ($models as $model) {
            $model::query()
                ->where('tenant_id', $tenant->id)
                ->where('created_by_tenant_user_id', $instructor->id)
                ->update(['created_by_tenant_user_id' => $target->id]);
        }

        MediaAsset::query()
            ->where('tenant_id', $tenant->id)
            ->where('created_by_tenant_user_id', $instructor->id)
            ->update(['created_by_tenant_user_id' => $target->id]);
        MediaAsset::query()
            ->where('tenant_id', $tenant->id)
            ->where('uploader_id', $instructor->id)
            ->update(['uploader_id' => $target->id]);
        MediaUploadSession::query()
            ->where('tenant_id', $tenant->id)
            ->where('created_by_tenant_user_id', $instructor->id)
            ->update(['created_by_tenant_user_id' => $target->id]);
    }

    private function removeInstructorContent(Tenant $tenant, TenantUser $instructor, TenantUser $fallbackOwner): void
    {
        $courses = Course::withTrashed()
            ->where('tenant_id', $tenant->id)
            ->where(function ($query) use ($instructor): void {
                $query->where('created_by_tenant_user_id', $instructor->id)
                    ->orWhere('primary_instructor_tenant_user_id', $instructor->id)
                    ->orWhereHas('instructors', fn ($assignments) => $assignments->where('tenant_user_id', $instructor->id));
            })
            ->lockForUpdate()
            ->get();

        foreach ($courses as $course) {
            $otherAssignments = CourseInstructor::query()
                ->where('tenant_id', $tenant->id)
                ->where('course_id', $course->id)
                ->where('tenant_user_id', '!=', $instructor->id)
                ->orderBy('sort_order')
                ->get();

            if ($otherAssignments->isNotEmpty()) {
                if ($course->created_by_tenant_user_id === $instructor->id) {
                    $course->created_by_tenant_user_id = $otherAssignments->first()->tenant_user_id;
                }
                if ($course->primary_instructor_tenant_user_id === $instructor->id) {
                    $course->primary_instructor_tenant_user_id = $otherAssignments->first()->tenant_user_id;
                }
                $course->save();
                CourseInstructor::query()
                    ->where('tenant_id', $tenant->id)
                    ->where('course_id', $course->id)
                    ->where('tenant_user_id', $instructor->id)
                    ->delete();
            } else {
                $course->delete();
            }
        }

        /** @var array<class-string<Model>> $models */
        $models = [Exam::class, Question::class, QuestionBank::class, QuestionCategory::class];
        foreach ($models as $model) {
            $model::query()
                ->where('tenant_id', $tenant->id)
                ->where('created_by_tenant_user_id', $instructor->id)
                ->delete();
        }

        $assets = MediaAsset::query()
            ->where('tenant_id', $tenant->id)
            ->where(function ($query) use ($instructor): void {
                $query->where('created_by_tenant_user_id', $instructor->id)
                    ->orWhere('uploader_id', $instructor->id);
            })
            ->get();
        foreach ($assets as $asset) {
            $isInUse = $asset->usages()->exists()
                || $asset->lessonVideos()->exists()
                || $asset->lessonFiles()->exists()
                || $asset->assignmentSubmissionFiles()->exists();

            if ($isInUse) {
                $asset->created_by_tenant_user_id = $asset->created_by_tenant_user_id === $instructor->id
                    ? $fallbackOwner->id
                    : $asset->created_by_tenant_user_id;
                $asset->uploader_id = $asset->uploader_id === $instructor->id
                    ? $fallbackOwner->id
                    : $asset->uploader_id;
                $asset->save();
            } else {
                $asset->delete();
            }
        }

        MediaUploadSession::query()
            ->where('tenant_id', $tenant->id)
            ->where('created_by_tenant_user_id', $instructor->id)
            ->delete();
    }
}
