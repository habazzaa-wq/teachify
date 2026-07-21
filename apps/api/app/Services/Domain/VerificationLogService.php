<?php

namespace App\Services\Domain;

use App\Models\TenantDomain;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class VerificationLogService
{
    public function record(TenantDomain $domain, string $action, string $status, array $metadata = []): void
    {
        try {
            DB::table('domain_verification_logs')->insert([
                'tenant_domain_id' => $domain->id,
                'action' => $action,
                'status' => $status,
                'message' => $metadata['error'] ?? $metadata['message'] ?? null,
                'metadata' => collect($metadata)->except(['error', 'message'])->toJson(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::error("Failed to write domain verification log", [
                'domain_id' => $domain->id,
                'action' => $action,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
