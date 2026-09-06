<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformBranding extends Model
{
    protected $table = 'platform_branding';

    protected $fillable = [
        'tenant_id',
        'name',
        'logo',
        'favicon',
        'primary_color',
        'secondary_color',
        'accent_color',
        'font',
        'logo_type',
        'logo_icon',
        'logo_image',
        'dark_logo',
        'light_logo',
    ];
}
