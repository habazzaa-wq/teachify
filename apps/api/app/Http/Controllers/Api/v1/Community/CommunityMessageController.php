<?php

namespace App\Http\Controllers\Api\v1\Community;

use App\Http\Controllers\Controller;
use App\Http\Requests\Community\CommunityMessageListRequest;
use App\Http\Requests\Community\MarkCommunityReadRequest;
use App\Http\Requests\Community\StoreCommunityMessageRequest;
use App\Http\Requests\Community\UpdateCommunityMessageRequest;
use App\Http\Resources\Community\CommunityMessageResource;
use App\Models\CommunityChannel;
use App\Models\CommunityMessage;
use App\Models\TenantUser;
use App\Policies\CommunityChannelPolicy;
use App\Policies\CommunityMessagePolicy;
use App\Services\Community\CommunityMessageService;
use App\Services\Community\CommunityReadReceiptService;
use Illuminate\Http\JsonResponse;

class CommunityMessageController extends Controller
{
    public function index(
        CommunityMessageListRequest $request,
        CommunityChannel $channel,
        CommunityMessageService $messages,
        CommunityChannelPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        abort_unless($policy->viewMessages(app(TenantUser::class), $tenant, $channel), 403);

        return response()->json([
            'messages' => CommunityMessageResource::collection(
                $messages->list($tenant, $channel, app(TenantUser::class), $request->validated()),
            ),
        ]);
    }

    public function store(
        StoreCommunityMessageRequest $request,
        CommunityChannel $channel,
        CommunityMessageService $messages,
        CommunityMessagePolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        abort_unless($policy->create(app(TenantUser::class), $tenant, $channel), 403);

        $message = $messages->create($tenant, $channel, app(TenantUser::class), $request->validated());

        return response()->json([
            'message' => new CommunityMessageResource($message),
        ], 201);
    }

    public function show(
        CommunityMessage $message,
        CommunityMessagePolicy $policy,
    ): JsonResponse {
        abort_unless($policy->view(app(TenantUser::class), currentTenant(), $message), 403);

        return response()->json([
            'message' => new CommunityMessageResource($this->loadRelations($message)),
        ]);
    }

    public function update(
        UpdateCommunityMessageRequest $request,
        CommunityMessage $message,
        CommunityMessageService $messages,
        CommunityMessagePolicy $policy,
    ): JsonResponse {
        abort_unless($policy->update(app(TenantUser::class), currentTenant(), $message), 403);

        return response()->json([
            'message' => new CommunityMessageResource(
                $messages->update(currentTenant(), $message, app(TenantUser::class), $request->validated()),
            ),
        ]);
    }

    public function destroy(
        CommunityMessage $message,
        CommunityMessageService $messages,
        CommunityMessagePolicy $policy,
    ): JsonResponse {
        abort_unless($policy->delete(app(TenantUser::class), currentTenant(), $message), 403);

        $messages->delete(currentTenant(), $message, app(TenantUser::class));

        return response()->json(['message' => 'Message deleted.']);
    }

    public function pin(
        CommunityMessage $message,
        CommunityMessageService $messages,
        CommunityMessagePolicy $policy,
    ): JsonResponse {
        abort_unless($policy->moderate(app(TenantUser::class), currentTenant(), $message), 403);

        return response()->json([
            'message' => new CommunityMessageResource(
                $messages->pin(currentTenant(), $message, app(TenantUser::class), true),
            ),
        ]);
    }

    public function unpin(
        CommunityMessage $message,
        CommunityMessageService $messages,
        CommunityMessagePolicy $policy,
    ): JsonResponse {
        abort_unless($policy->moderate(app(TenantUser::class), currentTenant(), $message), 403);

        return response()->json([
            'message' => new CommunityMessageResource(
                $messages->pin(currentTenant(), $message, app(TenantUser::class), false),
            ),
        ]);
    }

    public function highlight(
        CommunityMessage $message,
        CommunityMessageService $messages,
        CommunityMessagePolicy $policy,
    ): JsonResponse {
        abort_unless($policy->moderate(app(TenantUser::class), currentTenant(), $message), 403);

        return response()->json([
            'message' => new CommunityMessageResource(
                $messages->highlight(currentTenant(), $message, app(TenantUser::class), true),
            ),
        ]);
    }

