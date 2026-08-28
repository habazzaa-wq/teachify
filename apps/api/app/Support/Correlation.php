<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Request / job correlation identifier helper.
 *
 * The id is stored in the container under "correlation_id" so it is available
 * to logs, the response header, and queued jobs (injected into the job payload
 * at dispatch time). A Request object is never serialized.
 */
class Correlation
{
    public const CONTAINER_KEY = 'correlation_id';

    public static function id(): ?string
    {
        return app()->bound(self::CONTAINER_KEY)
            ? app(self::CONTAINER_KEY)
            : null;
    }

    public static function set(?string $id): void
    {
        if ($id === null) {
            app()->forgetInstance(self::CONTAINER_KEY);

            return;
        }

        app()->instance(self::CONTAINER_KEY, $id);
    }

    public static function generate(): string
    {
        return 'req_' . Str::uuid()->toString();
    }

    public static function generateForJob(): string
    {
        return 'job_' . Str::uuid()->toString();
    }
}
