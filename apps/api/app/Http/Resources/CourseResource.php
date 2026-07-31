<?php

namespace App\Http\Resources;

use App\Models\PlatformBunnySetting;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseResource extends JsonResource
{
    private static ?string $cdnBaseUrl = null;

    public function toArray(Request $request): array
    {
        $primaryInstructor = $this->primaryInstructor;

        return [
            'id' => (string) $this->id,
            'tenantId' => (string) $this->tenant_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'subtitle' => $this->subtitle,
            'shortDescription' => $this->short_description,
            'description' => $this->description,
            'fullDescription' => $this->full_description,
            'thumbnail' => $this->proxyUrl($this->thumbnail_path),
            'coverImage' => $this->proxyUrl($this->cover_image_path),
            'status' => $this->status,
            'visibility' => $this->visibility,
            'difficulty' => $this->difficulty,
            'language' => $this->language,
            'duration' => $this->duration,
            'pricingType' => $this->pricing_type,
            'price' => $this->price_amount,
            'currency' => $this->price_currency,
            'discountPrice' => $this->discount_price,
            'enrollmentLimit' => $this->enrollment_limit,
            'startDate' => $this->start_date?->toIso8601String(),
            'endDate' => $this->end_date?->toIso8601String(),
            'certificateEnabled' => $this->certificate_enabled,
            'featured' => $this->featured,
            'seo' => [
                'title' => $this->seo_title,
                'description' => $this->seo_description,
                'keywords' => $this->seo_keywords,
            ],
            'tags' => $this->tags->map(fn ($t) => [
                'id' => (string) $t->id,
                'name' => $t->name,
                'slug' => $t->slug,
            ]),
            'requirements' => $this->requirements ?? [],
            'learningOutcomes' => $this->learning_outcomes ?? [],
            'targetAudience' => $this->target_audience ?? [],
            'instructor' => $primaryInstructor ? [
                'id' => (string) $primaryInstructor->id,
                'name' => $primaryInstructor->user?->name,
                'avatar' => $primaryInstructor->avatar ?? $primaryInstructor->user?->avatar,
            ] : null,
            'educationalStage' => $this->educationalStage ? [
                'id' => (string) $this->educationalStage->id,
                'name' => $this->educationalStage->name,
            ] : null,
            'subject' => $this->subject ? [
                'id' => (string) $this->subject->id,
                'name' => $this->subject->name,
            ] : null,
            'category' => $this->categories->first() ? [
                'id' => (string) $this->categories->first()->id,
                'name' => $this->categories->first()->name,
                'slug' => $this->categories->first()->slug,
            ] : null,
            'studentsCount' => $this->enrollments_count ?? $this->enrollments()->count(),
            'sectionsCount' => $this->sections_count ?? $this->sections()->count(),
            'lessonsCount' => $this->lessons_count ?? $this->lessons()->count(),
            'publishedAt' => $this->published_at?->toIso8601String(),
            'archivedAt' => $this->archived_at?->toIso8601String(),
            'createdAt' => $this->created_at->toIso8601String(),
            'updatedAt' => $this->updated_at->toIso8601String(),
        ];
    }

    private function proxyUrl(?string $url): ?string
    {
        if (! $url) {
            return null;
        }

        $cdnBase = self::$cdnBaseUrl ??= self::resolveCdnBaseUrl();

        if ($cdnBase && str_starts_with($url, $cdnBase)) {
            $storagePath = substr($url, strlen($cdnBase) + 1);

            return route('media.serve', $storagePath);
        }

        return $url;
    }

    private static function resolveCdnBaseUrl(): ?string
    {
        $settings = PlatformBunnySetting::active();

        if (! $settings) {
            return null;
        }

        $config = $settings->toProviderConfig('storage');

        return rtrim((string) ($config['cdn_base_url'] ?? ''), '/');
    }
}
