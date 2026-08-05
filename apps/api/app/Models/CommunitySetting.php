<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunitySetting extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'is_enabled',
        'exam_protection_enabled',
        'xp_enabled',
        'profanity_filter_enabled',
        'auto_moderation_enabled',
        'message_cooldown_seconds',
        'flood_limit',
        'flood_window_seconds',
        'edit_window_minutes',
        'duplicate_window_seconds',
        'attachment_max_mb',
        'allowed_attachment_types',
        'config',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'exam_protection_enabled' => 'boolean',
            'xp_enabled' => 'boolean',
            'profanity_filter_enabled' => 'boolean',
            'auto_moderation_enabled' => 'boolean',
            'message_cooldown_seconds' => 'integer',
            'flood_limit' => 'integer',
            'flood_window_seconds' => 'integer',
            'edit_window_minutes' => 'integer',
            'duplicate_window_seconds' => 'integer',
            'attachment_max_mb' => 'integer',
            'allowed_attachment_types' => 'array',
            'config' => 'array',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function isEnabled(): bool
    {
        return $this->is_enabled;
    }

    public static function defaultSettings(): array
    {
        return [
            'is_enabled' => true,
            'exam_protection_enabled' => true,
            'xp_enabled' => true,
            'profanity_filter_enabled' => true,
            'auto_moderation_enabled' => true,
            'message_cooldown_seconds' => 5,
            'flood_limit' => 5,
            'flood_window_seconds' => 10,
            'edit_window_minutes' => 5,
            'duplicate_window_seconds' => 30,
            'attachment_max_mb' => 25,
            'allowed_attachment_types' => ['image', 'file', 'pdf', 'voice', 'video', 'code'],
            'config' => [],
        ];
    }
}
