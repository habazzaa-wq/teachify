<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MediaLibraryMetricsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'totalAssets' => $this['total_assets'] ?? 0,
            'totalSize' => $this['total_size'] ?? 0,
            'videos' => $this['videos'] ?? 0,
            'images' => $this['images'] ?? 0,
            'documents' => $this['documents'] ?? 0,
            'audio' => $this['audio'] ?? 0,
            'archived' => $this['archived'] ?? 0,
            'processing' => $this['processing'] ?? 0,
            'favorites' => $this['favorites'] ?? 0,
            'recentUploads' => $this['recent_uploads'] ?? 0,
            'storageUsed' => $this['storage_used'] ?? 0,
            'storageRemaining' => $this['storage_remaining'] ?? 0,
            'storageTotal' => $this['storage_total'] ?? 0,
            'usagePercent' => $this['usage_percent'] ?? 0,
        ];
    }
}
