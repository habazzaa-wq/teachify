<?php

namespace App\Services\Community;

use App\Models\CommunityMessage;
use App\Models\CommunitySetting;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Validation\ValidationException;

class CommunityAntiSpamService
{
    public const URL_PATTERN = '/https?:\/\/[^\s<>]+/i';

    /**
     * A small baseline profanity list; tenants can extend it via settings config.
     *
     * @var list<string>
     */
    private const DEFAULT_BLOCKED_WORDS = [
        'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'nigger', 'nigga',
        'cunt', 'slut', 'whore', 'dick', 'pussy', 'faggot', 'retard',
    ];

    public function __construct(
        private readonly CommunitySettingService $settings,
    ) {}

    /**
     * Validate that a new message from the member is allowed: cooldown,
     * flood protection, duplicates, links and profanity.
     *
     * @throws ValidationException
     */
    public function assertMessageAllowed(Tenant $tenant, TenantUser $member, string $body): void
    {
        $settings = $this->settings->forTenant($tenant);
        $text = trim($body);

        if ($text === '') {
            throw ValidationException::withMessages([
                'body' => ['The message body is required.'],
            ]);
        }

        $this->assertCooldown($tenant, $member, $settings);
        $this->assertFlood($tenant, $member, $settings);
        $this->assertDuplicate($tenant, $member, $text, $settings);

        if ($settings->profanity_filter_enabled) {
            $this->assertNoProfanity($text, $settings);
        }

        $this->assertLinksAllowed($text, $settings);
    }

    /**
     * @throws ValidationException
     */
    private function assertCooldown(Tenant $tenant, TenantUser $member, CommunitySetting $settings): void
    {
        $last = CommunityMessage::query()
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $member->id)
            ->latest('id')
            ->first();

        if ($last === null || $settings->message_cooldown_seconds <= 0) {
            return;
        }

        $elapsed = now()->getTimestamp() - $last->created_at->getTimestamp();

        if ($elapsed < $settings->message_cooldown_seconds) {
            throw ValidationException::withMessages([
                'body' => ['You are sending messages too quickly. Please wait a moment.'],
            ]);
        }
    }

    /**
     * @throws ValidationException
     */
    private function assertFlood(Tenant $tenant, TenantUser $member, CommunitySetting $settings): void
    {
        if ($settings->flood_limit <= 0 || $settings->flood_window_seconds <= 0) {
            return;
        }

        $window = now()->subSeconds($settings->flood_window_seconds);
        $count = CommunityMessage::query()
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $member->id)
            ->where('status', 'active')
            ->where('created_at', '>=', $window)
            ->count();

        if ($count >= $settings->flood_limit) {
            throw ValidationException::withMessages([
                'body' => ['You have sent too many messages in a short period.'],
            ]);
        }
    }

    /**
     * @throws ValidationException
     */
    private function assertDuplicate(Tenant $tenant, TenantUser $member, string $text, CommunitySetting $settings): void
    {
        if ($settings->duplicate_window_seconds <= 0) {
            return;
        }

        $window = now()->subSeconds($settings->duplicate_window_seconds);
        $exists = CommunityMessage::query()
            ->where('tenant_id', $tenant->id)
            ->where('tenant_user_id', $member->id)
            ->where('body_text', $text)
            ->where('created_at', '>=', $window)
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'body' => ['You already sent this message recently.'],
            ]);
        }
    }

    /**
     * @throws ValidationException
     */
    private function assertNoProfanity(string $text, CommunitySetting $settings): void
    {
        $blocked = $this->blockedWords($settings);

        if ($blocked === []) {
            return;
        }

        $normalized = mb_strtolower($text);
        $words = preg_split('/[^a-z\x{0400}-\x{04FF}\x{0600}-\x{06FF}]+/u', $normalized) ?: [];

        foreach ($words as $word) {
            if (in_array($word, $blocked, true)) {
                throw ValidationException::withMessages([
                    'body' => ['Your message contains inappropriate language.'],
                ]);
            }
        }
    }

    /**
     * @throws ValidationException
     */
    private function assertLinksAllowed(string $text, CommunitySetting $settings): void
    {
        if ($settings->auto_moderation_enabled === false) {
            return;
        }

        if (! preg_match(self::URL_PATTERN, $text)) {
            return;
        }

        $allowed = $settings->config['allowed_domains'] ?? ['youtube.com', 'youtu.be', 'drive.google.com', 'docs.google.com', 'github.com'];

        preg_match_all(self::URL_PATTERN, $text, $matches);
        $urls = $matches[0] ?? [];

        foreach ($urls as $url) {
            $host = strtolower(parse_url($url, PHP_URL_HOST) ?? $url);

            $permitted = collect($allowed)->contains(
                fn (string $domain) => $host === $domain || str_ends_with($host, '.'.$domain),
            );

            if (! $permitted) {
                throw ValidationException::withMessages([
                    'body' => ['External links are not allowed in this community.'],
                ]);
            }
        }
    }

    /**
     * @return list<string>
     */
    private function blockedWords(CommunitySetting $settings): array
    {
        $extra = $settings->config['blocked_words'] ?? [];

        return array_values(array_unique(array_merge(self::DEFAULT_BLOCKED_WORDS, $extra)));
    }
}
