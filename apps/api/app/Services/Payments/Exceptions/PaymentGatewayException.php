<?php

namespace App\Services\Payments\Exceptions;

use RuntimeException;
use Throwable;

class PaymentGatewayException extends RuntimeException
{
    public function __construct(
        string $message = '',
        int $code = 0,
        ?Throwable $previous = null,
        public readonly bool $retryable = false,
    ) {
        parent::__construct($message, $code, $previous);
    }
}
