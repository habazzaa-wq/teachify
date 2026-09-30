<?php

namespace App\Http\Controllers\Api\v1\Media;

use App\Http\Controllers\Controller;
use App\Models\PlatformBunnySetting;
use App\Repositories\TenantRepository;
use App\Services\Media\Providers\BunnyStorageProvider;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MediaProxyController extends Controller
{
    private const MAX_FILE_SIZE = 50 * 1024 * 1024;

    private const CACHE_CONTROL = 'public, max-age=2592000, stale-while-revalidate=86400';

    public function serve(string $path, Request $request): Response
    {
        $creds = $this->resolveCredentials($request);

        if ($creds === null) {
            return response('Media service unavailable.', 503);
        }

        $normalizedPath = ltrim($path, '/');
        $storageUrl = $this->buildStorageUrl($creds, $normalizedPath);

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'AccessKey' => $creds['password'],
                ])
                ->withOptions(['stream' => true])
                ->get($storageUrl);

            if (! $response->successful()) {
                Log::channel('bunny')->warning('Media proxy: upstream error', [
                    'path' => $normalizedPath,
                    'status' => $response->status(),
                ]);

                return response('File not found.', 404);
            }

            $contentType = $response->header('Content-Type') ?? 'application/octet-stream';

            if ($contentType === 'application/octet-stream') {
                $ext = strtolower(pathinfo($normalizedPath, PATHINFO_EXTENSION));
                $contentType = [
                    'jpg' => 'image/jpeg',
                    'jpeg' => 'image/jpeg',
                    'png' => 'image/png',
                    'webp' => 'image/webp',
                    'gif' => 'image/gif',
                    'svg' => 'image/svg+xml',
                    'avif' => 'image/avif',
                    'heic' => 'image/heic',
                    'heif' => 'image/heif',
                    'bmp' => 'image/bmp',
                    'ico' => 'image/x-icon',
                ][$ext] ?? $contentType;
            }

            $contentLength = $response->header('Content-Length');

            $headers = [
                'Content-Type' => $contentType,
                'Cache-Control' => self::CACHE_CONTROL,
                'X-Content-Type-Options' => 'nosniff',
            ];

            if ($contentLength) {
                $headers['Content-Length'] = $contentLength;
            }

            $etag = $response->header('ETag');
            if ($etag) {
                $headers['ETag'] = $etag;
            }

            $lastModified = $response->header('Last-Modified');
            if ($lastModified) {
                $headers['Last-Modified'] = $lastModified;
            }

            $body = $response->body();

            return response($body, 200, $headers);
        } catch (\Throwable $e) {
            Log::channel('bunny')->error('Media proxy: exception', [
                'path' => $normalizedPath,
                'error' => $e->getMessage(),
            ]);

            return response('Media proxy error.', 502);
        }
    }

    /**
     * Resolve Bunny storage credentials the same way the rest of the media
     * stack does: the tenant's own integration first, then the platform-wide
     * settings. Media proxy requests arrive without authenticated context
     * (they are plain <img> loads), so the tenant is derived from the headers
     * Caddy forwards, mirroring IdentifyTenant.
     *
     * @return array{zone: string, password: string, region: string}|null
     */
    private function resolveCredentials(Request $request): ?array
    {
        $tenantId = $this->resolveTenantId($request);

        if ($tenantId !== null) {
            try {
                $config = app(BunnyStorageProvider::class)->configForTenant($tenantId);

                $zone = $config['storage_zone_name'] ?? $config['zone'] ?? null;
                $password = $config['storage_zone_password']
                    ?? $config['password']
                    ?? $config['client_upload_key']
                    ?? null;

                if (is_string($zone) && $zone !== '' && is_string($password) && $password !== '') {
                    return [
                        'zone' => $zone,
                        'password' => $password,
                        'region' => strtolower(trim((string) ($config['region'] ?? 'de'))) ?: 'de',
                    ];
                }
            } catch (\Throwable) {
                // Fall through to the platform-wide settings.
            }
        }

        $settings = PlatformBunnySetting::active();

        if (! $settings || ! $settings->hasStorageCredentials()) {
            return null;
        }

        return [
            'zone' => $settings->storage_zone_name,
            'password' => $settings->storage_zone_password,
            'region' => strtolower(trim((string) $settings->storage_zone_region ?: 'de')) ?: 'de',
        ];
    }

    private function resolveTenantId(Request $request): ?int
    {
        $tenantRepository = app(TenantRepository::class);

        $headerId = trim((string) $request->header('X-Tenant-ID', ''));
        if ($headerId !== '') {
            $tenant = $tenantRepository->findById($headerId);
            if ($tenant && $tenantRepository->isActive((string) $tenant->id)) {
                return (int) $tenant->id;
            }
        }

        $domain = trim((string) $request->header('X-Tenant-Domain', ''));
        if ($domain !== '') {
            $tenant = $tenantRepository->findByDomain($domain);
            if ($tenant) {
                return (int) $tenant->id;
            }
        }

        $forwardedHost = trim((string) $request->header('X-Forwarded-Host', ''));
        if ($forwardedHost !== '') {
            $tenant = $tenantRepository->findByHostname($forwardedHost);
            if ($tenant) {
                return (int) $tenant->id;
            }
        }

        $tenant = $tenantRepository->findByHostname($request->getHost());
        if ($tenant) {
            return (int) $tenant->id;
        }

        return null;
    }

    /**
     * @param array{zone: string, password: string, region: string} $creds
     */
    private function buildStorageUrl(array $creds, string $path): string
    {
        $hostMap = [
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

        $host = $hostMap[$creds['region']] ?? 'storage.bunnycdn.com';

        return "https://{$host}/{$creds['zone']}/{$path}";
    }
}
