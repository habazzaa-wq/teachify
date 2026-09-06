<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\CourseEnrollment;
use App\Models\LearnerAnalytics;
use App\Models\Role;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\AvatarGenerator;
use App\Services\Auth\InvitationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class StudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = currentTenant()->id;

        $query = TenantUser::query()
            ->with(['user', 'roles'])
            ->where('tenant_id', $tenantId)
            ->whereHas('roles', fn ($q) => $q->where('slug', 'student'));

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', fn ($uq) => $uq
                    ->where('name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%")
                )
                ->orWhere('phone', 'ilike', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $sort = $request->input('sort', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc');

        $allowedSorts = ['created_at', 'last_login_at', 'last_accessed_at'];
        $sortColumn = in_array($sort, $allowedSorts) ? $sort : 'created_at';
        $query->orderBy($sortColumn, $sortDir === 'asc' ? 'asc' : 'desc');

        $perPage = min((int) $request->input('per_page', 25), 100);
        $paginator = $query->paginate($perPage);

        $students = $paginator->getCollection()->map(fn ($tu) => $this->formatStudent($tu));

        return response()->json([
            'data' => $students,
            'total' => $paginator->total(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $perPage,
        ]);
    }

    public function metrics(): JsonResponse
    {
        $tenantId = currentTenant()->id;

        $baseQuery = TenantUser::query()
            ->where('tenant_id', $tenantId)
            ->whereHas('roles', fn ($q) => $q->where('slug', 'student'));

        $totalStudents = (clone $baseQuery)->count();

        $activeStudents = (clone $baseQuery)->where('status', 'active')->count();

        $enrolledStudents = CourseEnrollment::where('tenant_id', $tenantId)
            ->whereHas('student.roles', fn ($q) => $q->where('slug', 'student'))
            ->distinct('tenant_user_id')
            ->count('tenant_user_id');

        $newThisMonth = (clone $baseQuery)
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();

        $averageProgress = LearnerAnalytics::where('tenant_id', $tenantId)
            ->avg('average_progress_percent') ?? 0;

        $totalEnrollments = CourseEnrollment::where('tenant_id', $tenantId)
            ->count();
        $completedEnrollments = CourseEnrollment::where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->count();
        $completionRate = $totalEnrollments > 0
            ? round(($completedEnrollments / $totalEnrollments) * 100, 1)
            : 0;

        return response()->json([
            'data' => [
                'totalStudents' => $totalStudents,
                'activeStudents' => $activeStudents,
                'enrolledStudents' => $enrolledStudents,
                'newThisMonth' => $newThisMonth,
                'averageProgress' => round($averageProgress, 1),
                'completionRate' => $completionRate,
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $tenantId = currentTenant()->id;

        $membership = TenantUser::with(['user', 'roles'])
            ->where('tenant_id', $tenantId)
            ->where('id', $id)
            ->whereHas('roles', fn ($q) => $q->where('slug', 'student'))
            ->firstOrFail();

        return response()->json([
            'data' => $this->formatStudent($membership, true),
        ]);
    }

    public function enrollments(int $id): JsonResponse
    {
        $tenantId = currentTenant()->id;

        $membership = TenantUser::where('tenant_id', $tenantId)
            ->where('id', $id)
            ->whereHas('roles', fn ($q) => $q->where('slug', 'student'))
            ->firstOrFail();

        $enrollments = CourseEnrollment::with(['course', 'completion'])
            ->where('tenant_id', $tenantId)
            ->where('tenant_user_id', $id)
            ->orderByDesc('enrolled_at')
            ->get()
            ->map(fn ($e) => [
                'id' => (string) $e->id,
                'courseId' => (string) $e->course_id,
                'courseTitle' => $e->course->title ?? 'غير محدد',
                'courseThumbnail' => $e->course->thumbnail_url ?? null,
                'courseSlug' => $e->course->slug ?? null,
                'status' => $e->status,
                'enrolledAt' => $e->enrolled_at?->toIso8601String(),
                'startedAt' => $e->started_at?->toIso8601String(),
                'completedAt' => $e->completed_at?->toIso8601String(),
                'cancelledAt' => $e->cancelled_at?->toIso8601String(),
                'completionPercent' => $e->completion?->completion_percent ?? 0,
                'progressRecordsCount' => $e->progressRecords()->count(),
                'completedLessonsCount' => $e->progressRecords()->where('status', 'completed')->count(),
                'totalLessonsCount' => DB::table('course_lessons')
                    ->join('course_sections', 'course_sections.id', '=', 'course_lessons.course_section_id')
                    ->where('course_sections.course_id', $e->course_id)
                    ->count(),
            ]);

        return response()->json([
            'data' => $enrollments,
        ]);
    }

    public function analytics(int $id): JsonResponse
    {
        $tenantId = currentTenant()->id;

        TenantUser::where('tenant_id', $tenantId)
            ->where('id', $id)
            ->whereHas('roles', fn ($q) => $q->where('slug', 'student'))
            ->firstOrFail();

        $analytics = LearnerAnalytics::where('tenant_id', $tenantId)
            ->where('tenant_user_id', $id)
            ->first();

        $enrolledCourses = CourseEnrollment::where('tenant_id', $tenantId)
            ->where('tenant_user_id', $id)
            ->count();

        $completedCourses = CourseEnrollment::where('tenant_id', $tenantId)
            ->where('tenant_user_id', $id)
            ->where('status', 'completed')
            ->count();

        $certificatesCount = DB::table('issued_certificates')
            ->where('tenant_id', $tenantId)
            ->where('tenant_user_id', $id)
            ->count();

        $totalQuizAttempts = DB::table('quiz_attempts')
            ->where('tenant_id', $tenantId)
            ->where('tenant_user_id', $id)
            ->count();

        $totalAssignmentSubmissions = DB::table('assignment_submissions')
            ->where('tenant_id', $tenantId)
            ->where('tenant_user_id', $id)
            ->count();

        return response()->json([
            'data' => [
                'totalEnrolledCourses' => $enrolledCourses,
                'completedCourses' => $completedCourses,
                'averageProgress' => $analytics?->average_progress_percent ?? 0,
                'averageQuizScore' => $analytics?->average_quiz_score ?? 0,
                'totalQuizAttempts' => $totalQuizAttempts,
                'averageAssignmentScore' => $analytics?->average_assignment_score ?? 0,
                'totalAssignmentSubmissions' => $totalAssignmentSubmissions,
                'certificatesEarned' => $certificatesCount,
                'lastActivityAt' => $analytics?->last_activity_at?->toIso8601String(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'parent_phone' => ['nullable', 'string', 'max:50'],
            'password' => ['required', 'string', 'min:8'],
            'password_confirmation' => ['required', 'string', 'same:password'],
            'gender' => ['nullable', 'string', 'max:20'],
            'nationality' => ['nullable', 'string', 'max:100'],
            'study_level' => ['nullable', 'string', 'max:100'],
            'governorate' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
        ]);

        $tenantId = currentTenant()->id;
        $email = mb_strtolower(trim($validated['email']));

        $existingUser = User::where('email', $email)->first();

        if ($existingUser) {
            $existingMembership = TenantUser::query()
                ->where('tenant_id', $tenantId)
                ->where('user_id', $existingUser->id)
                ->exists();

            if ($existingMembership) {
                throw ValidationException::withMessages([
                    'email' => ['هذا المستخدم مسجل بالفعل في هذه الأكاديمية.'],
                ]);
            }
        }

        $user = $existingUser ?? User::create([
            'name' => $validated['name'],
            'email' => $email,
            'password' => Hash::make($validated['password']),
        ]);

        $avatar = AvatarGenerator::generate($validated['gender'] ?? null, $user->id);

        $membership = TenantUser::create([
            'tenant_id' => $tenantId,
            'user_id' => $user->id,
            'status' => 'active',
            'phone' => $validated['phone'] ?? null,
            'parent_phone' => $validated['parent_phone'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'nationality' => $validated['nationality'] ?? null,
            'study_level' => $validated['study_level'] ?? null,
            'governorate' => $validated['governorate'] ?? null,
            'city' => $validated['city'] ?? null,
            'avatar' => $avatar,
            'joined_at' => now(),
        ]);

        $studentRole = Role::where('tenant_id', $tenantId)->where('slug', 'student')->first();
        if ($studentRole) {
            $membership->roles()->attach($studentRole->id, ['tenant_id' => $tenantId]);
        }

        return response()->json([
            'message' => 'تم إنشاء حساب الطالب بنجاح.',
            'data' => $this->formatStudent($membership->loadMissing(['user', 'roles'])),
        ], 201);
    }

    public function invite(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $tenantId = currentTenant()->id;
        $email = mb_strtolower(trim($validated['email']));

        $studentRole = Role::where('tenant_id', $tenantId)->where('slug', 'student')->first();
        if (! $studentRole) {
            throw ValidationException::withMessages([
                'role' => ['دور الطلاب غير موجود.'],
            ]);
        }

        $invitations = app(InvitationService::class);
        $result = $invitations->create(
            currentTenant(),
            $email,
            [$studentRole->id],
            $request->user(),
        );

        return response()->json([
            'message' => 'تم إرسال الدعوة بنجاح.',
            'invitation' => [
                'id' => $result['invitation']->id,
                'email' => $result['invitation']->email,
                'status' => $result['invitation']->status,
                'expires_at' => $result['invitation']->expires_at,
            ],
        ], 201);
    }

    public function destroy(int $id): JsonResponse
    {
        $tenantId = currentTenant()->id;

        $membership = TenantUser::query()
            ->where('tenant_id', $tenantId)
            ->where('id', $id)
            ->whereHas('roles', fn ($q) => $q->where('slug', 'student'))
            ->firstOrFail();

        $membership->delete();

        return response()->json([
            'message' => 'تم حذف الطالب بنجاح.',
        ]);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer'],
        ]);

        $tenantId = currentTenant()->id;

        $deleted = TenantUser::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('id', $validated['ids'])
            ->whereHas('roles', fn ($q) => $q->where('slug', 'student'))
            ->delete();

        return response()->json([
            'message' => "تم حذف {$deleted} طالب بنجاح.",
            'deleted' => $deleted,
        ]);
    }

    private function formatStudent(TenantUser $membership, bool $detailed = false): array
    {
        $user = $membership->user;

        $enrollmentsCount = CourseEnrollment::where('tenant_id', $membership->tenant_id)
            ->where('tenant_user_id', $membership->id)
            ->count();

        $completedCount = CourseEnrollment::where('tenant_id', $membership->tenant_id)
            ->where('tenant_user_id', $membership->id)
            ->where('status', 'completed')
            ->count();

        $data = [
            'id' => (string) $membership->id,
            'tenantUserId' => (string) $membership->id,
            'fullName' => $user->name ?? 'غير معروف',
            'email' => $user->email ?? '',
            'phone' => $membership->phone ?? $user->phone ?? '',
            'parentPhone' => $membership->parent_phone ?? '',
            'gender' => $membership->gender ?? '',
            'nationality' => $membership->nationality ?? '',
            'studyLevel' => $membership->study_level ?? '',
            'governorate' => $membership->governorate ?? '',
            'city' => $membership->city ?? '',
            'avatar' => $membership->avatar ?? $user->avatar ?? null,
            'status' => $membership->status,
            'enrolledCoursesCount' => $enrollmentsCount,
            'completedCoursesCount' => $completedCount,
            'joinedAt' => $membership->joined_at?->toIso8601String(),
            'lastActivityAt' => $membership->last_accessed_at?->toIso8601String(),
            'lastLoginAt' => $membership->last_login_at?->toIso8601String(),
            'createdAt' => $membership->created_at->toIso8601String(),
        ];

        if ($detailed) {
            $analytics = LearnerAnalytics::where('tenant_id', $membership->tenant_id)
                ->where('tenant_user_id', $membership->id)
                ->first();

            $data['averageProgress'] = $analytics?->average_progress_percent ?? 0;
            $data['averageQuizScore'] = $analytics?->average_quiz_score ?? 0;
            $data['averageAssignmentScore'] = $analytics?->average_assignment_score ?? 0;
            $data['role'] = $membership->roles->first() ? [
                'id' => (string) $membership->roles->first()->id,
                'name' => $membership->roles->first()->name,
                'slug' => $membership->roles->first()->slug,
            ] : null;
        }

        return $data;
    }
}
