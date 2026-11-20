<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TenantService extends Model
{
    protected $fillable = ['tenant_id', 'title', 'image_url', 'summary', 'description', 'highlights', 'contact_name', 'contact_phone', 'instructor_tenant_user_id', 'sort_order', 'is_published'];

    protected function casts(): array
    {
        return ['highlights' => 'array', 'is_published' => 'boolean'];
    }
}
