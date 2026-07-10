<?php

namespace App\Services\UploadGuard\Exceptions;

use RuntimeException;

class SubscriptionExpiredException extends RuntimeException
{
    public function __construct(
        ?\Throwable $previous = null,
    ) {
        parent::__construct(
            'Your subscription has expired. Please renew to continue uploading.',
            403,
            $previous,
        );
    }

    public function toArray(): array
    {
        return [
            'error' => 'subscription_expired',
            'message' => $this->getMessage(),
        ];
    }
}
