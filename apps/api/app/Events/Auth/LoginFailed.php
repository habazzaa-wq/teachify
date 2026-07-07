<?php

namespace App\Events\Auth;

class LoginFailed
{
    public function __construct(
        public readonly int $tenantId,
        public readonly string $email,
        public readonly ?int $userId = null,
    ) {
    }
}
