<?php

namespace App\Services\Domain;

use App\Models\TenantDomain;
use Illuminate\Support\Facades\Log;

class DnsVerificationService
{
    private ?string $serverIp = null;
    private ?string $serverIpv6 = null;

    public function getServerIp(): string
    {
        if ($this->serverIp !== null) {
            return $this->serverIp;
        }

        $ip = config('services.platform.server_ip');
        if ($ip === '' || $ip === null) {
            throw new \RuntimeException(
                'SERVER_IP is not configured. Set it in config/services.php or .env'
            );
        }

        $this->serverIp = $ip;
        return $this->serverIp;
    }

    public function getServerIpv6(): ?string
    {
        if ($this->serverIpv6 !== null || array_key_exists('serverIpv6', get_object_vars($this))) {
            return $this->serverIpv6;
        }

        $ip = config('services.platform.server_ipv6');
        $this->serverIpv6 = ($ip !== '' && $ip !== null) ? $ip : null;

        return $this->serverIpv6;
    }

    public function verify(TenantDomain $domain): array
    {
        $hostname = $domain->domain;
        $serverIp = $this->getServerIp();
        $serverIpv6 = $this->getServerIpv6();

        $aResult = $this->checkARecord($hostname, $serverIp);
        if ($aResult['passed']) {
            return $aResult;
        }

        if ($serverIpv6) {
            $aaaaResult = $this->checkAaaaRecord($hostname, $serverIpv6);
            if ($aaaaResult['passed']) {
                return $aaaaResult;
            }
        }

        $cnameResult = $this->checkCnameRecord($hostname);
        if ($cnameResult['passed']) {
            return $cnameResult;
        }

        $errors = array_filter([
            $aResult['error'] ?? null,
            ($serverIpv6 && isset($aaaaResult)) ? ($aaaaResult['error'] ?? null) : null,
            $cnameResult['error'] ?? null,
        ]);

        return [
            'passed' => false,
            'type' => null,
            'records' => [],
            'error' => "DNS verification failed for {$hostname}. " . implode(' ', $errors),
        ];
    }

    public function isDnsReady(string $hostname): bool
    {
        $serverIp = $this->getServerIp();
        $serverIpv6 = $this->getServerIpv6();

        $aRecords = @dns_get_record($hostname, DNS_A);
        if (!empty($aRecords)) {
            foreach ($aRecords as $record) {
                if (($record['ip'] ?? '') === $serverIp) {
                    return true;
                }
            }
        }

        if ($serverIpv6) {
            $aaaaRecords = @dns_get_record($hostname, DNS_AAAA);
            if (!empty($aaaaRecords)) {
                foreach ($aaaaRecords as $record) {
                    if (($record['ipv6'] ?? '') === $serverIpv6) {
                        return true;
                    }
                }
            }
        }

        $cnameRecords = @dns_get_record($hostname, DNS_CNAME);
        if (!empty($cnameRecords)) {
            $platformDomain = config('services.platform.domain');
            foreach ($cnameRecords as $record) {
                $target = rtrim($record['target'] ?? '', '.');
                if (strcasecmp($target, $platformDomain) === 0) {
                    return true;
                }
            }
        }

        return false;
    }

    private function checkARecord(string $hostname, string $serverIp): array
    {
        $records = @dns_get_record($hostname, DNS_A);

        if (empty($records)) {
            return [
                'passed' => false,
                'type' => null,
                'records' => [],
                'error' => "No A record found for {$hostname}.",
            ];
        }

        $matching = array_filter($records, fn(array $r) => ($r['ip'] ?? '') === $serverIp);

        if (empty($matching)) {
            $found = array_map(fn(array $r) => $r['ip'] ?? '', $records);
            return [
                'passed' => false,
                'type' => 'a',
                'records' => $records,
                'error' => "A record for {$hostname} points to " . implode(', ', $found) . ", expected {$serverIp}.",
            ];
        }

        return [
            'passed' => true,
            'type' => 'a',
            'records' => array_values($matching),
            'error' => null,
        ];
    }

    private function checkAaaaRecord(string $hostname, string $serverIpv6): array
    {
        $records = @dns_get_record($hostname, DNS_AAAA);

        if (empty($records)) {
            return [
                'passed' => false,
                'type' => null,
                'records' => [],
                'error' => "No AAAA record found for {$hostname}.",
            ];
        }

        $matching = array_filter($records, fn(array $r) => ($r['ipv6'] ?? '') === $serverIpv6);

        if (empty($matching)) {
            $found = array_map(fn(array $r) => $r['ipv6'] ?? '', $records);
            return [
                'passed' => false,
                'type' => 'aaaa',
                'records' => $records,
                'error' => "AAAA record for {$hostname} points to " . implode(', ', $found) . ", expected {$serverIpv6}.",
            ];
        }

        return [
            'passed' => true,
            'type' => 'aaaa',
            'records' => array_values($matching),
            'error' => null,
        ];
    }

    private function checkCnameRecord(string $hostname): array
    {
        $records = @dns_get_record($hostname, DNS_CNAME);

        if (empty($records)) {
            return [
                'passed' => false,
                'type' => null,
                'records' => [],
                'error' => "No CNAME record found for {$hostname}.",
            ];
        }

        $platformDomain = config('services.platform.domain');
        $matching = array_filter($records, function (array $r) use ($platformDomain) {
            $target = rtrim($r['target'] ?? '', '.');
            return strcasecmp($target, $platformDomain) === 0;
        });

        if (empty($matching)) {
            $found = array_map(fn(array $r) => rtrim($r['target'] ?? '', '.'), $records);
            return [
                'passed' => false,
                'type' => 'cname',
                'records' => $records,
                'error' => "CNAME for {$hostname} points to " . implode(', ', $found) . ", expected {$platformDomain}.",
            ];
        }

        return [
            'passed' => true,
            'type' => 'cname',
            'records' => array_values($matching),
            'error' => null,
        ];
    }
}
