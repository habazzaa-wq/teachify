<?php

namespace App\Http\Controllers\Api\v1\Blog;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use App\Models\TenantUser;
use App\Services\Authorization\TenantAuthorizationService;
use App\Services\Blog\BlogFeature;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class BlogController extends Controller
{
    public function __construct(
        private readonly BlogFeature $feature,
        private readonly TenantAuthorizationService $authorization,
    ) {}

    public function publicIndex(Request $request): JsonResponse
    {
        $this->feature->ensureEnabled(currentTenant());

        $query = BlogPost::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->with('author.user');

        if ($request->filled('search')) {
            $search = mb_substr(trim((string) $request->query('search')), 0, 100);
            $query->where(fn (Builder $builder) => $builder
                ->where('title', 'like', '%'.$search.'%')
                ->orWhere('excerpt', 'like', '%'.$search.'%'));
        }

        if ($request->filled('category')) {
            $query->where('category', trim((string) $request->query('category')));
        }

        $categories = BlogPost::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->whereNotNull('category')
            ->where('category', '<>', '')
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->values();

        $posts = $query
            ->latest('published_at')
            ->paginate(min(max($request->integer('per_page', 12), 1), 48));

        return response()->json([
            'data' => $posts->getCollection()->map(fn (BlogPost $post) => $this->postData($post, false)),
            'categories' => $categories,
            'meta' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
            ],
        ]);
    }

    public function publicShow(string $slug): JsonResponse
    {
        $this->feature->ensureEnabled(currentTenant());
        $post = BlogPost::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('slug', $slug)
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->with('author.user')
            ->firstOrFail();

        $post->increment('views');

        return response()->json(['data' => $this->postData($post, true)]);
    }

    public function manageIndex(Request $request): JsonResponse
    {
        $writer = $this->writer($request);
        $query = $this->postsForWriter($writer)
            ->with('author.user')
            ->latest('updated_at');

        if ($request->filled('status') && in_array($request->query('status'), ['draft', 'published', 'scheduled'], true)) {
            $status = $request->query('status');
            if ($status === 'scheduled') {
                $query->where('status', 'published')->where('published_at', '>', now());
            } else {
                $query->where('status', $status);
            }
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            $query->where(fn (Builder $builder) => $builder
                ->where('title', 'like', '%'.$search.'%')
                ->orWhere('excerpt', 'like', '%'.$search.'%'));
        }

        $posts = $query->paginate(min(max($request->integer('per_page', 20), 1), 100));

        return response()->json([
            'data' => $posts->getCollection()->map(fn (BlogPost $post) => $this->postData($post, false)),
            'meta' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
            ],
        ]);
    }

    public function manageShow(Request $request, BlogPost $post): JsonResponse
    {
        $writer = $this->writer($request);
        $this->assertPostAccessible($post, $writer);
        $post->load('author.user');

        return response()->json(['data' => $this->postData($post, true)]);
    }

    public function uploadImage(Request $request): JsonResponse
    {
        $this->writer($request);

        $validated = $request->validate([
            'file' => ['required', 'file', 'mimetypes:image/jpeg,image/png,image/webp,image/gif,image/avif', 'max:10240'],
        ]);

        $file = $validated['file'];
        $extension = match ($file->getMimeType()) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            'image/avif' => 'avif',
            default => throw new \RuntimeException('Unsupported blog image type.'),
        };
        $directory = 'blog/'.currentTenant()->id;
        $filename = Str::ulid().'.'.$extension;
        $path = Storage::disk('public')->putFileAs($directory, $file, $filename, ['visibility' => 'public']);

        if (! $path) {
            throw new \RuntimeException('Failed to store blog image on the server.');
        }

        return response()->json([
            'data' => [
                'url' => '/storage/'.$path,
                'filename' => $file->getClientOriginalName(),
            ],
        ], 201);
    }

    public function store(Request $request): JsonResponse
    {
        $writer = $this->writer($request);
        $validated = $this->validatePost($request);
        $validated['slug'] = $this->uniqueSlug(($validated['slug'] ?? null) ?: $validated['title']);
        if ($validated['status'] === 'published' && empty($validated['published_at'])) {
            $validated['published_at'] = now();
        }
        $validated['author_tenant_user_id'] = $writer['membership']->id;
        $validated['tenant_id'] = currentTenant()->id;

        $post = BlogPost::query()->create($validated)->load('author.user');

        return response()->json(['data' => $this->postData($post, true)], 201);
    }

    public function update(Request $request, BlogPost $post): JsonResponse
    {
        $writer = $this->writer($request);
        $this->assertPostAccessible($post, $writer);
        $validated = $this->validatePost($request, $post);
        $validated['slug'] = $this->uniqueSlug(($validated['slug'] ?? null) ?: $validated['title'], $post);
        if ($validated['status'] === 'published' && empty($validated['published_at']) && ! $post->published_at) {
            $validated['published_at'] = now();
        }
        $post->update($validated);

        return response()->json(['data' => $this->postData($post->fresh()->load('author.user'), true)]);
    }

    public function destroy(Request $request, BlogPost $post): JsonResponse
    {
        $writer = $this->writer($request);
        $this->assertPostAccessible($post, $writer);
        $post->delete();

        return response()->json(['message' => 'Article deleted.']);
    }

    /** @return array{membership: TenantUser, isAdmin: bool} */
    private function writer(Request $request): array
    {
        $tenant = currentTenant();
        $this->feature->ensureEnabled($tenant);
        $membership = $this->authorization->membershipFor($request->user(), $tenant);
        abort_unless($membership && $membership->status === 'active', 403);

        $isAdmin = $this->authorization->hasAnyRole($request->user(), $tenant, ['tenant_owner', 'admin', 'tenant_admin']);
        $isInstructor = $membership->is_instructor
            || $membership->roles()->where('roles.slug', 'instructor')->exists();
        abort_unless($isAdmin || $isInstructor, 403, 'Only tenant administrators and instructors can manage blog posts.');

        return ['membership' => $membership, 'isAdmin' => $isAdmin];
    }

    /** @param array{membership: TenantUser, isAdmin: bool} $writer */
    private function postsForWriter(array $writer): Builder
    {
        $query = BlogPost::query()->where('tenant_id', currentTenant()->id);
        if (! $writer['isAdmin']) {
            $query->where('author_tenant_user_id', $writer['membership']->id);
        }

        return $query;
    }

    /** @param array{membership: TenantUser, isAdmin: bool} $writer */
    private function assertPostAccessible(BlogPost $post, array $writer): void
    {
        abort_unless((int) $post->tenant_id === (int) currentTenant()->id, 404);
        if (! $writer['isAdmin']) {
            abort_unless((int) $post->author_tenant_user_id === (int) $writer['membership']->id, 403);
        }
    }

    private function validatePost(Request $request, ?BlogPost $post = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'alpha_dash:ascii', Rule::unique('blog_posts', 'slug')
                ->where('tenant_id', currentTenant()->id)->ignore($post?->id)],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'content' => ['required', 'string', 'max:2000000'],
            'cover_image_url' => ['nullable', 'url:http,https', 'max:2048'],
            'category' => ['nullable', 'string', 'max:80'],
            'tags' => ['nullable', 'array', 'max:12'],
            'tags.*' => ['string', 'max:40'],
            'status' => ['required', Rule::in(['draft', 'published'])],
            'published_at' => ['nullable', 'date'],
            'seo_title' => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string', 'max:320'],
        ]);
    }

    private function uniqueSlug(string $value, ?BlogPost $post = null): string
    {
        $slug = Str::slug($value);
        if ($slug === '') {
            $slug = 'article-'.Str::lower(Str::random(10));
        }
        $base = $slug;
        $suffix = 2;

        while (BlogPost::query()
            ->where('tenant_id', currentTenant()->id)
            ->where('slug', $slug)
            ->when($post, fn (Builder $query) => $query->whereKeyNot($post->id))
            ->exists()) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }

    private function postData(BlogPost $post, bool $includeContent): array
    {
        $data = [
            'id' => $post->id,
            'title' => $post->title,
            'slug' => $post->slug,
            'excerpt' => $post->excerpt,
            'cover_image_url' => $post->cover_image_url,
            'category' => $post->category,
            'tags' => $post->tags ?? [],
            'status' => $post->status === 'published' && $post->published_at?->isFuture()
                ? 'scheduled'
                : $post->status,
            'published_at' => $post->published_at?->toIso8601String(),
            'seo_title' => $post->seo_title,
            'seo_description' => $post->seo_description,
            'views' => $post->views,
            'reading_minutes' => max(1, (int) ceil(preg_match_all('/[\\p{L}\\p{N}]+/u', $post->content) / 200)),
            'author' => $post->author?->user?->name,
            'created_at' => $post->created_at?->toIso8601String(),
            'updated_at' => $post->updated_at?->toIso8601String(),
        ];

        if ($includeContent) {
            $data['content'] = $post->content;
        }

        return $data;
    }
}