    public function unhighlight(
        CommunityMessage $message,
        CommunityMessageService $messages,
        CommunityMessagePolicy $policy,
    ): JsonResponse {
        abort_unless($policy->moderate(app(TenantUser::class), currentTenant(), $message), 403);

        return response()->json([
            'message' => new CommunityMessageResource(
                $messages->highlight(currentTenant(), $message, app(TenantUser::class), false),
            ),
        ]);
    }

    public function official(
        CommunityMessage $message,
        CommunityMessageService $messages,
        CommunityMessagePolicy $policy,
    ): JsonResponse {
        abort_unless($policy->moderate(app(TenantUser::class), currentTenant(), $message), 403);

        return response()->json([
            'message' => new CommunityMessageResource(
                $messages->markOfficialAnswer(currentTenant(), $message, app(TenantUser::class), true),
            ),
        ]);
    }

    public function removeOfficial(
        CommunityMessage $message,
        CommunityMessageService $messages,
        CommunityMessagePolicy $policy,
    ): JsonResponse {
        abort_unless($policy->moderate(app(TenantUser::class), currentTenant(), $message), 403);

        return response()->json([
            'message' => new CommunityMessageResource(
                $messages->markOfficialAnswer(currentTenant(), $message, app(TenantUser::class), false),
            ),
        ]);
    }

    public function solve(
        CommunityMessage $message,
        CommunityMessageService $messages,
        CommunityMessagePolicy $policy,
    ): JsonResponse {
        abort_unless($policy->resolve(app(TenantUser::class), currentTenant(), $message), 403);

        return response()->json([
            'message' => new CommunityMessageResource(
                $messages->markSolved(currentTenant(), $message, app(TenantUser::class), true),
            ),
        ]);
    }

    public function unsolve(
        CommunityMessage $message,
        CommunityMessageService $messages,
        CommunityMessagePolicy $policy,
    ): JsonResponse {
        abort_unless($policy->resolve(app(TenantUser::class), currentTenant(), $message), 403);

        return response()->json([
            'message' => new CommunityMessageResource(
                $messages->markSolved(currentTenant(), $message, app(TenantUser::class), false),
            ),
        ]);
    }

    public function accept(
        CommunityMessage $message,
        CommunityMessageService $messages,
        CommunityMessagePolicy $policy,
    ): JsonResponse {
        abort_unless($policy->accept(app(TenantUser::class), currentTenant(), $message), 403);

        return response()->json([
            'message' => new CommunityMessageResource(
                $messages->markAcceptedAnswer(currentTenant(), $message, app(TenantUser::class), true),
            ),
        ]);
    }

    public function unaccept(
        CommunityMessage $message,
        CommunityMessageService $messages,
        CommunityMessagePolicy $policy,
    ): JsonResponse {
        abort_unless($policy->accept(app(TenantUser::class), currentTenant(), $message), 403);

        return response()->json([
            'message' => new CommunityMessageResource(
                $messages->markAcceptedAnswer(currentTenant(), $message, app(TenantUser::class), false),
            ),
        ]);
    }

    public function markRead(
        MarkCommunityReadRequest $request,
        CommunityChannel $channel,
        CommunityReadReceiptService $receipts,
        CommunityChannelPolicy $policy,
    ): JsonResponse {
        $tenant = currentTenant();

        abort_unless($policy->viewMessages(app(TenantUser::class), $tenant, $channel), 403);

        $receipt = $receipts->markRead(
            $tenant,
            $channel,
            app(TenantUser::class),
            (int) $request->validated()['last_read_message_id'],
            $request->validated()['thread_id'] ?? null,
        );

        return response()->json([
            'receipt' => [
                'channel_id' => (string) $receipt->channel_id,
                'thread_id' => $receipt->thread_id ? (string) $receipt->thread_id : null,
                'last_read_message_id' => (string) $receipt->last_read_message_id,
                'last_read_at' => $receipt->last_read_at?->toIso8601String(),
            ],
        ]);
    }

    public function seenBy(
        CommunityMessage $message,
        CommunityReadReceiptService $receipts,
        CommunityMessagePolicy $policy,
    ): JsonResponse {
        abort_unless($policy->view(app(TenantUser::class), currentTenant(), $message), 403);

        return response()->json([
            'members' => $receipts->seenBy(currentTenant(), $message->channel, $message),
        ]);
    }

    private function loadRelations(CommunityMessage $message): CommunityMessage
    {
        return $message->load([
            'author.user',
            'parent.author.user',
            'replyTo.author.user',
            'attachments.mediaAsset',
            'reactions.member.user',
        ]);
    }
}
