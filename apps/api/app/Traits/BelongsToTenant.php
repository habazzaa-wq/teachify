<?php

namespace App\Traits;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;

trait BelongsToTenant
{
    /**
     * Boot the trait.
     */
    protected static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope());

        static::creating(function (Model $model) {
            $model->tenant_id = \currentTenant()->id;
        });
    }
}
