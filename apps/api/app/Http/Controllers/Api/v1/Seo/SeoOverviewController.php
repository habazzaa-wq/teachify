<?php

namespace App\Http\Controllers\Api\v1\Seo;

use App\Http\Controllers\Controller;
use App\Models\SeoContent;
use App\Models\SeoContentLink;
use App\Models\SeoFaq;
use App\Models\SeoKeyword;
use App\Models\SeoRevision;
use App\Services\Seo\SeoScoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class SeoOverviewController extends Controller
{
    public function __construct(private readonly SeoScoreService $scoreService)
    {
    }

    public function index(): JsonResponse
    {
        Gate::authorize('seo.view');

        $tenantId = currentTenant()->id;

        $contents = SeoContent::query()
            ->where('tenant_id', $tenantId)
            ->withCount(['faqs', 'links'])
            ->orderByDesc('updated_at')
            ->get();

        $published = $contents->where('status', 'published');

        $otherDescriptions = $published
            ->filter(fn (SeoContent $c) => $c->seo_description !== null && $c->seo_description !== '')
            ->pluck('seo_description')
            ->map(fn ($d) => (string) $d)
            ->values()
            ->all();

        $scored = [];
        foreach ($published as $content) {
            $content->seoScore = $this->scoreService->score(
                $content,
                $otherDescriptions,
                (int) $content->faqs_count,
                (int) $content->links_count,
            );
            $scored[] = $content;
        }

        $scoreBuckets = ['excellent' => 0, 'good' => 0, 'fair' => 0, 'poor' => 0];
        foreach ($scored as $content) {
            $scoreBuckets[$content->seoScore['health']]++;
        }

        $issues = [
            'weakTitles' => $contents
                ->filter(fn (SeoContent $c) => $c->seo_title === null || trim((string) $c->seo_title) === '')
                ->values()
                ->take(10)
                ->map(fn (SeoContent $c) => $this->brief($c)),
            'weakDescriptions' => $contents
                ->filter(fn (SeoContent $c) => $c->seo_description === null || trim((string) $c->seo_description) === '')
                ->values()
                ->take(10)
                ->map(fn (SeoContent $c) => $this->brief($c)),
            'duplicateDescriptions' => $published
                ->groupBy(fn (SeoContent $c) => (string) $c->seo_description)
                ->filter(fn ($group) => $group->count() > 1)
                ->values()
                ->map(fn ($group) => [
                    'description' => (string) $group->first()?->seo_description,
                    'count' => $group->count(),
                    'contents' => $group->take(5)->map(fn (SeoContent $c) => $this->brief($c)),
                ])
                ->values()
                ->take(10),
            'needsAttention' => collect($scored)
                ->sortBy(fn (SeoContent $c) => $c->seoScore['score'])
                ->take(10)
                ->values()
                ->map(fn (SeoContent $c) => [
                    'id' => (string) $c->id,
                    'title' => $c->title,
                    'status' => $c->status,
                    'slug' => $c->slug,
                    'updatedAt' => $c->updated_at?->toISOString(),
                    'score' => $c->seoScore['score'],
                    'health' => $c->seoScore['health'],
                    'critical' => $c->seoScore['critical'],
                    'warning' => $c->seoScore['warning'],
                ]),
        ];

        $averageScore = $scored === []
            ? null
            : (int) round(collect($scored)->avg(fn (SeoContent $c) => $c->seoScore['score']));

        return response()->json([
            'data' => [
                'summary' => [
                    'totalContents' => $contents->count(),
                    'published' => $published->count(),
                    'draft' => $contents->where('status', 'draft')->count(),
                    'review' => $contents->where('status', 'review')->count(),
                    'archived' => $contents->where('status', 'archived')->count(),
                    'averageScore' => $averageScore,
                    'health' => $averageScore === null ? null : $this->scoreService->healthLabel($averageScore),
                ],
                'typeBreakdown' => $contents
                    ->groupBy('content_type')
                    ->map(fn ($group) => $group->count())
                    ->sortDesc(),
                'scoreDistribution' => $scoreBuckets,
                'issues' => $issues,
                'resourceStats' => [
                    'keywords' => SeoKeyword::query()->where('tenant_id', $tenantId)->count(),
                    'faqs' => SeoFaq::query()->where('tenant_id', $tenantId)->count(),
                    'internalLinks' => SeoContentLink::query()->where('tenant_id', $tenantId)->count(),
                    'revisions' => SeoRevision::query()->where('tenant_id', $tenantId)->count(),
                ],
                'searchConsole' => [
                    'connected' => false,
                    'note' => 'غير متصلة — يتم عرض الإحصائيات الواقعية من بيانات المحتوى فقط.',
                ],
                'recentActivity' => $contents->take(8)->map(fn (SeoContent $c) => $this->brief($c)),
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function brief(SeoContent $content): array
    {
        return [
            'id' => (string) $content->id,
            'title' => $content->title,
            'contentType' => $content->content_type,
            'status' => $content->status,
            'slug' => $content->slug,
            'seoTitle' => $content->seo_title,
            'seoDescription' => $content->seo_description,
            'updatedAt' => $content->updated_at?->toISOString(),
            'publishedAt' => $content->published_at?->toISOString(),
        ];
    }
}
