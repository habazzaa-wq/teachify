<?php

namespace App\Services\Platform;

use App\Models\PlatformBunnySetting;
use App\Models\PlatformAdmin;
use App\Models\User;
use App\Repositories\PlatformBunnySettingRepository;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

class PlatformBunnySettingService
{
    /**
     * Known Bunny Stream API regions.
     *
     * @var array<int, string>
     */
    private const STREAM_REGIONS = ['de', 'uk', 'gb', 'sg', 'la', 'ny'];

    public function __construct(
        private readonly PlatformBunnySettingRepository $repository,
        private readonly AuditLogService $audit,
    ) {
    }

    /**
     * Return the current settings row (a fresh instance when unconfigured).
     */
    public function getSettings(): PlatformBunnySetting
    {
        return $this->repository->getOrNew();
    }

    /**
     * Persist settings, verifying credentials first when present.
     *
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function updateSettings(array $data, User $actor): array
    {
        $settings = $this->repository->getActive() ?? new PlatformBunnySetting();

        $candidate = collect($data)->only($settings->getFillable())->all();

        $requiresVerification = $this->hasCredentialChanges($candidate);

        if ($requiresVerification) {
            $verification = $this->verifyConnection($candidate);

            if ($verification['status'] !== PlatformBunnySetting::CONNECTION_CONNECTED) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'credentials' => [$verification['error'] ?? 'The Bunny credentials could not be verified.'],
                ]);
            }
        }

        $saved = $this->repository->update($candidate);

        if ($requiresVerification) {
            $this->repository->recordVerification([
                'status' => PlatformBunnySetting::CONNECTION_CONNECTED,
                'verified_at' => now()->toIso8601String(),
            ]);
            $saved = $this->repository->getActive();
        }

        $this->auditAction($actor, 'bunny_settings.updated', $saved?->id, [
            'verified' => $requiresVerification,
        ]);

        return $this->repository->getActive() ?? $saved;
    }

    /**
     * Verify a set of candidate credentials against the live Bunny API.
     *
     * @param array<string, mixed> $credentials
     * @return array{status: string, error: string|null, details: array<string, mixed>}
     */
    public function verifyConnection(array $credentials): array
    {
        $zone = trim((string) ($credentials['storage_zone_name'] ?? ''));
        $apiKey = trim((string) ($credentials['api_key'] ?? ''));
        $password = $credentials['storage_zone_password'] ?? null;
        $region = strtolower(trim((string) ($credentials['storage_zone_region'] ?? 'de')));
        $libraryId = trim((string) ($credentials['library_id'] ?? ''));
        $streamKey = trim((string) ($credentials['stream_api_key'] ?? ''));
        $enableStream = (bool) ($credentials['enable_stream'] ?? false);

        if ($zone === '' || $apiKey === '' || $password === null || $password === '') {
            return $this->result(PlatformBunnySetting::CONNECTION_STORAGE_MISSING, 'Storage zone name, password and API key are required.');
        }

        if ($enableStream) {
            if (! in_array($region, self::STREAM_REGIONS, true)) {
                return $this->result(PlatformBunnySetting::CONNECTION_REGION_ERROR, "Unsupported Bunny region: {$region}.");
            }

            if ($libraryId === '' || $streamKey === '') {
                return $this->result(PlatformBunnySetting::CONNECTION_LIBRARY_MISSING, 'Stream library ID and Stream API key are required when streaming is enabled.');
            }
        }

        // 1. Verify the storage zone exists and the zone password is authorized.
        $storageHost = $this->storageHost($region);
        $storageUrl = "https://{$storageHost}/{$zone}/";

        \Log::channel('single')->info('Bunny Verify Debug', [
            'zone' => $zone,
            'region' => $region,
            'storage_host' => $storageHost,
            'url' => $storageUrl,
            'password_length' => $password !== null ? strlen($password) : 0,
            'password_first4' => $password !== null ? substr($password, 0, 4) : null,
            'password_last4' => $password !== null ? substr($password, -4) : null,
        ]);

        $storage = $this->call($storageUrl, 'GET', [
            'AccessKey' => $password,
        ]);

        $storageOk = $storage['status'] === 'ok';
        $storageError = null;

        if ($storage['status'] === 'timeout') {
            $storageError = 'Storage API timed out.';
        } elseif ($storage['status'] === 'unauthorized') {
            $storageError = 'Storage zone password is unauthorized.';
        } elseif ($storage['status'] === 'missing') {
            $storageError = "Storage zone \"{$zone}\" not found.";
        } elseif ($storage['status'] === 'error') {
            $storageError = 'Storage API returned an unexpected error.';
        }

        if (! $storageOk) {
            $code = match ($storage['status']) {
                'timeout' => PlatformBunnySetting::CONNECTION_TIMEOUT,
                'unauthorized' => PlatformBunnySetting::CONNECTION_UNAUTHORIZED,
                'missing' => PlatformBunnySetting::CONNECTION_STORAGE_MISSING,
                default => PlatformBunnySetting::CONNECTION_API_ERROR,
            };

            return $this->result($code, $storageError, [
                'storage' => ['status' => 'failed', 'error' => $storageError],
                'stream' => ['status' => $enableStream ? 'skipped' : 'disabled'],
            ]);
        }

        // 2. Verify the stream library when streaming is enabled.
        $streamStatus = 'disabled';
        $streamError = null;

        if ($enableStream) {
            $library = $this->call("https://video.bunnycdn.com/library/{$libraryId}", 'GET', [
                'AccessKey' => $streamKey,
            ]);

            if ($library['status'] === 'ok') {
                $streamStatus = 'ok';
            } else {
                $streamStatus = 'failed';
                $streamError = match ($library['status']) {
                    'timeout' => 'Stream API timed out.',
                    'unauthorized' => 'Stream API key is unauthorized.',
                    'missing' => "Stream library \"{$libraryId}\" not found.",
                    default => 'Stream API returned an unexpected error.',
                };

                $code = match ($library['status']) {
                    'timeout' => PlatformBunnySetting::CONNECTION_TIMEOUT,
                    'unauthorized' => PlatformBunnySetting::CONNECTION_UNAUTHORIZED,
                    'missing' => PlatformBunnySetting::CONNECTION_LIBRARY_MISSING,
                    default => PlatformBunnySetting::CONNECTION_API_ERROR,
                };

                return $this->result($code, $streamError, [
                    'storage' => ['status' => 'ok'],
                    'stream' => ['status' => 'failed', 'error' => $streamError],
                ]);
            }
        }

        return $this->result(
            PlatformBunnySetting::CONNECTION_CONNECTED,
            null,
            ['storage' => ['status' => 'ok'], 'stream' => ['status' => $streamStatus]],
        );
    }

