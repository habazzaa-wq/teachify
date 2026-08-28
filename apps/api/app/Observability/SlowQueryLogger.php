<?php

namespace App\Observability;

use App\Support\Correlation;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\Log;

/**
 * Logs queries slower than the configurable threshold.
 *
 * Only metadata is logged: the SQL keeps its "?" placeholders, so bindings
 * (which may contain secrets or personal data) are never written to logs.
 */
class SlowQueryLogger
{
    public function __invoke(QueryExecuted $event): void
    {
        $threshold = (int) config('observability.slow_query_ms', 200);

        if ($threshold <= 0 || $event->time < $threshold) {
            return;
        }

        Log::warning('db.query.slow', [
            'request_id' => Correlation::id(),
            'connection' => $event->connectionName,
            'duration_ms' => (int) $event->time,
            'sql' => $event->sql,
        ]);
    }
}
