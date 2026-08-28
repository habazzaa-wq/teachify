<?php

namespace App\Providers;

use App\Observability\SlowQueryLogger;
use App\Support\Correlation;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\ServiceProvider;

/**
 * Wires framework-native observability:
 *
 *  - slow query logging (configurable threshold, bindings never logged)
 *  - correlation id injection into every queued job payload so it survives
 *    the trip to the worker (background jobs get an independent id from
 *    SetCorrelationContext)
 */
class ObservabilityServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Slow query logging. The SQL keeps its "?" placeholders so secrets /
        // personal data in bindings stay out of the logs.
        DB::listen(function (QueryExecuted $event): void {
            app(SlowQueryLogger::class)($event);
        });

        // Inject the current request correlation id into every queued job
        // payload. Jobs dispatched outside a request (scheduled / background)
        // carry no id here and get an independent one from SetCorrelationContext.
        Queue::createPayloadUsing(function () {
            $id = Correlation::id();

            return $id === null ? [] : ['correlation_id' => $id];
        });
    }
}
