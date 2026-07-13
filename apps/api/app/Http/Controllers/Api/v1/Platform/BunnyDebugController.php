<?php

namespace App\Http\Controllers\Api\v1\Platform;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class BunnyDebugController extends Controller
{
    public function test(Request $request): JsonResponse
    {
        $zone = $request->input('storage_zone_name', '');
        $password = $request->input('storage_zone_password', '');

        if ($zone === '' || $password === '') {
            return response()->json([
                'error' => 'storage_zone_name and storage_zone_password are required in POST body.',
            ], 400);
        }

        $results = [];

        $regionEndpoints = [
            'de' => 'storage.bunnycdn.com',
            'uk' => 'uk.storage.bunnycdn.com',
            'gb' => 'uk.storage.bunnycdn.com',
            'ny' => 'ny.storage.bunnycdn.com',
            'la' => 'la.storage.bunnycdn.com',
            'sg' => 'sg.storage.bunnycdn.com',
            'se' => 'se.storage.bunnycdn.com',
            'br' => 'br.storage.bunnycdn.com',
            'jh' => 'jh.storage.bunnycdn.com',
            'syd' => 'syd.storage.bunnycdn.com',
        ];

        $results['credentials'] = [
            'zone' => $zone,
            'password_length' => strlen($password),
            'password_hex_first16' => bin2hex(substr($password, 0, 8)),
            'password_is_uuid_format' => (bool) preg_match(
                '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
                $password
            ),
            'password_has_whitespace' => $password !== trim($password),
            'password_has_newlines' => str_contains($password, "\n") || str_contains($password, "\r"),
        ];

        $results['regions_tested'] = [];

        foreach ($regionEndpoints as $regionCode => $host) {
            $url = "https://{$host}/{$zone}/";

            try {
                $response = Http::withHeaders([
                    'AccessKey' => $password,
                ])
                    ->timeout(8)
                    ->withOptions(['connect_timeout' => 8])
                    ->send('GET', $url);

                $body = $response->body();

                $results['regions_tested'][$regionCode] = [
                    'url' => $url,
                    'status' => $response->status(),
                    'body' => substr($body, 0, 500),
                    'success' => $response->successful(),
                ];
            } catch (\Throwable $e) {
                $results['regions_tested'][$regionCode] = [
                    'url' => $url,
                    'status' => 'error',
                    'body' => $e->getMessage(),
                    'success' => false,
                ];
            }
        }

        $successRegion = null;
        foreach ($results['regions_tested'] as $code => $r) {
            if ($r['success']) {
                $successRegion = $code;
                break;
            }
        }

        $results['diagnosis'] = $successRegion
            ? "SUCCESS on region {$successRegion}. Your zone is in the {$successRegion} region."
            : "FAILED on ALL regions. The password is wrong for every endpoint.";

        $results['diagnosis'] .= ' Bunny Storage Zone Password must be found at: Storage > ' . $zone . ' > FTP & API Access > Password.';

        return response()->json($results, 200);
    }
}
