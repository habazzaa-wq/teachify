<?php

namespace App\Console\Commands;

use App\Models\PlatformBunnySetting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;

class BunnyDebugCommand extends Command
{
    protected $signature = 'bunny:debug';

    protected $description = 'Debug Bunny storage authentication';

    public function handle(): int
    {
        $this->newLine();
        $this->line('<fg=cyan>═══════════════════════════════════════════════</>');
        $this->line('<fg=cyan>  Bunny Integration Debug Audit</>');
        $this->line('<fg=cyan>═══════════════════════════════════════════════</>');
        $this->newLine();

        $settings = PlatformBunnySetting::query()->first();

        if (! $settings) {
            $this->error('No platform_bunny_settings row found in database.');

            return 1;
        }

        $this->line('<fg=yellow>── 1. DATABASE ROW ──</>');
        $this->table(['Field', 'Value'], [
            ['id', $settings->id],
            ['storage_zone_name', $settings->storage_zone_name ?? '(null)'],
            ['storage_zone_region', $settings->storage_zone_region ?? '(null)'],
            ['cdn_hostname', $settings->cdn_hostname ?? '(null)'],
            ['library_id', $settings->library_id ?? '(null)'],
            ['enabled', $settings->enabled ? 'true' : 'false'],
            ['enable_stream', $settings->enable_stream ? 'true' : 'false'],
            ['connection_status', $settings->connection_status],
            ['last_error', $settings->last_error ?? '(null)'],
            ['last_verified_at', $settings->last_verified_at?->toIso8601String() ?? '(null)'],
        ]);
        $this->newLine();

        $this->line('<fg=yellow>── 2. RAW DATABASE VALUES (before cast) ──</>');
        $rawAttributes = $settings->getAttributes();
        foreach (['storage_zone_password', 'api_key', 'stream_api_key', 'signed_url_secret'] as $field) {
            $raw = $rawAttributes[$field] ?? null;
            $this->table(["Field: {$field}"], [
                ['raw strlen', $raw !== null ? strlen($raw) : '(null)'],
                ['raw first 4', $raw !== null ? substr($raw, 0, 4) : '(null)'],
                ['raw last 4', $raw !== null ? substr($raw, -4) : '(null)'],
                ['raw is_json', $raw !== null && str_starts_with($raw, 'eyJ') ? 'YES (likely Laravel encrypted)' : 'no'],
            ]);
        }
        $this->newLine();

        $this->line('<fg=yellow>── 3. DECRYPTED VALUES (after Encrypted cast) ──</>');
        foreach (['storage_zone_password', 'api_key', 'stream_api_key', 'signed_url_secret'] as $field) {
            $decrypted = $settings->{$field};
            if ($decrypted === null) {
                $this->table(["Field: {$field}"], [['value', '(null)']]);
                continue;
            }
            $len = strlen($decrypted);
            $this->table(["Field: {$field}"], [
                ['length', $len],
                ['first 4', substr($decrypted, 0, 4)],
                ['last 4', substr($decrypted, -4)],
            ]);
        }
        $this->newLine();

        $this->line('<fg=yellow>── 4. HIDDEN CHARACTER DETECTION ──</>');
        $password = $settings->storage_zone_password;
        if ($password !== null) {
            $issues = [];
            if ($password !== ltrim($password)) {
                $issues[] = 'LEADING WHITESPACE DETECTED';
            }
            if ($password !== rtrim($password)) {
                $issues[] = 'TRAILING WHITESPACE DETECTED';
            }
            if (str_contains($password, "\n")) {
                $issues[] = 'NEWLINE (\\n) DETECTED';
            }
            if (str_contains($password, "\r")) {
                $issues[] = 'CARRIAGE RETURN (\\r) DETECTED';
            }
            if (str_contains($password, "\t")) {
                $issues[] = 'TAB CHARACTER DETECTED';
            }
            if (preg_match('/\xE2\x80[\x80-\x8F]/', $password) || str_contains($password, "\xEF\xBB\xBF")) {
                $issues[] = 'UTF-8 BOM DETECTED';
            }
            if (preg_match('/\p{C}/u', $password) && preg_replace('/\s/u', '', $password) !== '') {
                $issues[] = 'NON-PRINTABLE / ZERO-WIDTH CHARACTERS DETECTED';
            }
            if ($issues === []) {
                $this->info('No formatting issues detected in storage_zone_password.');
            } else {
                foreach ($issues as $issue) {
                    $this->error("  ⚠ {$issue}");
                }
            }
        } else {
            $this->warn('storage_zone_password is NULL — cannot check formatting.');
        }
        $this->newLine();

        $this->line('<fg=yellow>── 5. REGION-AWARE ENDPOINT RESOLUTION ──</>');
        $region = strtolower(trim((string) ($settings->storage_zone_region ?: 'de')));
        $storageEndpoint = $this->resolveStorageEndpoint($region);
        $fullUrl = rtrim($storageEndpoint, '/').'/'.$settings->storage_zone_name.'/';
        $this->table(['Field', 'Value'], [
            ['storage_zone_region', $region],
            ['resolved endpoint', $storageEndpoint],
            ['full URL', $fullUrl],
            ['hardcoded endpoint', 'https://storage.bunnycdn.com'],
            ['endpoint matches hardcoded?', $storageEndpoint === 'https://storage.bunnycdn.com' ? 'YES' : 'NO — DIFFERENT REGION!'],
        ]);
        $this->newLine();

        $this->line('<fg=yellow>── 6. HTTP REQUEST TO BUNNY (hardcoded endpoint) ──</>');
        $hardcodedUrl = 'https://storage.bunnycdn.com/'.$settings->storage_zone_name.'/';
        $this->line("  URL:    GET {$hardcodedUrl}");
        $this->line("  Header: AccessKey: {$password}");
        $this->newLine();

        try {
            $response = Http::withHeaders([
                'AccessKey' => $password,
            ])->timeout(8)->withOptions(['connect_timeout' => 8])->send('GET', $hardcodedUrl);

            $this->table(['Metric', 'Value'], [
                ['HTTP Status', $response->status()],
                ['Response Body (first 500 chars)', substr($response->body(), 0, 500)],
                ['Response Headers', json_encode($response->headers(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)],
            ]);
        } catch (\Throwable $e) {
            $this->error("  Request failed: {$e->getMessage()}");
        }
        $this->newLine();

        if ($storageEndpoint !== 'https://storage.bunnycdn.com') {
            $this->line('<fg=yellow>── 7. HTTP REQUEST TO BUNNY (region-correct endpoint) ──</>');
            $regionalUrl = $fullUrl;
            $this->line("  URL:    GET {$regionalUrl}");
            $this->line("  Header: AccessKey: {$password}");
            $this->newLine();

            try {
                $response = Http::withHeaders([
                    'AccessKey' => $password,
                ])->timeout(8)->withOptions(['connect_timeout' => 8])->send('GET', $regionalUrl);

                $this->table(['Metric', 'Value'], [
                    ['HTTP Status', $response->status()],
                    ['Response Body (first 500 chars)', substr($response->body(), 0, 500)],
                    ['Response Headers', json_encode($response->headers(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)],
                ]);
            } catch (\Throwable $e) {
                $this->error("  Request failed: {$e->getMessage()}");
            }
            $this->newLine();
        }

        $this->line('<fg=yellow>── 8. DIAGNOSIS ──</>');
        if ($storageEndpoint !== 'https://storage.bunnycdn.com') {
            $this->error('ROOT CAUSE: Storage zone region is "'.$region.'", but all storage');
            $this->error('API calls are hardcoded to storage.bunnycdn.com (Frankfurt).');
            $this->error('Bunny returns 401 for non-DE zones on the DE endpoint.');
            $this->newLine();
            $this->info('FIX: Use "'.$storageEndpoint.'/'.$settings->storage_zone_name.'/\" instead.');
        } else {
            $this->info('Storage zone is in DE region — endpoint matches hardcoded value.');
            $this->warn('If Bunny still returns 401, verify the password in Bunny dashboard.');
        }

        $this->newLine();

        return 0;
    }

    private function resolveStorageEndpoint(string $region): string
    {
        return match ($region) {
            'uk', 'gb' => 'https://uk.storage.bunnycdn.com',
            'ny' => 'https://ny.storage.bunnycdn.com',
            'la' => 'https://la.storage.bunnycdn.com',
            'sg' => 'https://sg.storage.bunnycdn.com',
            'se' => 'https://se.storage.bunnycdn.com',
            'br' => 'https://br.storage.bunnycdn.com',
            'jh', 'za' => 'https://jh.storage.bunnycdn.com',
            'syd', 'au' => 'https://syd.storage.bunnycdn.com',
            default => 'https://storage.bunnycdn.com',
        };
    }
}
