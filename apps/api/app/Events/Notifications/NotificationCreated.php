<?php

namespace App\Events\Notifications;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired the moment an in-app notification is stored for a tenant member.
 *
 * ShouldBroadcastNow deliberately skips the queue: the student's bell must
 * refresh immediately after the instructor publishes a session or lesson.
 */
class NotificationCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param array<string, mixed> $notification
     */
    public function __construct(
        public int $tenantId,
        public int $membershipId,
        public array $notification,
    ) {
    }

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel("notifications.tenant.{$this->tenantId}.user.{$this->membershipId}");
    }

    public function broadcastAs(): string
    {
        return 'notification.created';
    }
}
