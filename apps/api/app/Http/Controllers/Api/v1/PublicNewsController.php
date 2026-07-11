<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\News;
use App\Models\TenantSetting;
use Illuminate\Http\JsonResponse;

class PublicNewsController extends Controller
{
    public function index(): JsonResponse
    {
        $tenantId = currentTenant()->id;

        $items = News::query()
            ->where('tenant_id', $tenantId)
            ->active()
            ->orderBy('sort_order')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'title', 'url'])
            ->map(fn (News $news) => [
                'id' => $news->id,
                'title' => $news->title,
                'url' => $news->url,
            ]);

        $setting = TenantSetting::query()
            ->where('tenant_id', $tenantId)
            ->where('group', 'homepage')
            ->first();

        $values = $setting?->values ?? [];

        $ticker = [
            'enabled' => $values['ticker']['enabled'] ?? true,
            'direction' => $values['ticker']['direction'] ?? 'rtl',
            'speed' => $values['ticker']['speed'] ?? 60,
            'position' => $values['ticker']['position'] ?? 'top',
            'showIcon' => $values['ticker']['showIcon'] ?? true,
            'label' => $values['ticker']['label'] ?? 'أحدث الأخبار',
            'bgColor' => $values['ticker']['bgColor'] ?? null,
            'textColor' => $values['ticker']['textColor'] ?? null,
            'accentColor' => $values['ticker']['accentColor'] ?? null,
        ];

        $hero = [
            'title' => $values['hero']['title'] ?? 'مرحباً بكم',
            'subtitle' => $values['hero']['subtitle'] ?? '',
            'teacherImage' => $values['hero']['teacherImage'] ?? '',
            'teacherName' => $values['hero']['teacherName'] ?? '',
            'badge1Text' => $values['hero']['badge1Text'] ?? 'معلم محترف',
            'badge2Text' => $values['hero']['badge2Text'] ?? '',
            'isActive' => $values['hero']['isActive'] ?? true,
            'socialLinks' => [
                'facebook' => $values['hero']['socialLinks']['facebook'] ?? '',
                'youtube' => $values['hero']['socialLinks']['youtube'] ?? '',
                'phone' => $values['hero']['socialLinks']['phone'] ?? '',
            ],
        ];

        return response()->json([
            'items' => $items,
            'ticker' => $ticker,
            'hero' => $hero,
        ]);
    }
}
