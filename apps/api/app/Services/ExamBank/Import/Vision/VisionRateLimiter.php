<?php

namespace App\Services\ExamBank\Import\Vision;

use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

final class VisionRateLimiter
{
    public function check(int $tenantId): void
    {
        $dailyLimit = max(1, (int) config('question-import.vision.daily_limit', 50));
        $rateLimit = max(1, (int) config('question-import.vision.rate_limit', 10));

        $dailyKey = "vision_daily:{$tenantId}:" . now()->format('Y-m-d');
        $dailyCount = (int) Cache::get($dailyKey, 0);
        if ($dailyCount >= $dailyLimit) {
            throw ValidationException::withMessages([
                'file' => ['تم الوصول إلى الحد اليومي للاستخراج البصري (' . $dailyLimit . ' طلب). حاول غداً أو استخدم النمط المحلي.'],
            ]);
        }

        $rateKey = "vision_rate:{$tenantId}";
        $attempts = (int) Cache::get($rateKey, 0);
        if ($attempts >= $rateLimit) {
            throw ValidationException::withMessages([
                'file' => ['عدد طلبات الاستخراج البصري كثير جداً. انتظر دقيقة ثم حاول مجدداً.'],
            ]);
        }
    }

    public function hit(int $tenantId): void
    {
        $dailyKey = "vision_daily:{$tenantId}:" . now()->format('Y-m-d');
        $rateKey = "vision_rate:{$tenantId}";

        Cache::put($dailyKey, (int) Cache::get($dailyKey, 0) + 1, now()->endOfDay());
        $count = (int) Cache::get($rateKey, 0) + 1;
        Cache::put($rateKey, $count, now()->addMinute());
    }
}
