<?php

namespace App\Events\Community;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommunityTypingStarted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  array<string, mixed>  $user
     */
    public function __construct(
        public array $user,
        public int $tenantId,
        public int $channelId,
        public ?int $threadId = null,
    ) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel("community.tenant.{$this->tenantId}.channel.{$this->channelId}"),
        ];

        if ($this->threadId !== null) {
            $channels[] = new PrivateChannel("community.tenant.{$this->tenantId}.thread.{$this->threadId}");
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'typing.started';
    }
}
