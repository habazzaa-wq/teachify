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
        $heroValues = is_array($values['hero'] ?? null) ? $values['hero'] : [];
        $socialValues = is_array($heroValues['socialLinks'] ?? null) ? $heroValues['socialLinks'] : [];
        $iconValues = is_array($heroValues['icons'] ?? null) ? $heroValues['icons'] : [];

        // The public home page must identify the app by its exact tenant name
        // and be usable without logging in. Google's OAuth consent-screen
        // review reads this visible copy, so keep the fallback brand-accurate.
        // A null/unset value means "not edited yet" and uses this fallback; an
        // explicitly saved empty string is a deliberate clear and stays empty.
        $tenantName = trim((string) (currentTenant()->name ?? '')) ?: 'منصتنا';

        $hero = [
            'title' => $this->valueOrFallback(
                $heroValues,
                'title',
                "مرحباً بكم في {$tenantName}",
            ),
            'subtitle' => $this->valueOrFallback(
                $heroValues,
                'subtitle',
                "منصة {$tenantName} التعليمية — تصفّح المراحل والكورسات والمحتوى التعليمي دون تسجيل الدخول.",
            ),
            'teacherImage' => $this->normalizeTeacherImage(
                $this->valueOrFallback($heroValues, 'teacherImage', ''),
                $this->cdnBaseUrl($tenantId)
            ),
            'teacherName' => $this->valueOrFallback($heroValues, 'teacherName', ''),
            'badge1Text' => $this->valueOrFallback($heroValues, 'badge1Text', 'معلم محترف'),
            'badge2Text' => $this->valueOrFallback($heroValues, 'badge2Text', ''),
            'isActive' => (bool) ($heroValues['isActive'] ?? true),
            'bgStyle' => $this->valueOrFallback($heroValues, 'bgStyle', 'math'),
            'socialLinks' => [
                'facebook' => $this->valueOrFallback($socialValues, 'facebook', ''),
                'youtube' => $this->valueOrFallback($socialValues, 'youtube', ''),
                'phone' => $this->valueOrFallback($socialValues, 'phone', ''),
                'whatsapp' => $this->valueOrFallback($socialValues, 'whatsapp', ''),
            ],
            'icons' => [
                'gifts' => $this->iconConfig($iconValues, 'gifts', 'الهدايا'),
                'facebook' => $this->iconConfig($iconValues, 'facebook', 'فيس بوك'),
                'chat' => $this->iconConfig($iconValues, 'chat', 'محادثة مباشرة'),
                'youtube' => $this->iconConfig($iconValues, 'youtube', 'يوتيوب'),
                'bestStudents' => $this->iconConfig($iconValues, 'bestStudents', 'أفضل الطلاب'),
                'phone' => $this->iconConfig($iconValues, 'phone', 'رقم الهاتف'),
            ],
        ];

        return response()->json(['hero' => $hero]);
    }

    /**
     * A null/unset value means the tenant has not edited this field yet, so
     * the brand-accurate fallback applies. An explicitly saved empty string is
     * data: the admin deliberately cleared the field and it must stay clear.
     *
     * @param  array<string, mixed>  $values
     */
    private function valueOrFallback(array $values, string $key, string $fallback): string
    {
        if (! array_key_exists($key, $values) || $values[$key] === null) {
            return $fallback;
        }

        $value = $values[$key];

        return is_string($value) || is_numeric($value) ? (string) $value : $fallback;
    }

    /**
     * @param  array<string, mixed>  $icons
     * @return array{label: string, visible: bool}
     */
    private function iconConfig(array $icons, string $key, string $defaultLabel): array
    {
        $config = is_array($icons[$key] ?? null) ? $icons[$key] : [];

        return [
            'label' => $this->valueOrFallback($config, 'label', $defaultLabel),
            'visible' => (bool) ($config['visible'] ?? true),
        ];
    }

    /**
     * The browser must always be able to fetch the teacher photo with a plain
     * <img src="...">. Stored values can be absolute CDN URLs (http/https)
     * that clients cannot reach directly (mixed content, expired certificates,
     * signed-token expiry, hotlink protection) — so rewrite anything that
     * points at the tenant's media storage back to the same-origin HTTPS
     * media proxy, which streams through the backend credentials and works on
     * every browser and device.
     */
    private function normalizeTeacherImage(string $url, ?string $cdnBaseUrl): string
    {
        $trimmed = trim($url);

        if ($trimmed === '' || str_starts_with($trimmed, '/')) {
            return $trimmed;
        }

        if (! preg_match('#^[a-z][a-z0-9+.\-]*://#i', $trimmed)) {
            return $trimmed;
        }

        $host = strtolower((string) parse_url($trimmed, PHP_URL_HOST));
        if ($host === '') {
            return $trimmed;
        }

        $path = (string) parse_url($trimmed, PHP_URL_PATH);

        // Already a platform route (media proxy or local storage) expressed as
        // an absolute URL on any host — collapse it back to the relative path
        // so the browser fetches it from the current origin.
        if (str_starts_with($path, '/api/') || str_starts_with($path, '/storage/')) {
            return $path;
        }

        // Recognize the tenant CDN host and any Bunny edge/storage host so the
        // value is remapped regardless of how it was originally saved.
        $knownHosts = [
            $this->hostWithoutScheme($cdnBaseUrl),
            // platform-wide pull-zone host
            $this->platformCdnHost(),
        ];

        $isBunny = str_ends_with($host, '.b-cdn.net')
            || str_ends_with($host, '.bunnycdn.com')
            || in_array($host, array_filter($knownHosts), true);

        if (! $isBunny) {
            return $trimmed;
        }

        $key = ltrim(urldecode($path), '/');

        if ($key !== '') {
            return '/api/v1/media/serve/'.$key;
        }

        return $trimmed;
    }

    private function hostWithoutScheme(?string $url): ?string
    {
        if ($url === null || $url === '') {
            return null;
        }

        $host = parse_url($url, PHP_URL_HOST);

        return is_string($host) ? strtolower($host) : null;
    }

    private function platformCdnHost(): ?string
    {
        try {
            $platform = \App\Models\PlatformBunnySetting::active();
        } catch (\Throwable) {
            return null;
        }

        return $this->hostWithoutScheme($platform?->cdn_hostname);
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
