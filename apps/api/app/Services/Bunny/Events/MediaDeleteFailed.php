<?php

namespace App\Services\Bunny\Events;

use App\Models\MediaAsset;

class MediaDeleteFailed
{
    public function __construct(
        public readonly MediaAsset $asset,
        public readonly int $tenantId,
        public readonly string $provider,
        public readonly string $providerService,
        public readonly string $errorMessage,
        public readonly ?int $errorCode = null,
    ) {}
}
