<?php

namespace App\Services\Bunny;

use App\Services\Bunny\Contracts\BunnyHealthInterface;
use App\Services\Bunny\Exceptions\BunnyServiceException;
use Illuminate\Support\Facades\Log;
use Throwable;

class BunnyHealthService implements BunnyHealthInterface
{
    private const HEALTH_STATUS_HEALTHY = 'healthy';
    private const HEALTH_STATUS_WARNING = 'warning';
    private const HEALTH_STATUS_CRITICAL = 'critical';

    public function __construct(
        private readonly BunnyClient $client,
    ) {
    }

    /**
     * @return array{status: string, storage: array<string, mixed>, stream: array<string, mixed>, latency_ms: int}
     */
    public function ping(): array
    {
        $settings = $this->client->settings();
        $start = microtime(true);

        $storagePing = $this->pingStorage();
        $streamPing = $settings->hasStreamCredentials() ? $this->pingStream() : ['status' => 'skipped'];
        $latencyMs = (int) ((microtime(true) - $start) * 1000);

        $overall = $this->determineOverallStatus([$storagePing, $streamPing]);

        return [
            'status' => $overall,
            'storage' => $storagePing,
            'stream' => $streamPing,
            'latency_ms' => $latencyMs,
            'checked_at' => now()->toIso8601String(),
        ];
    }

    /**
     * @return array{status: string, details: array<string, mixed>}
     */
    public function verifyCredentials(): array
    {
        $settings = $this->client->settings();

        $storageResult = $settings->hasStorageCredentials()
            ? $this->verifyStorageCredentials()
            : ['status' => self::HEALTH_STATUS_CRITICAL, 'error' => 'Storage credentials not configured'];

        $streamResult = $settings->hasStreamCredentials()
            ? $this->verifyStreamCredentials()
            : ['status' => self::HEALTH_STATUS_WARNING, 'error' => 'Stream credentials not configured'];

        $overall = $this->determineOverallStatus([$storageResult, $streamResult]);

        return [
            'status' => $overall,
            'storage' => $storageResult,
            'stream' => $streamResult,
        ];
    }

    /**
     * @return array{status: string, details: array<string, mixed>}
     */
    public function verifyStorage(): array
    {
        return $this->verifyStorageCredentials();
    }

    /**
     * @return array{status: string, details: array<string, mixed>}
     */
    public function verifyStream(): array
    {
        return $this->verifyStreamCredentials();
    }

    /**
     * @return array{storage_ms: int, stream_ms: int|null, average_ms: int}
     */
    public function measureLatency(): array
    {
        $storageLatency = $this->measureStorageLatency();
        $streamLatency = $this->client->settings()->hasStreamCredentials()
            ? $this->measureStreamLatency()
            : null;

        $total = $storageLatency + ($streamLatency ?? 0);
        $count = $streamLatency !== null ? 2 : 1;

        return [
            'storage_ms' => $storageLatency,
            'stream_ms' => $streamLatency,
            'average_ms' => (int) ($total / $count),
        ];
    }

    /**
     * @return array{storage: bool, stream: bool|null, overall: bool}
     */
    public function measureApiAvailability(): array
    {
        $storageAvailable = $this->isStorageAvailable();
        $streamAvailable = $this->client->settings()->hasStreamCredentials()
            ? $this->isStreamAvailable()
            : null;

        return [
            'storage' => $storageAvailable,
            'stream' => $streamAvailable,
            'overall' => $storageAvailable && ($streamAvailable === null || $streamAvailable),
        ];
    }

    /**
     * @return array{status: string, services: array<string, mixed>, latency: array<string, mixed>, availability: array<string, mixed>, checked_at: string}
     */
    public function fullHealthCheck(): array
    {
        $settings = $this->client->settings();
        $start = microtime(true);

        $ping = $this->ping();
        $credentials = $this->verifyCredentials();
        $latency = $this->measureLatency();
        $availability = $this->measureApiAvailability();

        $totalMs = (int) ((microtime(true) - $start) * 1000);

        $overallStatus = $this->determineOverallStatus([
            $ping,
            $credentials,
        ]);

        $healthRecord = [
            'status' => $overallStatus,
            'services' => [
                'storage' => [
                    'status' => $ping['storage']['status'] ?? self::HEALTH_STATUS_CRITICAL,
                    'credentials_valid' => $credentials['storage']['status'] === self::HEALTH_STATUS_HEALTHY,
                    'available' => $availability['storage'],
                ],
                'stream' => [
                    'status' => $ping['stream']['status'] ?? self::HEALTH_STATUS_WARNING,
                    'credentials_valid' => ($credentials['stream']['status'] ?? '') === self::HEALTH_STATUS_HEALTHY,
                    'available' => $availability['stream'],
                    'enabled' => $settings->enable_stream,
                ],
            ],
            'latency' => $latency,
            'availability' => $availability,
            'total_check_ms' => $totalMs,
            'checked_at' => now()->toIso8601String(),
        ];

        Log::channel('bunny')->info('Bunny health check completed', [
            'status' => $overallStatus,
            'latency_ms' => $totalMs,
        ]);

        return $healthRecord;
    }

