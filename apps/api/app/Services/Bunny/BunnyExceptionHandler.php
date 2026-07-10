<?php

namespace App\Services\Bunny;

use App\Services\Bunny\Exceptions\BunnyServiceException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Log;

class BunnyExceptionHandler
{
    /**
     * @return never
     */
    public function handle(Response $response, string $service, string $operation): never
    {
        $status = $response->status();
        $body = $this->safeBody($response);

        Log::channel('bunny')->error('Bunny API error response', [
            'service' => $service,
            'operation' => $operation,
            'status' => $status,
            'response' => $body,
        ]);

        match (true) {
            $status === 401, $status === 403 => throw new BunnyServiceException(
                'Bunny API authentication failed. Check your API credentials.',
                $service,
                $operation,
                ['status' => $status],
                $status,
            ),
            $status === 404 => throw new BunnyServiceException(
                'Bunny API resource not found.',
                $service,
                $operation,
                ['status' => $status],
                $status,
            ),
            $status === 409 => throw new BunnyServiceException(
                'Bunny API conflict. The resource may already exist.',
                $service,
                $operation,
                ['status' => $status],
                $status,
            ),
            $status === 413 => throw new BunnyServiceException(
                'Bunny API payload too large.',
                $service,
                $operation,
                ['status' => $status],
                $status,
            ),
            $status === 429 => throw new BunnyServiceException(
                'Bunny API rate limit exceeded.',
                $service,
                $operation,
                ['status' => $status, 'retry_after' => $response->header('Retry-After')],
                $status,
            ),
            $status >= 500 => throw new BunnyServiceException(
                "Bunny API server error (HTTP {$status}).",
                $service,
                $operation,
                ['status' => $status],
                $status,
            ),
            default => throw new BunnyServiceException(
                "Bunny API request failed (HTTP {$status}).",
                $service,
                $operation,
                ['status' => $status],
                $status,
            ),
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function safeBody(Response $response): array
    {
        $body = $response->json();

        if (is_array($body)) {
            return $this->maskSensitiveFields($body);
        }

        return ['raw' => substr((string) $response->body(), 0, 500)];
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function maskSensitiveFields(array $data): array
    {
        $sensitive = ['api_key', 'password', 'secret', 'token', 'authorization'];

        foreach ($data as $key => $value) {
            if (is_string($value) && in_array(strtolower($key), $sensitive, true)) {
                $data[$key] = '***';
            } elseif (is_array($value)) {
                $data[$key] = $this->maskSensitiveFields($value);
            }
        }

        return $data;
    }
}
