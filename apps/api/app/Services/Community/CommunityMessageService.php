<?php

namespace App\Services\Community;

use App\Events\Community\CommunityMessageCreated;
use App\Events\Community\CommunityMessageDeleted;
use App\Events\Community\CommunityMessagePinned;
use App\Events\Community\CommunityMessageUpdated;
use App\Models\CommunityChannel;
use App\Models\CommunityMessage;
use App\Models\CommunityMessageAttachment;
use App\Models\CommunityMessageMention;
use App\Models\CommunityMessageReaction;
use App\Models\CommunityStat;
use App\Models\CommunityThread;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CommunityMessageService
{
    public function __construct(
        private readonly CommunityAccessService $access,
        private readonly CommunityAntiSpamService $antiSpam,
        private readonly CommunityExamGateService $examGate,
        private readonly CommunityStatsService $stats,
        private readonly CommunityNotificationService $notifications,
        private readonly CommunityGamificationService $gamification,
    ) {}

    public function list(
        Tenant $tenant,
        CommunityChannel $channel,
        TenantUser $member,
        array $filters = [],
    ): LengthAwarePaginator {
        $this->bindTenant($tenant);
        $this->ensureChannelInTenant($tenant, $channel);
        $this->examGate->ensureNoActiveExam($member, $tenant);

        if (! $this->access->canViewChannel($member, $tenant, $channel)) {
            throw ValidationException::withMessages([
                'channel' => ['You do not have access to this channel.'],
            ]);
        }

        $perPage = (int) ($filters['per_page'] ?? 30);
        $beforeId = isset($filters['before_id']) ? (int) $filters['before_id'] : null;
        $afterId = isset($filters['after_id']) ? (int) $filters['after_id'] : null;

        $query = CommunityMessage::query()
            ->where('tenant_id', $tenant->id)
            ->where('channel_id', $channel->id)
            ->where('status', 'active');

        if (isset($filters['thread_id'])) {
            $query->where('thread_id', (int) $filters['thread_id']);
        }

        if (isset($filters['author_id'])) {
            $query->where('tenant_user_id', (int) $filters['author_id']);
        }

        if (! empty($filters['pinned_only'])) {
            $query->where('is_pinned', true);
        }

        if (! empty($filters['official_only'])) {
            $query->where('is_official_answer', true);
        }

        if (! empty($filters['solved_only'])) {
            $query->where('is_solved', true);
        }

        if (! empty($filters['highlighted_only'])) {
            $query->where('is_highlighted', true);
        }

        if ($beforeId !== null) {
            $query->where('id', '<', $beforeId)->orderByDesc('id');
        } elseif ($afterId !== null) {
            $query->where('id', '>', $afterId)->orderBy('id');
        } else {
            $query->orderByDesc('id');
        }

        $messages = $query
            ->with($this->withRelations())
            ->paginate($perPage);

        if ($afterId !== null) {
            $messages = $messages->setCollection($messages->getCollection()->reverse());
        }

        return $messages;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(
        Tenant $tenant,
        CommunityChannel $channel,
        TenantUser $author,
        array $data,
    ): CommunityMessage {
        $this->bindTenant($tenant);
        $this->ensureChannelInTenant($tenant, $channel);
        $this->examGate->ensureNoActiveExam($author, $tenant);
        $this->access->ensureCanPost($author, $tenant, $channel);

        $body = (string) ($data['body'] ?? '');
        $contentType = $data['content_type'] ?? 'text';

        if ($this->isTextContent($contentType)) {
            $this->antiSpam->assertMessageAllowed($tenant, $author, $body);
        }

        return DB::transaction(function () use ($tenant, $channel, $author, $data, $body, $contentType): CommunityMessage {
            $thread = $this->resolveThread($tenant, $channel, $data['thread_id'] ?? null);
            $parent = $this->resolveParent($tenant, $channel, $thread, $data['parent_message_id'] ?? null);
            $replyTo = $this->resolveReplyTo($tenant, $channel, $data['reply_to_message_id'] ?? null);

            $bodyText = $this->plainText($body);

            $message = CommunityMessage::create([
                'tenant_id' => $tenant->id,
                'channel_id' => $channel->id,
                'thread_id' => $thread?->id,
                'parent_message_id' => $parent?->id,
                'reply_to_message_id' => $replyTo?->id,
                'tenant_user_id' => $author->id,
                'body' => $body,
                'body_text' => $bodyText,
                'content_type' => $contentType,
                'status' => 'active',
                'is_pinned' => false,
                'is_announcement' => (bool) ($data['is_announcement'] ?? false),
                'is_official_answer' => false,
                'is_highlighted' => false,
                'is_solved' => false,
                'metadata' => [
                    'mentions' => $data['mentions'] ?? [],
                    'urls' => $this->extractUrls($body),
                    'has_math' => str_contains($body, '\\(') || str_contains($body, '\\['),
                    'client_message_id' => $data['client_message_id'] ?? null,
                ],
            ])->refresh();

            $this->createAttachments($message, $data['attachments'] ?? []);
            $this->createMentions($tenant, $message, $data['mentions'] ?? []);

            $channel->forceFill([
                'last_message_id' => $message->id,
                'last_message_at' => now(),
            ])->save();

            if ($thread !== null) {
                $thread->forceFill(['last_message_at' => now()])->save();
            }

            $this->stats->increment($tenant, CommunityStat::TOTAL_MESSAGES);
            $this->stats->increment($tenant, CommunityStat::TODAY_MESSAGES);

            $xpAction = $parent !== null
                ? CommunityGamificationService::XP_MESSAGE_REPLY
                : CommunityGamificationService::XP_MESSAGE_CREATED;

            $this->gamification->award($tenant, $author, 'message_created', $xpAction, $message->id);

            if ($parent !== null) {
                $this->notifications->notifyReply($tenant, $message, $parent->author);
            }

            $this->notifyMentions($tenant, $message, $data['mentions'] ?? []);

            $message->load($this->withRelations());

            CommunityMessageCreated::dispatch(
                $this->payload($message, $tenant),
                $tenant->id,
                $channel->id,
                $thread?->id,
            );

            return $message;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Tenant $tenant, CommunityMessage $message, TenantUser $actor, array $data): CommunityMessage
    {
        $this->bindTenant($tenant);
        $this->ensureMessageInTenant($tenant, $message);
        $this->ensureNotDeleted($message);
        $this->ensureOwnerOrModerator($message, $actor, $tenant);

        if (! $this->access->isModerator($actor, $tenant)) {
            $this->ensureWithinEditWindow($tenant, $message, $actor);
        }

        $body = $data['body'] ?? $message->body;

        if (isset($data['body']) && $this->isTextContent($message->content_type)) {
            $this->antiSpam->assertMessageAllowed($tenant, $actor, (string) $body);
        }

        $message->forceFill([
            'body' => $body,
            'body_text' => $this->plainText((string) $body),
            'content_type' => $data['content_type'] ?? $message->content_type,
            'edited_at' => now(),
        ])->save();

        $fresh = $message->refresh()->load($this->withRelations());

        CommunityMessageUpdated::dispatch(
            $this->payload($fresh, $tenant),
            $tenant->id,
            $message->channel_id,
            $message->thread_id,
        );

        return $fresh;
    }

    public function delete(Tenant $tenant, CommunityMessage $message, TenantUser $actor): CommunityMessage
    {
        $this->bindTenant($tenant);
        $this->ensureMessageInTenant($tenant, $message);
        $this->ensureNotDeleted($message);
        $this->ensureOwnerOrModerator($message, $actor, $tenant);

        $message->forceFill([
            'status' => 'deleted',
            'deleted_at' => now(),
        ])->save();

        $this->stats->decrement($tenant, CommunityStat::TOTAL_MESSAGES);
        $this->stats->decrement($tenant, CommunityStat::TODAY_MESSAGES);

        CommunityMessageDeleted::dispatch(
            $this->payload($message, $tenant),
            $tenant->id,
            $message->channel_id,
            $message->thread_id,
        );

        return $message->refresh();
    }

    public function pin(Tenant $tenant, CommunityMessage $message, TenantUser $actor, bool $pinned): CommunityMessage
    {
        $this->bindTenant($tenant);
        $this->ensureMessageInTenant($tenant, $message);
        $this->ensureNotDeleted($message);
        $this->access->ensureCanModerate($actor, $tenant);

        $message->forceFill(['is_pinned' => $pinned])->save();
        $fresh = $message->refresh()->load($this->withRelations());

        if ($pinned) {
            $this->notifications->notifyPinned($tenant, $fresh);
        }

        CommunityMessagePinned::dispatch(
            $this->payload($fresh, $tenant),
            $tenant->id,
            $message->channel_id,
            $message->thread_id,
        );

        return $fresh;
    }

    public function highlight(Tenant $tenant, CommunityMessage $message, TenantUser $actor, bool $highlighted): CommunityMessage
    {
        $this->bindTenant($tenant);
        $this->ensureMessageInTenant($tenant, $message);
        $this->ensureNotDeleted($message);
        $this->access->ensureCanModerate($actor, $tenant);

        $message->forceFill(['is_highlighted' => $highlighted])->save();

        return $message->refresh()->load($this->withRelations());
    }

    public function markOfficialAnswer(Tenant $tenant, CommunityMessage $message, TenantUser $actor, bool $official): CommunityMessage
    {
        $this->bindTenant($tenant);
        $this->ensureMessageInTenant($tenant, $message);
        $this->ensureNotDeleted($message);
        $this->access->ensureCanModerate($actor, $tenant);

        $message->forceFill(['is_official_answer' => $official])->save();

        return $message->refresh()->load($this->withRelations());
    }

    public function markSolved(Tenant $tenant, CommunityMessage $message, TenantUser $actor, bool $solved): CommunityMessage
    {
        $this->bindTenant($tenant);
        $this->ensureMessageInTenant($tenant, $message);
        $this->ensureNotDeleted($message);
        $this->ensureCanResolve($message, $actor, $tenant);

        $message->forceFill(['is_solved' => $solved])->save();

        if ($solved) {
            $this->notifications->notifySolved($tenant, $message->refresh());
        }

        return $message->refresh()->load($this->withRelations());
    }

    public function markAcceptedAnswer(Tenant $tenant, CommunityMessage $answer, TenantUser $actor, bool $accepted): CommunityMessage
    {
        $this->bindTenant($tenant);
        $this->ensureMessageInTenant($tenant, $answer);
        $this->ensureNotDeleted($answer);
        $question = CommunityMessage::query()
            ->where('tenant_id', $tenant->id)
            ->where('id', $answer->parent_message_id)
            ->first();

        if ($question === null) {
            throw ValidationException::withMessages([
                'message' => ['Only answers to a question can be accepted.'],
            ]);
        }

        if ($question->tenant_user_id !== $actor->id && ! $this->access->isModerator($actor, $tenant)) {
            throw ValidationException::withMessages([
                'message' => ['Only the question author can accept an answer.'],
            ]);
        }

        $answer->forceFill(['is_official_answer' => $accepted])->save();

        if ($accepted) {
            $this->notifications->notifyAcceptedAnswer($tenant, $answer->refresh());
            $this->gamification->award(
                $tenant,
                $answer->author,
                'accepted_answer',
                CommunityGamificationService::XP_ACCEPTED_ANSWER,
                $answer->id,
            );
        }

        return $answer->refresh()->load($this->withRelations());
    }

    public function payload(CommunityMessage $message, ?Tenant $tenant = null): array
    {
        return [
            'id' => $message->id,
            'channel_id' => $message->channel_id,
            'thread_id' => $message->thread_id,
            'parent_message_id' => $message->parent_message_id,
            'reply_to_message_id' => $message->reply_to_message_id,
            'tenant_user_id' => $message->tenant_user_id,
            'author' => [
                'id' => $message->author?->id,
                'name' => $message->author?->user?->name,
                'avatar' => $message->author?->avatar,
                'role' => $this->roleFor($message->author, $tenant),
            ],
            'body' => $message->body,
            'body_text' => $message->body_text,
            'content_type' => $message->content_type,
            'status' => $message->status,
            'is_pinned' => (bool) $message->is_pinned,
            'is_announcement' => (bool) $message->is_announcement,
            'is_official_answer' => (bool) $message->is_official_answer,
            'is_highlighted' => (bool) $message->is_highlighted,
            'is_solved' => (bool) $message->is_solved,
            'metadata' => $message->metadata,
            'reactions' => $this->reactionsPayload($message),
            'attachments' => $this->attachmentsPayload($message->attachments),
            'edited_at' => $message->edited_at?->toIso8601String(),
            'created_at' => $message->created_at?->toIso8601String(),
        ];
    }

    public function messagesForPayload(Collection $messages): array
    {
        return $messages->map(fn (CommunityMessage $message) => $this->payload($message))->all();
    }

    private function roleFor(?TenantUser $member, ?Tenant $tenant): ?string
    {
        if ($member === null || $tenant === null) {
            return null;
        }

        return $this->access->roleFor($member, $tenant);
    }

    /**
     * @return array<int, string>
     */
    private function withRelations(): array
    {
        return [
            'author.user',
            'parent.author.user',
            'replyTo.author.user',
            'attachments.mediaAsset',
            'reactions.member.user',
        ];
    }

    private function resolveThread(Tenant $tenant, CommunityChannel $channel, ?int $threadId): ?CommunityThread
    {
        if ($threadId === null) {
            return null;
        }

        $thread = CommunityThread::query()
            ->where('tenant_id', $tenant->id)
            ->where('channel_id', $channel->id)
            ->where('id', $threadId)
            ->first();

        if ($thread === null) {
            throw ValidationException::withMessages([
                'thread_id' => ['The thread is invalid for this channel.'],
            ]);
        }

        return $thread;
    }

    private function resolveParent(Tenant $tenant, CommunityChannel $channel, ?CommunityThread $thread, ?int $parentId): ?CommunityMessage
    {
        if ($parentId === null) {
            return null;
        }

        $parent = CommunityMessage::query()
            ->where('tenant_id', $tenant->id)
            ->where('channel_id', $channel->id)
            ->where('id', $parentId)
            ->where('status', 'active')
            ->first();

        if ($parent === null) {
            throw ValidationException::withMessages([
                'parent_message_id' => ['The selected parent message is invalid.'],
            ]);
        }

        return $parent;
    }

    private function resolveReplyTo(Tenant $tenant, CommunityChannel $channel, ?int $replyToId): ?CommunityMessage
    {
        if ($replyToId === null) {
            return null;
        }

        $replyTo = CommunityMessage::query()
            ->where('tenant_id', $tenant->id)
            ->where('channel_id', $channel->id)
            ->where('id', $replyToId)
            ->where('status', 'active')
            ->first();

        if ($replyTo === null) {
            throw ValidationException::withMessages([
                'reply_to_message_id' => ['The selected message to reply to is invalid.'],
            ]);
        }

        return $replyTo;
    }

    /**
     * @param  array<int, array<string, mixed>>  $attachments
     */
    private function createAttachments(CommunityMessage $message, array $attachments): void
    {
        foreach ($attachments as $attachment) {
            CommunityMessageAttachment::create([
                'tenant_id' => $message->tenant_id,
                'message_id' => $message->id,
                'media_asset_id' => $attachment['media_asset_id'] ?? null,
                'type' => $attachment['type'] ?? 'file',
                'file_name' => $attachment['file_name'] ?? 'attachment',
                'mime_type' => $attachment['mime_type'] ?? null,
                'size_bytes' => $attachment['size_bytes'] ?? null,
                'duration_seconds' => $attachment['duration_seconds'] ?? null,
                'url' => $attachment['url'] ?? null,
                'metadata' => $attachment['metadata'] ?? [],
            ]);
        }
    }

    /**
     * @param  array<int, int>  $mentionIds
     */
    private function createMentions(Tenant $tenant, CommunityMessage $message, array $mentionIds): void
    {
        foreach (array_unique($mentionIds) as $mentionedId) {
            if ((int) $mentionedId === $message->tenant_user_id) {
                continue;
            }

            CommunityMessageMention::create([
                'tenant_id' => $tenant->id,
                'message_id' => $message->id,
                'mentioned_tenant_user_id' => (int) $mentionedId,
            ]);
        }
    }

    /**
     * @param  array<int, int>  $mentionIds
     */
    private function notifyMentions(Tenant $tenant, CommunityMessage $message, array $mentionIds): void
    {
        foreach (array_unique($mentionIds) as $mentionedId) {
            if ((int) $mentionedId === $message->tenant_user_id) {
                continue;
            }

            $mentioned = TenantUser::query()
                ->where('tenant_id', $tenant->id)
                ->where('id', (int) $mentionedId)
                ->where('status', 'active')
                ->first();

            if ($mentioned !== null) {
                $this->notifications->notifyMention($tenant, $message, $mentioned);
            }
        }
    }

    private function ensureWithinEditWindow(Tenant $tenant, CommunityMessage $message, TenantUser $actor): void
    {
        $minutes = $this->settingForEdit($tenant);

        if ($minutes > 0 && $message->created_at?->diffInMinutes(now()) > $minutes) {
            throw ValidationException::withMessages([
                'message' => ['The edit window has expired.'],
            ]);
        }
    }

    private function ensureOwnerOrModerator(CommunityMessage $message, TenantUser $actor, Tenant $tenant): void
    {
        if ($message->tenant_user_id !== $actor->id && ! $this->access->isModerator($actor, $tenant)) {
            throw ValidationException::withMessages([
                'message' => ['You may only edit your own messages.'],
            ]);
        }
    }

    private function ensureCanResolve(CommunityMessage $message, TenantUser $actor, Tenant $tenant): void
    {
        $isQuestionAuthor = $message->author?->id === $actor->id;

        if ($isQuestionAuthor || $this->access->isModerator($actor, $tenant)) {
            return;
        }

        throw ValidationException::withMessages([
            'message' => ['Only the question author or a moderator can resolve this.'],
        ]);
    }

    private function ensureNotDeleted(CommunityMessage $message): void
    {
        if ($message->isDeleted()) {
            throw ValidationException::withMessages([
                'message' => ['This message has been deleted.'],
            ]);
        }
    }

    private function ensureMessageInTenant(Tenant $tenant, CommunityMessage $message): void
    {
        if ($message->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'message' => ['The message is invalid for this tenant.'],
            ]);
        }
    }

    private function ensureChannelInTenant(Tenant $tenant, CommunityChannel $channel): void
    {
        if ($channel->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'channel' => ['The channel is invalid for this tenant.'],
            ]);
        }
    }

    private function isTextContent(string $contentType): bool
    {
        return in_array($contentType, ['text', 'code', 'math', 'announcement'], true);
    }

    private function plainText(string $body): string
    {
        return trim(html_entity_decode(strip_tags($body), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    }

    /**
     * @return list<string>
     */
    private function extractUrls(string $body): array
    {
        if (! preg_match_all(CommunityAntiSpamService::URL_PATTERN, $body, $matches)) {
            return [];
        }

        return array_values(array_unique($matches[0]));
    }

    private function settingForEdit(Tenant $tenant): int
    {
        return app(CommunitySettingService::class)->forTenant($tenant)->edit_window_minutes;
    }

    private function safeRole(?TenantUser $member): ?string
    {
        return $member?->id !== null ? $member->id : null;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function reactionsPayload(CommunityMessage $message): array
    {
        return $message->reactions
            ->groupBy('emoji')
            ->map(fn ($group, string $emoji) => [
                'emoji' => $emoji,
                'count' => $group->count(),
                'members' => $group->map(fn (CommunityMessageReaction $reaction) => [
                    'id' => $reaction->member?->id,
                    'name' => $reaction->member?->user?->name,
                    'avatar' => $reaction->member?->avatar,
                ])->values()->all(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function attachmentsPayload(Collection $attachments): array
    {
        return $attachments->map(fn (CommunityMessageAttachment $attachment) => [
            'id' => $attachment->id,
            'type' => $attachment->type,
            'file_name' => $attachment->file_name,
            'mime_type' => $attachment->mime_type,
            'size_bytes' => $attachment->size_bytes,
            'duration_seconds' => $attachment->duration_seconds,
            'url' => $attachment->url ?? $attachment->mediaAsset?->cdn_url,
            'media_asset_id' => $attachment->media_asset_id,
        ])->all();
    }

    private function bindTenant(Tenant $tenant): void
    {
        app()->instance(Tenant::class, $tenant);
        app()->instance('currentTenant', $tenant);
    }
}