    /**
     * Run a health check against the currently stored credentials.
     *
     * @return array<string, mixed>
     */
    public function healthCheck(): array
    {
        $settings = $this->repository->getActive();

        if (! $settings || ! $settings->hasStorageCredentials()) {
            return $this->result(PlatformBunnySetting::CONNECTION_DISCONNECTED, 'Bunny integration is not configured.');
        }

        $verification = $this->verifyConnection([
            'storage_zone_name' => $settings->storage_zone_name,
            'storage_zone_password' => $settings->storage_zone_password,
            'api_key' => $settings->api_key,
            'storage_zone_region' => $settings->storage_zone_region,
            'library_id' => $settings->library_id,
            'stream_api_key' => $settings->stream_api_key,
            'enable_stream' => $settings->enable_stream,
        ]);

        $this->repository->recordVerification([
            'status' => $verification['status'],
            'error' => $verification['error'],
            'verified_at' => now()->toIso8601String(),
        ]);

        return $verification;
    }

    /**
     * Rotate secrets: regenerate the signed URL secret and optionally replace keys.
     *
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function rotateSecrets(array $data, User $actor): array
    {
        $settings = $this->repository->getOrNew();

        if (! empty($data['api_key'])) {
            $settings->api_key = $data['api_key'];
        }

        if (! empty($data['stream_api_key'])) {
            $settings->stream_api_key = $data['stream_api_key'];
        }

        $settings->signed_url_secret = Str::random(40);

        // Re-verify if credentials changed.
        if (! empty($data['api_key']) || ! empty($data['stream_api_key'])) {
            $verification = $this->verifyConnection([
                'storage_zone_name' => $settings->storage_zone_name,
                'storage_zone_password' => $settings->storage_zone_password,
                'api_key' => $settings->api_key,
                'storage_zone_region' => $settings->storage_zone_region,
                'library_id' => $settings->library_id,
                'stream_api_key' => $settings->stream_api_key,
                'enable_stream' => $settings->enable_stream,
            ]);

            if ($verification['status'] !== PlatformBunnySetting::CONNECTION_CONNECTED) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'credentials' => [$verification['error'] ?? 'The rotated credentials could not be verified.'],
                ]);
            }
        }

        $saved = $this->repository->update($settings->getAttributes());
        $this->auditAction($actor, 'bunny_settings.rotated', $saved->id, ['signed_url_secret' => true]);

        return $this->repository->getActive() ?? $saved;
    }

    /**
     * Reveal a single decrypted secret. Caller must have already confirmed intent.
     */
    public function revealSecret(string $field, User $actor): ?string
    {
        $allowed = ['api_key', 'stream_api_key', 'storage_zone_password', 'signed_url_secret'];

        if (! in_array($field, $allowed, true)) {
            return null;
        }

        $settings = $this->repository->getActive();

        if (! $settings) {
            return null;
        }

        $this->auditAction($actor, 'bunny_settings.revealed', $settings->id, ['field' => $field]);

        return $settings->{$field};
    }

