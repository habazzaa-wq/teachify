<?php

namespace App\Services\Bunny;

use App\Models\PlatformBunnySetting;
use App\Services\Bunny\Contracts\BunnyClientInterface;
use App\Services\Bunny\Exceptions\BunnyServiceException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class BunnyClient implements BunnyClientInterface
{
    private const STREAM_BASE = 'video.bunnycdn.com';

    private const STREAM_REGION_MAP = [
        'uk' => 'uk.bunnycdn.com',
        'gb' => 'uk.bunnycdn.com',
        'sg' => 'sg.bunnycdn.com',
        'la' => 'la.bunnycdn.com',
        'ny' => 'ny.bunnycdn.com',
        'de' => 'video.bunnycdn.com',
    ];

    private const STORAGE_REGION_MAP = [
        'de' => 'storage.bunnycdn.com',
        'uk' => 'uk.storage.bunnycdn.com',
        'gb' => 'uk.storage.bunnycdn.com',
        'ny' => 'ny.storage.bunnycdn.com',
        'la' => 'la.storage.bunnycdn.com',
        'sg' => 'sg.storage.bunnycdn.com',
        'se' => 'se.storage.bunnycdn.com',
        'br' => 'br.storage.bunnycdn.com',
        'jh' => 'jh.storage.bunnycdn.com',
        'za' => 'jh.storage.bunnycdn.com',
        'syd' => 'syd.storage.bunnycdn.com',
        'au' => 'syd.storage.bunnycdn.com',
    ];

    private const REQUEST_TIMEOUT = 30;

    private const CONNECT_TIMEOUT = 10;

    private ?PlatformBunnySetting $settings = null;

    public function __construct(
        private readonly BunnyExceptionHandler $exceptionHandler,
        private readonly BunnyRetryService $retryService,
    ) {}

    public function storageRequest(string $method, string $path, array $options = []): array
    {
        $settings = $this->getSettings();

        if (! $settings->hasStorageCredentials()) {
            throw new BunnyServiceException(
                'Bunny Storage credentials are not configured.',
                'client',
                'storage_request',
            );
        }

        $url = $this->storageZoneUrl($path);

        return $this->executeRequest($method, $url, [
            'headers' => array_merge([
                'AccessKey' => $settings->storage_zone_password,
            ], $options['headers'] ?? []),
            'body' => $options['body'] ?? null,
            'json' => $options['json'] ?? null,
            'timeout' => $options['timeout'] ?? self::REQUEST_TIMEOUT,
            'connect_timeout' => $options['connect_timeout'] ?? self::CONNECT_TIMEOUT,
            'service' => 'storage',
            'operation' => $options['operation'] ?? strtolower($method).' '.ltrim($path, '/'),
        ]);
    }

    public function streamRequest(string $method, string $path, array $options = []): array
    {
        $settings = $this->getSettings();

        if (! $settings->hasStreamCredentials()) {
            throw new BunnyServiceException(
                'Bunny Stream credentials are not configured.',
                'client',
                'stream_request',
            );
        }

        $region = $options['region'] ?? $settings->storage_zone_region;
        $baseUrl = $this->streamBaseUrl($region);
        $url = rtrim($baseUrl, '/').'/'.ltrim($path, '/');

        return $this->executeRequest($method, $url, [
            'headers' => array_merge([
                'AccessKey' => $settings->stream_api_key,
            ], $options['headers'] ?? []),
            'body' => $options['body'] ?? null,
            'json' => $options['json'] ?? null,
            'timeout' => $options['timeout'] ?? self::REQUEST_TIMEOUT,
            'connect_timeout' => $options['connect_timeout'] ?? self::CONNECT_TIMEOUT,
            'service' => 'stream',
            'operation' => $options['operation'] ?? strtolower($method).' '.ltrim($path, '/'),
        ]);
    }

    public function storageZoneUrl(string $path = ''): string
    {
        $settings = $this->getSettings();
        $zone = $settings->storage_zone_name;
        $host = $this->storageHost($settings->storage_zone_region);

        return "https://{$host}/".rtrim((string) $zone, '/').'/'.ltrim($path, '/');
    }

    public function streamBaseUrl(?string $region = null): string
    {
        $resolved = self::STREAM_REGION_MAP[strtolower(trim((string) $region))] ?? self::STREAM_BASE;

        return "https://{$resolved}";
    }

    public function cdnUrl(string $path = ''): string
    {
        $settings = $this->getSettings();
        $host = $settings->cdn_hostname
            ?? "{$settings->storage_zone_name}.b-cdn.net";

        return rtrim("https://{$host}", '/').'/'.ltrim($path, '/');
    }

    public function settings(): PlatformBunnySetting
    {
        return $this->getSettings();
    }

    /**
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    private function executeRequest(string $method, string $url, array $options): array
    {
        $service = $options['service'] ?? 'unknown';
        $operation = $options['operation'] ?? strtolower($method);
        $attempt = $options['attempt'] ?? 1;
        $maxAttempts = $options['max_attempts'] ?? 1;

        try {
            $request = $this->buildRequest($options);

            $response = $request->send($method, $url);

            if ($response->successful()) {
                return $this->parseResponse($response);
            }

            if ($this->retryService->shouldRetry($response->status(), $attempt, $maxAttempts)) {
                $delay = $this->retryService->calculateDelay($attempt, $response->header('Retry-After'));

                Log::channel('bunny')->warning('Bunny API retrying request', [
                    'service' => $service,
                    'operation' => $operation,
                    'status' => $response->status(),
                    'attempt' => $attempt,
                    'max_attempts' => $maxAttempts,
                    'delay_ms' => $delay,
                ]);

                usleep($delay * 1000);

                return $this->executeRequest($method, $url, array_merge($options, [
                    'attempt' => $attempt + 1,
                ]));
            }

            $this->exceptionHandler->handle($response, $service, $operation);
        } catch (BunnyServiceException $bunnyException) {
            throw $bunnyException;
        } catch (ConnectionException $e) {
            if ($this->retryService->shouldRetry(0, $attempt, $maxAttempts)) {
                $delay = $this->retryService->calculateDelay($attempt);

                Log::channel('bunny')->warning('Bunny API connection retrying', [
                    'service' => $service,
                    'operation' => $operation,
                    'attempt' => $attempt,
                    'max_attempts' => $maxAttempts,
                    'delay_ms' => $delay,
                    'error' => $e->getMessage(),
                ]);

                usleep($delay * 1000);

                return $this->executeRequest($method, $url, array_merge($options, [
                    'attempt' => $attempt + 1,
                ]));
            }

            throw new BunnyServiceException(
                "Bunny API connection failed: {$e->getMessage()}",
                $service,
                $operation,
                ['timeout' => true],
                0,
                $e,
            );
        } catch (Throwable $e) {
            throw new BunnyServiceException(
                "Bunny API request failed: {$e->getMessage()}",
                $service,
                $operation,
                [],
                $e->getCode(),
                $e,
            );
        }

        throw new BunnyServiceException(
            'Bunny API request failed after all retry attempts.',
            $service,
            $operation,
            ['max_attempts' => $maxAttempts],
        );
    }

    /**
     * @param  array<string, mixed>  $options
     */
    private function buildRequest(array $options): PendingRequest
    {
        $request = Http::timeout($options['timeout'] ?? self::REQUEST_TIMEOUT)
            ->withOptions([
                'connect_timeout' => $options['connect_timeout'] ?? self::CONNECT_TIMEOUT,
            ]);

        $headers = $options['headers'] ?? [];
        if ($headers !== []) {
            $request = $request->withHeaders($headers);
        }

        if (isset($options['body']) && is_string($options['body'])) {
            $request = $request->withBody($options['body'], 'application/octet-stream');
        } elseif (isset($options['json'])) {
            $request = $request->json($options['json']);
        }

        return $request;
    }

    /**
     * @return array<string, mixed>
     */
    private function parseResponse(Response $response): array
    {
        $body = $response->body();

        if ($body === '' || $body === null) {
            return ['success' => true, 'status' => $response->status()];
        }

        $decoded = json_decode($body, true, 512, JSON_THROW_ON_ERROR);

        if (is_array($decoded)) {
            return array_merge(['success' => true, 'status' => $response->status()], $decoded);
        }

        return ['success' => true, 'status' => $response->status(), 'data' => $decoded];
    }

    private function storageHost(?string $region): string
    {
        $key = strtolower(trim((string) ($region ?: 'de')));

        return self::STORAGE_REGION_MAP[$key] ?? self::STORAGE_REGION_MAP['de'];
    }

    private function getSettings(): PlatformBunnySetting
    {
        if ($this->settings !== null) {
            return $this->settings;
        }

        $settings = PlatformBunnySetting::active();

        if (! $settings) {
            throw new BunnyServiceException(
                'Bunny integration is not configured. No platform settings found.',
                'client',
                'get_settings',
            );
        }

        $this->settings = $settings;

        return $this->settings;
    }
}
