<?php

namespace App\Http\Controllers\Api\v1\Quizzes;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\TenantUser;
use App\Services\Access\AccessEvaluationService;
use App\Services\Authorization\TenantAuthorizationService;
use Illuminate\Http\JsonResponse;

class QuizResultController extends Controller
{
    public function me(Quiz $quiz, AccessEvaluationService $access): JsonResponse
    {
        abort_if($quiz->tenant_id !== currentTenant()->id, 404);

        $user = request()->user();
        $authorization = app(TenantAuthorizationService::class);

        abort_unless(
            $authorization->hasRole($user, currentTenant(), 'student')
            && $access->canAccessLesson($user, $quiz->lesson),
            403,
        );

        return response()->json([
            'result' => $quiz->results()
                ->where('tenant_user_id', app(TenantUser::class)->id)
                ->first(),
        ]);
    }
}
