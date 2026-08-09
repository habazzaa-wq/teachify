<?php

namespace App\Http\Controllers\Api\v1\Seo;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\EducationalStage;
use App\Models\SeoContent;
use App\Services\Seo\SeoCanonicalGuard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Tenant-scoped search used by the content editor to build internal links.
 * Only ever returns content belonging to the current tenant.
 */
class SeoLinkSearchController extends Controller
{
    public function __construct(private readonly SeoCanonicalGuard $canonicalGuard)
    {
    }

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('seo.view');

        $search = trim((string) $request->string('search'));
        $limit = min($request->integer('limit', 20), 50);
        $tenantId = currentTenant()->id;

        $results = [];

        if ($search === '') {
            $contents = SeoContent::query()
                ->where('tenant_id', $tenantId)
                ->published()
                ->select('id', 'title', 'slug', 'content_type', 'seo_title', 'seo_description', 'status')
                ->limit($limit)
                ->get();

            $results = $contents->map(fn (SeoContent $c) => [
                'type' => 'seo_content',
                'contentType' => $c->content_type,
                'id' => (string) $c->id,
                'title' => $c->displayTitle(),
                'url' => $c->publicPath(),
                'seoTitle' => $c->seo_title,
                'description' => $c->seo_description,
            ])->all();
        } else {
            $needle = strtolower($search);
            $like = "%{$search}%";

            $contents = SeoContent::query()
                ->where('tenant_id', $tenantId)
                ->published()
                ->where(function ($q) use ($like, $search) {
                    $q->where('title', 'like', $like)
                        ->orWhere('seo_title', 'like', $like)
                        ->orWhere('focus_keyword', 'like', $like)
                        ->orWhere('slug', 'like', $like);
                })
                ->select('id', 'title', 'slug', 'content_type', 'seo_title', 'seo_description', 'status')
                ->limit($limit)
                ->get();

            foreach ($contents as $c) {
                $results[] = [
                    'type' => 'seo_content',
                    'contentType' => $c->content_type,
                    'id' => (string) $c->id,
                    'title' => $c->displayTitle(),
                    'url' => $c->publicPath(),
                    'seoTitle' => $c->seo_title,
                    'description' => $c->seo_description,
                    'score' => $this->matchScore($needle, [$c->title, $c->seo_title, $c->slug]),
                ];
            }

            $index = count($results);

            // Only entities with a real public route can be internal-link targets.
            // Courses use their slug; stages have no slug column and are routed by id.
            // Subjects have no public page and are therefore not linkable targets.
            foreach (['course' => Course::class, 'stage' => EducationalStage::class] as $key => $model) {
                $titleColumn = $key === 'course' ? 'title' : 'name';
                $pathColumn = $key === 'course' ? 'slug' : 'id';

                $entityResults = $model::query()
                    ->where('tenant_id', $tenantId)
                    ->where($titleColumn, 'like', $like)
                    ->select('id', $titleColumn, $pathColumn)
                    ->limit($limit)
                    ->get();

                foreach ($entityResults as $entity) {
                    $title = (string) $entity->{$titleColumn};
                    $pathKey = (string) $entity->{$pathColumn};
                    $results[] = [
                        'type' => $key,
                        'id' => (string) $entity->id,
                        'title' => $title,
                        'url' => $this->entityPublicPath($key, $pathKey),
                        'score' => $this->matchScore($needle, [$title, $pathKey]),
                        'matchedOn' => 'entity',
                    ];
                    if (++$index >= $limit) {
                        break 2;
                    }
                }
            }
        }

        // Every returned URL must be tenant-safe; skip anything that is not.
        $results = array_values(array_filter($results, fn (array $r) => $this->isTenantSafe($r['url'] ?? null)));

        return response()->json([
            'data' => array_slice($results, 0, $limit),
        ]);
    }

    private function entityPublicPath(string $type, string $pathKey): string
    {
        return match ($type) {
            'course' => "/courses/{$pathKey}",
            'stage' => "/stages/{$pathKey}",
            default => "#",
        };
    }

    /**
     * @param list<string> $fields
     */
    private function matchScore(string $needle, array $fields): int
    {
        $best = 0;
        foreach ($fields as $field) {
            $value = mb_strtolower((string) $field);
            if ($value === '') {
                continue;
            }
            if ($value === $needle) {
                return 100;
            }
            if (str_starts_with($value, $needle)) {
                $best = max($best, 90);
            } elseif (str_contains($value, $needle)) {
                $best = max($best, 70);
            }
        }
        return $best;
    }

    private function isTenantSafe(?string $url): bool
    {
        if ($url === null || $url === '#' || $url === '') {
            return false;
        }
        return $this->canonicalGuard->isSafe($url);
    }
}
