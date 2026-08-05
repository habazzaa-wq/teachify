<?php

namespace App\Events\Community;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommunityPresenceUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  array<string, mixed>  $user
     */
    public function __construct(
        public array $user,
        public string $status,
        public int $tenantId,
        public ?int $channelId = null,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel("presence-community.tenant.{$this->tenantId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'presence.updated';
    }
}
