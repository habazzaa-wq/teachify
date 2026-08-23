<?php

namespace App\Services\ExamBank\Import;

use App\Models\TenantSetting;

/**
 * Resolves the effective vision-extraction configuration for a tenant by
 * merging environment defaults with the tenant's own `question_import`
 * settings group (managed from the teacher dashboard). This lets teachers
 * enable/configure the AI vision provider dynamically without touching
 * server env files.
 */
final class QuestionImportSettings
{
    public const GROUP = 'question_import';

    private const KEYS = [
        'enabled',
        'endpoint',
        'api_key',
        'model',
        'timeout',
        'daily_limit',
        'rate_limit',
    ];

    /**
     * Applies the tenant's effective vision config into the Laravel config
     * runtime so every downstream `config('question-import.vision.*')` read
     * (extractor, rate limiter, health) reflects the tenant's choice.
     */
    public static function applyForTenant(int $tenantId): void
    {
        $env = (array) config('question-import.vision', []);

        $row = TenantSetting::query()
            ->where('tenant_id', $tenantId)
            ->where('group', self::GROUP)
            ->first();

        $stored = $row?->values ?? [];

        $merged = $env;
        foreach (self::KEYS as $key) {
            // A blank tenant value means "fall back to the environment default".
            if (array_key_exists($key, $stored) && $stored[$key] !== null && $stored[$key] !== '') {
                $merged[$key] = $stored[$key];
            }
        }

        // Normalize scalar types so boolean/integer checks behave predictably.
        $merged['enabled'] = filter_var($merged['enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $merged['timeout'] = (int) ($merged['timeout'] ?? 45);
        $merged['daily_limit'] = (int) ($merged['daily_limit'] ?? 50);
        $merged['rate_limit'] = (int) ($merged['rate_limit'] ?? 10);
        $merged['model'] = (string) ($merged['model'] ?? 'gpt-4o-mini');
        $merged['endpoint'] = (string) ($merged['endpoint'] ?? '');
        $merged['api_key'] = (string) ($merged['api_key'] ?? '');

        config()->set('question-import.vision', $merged);
    }
}
