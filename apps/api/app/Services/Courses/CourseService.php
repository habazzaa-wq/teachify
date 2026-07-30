<?php

namespace App\Services\Courses;

use App\Models\Category;
use App\Models\Course;
use App\Models\CourseInstructor;
use App\Models\CourseSetting;
use App\Models\Tag;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CourseService
{
    /**
     * @param array<string, mixed> $data
     */
    public function create(Tenant $tenant, TenantUser $creator, array $data): Course
    {
        return DB::transaction(function () use ($tenant, $creator, $data): Course {
            $primaryInstructor = $this->membershipForTenant(
                $tenant,
                $data['primary_instructor_tenant_user_id'] ?? $creator->id,
                'primary_instructor_tenant_user_id',
            );

            $course = Course::create([
                'tenant_id' => $tenant->id,
                'created_by_tenant_user_id' => $creator->id,
                'primary_instructor_tenant_user_id' => $primaryInstructor->id,
                'title' => $data['title'],
                'slug' => $this->uniqueCourseSlug($data['slug'] ?? $data['title']),
                'subtitle' => $data['subtitle'] ?? null,
                'short_description' => $data['short_description'] ?? null,
                'description' => $data['description'] ?? null,
                'full_description' => $data['full_description'] ?? null,
                'thumbnail_path' => $data['thumbnail_path'] ?? null,
                'cover_image_path' => $data['cover_image_path'] ?? null,
                'status' => 'draft',
                'visibility' => $data['visibility'] ?? 'private',
                'difficulty' => $data['difficulty'] ?? 'beginner',
                'language' => $data['language'] ?? 'ar',
                'duration' => $data['duration'] ?? null,
                'pricing_type' => $data['pricing_type'] ?? 'free',
                'price_amount' => $data['price_amount'] ?? null,
                'price_currency' => $data['price_currency'] ?? null,
                'discount_price' => $data['discount_price'] ?? null,
                'educational_stage_id' => $data['educational_stage_id'] ?? null,
                'subject_id' => $data['subject_id'] ?? null,
                'enrollment_limit' => $data['enrollment_limit'] ?? null,
                'start_date' => $data['start_date'] ?? null,
                'end_date' => $data['end_date'] ?? null,
                'certificate_enabled' => $data['certificate_enabled'] ?? false,
                'featured' => $data['featured'] ?? false,
                'seo_title' => $data['seo_title'] ?? null,
                'seo_description' => $data['seo_description'] ?? null,
                'seo_keywords' => $data['seo_keywords'] ?? null,
                'requirements' => $data['requirements'] ?? null,
                'learning_outcomes' => $data['learning_outcomes'] ?? null,
                'target_audience' => $data['target_audience'] ?? null,
            ]);

            $this->upsertInstructor($course, $primaryInstructor, 'primary', true, 0);
            $this->syncTaxonomy($course, $data['category_ids'] ?? [], $data['tag_ids'] ?? []);
            $this->createDefaultSettings($course);

            return $course->refresh()->load(['primaryInstructor.user', 'instructors.membership.user', 'categories', 'tags', 'settings']);
        });
    }

    /**
     * @param array<string, mixed> $data
     */
    public function update(Tenant $tenant, Course $course, array $data): Course
    {
        return DB::transaction(function () use ($tenant, $course, $data): Course {
            if (array_key_exists('primary_instructor_tenant_user_id', $data)) {
                $primaryInstructor = $this->membershipForTenant(
                    $tenant,
                    $data['primary_instructor_tenant_user_id'],
                    'primary_instructor_tenant_user_id',
                );

                $data['primary_instructor_tenant_user_id'] = $primaryInstructor->id;
                $this->upsertInstructor($course, $primaryInstructor, 'primary', true, 0);
            }

            if (array_key_exists('slug', $data)) {
                $data['slug'] = $this->uniqueCourseSlug($data['slug'], $course);
            }

            $course->fill(collect($data)->only([
                'primary_instructor_tenant_user_id',
                'title',
                'slug',
                'subtitle',
                'short_description',
                'description',
                'full_description',
                'thumbnail_path',
                'cover_image_path',
                'visibility',
                'difficulty',
                'language',
                'duration',
                'pricing_type',
                'price_amount',
                'price_currency',
                'discount_price',
                'educational_stage_id',
                'subject_id',
                'enrollment_limit',
                'start_date',
                'end_date',
                'certificate_enabled',
                'featured',
                'seo_title',
                'seo_description',
                'seo_keywords',
                'requirements',
                'learning_outcomes',
                'target_audience',
            ])->all())->save();

            if (array_key_exists('category_ids', $data) || array_key_exists('tag_ids', $data)) {
                $this->syncTaxonomy(
                    $course,
                    $data['category_ids'] ?? $course->categories()->pluck('categories.id')->all(),
                    $data['tag_ids'] ?? $course->tags()->pluck('tags.id')->all(),
                );
            }

            return $course->refresh()->load(['primaryInstructor.user', 'instructors.membership.user', 'categories', 'tags', 'settings']);
        });
    }

    public function changeStatus(Course $course, string $status): Course
    {
        $allowed = [
            'draft' => ['review', 'published'],
            'review' => ['draft', 'published'],
            'published' => ['archived'],
            'archived' => ['draft', 'published'],
        ];

        if (! in_array($status, $allowed[$course->status] ?? [], true)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot transition course from {$course->status} to {$status}."],
            ]);
        }

        $updates = ['status' => $status];

        if ($status === 'published') {
            $updates['published_at'] = now();
            $updates['archived_at'] = null;
        }

        if ($status === 'archived') {
            $updates['archived_at'] = now();
        }

        if ($status === 'draft') {
            $updates['archived_at'] = null;
        }

        $course->forceFill($updates)->save();

        return $course->refresh();
    }

    public function publish(Course $course): Course
    {
        return $this->changeStatus($course, 'published');
    }

    public function archive(Course $course): Course
    {
        return $this->changeStatus($course, 'archived');
    }

    public function restore(Course $course): Course
    {
        return DB::transaction(function () use ($course): Course {
            $course->forceFill([
                'status' => 'draft',
                'archived_at' => null,
            ])->save();

            return $course->refresh();
        });
    }

    public function duplicate(Course $course, TenantUser $creator): Course
    {
        return DB::transaction(function () use ($course, $creator): Course {
            $data = [
                'title' => $course->title . ' (نسخة)',
                'slug' => $this->uniqueCourseSlug($course->slug . '-copy'),
                'subtitle' => $course->subtitle,
                'short_description' => $course->short_description,
                'description' => $course->description,
                'full_description' => $course->full_description,
                'difficulty' => $course->difficulty,
                'language' => $course->language,
                'duration' => $course->duration,
                'visibility' => 'private',
                'pricing_type' => $course->pricing_type,
                'price_amount' => $course->price_amount,
                'price_currency' => $course->price_currency,
                'discount_price' => $course->discount_price,
                'enrollment_limit' => $course->enrollment_limit,
                'educational_stage_id' => $course->educational_stage_id,
                'subject_id' => $course->subject_id,
                'start_date' => $course->start_date,
                'end_date' => $course->end_date,
                'certificate_enabled' => $course->certificate_enabled,
                'featured' => false,
                'seo_title' => $course->seo_title,
                'seo_description' => $course->seo_description,
                'seo_keywords' => $course->seo_keywords,
                'requirements' => $course->requirements,
                'learning_outcomes' => $course->learning_outcomes,
                'target_audience' => $course->target_audience,
                'primary_instructor_tenant_user_id' => $course->primary_instructor_tenant_user_id ?? $creator->id,
            ];

            $primaryInstructor = $this->membershipForTenant(
                currentTenant(),
                $data['primary_instructor_tenant_user_id'],
                'primary_instructor_tenant_user_id',
            );

            $newCourse = Course::create([
                'tenant_id' => $course->tenant_id,
                'created_by_tenant_user_id' => $creator->id,
                'primary_instructor_tenant_user_id' => $primaryInstructor->id,
                ...$data,
            ]);

            $this->upsertInstructor($newCourse, $primaryInstructor, 'primary', true, 0);

            $categoryIds = $course->categories()->pluck('categories.id')->all();
            $tagIds = $course->tags()->pluck('tags.id')->all();
            $this->syncTaxonomy($newCourse, $categoryIds, $tagIds);

            return $newCourse->refresh()->load(['primaryInstructor.user', 'instructors.membership.user', 'categories', 'tags', 'settings']);
        });
    }

    public function toggleFeatured(Course $course): Course
    {
        $course->forceFill(['featured' => ! $course->featured])->save();
        return $course->refresh();
    }

    /**
     * @param array<string, mixed> $data
     */
    public function attachInstructor(Tenant $tenant, Course $course, array $data): CourseInstructor
    {
        $membership = $this->membershipForTenant($tenant, $data['tenant_user_id'], 'tenant_user_id');

        return $this->upsertInstructor(
            $course,
            $membership,
            $data['role'] ?? 'co_instructor',
            $data['is_visible'] ?? true,
            $data['sort_order'] ?? 0,
        );
    }

    public function detachInstructor(Course $course, CourseInstructor $assignment): void
    {
        if ($assignment->course_id !== $course->id || $assignment->tenant_id !== $course->tenant_id) {
            throw ValidationException::withMessages([
                'instructor' => ['The instructor assignment is invalid for this course.'],
            ]);
        }

        if ($assignment->tenant_user_id === $course->primary_instructor_tenant_user_id) {
            throw ValidationException::withMessages([
                'instructor' => ['The primary instructor cannot be detached before changing the primary instructor.'],
            ]);
        }

        $assignment->delete();
    }

    /**
     * @param array<string, mixed> $values
     */
    public function updateSetting(Course $course, string $group, array $values): CourseSetting
    {
        if (! array_key_exists($group, $this->defaultSettings())) {
            throw ValidationException::withMessages([
                'group' => ['The course setting group is invalid.'],
            ]);
        }

        return CourseSetting::updateOrCreate(
            [
                'tenant_id' => $course->tenant_id,
                'course_id' => $course->id,
                'group' => $group,
            ],
            ['values' => $values],
        );
    }

    private function upsertInstructor(
        Course $course,
        TenantUser $membership,
        string $role,
        bool $isVisible,
        int $sortOrder,
    ): CourseInstructor {
        return CourseInstructor::updateOrCreate(
            [
                'tenant_id' => $course->tenant_id,
                'course_id' => $course->id,
                'tenant_user_id' => $membership->id,
            ],
            [
                'role' => $role,
                'is_visible' => $isVisible,
                'sort_order' => $sortOrder,
            ],
        );
    }

    /**
     * @param list<int> $categoryIds
     * @param list<int> $tagIds
     */
    private function syncTaxonomy(Course $course, array $categoryIds, array $tagIds): void
    {
        $categories = Category::query()->whereIn('id', array_unique($categoryIds))->pluck('id');
        $tags = Tag::query()->whereIn('id', array_unique($tagIds))->pluck('id');

        if ($categories->count() !== count(array_unique($categoryIds))) {
            throw ValidationException::withMessages([
                'category_ids' => ['One or more categories are invalid for this tenant.'],
            ]);
        }

        if ($tags->count() !== count(array_unique($tagIds))) {
            throw ValidationException::withMessages([
                'tag_ids' => ['One or more tags are invalid for this tenant.'],
            ]);
        }

        $course->categories()->sync($categories->mapWithKeys(fn (int $id) => [$id => ['tenant_id' => $course->tenant_id]])->all());
        $course->tags()->sync($tags->mapWithKeys(fn (int $id) => [$id => ['tenant_id' => $course->tenant_id]])->all());
    }

    private function createDefaultSettings(Course $course): void
    {
        foreach ($this->defaultSettings() as $group => $values) {
            CourseSetting::create([
                'tenant_id' => $course->tenant_id,
                'course_id' => $course->id,
                'group' => $group,
                'values' => $values,
            ]);
        }
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function defaultSettings(): array
    {
        return [
            'enrollment' => [
                'approval_required' => false,
                'self_enrollment_enabled' => true,
            ],
            'completion' => [
                'required_lesson_completion_percent' => 100,
            ],
            'ordering' => [
                'enforce_sequential_lessons' => false,
            ],
            'certificate' => [
                'enabled' => false,
                'issue_automatically' => false,
            ],
            'access' => [
                'allow_preview' => false,
            ],
            'notifications' => [
                'course_updates_enabled' => true,
            ],
        ];
    }

    private function membershipForTenant(Tenant $tenant, int $membershipId, string $field): TenantUser
    {
        $membership = TenantUser::query()
            ->where('tenant_id', $tenant->id)
            ->where('id', $membershipId)
            ->where('status', 'active')
            ->first();

        if (! $membership) {
            throw ValidationException::withMessages([
                $field => ['The selected tenant membership is invalid.'],
            ]);
        }

        return $membership;
    }

    private function uniqueCourseSlug(string $value, ?Course $ignore = null): string
    {
        $slug = Str::slug($value);

        if ($slug === '') {
            throw ValidationException::withMessages([
                'slug' => ['The course slug is invalid.'],
            ]);
        }

        $query = Course::query()->where('slug', $slug);

        if ($ignore) {
            $query->whereKeyNot($ignore->id);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'slug' => ['The course slug has already been taken.'],
            ]);
        }

        return $slug;
    }
}
