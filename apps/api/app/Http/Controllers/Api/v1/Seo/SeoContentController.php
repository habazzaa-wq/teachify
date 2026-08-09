<?php

namespace App\Http\Controllers\Api\v1\Seo;

use App\Http\Controllers\Controller;
use App\Http\Resources\SeoContentResource;
use App\Models\Category;
use App\Models\Course;
use App\Models\EducationalStage;
use App\Models\MediaAsset;
use App\Models\SeoContent;
use App\Models\SeoFaq;
use App\Models\SeoKeyword;
use App\Models\SeoContentLink;
use App\Models\SeoRevision;
use App\Models\Subject;
use App\Services\Audit\AuditLogService;
use App\Services\Seo\SeoCanonicalGuard;
use App\Services\Seo\SeoHtmlSanitizer;
use App\Services\Seo\SeoScoreService;
use App\Services\Seo\SeoSlugService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class SeoContentController extends Controller
{
    /** @var array<class-string, list<string>> */
    private const SEoABLE_TYPES = [
        Course::class => ['course'],
        EducationalStage::class => ['stage'],
        Subject::class => ['subject'],
        Category::class => ['category'],
    ];

    public function __construct(
        private readonly SeoSlugService $slugService,
        private readonly SeoHtmlSanitizer $sanitizer,
        private readonly SeoCanonicalGuard $canonicalGuard,
        private readonly SeoScoreService $scoreService,
        private readonly AuditLogService $audit,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('seo.view');

        $query = SeoContent::query()
            ->with(['author:id,user_id', 'featuredImage:id,cdn_url,thumbnail_url,width,height,mime_type,size,size_bytes,title,original_name'])
            ->withCount('revisions')
            ->where('tenant_id', currentTenant()->id);

        if ($search = trim((string) $request->string('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('seo_description', 'like', "%{$search}%")
                    ->orWhere('focus_keyword', 'like', "%{$search}%");
            });
        }

        if ($type = trim($request->string('content_type')->toString())) {
            $query->where('content_type', $type);
        }

        if ($status = trim($request->string('status')->toString())) {
            $query->where('status', $status);
        }

        $sort = $request->string('sort', 'updated_at')->toString();
        $sortDir = $request->string('sort_dir', 'desc')->toString();
        if (in_array($sort, ['title', 'status', 'created_at', 'updated_at', 'published_at'], true)
            && in_array($sortDir, ['asc', 'desc'], true)) {
            $query->orderBy($sort, $sortDir);
        } else {
            $query->orderBy('updated_at', 'desc');
        }

        $items = $query->paginate($request->integer('per_page', 25));

        return response()->json([
            'data' => SeoContentResource::collection($items),
            'total' => $items->total(),
            'per_page' => $items->perPage(),
            'current_page' => $items->currentPage(),
            'last_page' => $items->lastPage(),
        ]);
    }

    public function show(SeoContent $seoContent): JsonResponse
    {
        Gate::authorize('seo.view');
        $this->ensureTenant($seoContent);

        $seoContent->load([
            'author:id,user_id',
            'faqs',
            'keywords',
            'links',
            'featuredImage',
            'ogImage',
            'twitterImage',
            'seoable',
        ]);

        $seoContent->seoScore = $this->buildScore($seoContent);

        return response()->json([
            'data' => new SeoContentResource($seoContent),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('seo.create');

        $data = $this->validateData($request, null);
        $tenant = currentTenant();

        $content = new SeoContent();
        $content->tenant_id = $tenant->id;
        $content->fill($data['attributes']);
        $content->content = $this->sanitizeBody($data['attributes']['content'] ?? null);
        $content->author_tenant_user_id = currentTenantUser()?->id;
        $content->slug = $this->slugService->resolveSlug($content->title, $content->slug, null);

        if ($content->status === 'published') {
            $content->published_at = $content->published_at ?? now();
        }

        $content->save();

        $this->syncRelations($content, $data['faqs'] ?? [], $data['keywords'] ?? [], $data['links'] ?? []);
        $this->syncLinkedEntitySeo($content);

        $this->audit->record($tenant, 'seo_content', SeoContent::class, $content->id, 'created',
            currentTenantUser(), null, $this->snapshot($content), null, $request);

        return response()->json([
            'message' => 'تم إنشاء المحتوى بنجاح.',
            'data' => new SeoContentResource($content->load($this->detailRelations())),
        ], 201);
    }

    public function update(Request $request, SeoContent $seoContent): JsonResponse
    {
        Gate::authorize('seo.update');
        $this->ensureTenant($seoContent);

        $before = $this->snapshot($seoContent);
        $data = $this->validateData($request, $seoContent->id);
        $tenant = currentTenant();

        $seoContent->fill($data['attributes']);

        if ($request->filled('slug') && trim((string) $request->string('slug')) !== '') {
            $seoContent->slug = $this->slugService->resolveSlug(
                $seoContent->title,
                $request->string('slug')->toString(),
                $seoContent->id,
            );
        }

        if (array_key_exists('content', $data['attributes'])) {
            $seoContent->content = $this->sanitizeBody($data['attributes']['content']);
        }

        if ($seoContent->status === 'published' && $seoContent->published_at === null) {
            $seoContent->published_at = now();
        }

        $dirty = $seoContent->getDirty();
        $seoContent->save();

        $this->syncRelations($seoContent, $data['faqs'] ?? null, $data['keywords'] ?? null, $data['links'] ?? null);
        $this->syncLinkedEntitySeo($seoContent);

        if ($dirty !== []) {
            $action = isset($dirty['slug']) ? 'slug_changed' : 'updated';
            $this->audit->record($tenant, 'seo_content', SeoContent::class, $seoContent->id, $action,
                currentTenantUser(), $before, $this->snapshot($seoContent), null, $request);

            if ($this->isSeoRelevantChange($dirty)) {
                SeoRevision::create([
                    'tenant_id' => $tenant->id,
                    'seo_content_id' => $seoContent->id,
                    'editor_tenant_user_id' => currentTenantUser()?->id,
                    'action' => $action,
                    'snapshot' => $before,
                ]);
            }
        }

        return response()->json([
            'message' => 'تم حفظ التغييرات بنجاح.',
            'data' => new SeoContentResource($seoContent->load($this->detailRelations())),
        ]);
    }

    public function destroy(SeoContent $seoContent): JsonResponse
    {
        Gate::authorize('seo.delete');
        $this->ensureTenant($seoContent);

        $seoContent->delete();

        $this->audit->record(currentTenant(), 'seo_content', SeoContent::class, $seoContent->id, 'deleted',
            currentTenantUser(), $this->snapshot($seoContent), null, null, request());

        return response()->json(['message' => 'تم حذف المحتوى بنجاح.']);
    }

    public function publish(Request $request, SeoContent $seoContent): JsonResponse
    {
        Gate::authorize('seo.publish');
        $this->ensureTenant($seoContent);

        $seoContent->status = 'published';
        $seoContent->published_at = $seoContent->published_at ?? now();
        $seoContent->archived_at = null;
        $seoContent->save();

        $this->syncLinkedEntitySeo($seoContent);

        $this->audit->record(currentTenant(), 'seo_content', SeoContent::class, $seoContent->id, 'published',
            currentTenantUser(), null, $this->snapshot($seoContent), null, $request);

        return response()->json([
            'message' => 'تم نشر المحتوى بنجاح.',
            'data' => new SeoContentResource($seoContent->load($this->detailRelations())),
        ]);
    }

    public function unpublish(Request $request, SeoContent $seoContent): JsonResponse
    {
        Gate::authorize('seo.publish');
        $this->ensureTenant($seoContent);

        $seoContent->status = 'draft';
        $seoContent->published_at = null;
        $seoContent->save();

        $this->audit->record(currentTenant(), 'seo_content', SeoContent::class, $seoContent->id, 'unpublished',
            currentTenantUser(), null, $this->snapshot($seoContent), null, $request);

        return response()->json([
            'message' => 'تم إلغاء نشر المحتوى.',
            'data' => new SeoContentResource($seoContent->load($this->detailRelations())),
        ]);
    }

    public function archive(Request $request, SeoContent $seoContent): JsonResponse
    {
        Gate::authorize('seo.publish');
        $this->ensureTenant($seoContent);

        $seoContent->status = 'archived';
        $seoContent->archived_at = now();
        $seoContent->save();

        $this->audit->record(currentTenant(), 'seo_content', SeoContent::class, $seoContent->id, 'archived',
            currentTenantUser(), null, $this->snapshot($seoContent), null, $request);

        return response()->json([
            'message' => 'تم أرشفة المحتوى.',
            'data' => new SeoContentResource($seoContent->load($this->detailRelations())),
        ]);
    }

    public function restore(Request $request, SeoContent $seoContent): JsonResponse
    {
        Gate::authorize('seo.update');
        $this->ensureTenant($seoContent);

        if ($seoContent->trashed()) {
            $seoContent->restore();
        }

        if ($seoContent->status === 'archived') {
            $seoContent->status = 'draft';
            $seoContent->archived_at = null;
        }
        $seoContent->save();

        $this->audit->record(currentTenant(), 'seo_content', SeoContent::class, $seoContent->id, 'restored',
            currentTenantUser(), null, $this->snapshot($seoContent), null, $request);

        return response()->json([
            'message' => 'تمت استعادة المحتوى.',
            'data' => new SeoContentResource($seoContent->load($this->detailRelations())),
        ]);
    }

    public function revisions(SeoContent $seoContent): JsonResponse
    {
        Gate::authorize('seo.view');
        $this->ensureTenant($seoContent);

        $revisions = $seoContent->revisions()
            ->with('editor:id,user_id')
            ->latest('id')
            ->paginate(request()->integer('per_page', 25));

        return response()->json([
            'data' => collect($revisions->items())->map(fn (SeoRevision $r) => [
                'id' => (string) $r->id,
                'action' => $r->action,
                'editor' => $r->editor?->user?->name ?? 'System',
                'snapshot' => $r->snapshot,
                'createdAt' => $r->created_at?->toISOString(),
            ]),
            'total' => $revisions->total(),
            'per_page' => $revisions->perPage(),
            'current_page' => $revisions->currentPage(),
            'last_page' => $revisions->lastPage(),
        ]);
    }

    // ── Internals ───────────────────────────────────────────────────────────

    /**
     * @return array{attributes: array<string, mixed>, faqs?: ?array, keywords?: ?array, links?: ?array}
     */
    private function validateData(Request $request, ?int $ignoreId): array
    {
        $rules = [
            'content_type' => ['sometimes', 'required', Rule::in(SeoContent::CONTENT_TYPES)],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-zA-Z0-9][a-zA-Z0-9-]*$/'],
            'status' => ['sometimes', 'required', Rule::in(SeoContent::STATUSES)],
            'indexable' => ['sometimes', 'boolean'],
            'in_sitemap' => ['sometimes', 'boolean'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'content' => ['nullable', 'string'],
            'content_format' => ['sometimes', 'required', Rule::in(['markdown', 'html'])],
            'seo_title' => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string', 'max:500'],
            'focus_keyword' => ['nullable', 'string', 'max:255'],
            'secondary_keywords' => ['nullable', 'array', 'max:50'],
            'secondary_keywords.*' => ['string', 'max:255'],
            'canonical_url' => ['nullable', 'string', 'max:2048'],
            'og_title' => ['nullable', 'string', 'max:255'],
            'og_description' => ['nullable', 'string', 'max:500'],
            'twitter_title' => ['nullable', 'string', 'max:255'],
            'twitter_description' => ['nullable', 'string', 'max:500'],
            'structured_data_type' => ['sometimes', 'required', Rule::in(['article', 'news_article', 'faq_page', 'course', 'item_list', 'breadcrumb', 'none'])],
            'featured_image_asset_id' => ['nullable', 'integer'],
            'og_image_asset_id' => ['nullable', 'integer'],
            'twitter_image_asset_id' => ['nullable', 'integer'],
            'published_at' => ['nullable', 'date'],
            'seoable_type' => ['nullable', 'string'],
            'seoable_id' => ['nullable', 'integer'],
            'faqs' => ['nullable', 'array', 'max:50'],
            'faqs.*.id' => ['nullable', 'integer'],
            'faqs.*.question' => ['required_with:faqs', 'string', 'max:500'],
            'faqs.*.answer' => ['required_with:faqs', 'string'],
            'faqs.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'faqs.*.is_published' => ['sometimes', 'boolean'],
            'keywords' => ['nullable', 'array', 'max:100'],
            'keywords.*.keyword' => ['required_with:keywords', 'string', 'max:255'],
            'keywords.*.keyword_type' => ['sometimes', 'required', Rule::in(SeoKeyword::TYPES)],
            'keywords.*.search_intent' => ['nullable', Rule::in(SeoKeyword::INTENTS)],
            'keywords.*.notes' => ['nullable', 'string', 'max:2000'],
            'keywords.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'links' => ['nullable', 'array', 'max:50'],
            'links.*.target_seo_content_id' => ['nullable', 'integer'],
            'links.*.target_url' => ['nullable', 'string', 'max:2048'],
            'links.*.anchor_text' => ['nullable', 'string', 'max:255'],
            'links.*.sort_order' => ['nullable', 'integer', 'min:0'],
        ];

        $validated = $request->validate($rules);

        $attributes = $request->only([
            'content_type', 'title', 'slug', 'status', 'indexable', 'in_sitemap',
            'excerpt', 'content', 'content_format', 'seo_title', 'seo_description', 'focus_keyword',
            'secondary_keywords', 'canonical_url', 'og_title', 'og_description',
            'twitter_title', 'twitter_description', 'structured_data_type', 'published_at',
        ]);

        // Nullable media assets must belong to the current tenant.
        $this->assertMediaAsset($request->input('featured_image_asset_id'));
        $this->assertMediaAsset($request->input('og_image_asset_id'));
        $this->assertMediaAsset($request->input('twitter_image_asset_id'));
        $attributes['featured_image_asset_id'] = $request->input('featured_image_asset_id');
        $attributes['og_image_asset_id'] = $request->input('og_image_asset_id');
        $attributes['twitter_image_asset_id'] = $request->input('twitter_image_asset_id');

        // The model has no accessors for column defaults, so apply the
        // schema defaults here before the record is created.
        $attributes['content_format'] ??= 'markdown';
        $attributes['indexable'] ??= true;
        $attributes['in_sitemap'] ??= true;

        // Canonical safety (server-side, never trusted from the client).
        $canonical = $request->input('canonical_url');
        if ($canonical !== null && trim((string) $canonical) !== '' && ! $this->canonicalGuard->isSafe($canonical)) {
            abort(422, 'رابط Canonical غير آمن: يجب أن يشير إلى نطاق نفس المؤسسة.');
        }
        $attributes['canonical_url'] = $canonical;

        // Polymorphic seoable link must point to an entity of the current tenant.
        $seoable = $this->resolveSeoable($request->input('seoable_type'), $request->input('seoable_id'));
        $attributes['seoable_type'] = $seoable ? $seoable['type'] : null;
        $attributes['seoable_id'] = $seoable ? $seoable['id'] : null;

        return [
            'attributes' => $attributes,
            'faqs' => $request->input('faqs'),
            'keywords' => $request->input('keywords'),
            'links' => $request->input('links'),
        ];
    }

    /**
     * @return array{type: class-string, id: int}|null
     */
    private function resolveSeoable(?string $type, ?int $id): ?array
    {
        if ($type === null || $id === null) {
            return null;
        }

        if (! array_key_exists($type, self::SEoABLE_TYPES)) {
            abort(422, 'نوع الكيان المرتبط غير مدعوم.');
        }

        $entity = $type::query()->withoutGlobalScopes()
            ->where('tenant_id', currentTenant()->id)
            ->find($id);

        if (! $entity) {
            abort(422, 'الكيان المرتبط غير موجود في هذه المؤسسة.');
        }

        return ['type' => $type, 'id' => (int) $entity->id];
    }

    private function assertMediaAsset(mixed $assetId): void
    {
        if ($assetId === null || $assetId === '') {
            return;
        }

        $exists = MediaAsset::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('id', (int) $assetId)
            ->exists();

        if (! $exists) {
            abort(422, 'الوسائط المحددة غير موجودة في هذه المؤسسة.');
        }
    }

    private function sanitizeBody(?string $content): ?string
    {
        if ($content === null) {
            return null;
        }

        // Whitelist-based sanitization of untrusted teacher-authored HTML.
        // Markdown is run through the same sanitizer so any pasted raw HTML
        // is neutralized too.
        return $this->sanitizer->sanitize($content);
    }

    /**
     * @param array<int, array<string, mixed>>|null $faqs
     * @param array<int, array<string, mixed>>|null $keywords
     * @param array<int, array<string, mixed>>|null $links
     */
    private function syncRelations(SeoContent $content, ?array $faqs, ?array $keywords, ?array $links): void
    {
        $tenant = currentTenant();

        if ($faqs !== null) {
            $ids = [];
            foreach ($faqs as $i => $item) {
                if (isset($item['id'])) {
                    $ids[] = (int) $item['id'];
                }
            }
            SeoFaq::query()->where('seo_content_id', $content->id)
                ->whereNotIn('id', $ids)->delete();

            foreach ($faqs as $i => $item) {
                $data = [
                    'tenant_id' => $tenant->id,
                    'question' => $item['question'],
                    'answer' => $this->sanitizeBody($item['answer']),
                    'sort_order' => $item['sort_order'] ?? $i,
                    'is_published' => $item['is_published'] ?? true,
                ];
                if (isset($item['id'])) {
                    SeoFaq::query()->where('tenant_id', $tenant->id)
                        ->where('id', (int) $item['id'])
                        ->update($data);
                } else {
                    SeoFaq::create($data + ['seo_content_id' => $content->id]);
                }
            }
        }

        if ($keywords !== null) {
            $ids = [];
            foreach ($keywords as $item) {
                if (isset($item['id'])) {
                    $ids[] = (int) $item['id'];
                }
            }
            SeoKeyword::query()->where('seo_content_id', $content->id)
                ->whereNotIn('id', $ids)->delete();

            foreach ($keywords as $i => $item) {
                $data = [
                    'tenant_id' => $tenant->id,
                    'keyword' => $item['keyword'],
                    'keyword_type' => $item['keyword_type'] ?? 'related',
                    'search_intent' => $item['search_intent'] ?? null,
                    'notes' => $item['notes'] ?? null,
                    'sort_order' => $item['sort_order'] ?? $i,
                ];
                if (isset($item['id'])) {
                    SeoKeyword::query()->where('tenant_id', $tenant->id)
                        ->where('id', (int) $item['id'])
                        ->update($data);
                } else {
                    SeoKeyword::create($data + ['seo_content_id' => $content->id]);
                }
            }
        }

        if ($links !== null) {
            $ids = [];
            foreach ($links as $item) {
                if (isset($item['id'])) {
                    $ids[] = (int) $item['id'];
                }
            }
            SeoContentLink::query()->where('seo_content_id', $content->id)
                ->whereNotIn('id', $ids)->delete();

            foreach ($links as $i => $item) {
                $data = [
                    'tenant_id' => $tenant->id,
                    'target_seo_content_id' => $item['target_seo_content_id'] ?? null,
                    'target_type' => $item['target_type'] ?? null,
                    'target_id' => $item['target_id'] ?? null,
                    'target_url' => $item['target_url'] ?? null,
                    'anchor_text' => $item['anchor_text'] ?? null,
                    'sort_order' => $item['sort_order'] ?? $i,
                ];
                if (isset($item['id'])) {
                    SeoContentLink::query()->where('tenant_id', $tenant->id)
                        ->where('id', (int) $item['id'])
                        ->update($data);
                } else {
                    SeoContentLink::create($data + ['seo_content_id' => $content->id]);
                }
            }
        }
    }

    /**
     * Keep the linked Course/Category SEO columns in sync so the existing
     * public pages continue to render the studio-managed metadata.
     */
    private function syncLinkedEntitySeo(SeoContent $content): void
    {
        if (! $content->seoable_type || ! $content->seoable_id) {
            return;
        }

        if ($content->seoable_type !== Course::class && $content->seoable_type !== Category::class) {
            return;
        }

        $entity = $content->seoable_type::query()->withoutGlobalScopes()
            ->where('tenant_id', currentTenant()->id)
            ->find($content->seoable_id);

        if (! $entity) {
            return;
        }

        $update = [];
        if ($content->seo_title !== null) {
            $update['seo_title'] = $content->seo_title;
        }
        if ($content->seo_description !== null) {
            $update['seo_description'] = $content->seo_description;
        }
        $keywords = array_merge(
            $content->focus_keyword ? [$content->focus_keyword] : [],
            $content->secondary_keywords ?? [],
        );
        if ($keywords !== []) {
            $update['seo_keywords'] = implode(', ', $keywords);
        }

        if ($update !== []) {
            $entity->update($update);
        }
    }

    private function buildScore(SeoContent $content): array
    {
        $other = SeoContent::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('id', '!=', $content->id)
            ->whereNotNull('seo_description')
            ->where('seo_description', '!=', '')
            ->pluck('seo_description')
            ->map(fn ($d) => (string) $d)
            ->all();

        return $this->scoreService->score(
            $content,
            $other,
            $content->faqs()->count(),
            $content->links()->count(),
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function snapshot(SeoContent $content): array
    {
        return [
            'title' => $content->title,
            'slug' => $content->slug,
            'status' => $content->status,
            'seo_title' => $content->seo_title,
            'seo_description' => $content->seo_description,
            'focus_keyword' => $content->focus_keyword,
            'canonical_url' => $content->canonical_url,
            'indexable' => $content->indexable,
            'in_sitemap' => $content->in_sitemap,
            'excerpt' => $content->excerpt,
            'content' => $content->content,
            'published_at' => $content->published_at?->toISOString(),
        ];
    }

    /**
     * @param array<string, mixed> $dirty
     */
    private function isSeoRelevantChange(array $dirty): bool
    {
        $relevant = [
            'title', 'slug', 'seo_title', 'seo_description', 'focus_keyword',
            'canonical_url', 'og_title', 'og_description', 'twitter_title',
            'twitter_description', 'excerpt', 'content', 'status',
        ];

        foreach ($relevant as $field) {
            if (array_key_exists($field, $dirty)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return list<string>
     */
    private function detailRelations(): array
    {
        return ['author:id,user_id', 'faqs', 'keywords', 'links', 'featuredImage', 'ogImage', 'twitterImage', 'seoable'];
    }

    private function ensureTenant(SeoContent $seoContent): void
    {
        abort_if($seoContent->tenant_id !== currentTenant()->id, 404);
    }
}
