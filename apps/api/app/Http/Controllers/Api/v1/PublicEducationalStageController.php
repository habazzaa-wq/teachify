<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\EducationalStage;
use Illuminate\Database\Eloquent\ModelNotFoundException;
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

    public function show(int $id): JsonResponse
    {
        $tenantId = currentTenant()->id;

        $stage = EducationalStage::query()
            ->where('tenant_id', $tenantId)
            ->active()
            ->find($id);

        if (! $stage) {
            throw new ModelNotFoundException('Educational stage not found.');
        }

        return response()->json([
            'data' => [
                'id' => $stage->id,
                'name' => $stage->name,
                'description' => $stage->description,
                'image' => $stage->image,
                'link' => $stage->link,
            ],
        ]);
    }
}
