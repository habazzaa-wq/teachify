<?php

namespace App\Http\Controllers\Api\v1\Tenant;

use App\Http\Controllers\Controller;
use App\Models\TenantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TenantServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenant = app('currentTenant');
        abort_unless(($tenant->feature_flags['has_services'] ?? false) === true, 404);
        $query = TenantService::where('tenant_id', $tenant->id)->orderBy('sort_order')->orderByDesc('created_at');
        return response()->json(['services' => $query->get()]);
    }

    public function publicIndex(): JsonResponse
    {
        $tenant = app('currentTenant');
        abort_unless(($tenant->feature_flags['has_services'] ?? false) === true, 404);
        return response()->json(['services' => TenantService::where('tenant_id', $tenant->id)->where('is_published', true)->orderBy('sort_order')->orderByDesc('created_at')->get()]);
    }

    public function instructors(): JsonResponse
    {
        $tenant = app('currentTenant');
        abort_unless(($tenant->feature_flags['has_services'] ?? false) === true, 404);
        $rows = DB::table('tenant_users')->join('users', 'users.id', '=', 'tenant_users.user_id')
            ->where('tenant_users.tenant_id', $tenant->id)->where('tenant_users.status', 'active')
            ->where('tenant_users.is_instructor', true)->whereNotNull('tenant_users.phone')->where('tenant_users.phone', '<>', '')
            ->select('tenant_users.id', 'users.name', 'tenant_users.phone')->orderBy('users.name')->get();
        return response()->json(['instructors' => $rows]);
    }

    public function store(Request $request): JsonResponse
    {
        return $this->save($request, new TenantService());
    }

    public function update(Request $request, TenantService $service): JsonResponse
    {
        abort_unless($service->tenant_id === app('currentTenant')->id, 404);
        return $this->save($request, $service);
    }

    private function save(Request $request, TenantService $service): JsonResponse
    {
        $tenant = app('currentTenant');
        abort_unless(($tenant->feature_flags['has_services'] ?? false) === true, 404);
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:180'], 'image_url' => ['nullable', 'url', 'max:2048'],
            'summary' => ['nullable', 'string', 'max:280'], 'description' => ['nullable', 'string', 'max:10000'],
            'highlights' => ['nullable', 'array', 'max:12'], 'highlights.*' => ['string', 'max:180'],
            'contact_name' => ['nullable', 'string', 'max:180'], 'contact_phone' => ['required_without:instructor_tenant_user_id', 'nullable', 'string', 'max:32'],
            'instructor_tenant_user_id' => ['nullable', 'integer', Rule::exists('tenant_users', 'id')->where('tenant_id', $tenant->id)],
            'is_published' => ['sometimes', 'boolean'], 'sort_order' => ['sometimes', 'integer', 'min:0', 'max:100000'],
        ]);
        if (! empty($validated['instructor_tenant_user_id'])) {
            $instructor = DB::table('tenant_users')->join('users', 'users.id', '=', 'tenant_users.user_id')->where('tenant_users.id', $validated['instructor_tenant_user_id'])->where('tenant_users.tenant_id', $tenant->id)->where('tenant_users.is_instructor', true)->where('tenant_users.status', 'active')->whereNotNull('tenant_users.phone')->where('tenant_users.phone', '<>', '')->select('users.name', 'tenant_users.phone')->first();
            if (! $instructor) return response()->json(['message' => 'المدرب المحدد لا يملك رقم هاتف صالحاً.'], 422);
            $validated['contact_name'] = $instructor->name;
            $validated['contact_phone'] = $instructor->phone;
        }
        $service->fill($validated);
        $service->tenant_id = $tenant->id;
        $service->save();
        return response()->json(['service' => $service], $service->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(TenantService $service): JsonResponse
    {
        abort_unless($service->tenant_id === app('currentTenant')->id && (app('currentTenant')->feature_flags['has_services'] ?? false) === true, 404);
        $service->delete();
        return response()->json(['message' => 'تم حذف الخدمة.']);
    }
}
