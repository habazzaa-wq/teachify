<?php

use App\Http\Controllers\Api\Platform\BunnyCenter\BunnyCenterController;
use App\Http\Controllers\Api\Platform\PlatformAuthController;
use App\Http\Controllers\Api\Platform\Usage\UsageController;
use App\Http\Controllers\Api\v1\Access\CourseAccessController;
use App\Http\Controllers\Api\v1\Access\LessonAccessController;
use App\Http\Controllers\Api\v1\Access\MatrixController;
use App\Http\Controllers\Api\v1\Analytics\CourseAnalyticsController;
use App\Http\Controllers\Api\v1\Analytics\LearnerAnalyticsController;
use App\Http\Controllers\Api\v1\Analytics\TenantAnalyticsController;
use App\Http\Controllers\Api\v1\Assignments\AssignmentGradingController;
use App\Http\Controllers\Api\v1\Assignments\AssignmentResultController;
use App\Http\Controllers\Api\v1\Assignments\AssignmentSubmissionController;
use App\Http\Controllers\Api\v1\Assignments\LessonAssignmentController;
use App\Http\Controllers\Api\v1\Audit\ActivityLogController;
use App\Http\Controllers\Api\v1\Audit\AuditLogController;
use App\Http\Controllers\Api\v1\Audit\PlatformAuditController;
use App\Http\Controllers\Api\v1\Auth\AuthController;
use App\Http\Controllers\Api\v1\Auth\CurrentUserController;
use App\Http\Controllers\Api\v1\Auth\InvitationController;
use App\Http\Controllers\Api\v1\Auth\PasswordResetController;
use App\Http\Controllers\Api\v1\Auth\RoleController;
use App\Http\Controllers\Api\v1\Auth\TenantUserController;
use App\Http\Controllers\Api\v1\Certificates\CertificateController;
use App\Http\Controllers\Api\v1\Certificates\CertificateTemplateController;
use App\Http\Controllers\Api\v1\Certificates\CertificateVerificationController;
use App\Http\Controllers\Api\v1\Certificates\CourseCertificateRuleController;
use App\Http\Controllers\Api\v1\Courses\CategoryController;
use App\Http\Controllers\Api\v1\Courses\CourseController;
use App\Http\Controllers\Api\v1\Courses\CourseInstructorController;
use App\Http\Controllers\Api\v1\Courses\CourseLessonController;
use App\Http\Controllers\Api\v1\Courses\CourseModuleController;
use App\Http\Controllers\Api\v1\Courses\CourseSectionController;
use App\Http\Controllers\Api\v1\Courses\CourseSettingController;
use App\Http\Controllers\Api\v1\Courses\LessonFileController;
use App\Http\Controllers\Api\v1\Courses\LessonTextController;
use App\Http\Controllers\Api\v1\Courses\LessonVideoController;
use App\Http\Controllers\Api\v1\Courses\TagController;
use App\Http\Controllers\Api\v1\Discussions\DiscussionPostController;
use App\Http\Controllers\Api\v1\Discussions\DiscussionReportController;
use App\Http\Controllers\Api\v1\Discussions\DiscussionThreadController;
use App\Http\Controllers\Api\v1\ExamBank\ExamAnalyticsController;
use App\Http\Controllers\Api\v1\ExamBank\ExamController;
use App\Http\Controllers\Api\v1\ExamBank\QuestionBankController;
use App\Http\Controllers\Api\v1\ExamBank\QuestionCategoryController;
use App\Http\Controllers\Api\v1\ExamBank\QuestionController;
use App\Http\Controllers\Api\v1\Integrations\BunnyWebhookController;
use App\Http\Controllers\Api\v1\Learning\CompletionController;
use App\Http\Controllers\Api\v1\Learning\EnrollmentController;
use App\Http\Controllers\Api\v1\Learning\LessonBookmarkController;
use App\Http\Controllers\Api\v1\Learning\LessonNoteController;
use App\Http\Controllers\Api\v1\Learning\ProgressController;
use App\Http\Controllers\Api\v1\Media\MediaLibraryController;
use App\Http\Controllers\Api\v1\Media\MediaLibraryFolderController;
use App\Http\Controllers\Api\v1\Media\MediaLibraryMetricsController;
use App\Http\Controllers\Api\v1\Media\MediaLibraryUploadController;
use App\Http\Controllers\Api\v1\Media\MediaProxyController;
use App\Http\Controllers\Api\v1\Media\MediaUploadController;
use App\Http\Controllers\Api\v1\Media\VideoPlaybackController;
use App\Http\Controllers\Api\v1\Media\VideoStatusController;
use App\Http\Controllers\Api\v1\Media\VideoUploadController;
use App\Http\Controllers\Api\v1\Notifications\NotificationController;
use App\Http\Controllers\Api\v1\Notifications\NotificationPreferenceController;
use App\Http\Controllers\Api\v1\Notifications\NotificationTemplateController;
use App\Http\Controllers\Api\v1\Platform\PlatformAdminController;
use App\Http\Controllers\Api\v1\Platform\PlatformBunnySettingController;
use App\Http\Controllers\Api\v1\Platform\PlatformDomainController;
use App\Http\Controllers\Api\v1\Platform\TenantController;
use App\Http\Controllers\Api\v1\Platform\TenantDomainController;
use App\Http\Controllers\Api\v1\Platform\TenantIntegrationController;
use App\Http\Controllers\Api\v1\Platform\TenantSettingController;
use App\Http\Controllers\Api\v1\Public\PublicCourseController;
use App\Http\Controllers\Api\v1\Public\PublicEnrollmentCheckController;
use App\Http\Controllers\Api\v1\PublicEducationalStageController;
use App\Http\Controllers\Api\v1\PublicStudentRegisterController;
use App\Http\Controllers\Api\v1\PublicHeroController;
use App\Http\Controllers\Api\v1\PublicNewsController;
use App\Http\Controllers\Api\v1\PublicSubjectController;
use App\Http\Controllers\Api\v1\PublicTenantController;
use App\Http\Controllers\Api\v1\PublicWhyChooseUsController;
use App\Http\Controllers\Api\v1\Quizzes\LessonQuizController;
use App\Http\Controllers\Api\v1\Quizzes\QuizAttemptController;
use App\Http\Controllers\Api\v1\Quizzes\QuizQuestionController;
use App\Http\Controllers\Api\v1\Quizzes\QuizResultController;
use App\Http\Controllers\Api\v1\Tenant\EducationalStageController;
use App\Http\Controllers\Api\v1\Tenant\NewsController;
use App\Http\Controllers\Api\v1\Tenant\SubjectController;
use App\Http\Controllers\Api\v1\Tenant\TenantAuthController;
use App\Http\Controllers\Api\v1\Tenant\RechargeCodeController;
use App\Http\Controllers\Api\v1\Wallet\WalletController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('platform')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/login', [PlatformAuthController::class, 'login'])->middleware('throttle:5,1');

        Route::middleware(['auth:sanctum', 'platform.token', 'platform.admin'])->group(function () {
            Route::post('/logout', [PlatformAuthController::class, 'logout']);
            Route::get('/me', [PlatformAuthController::class, 'me']);
        });
    });
});

