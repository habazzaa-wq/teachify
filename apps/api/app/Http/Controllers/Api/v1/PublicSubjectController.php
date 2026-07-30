<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;

class PublicSubjectController extends Controller
{
    public function index(): JsonResponse
    {
        $tenantId = request('tenant_id', currentTenant()?->id);

        $items = Subject::query()
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'description', 'image', 'icon']);

        return response()->json(['items' => $items]);
    }
}
