<?php

namespace App\Http\Controllers\Api\v1\Discussions;

use App\Http\Controllers\Controller;
use App\Models\DiscussionThread;
use App\Models\TenantUser;
use App\Policies\DiscussionPolicy;
use App\Services\Discussions\DiscussionThreadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DiscussionThreadController extends Controller
{
    public function index(Request $request, DiscussionThreadService $threads): JsonResponse
    {
        $filters = $this->validateFilters($request);

        $page = $threads->list(
            currentTenant(),
            app(TenantUser::class),
            $filters,
            (int) $request->input('per_page', 25),
        );

        return response()->json([
            'threads' => $page->items(),
            'total' => $page->total(),
            'current_page' => $page->currentPage(),
            'last_page' => $page->lastPage(),
            'per_page' => $page->perPage(),
        ]);
    }

    public function store(Request $request, DiscussionThreadService $threads, DiscussionPolicy $policy): JsonResponse
    {
        abort_unless($policy->createThread(app(TenantUser::class), currentTenant()), 403);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'type' => ['sometimes', Rule::in(['course', 'lesson', 'general'])],
            'course_id' => ['nullable', 'integer'],
            'course_section_id' => ['nullable', 'integer'],
            'course_lesson_id' => ['nullable', 'integer'],
            'metadata' => ['sometimes', 'array'],
        ]);

        $thread = $threads->create(currentTenant(), app(TenantUser::class), $validated);

        return response()->json([
            'message' => 'Discussion thread created.',
            'thread' => $thread,
        ], 201);
    }

    public function show(DiscussionThread $thread, DiscussionThreadService $threads, DiscussionPolicy $policy): JsonResponse
    {
        abort_if($thread->tenant_id !== currentTenant()->id, 404);
        abort_unless($policy->viewThread(app(TenantUser::class), currentTenant(), $thread), 403);

        return response()->json([
            'thread' => $threads->show(currentTenant(), $thread),
        ]);
    }

    public function update(
        Request $request,
        DiscussionThread $thread,
        DiscussionThreadService $threads,
        DiscussionPolicy $policy,
    ): JsonResponse {
        abort_if($thread->tenant_id !== currentTenant()->id, 404);
        abort_unless($policy->manageThread(app(TenantUser::class), currentTenant(), $thread), 403);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
        ]);

        return response()->json([
            'message' => 'Discussion thread updated.',
            'thread' => $threads->update(currentTenant(), $thread, $validated),
        ]);
    }

    public function lock(DiscussionThread $thread, DiscussionThreadService $threads, DiscussionPolicy $policy): JsonResponse
    {
        abort_if($thread->tenant_id !== currentTenant()->id, 404);
        abort_unless($policy->manageThread(app(TenantUser::class), currentTenant(), $thread), 403);

        return response()->json([
            'message' => 'Discussion thread locked.',
            'thread' => $threads->lock(currentTenant(), $thread, app(TenantUser::class)),
        ]);
    }

    public function unlock(DiscussionThread $thread, DiscussionThreadService $threads, DiscussionPolicy $policy): JsonResponse
    {
        abort_if($thread->tenant_id !== currentTenant()->id, 404);
        abort_unless($policy->manageThread(app(TenantUser::class), currentTenant(), $thread), 403);

        return response()->json([
            'message' => 'Discussion thread unlocked.',
            'thread' => $threads->unlock(currentTenant(), $thread, app(TenantUser::class)),
        ]);
    }

    public function pin(DiscussionThread $thread, DiscussionThreadService $threads, DiscussionPolicy $policy): JsonResponse
    {
        abort_if($thread->tenant_id !== currentTenant()->id, 404);
        abort_unless($policy->manageThread(app(TenantUser::class), currentTenant(), $thread), 403);

        return response()->json([
            'message' => 'Discussion thread pinned.',
            'thread' => $threads->pin(currentTenant(), $thread, app(TenantUser::class)),
        ]);
    }

    public function unpin(DiscussionThread $thread, DiscussionThreadService $threads, DiscussionPolicy $policy): JsonResponse
    {
        abort_if($thread->tenant_id !== currentTenant()->id, 404);
        abort_unless($policy->manageThread(app(TenantUser::class), currentTenant(), $thread), 403);

        return response()->json([
            'message' => 'Discussion thread unpinned.',
            'thread' => $threads->unpin(currentTenant(), $thread, app(TenantUser::class)),
        ]);
    }

    public function archive(DiscussionThread $thread, DiscussionThreadService $threads, DiscussionPolicy $policy): JsonResponse
    {
        abort_if($thread->tenant_id !== currentTenant()->id, 404);
        abort_unless($policy->manageThread(app(TenantUser::class), currentTenant(), $thread), 403);

        return response()->json([
            'message' => 'Discussion thread archived.',
            'thread' => $threads->archive(currentTenant(), $thread, app(TenantUser::class)),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateFilters(Request $request): array
    {
        return $request->validate([
            'course_id' => ['sometimes', 'integer'],
            'course_lesson_id' => ['sometimes', 'integer'],
            'type' => ['sometimes', Rule::in(['course', 'lesson', 'general'])],
            'include_archived' => ['sometimes', 'boolean'],
        ]);
    }
}
