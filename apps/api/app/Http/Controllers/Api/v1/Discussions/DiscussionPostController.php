<?php

namespace App\Http\Controllers\Api\v1\Discussions;

use App\Http\Controllers\Controller;
use App\Models\DiscussionPost;
use App\Models\DiscussionThread;
use App\Models\TenantUser;
use App\Policies\DiscussionPolicy;
use App\Services\Discussions\DiscussionParticipantService;
use App\Services\Discussions\DiscussionPostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiscussionPostController extends Controller
{
    public function index(
        Request $request,
        DiscussionThread $thread,
        DiscussionPostService $posts,
        DiscussionPolicy $policy,
    ): JsonResponse {
        abort_if($thread->tenant_id !== currentTenant()->id, 404);
        abort_unless($policy->viewThread(app(TenantUser::class), currentTenant(), $thread), 403);

        $includeModerated = $policy->viewModeratedPosts(app(TenantUser::class), currentTenant(), $thread);

        $page = $posts->list(currentTenant(), $thread, $includeModerated, (int) $request->input('per_page', 50));

        return response()->json([
            'posts' => $page->items(),
            'total' => $page->total(),
            'current_page' => $page->currentPage(),
            'last_page' => $page->lastPage(),
            'per_page' => $page->perPage(),
        ]);
    }

    public function store(
        Request $request,
        DiscussionThread $thread,
        DiscussionPostService $posts,
        DiscussionParticipantService $participants,
        DiscussionPolicy $policy,
    ): JsonResponse {
        abort_if($thread->tenant_id !== currentTenant()->id, 404);
        abort_unless($policy->viewThread(app(TenantUser::class), currentTenant(), $thread), 403);
        abort_unless($policy->createPost(app(TenantUser::class), currentTenant(), $thread), 403);

        $validated = $request->validate([
            'body' => ['required', 'string'],
            'parent_post_id' => ['nullable', 'integer'],
            'metadata' => ['sometimes', 'array'],
        ]);

        $author = app(TenantUser::class);
        $post = $posts->create(currentTenant(), $thread, $author, $validated);
        $participants->track($thread, $author);

        return response()->json([
            'message' => 'Discussion post created.',
            'post' => $post,
        ], 201);
    }

    public function update(
        Request $request,
        DiscussionThread $thread,
        DiscussionPost $post,
        DiscussionPostService $posts,
        DiscussionPolicy $policy,
    ): JsonResponse {
        abort_if($thread->tenant_id !== currentTenant()->id, 404);
        abort_if($post->tenant_id !== currentTenant()->id || $post->discussion_thread_id !== $thread->id, 404);
        abort_unless($policy->viewThread(app(TenantUser::class), currentTenant(), $thread), 403);
        abort_unless($policy->updatePost(app(TenantUser::class), currentTenant(), $post), 403);

        $validated = $request->validate([
            'body' => ['required', 'string'],
        ]);

        return response()->json([
            'message' => 'Discussion post updated.',
            'post' => $posts->update(currentTenant(), $post, app(TenantUser::class), $validated),
        ]);
    }

    public function destroy(
        DiscussionThread $thread,
        DiscussionPost $post,
        DiscussionPostService $posts,
        DiscussionPolicy $policy,
    ): JsonResponse {
        abort_if($thread->tenant_id !== currentTenant()->id, 404);
        abort_if($post->tenant_id !== currentTenant()->id || $post->discussion_thread_id !== $thread->id, 404);
        abort_unless($policy->viewThread(app(TenantUser::class), currentTenant(), $thread), 403);

        $actor = app(TenantUser::class);

        if (! $policy->updatePost($actor, currentTenant(), $post) && ! $policy->moderatePost($actor, currentTenant(), $post)) {
            abort(403);
        }

        return response()->json([
            'message' => 'Discussion post deleted.',
            'post' => $posts->delete(currentTenant(), $post, $actor),
        ]);
    }
}
