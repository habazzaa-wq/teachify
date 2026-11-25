<?php

namespace App\Support;

use App\Models\TenantSetting;

/**
 * Optional student-account fields configurable by each tenant admin.
 * Mandatory fields (name, email, phone, password) are intentionally absent —
 * they can never be switched off.
 */
final class StudentFields
{
    public const OPTIONAL = [
        'parent_phone', 'gender', 'study_type', 'study_level',
        'nationality', 'governorate', 'city',
    ];

    /**
     * @return array<string, bool>
     */
    public static function defaults(): array
    {
        return array_fill_keys(self::OPTIONAL, true);
    }

    /**
     * Resolve the tenant's saved choices, filling in defaults for any field
     * that was never configured.
     *
     * @return array<string, bool>
     */
    public static function resolve(int $tenantId): array
    {
        $saved = TenantSetting::query()
            ->where('tenant_id', $tenantId)
            ->where('group', 'student_fields')
            ->first()?->values ?? [];

        $resolved = self::defaults();
        foreach (self::OPTIONAL as $key) {
            if (array_key_exists($key, $saved)) {
                $resolved[$key] = (bool) $saved[$key];
            }
        }

        return $resolved;
    }

    /**
     * Only the fields currently enabled for this tenant.
     *
     * @return array<string, bool>
     */
    public static function enabled(int $tenantId): array
    {
        return array_filter(self::resolve($tenantId));
    }

    /**
     * Drop any optional field the tenant admin disabled. Non-optional keys
     * such as `name` are left untouched.
     *
     * @param array<string, mixed> $values
     * @return array<string, mixed>
     */
    public static function onlyEnabled(int $tenantId, array $values): array
    {
        return array_intersect_key($values, self::enabled($tenantId));
    }

    /**
     * Validation rules for all optional fields. Only enabled fields are
     * returned, so a disabled field is ignored even when a client sends it.
     *
     * @return array<string, array<int, string>>
     */
    public static function rulesFor(int $tenantId): array
    {
        return array_intersect_key(self::fieldRules(), self::enabled($tenantId));
    }

    /**
     * @return array<string, array<int, string>>
     */
    public static function fieldRules(): array
    {
        return [
            'parent_phone' => ['nullable', 'string', 'max:50'],
            'gender' => ['nullable', 'string', 'max:20'],
            'study_type' => ['nullable', 'string', 'max:100'],
            'study_level' => ['nullable', 'string', 'max:100'],
            'nationality' => ['nullable', 'string', 'max:100'],
            'governorate' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
        ];
    }

    /**
     * Validation rules for the admin settings form.
     *
     * @return array<string, array<int, string>>
     */
    public static function validationRules(): array
    {
        $rules = ['values' => ['required', 'array']];
        foreach (self::OPTIONAL as $key) {
            $rules['values.'.$key] = ['boolean'];
        }

        return $rules;
    }
}
