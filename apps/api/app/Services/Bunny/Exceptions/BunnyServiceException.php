<?php

namespace App\Services\Bunny\Exceptions;

use RuntimeException;

class BunnyServiceException extends RuntimeException
{
    private const MASKED_FIELDS = ['api_key', 'stream_api_key', 'password', 'secret', 'signed_url_secret'];

    private string $service;

    private string $operation;

    /** @var array<string, mixed> */
    private array $context;

    /**
     * @param array<string, mixed> $context
     */
    public function __construct(
        string $message,
        string $service,
        string $operation,
        array $context = [],
        int $code = 0,
        ?\Throwable $previous = null,
    ) {
        $this->service = $service;
        $this->operation = $operation;
        $this->context = $this->sanitizeContext($context);

        parent::__construct($message, $code, $previous);
    }

    public function getService(): string
    {
        return $this->service;
    }

    public function getOperation(): string
    {
        return $this->operation;
    }

    /**
     * @return array<string, mixed>
     */
    public function getContext(): array
    {
        return $this->context;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'service' => $this->service,
            'operation' => $this->operation,
            'error' => [
                'type' => 'bunny_service_exception',
                'message' => $this->getMessage(),
                'context' => $this->context,
            ],
        ];
    }

    /**
     * @param array<string, mixed> $context
     * @return array<string, mixed>
     */
    private function sanitizeContext(array $context): array
    {
        foreach (self::MASKED_FIELDS as $field) {
            if (array_key_exists($field, $context)) {
                $context[$field] = '***';
            }
        }

        return $context;
    }
}
