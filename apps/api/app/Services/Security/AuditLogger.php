<?php

namespace App\Services\Security;

use Illuminate\Support\Facades\Log;

class AuditLogger
{
    /**
     * @param  array<string, mixed>  $context
     */
    public function record(string $event, array $context = []): void
    {
        Log::info('audit.'.$event, $context);
    }
}
