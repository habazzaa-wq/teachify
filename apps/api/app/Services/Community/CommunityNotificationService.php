<?php

namespace App\Services\Community;

use App\Models\CommunityMessage;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Services\Notifications\NotificationService;

class CommunityNotificationService
{
    public function __construct(
        private readonly NotificationService $notifications,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function send(
        Tenant $tenant,
        TenantUser $recipient,
        string $type,
        string $title,
        string $body,
        array $data = [],
        string $priority = 'normal',
    ): void {
        $this->notifications->create($tenant, $recipient, $type, $title, $body, $data, $priority);
    }

    public function notifyReply(Tenant $tenant, CommunityMessage $message, TenantUser $author): void
    {
        if ($message->tenant_user_id === $author->id) {
            return;
        }

        $this->send($tenant, $author, 'community.reply', 'New reply',
            'Someone replied to your message.', $this->baseData($message));
    }

    public function notifyMention(Tenant $tenant, CommunityMessage $message, TenantUser $mentioned): void
    {
        if ($message->tenant_user_id === $mentioned->id) {
            return;
        }

        $this->send($tenant, $mentioned, 'community.mention', 'You were mentioned',
            'You were mentioned in a community message.', $this->baseData($message));
    }

    public function notifyReaction(Tenant $tenant, CommunityMessage $message, TenantUser $reactor): void
    {
        if ($message->tenant_user_id === $reactor->id) {
            return;
        }

        $this->send($tenant, $message->author, 'community.reaction', 'New reaction',
            'Someone reacted to your message.', $this->baseData($message));
    }

    public function notifyPinned(Tenant $tenant, CommunityMessage $message): void
    {
        $this->send($tenant, $message->author, 'community.pinned', 'Message pinned',
            'Your message was pinned by a moderator.', $this->baseData($message));
    }

    public function notifyAcceptedAnswer(Tenant $tenant, CommunityMessage $message): void
    {
        $this->send($tenant, $message->author, 'community.accepted', 'Best answer',
            'Your answer was marked as the best answer.', $this->baseData($message));
    }

    public function notifySolved(Tenant $tenant, CommunityMessage $message): void
    {
        $this->send($tenant, $message->author, 'community.solved', 'Question solved',
            'Your question was marked as solved.', $this->baseData($message));
    }

    public function notifyAnnouncement(
        Tenant $tenant,
        TenantUser $recipient,
        string $title,
        string $body,
        array $data = [],
    ): void {
        $this->send($tenant, $recipient, 'community.announcement', $title, $body, $data, 'high');
    }

    /**
     * @return array<string, mixed>
     */
    private function baseData(CommunityMessage $message): array
    {
        return [
            'community_message_id' => $message->id,
            'channel_id' => $message->channel_id,
            'thread_id' => $message->thread_id,
            'tenant_id' => $message->tenant_id,
        ];
    }
}
