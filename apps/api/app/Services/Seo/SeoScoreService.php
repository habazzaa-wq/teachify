<?php

namespace App\Services\Seo;

use App\Models\SeoContent;
use Illuminate\Support\Str;

/**
 * Deterministic "SEO Health Score" (0–100).
 *
 * This is a content-optimization heuristic — NOT a stand-in for Google's real
 * ranking algorithm and never claims to be. Each check maps to a weighted
 * contribution and a category (critical / warning / good).
 */
class SeoScoreService
{
    public const MAX_SCORE = 100;

    /**
     * @param list<string> $otherDescriptions  other visible descriptions used
     *                                         to detect duplicate meta descriptions
     */
    public function score(
        SeoContent $content,
        array $otherDescriptions = [],
        int $faqCount = 0,
        int $internalLinkCount = 0,
    ): array {
        $focus = trim((string) $content->focus_keyword);
        $title = trim((string) ($content->seo_title ?: $content->title));
        $description = trim((string) $content->seo_description);
        $slug = trim((string) $content->slug);
        $body = $this->plainText($content);
        $canonical = trim((string) $content->canonical_url);

        $checks = [];
        $score = 0.0;
        $critical = 0;
        $warning = 0;

        $run = function (string $key, string $label, float $weight, bool $pass, string $category = 'warning') use (&$checks, &$score, &$critical, &$warning) {
            $checks[] = [
                'key' => $key,
                'label' => $label,
                'status' => $pass ? 'good' : $category,
                'pass' => $pass,
                'weight' => $weight,
            ];
            if ($pass) {
                $score += $weight;
            } elseif ($category === 'critical') {
                $critical++;
            } else {
                $warning++;
            }
        };

        // ── Title ───────────────────────────────────────────────────────────
        $run('title.exists', 'العنوان مكتوب', 10, $title !== '', 'critical');
        $len = mb_strlen($title);
        $run('title.length', 'طول العنوان مناسب (30–60 حرفًا)', 8, $len === 0 || ($len >= 30 && $len <= 60));
        $run('title.keyword', 'الكلمة المفتاحية في العنوان', 7, $focus === '' || mb_stripos($title, $focus) !== false);

        // ── Description ─────────────────────────────────────────────────────
        $run('description.exists', 'الوصف التعريفي مكتوب', 10, $description !== '', 'critical');
        $dlen = mb_strlen($description);
        $run('description.length', 'طول الوصف مناسب (50–160 حرفًا)', 8, $dlen === 0 || ($dlen >= 50 && $dlen <= 160));
        $run('description.unique', 'الوصف غير مكرر عن صفحات أخرى', 3, $description === '' || ! in_array($description, $otherDescriptions, true), 'critical');

        // ── Slug ────────────────────────────────────────────────────────────
        $readable = $slug !== '' && ! preg_match('/\s|_/', $slug);
        $run('slug.readable', 'الرابط (Slug) مقروء وواضح', 5, $readable, 'critical');
        $run('slug.params', 'الرابط بلا معاملات غير ضرورية', 2, $slug !== '' && ! str_contains($slug, '?') && ! str_contains($slug, '&'));
        $run('slug.stable', 'الرابط مستقر (لا يحتوي أحرفًا خاصة)', 3, $slug !== '' && ! preg_match('/[%\?\&=+]/', $slug));

        // ── Content ─────────────────────────────────────────────────────────
        $contentLength = mb_strlen(trim($body));
        $run('content.sufficient', 'محتوى كافٍ (300+ حرف)', 8, $contentLength >= 300, 'critical');
        $run('content.structure', 'بنية عناوين H2/H3 موجودة', 5, $this->hasHeadingStructure($content));
        $run('content.lists', 'قوائم وفقرات تسهّل القراءة', 4, $contentLength >= 300 && ($this->hasLists($content) || mb_substr_count($body, "\n") >= 3));

        // ── Images ──────────────────────────────────────────────────────────
        $run('image.featured', 'صورة مميزة مرفوعة', 5, $content->featured_image_asset_id !== null);
        $run('image.alt', 'النص البديل للصور مكتوب', 3, $this->imagesHaveAlt($content));
        $run('image.og', 'صورة المشاركة (OG) موجودة', 5, $content->og_image_asset_id !== null, 'critical');

        // ── Internal linking ────────────────────────────────────────────────
        $run('links.internal', 'يوجد رابط داخلي ذو صلة', 5, $internalLinkCount > 0);

        // ── Structured data ─────────────────────────────────────────────────
        $run('schema.supported', 'نوع البيانات المنظّمة مدعوم', 4, $content->structured_data_type !== 'none' && $content->structured_data_type !== '');

        // ── Canonical ───────────────────────────────────────────────────────
        $canonicalSafe = $canonical === '' || app(SeoCanonicalGuard::class)->isSafe($canonical);
        $run('canonical.valid', 'الرابط الأساسي (Canonical) صالح وآمن داخل النطاق', 5, $canonicalSafe, 'critical');

        // ── Indexability ────────────────────────────────────────────────────
        $indexableCombination = $content->isPublished() ? $content->indexable : true;
        $run('indexable.valid', 'توافق الحالة مع سياسة الفهرسة', 5, $indexableCombination, 'critical');

        // ── FAQ ─────────────────────────────────────────────────────────────
        $run('faq.present', 'أسئلة شائعة (FAQ) مضافة', 3, $faqCount > 0);

        return [
            'score' => (int) round(min($score, self::MAX_SCORE)),
            'max_score' => self::MAX_SCORE,
            'checks' => $checks,
            'critical' => $critical,
            'warning' => $warning,
            'good' => count($checks) - $critical - $warning,
            'health' => $this->healthLabel((int) round(min($score, self::MAX_SCORE))),
        ];
    }

    public function healthLabel(int $score): string
    {
        if ($score >= 85) {
            return 'excellent';
        }
        if ($score >= 65) {
            return 'good';
        }
        if ($score >= 45) {
            return 'fair';
        }
        return 'poor';
    }

    // ── Analysis helpers ────────────────────────────────────────────────────

    private function plainText(SeoContent $content): string
    {
        $raw = (string) $content->content;
        if ($raw === '') {
            return '';
        }
        if (($content->content_format ?? 'markdown') === 'html') {
            $text = preg_replace('/<[^>]*>/', ' ', $raw) ?? '';
            return html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }
        return $raw;
    }

    private function hasHeadingStructure(SeoContent $content): bool
    {
        $raw = (string) $content->content;
        if (($content->content_format ?? 'markdown') === 'html') {
            return preg_match('/<h2[\s>]|<h3[\s>]/i', $raw) === 1;
        }
        return preg_match('/^#{2,3}\s/m', $raw) === 1;
    }

    private function hasLists(SeoContent $content): bool
    {
        $raw = (string) $content->content;
        if (($content->content_format ?? 'markdown') === 'html') {
            return preg_match('/<ul[\s>]|<ol[\s>]/i', $raw) === 1;
        }
        return preg_match('/^(\s*[-*+]\s|\s*\d+\.\s)/m', $raw) === 1;
    }

    private function imagesHaveAlt(SeoContent $content): bool
    {
        $raw = (string) $content->content;
        if (($content->content_format ?? 'markdown') === 'html') {
            return preg_match('/<img[^>]+alt=["\'][^"\']+["\']/i', $raw) === 1;
        }
        return preg_match('/!\[[^\]]+\]/', $raw) === 1;
    }
}
