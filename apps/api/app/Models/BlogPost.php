<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class BlogPost extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'author_tenant_user_id',
        'title',
        'slug',
        'excerpt',
        'content',
        'cover_image_url',
        'category',
        'tags',
        'status',
        'published_at',
        'seo_title',
        'seo_description',
        'views',
    ];

    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'published_at' => 'datetime',
            'views' => 'integer',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(TenantUser::class, 'author_tenant_user_id');
    }
}
