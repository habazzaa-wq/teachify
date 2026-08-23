<?php

namespace App\Http\Controllers\Api\v1\Platform;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantSetting;
use App\Services\ExamBank\Import\QuestionImportSettings;
use App\Services\ExamBank\Import\Vision\VisionQuestionExtractorInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Lets the platform super-admin read and manage the "question_import"
 * (AI vision extraction) settings for any tenant, without needing a tenant
 * membership. Mirrors the tenant-scoped behaviour exposed to teachers but
 * is gated by the platform.admin middleware instead.
 */
class PlatformTenantQuestionImportController extends Controller
{
    public function settings(Tenant $tenant): JsonResponse
    {
        QuestionImportSettings::applyForTenant($tenant->id);

        $setting = TenantSetting::query()
            ->where('tenant_id', $tenant->id)
            ->where('group', QuestionImportSettings::GROUP)
            ->first();

        return response()->json([
            'group' => QuestionImportSettings::GROUP,
            'values' => $setting?->values ?? [],
        ]);
    }

    public function updateSettings(Request $request, Tenant $tenant): JsonResponse
    {
        $validated = $request->validate([
            'values' => ['required', 'array'],
            'values.enabled' => ['sometimes', 'boolean'],
            'values.endpoint' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'values.api_key' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'values.model' => ['sometimes', 'nullable', 'string', 'max:128'],
            'values.timeout' => ['sometimes', 'integer', 'min:5', 'max:300'],
            'values.daily_limit' => ['sometimes', 'integer', 'min:1', 'max:10000'],
            'values.rate_limit' => ['sometimes', 'integer', 'min:1', 'max:10000'],
        ]);

        $existing = TenantSetting::query()
            ->where('tenant_id', $tenant->id)
            ->where('group', QuestionImportSettings::GROUP)
            ->first();

        $merged = array_merge($existing?->values ?? [], $validated['values']);

        $setting = TenantSetting::updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'group' => QuestionImportSettings::GROUP,
            ],
            ['values' => $merged],
        );

        return response()->json([
            'message' => 'Settings updated.',
            'group' => QuestionImportSettings::GROUP,
            'values' => $setting->values,
        ]);
    }

    public function health(Tenant $tenant): JsonResponse
    {
        QuestionImportSettings::applyForTenant($tenant->id);

        $enabled = (bool) config('question-import.vision.enabled');
        $hasKey = (bool) config('question-import.vision.api_key');
        $hasEndpoint = (bool) config('question-import.vision.endpoint');
        $model = (string) config('question-import.vision.model', 'gpt-4o-mini');
        $endpoint = (string) config('question-import.vision.endpoint');
        $host = $endpoint ? (parse_url($endpoint, PHP_URL_HOST) ?: 'configured') : null;

        /** @var VisionQuestionExtractorInterface $extractor */
        $extractor = app(VisionQuestionExtractorInterface::class);

        return response()->json(['data' => [
            'enabled' => $enabled,
            'configured' => $enabled && $hasKey && $hasEndpoint,
            'model' => $model,
            'endpointHost' => $host,
            'available' => $extractor->available(),
            'reason' => $extractor->unavailabilityReason(),
        ]]);
    }
}
