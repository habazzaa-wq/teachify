<?php

namespace App\Http\Resources\Community;

use App\Models\CommunityMessage;
use App\Services\Community\CommunityAccessService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @property CommunityMessage $resource */
class CommunityMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'channel_id' => (string) $this->channel_id,
            'thread_id' => $this->thread_id ? (string) $this->thread_id : null,
            'parent_message_id' => $this->parent_message_id ? (string) $this->parent_message_id : null,
            'reply_to_message_id' => $this->reply_to_message_id ? (string) $this->reply_to_message_id : null,
            'author' => new CommunityAuthorResource($this->author),
            'avatar' => $this->author?->avatar,
            'role' => $this->author ? app(CommunityAccessService::class)->roleFor($this->author, \currentTenant()) : null,
            'body' => $this->body,
            'body_text' => $this->body_text,
            'content_type' => $this->content_type,
            'status' => $this->status,
            'edited' => $this->isEdited(),
            'pinned' => (bool) $this->is_pinned,
            'announcement' => (bool) $this->is_announcement,
            'official_answer' => (bool) $this->is_official_answer,
            'accepted_answer' => (bool) $this->is_official_answer,
            'solved' => (bool) $this->is_solved,
            'highlighted' => (bool) $this->is_highlighted,
            'attachments' => CommunityAttachmentResource::collection($this->whenLoaded('attachments')),
            'reactions' => $this->reactionsGrouped(),
            'reply_count' => (int) $this->whenCounted('replies', fn ($count) => $count, 0),
            'thread_count' => $this->whenLoaded('thread', fn () => (int) ($this->thread->messages_count ?? 0), 0),
            'metadata' => $this->metadata,
            'edited_at' => $this->edited_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function reactionsGrouped(): array
    {
        if (! $this->relationLoaded('reactions') || $this->reactions === null) {
            return [];
        }

        return $this->reactions
            ->groupBy('emoji')
            ->map(fn ($group, string $emoji) => [
                'emoji' => $emoji,
                'count' => $group->count(),
                'members' => $group->map(fn ($reaction) => [
                    'id' => $reaction->member?->id ? (string) $reaction->member->id : null,
                    'name' => $reaction->member?->user?->name,
                    'avatar' => $reaction->member?->avatar,
                ])->values(),
            ])
            ->values()
            ->all();
    }
}
