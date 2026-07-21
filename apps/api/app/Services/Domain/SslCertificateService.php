<?php

namespace App\Services\Domain;

use App\Models\TenantDomain;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SslCertificateService
{
    public function getCertificateInfo(string $hostname): ?array
    {
        $context = stream_context_create([
            'ssl' => [
                'capture_peer_cert' => true,
                'verify_peer' => false,
                'verify_peer_name' => false,
            ],
        ]);

        $stream = @stream_socket_client(
            "ssl://{$hostname}:443",
            $errno,
            $errstr,
            10,
            STREAM_CLIENT_CONNECT,
            $context
        );

        if (!$stream) {
            return null;
        }

        $options = stream_context_get_options($context);
        $cert = $options['ssl']['peer_certificate'] ?? null;

        if (!$cert) {
            fclose($stream);
            return null;
        }

        $details = openssl_x509_parse($cert);
        fclose($stream);

        if (!$details) {
            return null;
        }

        $issuer = $details['issuer'] ?? [];
        $issuerOrg = $issuer['O'] ?? $issuer['organizationName'] ?? 'unknown';

        return [
            'issuer' => $issuerOrg,
            'subject' => $details['subject']['CN'] ?? $hostname,
            'issued_at' => isset($details['validFrom_time_t'])
                ? date('Y-m-d H:i:s', $details['validFrom_time_t'])
                : null,
            'expires_at' => isset($details['validTo_time_t'])
                ? date('Y-m-d H:i:s', $details['validTo_time_t'])
                : null,
            'serial' => $details['serialNumberHex'] ?? null,
        ];
    }

    public function probeSsl(string $hostname): array
    {
        $info = $this->getCertificateInfo($hostname);

        if ($info === null) {
            return [
                'valid' => false,
                'provider' => null,
                'issued_at' => null,
                'expires_at' => null,
                'error' => 'Could not retrieve SSL certificate.',
            ];
        }

        $provider = $this->detectProvider($info['issuer']);

        return [
            'valid' => true,
            'provider' => $provider,
            'issued_at' => $info['issued_at'],
            'expires_at' => $info['expires_at'],
            'issuer' => $info['issuer'],
            'error' => null,
        ];
    }

    public function isCertificateValid(string $hostname): bool
    {
        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
                'allow_self_signed' => false,
            ],
        ]);

        $stream = @stream_socket_client(
            "ssl://{$hostname}:443",
            $errno,
            $errstr,
            10,
            STREAM_CLIENT_CONNECT,
            $context
        );

        if (!$stream) {
            return false;
        }

        fclose($stream);
        return true;
    }

    public function warmCertificate(string $hostname): bool
    {
        try {
            $response = Http::withOptions([
                'verify' => false,
                'timeout' => 15,
                'connect_timeout' => 10,
                'redirect' => false,
            ])->get("https://{$hostname}/api/diag/ping");

            return $response->successful() || $response->status() === 301 || $response->status() === 302;
        } catch (\Throwable $e) {
            Log::warning("Certificate warm-up failed for {$hostname}: {$e->getMessage()}");
            return false;
        }
    }

    private function detectProvider(string $issuerOrg): string
    {
        $lower = mb_strtolower($issuerOrg);

        if (str_contains($lower, 'let\'s encrypt') || str_contains($lower, 'letsencrypt') || $lower === 'r3' || $lower === 'r10' || $lower === 'r11') {
            return 'letsencrypt';
        }

        if (str_contains($lower, 'cloudflare')) {
            return 'cloudflare';
        }

        if (str_contains($lower, 'google')) {
            return 'google';
        }

        if (str_contains($lower, 'amazon') || str_contains($lower, 'aws')) {
            return 'aws';
        }

        return $issuerOrg;
    }
}
