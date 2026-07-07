<?php

namespace App\Exceptions;

use RuntimeException;

class MediaProviderException extends RuntimeException
{
    /**
     * @param array<string, mixed> $context
     */
    public function __construct(
        string $message,
        private readonly string $provider,
        private readonly ?string $service = null,
        private readonly string $operation = 'unknown',
        private readonly array $context = [],
        int $code = 0,
        ?\Throwable $previous = null,
    ) {
        parent::__construct($message, $code, $previous);
    }

    /**
     * @return array<string, mixed>
     */
    public function normalized(): array
    {
        return [
            'provider' => $this->provider,
            'provider_service' => $this->service,
            'operation' => $this->operation,
            'error' => [
                'type' => 'provider_exception',
                'message' => $this->getMessage(),
                'context' => $this->context,
            ],
        ];
    }
}