Route::prefix('v1')->group(function () {
    Route::prefix('tenant')->group(function () {
        Route::prefix('auth')->group(function () {
            Route::post('/login', [TenantAuthController::class, 'login'])->middleware('throttle:5,1');
            Route::post('/refresh', [TenantAuthController::class, 'refresh'])->middleware('throttle:10,1');
            Route::post('/forgot-password', [TenantAuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
            Route::post('/reset-password', [TenantAuthController::class, 'resetPassword'])->middleware('throttle:5,1');

            Route::middleware(['auth:sanctum', 'tenant.membership'])->group(function () {
                Route::post('/logout', [TenantAuthController::class, 'logout']);
                Route::get('/me', [TenantAuthController::class, 'me']);
                Route::post('/change-password', [TenantAuthController::class, 'changePassword'])->middleware('throttle:10,1');
            });
        });
    });

    // Public routes
    Route::get('/health', function () {
        return response()->json(['status' => 'ok', 'version' => 'v1']);
    });
    Route::post('/public/register', [PublicStudentRegisterController::class, 'register'])->middleware('throttle:10,1');
    Route::get('/tenant/by-domain', [PublicTenantController::class, 'byDomain']);
    Route::get('/public/news', [PublicNewsController::class, 'index']);
    Route::get('/public/hero', [PublicHeroController::class, 'index']);
    Route::get('/public/why-choose-us', [PublicWhyChooseUsController::class, 'index']);
    Route::get('/public/educational-stages', [PublicEducationalStageController::class, 'index']);
    Route::get('/public/educational-stages/{id}', [PublicEducationalStageController::class, 'show']);
    Route::get('/public/subjects', [PublicSubjectController::class, 'index']);
    Route::get('/certificates/verify/{code}', [CertificateVerificationController::class, 'show']);
    Route::post('/integrations/bunny/webhooks', BunnyWebhookController::class);
    Route::get('/media/serve/{path}', [MediaProxyController::class, 'serve'])
        ->where('path', '.*')
        ->middleware('throttle:120,1')
        ->name('media.serve');

    // Public course routes (no auth required)
    Route::get('/public/courses', [PublicCourseController::class, 'index']);
    Route::get('/public/courses/{slug}', [PublicCourseController::class, 'show']);
    Route::get('/public/courses/{slug}/modules', [PublicCourseController::class, 'modules']);
    Route::get('/public/courses/{slug}/related', [PublicCourseController::class, 'related']);

    // Enrollment check (requires auth)
    Route::middleware(['auth:sanctum', 'tenant.membership'])->group(function () {
        Route::get('/public/courses/{slug}/enrollment', [PublicEnrollmentCheckController::class, 'show']);
    });

    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
        Route::post('/refresh', [AuthController::class, 'refresh'])->middleware('throttle:10,1');
        Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword'])->middleware('throttle:5,1');
        Route::post('/reset-password', [PasswordResetController::class, 'resetPassword'])->middleware('throttle:5,1');
        Route::post('/invitations/accept', [InvitationController::class, 'accept'])->middleware('throttle:10,1');

        Route::middleware(['auth:sanctum', 'tenant.membership'])->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', CurrentUserController::class);
            Route::post('/invitations', [InvitationController::class, 'store'])->middleware('throttle:10,1');
        });
    });

    // Authenticated routes
    Route::middleware(['auth:sanctum', 'tenant.membership'])->group(function () {
        Route::get('/user', function (Request $request) {
            return $request->user();
        });

        // Student wallet (self-service)
        Route::get('/student/wallet', [WalletController::class, 'me']);
        Route::get('/student/wallet/transactions', [WalletController::class, 'transactions']);
        Route::post('/student/wallet/recharge', [WalletController::class, 'recharge'])->middleware('throttle:20,1');

        Route::get('/courses/metrics', [CourseController::class, 'metrics']);
        Route::get('/courses/export', [CourseController::class, 'export']);
        Route::patch('/courses/{course}/status', [CourseController::class, 'updateStatus']);
        Route::patch('/courses/{course}/publish', [CourseController::class, 'publish']);
        Route::patch('/courses/{course}/archive', [CourseController::class, 'archive']);
        Route::post('/courses/{course}/restore', [CourseController::class, 'restore']);
        Route::post('/courses/{course}/duplicate', [CourseController::class, 'duplicate']);
        Route::post('/courses/{course}/feature', [CourseController::class, 'feature']);
        Route::apiResource('courses', CourseController::class);
        Route::get('/analytics/overview', [TenantAnalyticsController::class, 'overview']);
        Route::get('/analytics/courses', [TenantAnalyticsController::class, 'courses']);
        Route::get('/analytics/learners', [TenantAnalyticsController::class, 'learners']);
        Route::get('/courses/{course}/analytics', [CourseAnalyticsController::class, 'show']);
        Route::get('/learners/{membership}/analytics', [LearnerAnalyticsController::class, 'show']);
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/unread', [NotificationController::class, 'unread']);
        Route::patch('/notifications/{notification}/read', [NotificationController::class, 'read']);
        Route::patch('/notifications/{notification}/archive', [NotificationController::class, 'archive']);
        Route::get('/notification-preferences', [NotificationPreferenceController::class, 'index']);
        Route::put('/notification-preferences', [NotificationPreferenceController::class, 'update']);
        Route::get('/notification-templates', [NotificationTemplateController::class, 'index']);
        Route::post('/notification-templates', [NotificationTemplateController::class, 'store']);
        Route::put('/notification-templates/{template}', [NotificationTemplateController::class, 'update']);
        Route::delete('/notification-templates/{template}', [NotificationTemplateController::class, 'destroy']);
        Route::get('/certificates/templates', [CertificateTemplateController::class, 'index']);
        Route::post('/certificates/templates', [CertificateTemplateController::class, 'store']);
        Route::put('/certificates/templates/{template}', [CertificateTemplateController::class, 'update']);
        Route::patch('/certificates/templates/{template}/status', [CertificateTemplateController::class, 'updateStatus']);
        Route::delete('/certificates/templates/{template}', [CertificateTemplateController::class, 'destroy']);
        Route::get('/certificates', [CertificateController::class, 'index']);
        Route::get('/courses/{course}/certificate-rule', [CourseCertificateRuleController::class, 'show']);
        Route::put('/courses/{course}/certificate-rule', [CourseCertificateRuleController::class, 'update']);
        Route::get('/certificates/me', [CertificateController::class, 'me']);
        Route::post('/certificates/{certificate}/revoke', [CertificateController::class, 'revoke']);
        Route::get('/courses/{course}/access', [CourseAccessController::class, 'show']);
        Route::put('/courses/{course}/access', [CourseAccessController::class, 'update']);
        Route::get('/courses/{course}/can-access', [CourseAccessController::class, 'canAccess']);
        Route::get('/lessons/{lesson}/access', [LessonAccessController::class, 'show']);
        Route::put('/lessons/{lesson}/access', [LessonAccessController::class, 'update']);
        Route::get('/lessons/{lesson}/can-access', [LessonAccessController::class, 'canAccess']);
        Route::get('/enrollments', [EnrollmentController::class, 'index']);
        Route::post('/courses/{course}/enrollments', [EnrollmentController::class, 'store']);
        Route::get('/enrollments/{enrollment}', [EnrollmentController::class, 'show']);
        Route::patch('/enrollments/{enrollment}/status', [EnrollmentController::class, 'updateStatus']);
        Route::get('/enrollments/{enrollment}/progress', [ProgressController::class, 'index']);
        Route::get('/enrollments/{enrollment}/completion', [CompletionController::class, 'show']);
        Route::post('/lessons/{lesson}/progress/start', [ProgressController::class, 'start']);
        Route::post('/lessons/{lesson}/progress/update', [ProgressController::class, 'update']);
        Route::post('/lessons/{lesson}/progress/complete', [ProgressController::class, 'complete']);
        Route::get('/lessons/{lesson}/notes', [LessonNoteController::class, 'index']);
        Route::post('/lessons/{lesson}/notes', [LessonNoteController::class, 'store']);
        Route::put('/lessons/{lesson}/notes/{note}', [LessonNoteController::class, 'update']);
        Route::delete('/lessons/{lesson}/notes/{note}', [LessonNoteController::class, 'destroy']);
        Route::get('/lessons/{lesson}/bookmarks', [LessonBookmarkController::class, 'index']);
        Route::post('/lessons/{lesson}/bookmarks', [LessonBookmarkController::class, 'store']);
        Route::put('/lessons/{lesson}/bookmarks/{bookmark}', [LessonBookmarkController::class, 'update']);
        Route::delete('/lessons/{lesson}/bookmarks/{bookmark}', [LessonBookmarkController::class, 'destroy']);
        Route::post('/courses/{course}/instructors', [CourseInstructorController::class, 'store']);
        Route::delete('/courses/{course}/instructors/{instructor}', [CourseInstructorController::class, 'destroy']);
        Route::get('/courses/{course}/settings', [CourseSettingController::class, 'index']);
        Route::put('/courses/{course}/settings/{group}', [CourseSettingController::class, 'update']);
        Route::post('/media/upload-intents', [MediaUploadController::class, 'store']);
        Route::post('/media/upload-intents/{session}/confirm', [MediaUploadController::class, 'confirm']);
        Route::get('/media/assets/{asset}/status', [MediaUploadController::class, 'status']);
        Route::delete('/media/assets/{asset}', [MediaUploadController::class, 'destroy']);
        Route::post('/media/videos/upload-intents', [VideoUploadController::class, 'store']);
        Route::post('/media/videos/upload-intents/{session}/confirm', [VideoUploadController::class, 'confirm']);
        Route::get('/media/videos/{asset}/status', [VideoStatusController::class, 'show']);
        Route::post('/videos/{asset}/play', [VideoPlaybackController::class, 'play']);
        Route::post('/videos/playback/{session}/progress', [VideoPlaybackController::class, 'progress']);
        Route::post('/videos/playback/{session}/close', [VideoPlaybackController::class, 'close']);

        // Media Library routes
        Route::prefix('media-library')->group(function () {
            Route::get('/assets', [MediaLibraryController::class, 'index']);
            Route::get('/assets/{id}', [MediaLibraryController::class, 'show']);
            Route::put('/assets/{id}', [MediaLibraryController::class, 'update']);
            Route::delete('/assets/{id}', [MediaLibraryController::class, 'destroy']);
            Route::post('/assets/{id}/restore', [MediaLibraryController::class, 'restore']);
            Route::post('/assets/{id}/duplicate', [MediaLibraryController::class, 'duplicate']);
            Route::put('/assets/{id}/rename', [MediaLibraryController::class, 'rename']);
            Route::put('/assets/{id}/move', [MediaLibraryController::class, 'move']);
            Route::post('/assets/{id}/favorite', [MediaLibraryController::class, 'favorite']);
            Route::post('/assets/{id}/pin', [MediaLibraryController::class, 'pin']);
            Route::post('/assets/{id}/archive', [MediaLibraryController::class, 'archiveAsset']);
            Route::post('/assets/bulk/delete', [MediaLibraryController::class, 'bulkDelete']);
            Route::post('/assets/bulk/restore', [MediaLibraryController::class, 'bulkRestore']);
            Route::post('/assets/bulk/move', [MediaLibraryController::class, 'bulkMove']);
            Route::post('/assets/bulk/tag', [MediaLibraryController::class, 'bulkTag']);

            Route::get('/folders/tree', [MediaLibraryFolderController::class, 'tree']);
            Route::get('/folders', [MediaLibraryFolderController::class, 'index']);
            Route::post('/folders', [MediaLibraryFolderController::class, 'store']);
            Route::get('/folders/{id}', [MediaLibraryFolderController::class, 'show']);
            Route::put('/folders/{id}', [MediaLibraryFolderController::class, 'update']);
            Route::put('/folders/{id}/move', [MediaLibraryFolderController::class, 'move']);
            Route::delete('/folders/{id}', [MediaLibraryFolderController::class, 'destroy']);
            Route::get('/folders/{id}/breadcrumbs', [MediaLibraryFolderController::class, 'breadcrumbs']);

            Route::get('/metrics', [MediaLibraryMetricsController::class, 'index']);
            Route::get('/storage', [MediaLibraryMetricsController::class, 'storage']);
            Route::get('/recent', [MediaLibraryMetricsController::class, 'recent']);

            Route::post('/upload/intent', [MediaLibraryUploadController::class, 'uploadIntent']);
            Route::post('/upload/file', [MediaLibraryUploadController::class, 'uploadFile']);
            Route::post('/upload/{session}/confirm', [MediaLibraryUploadController::class, 'confirmUpload']);
            Route::get('/assets/{asset}/status', [MediaLibraryUploadController::class, 'status']);
            Route::get('/assets/{asset}/signed-url', [MediaLibraryUploadController::class, 'signedUrl']);

            // Resumable multipart upload pipeline (backend transport).
            Route::post('/upload/resumable/intent', [MediaLibraryUploadController::class, 'resumableIntent']);
            Route::put('/upload/resumable/{session}/chunk', [MediaLibraryUploadController::class, 'resumableChunk'])
                ->withoutMiddleware('throttle:api');
            Route::get('/upload/resumable/{session}/resume', [MediaLibraryUploadController::class, 'resumableResume']);
            Route::post('/upload/resumable/{session}/finalize', [MediaLibraryUploadController::class, 'resumableFinalize']);
        });

        Route::get('/modules/metrics', [CourseModuleController::class, 'metrics']);
        Route::get('/courses/{course}/modules', [CourseModuleController::class, 'index']);
        Route::post('/courses/{course}/modules', [CourseModuleController::class, 'store']);
        Route::get('/courses/{course}/modules/export', [CourseModuleController::class, 'export']);
        Route::post('/courses/{course}/modules/reorder', [CourseModuleController::class, 'reorder']);
        Route::get('/courses/{course}/modules/{module}', [CourseModuleController::class, 'show']);
        Route::put('/courses/{course}/modules/{module}', [CourseModuleController::class, 'update']);
        Route::patch('/courses/{course}/modules/{module}/status', [CourseModuleController::class, 'updateStatus']);
        Route::patch('/courses/{course}/modules/{module}/publish', [CourseModuleController::class, 'publish']);
        Route::patch('/courses/{course}/modules/{module}/archive', [CourseModuleController::class, 'archive']);
        Route::post('/courses/{course}/modules/{module}/feature', [CourseModuleController::class, 'toggleFeature']);
        Route::post('/courses/{course}/modules/{module}/restore', [CourseModuleController::class, 'restore']);
        Route::post('/courses/{course}/modules/{module}/duplicate', [CourseModuleController::class, 'duplicate']);
        Route::delete('/courses/{course}/modules/{module}', [CourseModuleController::class, 'destroy']);

        Route::get('/sections/metrics', [CourseSectionController::class, 'metrics']);
        Route::get('/courses/{course}/sections', [CourseSectionController::class, 'index']);
        Route::post('/courses/{course}/sections', [CourseSectionController::class, 'store']);
        Route::get('/courses/{course}/sections/export', [CourseSectionController::class, 'export']);
        Route::post('/courses/{course}/sections/reorder', [CourseSectionController::class, 'reorder']);
        Route::get('/courses/{course}/sections/{section}', [CourseSectionController::class, 'show']);
        Route::put('/courses/{course}/sections/{section}', [CourseSectionController::class, 'update']);
        Route::patch('/courses/{course}/sections/{section}/status', [CourseSectionController::class, 'updateStatus']);
        Route::patch('/courses/{course}/sections/{section}/publish', [CourseSectionController::class, 'publish']);
        Route::patch('/courses/{course}/sections/{section}/unpublish', [CourseSectionController::class, 'unpublish']);
        Route::patch('/courses/{course}/sections/{section}/archive', [CourseSectionController::class, 'archive']);
        Route::post('/courses/{course}/sections/{section}/lock', [CourseSectionController::class, 'toggleLock']);
        Route::post('/courses/{course}/sections/{section}/feature', [CourseSectionController::class, 'toggleFeature']);
        Route::post('/courses/{course}/sections/{section}/restore', [CourseSectionController::class, 'restore']);
        Route::post('/courses/{course}/sections/{section}/duplicate', [CourseSectionController::class, 'duplicate']);
        Route::post('/courses/{course}/sections/{section}/move', [CourseSectionController::class, 'move']);
        Route::delete('/courses/{course}/sections/{section}', [CourseSectionController::class, 'destroy']);
        Route::get('/lessons/metrics', [CourseLessonController::class, 'metrics']);
        Route::get('/courses/{course}/sections/{section}/lessons', [CourseLessonController::class, 'index']);
        Route::get('/courses/{course}/sections/{section}/lessons/export', [CourseLessonController::class, 'export']);
        Route::post('/courses/{course}/sections/{section}/lessons', [CourseLessonController::class, 'store']);
        Route::post('/courses/{course}/sections/{section}/lessons/reorder', [CourseLessonController::class, 'reorder']);
        Route::get('/courses/{course}/sections/{section}/lessons/{lesson}', [CourseLessonController::class, 'show']);
        Route::put('/courses/{course}/sections/{section}/lessons/{lesson}', [CourseLessonController::class, 'update']);
        Route::patch('/courses/{course}/sections/{section}/lessons/{lesson}/status', [CourseLessonController::class, 'updateStatus']);
        Route::patch('/courses/{course}/sections/{section}/lessons/{lesson}/publish', [CourseLessonController::class, 'publish']);
        Route::patch('/courses/{course}/sections/{section}/lessons/{lesson}/archive', [CourseLessonController::class, 'archive']);
        Route::post('/courses/{course}/sections/{section}/lessons/{lesson}/feature', [CourseLessonController::class, 'feature']);
        Route::post('/courses/{course}/sections/{section}/lessons/{lesson}/free-preview', [CourseLessonController::class, 'freePreview']);
        Route::post('/courses/{course}/sections/{section}/lessons/{lesson}/move', [CourseLessonController::class, 'move']);
        Route::post('/courses/{course}/sections/{section}/lessons/{lesson}/restore', [CourseLessonController::class, 'restore']);
        Route::post('/courses/{course}/sections/{section}/lessons/{lesson}/duplicate', [CourseLessonController::class, 'duplicate']);
        Route::delete('/courses/{course}/sections/{section}/lessons/{lesson}', [CourseLessonController::class, 'destroy']);
        Route::get('/courses/{course}/sections/{section}/lessons/{lesson}/video', [LessonVideoController::class, 'show']);
        Route::post('/courses/{course}/sections/{section}/lessons/{lesson}/video', [LessonVideoController::class, 'store']);
        Route::match(['put', 'patch'], '/courses/{course}/sections/{section}/lessons/{lesson}/video', [LessonVideoController::class, 'update']);
        Route::delete('/courses/{course}/sections/{section}/lessons/{lesson}/video', [LessonVideoController::class, 'destroy']);
        Route::get('/courses/{course}/sections/{section}/lessons/{lesson}/files', [LessonFileController::class, 'index']);
        Route::post('/courses/{course}/sections/{section}/lessons/{lesson}/files', [LessonFileController::class, 'store']);
        Route::match(['put', 'patch'], '/courses/{course}/sections/{section}/lessons/{lesson}/files/{file}', [LessonFileController::class, 'update']);
        Route::delete('/courses/{course}/sections/{section}/lessons/{lesson}/files/{file}', [LessonFileController::class, 'destroy']);
        Route::get('/courses/{course}/sections/{section}/lessons/{lesson}/text', [LessonTextController::class, 'show']);
        Route::post('/courses/{course}/sections/{section}/lessons/{lesson}/text', [LessonTextController::class, 'store']);
        Route::match(['put', 'patch'], '/courses/{course}/sections/{section}/lessons/{lesson}/text', [LessonTextController::class, 'update']);
        Route::delete('/courses/{course}/sections/{section}/lessons/{lesson}/text', [LessonTextController::class, 'destroy']);
        Route::get('/courses/{course}/sections/{section}/lessons/{lesson}/quiz', [LessonQuizController::class, 'show']);
        Route::post('/courses/{course}/sections/{section}/lessons/{lesson}/quiz', [LessonQuizController::class, 'store']);
        Route::put('/courses/{course}/sections/{section}/lessons/{lesson}/quiz', [LessonQuizController::class, 'update']);
        Route::patch('/courses/{course}/sections/{section}/lessons/{lesson}/quiz/status', [LessonQuizController::class, 'updateStatus']);
        Route::delete('/courses/{course}/sections/{section}/lessons/{lesson}/quiz', [LessonQuizController::class, 'destroy']);
        Route::post('/quizzes/{quiz}/questions', [QuizQuestionController::class, 'store']);
        Route::put('/quizzes/{quiz}/questions/{question}', [QuizQuestionController::class, 'update']);
        Route::delete('/quizzes/{quiz}/questions/{question}', [QuizQuestionController::class, 'destroy']);
        Route::post('/quizzes/{quiz}/attempts/start', [QuizAttemptController::class, 'start']);
        Route::post('/quizzes/{quiz}/attempts/{attempt}/submit', [QuizAttemptController::class, 'submit']);
        Route::get('/quizzes/{quiz}/results/me', [QuizResultController::class, 'me']);
        Route::get('/courses/{course}/sections/{section}/lessons/{lesson}/assignment', [LessonAssignmentController::class, 'show']);
        Route::post('/courses/{course}/sections/{section}/lessons/{lesson}/assignment', [LessonAssignmentController::class, 'store']);
        Route::put('/courses/{course}/sections/{section}/lessons/{lesson}/assignment', [LessonAssignmentController::class, 'update']);
        Route::patch('/courses/{course}/sections/{section}/lessons/{lesson}/assignment/status', [LessonAssignmentController::class, 'updateStatus']);
        Route::delete('/courses/{course}/sections/{section}/lessons/{lesson}/assignment', [LessonAssignmentController::class, 'destroy']);
        Route::post('/assignments/{assignment}/submissions', [AssignmentSubmissionController::class, 'store']);
        Route::post('/assignments/{assignment}/submissions/{submission}/files', [AssignmentSubmissionController::class, 'attachFile']);
        Route::post('/assignments/{assignment}/submissions/{submission}/submit', [AssignmentSubmissionController::class, 'submit']);
        Route::post('/assignments/{assignment}/submissions/{submission}/grade', [AssignmentGradingController::class, 'grade']);
        Route::get('/assignments/{assignment}/results/me', [AssignmentResultController::class, 'me']);

        Route::get('/discussions', [DiscussionThreadController::class, 'index']);
        Route::post('/discussions', [DiscussionThreadController::class, 'store']);
        Route::get('/discussions/reports', [DiscussionReportController::class, 'index']);
        Route::patch('/discussions/reports/{report}/resolve', [DiscussionReportController::class, 'resolve']);
        Route::patch('/discussions/reports/{report}/dismiss', [DiscussionReportController::class, 'dismiss']);
        Route::get('/discussions/{thread}', [DiscussionThreadController::class, 'show']);
        Route::put('/discussions/{thread}', [DiscussionThreadController::class, 'update']);
        Route::patch('/discussions/{thread}/lock', [DiscussionThreadController::class, 'lock']);
        Route::patch('/discussions/{thread}/unlock', [DiscussionThreadController::class, 'unlock']);
        Route::patch('/discussions/{thread}/pin', [DiscussionThreadController::class, 'pin']);
        Route::patch('/discussions/{thread}/unpin', [DiscussionThreadController::class, 'unpin']);
        Route::patch('/discussions/{thread}/archive', [DiscussionThreadController::class, 'archive']);
        Route::get('/discussions/{thread}/posts', [DiscussionPostController::class, 'index']);
        Route::post('/discussions/{thread}/posts', [DiscussionPostController::class, 'store']);
        Route::put('/discussions/{thread}/posts/{post}', [DiscussionPostController::class, 'update']);
        Route::delete('/discussions/{thread}/posts/{post}', [DiscussionPostController::class, 'destroy']);
        Route::post('/discussions/posts/{post}/report', [DiscussionReportController::class, 'store']);

        Route::get('/audit-logs', [AuditLogController::class, 'index']);
        Route::get('/audit-logs/entity', [AuditLogController::class, 'entity']);
        Route::get('/activity-logs', [ActivityLogController::class, 'index']);
        Route::get('/activity-logs/me', [ActivityLogController::class, 'me']);

        Route::get('/users/metrics', [TenantUserController::class, 'metrics']);
        Route::get('/users/export', [TenantUserController::class, 'export']);
        Route::post('/users/bulk/delete', [TenantUserController::class, 'bulkDelete']);
        Route::post('/users/bulk/restore', [TenantUserController::class, 'bulkRestore']);
        Route::post('/users/bulk/activate', [TenantUserController::class, 'bulkActivate']);
        Route::post('/users/bulk/suspend', [TenantUserController::class, 'bulkSuspend']);
        Route::post('/users/{user}/restore', [TenantUserController::class, 'restore']);
        Route::post('/users/{user}/activate', [TenantUserController::class, 'activate']);
        Route::post('/users/{user}/suspend', [TenantUserController::class, 'suspend']);
        Route::post('/users/{user}/reset-password', [TenantUserController::class, 'resetPassword']);
        Route::post('/users/{user}/force-logout', [TenantUserController::class, 'forceLogout']);
        Route::get('/users/{user}/activities', [TenantUserController::class, 'activities']);
        Route::get('/users/{user}/sessions', [TenantUserController::class, 'sessions']);
        Route::delete('/users/{user}/sessions/{session}', [TenantUserController::class, 'revokeSession']);
        Route::get('/users', [TenantUserController::class, 'index']);
        Route::post('/users', [TenantUserController::class, 'store']);
        Route::get('/users/{user}', [TenantUserController::class, 'show']);
        Route::put('/users/{user}', [TenantUserController::class, 'update']);
        Route::patch('/users/{user}', [TenantUserController::class, 'update']);
        Route::delete('/users/{user}', [TenantUserController::class, 'destroy']);
        Route::get('/permissions', [RoleController::class, 'permissions']);
        Route::get('/permissions/matrix', [MatrixController::class, 'index']);
        Route::put('/permissions/matrix', [MatrixController::class, 'update']);
        Route::post('/permissions/matrix/clone', [MatrixController::class, 'clone']);
        Route::apiResource('roles', RoleController::class);

        Route::get('/settings', [TenantSettingController::class, 'index']);
        Route::get('/settings/{group}', [TenantSettingController::class, 'show']);
        Route::put('/settings/{group}', [TenantSettingController::class, 'update']);

        Route::apiResource('teacher/news', NewsController::class)->names('teacher.news');
        Route::post('/teacher/news/reorder', [NewsController::class, 'reorder']);

        Route::apiResource('teacher/educational-stages', EducationalStageController::class)->names('teacher.educational-stages');
        Route::post('/teacher/educational-stages/reorder', [EducationalStageController::class, 'reorder']);

        Route::apiResource('teacher/subjects', SubjectController::class)->names('teacher.subjects');
        Route::post('/teacher/subjects/reorder', [SubjectController::class, 'reorder']);

        // Teacher recharge codes (wallet top-ups)
        Route::apiResource('teacher/recharge-codes', RechargeCodeController::class)->names('teacher.recharge-codes');
        Route::post('/teacher/recharge-codes/generate', [RechargeCodeController::class, 'generate']);
        Route::patch('/teacher/recharge-codes/{rechargeCode}/status', [RechargeCodeController::class, 'toggleStatus']);

        Route::get('/domains', [TenantDomainController::class, 'index']);
        Route::post('/domains', [TenantDomainController::class, 'store']);
        Route::put('/domains/{tenantDomain}', [TenantDomainController::class, 'update']);
        Route::post('/domains/{tenantDomain}/verify', [TenantDomainController::class, 'verify']);
        Route::delete('/domains/{tenantDomain}', [TenantDomainController::class, 'destroy']);

        Route::get('/integrations', [TenantIntegrationController::class, 'index']);
        Route::post('/integrations', [TenantIntegrationController::class, 'store']);
        Route::put('/integrations/{tenantIntegration}', [TenantIntegrationController::class, 'update']);
        Route::delete('/integrations/{tenantIntegration}', [TenantIntegrationController::class, 'destroy']);

        // Exam Bank routes
        Route::prefix('exam-bank')->name('exam-bank.')->group(function () {
            Route::get('/questions/metrics', [QuestionController::class, 'metrics']);
            Route::apiResource('questions', QuestionController::class);
            Route::post('/questions/bulk/delete', [QuestionController::class, 'bulkDelete']);
            Route::post('/questions/bulk/restore', [QuestionController::class, 'bulkRestore']);
            Route::post('/questions/bulk/duplicate', [QuestionController::class, 'bulkDuplicate']);
            Route::post('/questions/bulk/archive', [QuestionController::class, 'bulkArchive']);
            Route::post('/questions/bulk/move-category', [QuestionController::class, 'bulkMoveCategory']);

            Route::get('/categories/tree', [QuestionCategoryController::class, 'tree']);
            Route::apiResource('categories', QuestionCategoryController::class);
            Route::post('/categories/{category}/restore', [QuestionCategoryController::class, 'restore']);

            Route::apiResource('banks', QuestionBankController::class);
            Route::patch('/banks/{bank}/status', [QuestionBankController::class, 'updateStatus']);
            Route::post('/banks/{bank}/restore', [QuestionBankController::class, 'restore']);

            Route::get('/exams/metrics', [ExamController::class, 'metrics']);
            Route::get('/exams/recent', [ExamController::class, 'recent']);
            Route::get('/exams/pinned', [ExamController::class, 'pinned']);
            Route::get('/exams/favorites', [ExamController::class, 'favorites']);
            Route::apiResource('exams', ExamController::class);
            Route::patch('/exams/{exam}/status', [ExamController::class, 'updateStatus']);
            Route::patch('/exams/{exam}/publish', [ExamController::class, 'publish']);
            Route::patch('/exams/{exam}/archive', [ExamController::class, 'archive']);
            Route::post('/exams/{exam}/restore', [ExamController::class, 'restore']);
            Route::post('/exams/{exam}/duplicate', [ExamController::class, 'duplicate']);
            Route::post('/exams/{exam}/pin', [ExamController::class, 'togglePinned']);
            Route::post('/exams/{exam}/feature', [ExamController::class, 'toggleFeatured']);
            Route::post('/exams/{exam}/favorite', [ExamController::class, 'toggleFavorite']);
            Route::post('/exams/bulk/delete', [ExamController::class, 'bulkDelete']);
            Route::post('/exams/bulk/restore', [ExamController::class, 'bulkRestore']);
            Route::post('/exams/bulk/duplicate', [ExamController::class, 'bulkDuplicate']);
            Route::post('/exams/bulk/archive', [ExamController::class, 'bulkArchive']);
            Route::post('/exams/bulk/publish', [ExamController::class, 'bulkPublish']);

            Route::get('/exams/{exam}/questions', [ExamController::class, 'questions']);
            Route::post('/exams/{exam}/questions', [ExamController::class, 'addQuestion']);
            Route::put('/exams/{exam}/questions', [ExamController::class, 'setQuestions']);
            Route::post('/exams/{exam}/questions/reorder', [ExamController::class, 'reorderQuestions']);
            Route::put('/exams/{exam}/questions/{question}', [ExamController::class, 'updateQuestionLink']);
            Route::delete('/exams/{exam}/questions/{question}', [ExamController::class, 'removeQuestion']);

            Route::get('/analytics/overview', [ExamAnalyticsController::class, 'overview']);
            Route::get('/exams/{exam}/analytics', [ExamAnalyticsController::class, 'exam']);
        });

        Route::get('/categories/tree', [CategoryController::class, 'tree']);
        Route::get('/categories/metrics', [CategoryController::class, 'metrics']);
        Route::get('/categories/export', [CategoryController::class, 'export']);
        Route::post('/categories/{category}/restore', [CategoryController::class, 'restore']);
        Route::post('/categories/{category}/force-delete', [CategoryController::class, 'forceDelete']);
        Route::post('/categories/{category}/duplicate', [CategoryController::class, 'duplicate']);
        Route::post('/categories/{category}/feature', [CategoryController::class, 'feature']);
        Route::post('/categories/{category}/activate', [CategoryController::class, 'activate']);
        Route::apiResource('categories', CategoryController::class);
        Route::apiResource('tags', TagController::class);
    });
});

