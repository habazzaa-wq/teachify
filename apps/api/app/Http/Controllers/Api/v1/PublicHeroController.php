<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\TenantSetting;
use App\Services\Media\Providers\BunnyStorageProvider;
use Illuminate\Http\JsonResponse;

class PublicHeroController extends Controller
{
    public function index(): JsonResponse
    {
        $tenantId = currentTenant()->id;

        $setting = TenantSetting::query()
            ->where('tenant_id', $tenantId)
            ->where('group', 'homepage')
            ->first();

        $values = $setting?->values ?? [];

        $hero = [
            'title' => $values['hero']['title'] ?? 'مرحباً بكم',
            'subtitle' => $values['hero']['subtitle'] ?? '',
            'teacherImage' => $this->normalizeTeacherImage(
                $values['hero']['teacherImage'] ?? '',
                $this->cdnBaseUrl($tenantId)
            ),
            'teacherName' => $values['hero']['teacherName'] ?? '',
            'badge1Text' => $values['hero']['badge1Text'] ?? 'معلم محترف',
            'badge2Text' => $values['hero']['badge2Text'] ?? '',
            'isActive' => $values['hero']['isActive'] ?? true,
            'bgStyle' => $values['hero']['bgStyle'] ?? 'math',
            'socialLinks' => [
                'facebook' => $values['hero']['socialLinks']['facebook'] ?? '',
                'youtube' => $values['hero']['socialLinks']['youtube'] ?? '',
                'phone' => $values['hero']['socialLinks']['phone'] ?? '',
                'whatsapp' => $values['hero']['socialLinks']['whatsapp'] ?? '',
            ],
            'icons' => [
                'gifts' => [
                    'label' => $values['hero']['icons']['gifts']['label'] ?? 'الهدايا',
                    'visible' => $values['hero']['icons']['gifts']['visible'] ?? true,
                ],
                'facebook' => [
                    'label' => $values['hero']['icons']['facebook']['label'] ?? 'فيس بوك',
                    'visible' => $values['hero']['icons']['facebook']['visible'] ?? true,
                ],
                'chat' => [
                    'label' => $values['hero']['icons']['chat']['label'] ?? 'محادثة مباشرة',
                    'visible' => $values['hero']['icons']['chat']['visible'] ?? true,
                ],
                'youtube' => [
                    'label' => $values['hero']['icons']['youtube']['label'] ?? 'يوتيوب',
                    'visible' => $values['hero']['icons']['youtube']['visible'] ?? true,
                ],
                'bestStudents' => [
                    'label' => $values['hero']['icons']['bestStudents']['label'] ?? 'أفضل الطلاب',
                    'visible' => $values['hero']['icons']['bestStudents']['visible'] ?? true,
                ],
                'phone' => [
                    'label' => $values['hero']['icons']['phone']['label'] ?? 'رقم الهاتف',
                    'visible' => $values['hero']['icons']['phone']['visible'] ?? true,
                ],
            ],
        ];

        return response()->json(['hero' => $hero]);
    }

    /**
     * The browser must always be able to fetch the teacher photo with a plain
     * <img src="...">. Stored values can be absolute CDN URLs (http/https)
     * that clients cannot reach directly (mixed content, expired certificates,
     * hotlink protection) — so rewrite anything pointing at the tenant CDN host
     * back to the same-origin HTTPS media proxy, which streams through the
     * backend credentials and works on every browser and device.
     */
    private function normalizeTeacherImage(string $url, ?string $cdnBaseUrl): string
    {
        $trimmed = trim($url);

        if ($trimmed === '' || str_starts_with($trimmed, '/')) {
            return $trimmed;
        }

        if ($cdnBaseUrl === null || $cdnBaseUrl === '') {
            return $trimmed;
        }

        $base = rtrim($cdnBaseUrl, '/');

        // Protocol-insensitive prefix match so http vs https variants of the
        // same CDN host are handled identically.
        $urlNoScheme = preg_replace('#^[a-z][a-z0-9+.\-]*://#i', '', $trimmed);
        $baseNoScheme = preg_replace('#^[a-z][a-z0-9+.\-]*://#i', '', $base);

        if (! is_string($urlNoScheme) || ! is_string($baseNoScheme) || $urlNoScheme === $baseNoScheme) {
            return $trimmed;
        }

        if (str_starts_with($urlNoScheme, $baseNoScheme.'/')) {
            $key = ltrim(substr($urlNoScheme, strlen($baseNoScheme)), '/');

            if ($key !== '') {
                return '/api/v1/media/serve/'.$key;
            }
        }

        return $trimmed;
    }

    private function cdnBaseUrl(int $tenantId): ?string
    {
        try {
            $config = app(BunnyStorageProvider::class)->configForTenant($tenantId);
        } catch (\Throwable) {
            return null;
        }

        $base = $config['cdn_base_url'] ?? null;

        return is_string($base) ? $base : null;
    }
}
