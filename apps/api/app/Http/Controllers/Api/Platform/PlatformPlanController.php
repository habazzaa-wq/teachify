<?php

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Models\PlatformPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PlatformPlanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PlatformPlan::query();

        if ($search = $request->string('search')) {
            $q = $search->value();
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('slug', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%");
            });
        }

        if ($status = $request->string('status')) {
            $sv = $status->value();
            if ($sv !== 'all') {
                $query->where('status', $sv);
            }
        }

        $sort = $request->string('sort', 'display_order');
        $sortDir = $request->string('sort_dir', 'asc');
        $allowed = ['name', 'monthly_price', 'yearly_price', 'display_order', 'created_at'];
        $sortCol = in_array($sort->value, $allowed) ? $sort->value : 'display_order';
        $query->orderBy($sortCol, $sortDir === 'desc' ? 'desc' : 'asc');

        $plans = $query->get();

        return response()->json([
            'data' => $plans,
            'total' => $plans->count(),
        ]);
    }

    public function metrics(): JsonResponse
    {
        $plans = PlatformPlan::all();

        return response()->json([
            'totalPlans' => $plans->count(),
            'activePlans' => $plans->where('status', 'active')->count(),
            'trialPlans' => $plans->where('trial_enabled', true)->count(),
            'featuredPlans' => $plans->where('recommended', true)->count(),
            'averageMonthlyPrice' => (float) $plans->avg('monthly_price'),
            'unlimitedPlans' => $plans->filter(fn ($p) => $p->features && ($p->features['advancedAnalytics'] ?? false))->count(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:platform_plans,slug'],
            'description' => ['nullable', 'string'],
            'badge' => ['nullable', Rule::in(['most_popular', 'best_value', 'enterprise', 'custom', 'new', 'limited'])],
            'monthlyPrice' => ['required', 'numeric', 'min:0'],
            'yearlyPrice' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:10'],
            'displayOrder' => ['required', 'integer', 'min:0'],
            'trialEnabled' => ['required', 'boolean'],
            'trialDays' => ['required', 'integer', 'min:0'],
            'recommended' => ['required', 'boolean'],
            'visible' => ['required', 'boolean'],
            'status' => ['required', Rule::in(['draft', 'active', 'hidden', 'archived'])],
            'limits' => ['nullable', 'array'],
            'features' => ['nullable', 'array'],
            'videoStorage' => ['nullable', 'array'],
            'branding' => ['nullable', 'array'],
            'integrations' => ['nullable', 'array'],
        ]);

        $plan = PlatformPlan::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'description' => $validated['description'] ?? null,
            'badge' => $validated['badge'] ?? null,
            'monthly_price' => $validated['monthlyPrice'],
            'yearly_price' => $validated['yearlyPrice'],
            'currency' => $validated['currency'],
            'display_order' => $validated['displayOrder'],
            'trial_enabled' => $validated['trialEnabled'],
            'trial_days' => $validated['trialDays'],
            'recommended' => $validated['recommended'],
            'visible' => $validated['visible'],
            'status' => $validated['status'],
            'limits' => $validated['limits'] ?? null,
            'features' => $validated['features'] ?? null,
            'video_storage' => $validated['videoStorage'] ?? null,
            'branding' => $validated['branding'] ?? null,
            'integrations' => $validated['integrations'] ?? null,
        ]);

        return response()->json([
            'message' => 'Plan created.',
            'data' => $plan,
        ], 201);
    }

    public function show(PlatformPlan $platformPlan): JsonResponse
    {
        return response()->json([
            'data' => $platformPlan,
        ]);
    }

    public function update(Request $request, PlatformPlan $platformPlan): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', Rule::unique('platform_plans', 'slug')->ignore($platformPlan->id)],
            'description' => ['nullable', 'string'],
            'badge' => ['nullable', Rule::in(['most_popular', 'best_value', 'enterprise', 'custom', 'new', 'limited'])],
            'monthlyPrice' => ['sometimes', 'numeric', 'min:0'],
            'yearlyPrice' => ['sometimes', 'numeric', 'min:0'],
            'currency' => ['sometimes', 'string', 'max:10'],
            'displayOrder' => ['sometimes', 'integer', 'min:0'],
            'trialEnabled' => ['sometimes', 'boolean'],
            'trialDays' => ['sometimes', 'integer', 'min:0'],
            'recommended' => ['sometimes', 'boolean'],
            'visible' => ['sometimes', 'boolean'],
            'status' => ['sometimes', Rule::in(['draft', 'active', 'hidden', 'archived'])],
            'limits' => ['nullable', 'array'],
            'features' => ['nullable', 'array'],
            'videoStorage' => ['nullable', 'array'],
            'branding' => ['nullable', 'array'],
            'integrations' => ['nullable', 'array'],
        ]);

        $map = collect($validated)->only([
            'name', 'slug', 'description', 'badge',
        ])->all();

        $numericMap = collect($validated)->only([
            'monthlyPrice', 'yearlyPrice', 'displayOrder', 'trialDays',
        ])->mapWithKeys(fn ($v, $k) => [
            [
                'monthly_price' => 'monthly_price',
                'yearly_price' => 'yearly_price',
                'display_order' => 'display_order',
                'trial_days' => 'trial_days',
            ][$k] => $v,
        ])->all();

        $boolMap = collect($validated)->only([
            'trialEnabled', 'recommended', 'visible',
        ])->mapWithKeys(fn ($v, $k) => [
            [
                'trialEnabled' => 'trial_enabled',
                'recommended' => 'recommended',
                'visible' => 'visible',
            ][$k] => $v,
        ])->all();

        $jsonMap = collect($validated)->only([
            'status', 'currency', 'limits', 'features', 'videoStorage', 'branding', 'integrations',
        ])->mapWithKeys(fn ($v, $k) => [
            [
                'status' => 'status',
                'currency' => 'currency',
                'limits' => 'limits',
                'features' => 'features',
                'videoStorage' => 'video_storage',
                'branding' => 'branding',
                'integrations' => 'integrations',
            ][$k] => $v,
        ])->all();

        $platformPlan->fill(array_merge($map, $numericMap, $boolMap, $jsonMap))->save();

        return response()->json([
            'message' => 'Plan updated.',
            'data' => $platformPlan->refresh(),
        ]);
    }

    public function destroy(PlatformPlan $platformPlan): JsonResponse
    {
        $platformPlan->delete();

        return response()->json(['message' => 'Plan deleted.']);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'string'],
        ]);

        PlatformPlan::whereIn('id', $validated['ids'])->delete();

        return response()->json(['message' => 'Plans deleted.']);
    }

    public function activate(PlatformPlan $platformPlan): JsonResponse
    {
        $platformPlan->update(['status' => 'active']);

        return response()->json([
            'message' => 'Plan activated.',
            'data' => $platformPlan->refresh(),
        ]);
    }

    public function deactivate(PlatformPlan $platformPlan): JsonResponse
    {
        $platformPlan->update(['status' => 'hidden']);

        return response()->json([
            'message' => 'Plan deactivated.',
            'data' => $platformPlan->refresh(),
        ]);
    }

    public function archive(PlatformPlan $platformPlan): JsonResponse
    {
        $platformPlan->update(['status' => 'archived']);

        return response()->json([
            'message' => 'Plan archived.',
            'data' => $platformPlan->refresh(),
        ]);
    }

    public function duplicate(PlatformPlan $platformPlan): JsonResponse
    {
        $duplicate = PlatformPlan::create([
            'name' => 'نسخة من ' . $platformPlan->name,
            'slug' => $platformPlan->slug . '-copy-' . Str::random(5),
            'description' => $platformPlan->description,
            'badge' => null,
            'monthly_price' => $platformPlan->monthly_price,
            'yearly_price' => $platformPlan->yearly_price,
            'currency' => $platformPlan->currency,
            'display_order' => PlatformPlan::max('display_order') + 1,
            'trial_enabled' => $platformPlan->trial_enabled,
            'trial_days' => $platformPlan->trial_days,
            'recommended' => false,
            'visible' => false,
            'status' => 'draft',
            'limits' => $platformPlan->limits,
            'features' => $platformPlan->features,
            'video_storage' => $platformPlan->video_storage,
            'branding' => $platformPlan->branding,
            'integrations' => $platformPlan->integrations,
        ]);

        return response()->json([
            'message' => 'Plan duplicated.',
            'data' => $duplicate,
        ], 201);
    }
}
