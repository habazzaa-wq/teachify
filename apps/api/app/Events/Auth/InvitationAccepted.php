<?php

namespace App\Events\Auth;

class InvitationAccepted
{
    public function __construct(
        public readonly int $invitationId,
        public readonly int $tenantId,
        public readonly int $userId,
    ) {
    }
}
