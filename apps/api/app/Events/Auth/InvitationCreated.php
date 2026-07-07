<?php

namespace App\Events\Auth;

class InvitationCreated
{
    public function __construct(
        public readonly int $invitationId,
        public readonly int $tenantId,
        public readonly string $normalizedEmail,
    ) {
    }
}
