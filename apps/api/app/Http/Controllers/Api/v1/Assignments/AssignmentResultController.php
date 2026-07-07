<?php

namespace App\Http\Controllers\Api\v1\Assignments;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\TenantUser;
use App\Services\Access\AccessEvaluationService;
use App\Services\Authorization\TenantAuthorizationService;
use Illuminate\Http\JsonResponse;

class AssignmentResultController extends Controller
{
    public function me(Assignment $assignment, AccessEvaluationService $access): JsonResponse
    {
        abort_if($assignment->tenant_id !== currentTenant()->id, 404);

        $user = request()->user();
        $authorization = app(TenantAuthorizationService::class);

        abort_unless(
            $authorization->hasRole($user, currentTenant(), 'student')
            && $access->canAccessLesson($user, $assignment->lesson),
            403,
        );

        return response()->json([
            'result' => $assignment->results()
                ->where('tenant_user_id', app(TenantUser::class)->id)
                ->first(),
        ]);
    }
}
