<?php

namespace App\Http\Resources;

use App\Models\MediaAsset;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SeoSettingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'tenantId' => (string) $this->tenant_id,
            'defaultTitleTemplate' => $this->default_title_template,
            'defaultDescription' => $this->default_description,
            'defaultOgImage' => $this->imageData($this->defaultOgImage),
            'defaultTwitterImage' => $this->imageData($this->defaultTwitterImage),
            'defaultRobotsPolicy' => $this->default_robots_policy,
            'sitemapIncludeDefault' => (bool) $this->sitemap_include_default,
            'organizationName' => $this->organization_name,
            'organizationDescription' => $this->organization_description,
            'socialProfiles' => $this->social_profiles ?? [],
            'homepageTitle' => $this->homepage_title,
            'homepageDescription' => $this->homepage_description,
            'googleVerification' => $this->google_verification,
            'bingVerification' => $this->bing_verification,
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }

    private function imageData(?MediaAsset $asset): ?array
    {
        if ($asset === null) {
            return null;
        }

        return [
            'id' => (string) $asset->id,
            'url' => $asset->cdn_url ?? $asset->thumbnail_url ?? $asset->preview_url,
            'width' => $asset->width,
            'height' => $asset->height,
            'mimeType' => $asset->mime_type,
        ];
    }
}
