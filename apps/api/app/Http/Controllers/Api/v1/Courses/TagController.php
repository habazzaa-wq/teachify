<?php

namespace App\Http\Controllers\Api\v1\Courses;

use App\Http\Controllers\Controller;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class TagController extends Controller
{
    public function index(): JsonResponse
    {
        Gate::authorize('viewAny', Tag::class);

        return response()->json(Tag::query()->orderBy('name')->paginate(50));
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Tag::class);

        $tag = Tag::create($this->validated($request));

        return response()->json([
            'message' => 'Tag created.',
            'tag' => $tag,
        ], 201);
    }

    public function show(Tag $tag): JsonResponse
    {
        abort_if($tag->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('view', $tag);

        return response()->json(['tag' => $tag]);
    }

    public function update(Request $request, Tag $tag): JsonResponse
    {
        abort_if($tag->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('update', $tag);

        $tag->fill($this->validated($request, true))->save();

        return response()->json([
            'message' => 'Tag updated.',
            'tag' => $tag->refresh(),
        ]);
    }

    public function destroy(Tag $tag): JsonResponse
    {
        abort_if($tag->tenant_id !== currentTenant()->id, 404);
        Gate::authorize('delete', $tag);

        $tag->delete();

        return response()->json(['message' => 'Tag deleted.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, bool $partial = false): array
    {
        $data = $request->validate([
            'name' => [$partial ? 'sometimes' : 'required', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', 'alpha_dash:ascii'],
        ]);

        if (array_key_exists('name', $data) && ! array_key_exists('slug', $data)) {
            $data['slug'] = Str::slug($data['name']);
        }

        return $data;
    }
}
