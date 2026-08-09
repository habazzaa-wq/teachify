<?php

namespace App\Http\Controllers\Api\v1\Seo;

use App\Http\Controllers\Controller;
use App\Http\Resources\SeoKeywordResource;
use App\Models\SeoKeyword;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class SeoKeywordController extends Controller
{
    public function __construct(private readonly AuditLogService $audit)
    {
    }

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('seo.view');

        $query = SeoKeyword::query()
            ->where('tenant_id', currentTenant()->id)
            ->with('seoContent:id,title,slug,status');

        if ($search = trim((string) $request->string('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('keyword', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        if ($type = trim($request->string('keyword_type')->toString())) {
            $query->where('keyword_type', $type);
        }

        if ($intent = trim($request->string('search_intent')->toString())) {
            $query->where('search_intent', $intent);
        }

        $sort = $request->string('sort', 'created_at')->toString();
        $sortDir = $request->string('sort_dir', 'desc')->toString();
        if (in_array($sort, ['keyword', 'keyword_type', 'created_at'], true)
            && in_array($sortDir, ['asc', 'desc'], true)) {
            $query->orderBy($sort, $sortDir);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $items = $query->paginate($request->integer('per_page', 25));

        return response()->json([
            'data' => SeoKeywordResource::collection($items),
            'total' => $items->total(),
            'per_page' => $items->perPage(),
            'current_page' => $items->currentPage(),
            'last_page' => $items->lastPage(),
        ]);
    }

    public function show(SeoKeyword $seoKeyword): JsonResponse
    {
        Gate::authorize('seo.view');
        $this->ensureTenant($seoKeyword);

        return response()->json([
            'data' => new SeoKeywordResource($seoKeyword->load('seoContent:id,title,slug,status')),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('seo.create');

        $validated = $request->validate([
            'seo_content_id' => ['nullable', 'integer', 'exists:seo_contents,id'],
            'keyword' => ['required', 'string', 'max:255'],
            'keyword_type' => ['sometimes', 'required', Rule::in(SeoKeyword::TYPES)],
            'search_intent' => ['nullable', Rule::in(SeoKeyword::INTENTS)],
            'notes' => ['nullable', 'string', 'max:2000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        if (isset($validated['seo_content_id'])) {
            $ownsContent = \App\Models\SeoContent::query()
                ->where('tenant_id', currentTenant()->id)
                ->where('id', (int) $validated['seo_content_id'])
                ->exists();
            if (! $ownsContent) {
                abort(422, 'المحتوى المرتبط غير موجود في هذه المؤسسة.');
            }
        }

        $keyword = SeoKeyword::create([
            'tenant_id' => currentTenant()->id,
            'seo_content_id' => $validated['seo_content_id'] ?? null,
            'keyword' => $validated['keyword'],
            'keyword_type' => $validated['keyword_type'] ?? 'related',
            'search_intent' => $validated['search_intent'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        $this->audit->record(currentTenant(), 'seo_keyword', SeoKeyword::class, $keyword->id,
            'created', currentTenantUser(), null, $keyword->toArray(), null, $request);

        return response()->json([
            'message' => 'تمت إضافة الكلمة المفتاحية بنجاح.',
            'data' => new SeoKeywordResource($keyword->load('seoContent:id,title,slug,status')),
        ], 201);
    }

    public function update(Request $request, SeoKeyword $seoKeyword): JsonResponse
    {
        Gate::authorize('seo.update');
        $this->ensureTenant($seoKeyword);

        $validated = $request->validate([
            'keyword' => ['sometimes', 'required', 'string', 'max:255'],
            'keyword_type' => ['sometimes', 'required', Rule::in(SeoKeyword::TYPES)],
            'search_intent' => ['nullable', Rule::in(SeoKeyword::INTENTS)],
            'notes' => ['nullable', 'string', 'max:2000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $seoKeyword->update($validated);

        $this->audit->record(currentTenant(), 'seo_keyword', SeoKeyword::class, $seoKeyword->id,
            'updated', currentTenantUser(), null, $seoKeyword->toArray(), null, $request);

        return response()->json([
            'message' => 'تم حفظ الكلمة المفتاحية بنجاح.',
            'data' => new SeoKeywordResource($seoKeyword->load('seoContent:id,title,slug,status')),
        ]);
    }

    public function destroy(SeoKeyword $seoKeyword): JsonResponse
    {
        Gate::authorize('seo.delete');
        $this->ensureTenant($seoKeyword);

        $seoKeyword->delete();

        $this->audit->record(currentTenant(), 'seo_keyword', SeoKeyword::class, $seoKeyword->id,
            'deleted', currentTenantUser(), null, null, null, request());

        return response()->json(['message' => 'تم حذف الكلمة المفتاحية بنجاح.']);
    }

    private function ensureTenant(SeoKeyword $seoKeyword): void
    {
        abort_if($seoKeyword->tenant_id !== currentTenant()->id, 404);
    }
}
