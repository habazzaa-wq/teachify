<?php

namespace App\Http\Controllers\Api\v1\Courses;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Repositories\CategoryRepository;
use App\Services\Courses\CategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CategoryController extends Controller
{
    public function __construct(
        private readonly CategoryRepository $repository,
        private readonly CategoryService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Category::class);

        $categories = $this->repository->list($request->all());

        return response()->json([
            'data' => CategoryResource::collection($categories),
            'total' => $categories->total(),
            'per_page' => $categories->perPage(),
            'current_page' => $categories->currentPage(),
            'last_page' => $categories->lastPage(),
        ]);
    }

    public function tree(): JsonResponse
    {
        Gate::authorize('viewAny', Category::class);

        $categories = $this->repository->listTree();

        return response()->json([
            'data' => CategoryResource::collection($categories),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Category::class);

        $validated = $this->validateCategory($request);
        $category = $this->service->create(currentTenant(), currentTenantUser(), $validated);

        return response()->json([
            'message' => 'Category created successfully.',
            'data' => new CategoryResource($category),
        ], 201);
    }

    public function show(Category $category): JsonResponse
    {
        abort_if($category->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('view', $category);

        return response()->json([
            'data' => new CategoryResource(
                $category->loadMissing(['parent', 'children'])->loadCount('courses')
            ),
        ]);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        abort_if($category->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $category);

        $validated = $this->validateCategory($request, true);
        $category = $this->service->update(currentTenant(), $category, $validated);

        return response()->json([
            'message' => 'Category updated successfully.',
            'data' => new CategoryResource($category),
        ]);
    }

    public function destroy(Category $category): JsonResponse
    {
        abort_if($category->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('delete', $category);

        $this->repository->delete($category);

        return response()->json(['message' => 'Category deleted successfully.']);
    }

    public function restore(Category $category): JsonResponse
    {
        abort_if($category->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('restore', $category);

        $category = $this->repository->restore($category->id);

        return response()->json([
            'message' => 'Category restored successfully.',
            'data' => $category ? new CategoryResource($category) : null,
        ]);
    }

    public function forceDelete(Category $category): JsonResponse
    {
        abort_if($category->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('delete', $category);

        $this->repository->forceDelete($category->id);

        return response()->json(['message' => 'Category permanently deleted.']);
    }

    public function duplicate(Category $category): JsonResponse
    {
        abort_if($category->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('create', Category::class);

        $newCategory = $this->service->duplicate($category, currentTenantUser());

        return response()->json([
            'message' => 'Category duplicated successfully.',
            'data' => new CategoryResource($newCategory),
        ], 201);
    }

    public function feature(Category $category): JsonResponse
    {
        abort_if($category->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('feature', $category);

        $category = $this->service->toggleFeatured($category);

        return response()->json([
            'message' => $category->featured ? 'Category featured.' : 'Category unfeatured.',
            'data' => new CategoryResource($category),
        ]);
    }

    public function activate(Category $category): JsonResponse
    {
        abort_if($category->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('activate', $category);

        $category = $this->service->toggleActive($category);

        return response()->json([
            'message' => $category->active ? 'Category activated.' : 'Category deactivated.',
            'data' => new CategoryResource($category),
        ]);
    }

    public function metrics(): JsonResponse
    {
        Gate::authorize('viewAny', Category::class);

        return response()->json([
            'data' => [
                'totalCategories' => $this->repository->countTotal(),
                'active' => $this->repository->countActive(),
                'inactive' => $this->repository->countInactive(),
                'featured' => $this->repository->countFeatured(),
                'parentCategories' => $this->repository->countParents(),
                'childCategories' => $this->repository->countChildren(),
                'coursesCount' => $this->repository->sumCoursesCount(),
                'emptyCategories' => $this->repository->countEmpty(),
            ],
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        Gate::authorize('viewAny', Category::class);

        $categories = $this->repository->listAll($request->all());

        $headers = [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="categories_' . now()->format('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($categories): void {
            $handle = fopen('php://output', 'wb');
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'Name', 'Slug', 'Description', 'Parent', 'Icon', 'Color',
                'Sort Order', 'Featured', 'Active',
                'Courses Count', 'Created At',
            ]);

            foreach ($categories as $category) {
                fputcsv($handle, [
                    $category->name,
                    $category->slug,
                    $category->description,
                    $category->parent?->name,
                    $category->icon,
                    $category->color,
                    $category->sort_order,
                    $category->featured ? 'Yes' : 'No',
                    $category->active ? 'Yes' : 'No',
                    $category->courses_count,
                    $category->created_at->toIso8601String(),
                ]);
            }

            fclose($handle);
        };

        return new StreamedResponse($callback, 200, $headers);
    }

    private function validateCategory(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$required, 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', 'alpha_dash:ascii'],
            'parent_id' => ['nullable', 'integer'],
            'description' => ['nullable', 'string'],
            'thumbnail_path' => ['nullable', 'string', 'max:2048'],
            'icon' => ['nullable', 'string', 'max:100'],
            'color' => ['nullable', 'string', 'max:20'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'featured' => ['sometimes', 'boolean'],
            'active' => ['sometimes', 'boolean'],
            'seo_title' => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string', 'max:500'],
            'seo_keywords' => ['nullable', 'string', 'max:500'],
        ]);
    }
}
