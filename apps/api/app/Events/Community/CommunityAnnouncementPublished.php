<?php

namespace App\Events\Community;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommunityAnnouncementPublished implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  array<string, mixed>  $announcement
     * @param  array<string, mixed>  $message
     */
    public function __construct(
        public array $announcement,
        public array $message,
        public int $tenantId,
        public int $channelId,
    ) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("community.tenant.{$this->tenantId}.channel.{$this->channelId}"),
            new PrivateChannel("community.tenant.{$this->tenantId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'announcement.published';
    }
}
