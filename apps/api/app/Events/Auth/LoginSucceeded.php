<?php

namespace App\Events\Auth;

class LoginSucceeded
{
    public function __construct(
        public readonly int $tenantId,
        public readonly int $userId,
    ) {
    }
}
