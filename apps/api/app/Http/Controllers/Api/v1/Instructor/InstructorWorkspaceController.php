<?php

namespace App\Http\Controllers\Api\v1\Instructor;

use App\Http\Controllers\Controller;
use App\Models\AssignmentSubmission;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamAttemptAnswer;
use App\Models\MediaAsset;
use App\Models\Quiz;
use App\Models\TenantUser;
use App\Http\Requests\ExamBank\StoreManualGradeRequest;
use App\Services\ExamBank\ExamManualGradingService;
use App\Services\Instructors\InstructorCourseAuthorization;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstructorWorkspaceController extends Controller
{
    public function __construct(
        private readonly InstructorCourseAuthorization $courseAuthorization,
    ) {}

    public function dashboard(Request $request): JsonResponse
    {
        $instructor = $this->instructor($request);
        $courseIds = $this->courseIds($instructor);

        return response()->json([
            'data' => [
                'courses' => $courseIds->count(),
                'students' => $this->studentsQuery($instructor, $courseIds)->where('status', 'active')->count(),
                'media' => MediaAsset::query()
                    ->where('tenant_id', $instructor->tenant_id)
                    ->where(fn (Builder $query) => $query
                        ->where('created_by_tenant_user_id', $instructor->id)
                        ->orWhere('uploader_id', $instructor->id))
                    ->count(),
                'exams' => Exam::query()
                    ->where('tenant_id', $instructor->tenant_id)
                    ->where('created_by_tenant_user_id', $instructor->id)
                    ->count(),
                'quizzes' => Quiz::query()
                    ->where('tenant_id', $instructor->tenant_id)
                    ->whereIn('course_id', $courseIds)
                    ->count(),
                'pending_grading' => $this->submissionsQuery($instructor, $courseIds)
                    ->whereIn('status', ['submitted', 'returned'])
                    ->count(),
            ],
        ]);
    }

    public function students(Request $request): JsonResponse
    {
        $instructor = $this->instructor($request);
        $courseIds = $this->courseIds($instructor);
        $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:active,inactive,suspended'],
            'sort' => ['nullable', 'in:created_at,last_login_at,last_accessed_at'],
            'sort_dir' => ['nullable', 'in:asc,desc'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $students = $this->studentsQuery($instructor, $courseIds)
            ->withCount([
                'courseEnrollments as instructor_course_enrollments_count' => fn (Builder $query) => $query
                    ->whereIn('course_id', $courseIds)
                    ->whereIn('status', ['active', 'completed']),
                'courseEnrollments as instructor_completed_enrollments_count' => fn (Builder $query) => $query
                    ->whereIn('course_id', $courseIds)
                    ->where('status', 'completed'),
            ]);

        if ($search = trim((string) $request->input('search'))) {
            $students->where(function (Builder $query) use ($search): void {
                $query->whereHas('user', fn (Builder $user) => $user
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%"))
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $students->where('status', $status);
        }

        $sort = $request->input('sort', 'created_at');
        $sortColumn = in_array($sort, ['created_at', 'last_login_at', 'last_accessed_at'], true)
            ? $sort
            : 'created_at';
        $students->orderBy($sortColumn, $request->input('sort_dir') === 'asc' ? 'asc' : 'desc');

        $students = $students
            ->paginate($this->perPage($request));

        return response()->json([
            'data' => $students->getCollection()->map(fn (TenantUser $student): array => [
                'id' => (string) $student->id,
                'tenantUserId' => (string) $student->id,
                'fullName' => $student->user?->name ?? 'غير معروف',
                'email' => $student->user?->email ?? '',
                'phone' => $student->phone ?? $student->user?->phone ?? '',
                'parentPhone' => $student->parent_phone ?? '',
                'gender' => $student->gender ?? '',
                'nationality' => $student->nationality ?? '',
                'studyLevel' => $student->study_level ?? '',
                'governorate' => $student->governorate ?? '',
                'city' => $student->city ?? '',
                'avatar' => $student->avatar ?: $student->user?->avatar,
                'status' => $student->status,
                'enrolledCoursesCount' => (int) $student->instructor_course_enrollments_count,
                'completedCoursesCount' => (int) $student->instructor_completed_enrollments_count,
                'joinedAt' => $student->joined_at?->toIso8601String(),
                'lastActivityAt' => $student->last_accessed_at?->toIso8601String(),
                'lastLoginAt' => $student->last_login_at?->toIso8601String(),
                'createdAt' => $student->created_at?->toIso8601String(),
            ])->values(),
            'total' => $students->total(),
            'current_page' => $students->currentPage(),
            'last_page' => $students->lastPage(),
            'per_page' => $students->perPage(),
        ]);
    }

    public function studentMetrics(Request $request): JsonResponse
    {
        $instructor = $this->instructor($request);
        $courseIds = $this->courseIds($instructor);
        $students = $this->studentsQuery($instructor, $courseIds);
        $studentIds = (clone $students)->pluck('id');
        $enrollments = \App\Models\CourseEnrollment::query()
            ->where('tenant_id', $instructor->tenant_id)
            ->whereIn('course_id', $courseIds)
            ->whereIn('status', ['active', 'completed']);
        $totalEnrollments = (clone $enrollments)->count();
        $completedEnrollments = (clone $enrollments)->where('status', 'completed')->count();

        return response()->json([
            'data' => [
                'totalStudents' => $studentIds->count(),
                'activeStudents' => (clone $students)->where('status', 'active')->count(),
                'enrolledStudents' => (clone $enrollments)->distinct('tenant_user_id')->count('tenant_user_id'),
                'newThisMonth' => (clone $students)->where('created_at', '>=', now()->startOfMonth())->count(),
                'averageProgress' => round((float) (\App\Models\LearnerAnalytics::query()
                    ->where('tenant_id', $instructor->tenant_id)
                    ->whereIn('tenant_user_id', $studentIds)
                    ->avg('average_progress_percent') ?? 0), 1),
                'completionRate' => $totalEnrollments > 0
                    ? round(($completedEnrollments / $totalEnrollments) * 100, 1)
                    : 0,
            ],
        ]);
    }

    public function exams(Request $request): JsonResponse
    {
        $instructor = $this->instructor($request);
        $exams = Exam::query()
            ->where('tenant_id', $instructor->tenant_id)
            ->where('created_by_tenant_user_id', $instructor->id)
            ->withCount(['attempts'])
            ->orderByDesc('created_at')
            ->paginate($this->perPage($request));

        return response()->json([
            'data' => $exams->getCollection()->map(fn (Exam $exam): array => [
                'id' => (string) $exam->id,
                'title' => $exam->title,
                'status' => $exam->status,
                'question_count' => (int) $exam->question_count,
                'attempts_count' => (int) $exam->attempts_count,
                'created_at' => $exam->created_at?->toIso8601String(),
            ])->values(),
            'meta' => $this->paginationMeta($exams),
        ]);
    }

    public function gradingQueue(Request $request): JsonResponse
    {
        $instructor = $this->instructor($request);
        $courseIds = $this->courseIds($instructor);
        $submissions = $this->submissionsQuery($instructor, $courseIds)
            ->whereIn('status', ['submitted', 'returned'])
            ->with([
                'assignment:id,course_id,title,max_score',
                'assignment.course:id,title',
                'student.user:id,name,email',
                'files:id,assignment_submission_id,title,media_asset_id',
                'files.mediaAsset:id,cdn_url,original_filename,mime_type',
            ])
            ->orderByDesc('submitted_at')
            ->paginate($this->perPage($request));

        return response()->json([
            'data' => $submissions->getCollection()->map(fn (AssignmentSubmission $submission): array => [
                'id' => (string) $submission->id,
                'status' => $submission->status,
                'notes' => $submission->notes,
                'submitted_at' => $submission->submitted_at?->toIso8601String(),
                'student' => [
                    'id' => (string) $submission->student?->id,
                    'name' => $submission->student?->user?->name,
                    'email' => $submission->student?->user?->email,
                ],
                'assignment' => [
                    'id' => (string) $submission->assignment?->id,
                    'title' => $submission->assignment?->title,
                    'max_score' => (int) ($submission->assignment?->max_score ?? 0),
                    'course' => $submission->assignment?->course?->title,
                ],
                'files' => $submission->files->map(fn ($file): array => [
                    'title' => $file->title ?: $file->mediaAsset?->original_filename,
                    'url' => $file->mediaAsset?->cdn_url,
                    'mime_type' => $file->mediaAsset?->mime_type,
                ])->values(),
            ])->values(),
            'meta' => $this->paginationMeta($submissions),
        ]);
    }

    public function examGradingQueue(Request $request): JsonResponse
    {
        $instructor = $this->instructor($request);
        $answers = ExamAttemptAnswer::query()
            ->where('tenant_id', $instructor->tenant_id)
            ->whereIn('grading_status', ['pending_manual_review', 'partially_graded'])
            ->whereHas('attempt', fn (Builder $attempt) => $attempt
                ->where('tenant_id', $instructor->tenant_id)
                ->whereHas('exam', fn (Builder $exam) => $exam
                    ->where('tenant_id', $instructor->tenant_id)
                    ->where('created_by_tenant_user_id', $instructor->id)))
            ->with([
                'attempt:id,exam_id,user_id,submitted_at',
                'attempt.exam:id,title',
                'attempt.user:id,name',
                'examQuestion:id,exam_id,question_id,points',
                'examQuestion.question:id,title,type,points',
            ])
            ->withCount('pages')
            ->orderBy('answered_at')
            ->paginate($this->perPage($request));

        return response()->json([
            'data' => $answers->getCollection()->map(fn (ExamAttemptAnswer $answer): array => [
                'id' => (string) $answer->id,
                'attempt_id' => (string) $answer->exam_attempt_id,
                'exam_question_id' => (string) $answer->exam_question_id,
                'exam' => [
                    'id' => (string) $answer->attempt?->exam?->id,
                    'title' => $answer->attempt?->exam?->title,
                ],
                'student' => [
                    'id' => (string) $answer->attempt?->user?->id,
                    'name' => $answer->attempt?->user?->name,
                ],
                'question' => [
                    'title' => $answer->examQuestion?->question?->title,
                    'type' => $answer->examQuestion?->question?->type,
                    'points' => max(0, (int) ($answer->examQuestion?->points ?? $answer->examQuestion?->question?->points ?? 0)),
                ],
                'answer' => $answer->answer,
                'answer_mode' => $answer->answer_mode,
                'grading_status' => $answer->grading_status,
                'manual_score' => $answer->manual_score !== null ? (float) $answer->manual_score : null,
                'feedback' => $answer->feedback,
                'page_count' => (int) $answer->pages_count,
                'submitted_at' => $answer->attempt?->submitted_at?->toIso8601String(),
            ])->values(),
            'meta' => $this->paginationMeta($answers),
        ]);
    }

    public function gradeExamAnswer(
        StoreManualGradeRequest $request,
        ExamAttempt $attempt,
        ExamAttemptAnswer $answer,
        ExamManualGradingService $grading,
    ): JsonResponse {
        $instructor = $this->instructor($request);
        abort_unless(
            $attempt->tenant_id === $instructor->tenant_id
                && $answer->tenant_id === $instructor->tenant_id
                && $answer->exam_attempt_id === $attempt->id
                && $attempt->exam()
                    ->where('tenant_id', $instructor->tenant_id)
                    ->where('created_by_tenant_user_id', $instructor->id)
                    ->exists(),
            404,
        );

        $result = $grading->gradeAnswer($instructor, $attempt, $answer, $request->validated());

        return response()->json([
            'data' => [
                'answer' => [
                    'id' => (string) $result['answer']->id,
                    'gradingStatus' => $result['answer']->grading_status,
                    'manualScore' => $result['answer']->manual_score !== null
                        ? (float) $result['answer']->manual_score
                        : null,
                    'feedback' => $result['answer']->feedback,
                    'gradedBy' => $result['answer']->grader?->user !== null
                        ? [
                            'id' => (string) $result['answer']->grader->id,
                            'name' => $result['answer']->grader->user->name,
                        ]
                        : null,
                    'gradedAt' => $result['answer']->graded_at?->toIso8601String(),
                ],
                'attempt' => [
                    'score' => (float) $result['attempt']->score,
                    'maxScore' => (float) $result['attempt']->max_score,
                    'percentage' => (float) $result['attempt']->percentage,
                    'passed' => (bool) $result['attempt']->passed,
                ],
            ],
        ]);
    }

    /**
     * @return \Illuminate\Support\Collection<int, int>
     */
    private function courseIds(TenantUser $instructor): \Illuminate\Support\Collection
    {
        return $this->courseAuthorization->accessibleCoursesQuery($instructor)
            ->pluck('id');
    }

    private function studentsQuery(TenantUser $instructor, \Illuminate\Support\Collection $courseIds): Builder
    {
        return TenantUser::query()
            ->where('tenant_id', $instructor->tenant_id)
            ->whereHas('roles', fn (Builder $roles) => $roles->where('slug', 'student'))
            ->whereHas('courseEnrollments', fn (Builder $enrollments) => $enrollments
                ->whereIn('course_id', $courseIds)
                ->whereIn('status', ['active', 'completed']));
    }

    private function submissionsQuery(TenantUser $instructor, \Illuminate\Support\Collection $courseIds): Builder
    {
        return AssignmentSubmission::query()
            ->where('tenant_id', $instructor->tenant_id)
            ->whereHas('assignment', fn (Builder $assignment) => $assignment
                ->whereIn('course_id', $courseIds));
    }

    private function instructor(Request $request): TenantUser
    {
        $instructor = $request->attributes->get('instructorMembership');
        abort_unless($instructor instanceof TenantUser, 403);

        return $instructor;
    }

    private function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 25), 1), 100);
    }

    /**
     * @return array{current_page: int, last_page: int, per_page: int, total: int}
     */
    private function paginationMeta(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }
}