    /**
     * Disable the Bunny integration without deleting credentials.
     *
     * @return array<string, mixed>
     */
    public function disableIntegration(User $actor): array
    {
        $settings = $this->repository->getOrNew();
        $settings->enabled = false;
        $settings->connection_status = PlatformBunnySetting::CONNECTION_DISCONNECTED;
        $settings->save();

        $this->auditAction($actor, 'bunny_settings.disabled', $settings->id, []);

        return $this->repository->getActive() ?? $settings->refresh();
    }

    /**
     * Delete only the credentials (Danger Zone).
     *
     * @return array<string, mixed>
     */
    public function deleteCredentials(User $actor): array
    {
        $settings = $this->repository->deleteCredentials();

        $this->auditAction($actor, 'bunny_settings.credentials_deleted', $settings->id, []);

        return $this->repository->getActive() ?? $settings;
    }

    /**
     * Reset the entire configuration to platform defaults (Danger Zone).
     *
     * @return array<string, mixed>
     */
    public function resetConfiguration(User $actor): array
    {
        $settings = $this->repository->reset();

        $this->auditAction($actor, 'bunny_settings.reset', $settings->id, []);

        return $this->repository->getActive() ?? $settings;
    }

    /**
     * Encrypt a set of credential fields for transport/storage.
     *
     * @param array<string, mixed> $credentials
     * @return array<string, mixed>
     */
    public function encryptCredentials(array $credentials): array
    {
        $out = [];
        foreach ($credentials as $key => $value) {
            $out[$key] = $value === null ? null : \Illuminate\Support\Facades\Crypt::encryptString((string) $value);
        }

        return $out;
    }

    /**
     * Decrypt a set of credential fields.
     *
     * @param array<string, mixed> $credentials
     * @return array<string, mixed>
     */
    public function decryptCredentials(array $credentials): array
    {
        $out = [];
        foreach ($credentials as $key => $value) {
            if ($value === null || $value === '') {
                $out[$key] = null;
                continue;
            }
            try {
                $out[$key] = \Illuminate\Support\Facades\Crypt::decryptString((string) $value);
            } catch (Throwable) {
                $out[$key] = null;
            }
        }

        return $out;
    }

    /**
     * Mask every secret field in the given array for display.
     *
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function maskSecrets(array $data): array
    {
        $secretKeys = ['api_key', 'stream_api_key', 'storage_zone_password', 'signed_url_secret'];

        foreach ($secretKeys as $key) {
            if (array_key_exists($key, $data)) {
                $data[$key] = $this->maskSecret($data[$key]);
            }
        }

        return $data;
    }

    private function maskSecret(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $len = strlen($value);

        if ($len <= 8) {
            return str_repeat('•', $len);
        }

        return substr($value, 0, 4).str_repeat('•', max(4, $len - 8)).substr($value, -4);
    }

    /**
     * @return array{status: string, error: string|null, details: array<string, mixed>}
     */
    private function result(string $status, ?string $error, array $details = []): array
    {
        return [
            'status' => $status,
            'error' => $error,
            'details' => $details,
        ];
    }

    private function storageHost(string $region): string
    {
        $map = [
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

        return $map[$region] ?? $map['de'];
    }

    /**
     * @return array{status: string}
     */
    private function call(string $url, string $method, array $headers): array
    {
        try {
            \Log::channel('single')->info('Bunny API Request', [
                'method' => $method,
                'url' => $url,
                'headers' => $headers,
            ]);

            $response = Http::withHeaders($headers)
                ->timeout(8)
                ->withOptions(['connect_timeout' => 8])
                ->send($method, $url);

            \Log::channel('single')->info('Bunny API Response', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            if ($response->status() === 401 || $response->status() === 403) {
                return ['status' => 'unauthorized'];
            }

            if ($response->status() === 404) {
                return ['status' => 'missing'];
            }

            if ($response->successful()) {
                return ['status' => 'ok'];
            }

            return ['status' => 'error'];
        } catch (ConnectionException) {
            return ['status' => 'timeout'];
        } catch (Throwable) {
            return ['status' => 'error'];
        }
    }

    /**
     * @param array<string, mixed> $meta
     */
    private function auditAction(User $actor, string $event, ?int $entityId, array $meta): void
    {
        $admin = PlatformAdmin::query()->where('user_id', $actor->id)->first();

        if (! $admin) {
            return;
        }

        $this->audit->recordPlatform(
            $admin,
            'platform.bunny',
            'platform_bunny_settings',
            $entityId ?? 0,
            $event,
            $meta,
        );
    }

    /**
     * @param array<string, mixed> $candidate
     */
    private function hasCredentialChanges(array $candidate): bool
    {
        return isset($candidate['storage_zone_name'])
            || isset($candidate['storage_zone_password'])
            || isset($candidate['api_key'])
            || isset($candidate['stream_api_key'])
            || isset($candidate['library_id'])
            || isset($candidate['storage_zone_region'])
            || isset($candidate['enable_stream']);
    }
}
