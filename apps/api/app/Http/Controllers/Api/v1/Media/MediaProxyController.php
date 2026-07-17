<?php

namespace App\Http\Controllers\Api\v1\Media;

use App\Http\Controllers\Controller;
use App\Models\PlatformBunnySetting;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MediaProxyController extends Controller
{
    private const MAX_FILE_SIZE = 50 * 1024 * 1024;

    private const CACHE_CONTROL = 'public, max-age=2592000, stale-while-revalidate=86400';

    public function serve(string $path): Response
    {
        $settings = PlatformBunnySetting::active();

        if (! $settings || ! $settings->hasStorageCredentials()) {
            return response('Media service unavailable.', 503);
        }

        $normalizedPath = ltrim($path, '/');
        $storageUrl = $this->buildStorageUrl($settings, $normalizedPath);

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'AccessKey' => $settings->storage_zone_password,
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

    private function buildStorageUrl(PlatformBunnySetting $settings, string $path): string
    {
        $region = strtolower(trim((string) ($settings->storage_zone_region ?: 'de')));
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

        $host = $hostMap[$region] ?? 'storage.bunnycdn.com';

        return "https://{$host}/{$settings->storage_zone_name}/{$path}";
    }
}
