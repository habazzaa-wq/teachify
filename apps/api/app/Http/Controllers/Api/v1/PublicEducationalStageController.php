<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\EducationalStage;
use Illuminate\Http\JsonResponse;

class PublicEducationalStageController extends Controller
{
    public function index(): JsonResponse
    {
        $tenantId = currentTenant()->id;

        $items = EducationalStage::query()
            ->where('tenant_id', $tenantId)
            ->active()
            ->orderBy('sort_order')
            ->orderBy('created_at', 'asc')
            ->get(['id', 'name', 'description', 'image', 'link'])
            ->map(fn (EducationalStage $stage) => [
                'id' => $stage->id,
                'name' => $stage->name,
                'description' => $stage->description,
                'image' => $stage->image,
                'link' => $stage->link,
            ]);

        return response()->json([
            'items' => $items,
        ]);
    }
}
