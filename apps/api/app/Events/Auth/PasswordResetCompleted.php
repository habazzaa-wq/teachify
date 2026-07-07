<?php

namespace App\Events\Auth;

class PasswordResetCompleted
{
    public function __construct(public readonly int $userId)
    {
    }
}