    private function pingStorage(): array
    {
        try {
            $start = microtime(true);
            $this->client->storageRequest('HEAD', '/', ['timeout' => 5, 'connect_timeout' => 5]);
            $latencyMs = (int) ((microtime(true) - $start) * 1000);

            return ['status' => self::HEALTH_STATUS_HEALTHY, 'latency_ms' => $latencyMs];
        } catch (BunnyServiceException $e) {
            return ['status' => self::HEALTH_STATUS_CRITICAL, 'error' => $e->getMessage()];
        } catch (Throwable $e) {
            return ['status' => self::HEALTH_STATUS_CRITICAL, 'error' => $e->getMessage()];
        }
    }

    private function pingStream(): array
    {
        try {
            $settings = $this->client->settings();
            $libraryId = (string) $settings->library_id;
            $start = microtime(true);
            $this->client->streamRequest('HEAD', "library/{$libraryId}", ['timeout' => 5, 'connect_timeout' => 5]);
            $latencyMs = (int) ((microtime(true) - $start) * 1000);

            return ['status' => self::HEALTH_STATUS_HEALTHY, 'latency_ms' => $latencyMs];
        } catch (BunnyServiceException $e) {
            return ['status' => self::HEALTH_STATUS_CRITICAL, 'error' => $e->getMessage()];
        } catch (Throwable $e) {
            return ['status' => self::HEALTH_STATUS_CRITICAL, 'error' => $e->getMessage()];
        }
    }

    /**
     * @return array{status: string, error: string|null}
     */
    private function verifyStorageCredentials(): array
    {
        try {
            $this->client->storageRequest('GET', '/', ['timeout' => 8, 'connect_timeout' => 8]);

            return ['status' => self::HEALTH_STATUS_HEALTHY, 'error' => null];
        } catch (BunnyServiceException $e) {
            $code = $e->getCode();

            if ($code === 401 || $code === 403) {
                return ['status' => self::HEALTH_STATUS_CRITICAL, 'error' => 'Storage zone password is unauthorized.'];
            }

            if ($code === 0) {
                return ['status' => self::HEALTH_STATUS_CRITICAL, 'error' => 'Storage API connection timed out.'];
            }

            return ['status' => self::HEALTH_STATUS_WARNING, 'error' => "Storage API returned HTTP {$code}."];
        } catch (Throwable $e) {
            return ['status' => self::HEALTH_STATUS_CRITICAL, 'error' => $e->getMessage()];
        }
    }

    /**
     * @return array{status: string, error: string|null}
     */
    private function verifyStreamCredentials(): array
    {
        try {
            $settings = $this->client->settings();
            $libraryId = (string) $settings->library_id;

            $this->client->streamRequest('GET', "library/{$libraryId}", ['timeout' => 8, 'connect_timeout' => 8]);

            return ['status' => self::HEALTH_STATUS_HEALTHY, 'error' => null];
        } catch (BunnyServiceException $e) {
            $code = $e->getCode();

            if ($code === 401 || $code === 403) {
                return ['status' => self::HEALTH_STATUS_CRITICAL, 'error' => 'Stream API key is unauthorized.'];
            }

            if ($code === 0) {
                return ['status' => self::HEALTH_STATUS_CRITICAL, 'error' => 'Stream API connection timed out.'];
            }

            return ['status' => self::HEALTH_STATUS_WARNING, 'error' => "Stream API returned HTTP {$code}."];
        } catch (Throwable $e) {
            return ['status' => self::HEALTH_STATUS_CRITICAL, 'error' => $e->getMessage()];
        }
    }

    private function measureStorageLatency(): int
    {
        try {
            $start = microtime(true);
            $this->client->storageRequest('HEAD', '/', ['timeout' => 5, 'connect_timeout' => 5]);

            return (int) ((microtime(true) - $start) * 1000);
        } catch (Throwable $e) {
            return -1;
        }
    }

    private function measureStreamLatency(): int
    {
        try {
            $settings = $this->client->settings();
            $libraryId = (string) $settings->library_id;
            $start = microtime(true);
            $this->client->streamRequest('HEAD', "library/{$libraryId}", ['timeout' => 5, 'connect_timeout' => 5]);

            return (int) ((microtime(true) - $start) * 1000);
        } catch (Throwable $e) {
            return -1;
        }
    }

    private function isStorageAvailable(): bool
    {
        try {
            $this->client->storageRequest('HEAD', '/', ['timeout' => 5, 'connect_timeout' => 5]);

            return true;
        } catch (Throwable $e) {
            return false;
        }
    }

    private function isStreamAvailable(): bool
    {
        try {
            $settings = $this->client->settings();
            $libraryId = (string) $settings->library_id;
            $this->client->streamRequest('HEAD', "library/{$libraryId}", ['timeout' => 5, 'connect_timeout' => 5]);

            return true;
        } catch (Throwable $e) {
            return false;
        }
    }

    /**
     * @param array<int, array<string, mixed>> $checks
     */
    private function determineOverallStatus(array $checks): string
    {
        foreach ($checks as $check) {
            $status = $check['status'] ?? $check['services']['storage']['status'] ?? null;

            if ($status === self::HEALTH_STATUS_CRITICAL) {
                return self::HEALTH_STATUS_CRITICAL;
            }
        }

        foreach ($checks as $check) {
            $status = $check['status'] ?? $check['services']['storage']['status'] ?? null;

            if ($status === self::HEALTH_STATUS_WARNING) {
                return self::HEALTH_STATUS_WARNING;
            }
        }

        return self::HEALTH_STATUS_HEALTHY;
    }
}
