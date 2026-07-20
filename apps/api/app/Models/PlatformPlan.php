<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformPlan extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'badge',
        'monthly_price',
        'yearly_price',
        'currency',
        'display_order',
        'trial_enabled',
        'trial_days',
        'recommended',
        'visible',
        'status',
        'limits',
        'features',
        'video_storage',
        'branding',
        'integrations',
    ];

    protected function casts(): array
    {
        return [
            'monthly_price' => 'decimal:2',
            'yearly_price' => 'decimal:2',
            'display_order' => 'integer',
            'trial_enabled' => 'boolean',
            'trial_days' => 'integer',
            'recommended' => 'boolean',
            'visible' => 'boolean',
            'limits' => 'array',
            'features' => 'array',
            'video_storage' => 'array',
            'branding' => 'array',
            'integrations' => 'array',
        ];
    }
}
