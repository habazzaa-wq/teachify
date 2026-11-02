<?php

namespace App\Http\Controllers\Api\v1\Public;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\TenantUser;
use App\Services\Instructors\InstructorFeature;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class PublicInstructorController extends Controller
{
    public function index(InstructorFeature $feature): JsonResponse
    {
        $tenant = currentTenant();
        $feature->ensureEnabled($tenant);

        $memberships = TenantUser::query()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'active')
            ->where('is_instructor', true)
            ->with('user:id,name,avatar')
            ->get();
        $courses = $this->publicCourses($tenant->id, $memberships->modelKeys());
        $coursesByInstructor = $this->groupCourses($courses);

        return response()->json([
            'data' => $memberships
                ->map(fn(TenantUser $membership) => $this->presentInstructor(
                    $membership,
                    $coursesByInstructor->get($membership->id, collect())->values(),
                ))
                ->values(),
        ]);
    }

    public function show(int $instructor, InstructorFeature $feature): JsonResponse
    {
        $tenant = currentTenant();
        $feature->ensureEnabled($tenant);

        $membership = TenantUser::query()
            ->where('tenant_id', $tenant->id)
            ->whereKey($instructor)
            ->where('status', 'active')
            ->where('is_instructor', true)
            ->with('user:id,name,avatar')
            ->firstOrFail();

        $courses = $this->publicCourses($tenant->id, [$membership->id])
            ->filter(fn(Course $course) => $this->courseHasInstructor($course, $membership->id))
            ->values();

        return response()->json([
            'data' => $this->presentInstructor($membership, $courses),
        ]);
    }

    private function publicCourses(int $tenantId, array $membershipIds)
    {
        if ($membershipIds === []) {
            return collect();
        }

        return Course::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'published')
            ->where('visibility', 'public')
            ->where(function (Builder $query) use ($membershipIds): void {
                $query->whereIn('primary_instructor_tenant_user_id', $membershipIds)
                    ->orWhereHas('instructors', fn(Builder $instructors) => $instructors
                        ->whereIn('tenant_user_id', $membershipIds)
                        ->where('is_visible', true));
            })
            ->with(['primaryInstructor.user', 'instructors.membership.user'])
            ->latest('published_at')
            ->get();
    }

    private function groupCourses($courses)
    {
        return $courses->flatMap(function (Course $course) {
            $ids = collect([$course->primary_instructor_tenant_user_id])
                ->merge($course->instructors
                    ->where('is_visible', true)
                    ->pluck('tenant_user_id'))
                ->filter()
                ->unique();

            return $ids->map(fn(int $id) => [$id, $course]);
        })->groupBy(fn(array $entry) => $entry[0])
            ->map(fn($entries) => $entries->map(fn(array $entry) => $entry[1])->unique('id'));
    }

    private function courseHasInstructor(Course $course, int $membershipId): bool
    {
        return $course->primary_instructor_tenant_user_id === $membershipId
            || $course->instructors->contains(fn($assignment) => $assignment->tenant_user_id === $membershipId && $assignment->is_visible);
    }

    private function presentInstructor(TenantUser $membership, $courses): array
    {
        return [
            'id' => (string)$membership->id,
            'name' => $membership->user?->name ?? '',
            'avatar' => $membership->avatar ?? $membership->user?->avatar,
            'jobTitle' => $membership->job_title,
            'department' => $membership->department,
            'bio' => $membership->bio,
            'expertise' => $membership->expertise,
            'experienceYears' => $membership->experience_years,
            'websiteUrl' => $membership->website_url,
            'linkedinUrl' => $membership->linkedin_url,
            'youtubeUrl' => $membership->youtube_url,
            'coursesCount' => $courses->count(),
            'courses' => $courses->map(fn(Course $course) => [
                'id' => (string)$course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'thumbnail' => $course->thumbnail_path,
                'shortDescription' => $course->short_description,
            ])->values(),
        ];
    }
}
