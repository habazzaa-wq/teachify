<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PublicSeoContentResource;
use App\Models\SeoContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Public, tenant-scoped read-only endpoints that power the /articles/{slug}
 * and /guides/{slug} pages. Only published, indexable content is ever exposed,
 * and only for the tenant resolved by the IdentifyTenant middleware.
 */
class PublicSeoContentController extends Controller
{
    public function index(Request $request, string $type): JsonResponse
    {
        $allowed = ['article', 'guide', 'faq_collection'];
        abort_unless(in_array($type, $allowed, true), 404);

        $items = SeoContent::query()
            ->published()
            ->indexable()
            ->where('content_type', $type)
            ->select([
                'id', 'title', 'slug', 'excerpt', 'content_type', 'status',
                'featured_image_asset_id', 'published_at', 'updated_at',
            ])
            ->with('featuredImage:id,cdn_url,thumbnail_url,width,height,mime_type,size,size_bytes,title,original_name')
            ->orderByDesc('published_at')
            ->paginate($request->integer('per_page', 20));

        $payload = collect($items->items())->map(fn (SeoContent $c) => [
            'id' => (string) $c->id,
            'title' => $c->title,
            'slug' => $c->slug,
            'excerpt' => $c->excerpt,
            'featuredImage' => $this->imageData($c->featuredImage),
            'publishedAt' => $c->published_at?->toISOString(),
            'updatedAt' => $c->updated_at?->toISOString(),
            'url' => $c->publicPath(),
        ]);

        return response()->json([
            'data' => $payload,
            'total' => $items->total(),
            'per_page' => $items->perPage(),
            'current_page' => $items->currentPage(),
            'last_page' => $items->lastPage(),
        ]);
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        // The type is supplied via route defaults, so read it from the route
        // explicitly rather than relying on positional parameter resolution.
        $type = (string) $request->route('type');

        $allowed = ['article', 'guide', 'faq_collection'];
        abort_unless(in_array($type, $allowed, true), 404);

        $content = SeoContent::query()
            ->where('content_type', $type)
            ->where('slug', $slug)
            ->with([
                'author:id,user_id',
                'faqs',
                'featuredImage:id,cdn_url,thumbnail_url,width,height,mime_type,size,size_bytes,title,original_name',
                'ogImage:id,cdn_url,thumbnail_url,width,height,mime_type,size,size_bytes,title,original_name',
            ])
            ->first();

        abort_if(! $content || ! $content->isPublished() || ! $content->indexable, 404);

        return response()->json([
            'data' => new PublicSeoContentResource($content),
        ]);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function imageData(mixed $image): ?array
    {
        if (! $image) {
            return null;
        }
        return [
            'cdnUrl' => $image->cdn_url,
            'thumbnailUrl' => $image->thumbnail_url,
            'width' => $image->width,
            'height' => $image->height,
            'mimeType' => $image->mime_type,
            'size' => $image->size,
            'title' => $image->title,
            'originalName' => $image->original_name,
        ];
    }
}
