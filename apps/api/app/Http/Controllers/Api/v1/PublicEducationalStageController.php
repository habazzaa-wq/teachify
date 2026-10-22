<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\EducationalStage;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

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

    public function stats(): JsonResponse
    {
        $tenantId = currentTenant()->id;

        $stageIds = EducationalStage::query()
            ->where('tenant_id', $tenantId)
            ->active()
            ->orderBy('sort_order')
            ->orderBy('created_at', 'asc')
            ->pluck('id');

        if ($stageIds->isEmpty()) {
            return response()->json(['items' => []]);
        }

        $courses = Course::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'published')
            ->where('visibility', 'public')
            ->whereIn('educational_stage_id', $stageIds);

        $coursesByStage = (clone $courses)
            ->select('educational_stage_id', DB::raw('COUNT(*) as aggregate'))
            ->groupBy('educational_stage_id')
            ->pluck('aggregate', 'educational_stage_id');

        $teachersByStage = (clone $courses)
            ->whereNotNull('primary_instructor_tenant_user_id')
            ->select(
                'educational_stage_id',
                DB::raw('COUNT(DISTINCT primary_instructor_tenant_user_id) as aggregate'),
            )
            ->groupBy('educational_stage_id')
            ->pluck('aggregate', 'educational_stage_id');

        $items = $stageIds->map(fn ($id) => [
            'id' => (int) $id,
            'coursesCount' => (int) ($coursesByStage[$id] ?? 0),
            'teachersCount' => (int) ($teachersByStage[$id] ?? 0),
        ])->values();

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
