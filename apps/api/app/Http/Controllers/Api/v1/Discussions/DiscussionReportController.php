<?php

namespace App\Http\Controllers\Api\v1\Discussions;

use App\Http\Controllers\Controller;
use App\Models\DiscussionPost;
use App\Models\DiscussionReport;
use App\Models\TenantUser;
use App\Policies\DiscussionPolicy;
use App\Services\Discussions\DiscussionModerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiscussionReportController extends Controller
{
    public function index(Request $request, DiscussionModerationService $moderation, DiscussionPolicy $policy): JsonResponse
    {
        abort_unless($policy->reviewReports(app(TenantUser::class), currentTenant()), 403);

        $filters = $this->validateFilters($request);

        return response()->json([
            'reports' => $moderation->listReports(currentTenant(), $filters),
        ]);
    }

    public function store(
        Request $request,
        DiscussionPost $post,
        DiscussionModerationService $moderation,
        DiscussionPolicy $policy,
    ): JsonResponse {
        abort_if($post->tenant_id !== currentTenant()->id, 404);
        abort_unless($policy->reportPost(app(TenantUser::class), currentTenant(), $post), 403);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:255'],
            'note' => ['nullable', 'string'],
            'metadata' => ['sometimes', 'array'],
        ]);

        $report = $moderation->report(currentTenant(), $post, app(TenantUser::class), $validated);

        // Reporter identity must never be exposed to other members.
        return response()->json([
            'message' => 'Discussion post reported.',
            'report' => $report->makeHidden(['reported_by_tenant_user_id']),
        ], 201);
    }

    public function resolve(
        DiscussionReport $report,
        DiscussionModerationService $moderation,
        DiscussionPolicy $policy,
    ): JsonResponse {
        abort_if($report->tenant_id !== currentTenant()->id, 404);
        abort_unless($policy->reviewReports(app(TenantUser::class), currentTenant(), $report), 403);

        return response()->json([
            'message' => 'Discussion report resolved.',
            'report' => $moderation->resolveReport(currentTenant(), $report, app(TenantUser::class)),
        ]);
    }

    public function dismiss(
        DiscussionReport $report,
        DiscussionModerationService $moderation,
        DiscussionPolicy $policy,
    ): JsonResponse {
        abort_if($report->tenant_id !== currentTenant()->id, 404);
        abort_unless($policy->reviewReports(app(TenantUser::class), currentTenant(), $report), 403);

        return response()->json([
            'message' => 'Discussion report dismissed.',
            'report' => $moderation->dismissReport(currentTenant(), $report, app(TenantUser::class)),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateFilters(Request $request): array
    {
        return $request->validate([
            'status' => ['sometimes', 'string', 'in:pending,resolved,dismissed'],
        ]);
    }
}