Route::middleware(['auth:sanctum', 'platform.token', 'platform.admin'])
    ->prefix('platform')
    ->group(function () {
        Route::get('/tenants', [TenantController::class, 'index']);
        Route::post('/tenants', [TenantController::class, 'store']);
        Route::get('/tenants/{tenant}', [TenantController::class, 'show']);
        Route::put('/tenants/{tenant}', [TenantController::class, 'update']);
        Route::delete('/tenants/{tenant}', [TenantController::class, 'destroy']);
        Route::post('/tenants/bulk/delete', [TenantController::class, 'bulkDestroy']);
        Route::get('/audit-logs', [PlatformAuditController::class, 'index']);
        Route::apiResource('admins', PlatformAdminController::class);

        Route::prefix('bunny-settings')->group(function () {
            Route::get('/', [PlatformBunnySettingController::class, 'index']);
            Route::get('/health', [PlatformBunnySettingController::class, 'health']);
            Route::post('/verify', [PlatformBunnySettingController::class, 'verify']);
            Route::post('/rotate-secrets', [PlatformBunnySettingController::class, 'rotate']);
            Route::post('/reveal', [PlatformBunnySettingController::class, 'reveal']);
            Route::post('/disable', [PlatformBunnySettingController::class, 'disable']);
            Route::post('/reset', [PlatformBunnySettingController::class, 'reset']);
            Route::delete('/credentials', [PlatformBunnySettingController::class, 'deleteCredentials']);
            Route::put('/', [PlatformBunnySettingController::class, 'update']);
        });

        Route::prefix('usage')->group(function () {
            Route::get('/tenants/{tenant}/current', [UsageController::class, 'current']);
            Route::get('/tenants/{tenant}/history', [UsageController::class, 'history']);
            Route::get('/tenants/{tenant}/snapshot', [UsageController::class, 'snapshot']);
            Route::get('/tenants/{tenant}/quota', [UsageController::class, 'quota']);
            Route::get('/tenants/{tenant}/remaining', [UsageController::class, 'remaining']);
            Route::get('/tenants/{tenant}/sync-status', [UsageController::class, 'syncStatus']);
            Route::post('/tenants/{tenant}/sync', [UsageController::class, 'sync']);
            Route::get('/tenants/{tenant}/verify', [UsageController::class, 'verify']);
        });

        Route::prefix('bunny-center')->group(function () {
            Route::get('/metrics', [BunnyCenterController::class, 'metrics']);
            Route::get('/health', [BunnyCenterController::class, 'health']);
            Route::get('/usage-report', [BunnyCenterController::class, 'usageReport']);
            Route::get('/top-consumers', [BunnyCenterController::class, 'topConsumers']);
            Route::get('/alerts', [BunnyCenterController::class, 'alerts']);
            Route::get('/sync-jobs', [BunnyCenterController::class, 'syncJobs']);
            Route::get('/tenants', [BunnyCenterController::class, 'tenants']);
            Route::get('/storage-history', [BunnyCenterController::class, 'storageHistory']);
            Route::get('/bandwidth-history', [BunnyCenterController::class, 'bandwidthHistory']);
            Route::get('/views-history', [BunnyCenterController::class, 'viewsHistory']);
        });

        Route::prefix('domains')->group(function () {
            Route::get('/', [PlatformDomainController::class, 'index']);
            Route::post('/', [PlatformDomainController::class, 'store']);
            Route::get('/{tenantDomain}', [PlatformDomainController::class, 'show']);
            Route::put('/{tenantDomain}', [PlatformDomainController::class, 'update']);
            Route::delete('/{tenantDomain}', [PlatformDomainController::class, 'destroy']);
            Route::post('/{tenantDomain}/verify', [PlatformDomainController::class, 'verify']);
            Route::post('/{tenantDomain}/refresh-status', [PlatformDomainController::class, 'refreshStatus']);
            Route::post('/{tenantDomain}/renew-ssl', [PlatformDomainController::class, 'renewSsl']);
            Route::post('/bulk/delete', [PlatformDomainController::class, 'bulkDelete']);
        });
    });

Route::get('/diag/ping', function () {
    return response()->json(['ok' => true, 'time' => now()->toIso8601String()]);
});

use App\Http\Controllers\Api\v1\Platform\BunnyDebugController;

Route::post('/diag/bunny-test', [BunnyDebugController::class, 'test']);
